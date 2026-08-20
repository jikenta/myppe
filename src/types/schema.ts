export type AnatomicalZone = 'HEAD' | 'FACIAL' | 'UPPER_BODY' | 'EXTREMITIES';

export type PPEClass = 
  | 'head_helmet'
  | 'head_nohelmet'
  | 'glasses'
  | 'face_mask'
  | 'face_nomask'
  | 'vest'
  | 'person'
  | 'hand_glove'
  | 'hand_noglove'
  | 'boots'
  | 'shoes';

export interface PPEClassRule {
  class_name: PPEClass;
  display_name: string;
  zone: AnatomicalZone;
  type: 'COMPLIANT' | 'VIOLATION' | 'DETECTION';
  is_enabled: boolean;
  min_confidence: number; // 0.0 to 1.0
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  grace_period_sec: number; // Duration before logging violation
  description: string;
}

export interface ZoneMonitoringConfig {
  config_version: number;
  updated_at: string;
  updated_by: string;
  is_active: boolean;
  schedule?: {
    always_active: boolean;
    active_days: number[]; // 0=Sunday, 6=Saturday
    start_time_utc: string; // '08:00'
    end_time_utc: string; // '18:00'
  };
  zones: {
    head: {
      enabled: boolean;
      require_helmet: boolean;
      min_confidence: number;
      grace_period_sec: number;
      alert_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    facial: {
      enabled: boolean;
      require_glasses: boolean;
      require_mask: boolean;
      min_confidence: number;
      grace_period_sec: number;
      alert_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    upper_body: {
      enabled: boolean;
      require_vest: boolean;
      track_person_occupancy: boolean;
      max_occupancy_limit: number;
      min_confidence: number;
      alert_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    extremities: {
      enabled: boolean;
      require_gloves: boolean;
      require_safety_boots: boolean; // boots vs shoes
      min_confidence: number;
      grace_period_sec: number;
      alert_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
  };
  rules: Record<PPEClass, {
    enabled: boolean;
    confidence_threshold: number;
    action: 'LOG' | 'ALERT_EHS' | 'TRIGGER_BEACON' | 'CRITICAL_DISPATCH';
  }>;
  debounce: {
    sliding_window_ms: number;
    consecutive_frames_required: number;
    deduplication_ttl_seconds: number;
  };
  notification_channels: {
    email: boolean;
    sms: boolean;
    webhook_url?: string;
    on_premise_gpio_siren: boolean;
  };
}

export interface CameraZone {
  id: string;
  tenant_id: string;
  facility_id: string;
  camera_id: string;
  zone_code: string;
  name: string;
  zone_type: 'HAZARDOUS_WORK' | 'CHEMICAL_HANDLING' | 'HIGH_VOLTAGE' | 'GENERAL_WALKWAY' | 'LOADING_DOCK';
  polygon_coordinates: [number, number][]; // normalized [x, y] in range 0-100
  color: string;
  monitoring_config: ZoneMonitoringConfig;
  created_at: string;
  updated_at: string;
}

export interface CameraFeed {
  id: string;
  tenant_id: string;
  facility_id: string;
  camera_uid: string; // e.g. CAM-EHS-042
  name: string;
  location_name: string;
  rtsp_url_masked: string;
  edge_device_id: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  fps: number;
  resolution: string;
  zones: CameraZone[];
}

export interface ViolationEvent {
  id: string;
  tenant_id: string;
  facility_id: string;
  camera_id: string;
  zone_id: string;
  person_track_id: string;
  anatomical_zone: AnatomicalZone;
  detected_class: PPEClass;
  violation_type: string;
  confidence_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  snapshot_url: string;
  detected_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  raw_inference_payload?: Record<string, unknown>;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: 'ENTERPRISE' | 'PRO' | 'STANDARD';
  max_cameras: number;
  max_fps: number;
  retention_days: number;
  created_at: string;
}

export interface Facility {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  timezone: string;
  address: string;
  total_cameras: number;
}

export type UserRole = 'EHS_GLOBAL_ADMIN' | 'FACILITY_SAFETY_OFFICER' | 'ZONE_SUPERVISOR' | 'AUDITOR' | 'EDGE_SERVICE_ACCOUNT';

export interface VideoStreamMetrics {
  stream_id: string;
  camera_uid: string;
  protocol: 'WEBRTC_WHEP' | 'LL_HLS' | 'RTSP_RAW';
  resolution: string;
  fps: number;
  bitrate_kbps: number;
  latency_ms: number;
  packet_loss_pct: number;
  codec: string;
  keyframe_interval_sec: number;
  active_subscribers: number;
  rtsp_uptime_seconds: number;
  is_hardware_accelerated: boolean;
}

export interface GpioRelayState {
  relay_id: number;
  pin_number: number;
  label: string;
  target_equipment: 'SIREN_110DB' | 'STROBE_BEACON' | 'FLOOR_SPEAKER_HORN' | 'AIR_LOCK_GATE';
  assigned_zone: string;
  is_energized: boolean;
  pulse_duration_ms: number;
  last_triggered_at?: string;
  trigger_reason?: string;
  voltage: string;
}

export interface MobilePushPayload {
  notification_id: string;
  platform: 'APNS_IOS' | 'FCM_ANDROID';
  priority: 'HIGH' | 'NORMAL';
  title: string;
  body: string;
  sound: string;
  badge_count: number;
  data: {
    event_id: string;
    camera_id: string;
    zone_code: string;
    violation_type: string;
    severity: string;
    snapshot_url: string;
    person_track_id: string;
    deep_link: string;
  };
  dispatched_at: string;
}

export interface WebSocketAlertMessage {
  type: 'VIOLATION_ALERT' | 'RULE_HOT_RELOAD' | 'GPIO_RELAY_STATE' | 'STREAM_HEALTH';
  timestamp: string;
  facility_id: string;
  camera_id: string;
  zone_id: string;
  data: Record<string, unknown>;
}
