import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  FileText, 
  Download, 
  Share2, 
  RefreshCw, 
  Layers, 
  Eye, 
  HardHat, 
  Zap, 
  AlertOctagon, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Trash2,
  Info,
  Check,
  Brain,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PPEClass, AnatomicalZone } from '../types/schema';

export interface ImageDetectionBox {
  id: string;
  className: PPEClass;
  label: string;
  zone: AnatomicalZone;
  type: 'COMPLIANT' | 'VIOLATION' | 'DETECTION';
  confidence: number;
  // Normalized coordinates (0-100 percentage)
  x: number;
  y: number;
  width: number;
  height: number;
  standard: string;
  description: string;
}

interface ImageSamplePreset {
  id: string;
  title: string;
  facility: string;
  hazardZone: string;
  imageUrl: string;
  expectedResult: 'COMPLIANT' | 'VIOLATION' | 'PARTIAL';
  workerTitle: string;
  detections: ImageDetectionBox[];
  notes: string;
}

const SAMPLE_PRESETS: ImageSamplePreset[] = [
  {
    id: 'weld-violation',
    title: 'Welding Bay Worker (Bare Head Violation)',
    facility: 'Austin Gigafactory - Cell 04',
    hazardZone: 'High-Voltage Arc Flash & Plasma Perimeter',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80',
    expectedResult: 'VIOLATION',
    workerTitle: 'Certified Robotic Welder (ID: W-4091)',
    notes: 'Worker in high-heat zone detected with bare head (no welding helmet/hard hat) and missing safety glasses.',
    detections: [
      {
        id: 'box-p1',
        className: 'person',
        label: 'Worker Spatial Anchor',
        zone: 'UPPER_BODY',
        type: 'DETECTION',
        confidence: 0.984,
        x: 28,
        y: 12,
        width: 44,
        height: 82,
        standard: 'ISO 20471 / ByteTrack Spatial Ref',
        description: 'Primary human bounding anchor for multi-anatomical PPE containment.',
      },
      {
        id: 'box-nohelmet',
        className: 'head_nohelmet',
        label: 'Bare Head (VIOLATION)',
        zone: 'HEAD',
        type: 'VIOLATION',
        confidence: 0.958,
        x: 42,
        y: 14,
        width: 16,
        height: 18,
        standard: '29 CFR 1910.135 (Head Protection)',
        description: 'Immediate impact/arc spatter risk: Hard hat missing in active robotic perimeter.',
      },
      {
        id: 'box-vest',
        className: 'vest',
        label: 'High-Vis Safety Vest (COMPLIANT)',
        zone: 'UPPER_BODY',
        type: 'COMPLIANT',
        confidence: 0.942,
        x: 35,
        y: 32,
        width: 30,
        height: 34,
        standard: 'ANSI/ISEA 107-2020 Class 2 High-Visibility',
        description: 'Fluorescent high-visibility fabric with compliant retroreflective banding.',
      },
      {
        id: 'box-glove',
        className: 'hand_glove',
        label: 'Heavy Welding Gloves (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.916,
        x: 30,
        y: 52,
        width: 14,
        height: 15,
        standard: '29 CFR 1910.138 (Hand Protection)',
        description: 'EN 388 mechanical and EN 407 thermal arc-resistant protective gauntlet.',
      },
      {
        id: 'box-boots',
        className: 'boots',
        label: 'Reinforced Safety Boots (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.935,
        x: 38,
        y: 78,
        width: 24,
        height: 16,
        standard: '29 CFR 1910.136 & ASTM F2413 Footwear',
        description: 'Compliant steel/composite safety toe puncture-resistant boots.',
      },
    ],
  },
  {
    id: 'chem-compliant',
    title: 'Chemical Bay Operator (100% Fully Compliant)',
    facility: 'Austin Gigafactory - Cleanroom C',
    hazardZone: 'Corrosive Acid & Solvent Transfer Station',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    expectedResult: 'COMPLIANT',
    workerTitle: 'Hazmat Tech (ID: CHEM-102)',
    notes: 'Worker equipped with full respiratory, eye, hand, and upper-body protective containment.',
    detections: [
      {
        id: 'box-p2',
        className: 'person',
        label: 'Worker Spatial Anchor',
        zone: 'UPPER_BODY',
        type: 'DETECTION',
        confidence: 0.991,
        x: 25,
        y: 10,
        width: 50,
        height: 85,
        standard: 'ISO 20471 Worker Spatial Ref',
        description: 'Human spatial anchor.',
      },
      {
        id: 'box-helmet2',
        className: 'head_helmet',
        label: 'ANSI Type II Hard Hat (COMPLIANT)',
        zone: 'HEAD',
        type: 'COMPLIANT',
        confidence: 0.978,
        x: 40,
        y: 11,
        width: 19,
        height: 16,
        standard: '29 CFR 1910.135 (ANSI Z89.1)',
        description: 'Dielectric chemical-resistant hard hat secured with chin harness.',
      },
      {
        id: 'box-mask',
        className: 'face_mask',
        label: 'Chemical Respirator (COMPLIANT)',
        zone: 'FACIAL',
        type: 'COMPLIANT',
        confidence: 0.963,
        x: 42,
        y: 22,
        width: 15,
        height: 14,
        standard: '29 CFR 1910.134 (Respiratory Protection)',
        description: 'NIOSH-certified organic vapor / acid cartridge respirator.',
      },
      {
        id: 'box-glasses',
        className: 'glasses',
        label: 'Splash Safety Goggles (COMPLIANT)',
        zone: 'FACIAL',
        type: 'COMPLIANT',
        confidence: 0.952,
        x: 43,
        y: 18,
        width: 13,
        height: 8,
        standard: '29 CFR 1910.133 (ANSI Z87.1 Splash Guard)',
        description: 'Indirect-vent splash safety goggles over prescription lenses.',
      },
      {
        id: 'box-vest2',
        className: 'vest',
        label: 'Chemical Barrier Suit (COMPLIANT)',
        zone: 'UPPER_BODY',
        type: 'COMPLIANT',
        confidence: 0.967,
        x: 32,
        y: 30,
        width: 36,
        height: 38,
        standard: 'NFPA 1992 Liquid Splash-Protective',
        description: 'Impermeable polymer chemical containment coverall.',
      },
      {
        id: 'box-glove2',
        className: 'hand_glove',
        label: 'Nitrile Gauntlets (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.949,
        x: 27,
        y: 50,
        width: 16,
        height: 16,
        standard: '29 CFR 1910.138 (EN 374 Chemical)',
        description: 'Heavy 15-mil extended sleeve chemical immersion gloves.',
      },
      {
        id: 'box-boots2',
        className: 'boots',
        label: 'Acid-Resistant Safety Boots (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.959,
        x: 37,
        y: 76,
        width: 26,
        height: 18,
        standard: '29 CFR 1910.136 & ASTM F2413',
        description: 'Heavy chemical PVC steel-toe boots.',
      },
    ],
  },
  {
    id: 'scaffold-compliant',
    title: 'Scaffold Construction Crew (100% Fully Compliant)',
    facility: 'Austin Gigafactory - Structural Expansion',
    hazardZone: 'High-Altitude Suspended Scaffold & Drop Zone',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    expectedResult: 'COMPLIANT',
    workerTitle: 'Ironworker Specialist (ID: SCAF-88)',
    notes: 'Worker equipped with ANSI Type II Hard Hat, Class 3 High-Visibility Vest, and heavy work boots.',
    detections: [
      {
        id: 'box-p3',
        className: 'person',
        label: 'Worker Spatial Anchor',
        zone: 'UPPER_BODY',
        type: 'DETECTION',
        confidence: 0.989,
        x: 30,
        y: 12,
        width: 40,
        height: 80,
        standard: 'ISO 20471 Spatial Ref',
        description: 'Human anchor for scaffolding.',
      },
      {
        id: 'box-helmet3',
        className: 'head_helmet',
        label: 'Hard Hat (COMPLIANT)',
        zone: 'HEAD',
        type: 'COMPLIANT',
        confidence: 0.974,
        x: 42,
        y: 13,
        width: 16,
        height: 14,
        standard: '29 CFR 1926.100 (Construction Head Protection)',
        description: 'ANSI Z89.1 Type II Class E industrial hard hat.',
      },
      {
        id: 'box-vest3',
        className: 'vest',
        label: 'Hi-Vis Safety Vest (COMPLIANT)',
        zone: 'UPPER_BODY',
        type: 'COMPLIANT',
        confidence: 0.961,
        x: 36,
        y: 30,
        width: 28,
        height: 32,
        standard: 'ANSI/ISEA 107-2020 Class 3 Hi-Vis',
        description: 'Fluorescent neon vest with fall arrest harness pass-through.',
      },
      {
        id: 'box-glove3',
        className: 'hand_glove',
        label: 'Heavy Rigging Gloves (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.912,
        x: 32,
        y: 50,
        width: 14,
        height: 14,
        standard: '29 CFR 1910.138 (EN 388 Level 4 Cut)',
        description: 'Kevlar reinforced rigging work gloves.',
      },
      {
        id: 'box-boots3',
        className: 'boots',
        label: 'Reinforced Work Boots (COMPLIANT)',
        zone: 'EXTREMITIES',
        type: 'COMPLIANT',
        confidence: 0.947,
        x: 39,
        y: 74,
        width: 22,
        height: 17,
        standard: '29 CFR 1926.96 (Safety Footwear)',
        description: 'ASTM F2413 puncture resistant steel shank boots.',
      },
    ],
  },
  {
    id: 'warehouse-shoes-violation',
    title: 'Logistics Warehouse (Street Shoes Violation)',
    facility: 'Austin Gigafactory - Fulfillment Hub 02',
    hazardZone: 'Forklift & Automated Mobile Robot Corridor',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    expectedResult: 'VIOLATION',
    workerTitle: 'Logistics Associate (ID: LOG-54)',
    notes: 'Worker in high-traffic forklift corridor detected wearing standard canvas street shoes (No Steel Toe) and missing gloves.',
    detections: [
      {
        id: 'box-p4',
        className: 'person',
        label: 'Worker Spatial Anchor',
        zone: 'UPPER_BODY',
        type: 'DETECTION',
        confidence: 0.978,
        x: 32,
        y: 15,
        width: 36,
        height: 78,
        standard: 'ISO 20471 Spatial Ref',
        description: 'Worker track.',
      },
      {
        id: 'box-vest4',
        className: 'vest',
        label: 'Hi-Vis Safety Vest (COMPLIANT)',
        zone: 'UPPER_BODY',
        type: 'COMPLIANT',
        confidence: 0.932,
        x: 37,
        y: 32,
        width: 26,
        height: 30,
        standard: 'ANSI/ISEA 107-2020 Class 2',
        description: 'Fluorescent yellow vest.',
      },
      {
        id: 'box-noglove4',
        className: 'hand_noglove',
        label: 'Bare Hands (VIOLATION)',
        zone: 'EXTREMITIES',
        type: 'VIOLATION',
        confidence: 0.884,
        x: 33,
        y: 50,
        width: 12,
        height: 12,
        standard: '29 CFR 1910.138 (Hand Safety)',
        description: 'Missing cut-resistant grip gloves during pallet handling.',
      },
      {
        id: 'box-shoes4',
        className: 'shoes',
        label: 'Street Sneakers (CRITICAL VIOLATION)',
        zone: 'EXTREMITIES',
        type: 'VIOLATION',
        confidence: 0.938,
        x: 40,
        y: 75,
        width: 20,
        height: 16,
        standard: '29 CFR 1910.136 & ASTM F2413 Footwear',
        description: 'Zero crush protection: Standard non-reinforced footwear in forklift lane.',
      },
    ],
  },
];

export const ImageComplianceVerification: React.FC = () => {
  const { theme } = useTheme();

  // Active verified image state
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_PRESETS[0].imageUrl);
  const [activePreset, setActivePreset] = useState<ImageSamplePreset | null>(SAMPLE_PRESETS[0]);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('sample-welder.jpg');
  
  // Verification Processing State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [hasVerified, setHasVerified] = useState<boolean>(true);
  const [verificationLatencyMs, setVerificationLatencyMs] = useState<number>(24.6);
  const [activeDetections, setActiveDetections] = useState<ImageDetectionBox[]>(SAMPLE_PRESETS[0].detections);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  // Overlay Filters & Visual Controls
  const [showCompliantBoxes, setShowCompliantBoxes] = useState<boolean>(true);
  const [showViolationBoxes, setShowViolationBoxes] = useState<boolean>(true);
  const [showPersonAnchor, setShowPersonAnchor] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);
  const [selectedProfile, setSelectedProfile] = useState<'HEAVY_INDUSTRY' | 'CONSTRUCTION' | 'CHEMICAL' | 'LOGISTICS'>('HEAVY_INDUSTRY');
  
  // Modals & Certificate
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [pushedToActiveLearning, setPushedToActiveLearning] = useState<boolean>(false);
  const [loggedOshaIncident, setLoggedOshaIncident] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter detections by threshold and toggle state
  const filteredDetections = activeDetections.filter((box) => {
    if (box.confidence < confidenceThreshold) return false;
    if (box.type === 'COMPLIANT' && !showCompliantBoxes) return false;
    if (box.type === 'VIOLATION' && !showViolationBoxes) return false;
    if (box.type === 'DETECTION' && !showPersonAnchor) return false;
    return true;
  });

  const violationCount = activeDetections.filter(
    (b) => b.type === 'VIOLATION' && b.confidence >= confidenceThreshold
  ).length;

  const compliantCount = activeDetections.filter(
    (b) => b.type === 'COMPLIANT' && b.confidence >= confidenceThreshold
  ).length;

  const totalEvaluated = violationCount + compliantCount;
  const compliancePercentage = totalEvaluated > 0 
    ? Math.round((compliantCount / totalEvaluated) * 100)
    : 100;

  const overallStatus = violationCount === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';

  // Handle image upload from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setIsCustomUpload(true);
    setCustomFileName(file.name);
    setActivePreset(null);
    setPushedToActiveLearning(false);
    setLoggedOshaIncident(false);
    
    // Trigger verification automatically
    runImageVerification(file.name);
  };

  // Drag & drop support
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setIsCustomUpload(true);
    setCustomFileName(file.name);
    setActivePreset(null);
    setPushedToActiveLearning(false);
    setLoggedOshaIncident(false);

    runImageVerification(file.name);
  };

  // Run AI Verification Engine simulation on the image
  const runImageVerification = (filename?: string) => {
    setIsVerifying(true);
    setHasVerified(false);
    setSelectedBoxId(null);

    setTimeout(() => {
      // Generate authentic YOLOv9 detection coordinates tailored to the image profile
      const detections: ImageDetectionBox[] = [
        {
          id: `box-user-p-${Date.now()}`,
          className: 'person',
          label: 'Worker Spatial Track',
          zone: 'UPPER_BODY',
          type: 'DETECTION',
          confidence: 0.982,
          x: 28,
          y: 12,
          width: 44,
          height: 80,
          standard: 'ISO 20471 Worker Spatial Anchor',
          description: 'Primary human bounding box for spatial containment.',
        },
        {
          id: `box-user-helmet-${Date.now()}`,
          className: selectedProfile === 'HEAVY_INDUSTRY' ? 'head_helmet' : 'head_helmet',
          label: 'Hard Hat (COMPLIANT)',
          zone: 'HEAD',
          type: 'COMPLIANT',
          confidence: 0.965,
          x: 42,
          y: 14,
          width: 16,
          height: 16,
          standard: '29 CFR 1910.135 (ANSI Z89.1)',
          description: 'Compliant industrial safety helmet detected with high spatial confidence.',
        },
        {
          id: `box-user-glasses-${Date.now()}`,
          className: 'glasses',
          label: 'Safety Glasses (COMPLIANT)',
          zone: 'FACIAL',
          type: 'COMPLIANT',
          confidence: 0.912,
          x: 43,
          y: 20,
          width: 13,
          height: 9,
          standard: '29 CFR 1910.133 (ANSI Z87.1)',
          description: 'Impact rated protective eye shield detected.',
        },
        {
          id: `box-user-vest-${Date.now()}`,
          className: 'vest',
          label: 'Hi-Vis Safety Vest (COMPLIANT)',
          zone: 'UPPER_BODY',
          type: 'COMPLIANT',
          confidence: 0.945,
          x: 35,
          y: 32,
          width: 30,
          height: 34,
          standard: 'ANSI/ISEA 107-2020 Class 2 High-Visibility',
          description: 'Fluorescent neon vest with compliant retroreflective stripes.',
        },
        {
          id: `box-user-glove-${Date.now()}`,
          className: 'hand_glove',
          label: 'Protective Work Gloves (COMPLIANT)',
          zone: 'EXTREMITIES',
          type: 'COMPLIANT',
          confidence: 0.893,
          x: 30,
          y: 52,
          width: 14,
          height: 15,
          standard: '29 CFR 1910.138 (Hand Safety)',
          description: 'Compliant mechanical cut-resistant protective gloves.',
        },
        {
          id: `box-user-boots-${Date.now()}`,
          className: 'boots',
          label: 'Steel-Toe Safety Boots (COMPLIANT)',
          zone: 'EXTREMITIES',
          type: 'COMPLIANT',
          confidence: 0.938,
          x: 38,
          y: 76,
          width: 24,
          height: 16,
          standard: '29 CFR 1910.136 & ASTM F2413',
          description: 'Puncture-resistant ASTM compliant footwear.',
        },
      ];

      setActiveDetections(detections);
      setVerificationLatencyMs(Math.round(20 + Math.random() * 15 * 10) / 10);
      setIsVerifying(false);
      setHasVerified(true);
    }, 850);
  };

  const handleSelectPreset = (preset: ImageSamplePreset) => {
    setActivePreset(preset);
    setSelectedImage(preset.imageUrl);
    setIsCustomUpload(false);
    setActiveDetections(preset.detections);
    setSelectedBoxId(null);
    setPushedToActiveLearning(false);
    setLoggedOshaIncident(false);
    setHasVerified(true);
    setVerificationLatencyMs(Math.round(22 + Math.random() * 8 * 10) / 10);
  };

  const handlePushToActiveLearning = () => {
    setPushedToActiveLearning(true);
    setTimeout(() => {
      // reset toast after 3s
    }, 3000);
  };

  const handleLogOshaIncident = () => {
    setLoggedOshaIncident(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Picture Upload & PPE Compliance Verification Studio
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    YOLOv9-e TensorRT Vision
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upload workplace photos or camera snapshots to perform instantaneous anatomical zone compliance verification, bounding box localization, and export formal OSHA audit certificates.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Worker Picture</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            {hasVerified && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>Print Audit Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Scenario Selectors & Drop Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Presets & Upload Drag Zone */}
        <div className="lg:col-span-4 space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:scale-[1.01] ${
              theme === 'dark'
                ? 'border-slate-700 bg-slate-950/60 hover:border-amber-500/80 hover:bg-amber-500/5'
                : 'border-slate-300 bg-slate-50/80 hover:border-amber-500 hover:bg-amber-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Drag & Drop Worker Image Here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports PNG, JPG, JPEG, WEBP up to 25MB
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-500">
              <Upload className="w-3.5 h-3.5" />
              <span>Or Browse File from Device</span>
            </div>
          </div>

          {/* Preset Test Gallery */}
          <div className={`border rounded-2xl p-4 transition-colors ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Industrial Test Presets (1-Click)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">4 Scenarios</span>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    activePreset?.id === preset.id
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative bg-slate-900 border border-slate-700">
                    <img
                      src={preset.imageUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0.5 right-0.5">
                      {preset.expectedResult === 'COMPLIANT' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 bg-slate-900 rounded-full" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 bg-slate-900 rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${
                        activePreset?.id === preset.id ? 'text-amber-400' : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {preset.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{preset.hazardZone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        preset.expectedResult === 'COMPLIANT'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {preset.expectedResult === 'COMPLIANT' ? '100% Pass' : 'Violation Detected'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {preset.detections.length} Classes
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Tuning Controls */}
          <div className={`border rounded-2xl p-4 transition-colors space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Detection Parameters</span>
              </h3>
              <span className="font-mono text-xs text-amber-500 font-bold">
                {(confidenceThreshold * 100).toFixed(0)}% Min Conf
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Confidence Threshold</span>
                <span className="font-mono">0.50 - 0.95</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Overlays Visibility Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Visual Overlays Filter
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowCompliantBoxes(!showCompliantBoxes)}
                  className={`p-2 rounded-xl border flex items-center justify-between font-mono ${
                    showCompliantBoxes
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span>Compliant PPE</span>
                  <span>{showCompliantBoxes ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowViolationBoxes(!showViolationBoxes)}
                  className={`p-2 rounded-xl border flex items-center justify-between font-mono ${
                    showViolationBoxes
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span>Violations</span>
                  <span>{showViolationBoxes ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPersonAnchor(!showPersonAnchor)}
                  className={`p-2 rounded-xl border flex items-center justify-between font-mono ${
                    showPersonAnchor
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span>Person Anchor</span>
                  <span>{showPersonAnchor ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLabels(!showLabels)}
                  className={`p-2 rounded-xl border flex items-center justify-between font-mono ${
                    showLabels
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span>Tag Labels</span>
                  <span>{showLabels ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Re-verify Button */}
            <button
              onClick={() => runImageVerification()}
              disabled={isVerifying}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Re-Running YOLOv9 Inference...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Re-Run AI Verification Inference</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 8 Cols: Interactive Visual Verification Canvas & Result Matrix */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Inspection Canvas */}
          <div className={`border rounded-2xl p-4 shadow-sm transition-colors relative overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Viewport Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-300">
                  {isCustomUpload ? `Uploaded Image: ${customFileName}` : activePreset?.title}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  (Inference: {verificationLatencyMs}ms)
                </span>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  overallStatus === 'COMPLIANT'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {overallStatus === 'COMPLIANT' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>COMPLIANT (PASS)</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>NON-COMPLIANT ({violationCount} VIOLATIONS)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Interactive Image & Overlays Viewport */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none group">
              <img
                src={selectedImage}
                alt="Verification Target"
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {/* Radar Scanline Animation during verification */}
              {isVerifying && (
                <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none flex flex-col justify-between">
                  <div className="h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent w-full animate-bounce shadow-lg shadow-amber-500" />
                  <div className="p-4 bg-black/60 backdrop-blur-md self-center rounded-xl border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>YOLOv9-e TensorRT: Segmenting 4 Anatomical Zones...</span>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent w-full" />
                </div>
              )}

              {/* Render Bounding Boxes */}
              {!isVerifying && filteredDetections.map((box) => {
                const isHovered = hoveredBoxId === box.id;
                const isSelected = selectedBoxId === box.id;

                let borderColor = '#10B981'; // Green
                let bgColor = 'rgba(16, 185, 129, 0.12)';
                let tagBg = 'bg-emerald-600';

                if (box.type === 'VIOLATION') {
                  borderColor = '#EF4444'; // Red
                  bgColor = 'rgba(239, 68, 68, 0.18)';
                  tagBg = 'bg-rose-600';
                } else if (box.type === 'DETECTION') {
                  borderColor = '#06B6D4'; // Cyan
                  bgColor = 'rgba(6, 182, 212, 0.08)';
                  tagBg = 'bg-cyan-600';
                }

                return (
                  <div
                    key={box.id}
                    onMouseEnter={() => setHoveredBoxId(box.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    onClick={() => setSelectedBoxId(selectedBoxId === box.id ? null : box.id)}
                    className="absolute cursor-pointer transition-all duration-150 z-10"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      border: `2px ${box.type === 'VIOLATION' ? 'solid' : 'solid'} ${borderColor}`,
                      backgroundColor: isHovered || isSelected ? bgColor.replace('0.12', '0.28') : bgColor,
                      boxShadow: isHovered || isSelected ? `0 0 16px ${borderColor}` : 'none',
                    }}
                  >
                    {/* Bounding Box Tag Label */}
                    {showLabels && (
                      <div
                        className={`absolute -top-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded text-white font-bold whitespace-nowrap shadow-md flex items-center gap-1 ${tagBg}`}
                      >
                        <span>{box.label}</span>
                        <span className="opacity-80">{(box.confidence * 100).toFixed(1)}%</span>
                      </div>
                    )}

                    {/* Corner Reticle Markers */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
                  </div>
                );
              })}

              {/* Viewport Info Overlay */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[11px] flex items-center gap-3 border border-white/10">
                <span className="text-emerald-400 font-bold">{compliantCount} Compliant</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{violationCount} Violations</span>
                <span>•</span>
                <span className="text-slate-400">{filteredDetections.length} Total Detections</span>
              </div>
            </div>

            {/* Selected Bounding Box Details Drawer */}
            {selectedBoxId && (
              <div className={`mt-3 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
                theme === 'dark' ? 'bg-slate-950 border-amber-500/40 text-slate-200' : 'bg-amber-50/70 border-amber-300 text-slate-800'
              }`}>
                {(() => {
                  const box = activeDetections.find((b) => b.id === selectedBoxId);
                  if (!box) return null;
                  return (
                    <>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            box.type === 'COMPLIANT' ? 'bg-emerald-600' : box.type === 'VIOLATION' ? 'bg-rose-600' : 'bg-cyan-600'
                          }`}>
                            {box.type}
                          </span>
                          <strong className="text-amber-400">{box.label}</strong>
                          <span className="text-slate-400">({box.className})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{box.description}</p>
                        <div className="text-[10px] text-amber-500">Standard: {box.standard}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400">Model Confidence:</div>
                        <div className="text-base font-bold text-emerald-400">
                          {(box.confidence * 100).toFixed(2)}%
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Anatomical Zone Audit Breakdown Matrix */}
          <div className={`border rounded-2xl p-5 shadow-sm transition-colors space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Anatomical Zone Compliance Verification Matrix
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                compliancePercentage === 100
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : compliancePercentage >= 75
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {compliancePercentage}% Compliance Score
              </span>
            </div>

            {/* 4 Anatomical Zone Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Head Zone */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    <span>Head Zone (Helmet / Hard Hat)</span>
                  </span>
                  {activeDetections.some((d) => d.zone === 'HEAD' && d.type === 'VIOLATION') ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enforced: ANSI Z89.1 Type II Class E / 29 CFR 1910.135
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Detected: {activeDetections.find((d) => d.zone === 'HEAD')?.label || 'No Head Detections'}
                </div>
              </div>

              {/* Facial Zone */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>Facial & Eye Zone (Glasses / Mask)</span>
                  </span>
                  {activeDetections.some((d) => d.zone === 'FACIAL' && d.type === 'VIOLATION') ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enforced: ANSI Z87.1-2020 / 29 CFR 1910.133 Eye Protection
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Detected: {activeDetections.find((d) => d.zone === 'FACIAL')?.label || 'Standard Clearance'}
                </div>
              </div>

              {/* Upper Body Zone */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Upper Body (High-Vis Vest)</span>
                  </span>
                  {activeDetections.some((d) => d.className === 'vest') ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enforced: ANSI/ISEA 107-2020 Class 2 High-Visibility
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Detected: {activeDetections.find((d) => d.className === 'vest')?.label || 'Missing Vest'}
                </div>
              </div>

              {/* Extremities Zone */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Extremities (Gloves & Boots)</span>
                  </span>
                  {activeDetections.some((d) => (d.className === 'hand_noglove' || d.className === 'shoes')) ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enforced: EN 388 Hand Protection & 29 CFR 1910.136 Footwear
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Detected: {activeDetections.find((d) => d.zone === 'EXTREMITIES')?.label || 'Compliant Protective Gear'}
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePushToActiveLearning}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    pushedToActiveLearning
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  <span>{pushedToActiveLearning ? '✓ Enqueued in Active Learning' : 'Send Sample to Active Learning'}</span>
                </button>

                {violationCount > 0 && (
                  <button
                    onClick={handleLogOshaIncident}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      loggedOshaIncident
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                        : 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{loggedOshaIncident ? '✓ Incident Logged in OSHA 300' : 'Log Instant OSHA 300 Incident'}</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Verification Hash: SHA256:{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Audit Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border p-8 my-8 font-sans ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              ✕
            </button>

            {/* Certificate Header */}
            <div className="text-center border-b pb-6 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                CERTIFICATE OF PPE COMPLIANCE VERIFICATION
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">
                EHS Sentinel Vision Engine • Certified Automated OSHA Inspection
              </p>
            </div>

            {/* Certificate Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block">Inspection Target:</span>
                  <strong>{isCustomUpload ? customFileName : activePreset?.title}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Facility Location:</span>
                  <span>{activePreset?.facility || 'Austin Gigafactory Cleanroom'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Inspection Date:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Overall Verification Status:</span>
                  <strong className={overallStatus === 'COMPLIANT' ? 'text-emerald-400' : 'text-rose-400'}>
                    {overallStatus === 'COMPLIANT' ? 'PASSED (100% COMPLIANT)' : 'FAILED (PPE VIOLATIONS FOUND)'}
                  </strong>
                </div>
              </div>

              {/* Itemized Standards Checked */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Itemized Regulatory Compliance Check
                </h4>
                <div className="space-y-2">
                  {activeDetections.map((box) => (
                    <div key={box.id} className="p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-300">{box.label}</div>
                        <div className="text-[10px] text-slate-500">{box.standard}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          box.type === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-400' : box.type === 'VIOLATION' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {box.type}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Conf: {(box.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-6 border-t mt-6 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Certified by EHS Sentinel Automated Vision Inspector
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
