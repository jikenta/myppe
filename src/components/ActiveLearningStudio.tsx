import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
  Download,
  Upload,
  RefreshCw,
  Cpu,
  Eye,
  Sliders,
  FileCode,
  Tag,
  Wand2,
  HardHat,
  Glasses,
  Footprints,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Package,
  Zap,
  Check,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CameraFeed, PPEClass, AnatomicalZone } from '../types/schema';
import { INITIAL_ACTIVE_LEARNING_CANDIDATES, DEFAULT_RETRAIN_MANIFEST } from '../data/mockAnalyticsData';
import { ActiveLearningCandidate, RetrainDatasetManifest } from '../types/analyticsSchema';
import { useTheme } from '../context/ThemeContext';

interface ActiveLearningStudioProps {
  cameras: CameraFeed[];
}

export const ActiveLearningStudio: React.FC<ActiveLearningStudioProps> = ({ cameras }) => {
  const { theme } = useTheme();

  // Candidates state
  const [candidates, setCandidates] = useState<ActiveLearningCandidate[]>(INITIAL_ACTIVE_LEARNING_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(INITIAL_ACTIVE_LEARNING_CANDIDATES[0].id);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'CONFIRMED' | 'FLAGGED'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | AnatomicalZone>('ALL');

  // Active candidate
  const activeCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  }, [candidates, selectedCandidateId]);

  // AI Label Assist running state
  const [isLabelAssisting, setIsLabelAssisting] = useState<boolean>(false);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [packageSuccess, setPackageSuccess] = useState<boolean>(false);

  // Edit / Override state for active candidate
  const [activeClassSelection, setActiveClassSelection] = useState<PPEClass>(activeCandidate?.predictedClass || 'head_nohelmet');
  const [showTeacherBox, setShowTeacherBox] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Retrain Manifest
  const [manifest, setManifest] = useState<RetrainDatasetManifest>(DEFAULT_RETRAIN_MANIFEST);
  const [activeTab, setActiveTab] = useState<'TRIAGE_QUEUE' | 'DATASET_PACKAGING' | 'YOLO_YAML'>('TRIAGE_QUEUE');

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (zoneFilter !== 'ALL' && c.anatomicalZone !== zoneFilter) return false;
      if (statusFilter === 'PENDING_REVIEW' && c.triageStatus !== 'PENDING_REVIEW') return false;
      if (statusFilter === 'CONFIRMED' && c.triageStatus !== 'CONFIRMED_TRUE_POSITIVE') return false;
      if (statusFilter === 'FLAGGED' && !c.triageStatus.startsWith('FLAGGED')) return false;
      return true;
    });
  }, [candidates, statusFilter, zoneFilter]);

  // Count stats
  const counts = useMemo(() => {
    const pending = candidates.filter((c) => c.triageStatus === 'PENDING_REVIEW').length;
    const confirmed = candidates.filter((c) => c.triageStatus === 'CONFIRMED_TRUE_POSITIVE').length;
    const flaggedFp = candidates.filter((c) => c.triageStatus === 'FLAGGED_FALSE_POSITIVE').length;
    const flaggedFn = candidates.filter((c) => c.triageStatus === 'FLAGGED_FALSE_NEGATIVE').length;
    return { pending, confirmed, flaggedFp, flaggedFn, total: candidates.length };
  }, [candidates]);

  // Execute AI Label Assist (Teacher Model Auto-Annotation)
  const handleRunLabelAssist = () => {
    if (!activeCandidate) return;
    setIsLabelAssisting(true);

    setTimeout(() => {
      setIsLabelAssisting(false);

      // Tighten bbox and correct label
      let correctedClass: PPEClass = activeCandidate.predictedClass;
      let reasonNote = '';

      if (activeCandidate.predictedClass === 'head_nohelmet') {
        correctedClass = 'head_helmet'; // Glare removed, identified helmet
        reasonNote = 'Teacher model resolved welding arc glare. Corrected to ANSI Z89.1 Hard Hat.';
      } else if (activeCandidate.predictedClass === 'face_nomask') {
        correctedClass = 'face_mask';
        reasonNote = 'Profile angle steam reflection resolved. Corrected to FFP3 respirator.';
      } else if (activeCandidate.predictedClass === 'shoes') {
        correctedClass = 'boots';
        reasonNote = 'Overhead camera angle parallax compensated. Identified steel-toe boot lugs.';
      } else if (activeCandidate.predictedClass === 'hand_noglove') {
        correctedClass = 'hand_glove';
        reasonNote = 'Motion blur deconvolution confirmed black nitrile chemical glove.';
      }

      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === activeCandidate.id) {
            return {
              ...c,
              triageStatus: 'CONFIRMED_TRUE_POSITIVE',
              correctedClass,
              labelAssistConfidence: 0.982,
              labelAssistModel: 'Gemini-2.5-Flash-Vision-Teacher',
              reviewedBy: 'AI Label Assist (Auto-Supervised)',
              reviewedAt: new Date().toISOString(),
              notes: reasonNote || c.notes,
            };
          }
          return c;
        })
      );

      setActiveClassSelection(correctedClass);
    }, 1200);
  };

  // Flag False Positive
  const handleFlagFalsePositive = () => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === activeCandidate.id) {
          return {
            ...c,
            triageStatus: 'FLAGGED_FALSE_POSITIVE',
            reviewedBy: 'Elena Rostova (EHS Lead)',
            reviewedAt: new Date().toISOString(),
            notes: customNotes || 'Flagged as False Positive: Detection artifact or background glare.',
          };
        }
        return c;
      })
    );
  };

  // Confirm True Positive
  const handleConfirmTruePositive = () => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === activeCandidate.id) {
          return {
            ...c,
            triageStatus: 'CONFIRMED_TRUE_POSITIVE',
            correctedClass: activeClassSelection,
            reviewedBy: 'Marcus Vance (CSP)',
            reviewedAt: new Date().toISOString(),
            notes: customNotes || 'Verified as ground-truth violation by safety officer.',
          };
        }
        return c;
      })
    );
  };

  // Flag False Negative / Missed Object
  const handleFlagFalseNegative = () => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === activeCandidate.id) {
          return {
            ...c,
            triageStatus: 'FLAGGED_FALSE_NEGATIVE',
            reviewedBy: 'EHS Team',
            reviewedAt: new Date().toISOString(),
            notes: 'Flagged as Missed Object / Weak Detection Boundary.',
          };
        }
        return c;
      })
    );
  };

  // Package Dataset & Trigger Edge Retrain Pipeline
  const handlePackageDataset = () => {
    setIsPackaging(true);
    setPackageSuccess(false);

    setTimeout(() => {
      setIsPackaging(false);
      setPackageSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Update manifest
      setManifest((prev) => ({
        ...prev,
        totalSamples: prev.totalSamples + candidates.length,
        trainCount: Math.round((prev.totalSamples + candidates.length) * 0.8),
        valCount: Math.round((prev.totalSamples + candidates.length) * 0.15),
        testCount: Math.round((prev.totalSamples + candidates.length) * 0.05),
        generatedAt: new Date().toISOString(),
      }));
    }, 1500);
  };

  // Generate YOLO annotation line
  const getYoloAnnotationLine = (cand: ActiveLearningCandidate) => {
    const classMap: Record<PPEClass, number> = {
      head_helmet: 0,
      head_nohelmet: 1,
      glasses: 2,
      face_mask: 3,
      face_nomask: 4,
      vest: 5,
      person: 6,
      hand_glove: 7,
      hand_noglove: 8,
      boots: 9,
      shoes: 10,
    };
    const clsId = classMap[cand.correctedClass || cand.predictedClass] ?? 0;
    const [x, y, w, h] = cand.bboxInitial;
    return `${clsId} ${(x + w / 2).toFixed(4)} ${(y + h / 2).toFixed(4)} ${w.toFixed(4)} ${h.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Learning & Data Triage Command */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Active Learning Review & Data Triage Studio
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                Uncertainty Filter: 0.35 &lt; Conf &lt; 0.55
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Review edge model low-confidence detections, flag false positives/negatives, execute AI Label Assist (Gemini 2.5 Teacher Model), and package retrain-ready datasets to continuously boost edge accuracy.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className={`p-1 rounded-xl border flex flex-wrap text-xs font-mono font-medium ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('TRIAGE_QUEUE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'TRIAGE_QUEUE'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Uncertainty Queue</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300">
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DATASET_PACKAGING')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'DATASET_PACKAGING'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Dataset Packaging ({manifest.totalSamples})</span>
            </button>

            <button
              onClick={() => setActiveTab('YOLO_YAML')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'YOLO_YAML'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>YOLOv9 data.yaml Spec</span>
            </button>
          </div>
        </div>

        {/* Triage Status Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Ingested:</span>
            <span className="font-bold text-white">{counts.total}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-center justify-between">
            <span className="text-amber-400">Pending Triage:</span>
            <span className="font-bold text-amber-300">{counts.pending}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-between">
            <span className="text-emerald-400">Confirmed (TP):</span>
            <span className="font-bold text-emerald-300">{counts.confirmed}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between">
            <span className="text-rose-400">Flagged (FP):</span>
            <span className="font-bold text-rose-300">{counts.flaggedFp}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-between">
            <span className="text-blue-400">Projected mAP Gain:</span>
            <span className="font-bold text-blue-300">+{manifest.projectedMapImprovement}%</span>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE TRIAGE QUEUE & AI LABEL ASSIST CANVAS */}
      {activeTab === 'TRIAGE_QUEUE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Uncertainty Candidate List (4 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Filter controls */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`p-1.5 rounded-lg border font-bold text-xs ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Triage Only</option>
                <option value="CONFIRMED">Confirmed True Positives</option>
                <option value="FLAGGED">Flagged False Positives</option>
              </select>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as any)}
                className={`p-1.5 rounded-lg border font-bold text-xs ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Zones</option>
                <option value="HEAD">Head Zone</option>
                <option value="FACIAL">Facial Zone</option>
                <option value="UPPER_BODY">Upper Body</option>
                <option value="EXTREMITIES">Extremities</option>
              </select>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredCandidates.map((candidate) => {
                const isSelected = candidate.id === selectedCandidateId;

                return (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      setSelectedCandidateId(candidate.id);
                      setActiveClassSelection(candidate.correctedClass || candidate.predictedClass);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/30'
                        : theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">{candidate.sampleUid.slice(-9)}</span>
                        <span className="text-[10px] text-slate-500">{candidate.cameraId}</span>
                      </div>

                      {/* Confidence Pill */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Conf: {(candidate.initialConfidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={candidate.imageUrl}
                        alt="Detection Crop"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-800 shrink-0"
                      />

                      <div className="flex-1 space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-400">{candidate.predictedClass}</span>
                          <span className="text-[10px] text-slate-500">{candidate.uncertaintyReason}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {candidate.notes}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[10px] font-bold ${
                            candidate.triageStatus === 'CONFIRMED_TRUE_POSITIVE'
                              ? 'text-emerald-400'
                              : candidate.triageStatus === 'FLAGGED_FALSE_POSITIVE'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}>
                            ● {candidate.triageStatus}
                          </span>
                          {candidate.labelAssistConfidence && (
                            <span className="text-[10px] text-purple-400 flex items-center gap-1 font-bold">
                              <Sparkles className="w-2.5 h-2.5" /> AI Assist: {(candidate.labelAssistConfidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Annotation Canvas & Triage Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {activeCandidate && (
              <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                {/* Canvas Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-400">{activeCandidate.sampleUid}</span>
                      <span className="text-xs font-mono text-slate-400">({activeCandidate.cameraName})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Recorded: {activeCandidate.timestamp} • Zone: {activeCandidate.zoneCode}
                    </p>
                  </div>

                  {/* AI Label Assist Action */}
                  <button
                    onClick={handleRunLabelAssist}
                    disabled={isLabelAssisting}
                    className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                      isLabelAssisting
                        ? 'bg-purple-800 text-purple-200 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isLabelAssisting ? 'animate-spin' : ''}`} />
                    <span>{isLabelAssisting ? 'Running Teacher Model...' : 'Run AI Label Assist'}</span>
                  </button>
                </div>

                {/* Bounding Box Visualizer Canvas */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                  <img
                    src={activeCandidate.imageUrl}
                    alt="Active Frame"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none"
                  />

                  {/* Edge YOLOv9 Initial Box (Dashed Yellow/Orange) */}
                  <div
                    className="absolute border-2 border-dashed border-amber-400/90 rounded bg-amber-500/10 pointer-events-none transition-all"
                    style={{
                      left: `${activeCandidate.bboxInitial[0] * 100}%`,
                      top: `${activeCandidate.bboxInitial[1] * 100}%`,
                      width: `${activeCandidate.bboxInitial[2] * 100}%`,
                      height: `${activeCandidate.bboxInitial[3] * 100}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                      YOLOv9 Edge: {activeCandidate.predictedClass} ({(activeCandidate.initialConfidence * 100).toFixed(0)}%)
                    </div>
                  </div>

                  {/* Teacher Model Corrected Box (Solid Green/Purple) */}
                  {showTeacherBox && activeCandidate.labelAssistConfidence && (
                    <div
                      className="absolute border-2 border-solid border-purple-400 rounded bg-purple-500/15 pointer-events-none transition-all ring-2 ring-purple-500/30"
                      style={{
                        left: `${(activeCandidate.bboxInitial[0] + 0.01) * 100}%`,
                        top: `${(activeCandidate.bboxInitial[1] - 0.02) * 100}%`,
                        width: `${(activeCandidate.bboxInitial[2] * 0.95) * 100}%`,
                        height: `${(activeCandidate.bboxInitial[3] * 0.95) * 100}%`,
                      }}
                    >
                      <div className="absolute -bottom-6 left-0 bg-purple-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Teacher: {activeCandidate.correctedClass || activeCandidate.predictedClass} ({(activeCandidate.labelAssistConfidence * 100).toFixed(0)}%)
                      </div>
                    </div>
                  )}

                  {/* Uncertainty Reason Badge */}
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300 font-mono text-[10px] flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Failure Mode: {activeCandidate.uncertaintyReason}</span>
                  </div>
                </div>

                {/* Triage Decision Bar & Class Adjustment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">1. Ground-Truth Class:</span>
                    <select
                      value={activeClassSelection}
                      onChange={(e) => setActiveClassSelection(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border font-bold text-xs ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <optgroup label="Head Zone">
                        <option value="head_helmet">head_helmet (Compliant Hard Hat)</option>
                        <option value="head_nohelmet">head_nohelmet (Violation: Bare Head)</option>
                      </optgroup>
                      <optgroup label="Facial Zone">
                        <option value="glasses">glasses (Safety Glasses)</option>
                        <option value="face_mask">face_mask (Respirator / Mask)</option>
                        <option value="face_nomask">face_nomask (Violation: Bare Face)</option>
                      </optgroup>
                      <optgroup label="Upper Body">
                        <option value="vest">vest (High-Vis Safety Vest)</option>
                        <option value="person">person (Worker Spatial Anchor)</option>
                      </optgroup>
                      <optgroup label="Extremities">
                        <option value="hand_glove">hand_glove (Protective Gloves)</option>
                        <option value="hand_noglove">hand_noglove (Violation: Bare Hands)</option>
                        <option value="boots">boots (ASTM Steel-Toe Boots)</option>
                        <option value="shoes">shoes (Violation: Non-compliant Footwear)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">2. YOLO Text Annotation:</span>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs flex items-center justify-between">
                      <code>{getYoloAnnotationLine(activeCandidate)}</code>
                      <span className="text-[10px] text-slate-500">Darknet / YOLOv9</span>
                    </div>
                  </div>
                </div>

                {/* Reviewer Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConfirmTruePositive}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm True Positive</span>
                    </button>

                    <button
                      onClick={handleFlagFalsePositive}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Flag False Positive</span>
                    </button>

                    <button
                      onClick={handleFlagFalseNegative}
                      className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Flag False Negative</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Status: <strong className="text-white">{activeCandidate.triageStatus}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DATASET PACKAGING & RETRAIN SPECIFICATION */}
      {activeTab === 'DATASET_PACKAGING' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-6 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className={`text-base font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Continuous Active Learning Dataset Package ({manifest.version})
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Curated low-confidence samples + false-positive remediations packaged for PyTorch/TensorRT YOLOv9-e fine-tuning.
                </p>
              </div>

              {/* Package & Retrain Button */}
              <button
                onClick={handlePackageDataset}
                disabled={isPackaging}
                className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 shadow-sm transition-all ${
                  isPackaging
                    ? 'bg-purple-800 text-purple-200 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <Package className={`w-4 h-4 ${isPackaging ? 'animate-bounce' : ''}`} />
                <span>{isPackaging ? 'Packaging .tar.gz Dataset...' : 'Package & Trigger Edge Retrain'}</span>
              </button>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Total Curated Pool</span>
                <div className="text-2xl font-bold text-white">{manifest.totalSamples}</div>
                <span className="text-[10px] text-purple-400">100% Curated</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Training Set (80%)</span>
                <div className="text-2xl font-bold text-emerald-400">{manifest.trainCount}</div>
                <span className="text-[10px] text-slate-400">Hard Mining Weighted</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Validation Set (15%)</span>
                <div className="text-2xl font-bold text-blue-400">{manifest.valCount}</div>
                <span className="text-[10px] text-slate-400">Loss Convergence Check</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Test / Holdout Set (5%)</span>
                <div className="text-2xl font-bold text-amber-400">{manifest.testCount}</div>
                <span className="text-[10px] text-slate-400">Benchmark Ground-truth</span>
              </div>
            </div>

            {/* Class Distribution Balance Graph */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                Class Distribution Balance (11 Industrial Classes):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {Object.entries(manifest.classDistribution).map(([cls, count]) => {
                  const numericCount = typeof count === 'number' ? count : Number(count);
                  return (
                    <div key={cls} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">{cls}</span>
                        <span className="text-purple-400 font-bold">{numericCount} samples</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(numericCount / 450) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: YOLOv9 DATA.YAML CODE SPEC */}
      {activeTab === 'YOLO_YAML' && (
        <div className="space-y-4">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <h3 className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  PyTorch / Darknet YOLOv9 Dataset Specification (data.yaml)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Path: /opt/datasets/ehs_ppe_v2.4/data.yaml</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              <code>{manifest.dataYamlContent}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
