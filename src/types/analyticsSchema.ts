import { AnatomicalZone, PPEClass } from './schema';

export interface HeatmapCell {
  dayOfWeek: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  dayIndex: number; // 0-6
  hour: number; // 0-23
  complianceRate: number; // 0.0 to 100.0%
  totalDetections: number;
  totalViolations: number;
  bypassedViolations: number;
  dominantViolationClass?: PPEClass;
  peakShift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
}

export interface ShiftPerformanceMetric {
  shiftId: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  shiftName: string;
  timeRange: string; // '06:00 - 14:00'
  supervisorName: string;
  workerHeadcount: number;
  workerHoursExposed: number;
  complianceRate: number; // percentage
  activeViolationsCount: number;
  bypassedViolationsCount: number;
  meanTimeToAcknowledgeSec: number;
  criticalIncidentsCount: number;
  hourlyTrends: { hour: string; compliance: number; violations: number }[];
  zoneBreakdown: Record<AnatomicalZone, { compliant: number; violations: number; complianceRate: number }>;
}

export interface OshaRecordableEntry {
  caseNumber: string;
  dateOfOccurrence: string;
  timeOfOccurrence: string;
  employeeTrackId: string;
  jobTitle: string;
  departmentZone: string;
  cameraId: string;
  anatomicalZone: AnatomicalZone;
  ppeClassViolated: PPEClass;
  oshaStandardCitation: string; // e.g. '29 CFR 1910.135(a)(1)'
  descriptionOfHazard: string;
  severityClassification: 'NEAR_MISS_CRITICAL' | 'FIRST_AID_POTENTIAL' | 'RECORDABLE_INSPECTION' | 'ZONE_RESTRICTION';
  daysRestrictedOrLost: number;
  monitoringConfigState: 'ACTIVE_ENFORCED' | 'RULE_BYPASSED_HISTORICAL' | 'GRACE_PERIOD_EXPIRED';
  correctiveActionTaken: string;
  supervisorSignOff: string;
  closureStatus: 'OPEN' | 'UNDER_REVIEW' | 'CLOSED_REMEDIATED';
}

export interface OshaSummaryStats {
  reportingPeriod: string;
  companyName: string;
  facilityCode: string;
  totalHoursWorked: number;
  totalNearMissesDetected: number;
  activeViolationsLogged: number;
  bypassedViolationsSuppressed: number;
  trirEquivalentRate: number; // (Violations * 200,000) / Hours
  dartEquivalentRate: number;
  violationSeverityIndex: number;
  mttaAverageSeconds: number;
  correctiveActionClosurePct: number;
}

export interface ActiveLearningCandidate {
  id: string;
  sampleUid: string;
  cameraId: string;
  cameraName: string;
  zoneCode: string;
  timestamp: string;
  imageUrl: string;
  cropUrl?: string;
  anatomicalZone: AnatomicalZone;
  predictedClass: PPEClass;
  initialConfidence: number; // 0.35 to 0.55
  bboxInitial: [number, number, number, number]; // [x, y, w, h] normalized 0-1
  uncertaintyReason: 'GLARE_REFLECTION' | 'PARTIAL_OCCLUSION' | 'MOTION_BLUR' | 'UNUSUAL_ANGLE' | 'NON_STANDARD_GEAR';
  triageStatus: 'PENDING_REVIEW' | 'CONFIRMED_TRUE_POSITIVE' | 'FLAGGED_FALSE_POSITIVE' | 'FLAGGED_FALSE_NEGATIVE' | 'RE_ANNOTATED';
  correctedClass?: PPEClass;
  correctedBbox?: [number, number, number, number];
  labelAssistConfidence?: number;
  labelAssistModel?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface RetrainDatasetManifest {
  version: string;
  datasetName: string;
  totalSamples: number;
  trainCount: number;
  valCount: number;
  testCount: number;
  classDistribution: Record<PPEClass, number>;
  projectedMapImprovement: number; // e.g. +3.4%
  dataYamlContent: string;
  generatedAt: string;
  exportFormat: 'YOLOV9_DARKNET' | 'PYTORCH_TORCHVISION' | 'COCO_JSON' | 'TFRECORD';
}
