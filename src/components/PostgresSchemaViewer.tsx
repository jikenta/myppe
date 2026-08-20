import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Layers, 
  Key, 
  Table, 
  Search,
  Filter,
  Play,
  Terminal
} from 'lucide-react';
import { POSTGRES_DDL_SQL } from '../data/architectureDocs';

export const PostgresSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('violation_events');
  const [sqlSandboxInput, setSqlSandboxInput] = useState<string>(
    `-- Simulate Multi-Tenant Row Level Security (RLS) Query\nSET LOCAL app.current_tenant_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';\n\nSELECT \n    v.id, \n    v.detected_at, \n    v.anatomical_zone, \n    v.detected_class, \n    v.severity, \n    v.confidence_score,\n    c.name AS camera_name,\n    z.name AS zone_name\nFROM violation_events v\nJOIN cameras c ON c.id = v.camera_id\nJOIN camera_zones z ON z.id = v.zone_id\nWHERE v.detected_at >= NOW() - INTERVAL '24 hours'\n  AND v.acknowledged = FALSE\nORDER BY v.detected_at DESC\nLIMIT 10;`
  );
  const [sandboxResult, setSandboxResult] = useState<any[]>([
    {
      id: 'viol-9901',
      detected_at: '2026-08-20 08:06:14+00',
      anatomical_zone: 'HEAD',
      detected_class: 'head_nohelmet',
      severity: 'CRITICAL',
      confidence_score: 0.9482,
      camera_name: 'Primary Robotic Welding & Robotic Cell 04',
      zone_name: 'High-Voltage Arc Flash & Robotic Perimeter',
    },
    {
      id: 'viol-9902',
      detected_at: '2026-08-20 08:06:15+00',
      anatomical_zone: 'EXTREMITIES',
      detected_class: 'hand_noglove',
      severity: 'HIGH',
      confidence_score: 0.9125,
      camera_name: 'Primary Robotic Welding & Robotic Cell 04',
      zone_name: 'High-Voltage Arc Flash & Robotic Perimeter',
    },
  ]);
  const [isExecutingSql, setIsExecutingSql] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_DDL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([POSTGRES_DDL_SQL], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'ehs_ppe_compliance_postgres_ddl.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunQuery = () => {
    setIsExecutingSql(true);
    setTimeout(() => {
      setIsExecutingSql(false);
    }, 400);
  };

  const schemaTables = [
    {
      name: 'tenants',
      type: 'Core Tenant Store',
      description: 'Multi-tenant root container with SaaS billing tiers, camera limits, and data retention SLAs.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Primary key (gen_random_uuid)' },
        { name: 'name', type: 'VARCHAR(255)', desc: 'Enterprise customer organization name' },
        { name: 'slug', type: 'VARCHAR(100)', desc: 'Unique URL tenant identifier' },
        { name: 'tier', type: 'tenant_tier_enum', desc: 'STANDARD | PRO | ENTERPRISE' },
        { name: 'retention_days', type: 'INT', desc: 'Automated data lifecycle purge limit (default 90-180 days)' },
      ],
      indexes: ['PRIMARY KEY (id)', 'UNIQUE (slug)'],
    },
    {
      name: 'facilities',
      type: 'Spatial Site Hierarchy',
      description: 'Physical manufacturing plants, chemical refineries, or construction sites.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Facility ID' },
        { name: 'tenant_id', type: 'UUID', fk: 'tenants(id)', desc: 'Tenant isolation foreign key (RLS anchor)' },
        { name: 'facility_code', type: 'VARCHAR(50)', desc: 'Site code e.g. GF-04-AERO' },
        { name: 'timezone', type: 'VARCHAR(64)', desc: 'Local IANA timezone for accurate shift auditing' },
      ],
      indexes: ['PRIMARY KEY (id)', 'UNIQUE (tenant_id, facility_code)', 'INDEX (tenant_id)'],
    },
    {
      name: 'cameras',
      type: 'Edge Ingestion Nodes',
      description: 'Physical and virtual IP/RTSP camera feeds attached to on-premise Jetson/TensorRT edge devices.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Camera ID' },
        { name: 'facility_id', type: 'UUID', fk: 'facilities(id)', desc: 'Facility site parent' },
        { name: 'camera_uid', type: 'VARCHAR(100)', desc: 'Unique camera tag e.g. CAM-WELD-04' },
        { name: 'rtsp_stream_url', type: 'TEXT', desc: 'Secure RTSP/WebRTC ingest endpoint' },
        { name: 'stream_fps', type: 'SMALLINT', desc: 'Configured edge ingestion frame rate' },
      ],
      indexes: ['PRIMARY KEY (id)', 'UNIQUE (facility_id, camera_uid)', 'INDEX (tenant_id, facility_id)'],
    },
    {
      name: 'camera_zones',
      type: 'Virtual Geofenced Zones',
      description: 'Polygonal virtual zones (Arc Hazard, Chemical Dip, Loading Bay, Walkway) drawn on camera matrix.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Zone ID' },
        { name: 'camera_id', type: 'UUID', fk: 'cameras(id)', desc: 'Parent camera stream' },
        { name: 'zone_code', type: 'VARCHAR(50)', desc: 'Zone identifier e.g. ZONE-ARC-01' },
        { name: 'zone_type', type: 'zone_type_enum', desc: 'HAZARDOUS_WORK | CHEMICAL_HANDLING | LOADING_DOCK | etc.' },
        { name: 'polygon_coordinates', type: 'JSONB', desc: 'Array of normalized [[x1,y1], [x2,y2]...] polygon vertices' },
      ],
      indexes: ['PRIMARY KEY (id)', 'UNIQUE (camera_id, zone_code)', 'CHECK (jsonb_typeof(polygon_coordinates) = "array")'],
    },
    {
      name: 'active_monitoring_configs',
      type: 'Dynamic Rule Engine (JSONB)',
      description: 'Dynamic per-zone rule toggles across the 4 anatomical zones with strict PostgreSQL CHECK constraint.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Config ID' },
        { name: 'zone_id', type: 'UUID', fk: 'camera_zones(id)', desc: 'Unique 1:1 zone configuration' },
        { name: 'config_version', type: 'INT', desc: 'Monotonically increasing version counter' },
        { name: 'rule_config', type: 'JSONB', desc: 'Fine-grained toggles for Head, Facial, Upper Body, Extremities' },
        { name: 'debounce_window_ms', type: 'INT', desc: 'False-positive filtering window (e.g. 3000ms)' },
        { name: 'consecutive_frames_threshold', type: 'SMALLINT', desc: 'Required consecutive violation detections' },
      ],
      indexes: ['PRIMARY KEY (id)', 'UNIQUE (zone_id)', 'GIN INDEX (rule_config)', 'CHECK (structure constraint)'],
    },
    {
      name: 'violation_events',
      type: 'Partitioned Timeseries Ingestion',
      description: 'High-frequency telemetry table declaratively partitioned by month with composite sub-second query indexes.',
      columns: [
        { name: 'id', type: 'UUID', pk: true, desc: 'Composite PK (id, detected_at)' },
        { name: 'detected_at', type: 'TIMESTAMPTZ', pk: true, desc: 'Partitioning range anchor' },
        { name: 'person_track_id', type: 'VARCHAR(64)', desc: 'DeepSORT / ByteTrack worker persistence ID' },
        { name: 'anatomical_zone', type: 'anatomical_zone_enum', desc: 'HEAD | FACIAL | UPPER_BODY | EXTREMITIES' },
        { name: 'detected_class', type: 'ppe_class_enum', desc: 'head_nohelmet | hand_noglove | face_nomask | shoes | etc.' },
        { name: 'confidence_score', type: 'NUMERIC(5,4)', desc: 'Model confidence score (e.g. 0.9450)' },
        { name: 'bounding_box', type: 'JSONB', desc: 'Normalized {x, y, w, h} box coordinates' },
        { name: 'acknowledged', type: 'BOOLEAN', desc: 'EHS incident workflow resolution state' },
      ],
      indexes: [
        'PARTITION BY RANGE (detected_at)',
        'COMPOSITE: (tenant_id, facility_id, detected_at DESC)',
        'PARTIAL: (tenant_id, severity, detected_at DESC) WHERE acknowledged = FALSE',
        'BRIN: (detected_at)',
        'GIN: (raw_telemetry)',
      ],
    },
  ];

  const currentTableObj = schemaTables.find((t) => t.name === selectedTable) || schemaTables[5];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Production PostgreSQL 16+ DDL & Partitioning Schema
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Multi-Tenant RLS Enabled
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Declarative range partitioning by month for <code className="text-amber-400 font-mono">violation_events</code>, JSONB structural constraints on active monitoring configs, and Row-Level Security (RLS) policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'DDL Copied!' : 'Copy SQL DDL'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              Download .sql
            </button>
          </div>
        </div>

        {/* Quick Schema Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] block">PARTITION STRATEGY</span>
            <span className="text-amber-400 font-bold">Monthly Range (detected_at)</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] block">ISOLATION MODEL</span>
            <span className="text-emerald-400 font-bold">PostgreSQL RLS (Tenant ID)</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] block">PRIMARY INDEX TYPE</span>
            <span className="text-blue-400 font-bold">Composite B-Tree + BRIN</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] block">JSONB RULE ENFORCEMENT</span>
            <span className="text-purple-400 font-bold">CHECK (has keys) + GIN</span>
          </div>
        </div>
      </div>

      {/* Schema Navigation & Table Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Database Tables & Entities ({schemaTables.length})
          </span>

          <div className="space-y-2">
            {schemaTables.map((tbl) => {
              const isSelected = selectedTable === tbl.name;
              return (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl.name)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100">{tbl.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {tbl.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tbl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Detail Specs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Selected Table Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold font-mono text-white">Table: {currentTableObj.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentTableObj.description}</p>
              </div>
            </div>

            {/* Column Schema Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Column Name</th>
                    <th className="px-4 py-2.5">Data Type</th>
                    <th className="px-4 py-2.5">Keys / Constraints</th>
                    <th className="px-4 py-2.5">Architectural Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {currentTableObj.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-bold text-amber-400">{col.name}</td>
                      <td className="px-4 py-2.5 text-blue-400">{col.type}</td>
                      <td className="px-4 py-2.5">
                        {col.pk && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px]">
                            PRIMARY KEY
                          </span>
                        )}
                        {col.fk && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px]">
                            FK → {col.fk}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px] font-sans">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Indexing Strategies for this Table */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Sub-Second Indexes & Physical Optimization:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentTableObj.indexes.map((idx, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-900 border border-slate-700/80 rounded font-mono text-[10px] text-slate-200"
                  >
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive SQL Sandbox & RLS Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Interactive RLS & Sub-Second Query Execution Sandbox
                </span>
              </div>
              <button
                onClick={handleRunQuery}
                disabled={isExecutingSql}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded text-xs flex items-center gap-1.5 transition-all shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isExecutingSql ? 'Executing...' : 'Run Query'}
              </button>
            </div>

            <div className="p-3 bg-slate-950 border-b border-slate-800">
              <textarea
                value={sqlSandboxInput}
                onChange={(e) => setSqlSandboxInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-amber-500 h-36 resize-none"
              />
            </div>

            {/* Results Table */}
            <div className="p-4 bg-slate-900/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Execution Output (Tenant Isolated via RLS):
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Execution Time: 1.42 ms (Bitmap Index Scan via idx_violations_tenant_facility_detected)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Detected At</th>
                      <th className="px-3 py-2">Zone</th>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Conf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {sandboxResult.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 text-amber-400 font-bold">{row.id}</td>
                        <td className="px-3 py-2 text-slate-400">{row.detected_at}</td>
                        <td className="px-3 py-2">{row.anatomical_zone}</td>
                        <td className="px-3 py-2 text-rose-300">{row.detected_class}</td>
                        <td className="px-3 py-2 font-bold text-rose-400">{row.severity}</td>
                        <td className="px-3 py-2 text-emerald-400">{(row.confidence_score * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
