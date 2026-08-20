export const POSTGRES_DDL_SQL = `-- ============================================================================
-- PRODUCTION POSTGRESQL 16+ MULTI-TENANT EHS PPE COMPLIANCE SCHEMA
-- Optimized for High-Frequency Ingestion, Sub-second Analytical Queries & RLS
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. ENUM TYPES
CREATE TYPE tenant_tier_enum AS ENUM ('STANDARD', 'PRO', 'ENTERPRISE');
CREATE TYPE camera_status_enum AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE');
CREATE TYPE zone_type_enum AS ENUM ('HAZARDOUS_WORK', 'CHEMICAL_HANDLING', 'HIGH_VOLTAGE', 'GENERAL_WALKWAY', 'LOADING_DOCK', 'CONFINED_SPACE');
CREATE TYPE anatomical_zone_enum AS ENUM ('HEAD', 'FACIAL', 'UPPER_BODY', 'EXTREMITIES');
CREATE TYPE ppe_class_enum AS ENUM (
    'head_helmet', 'head_nohelmet',
    'glasses', 'face_mask', 'face_nomask',
    'vest', 'person',
    'hand_glove', 'hand_noglove', 'boots', 'shoes'
);
CREATE TYPE severity_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE user_role_enum AS ENUM ('EHS_GLOBAL_ADMIN', 'FACILITY_SAFETY_OFFICER', 'ZONE_SUPERVISOR', 'AUDITOR', 'EDGE_SERVICE_ACCOUNT');

-- 3. CORE TENANT & FACILITY TABLES
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier tenant_tier_enum NOT NULL DEFAULT 'ENTERPRISE',
    max_cameras INT NOT NULL DEFAULT 50,
    max_fps INT NOT NULL DEFAULT 30,
    retention_days INT NOT NULL DEFAULT 90,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    facility_code VARCHAR(50) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    address TEXT,
    geo_coordinates POINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_facility_code UNIQUE (tenant_id, facility_code)
);

CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    camera_uid VARCHAR(100) NOT NULL, -- e.g. CAM-WELD-04
    name VARCHAR(255) NOT NULL,
    location_description TEXT,
    rtsp_stream_url TEXT NOT NULL,
    edge_device_id VARCHAR(100) NOT NULL,
    status camera_status_enum NOT NULL DEFAULT 'ONLINE',
    stream_fps SMALLINT NOT NULL DEFAULT 15,
    resolution VARCHAR(20) NOT NULL DEFAULT '1920x1080',
    field_of_view_deg SMALLINT DEFAULT 90,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_facility_camera_uid UNIQUE (facility_id, camera_uid)
);

-- 4. CAMERA ZONES (Polygonal Virtual Boundaries)
CREATE TABLE camera_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    zone_code VARCHAR(50) NOT NULL, -- e.g. ZONE-WELD-A
    name VARCHAR(255) NOT NULL,
    zone_type zone_type_enum NOT NULL DEFAULT 'HAZARDOUS_WORK',
    polygon_coordinates JSONB NOT NULL, -- Array of normalized [[x1, y1], [x2, y2], ...] (0-100)
    display_color VARCHAR(10) NOT NULL DEFAULT '#EF4444',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_camera_zone_code UNIQUE (camera_id, zone_code),
    CONSTRAINT chk_valid_polygon CHECK (jsonb_typeof(polygon_coordinates) = 'array')
);

-- 5. DYNAMIC ACTIVE MONITORING CONFIGS (JSONB Rule Engine Toggles)
CREATE TABLE active_monitoring_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES camera_zones(id) ON DELETE CASCADE,
    config_version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Structured JSONB rules per anatomical zone with strict schema enforcement
    rule_config JSONB NOT NULL,
    
    -- Operational parameters
    debounce_window_ms INT NOT NULL DEFAULT 3000,
    consecutive_frames_threshold SMALLINT NOT NULL DEFAULT 3,
    alert_routing JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "gpio_siren": true}'::jsonb,
    
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_zone_monitoring_config UNIQUE (zone_id),
    
    -- JSONB Schema Structural Check
    CONSTRAINT chk_rule_config_structure CHECK (
        rule_config ? 'head' AND
        rule_config ? 'facial' AND
        rule_config ? 'upper_body' AND
        rule_config ? 'extremities' AND
        rule_config ? 'rules'
    )
);

-- 6. HIGH-FREQUENCY VIOLATION EVENTS (Declaratively Range-Partitioned by Month)
CREATE TABLE violation_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    facility_id UUID NOT NULL,
    camera_id UUID NOT NULL,
    zone_id UUID NOT NULL,
    person_track_id VARCHAR(64) NOT NULL, -- Unique DeepSORT/ByteTrack ID across frames
    anatomical_zone anatomical_zone_enum NOT NULL,
    detected_class ppe_class_enum NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity severity_level_enum NOT NULL DEFAULT 'HIGH',
    confidence_score NUMERIC(5, 4) NOT NULL, -- e.g. 0.9450
    bounding_box JSONB NOT NULL, -- { "x": 0.35, "y": 0.12, "w": 0.15, "h": 0.22 }
    snapshot_storage_uri TEXT,
    detected_at TIMESTAMPTZ NOT NULL,
    
    -- Workflow state
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    acknowledgement_notes TEXT,
    
    -- Edge Metadata
    inference_latency_ms SMALLINT,
    raw_telemetry JSONB,
    
    PRIMARY KEY (id, detected_at)
) PARTITION BY RANGE (detected_at);

-- 7. MONTHLY PARTITION TABLES (Automated via pg_partman or DDL)
CREATE TABLE violation_events_y2026m07 PARTITION OF violation_events
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE violation_events_y2026m08 PARTITION OF violation_events
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE violation_events_y2026m09 PARTITION OF violation_events
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- 8. PERFORMANCE INDEXES FOR SUB-SECOND DASHBOARD & AUDIT QUERIES
-- Composite Index for Facility/Tenant Real-time Live feeds
CREATE INDEX idx_violations_tenant_facility_detected ON violation_events (tenant_id, facility_id, detected_at DESC);

-- Composite Index for Camera/Zone Violation Heatmaps
CREATE INDEX idx_violations_zone_detected ON violation_events (zone_id, detected_at DESC);

-- Partial Index for Immediate Unacknowledged Urgent Alerts
CREATE INDEX idx_violations_unacknowledged_urgent 
ON violation_events (tenant_id, severity, detected_at DESC) 
WHERE acknowledged = FALSE;

-- BRIN Index for High-density Timeseries Range Scans
CREATE INDEX idx_violations_brin_detected_at ON violation_events USING BRIN (detected_at);

-- GIN Index on Raw Telemetry for Dynamic EHS Ad-hoc Queries
CREATE INDEX idx_violations_raw_telemetry_gin ON violation_events USING GIN (raw_telemetry);

-- GIN Index on active_monitoring_configs JSONB
CREATE INDEX idx_config_rule_jsonb_gin ON active_monitoring_configs USING GIN (rule_config);

-- 9. EHS AUDIT LOGS TABLE
CREATE TABLE ehs_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    actor_role user_role_enum NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- 'ZONE_CONFIG_UPDATED', 'VIOLATION_ACKNOWLEDGED', 'CAMERA_ADDED'
    target_resource VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_created ON ehs_audit_logs (tenant_id, created_at DESC);

-- 10. ROW LEVEL SECURITY (RLS) MULTI-TENANCY ISOLATION
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_monitoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehs_audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY tenant_isolation_facilities ON facilities
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_cameras ON cameras
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_camera_zones ON camera_zones
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_configs ON active_monitoring_configs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_violations ON violation_events
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_audit ON ehs_audit_logs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
`;

export const REDIS_ARCHITECTURE_DOC = `# REDIS 7+ ARCHITECTURE & INGESTION DATA MODEL

## 1. High-Throughput Edge Ingestion Stream
Edge AI inference nodes publish object detections directly to Redis Streams with sub-millisecond write latency:
- **Stream Key**: \`ehs:stream:camera:{camera_id}:detections\`
- **Command**: \`XADD ehs:stream:camera:{camera_id}:detections MAXLEN ~ 50000 * track_id "P-402" x "0.45" y "0.22" w "0.14" h "0.38" classes "head_nohelmet,vest,hand_noglove,shoes" confs "0.94,0.88,0.92,0.95" ts "1724141316000"\`

## 2. Low-Latency Zone Configuration Hot-Cache
Rule evaluation microservices fetch active zone rules with sub-100µs latency:
- **Hash Key**: \`ehs:cache:config:{camera_id}:{zone_id}\`
- **Fields**:
  - \`head_req\`: "1" (Helmet required)
  - \`face_req\`: "1" (Mask + Glasses required)
  - \`upper_req\`: "1" (Vest required)
  - \`extremities_req\`: "1" (Gloves + Boots required)
  - \`min_conf\`: "0.85"
  - \`debounce_ms\`: "3000"
  - \`updated_at\`: "2026-08-20T08:00:00Z"
- **Invalidation Strategy**: Write-through cache with Pub/Sub broadcast on topic \`ehs:pubsub:config_invalidated\`.

## 3. Sliding Window Debounce & Deduplication
To prevent continuous frame-by-frame spam for the same worker standing in a zone without a helmet:
- **Sorted Set Key**: \`ehs:debounce:{camera_id}:{zone_id}:{track_id}:{violation_type}\`
- **Logic**:
  1. Add detection: \`ZADD key {timestamp_ms} {frame_id}\`
  2. Remove old entries: \`ZREMRANGEBYSCORE key -inf ({now_ms} - debounce_ms)\`
  3. Check frame count: \`ZCARD key\`
  4. If \`count >= threshold\` AND \`SETNX ehs:lock:{track_id}:{violation_type} 1 EX 30\` returns 1 -> Emit official violation event to PostgreSQL and WebSocket.

## 4. Live Hot-Metric Real-Time Counters
- **Key**: \`ehs:metrics:{facility_id}:hourly:{YYYYMMDDHH}\`
- **Hash Counters**:
  - \`HINCRBY key "head_nohelmet" 1\`
  - \`HINCRBY key "hand_noglove" 1\`
  - \`HINCRBY key "face_nomask" 1\`
  - \`HINCRBY key "shoes_in_boot_zone" 1\`
  - \`HINCRBY key "compliant_workers" 1\`
`;

export const REST_API_SPEC = `openapi: 3.1.0
info:
  title: EHS PPE Compliance & Dynamic Zone Management API
  version: 1.0.0
  description: High-throughput REST API for camera zone rule orchestration and compliance analytics.
paths:
  /api/v1/cameras/{cameraId}/zones:
    get:
      summary: Retrieve all configured polygonal zones for a camera feed
      parameters:
        - name: cameraId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of camera zones with polygon and active rule config
    post:
      summary: Create or update a camera zone with anatomical PPE requirements
      parameters:
        - name: cameraId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CameraZoneCreatePayload'
      responses:
        '201':
          description: Zone created successfully

  /api/v1/cameras/{cameraId}/zones/{zoneId}/config:
    put:
      summary: Update dynamic JSONB active monitoring configuration for specific anatomical zones
      parameters:
        - name: cameraId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: zoneId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ActiveMonitoringConfig'
      responses:
        '200':
          description: Configuration updated, hot-cache warmed, and edge synced

  /api/v1/ingest/inference-batch:
    post:
      summary: High-frequency Edge AI batch inference ingestion (sub-50ms)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InferenceBatchPayload'
      responses:
        '202':
          description: Batch accepted into Redis Stream pipeline

  /api/v1/violations:
    get:
      summary: Sub-second filtered query for violation events with cursor pagination
      parameters:
        - name: facilityId
          in: query
          required: true
          schema:
            type: string
            format: uuid
        - name: severity
          in: query
          schema:
            type: string
            enum: [LOW, MEDIUM, HIGH, CRITICAL]
        - name: anatomicalZone
          in: query
          schema:
            type: string
            enum: [HEAD, FACIAL, UPPER_BODY, EXTREMITIES]
        - name: acknowledged
          in: query
          schema:
            type: boolean
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: Paginated violation records with sub-second response headers

components:
  schemas:
    ActiveMonitoringConfig:
      type: object
      required:
        - zones
        - rules
        - debounce
      properties:
        zones:
          type: object
          properties:
            head:
              type: object
              properties:
                enabled: { type: boolean }
                require_helmet: { type: boolean }
                min_confidence: { type: number }
                grace_period_sec: { type: number }
            facial:
              type: object
              properties:
                enabled: { type: boolean }
                require_glasses: { type: boolean }
                require_mask: { type: boolean }
                min_confidence: { type: number }
            upper_body:
              type: object
              properties:
                enabled: { type: boolean }
                require_vest: { type: boolean }
                track_person_occupancy: { type: boolean }
            extremities:
              type: object
              properties:
                enabled: { type: boolean }
                require_gloves: { type: boolean }
                require_safety_boots: { type: boolean }
`;

export const GRAPHQL_SCHEMA_SPEC = `"""
EHS PPE Compliance GraphQL Schema
Supports Real-time Subscriptions & Deep Analytical Traversal
"""

enum AnatomicalZone {
  HEAD
  FACIAL
  UPPER_BODY
  EXTREMITIES
}

enum PPEClass {
  head_helmet
  head_nohelmet
  glasses
  face_mask
  face_nomask
  vest
  person
  hand_glove
  hand_noglove
  boots
  shoes
}

enum SeverityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

type CameraZone {
  id: ID!
  zoneCode: String!
  name: String!
  zoneType: String!
  polygonCoordinates: [[Float!]!]!
  displayColor: String!
  monitoringConfig: ZoneMonitoringConfig!
  activeViolationsCount: Int!
  currentComplianceRate: Float!
}

type ZoneMonitoringConfig {
  configVersion: Int!
  isActive: Boolean!
  headEnabled: Boolean!
  requireHelmet: Boolean!
  facialEnabled: Boolean!
  requireGlasses: Boolean!
  requireMask: Boolean!
  upperBodyEnabled: Boolean!
  requireVest: Boolean!
  extremitiesEnabled: Boolean!
  requireGloves: Boolean!
  requireBoots: Boolean!
  debounceWindowMs: Int!
  updatedAt: String!
}

type ViolationEvent {
  id: ID!
  personTrackId: String!
  anatomicalZone: AnatomicalZone!
  detectedClass: PPEClass!
  violationType: String!
  severity: SeverityLevel!
  confidenceScore: Float!
  boundingBox: BoundingBox!
  snapshotUrl: String
  detectedAt: String!
  acknowledged: Boolean!
}

type BoundingBox {
  x: Float!
  y: Float!
  width: Float!
  height: Float!
}

type Query {
  facilityCameras(facilityId: ID!): [CameraFeed!]!
  zoneDetails(zoneId: ID!): CameraZone
  violations(
    facilityId: ID!
    severities: [SeverityLevel!]
    anatomicalZones: [AnatomicalZone!]
    unacknowledgedOnly: Boolean
    cursor: String
    limit: Int = 50
  ): ViolationConnection!
  complianceSummary(facilityId: ID!, timeWindowHours: Int = 24): ComplianceMetrics!
}

type Mutation {
  updateZoneMonitoringRules(
    zoneId: ID!
    input: UpdateZoneMonitoringInput!
  ): CameraZone!
  acknowledgeViolation(
    violationId: ID!
    detectedAt: String!
    notes: String
  ): ViolationEvent!
}

type Subscription {
  onViolationDetected(
    facilityId: ID!
    severities: [SeverityLevel!]
  ): ViolationEvent!
}
`;

export const RBAC_JWT_SPEC = `{
  "iss": "https://auth.ehs-platform.cloud",
  "sub": "usr_94a8e2bc194f",
  "aud": "ehs-api-gateway",
  "exp": 1724148400,
  "nbf": 1724144800,
  "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "facility_ids": [
    "8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
  ],
  "role": "FACILITY_SAFETY_OFFICER",
  "scopes": [
    "ehs:cameras:read",
    "ehs:zones:read",
    "ehs:zones:write",
    "ehs:config:toggle",
    "ehs:violations:read",
    "ehs:violations:acknowledge",
    "ehs:audit:read"
  ],
  "user_metadata": {
    "first_name": "Elena",
    "last_name": "Rostova",
    "email": "elena.rostova@acme-industrial.com",
    "department": "Occupational Health & Safety"
  }
}`;
