import React, { useState } from 'react';
import { Eye, Copy, Check, Send, Code, Layers, FileJson, Globe, Terminal } from 'lucide-react';
import { REST_API_SPEC, GRAPHQL_SCHEMA_SPEC } from '../data/architectureDocs';

export const ApiSpecExplorer: React.FC = () => {
  const [activeApiType, setActiveApiType] = useState<'REST' | 'GRAPHQL'>('REST');
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('PUT_ZONE_CONFIG');

  // Interactive Mock API Execution State
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const handleCopy = () => {
    const text = activeApiType === 'REST' ? REST_API_SPEC : GRAPHQL_SCHEMA_SPEC;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      if (selectedEndpoint === 'PUT_ZONE_CONFIG') {
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              code: 200,
              data: {
                zone_id: 'zone-weld-active',
                camera_id: 'cam-01-weld',
                config_version: 4,
                synced_to_redis_hot_cache: true,
                edge_broadcast_status: 'DISPATCHED_TO_JETSON_AGX_01',
                updated_at: new Date().toISOString(),
              },
              latency_ms: 12.4,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'GET_VIOLATIONS') {
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              total_count: 142,
              page: 1,
              limit: 2,
              data: [
                {
                  id: 'viol-9901',
                  facility_id: '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
                  person_track_id: 'TRACK_P042',
                  anatomical_zone: 'HEAD',
                  detected_class: 'head_nohelmet',
                  severity: 'CRITICAL',
                  confidence_score: 0.9482,
                  detected_at: '2026-08-20T08:06:14Z',
                  acknowledged: false,
                },
                {
                  id: 'viol-9902',
                  facility_id: '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
                  person_track_id: 'TRACK_P042',
                  anatomical_zone: 'EXTREMITIES',
                  detected_class: 'hand_noglove',
                  severity: 'HIGH',
                  confidence_score: 0.9125,
                  detected_at: '2026-08-20T08:06:15Z',
                  acknowledged: false,
                },
              ],
              query_execution_time_ms: 1.84,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'GQL_QUERY_METRICS') {
        setApiResponse(
          JSON.stringify(
            {
              data: {
                facility: {
                  code: 'GF-04-AERO',
                  activeViolationsCount: 2,
                  complianceRate: 0.982,
                  zoneBreakdown: [
                    { zone: 'HEAD', compliantPercentage: 99.1 },
                    { zone: 'FACIAL', compliantPercentage: 98.4 },
                    { zone: 'UPPER_BODY', compliantPercentage: 99.8 },
                    { zone: 'EXTREMITIES', compliantPercentage: 95.6 },
                  ],
                },
              },
            },
            null,
            2
          )
        );
      }
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                REST & GraphQL API Specification Studio
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OpenAPI 3.1 & GraphQL Schema
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production API contracts for dynamic anatomical zone rule management, high-throughput edge batch ingest, and real-time GraphQL incident subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
              <button
                onClick={() => setActiveApiType('REST')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeApiType === 'REST'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                REST (OpenAPI)
              </button>
              <button
                onClick={() => setActiveApiType('GRAPHQL')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeApiType === 'GRAPHQL'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GraphQL Schema
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Spec'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive API Endpoint Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Endpoint Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            API Operations & Endpoints
          </span>

          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedEndpoint('PUT_ZONE_CONFIG');
                setApiResponse(null);
              }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedEndpoint === 'PUT_ZONE_CONFIG'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  PUT
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">/api/v1/cameras/:id/zones/:zId/config</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Update dynamic JSONB rules for the 4 anatomical zones & warm Redis hot-cache.
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedEndpoint('GET_VIOLATIONS');
                setApiResponse(null);
              }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedEndpoint === 'GET_VIOLATIONS'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  GET
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">/api/v1/violations</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sub-second filtered query over monthly partitions with cursor pagination.
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedEndpoint('GQL_QUERY_METRICS');
                setApiResponse(null);
              }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedEndpoint === 'GQL_QUERY_METRICS'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  GQL
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">query FacilityComplianceMetrics</span>
              </div>
              <p className="text-[11px] text-slate-400">
                GraphQL query for real-time anatomical zone compliance rates.
              </p>
            </button>
          </div>
        </div>

        {/* Right Sandbox & Interactive Runner (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Interactive API Request Runner & Sub-Second Latency Benchmark
                </span>
              </div>
              <button
                onClick={handleExecuteRequest}
                disabled={isSending}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs flex items-center gap-1.5 transition-all shadow"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Dispatching...' : 'Send Request'}
              </button>
            </div>

            {/* Request Body / Headers */}
            <div className="p-4 bg-slate-950 font-mono text-xs border-b border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span className="text-slate-500">Authorization:</span>
                <span className="text-amber-400 font-mono">Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...</span>
              </div>

              {selectedEndpoint === 'PUT_ZONE_CONFIG' && (
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Request Payload (JSON):</span>
                  <pre className="text-emerald-400 text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
{`{
  "zones": {
    "head": { "require_helmet": true, "min_confidence": 0.85 },
    "facial": { "require_glasses": true, "require_mask": true },
    "upper_body": { "require_vest": true, "max_occupancy": 4 },
    "extremities": { "require_gloves": true, "require_boots": true }
  },
  "debounce_window_ms": 3000
}`}
                  </pre>
                </div>
              )}

              {selectedEndpoint === 'GET_VIOLATIONS' && (
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Query Parameters:</span>
                  <div className="text-slate-300 text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                    ?facilityId=8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d&severity=CRITICAL&limit=20
                  </div>
                </div>
              )}

              {selectedEndpoint === 'GQL_QUERY_METRICS' && (
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">GraphQL Document:</span>
                  <pre className="text-purple-400 text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
{`query FacilityComplianceMetrics($facilityId: ID!) {
  facility(id: $facilityId) {
    code
    activeViolationsCount
    complianceRate
    zoneBreakdown {
      zone
      compliantPercentage
    }
  }
}`}
                  </pre>
                </div>
              )}
            </div>

            {/* Response Area */}
            <div className="p-4 bg-slate-900/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Response Payload (JSON):
              </span>

              {apiResponse ? (
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-64 scrollbar-thin">
                  {apiResponse}
                </pre>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-lg">
                  Click "Send Request" above to execute real-time API call simulation with sub-second response telemetry.
                </div>
              )}
            </div>
          </div>

          {/* Full API Spec Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase">
                {activeApiType === 'REST' ? 'OpenAPI 3.1 Specification (YAML)' : 'GraphQL Schema Definition Language (SDL)'}
              </span>
            </div>
            <pre className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96 scrollbar-thin">
              {activeApiType === 'REST' ? REST_API_SPEC : GRAPHQL_SCHEMA_SPEC}
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
};
