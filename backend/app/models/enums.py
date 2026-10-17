"""
enums.py — Domain Enumerations for FloodGuard AI Database Schema
================================================================

Defines strongly-typed database enums for lifecycle status, severity tiers,
roles, damage classifications, and spatial asset categories.
"""

from enum import Enum


class JobStatus(str, Enum):
    """Lifecycle states for analytical pipeline execution jobs."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobPriority(str, Enum):
    """Scheduling priority for task dispatchers."""
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class UserRole(str, Enum):
    """Role-based access control tiers."""
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    RESPONDER = "RESPONDER"
    VIEWER = "VIEWER"


class UserStatus(str, Enum):
    """Account activity status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class FloodSeverity(str, Enum):
    """Disaster severity index classification tiers."""
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    CATASTROPHIC = "CATASTROPHIC"


class ReportType(str, Enum):
    """Classification of generated analytic reports and executive summaries."""
    SITUATION_REPORT = "SITUATION_REPORT"
    IMPACT_ASSESSMENT = "IMPACT_ASSESSMENT"
    EXECUTIVE_BRIEF = "EXECUTIVE_BRIEF"
    TECHNICAL_AUDIT = "TECHNICAL_AUDIT"
    INFRASTRUCTURE_DAMAGE = "INFRASTRUCTURE_DAMAGE"


class ArtifactType(str, Enum):
    """Categories of geospatial and tabular deliverables generated during runs."""
    FLOOD_POLYGON_GEOJSON = "FLOOD_POLYGON_GEOJSON"
    FLOOD_MASK_GEOTIFF = "FLOOD_MASK_GEOTIFF"
    SAR_BEFORE_RASTER = "SAR_BEFORE_RASTER"
    SAR_AFTER_RASTER = "SAR_AFTER_RASTER"
    IMPACT_CSV = "IMPACT_CSV"
    CARTOGRAPHIC_MAP_PNG = "CARTOGRAPHIC_MAP_PNG"
    AUDIT_METADATA_JSON = "AUDIT_METADATA_JSON"


class InfrastructureType(str, Enum):
    """Categories of critical public facilities and lifelines."""
    HOSPITAL = "HOSPITAL"
    CLINIC = "CLINIC"
    SCHOOL = "SCHOOL"
    UNIVERSITY = "UNIVERSITY"
    POLICE = "POLICE"
    FIRE_STATION = "FIRE_STATION"
    SHELTER = "SHELTER"
    GOVERNMENT = "GOVERNMENT"
    WATER_SUPPLY = "WATER_SUPPLY"
    POWER_SUBSTATION = "POWER_SUBSTATION"
    BRIDGE = "BRIDGE"
    OTHER = "OTHER"


class DamageLevel(str, Enum):
    """Physical inundation damage scale for structures and road segments."""
    NONE = "NONE"
    MINOR = "MINOR"
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    DESTROYED = "DESTROYED"
