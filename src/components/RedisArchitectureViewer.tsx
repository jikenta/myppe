import React, { useState } from 'react';
import { Zap, Copy, Check, Server, Layers, Clock, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { REDIS_ARCHITECTURE_DOC } from '../data/architectureDocs';

export const RedisArchitectureViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState<number>(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(REDIS_ARCHITECTURE_DOC);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redisDataStructures = [
    {
      keyPattern: 'ehs:stream:camera:{camera_id}:detections',
      type: 'Stream (XADD)',
      throughput: '10,000+ ops/sec',
      ttl: 'MAXLEN ~ 50,000 frames',
      purpose: 'High-frequency raw inference ingest from edge Jetson nodes with sub-millisecond write latency.',
      sampleCommand: 'XADD ehs:stream:camera:cam-01-weld:detections MAXLEN ~ 50000 * track_id "TRACK_P042" head "head_nohelmet" extremities "hand_noglove" conf "0.948" ts "1724141174000"',
    },
    {
      keyPattern: 'ehs:cache:config:{camera_id}:{zone_id}',
      type: 'Hash Map (HGETALL / HSET)',
      throughput: '50,000+ reads/sec',
      ttl: 'No expiry (Warmed write-through)',
      purpose: 'Hot-cache for dynamic zone rules. Rule evaluation workers check active toggles in <100µs before checking PostgreSQL.',
      sampleCommand: 'HSET ehs:cache:config:cam-01-weld:zone-weld-active head_req "1" face_req "1" vest_req "1" extr_req "1" min_conf "0.85" debounce_ms "3000"',
    },
    {
      keyPattern: 'ehs:debounce:{camera_id}:{zone_id}:{track_id}:{viol_type}',
      type: 'Sorted Set (ZADD / ZREMRANGEBYSCORE)',
      throughput: '5,000+ ops/sec',
      ttl: 'Sliding Window (e.g. 3000ms)',
      purpose: 'Temporal sliding window aggregator to prevent false positive frame flickers and alert storms for the same worker track.',
      sampleCommand: 'ZADD ehs:debounce:cam-01:zone-01:P042:nohelmet 1724141174000 "frame_84920"\nZREMRANGEBYSCORE ... -inf (NOW - 3000ms)\nZCARD ...',
    },
    {
      keyPattern: 'ehs:lock:{track_id}:{violation_type}',
      type: 'String Key (SETNX with EX)',
      throughput: '1,000+ ops/sec',
      ttl: 'EX 30 (30 seconds deduplication lock)',
      purpose: 'Ensures only ONE critical alert or SMS is dispatched during an active ongoing violation event episode.',
      sampleCommand: 'SET ehs:lock:TRACK_P042:head_nohelmet 1 EX 30 NX',
    },
    {
      keyPattern: 'ehs:metrics:{facility_id}:hourly:{YYYYMMDDHH}',
      type: 'Hash Counters (HINCRBY)',
      throughput: '20,000+ ops/sec',
      ttl: 'EXPIRE 604800 (7 days hot metrics)',
      purpose: 'Instantaneous EHS dashboard compliance rate calculations without scanning disk-based PostgreSQL tables.',
      sampleCommand: 'HINCRBY ehs:metrics:GF-04-AERO:hourly:2026082008 "head_nohelmet" 1',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Redis 7+ Hot-Cache & Stream Ingestion Architecture
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sub-Millisecond Edge Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Architecture for high-frequency edge AI inference ingestion, microsecond zone config hot-cache retrieval, and sliding-window false-positive debounce filtering.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Doc Copied!' : 'Copy Redis Architecture'}
          </button>
        </div>
      </div>

      {/* Interactive Pipeline Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          End-to-End High Throughput Ingestion Pipeline Flow
        </span>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              step: 1,
              title: '1. Edge Inference XADD',
              desc: 'Jetson AGX runs YOLOv11 TensorRT (18ms) and pushes detections to Redis Stream without waiting for DB writes.',
              latency: '< 1.8ms',
            },
            {
              step: 2,
              title: '2. Rule Evaluation Hot-Cache',
              desc: 'Go Rule Worker fetches zone rules from Redis Hash (ehs:cache:config) with zero DB round-trips.',
              latency: '< 0.1ms',
            },
            {
              step: 3,
              title: '3. Sliding Window Debounce',
              desc: 'Worker updates Redis Sorted Set. Verifies worker remains in violation for consecutive frames before firing.',
              latency: '< 0.8ms',
            },
            {
              step: 4,
              title: '4. Batch PostgreSQL Write & Alert',
              desc: 'Official violations written to PostgreSQL monthly partition; WebSocket dispatches alert to EHS officers.',
              latency: '< 14ms',
            },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => setActivePipelineStage(item.step)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activePipelineStage === item.step
                  ? 'bg-amber-500/10 border-amber-500 shadow-md'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100">{item.title}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {item.latency}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Redis Key & Data Structure Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Production Redis 7 Data Structures & Key Schemas
          </span>
          <span className="text-xs font-mono text-emerald-400">Total Key Formats: {redisDataStructures.length}</span>
        </div>

        <div className="divide-y divide-slate-800">
          {redisDataStructures.map((ds, idx) => (
            <div key={idx} className="p-5 hover:bg-slate-800/20 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {ds.type}
                  </span>
                  <code className="text-xs font-mono font-bold text-slate-100 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {ds.keyPattern}
                  </code>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Throughput: <strong className="text-emerald-400">{ds.throughput}</strong></span>
                  <span>•</span>
                  <span>TTL: <strong className="text-amber-400">{ds.ttl}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{ds.purpose}</p>

              {/* Sample Redis Command */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <pre>{ds.sampleCommand}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
