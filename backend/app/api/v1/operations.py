"""Operational routing and exposure calculations for supplied geospatial data."""

from __future__ import annotations

import math
import inspect
import json
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from pyproj import CRS, Geod, Transformer
from rasterio.features import geometry_mask
from rasterio.transform import Affine
from shapely.geometry import LineString, MultiLineString, shape, mapping
from shapely.ops import transform as transform_geometry, unary_union

from app.schemas.common import make_response

router = APIRouter(prefix="/operations", tags=["Operations"])
GEOD = Geod(ellps="WGS84")
ALLOWED_HIGHWAYS = {"trunk", "primary", "secondary", "tertiary"}
SPEED_KMH = {"trunk": 70.0, "primary": 60.0, "secondary": 45.0, "tertiary": 35.0}


class Haven(BaseModel):
    name: str
    coordinates: List[float] = Field(..., min_length=2, max_length=2, description="[longitude, latitude]")
    capacity: Optional[int] = Field(None, ge=0)


class EvacuationRouteRequest(BaseModel):
    roads: Dict[str, Any] = Field(..., description="OSM road GeoJSON FeatureCollection")
    flood_polygons: Dict[str, Any] = Field(..., description="Flood extent GeoJSON FeatureCollection")
    origin: List[float] = Field(..., min_length=2, max_length=2, description="[longitude, latitude]")
    safe_havens: List[Haven] = Field(..., min_length=1)


class BuildingLossRequest(BaseModel):
    flood_polygons: Dict[str, Any]
    buildings: Dict[str, Any] = Field(..., description="Building footprint GeoJSON FeatureCollection")
    hand_household_count: Optional[int] = Field(None, ge=1)
    average_family_size: float = Field(4.5, gt=0, le=20)
    worldcover_classes: Optional[List[List[int]]] = Field(None, description="Co-registered ESA WorldCover grid, class 40 is cropland")
    transform: Optional[List[float]] = Field(None, description="Raster affine [a,b,c,d,e,f]; projected CRS required")
    raster_crs: Optional[str] = None
    pixel_size_m: Optional[float] = Field(None, gt=0)
    paddy_fraction: Optional[float] = Field(None, ge=0, le=1, description="Share of class-40 cropland confirmed as paddy by a crop map")
    paddy_yield_t_per_ha: Optional[float] = Field(None, ge=0)
    paddy_price_npr_per_t: Optional[float] = Field(None, ge=0)
    npr_per_usd: Optional[float] = Field(None, gt=0)


@router.get("/osm-road-network")
def get_osm_road_network(
    request: Request,
    west: float = Query(..., ge=80, le=88.2),
    south: float = Query(..., ge=26, le=27.5),
    east: float = Query(..., ge=80, le=88.2),
    north: float = Query(..., ge=26, le=27.5),
):
    """Fetch a small OSM road tile; request adjacent tiles for district-wide coverage."""
    if east <= west or north <= south or east - west > 0.5 or north - south > 0.5:
        raise HTTPException(status_code=422, detail="Use a valid tile no larger than 0.5° by 0.5°.")
    try:
        import osmnx as ox

        tags = {"highway": sorted(ALLOWED_HIGHWAYS)}
        method = ox.features_from_bbox
        if "bbox" in inspect.signature(method).parameters:
            features = method((west, south, east, north), tags)
        else:
            features = method(north, south, east, west, tags)
        if features.empty:
            return make_response({"type": "FeatureCollection", "features": []}, "No eligible OSM roads found in this tile.", request)
        features = features[features.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()
        features = features.to_crs("EPSG:4326")
        keep = [column for column in ("name", "highway", "maxspeed", "oneway", "bridge", "surface", "geometry") if column in features.columns]
        geojson = json.loads(features[keep].to_json(drop_id=False))
        return make_response(geojson, f"Fetched {len(geojson['features'])} OSM road features for this tile.", request)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="OSM road ingestion requires the optional OSMnx package.") from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"OSM data service could not return this tile: {exc}") from exc


def _geojson_geometries(collection: Dict[str, Any]):
    if collection.get("type") != "FeatureCollection":
        raise ValueError("GeoJSON input must be a FeatureCollection.")
    geometries = []
    for feature in collection.get("features", []):
        geometry = feature.get("geometry") if isinstance(feature, dict) else None
        if geometry:
            geom = shape(geometry)
            if not geom.is_empty and geom.is_valid:
                geometries.append(geom)
    return geometries


def _line_parts(geometry):
    if isinstance(geometry, LineString):
        return [geometry]
    if isinstance(geometry, MultiLineString):
        return list(geometry.geoms)
    return []


def _distance_m(a, b) -> float:
    return abs(GEOD.inv(a[0], a[1], b[0], b[1])[2])


def _road_speed_kmh(properties: Dict[str, Any], highway: str) -> float:
    value = properties.get("speed_kmh") or properties.get("maxspeed")
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.lower().replace("km/h", "").replace("kph", "").strip())
        except ValueError:
            pass
    return SPEED_KMH[highway]


@router.post("/evacuation-route")
async def evacuation_route(request: Request, payload: EvacuationRouteRequest):
    """Remove flood-intersecting OSM road segments and route to the least-cost safe haven."""
    try:
        import networkx as nx

        flooded = _geojson_geometries(payload.flood_polygons)
        if any(geom.geom_type not in {"Polygon", "MultiPolygon"} for geom in flooded):
            raise ValueError("Flood extent features must be Polygon or MultiPolygon geometries.")
        flood_union = unary_union(flooded) if flooded else None
        graph = nx.DiGraph()
        flooded_count = 0
        eligible_count = 0
        for feature in payload.roads.get("features", []):
            props = feature.get("properties") or {}
            highway = props.get("highway")
            highway = highway[0] if isinstance(highway, list) and highway else highway
            if highway not in ALLOWED_HIGHWAYS or props.get("access") in {"private", "no"}:
                continue
            geom_data = feature.get("geometry")
            if not geom_data:
                continue
            road_geom = shape(geom_data)
            eligible_count += 1
            if flood_union is not None and road_geom.intersects(flood_union):
                flooded_count += 1
                continue
            for line in _line_parts(road_geom):
                coords = list(line.coords)
                for a, b in zip(coords, coords[1:]):
                    u, v = (round(a[0], 6), round(a[1], 6)), (round(b[0], 6), round(b[1], 6))
                    distance = _distance_m(u, v)
                    if distance <= 0:
                        continue
                    speed = _road_speed_kmh(props, highway)
                    if not math.isfinite(speed) or speed <= 0:
                        continue
                    edge_data = {"distance_m": distance, "travel_minutes": distance / (speed * 1000 / 60), "road_name": props.get("name") or highway}
                    oneway = str(props.get("oneway", "")).lower()
                    if oneway in {"-1", "reverse"}:
                        graph.add_edge(v, u, **edge_data)
                    else:
                        graph.add_edge(u, v, **edge_data)
                        if oneway not in {"yes", "true", "1"}:
                            graph.add_edge(v, u, **edge_data)

        if graph.number_of_edges() == 0:
            raise HTTPException(status_code=422, detail="No eligible, non-flooded road segments were found in the supplied OSM data.")

        nodes = list(graph.nodes)
        nearest = lambda coord: min(nodes, key=lambda node: _distance_m(node, coord))
        origin = nearest(payload.origin)
        candidates = []
        for haven in payload.safe_havens:
            destination = nearest(haven.coordinates)
            try:
                path = nx.shortest_path(graph, origin, destination, weight="travel_minutes")
            except nx.NetworkXNoPath:
                continue
            edges = [graph[u][v] for u, v in zip(path, path[1:])]
            candidates.append({
                "haven": haven,
                "path": path,
                "distance_m": sum(e["distance_m"] for e in edges),
                "minutes": sum(e["travel_minutes"] for e in edges),
                "road_names": list(dict.fromkeys(e["road_name"] for e in edges)),
            })
        if not candidates:
            return make_response({"status": "no_safe_route", "flooded_road_features": flooded_count, "eligible_road_features": eligible_count, "route": None}, "No safe haven is reachable on the supplied un-flooded road graph.", request)
        best = min(candidates, key=lambda candidate: (candidate["distance_m"], candidate["minutes"]))
        coords = [[float(lon), float(lat)] for lon, lat in best["path"]]
        feature = {"type": "Feature", "geometry": {"type": "LineString", "coordinates": coords}, "properties": {"destination": best["haven"].name}}
        return make_response({
            "status": "safe_route_found",
            "source": "caller-supplied OSM road GeoJSON and flood extent",
            "eligible_road_features": eligible_count,
            "flooded_road_features_excluded": flooded_count,
            "destination": best["haven"].model_dump(),
            "distance_km": round(best["distance_m"] / 1000, 2),
            "estimated_minutes": round(best["minutes"]),
            "roads": best["road_names"],
            "route_geojson": {"type": "FeatureCollection", "features": [feature]},
            "snap_distance_origin_m": round(_distance_m(payload.origin, origin)),
            "snap_distance_haven_m": round(_distance_m(best["haven"].coordinates, best["path"][-1])),
        }, "Selected the nearest reachable supplied safe haven and computed its fastest flood-free route.", request)
    except HTTPException:
        raise
    except (ValueError, TypeError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Could not process the supplied road or flood GeoJSON: {exc}") from exc


@router.post("/loss-estimate")
async def loss_estimate(request: Request, payload: BuildingLossRequest):
    """Intersect flood extent with supplied buildings and optional WorldCover crop raster."""
    try:
        flood_geometries = _geojson_geometries(payload.flood_polygons)
        if not flood_geometries:
            raise ValueError("At least one valid flood polygon is required.")
        if any(geom.geom_type not in {"Polygon", "MultiPolygon"} for geom in flood_geometries):
            raise ValueError("Flood extent features must be Polygon or MultiPolygon geometries.")
        flood_wgs84 = unary_union(flood_geometries)
        centroid = flood_wgs84.centroid
        utm_zone = int((centroid.x + 180) // 6) + 1
        projected_crs = CRS.from_epsg((32600 if centroid.y >= 0 else 32700) + utm_zone)
        project = Transformer.from_crs("EPSG:4326", projected_crs, always_xy=True).transform
        flood_projected = transform_geometry(project, flood_wgs84)
        building_pairs = []
        for feature in payload.buildings.get("features", []):
            geometry = feature.get("geometry") if isinstance(feature, dict) else None
            if not geometry:
                continue
            building = shape(geometry)
            if not building.is_empty and building.is_valid:
                building_pairs.append((building, feature))
        impacted = []
        occupancy = 0
        type_counts: Dict[str, int] = {}
        for geom, feature in building_pairs:
            projected_geom = transform_geometry(project, geom)
            if not projected_geom.intersects(flood_projected):
                continue
            props = feature.get("properties") or {}
            btype = str(props.get("building_type") or props.get("building") or "unknown")
            type_counts[btype] = type_counts.get(btype, 0) + 1
            occupancy += int(props.get("occupancy_estimate") or props.get("households") or 1) * (1 if props.get("occupancy_estimate") else payload.average_family_size)
            impacted.append({"type": "Feature", "geometry": mapping(geom), "properties": {**props, "exposed": True}})

        crop_ha = None
        paddy_inputs = (payload.paddy_fraction, payload.paddy_yield_t_per_ha, payload.paddy_price_npr_per_t, payload.npr_per_usd)
        if any(value is not None for value in paddy_inputs) and payload.worldcover_classes is None:
            raise ValueError("Paddy valuation inputs require a WorldCover raster tile.")
        agricultural_loss_npr = agricultural_loss_usd = None
        if payload.worldcover_classes is not None:
            if payload.transform is None or not payload.raster_crs:
                raise ValueError("WorldCover classes require a raster transform and projected CRS.")
            if len(payload.transform) != 6:
                raise ValueError("Raster transform must contain six affine coefficients.")
            crs = CRS.from_user_input(payload.raster_crs)
            if not crs.is_projected or any("metre" not in axis.unit_name.lower() and "meter" not in axis.unit_name.lower() for axis in crs.axis_info[:2]):
                raise ValueError("WorldCover raster CRS must be projected in metres.")
            target_crs = Transformer.from_crs("EPSG:4326", crs, always_xy=True).transform
            flood_raster_crs = transform_geometry(target_crs, flood_wgs84)
            classes = np.asarray(payload.worldcover_classes)
            if classes.ndim != 2:
                raise ValueError("WorldCover tile must be a two-dimensional class grid.")
            affine = Affine(*payload.transform)
            pixel_area = abs(affine.a * affine.e - affine.b * affine.d)
            if pixel_area <= 0 or not math.isfinite(pixel_area):
                raise ValueError("WorldCover affine transform must describe finite pixels with positive area.")
            flooded = geometry_mask([mapping(flood_raster_crs)], out_shape=classes.shape, transform=affine, invert=True)
            crop_pixels = int(np.count_nonzero(flooded & (classes == 40)))
            crop_ha = crop_pixels * pixel_area / 10000.0
            pricing = (payload.paddy_fraction, payload.paddy_yield_t_per_ha, payload.paddy_price_npr_per_t, payload.npr_per_usd)
            if any(value is not None for value in pricing) and not all(value is not None for value in pricing):
                raise ValueError("Provide paddy share, yield, price, and NPR/USD conversion together to calculate paddy loss.")
            paddy_ha = crop_ha * payload.paddy_fraction if payload.paddy_fraction is not None else None
            if paddy_ha is not None and payload.paddy_yield_t_per_ha is not None and payload.paddy_price_npr_per_t is not None and payload.npr_per_usd is not None:
                agricultural_loss_npr = paddy_ha * payload.paddy_yield_t_per_ha * payload.paddy_price_npr_per_t
                agricultural_loss_usd = agricultural_loss_npr / payload.npr_per_usd
        else:
            paddy_ha = None

        estimated_population = int(round(occupancy)) if impacted else (payload.hand_household_count * payload.average_family_size if payload.hand_household_count else 0)
        result = {
            "building_source": "caller-supplied building footprint GeoJSON",
            "affected_building_count": len(impacted),
            "affected_buildings_by_type": type_counts,
            "estimated_displaced_population": estimated_population,
            "population_method": "building occupancy properties; fallback households multiplied by average family size" if payload.hand_household_count else "sum of supplied building occupancy or household properties",
            "affected_buildings_geojson": {"type": "FeatureCollection", "features": impacted},
            "cropland_class_40_hectares": round(crop_ha, 2) if crop_ha is not None else None,
            "paddy_hectares": round(paddy_ha, 2) if paddy_ha is not None else None,
            "agricultural_loss_npr": round(agricultural_loss_npr, 2) if agricultural_loss_npr is not None else None,
            "agricultural_loss_usd": round(agricultural_loss_usd, 2) if agricultural_loss_usd is not None else None,
            "agricultural_parameters": {
                "yield_t_per_ha": payload.paddy_yield_t_per_ha,
                "paddy_fraction_of_cropland": payload.paddy_fraction,
                "price_npr_per_t": payload.paddy_price_npr_per_t,
                "npr_per_usd": payload.npr_per_usd,
            },
        }
        return make_response(result, "Calculated exposure from the supplied flood, building, and optional WorldCover data.", request)
    except (ValueError, TypeError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Could not process supplied impact data: {exc}") from exc
