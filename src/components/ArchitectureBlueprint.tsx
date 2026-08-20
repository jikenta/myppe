import React from 'react';
import { 
  Server, 
  Database, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Cpu, 
  Layers, 
  Clock, 
  HardHat, 
  Glasses, 
  Shirt, 
  Footprints,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ArchitectureBlueprint: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Executive Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                SYSTEM ARCHITECTURE DOCUMENTATION
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Enterprise EHS Multi-Tenant Edition</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Production Architecture: Multi-Tenant EHS PPE Compliance Platform
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 font-mono">
            <div>Target Latency: <strong className="text-emerald-400">&lt; 50ms E2E</strong></div>
            <span className="text-slate-700">|</span>
            <div>Scale: <strong className="text-amber-400">10,000+ Cameras</strong></div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-5xl">
          The EHS Sentinel Platform is designed for mission-critical industrial manufacturing, chemical processing, and construction environments. It couples edge AI inference nodes running TensorRT-optimized YOLO models with a high-throughput Redis 7 ingestion bus and a declaratively partitioned PostgreSQL 16 relational store enforcing Row Level Security (RLS).
        </p>
      </div>

      {/* End-to-End System Flow Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              End-to-End Ingestion, Evaluation & Dispatch Architecture
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">Real-Time Reactive Pipeline</span>
        </div>

        {/* Diagram Stages */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          
          {/* Stage 1: Edge */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div className="text-xs font-bold text-white">Edge AI Inference</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              On-premise NVIDIA Jetson AGX Orin nodes capture 1080p/4K RTSP streams. YOLOv11 detects persons and 11 PPE classes across 4 anatomical zones in 18ms.
            </p>
            <div className="text-[10px] font-mono text-amber-400 bg-slate-900 p-1.5 rounded border border-slate-800">
              Output: Bounding Boxes + Confs
            </div>
          </div>

          {/* Stage 2: Ingestion Bus */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div className="text-xs font-bold text-white">Redis 7 Streams Ingest</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Edge nodes push detections via <code className="text-emerald-400 font-mono">XADD ehs:stream:camera:{'{id}'}</code> with sub-2ms write latency. Consumer groups shard stream parsing.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-1.5 rounded border border-slate-800">
              Throughput: 50k events/sec
            </div>
          </div>

          {/* Stage 3: Rule Engine */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div className="text-xs font-bold text-white">Go Rule Worker & Debounce</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fetches dynamic zone configs from Redis hot-cache (<code className="text-blue-400 font-mono">ehs:cache:config</code>). Runs sliding window false-positive debounce filter.
            </p>
            <div className="text-[10px] font-mono text-blue-400 bg-slate-900 p-1.5 rounded border border-slate-800">
              Debounce: 3.0s window / 3 frames
            </div>
          </div>

          {/* Stage 4: PostgreSQL Persistence */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div className="text-xs font-bold text-white">PostgreSQL 16 Partitioned</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inserts verified incidents into monthly partition tables (<code className="text-purple-400 font-mono">violation_events_y2026m08</code>). Enforces tenant RLS policies.
            </p>
            <div className="text-[10px] font-mono text-purple-400 bg-slate-900 p-1.5 rounded border border-slate-800">
              Composite B-Tree & BRIN Indexes
            </div>
          </div>

          {/* Stage 5: Real-time Dispatch */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
              05
            </div>
            <div className="text-xs font-bold text-white">Alert Dispatch & WebSockets</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              GraphQL Subscriptions push live alerts to EHS dashboards; automated Webhooks and on-premise GPIO relays trigger floor strobes and sirens.
            </p>
            <div className="text-[10px] font-mono text-rose-400 bg-slate-900 p-1.5 rounded border border-slate-800">
              SLA: &lt; 50ms Alert Delivery
            </div>
          </div>

        </div>
      </div>

      {/* The 4 Anatomical Zones Detailed Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Anatomical PPE Zone Modeling & Classification Logic
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">4 Discrete Anatomical Subsystems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Head Zone */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">1. Head Zone</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                ANSI Z89.1
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Monitors overhead impact, falling debris, and arc flash hazards across crane perimeters and fabrication lines.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span>head_helmet</span>
                <span className="font-bold">COMPLIANT (Hard Hat On)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <span>head_nohelmet</span>
                <span className="font-bold">CRITICAL VIOLATION</span>
              </div>
            </div>
          </div>

          {/* Facial Zone */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Glasses className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-white">2. Facial Zone</span>
              </div>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                ANSI Z87.1 / N95
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Monitors ocular protection against high-velocity metal filings and respiratory protection in caustic acid dip areas.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span>glasses / face_mask</span>
                <span className="font-bold">COMPLIANT (Visor / Filter On)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <span>face_nomask</span>
                <span className="font-bold">HIGH SEVERITY VIOLATION</span>
              </div>
            </div>
          </div>

          {/* Upper Body Zone */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">3. Upper Body Zone</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                ANSI/ISEA 107
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Provides high-visibility reflective detection for forklift paths and person spatial localization for occupancy limit enforcement.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span>vest</span>
                <span className="font-bold">COMPLIANT (Hi-Vis Garment)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-950/40 border border-blue-500/30 text-blue-300">
                <span>person</span>
                <span className="font-bold">WORKER SPATIAL ANCHOR</span>
              </div>
            </div>
          </div>

          {/* Extremities Zone */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-bold text-white">4. Extremities Zone</span>
              </div>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                ASTM F2413 / EN 388
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Enforces chemical/thermal glove protection and distinguishes compliant steel-toe boots from unapproved street shoes.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span>hand_glove / boots</span>
                <span className="font-bold">COMPLIANT (Gloves & Steel Boots)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <span>hand_noglove / shoes</span>
                <span className="font-bold">VIOLATION (Bare Hands / Soft Shoes)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sub-Second Indexing & Query Latency Optimization Strategy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sub-Second Query Optimization & Indexing Strategy
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono">10M+ Records Tested</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Workload / Query Pattern</th>
                <th className="px-4 py-3">Index Strategy Employed</th>
                <th className="px-4 py-3">Unindexed (Seq Scan)</th>
                <th className="px-4 py-3 text-emerald-400">Optimized Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-sans">
                  <strong>Live Unacknowledged Urgent Alert Triage</strong>
                  <div className="text-[11px] text-slate-500 font-mono">WHERE tenant_id = :id AND severity = 'CRITICAL' AND acknowledged = false</div>
                </td>
                <td className="px-4 py-3 text-amber-400">
                  Partial Composite B-Tree: <br />
                  <code className="text-[10px] text-slate-400">idx_violations_unacknowledged_urgent</code>
                </td>
                <td className="px-4 py-3 text-rose-400">1,840 ms</td>
                <td className="px-4 py-3 font-bold text-emerald-400 text-sm">0.82 ms (2,243x faster)</td>
              </tr>

              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-sans">
                  <strong>Facility Real-Time Feed Filter</strong>
                  <div className="text-[11px] text-slate-500 font-mono">WHERE tenant_id = :t AND facility_id = :f ORDER BY detected_at DESC</div>
                </td>
                <td className="px-4 py-3 text-blue-400">
                  Partition Pruning + Composite B-Tree: <br />
                  <code className="text-[10px] text-slate-400">(tenant_id, facility_id, detected_at DESC)</code>
                </td>
                <td className="px-4 py-3 text-rose-400">2,450 ms</td>
                <td className="px-4 py-3 font-bold text-emerald-400 text-sm">1.45 ms (1,689x faster)</td>
              </tr>

              <tr className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-sans">
                  <strong>Historical 90-Day OSHA Regulatory Audit</strong>
                  <div className="text-[11px] text-slate-500 font-mono">WHERE detected_at BETWEEN '2026-05-01' AND '2026-08-01'</div>
                </td>
                <td className="px-4 py-3 text-purple-400">
                  Block Range Index (BRIN): <br />
                  <code className="text-[10px] text-slate-400">USING BRIN (detected_at) [95% smaller memory footprint]</code>
                </td>
                <td className="px-4 py-3 text-rose-400">5,820 ms</td>
                <td className="px-4 py-3 font-bold text-emerald-400 text-sm">14.8 ms (393x faster)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
