# Phase 4 operations

The phase 4 endpoints accept the event's geospatial inputs rather than substituting generated road, building, or crop exposure data.

## OSM road ingestion and evacuation route

`GET /api/v1/operations/osm-road-network` fetches OSM `trunk`, `primary`, `secondary`, and `tertiary` roads for a small Terai tile. Tile dimensions are limited to 0.5 degrees; stitch adjacent tiles for district coverage. The route endpoint accepts those road features and a flood GeoJSON `FeatureCollection`:

`POST /api/v1/operations/evacuation-route`

Body fields are `roads`, `flood_polygons`, `origin: [longitude, latitude]`, and `safe_havens` with `name`, `coordinates`, and optional `capacity`. Road features intersecting flood polygons are excluded. The endpoint finds the nearest reachable supplied haven and returns a fastest flood-free route as GeoJSON. Haven suitability and elevation must be curated in the supplied safe-haven list.

## Building and crop exposure

`POST /api/v1/operations/loss-estimate` intersects the supplied flood polygons with building footprint GeoJSON and returns impacted buildings by type and estimated occupants. Optional co-registered WorldCover class tiles use class `40` for cropland; include the six-value affine transform, projected metre CRS, and a crop-map-derived paddy fraction, yield, price, and NPR/USD inputs to calculate paddy hectares and monetary loss. WorldCover class `40` alone does not identify rice. Currency and yield inputs are caller-supplied so estimates can use current, locally approved values.

## Alerts and time replay

The telemetry alert response now includes Nepali, Maithili, Bhojpuri, and English SMS, WhatsApp, and community-radio copy. The SMS text is capped at 160 Unicode code points; Unicode carriers may split it into multiple messages.

The map page includes a T−24h to T+24h timeline. Selecting a checkpoint changes the corridor layer opacity to show an illustrative event progression. It replays the configured corridor geometry and is not a time-indexed satellite or hydraulic model output.
