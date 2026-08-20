import {
  HeatmapCell,
  ShiftPerformanceMetric,
  OshaRecordableEntry,
  OshaSummaryStats,
  ActiveLearningCandidate,
  RetrainDatasetManifest,
} from '../types/analyticsSchema';

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);

// Generate 7x24 Temporal Compliance Heatmap with realistic operational dips
export const GENERATED_HEATMAP_DATA: HeatmapCell[] = [];

DAYS_OF_WEEK.forEach((day, dayIndex) => {
  HOURS_OF_DAY.forEach((hour) => {
    // Shifts: Morning (06-13), Afternoon (14-21), Night (22-05)
    let peakShift: 'MORNING' | 'AFTERNOON' | 'NIGHT' = 'NIGHT';
    if (hour >= 6 && hour < 14) peakShift = 'MORNING';
    else if (hour >= 14 && hour < 22) peakShift = 'AFTERNOON';

    // Base volume
    const isWeekend = day === 'Sat' || day === 'Sun';
    const volumeMultiplier = isWeekend ? 0.35 : 1.0;
    const isPeakRush = hour === 6 || hour === 7 || hour === 14 || hour === 15 || hour === 22; // shift changeovers
    const isPostLunchDip = hour === 13 || hour === 19; // afternoon fatigue
    const isGraveyardFatigue = hour === 3 || hour === 4;

    let baseCompliance = 94.5;
    if (isPeakRush) baseCompliance -= 8.5;
    if (isPostLunchDip) baseCompliance -= 5.0;
    if (isGraveyardFatigue) baseCompliance -= 7.0;
    if (isWeekend) baseCompliance += 3.0;

    // Small deterministic variance
    const pseudoNoise = Math.sin(dayIndex * 3 + hour * 1.5) * 2.5;
    const finalCompliance = Math.min(99.2, Math.max(76.0, baseCompliance + pseudoNoise));

    const totalDetections = Math.round((280 + Math.abs(Math.sin(hour)) * 320) * volumeMultiplier);
    const violationRate = (100 - finalCompliance) / 100;
    const totalViolations = Math.max(0, Math.round(totalDetections * violationRate * 0.15));
    const bypassedViolations = Math.round(totalViolations * 0.28); // e.g. bypassed rules on specific lines

    let dominantViolation: any = 'head_nohelmet';
    if (hour >= 14 && hour < 20) dominantViolation = 'hand_noglove';
    else if (hour >= 20 || hour < 4) dominantViolation = 'shoes';
    else if (hour === 8 || hour === 11) dominantViolation = 'face_nomask';

    GENERATED_HEATMAP_DATA.push({
      dayOfWeek: day,
      dayIndex,
      hour,
      complianceRate: parseFloat(finalCompliance.toFixed(1)),
      totalDetections,
      totalViolations,
      bypassedViolations,
      dominantViolationClass: dominantViolation,
      peakShift,
    });
  });
});

// Shift Performance Metrics
export const SHIFT_PERFORMANCE_METRICS: ShiftPerformanceMetric[] = [
  {
    shiftId: 'MORNING',
    shiftName: 'Shift A - Morning Operational Crew',
    timeRange: '06:00 - 14:00 CST',
    supervisorName: 'Marcus Vance (CSP Certified)',
    workerHeadcount: 148,
    workerHoursExposed: 1184,
    complianceRate: 94.8,
    activeViolationsCount: 38,
    bypassedViolationsCount: 14,
    meanTimeToAcknowledgeSec: 42,
    criticalIncidentsCount: 3,
    hourlyTrends: [
      { hour: '06:00', compliance: 88.2, violations: 9 },
      { hour: '07:00', compliance: 91.5, violations: 7 },
      { hour: '08:00', compliance: 96.2, violations: 3 },
      { hour: '09:00', compliance: 97.4, violations: 2 },
      { hour: '10:00', compliance: 96.8, violations: 3 },
      { hour: '11:00', compliance: 95.1, violations: 4 },
      { hour: '12:00', compliance: 92.4, violations: 6 },
      { hour: '13:00', compliance: 89.8, violations: 8 },
    ],
    zoneBreakdown: {
      HEAD: { compliant: 8420, violations: 12, complianceRate: 98.6 },
      FACIAL: { compliant: 7210, violations: 8, complianceRate: 98.9 },
      UPPER_BODY: { compliant: 9150, violations: 6, complianceRate: 99.3 },
      EXTREMITIES: { compliant: 6840, violations: 12, complianceRate: 98.2 },
    },
  },
  {
    shiftId: 'AFTERNOON',
    shiftName: 'Shift B - Swing / High Fabrication',
    timeRange: '14:00 - 22:00 CST',
    supervisorName: 'Elena Rostova (EHS Lead)',
    workerHeadcount: 162,
    workerHoursExposed: 1296,
    complianceRate: 91.4,
    activeViolationsCount: 64,
    bypassedViolationsCount: 22,
    meanTimeToAcknowledgeSec: 36,
    criticalIncidentsCount: 6,
    hourlyTrends: [
      { hour: '14:00', compliance: 86.5, violations: 12 },
      { hour: '15:00', compliance: 90.1, violations: 9 },
      { hour: '16:00', compliance: 93.8, violations: 5 },
      { hour: '17:00', compliance: 94.2, violations: 4 },
      { hour: '18:00', compliance: 92.6, violations: 7 },
      { hour: '19:00', compliance: 88.7, violations: 11 },
      { hour: '20:00', compliance: 91.3, violations: 8 },
      { hour: '21:00', compliance: 89.0, violations: 10 },
    ],
    zoneBreakdown: {
      HEAD: { compliant: 7920, violations: 18, complianceRate: 97.7 },
      FACIAL: { compliant: 6430, violations: 14, complianceRate: 97.8 },
      UPPER_BODY: { compliant: 8740, violations: 11, complianceRate: 98.7 },
      EXTREMITIES: { compliant: 6110, violations: 21, complianceRate: 96.6 },
    },
  },
  {
    shiftId: 'NIGHT',
    shiftName: 'Shift C - Night Maintenance & Tooling',
    timeRange: '22:00 - 06:00 CST',
    supervisorName: 'Devon Kincaid (Safety Specialist)',
    workerHeadcount: 76,
    workerHoursExposed: 608,
    complianceRate: 88.6,
    activeViolationsCount: 46,
    bypassedViolationsCount: 18,
    meanTimeToAcknowledgeSec: 54,
    criticalIncidentsCount: 4,
    hourlyTrends: [
      { hour: '22:00', compliance: 87.1, violations: 8 },
      { hour: '23:00', compliance: 89.5, violations: 6 },
      { hour: '00:00', compliance: 91.2, violations: 4 },
      { hour: '01:00', compliance: 90.8, violations: 5 },
      { hour: '02:00', compliance: 88.4, violations: 7 },
      { hour: '03:00', compliance: 84.6, violations: 10 },
      { hour: '04:00', compliance: 85.2, violations: 9 },
      { hour: '05:00', compliance: 87.0, violations: 7 },
    ],
    zoneBreakdown: {
      HEAD: { compliant: 3820, violations: 14, complianceRate: 96.3 },
      FACIAL: { compliant: 2950, violations: 9, complianceRate: 97.0 },
      UPPER_BODY: { compliant: 4120, violations: 8, complianceRate: 98.1 },
      EXTREMITIES: { compliant: 3010, violations: 15, complianceRate: 95.0 },
    },
  },
];

// OSHA 300 / 300A Compliance Log Records
export const OSHA_RECORDABLE_LOGS: OshaRecordableEntry[] = [
  {
    caseNumber: 'OSHA-2026-0841',
    dateOfOccurrence: '2026-08-19',
    timeOfOccurrence: '15:22:10 CST',
    employeeTrackId: 'TRACK_P042',
    jobTitle: 'Heavy Arc Welder Tier II',
    departmentZone: 'Weld Cell 3 - Line A',
    cameraId: 'CAM-EHS-042',
    anatomicalZone: 'HEAD',
    ppeClassViolated: 'head_nohelmet',
    oshaStandardCitation: '29 CFR 1910.135(a)(1)',
    descriptionOfHazard: 'Employee entered heavy overhead gantry crane envelope without ANSI Z89.1 certified Type II hard hat during active steel beam transit.',
    severityClassification: 'NEAR_MISS_CRITICAL',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'ACTIVE_ENFORCED',
    correctiveActionTaken: 'Automated 110dB floor beacon fired. Work ceased immediately. Worker re-issued ventilated fiberglass shell; 15-min safety standdown conducted.',
    supervisorSignOff: 'Elena Rostova (EHS Lead)',
    closureStatus: 'CLOSED_REMEDIATED',
  },
  {
    caseNumber: 'OSHA-2026-0842',
    dateOfOccurrence: '2026-08-19',
    timeOfOccurrence: '18:47:33 CST',
    employeeTrackId: 'TRACK_P019',
    jobTitle: 'Chemical Bath Operator',
    departmentZone: 'Acid Dip Tank & Wash Bay',
    cameraId: 'CAM-EHS-043',
    anatomicalZone: 'FACIAL',
    ppeClassViolated: 'face_nomask',
    oshaStandardCitation: '29 CFR 1910.134(a)(2)',
    descriptionOfHazard: 'Respirator removed during chemical washdown phase exceeding 50ppm acid vapor threshold in restricted containment booth.',
    severityClassification: 'RECORDABLE_INSPECTION',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'ACTIVE_ENFORCED',
    correctiveActionTaken: 'Exhaust fan interlock engaged. Worker removed to clean room for pulmonary baseline check; cartridge filter replaced.',
    supervisorSignOff: 'Marcus Vance (CSP)',
    closureStatus: 'CLOSED_REMEDIATED',
  },
  {
    caseNumber: 'OSHA-2026-0843',
    dateOfOccurrence: '2026-08-18',
    timeOfOccurrence: '03:14:02 CST',
    employeeTrackId: 'TRACK_P088',
    jobTitle: 'Forklift Logistics Handler',
    departmentZone: 'Loading Dock North - Staging',
    cameraId: 'CAM-EHS-044',
    anatomicalZone: 'EXTREMITIES',
    ppeClassViolated: 'shoes',
    oshaStandardCitation: '29 CFR 1910.136(a)',
    descriptionOfHazard: 'Worker observed in active freight staging area with non-compliant athletic footwear instead of ASTM F2413-18 rated steel-toe protective boots.',
    severityClassification: 'ZONE_RESTRICTION',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'ACTIVE_ENFORCED',
    correctiveActionTaken: 'Worker reassigned to administrative check-in until compliant metatarsal safety boots procured from tool crib.',
    supervisorSignOff: 'Devon Kincaid',
    closureStatus: 'CLOSED_REMEDIATED',
  },
  {
    caseNumber: 'OSHA-2026-0844',
    dateOfOccurrence: '2026-08-17',
    timeOfOccurrence: '11:05:44 CST',
    employeeTrackId: 'TRACK_P104',
    jobTitle: 'Maintenance Technician',
    departmentZone: 'Assembly Line 1 - Conveyor',
    cameraId: 'CAM-EHS-045',
    anatomicalZone: 'EXTREMITIES',
    ppeClassViolated: 'hand_noglove',
    oshaStandardCitation: '29 CFR 1910.138(a)',
    descriptionOfHazard: 'Handling sharp sheet metal stampings with bare hands near automated pinch points.',
    severityClassification: 'FIRST_AID_POTENTIAL',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'ACTIVE_ENFORCED',
    correctiveActionTaken: 'Supervisor intervened in 28 seconds via mobile alert. Kevlar Cut-Level A4 gloves provided immediately.',
    supervisorSignOff: 'Marcus Vance (CSP)',
    closureStatus: 'CLOSED_REMEDIATED',
  },
  {
    caseNumber: 'OSHA-2026-0845',
    dateOfOccurrence: '2026-08-16',
    timeOfOccurrence: '21:10:19 CST',
    employeeTrackId: 'TRACK_P073',
    jobTitle: 'Sub-assembly Welder',
    departmentZone: 'Weld Cell 3 - Line A',
    cameraId: 'CAM-EHS-042',
    anatomicalZone: 'FACIAL',
    ppeClassViolated: 'face_nomask',
    oshaStandardCitation: '29 CFR 1910.134',
    descriptionOfHazard: 'Facial mask bypassed due to temporary Line 3 custom exemption during ventilation overhaul.',
    severityClassification: 'NEAR_MISS_CRITICAL',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'RULE_BYPASSED_HISTORICAL',
    correctiveActionTaken: 'Monitored as audit-only trail per EHS variance permit #VP-2026-44B.',
    supervisorSignOff: 'Elena Rostova (EHS Lead)',
    closureStatus: 'UNDER_REVIEW',
  },
  {
    caseNumber: 'OSHA-2026-0846',
    dateOfOccurrence: '2026-08-15',
    timeOfOccurrence: '14:32:00 CST',
    employeeTrackId: 'TRACK_P055',
    jobTitle: 'Material Handler',
    departmentZone: 'Overhead Gantry Staging',
    cameraId: 'CAM-EHS-042',
    anatomicalZone: 'UPPER_BODY',
    ppeClassViolated: 'vest',
    oshaStandardCitation: '29 CFR 1926.200 / ANSI 107',
    descriptionOfHazard: 'Worker observed in heavy vehicle corridor without fluorescent high-visibility reflective vest.',
    severityClassification: 'NEAR_MISS_CRITICAL',
    daysRestrictedOrLost: 0,
    monitoringConfigState: 'ACTIVE_ENFORCED',
    correctiveActionTaken: 'Zone supervisor audio announcement triggered. Class 2 safety vest donned.',
    supervisorSignOff: 'Elena Rostova (EHS Lead)',
    closureStatus: 'CLOSED_REMEDIATED',
  },
];

export const OSHA_SUMMARY_STATS: OshaSummaryStats = {
  reportingPeriod: 'Q3 2026 EHS Operational Audit (Aug 1 - Aug 20)',
  companyName: 'AeroHeavy Industrial Global',
  facilityCode: 'GF-04-AERO (Austin, TX)',
  totalHoursWorked: 61760,
  totalNearMissesDetected: 148,
  activeViolationsLogged: 114,
  bypassedViolationsSuppressed: 34,
  trirEquivalentRate: 0.369, // near-miss proxy
  dartEquivalentRate: 0.0,
  violationSeverityIndex: 1.42,
  mttaAverageSeconds: 41.2,
  correctiveActionClosurePct: 96.8,
};

// Low-Confidence Active Learning Uncertainty Pool (0.35 < Conf < 0.55)
export const INITIAL_ACTIVE_LEARNING_CANDIDATES: ActiveLearningCandidate[] = [
  {
    id: 'alc-001',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_0912',
    cameraId: 'CAM-EHS-042',
    cameraName: 'Weld Cell 3 - Line A Gantry',
    zoneCode: 'ZONE-ARC-HAZARD-01',
    timestamp: '2026-08-20T09:12:44Z',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'HEAD',
    predictedClass: 'head_nohelmet',
    initialConfidence: 0.46,
    bboxInitial: [0.38, 0.20, 0.14, 0.16],
    uncertaintyReason: 'GLARE_REFLECTION',
    triageStatus: 'PENDING_REVIEW',
    notes: 'Intense TIG welding arc glare reflection over hardhat brim created false positive bare head prediction.',
  },
  {
    id: 'alc-002',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_1045',
    cameraId: 'CAM-EHS-043',
    cameraName: 'Acid Washdown Bay B-2',
    zoneCode: 'ZONE-ACID-BATH-C2',
    timestamp: '2026-08-20T10:45:12Z',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'FACIAL',
    predictedClass: 'face_nomask',
    initialConfidence: 0.42,
    bboxInitial: [0.41, 0.26, 0.12, 0.14],
    uncertaintyReason: 'PARTIAL_OCCLUSION',
    triageStatus: 'PENDING_REVIEW',
    notes: 'Worker turned profile 60 degrees; transparent full-face chemical shield partially occluded by steam.',
  },
  {
    id: 'alc-003',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_1130',
    cameraId: 'CAM-EHS-044',
    cameraName: 'Loading Dock 02 Freight',
    zoneCode: 'ZONE-SUSPENDED-LOAD-01',
    timestamp: '2026-08-20T11:30:05Z',
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'UPPER_BODY',
    predictedClass: 'vest',
    initialConfidence: 0.51,
    bboxInitial: [0.35, 0.35, 0.22, 0.32],
    uncertaintyReason: 'NON_STANDARD_GEAR',
    triageStatus: 'PENDING_REVIEW',
    notes: 'Two-tone fluorescent orange/yellow winter jacket with segmented retroreflective tape pattern.',
  },
  {
    id: 'alc-004',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_1318',
    cameraId: 'CAM-EHS-045',
    cameraName: 'Assembly Line Conveyor West',
    zoneCode: 'ZONE-ASSEMBLY-WEST',
    timestamp: '2026-08-20T13:18:22Z',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'EXTREMITIES',
    predictedClass: 'hand_noglove',
    initialConfidence: 0.48,
    bboxInitial: [0.32, 0.54, 0.12, 0.15],
    uncertaintyReason: 'MOTION_BLUR',
    triageStatus: 'PENDING_REVIEW',
    notes: 'Rapid pneumatic torque tool rotation caused motion blur on black nitrile grip gloves.',
  },
  {
    id: 'alc-005',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_1402',
    cameraId: 'CAM-EHS-044',
    cameraName: 'Loading Dock 02 Freight',
    zoneCode: 'ZONE-SUSPENDED-LOAD-01',
    timestamp: '2026-08-20T14:02:51Z',
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'EXTREMITIES',
    predictedClass: 'shoes',
    initialConfidence: 0.39,
    bboxInitial: [0.36, 0.74, 0.18, 0.16],
    uncertaintyReason: 'UNUSUAL_ANGLE',
    triageStatus: 'PENDING_REVIEW',
    notes: 'Muddy brown composite-toe boots classified as street shoes due to overhead downward camera perspective.',
  },
  {
    id: 'alc-006',
    sampleUid: 'SAMPLE_UNCERTAIN_20260820_1540',
    cameraId: 'CAM-EHS-042',
    cameraName: 'Weld Cell 3 - Line A Gantry',
    zoneCode: 'ZONE-ARC-HAZARD-01',
    timestamp: '2026-08-20T15:40:19Z',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1000&q=80',
    anatomicalZone: 'HEAD',
    predictedClass: 'head_helmet',
    initialConfidence: 0.52,
    bboxInitial: [0.37, 0.18, 0.15, 0.16],
    uncertaintyReason: 'PARTIAL_OCCLUSION',
    triageStatus: 'CONFIRMED_TRUE_POSITIVE',
    correctedClass: 'head_helmet',
    labelAssistConfidence: 0.984,
    labelAssistModel: 'Gemini-2.5-Flash-Vision-Teacher',
    reviewedBy: 'Elena Rostova',
    reviewedAt: '2026-08-20T16:00:00Z',
    notes: 'Confirmed 3M Speedglas 9100 auto-darkening welding helmet with integrated bump cap.',
  },
];

export const DEFAULT_RETRAIN_MANIFEST: RetrainDatasetManifest = {
  version: 'v2.4.0-rc3',
  datasetName: 'ehs_sentinel_yolov9_curated_edge_v2.4',
  totalSamples: 1840,
  trainCount: 1472, // 80%
  valCount: 276,   // 15%
  testCount: 92,   // 5%
  classDistribution: {
    head_helmet: 340,
    head_nohelmet: 195,
    glasses: 210,
    face_mask: 185,
    face_nomask: 140,
    vest: 290,
    person: 420,
    hand_glove: 160,
    hand_noglove: 130,
    boots: 220,
    shoes: 110,
  },
  projectedMapImprovement: 3.8, // +3.8% mAP@50-95
  generatedAt: '2026-08-20T16:15:00Z',
  exportFormat: 'YOLOV9_DARKNET',
  dataYamlContent: `# EHS Sentinel YOLOv9-e Dataset Specification
# Auto-generated by Active Learning Pipeline
# Date: 2026-08-20T16:15:00Z
path: /opt/datasets/ehs_ppe_v2.4
train: images/train
val: images/val
test: images/test

# 11 Industrial Classes (4 Anatomical Zones)
nc: 11
names: [
  'head_helmet',    # 0 - Compliant (Head)
  'head_nohelmet',  # 1 - Violation (Head)
  'glasses',        # 2 - Compliant (Facial)
  'face_mask',      # 3 - Compliant (Facial)
  'face_nomask',    # 4 - Violation (Facial)
  'vest',           # 5 - Compliant (Upper Body)
  'person',         # 6 - Worker Spatial Anchor
  'hand_glove',     # 7 - Compliant (Extremities)
  'hand_noglove',   # 8 - Violation (Extremities)
  'boots',          # 9 - Compliant (Footwear)
  'shoes'           # 10 - Violation (Footwear)
]

# Active Learning Hard Sample Weighting
sample_weights:
  low_confidence_uncertainty: 1.75
  false_positive_remediated: 2.20
  night_shift_glare_boost: 1.40
`,
};
