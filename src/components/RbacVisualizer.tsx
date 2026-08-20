import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, UserCheck, Copy, Check, Terminal, Eye, Layers } from 'lucide-react';
import { UserRole } from '../types/schema';
import { RBAC_JWT_SPEC } from '../data/architectureDocs';

export const RbacVisualizer: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('FACILITY_SAFETY_OFFICER');
  const [copied, setCopied] = useState(false);

  const rolesMatrix: Record<
    UserRole,
    {
      title: string;
      description: string;
      scopes: string[];
      rlsLevel: string;
      jwtPayload: Record<string, any>;
    }
  > = {
    EHS_GLOBAL_ADMIN: {
      title: 'Global EHS Administrator',
      description: 'Full cross-tenant access to manage facilities, global safety compliance standards, camera provisioning, and tenant billing.',
      scopes: [
        'ehs:admin:all',
        'ehs:tenants:write',
        'ehs:cameras:write',
        'ehs:zones:write',
        'ehs:config:toggle',
        'ehs:violations:all',
        'ehs:audit:read',
      ],
      rlsLevel: 'Tenant-wide unrestricted bypass (within authorized tenant_id)',
      jwtPayload: {
        iss: 'https://auth.ehs-platform.cloud',
        sub: 'usr_global_admin_01',
        role: 'EHS_GLOBAL_ADMIN',
        tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        facility_ids: ['*'],
        scopes: ['ehs:admin:all', 'ehs:config:write', 'ehs:violations:ack'],
      },
    },
    FACILITY_SAFETY_OFFICER: {
      title: 'Facility Safety Officer (EHS)',
      description: 'Site-level authority to configure dynamic zone rules across 4 anatomical zones, monitor feeds, and acknowledge incidents.',
      scopes: [
        'ehs:cameras:read',
        'ehs:zones:read',
        'ehs:zones:write',
        'ehs:config:toggle',
        'ehs:violations:read',
        'ehs:violations:acknowledge',
        'ehs:audit:read',
      ],
      rlsLevel: 'Restricted to assigned facility_ids in JWT',
      jwtPayload: JSON.parse(RBAC_JWT_SPEC),
    },
    ZONE_SUPERVISOR: {
      title: 'Floor / Zone Line Supervisor',
      description: 'Operational view for specific production bays to receive real-time siren/beacon alerts and triage immediate worker safety.',
      scopes: ['ehs:cameras:read', 'ehs:zones:read', 'ehs:violations:read', 'ehs:violations:acknowledge'],
      rlsLevel: 'Restricted to specific camera_zones',
      jwtPayload: {
        iss: 'https://auth.ehs-platform.cloud',
        sub: 'usr_floor_super_08',
        role: 'ZONE_SUPERVISOR',
        tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        facility_ids: ['8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'],
        assigned_zone_codes: ['ZONE-ARC-HAZARD-01'],
        scopes: ['ehs:violations:read', 'ehs:violations:acknowledge'],
      },
    },
    AUDITOR: {
      title: 'Regulatory & OSHA Compliance Auditor',
      description: 'Read-only compliance certification and historical violation analytics export with immutable audit trail inspection.',
      scopes: ['ehs:cameras:read', 'ehs:zones:read', 'ehs:violations:read', 'ehs:audit:read'],
      rlsLevel: 'Read-only across entire tenant historical partitions',
      jwtPayload: {
        iss: 'https://auth.ehs-platform.cloud',
        sub: 'usr_auditor_osha',
        role: 'AUDITOR',
        tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        facility_ids: ['8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'],
        scopes: ['ehs:violations:read', 'ehs:audit:read'],
      },
    },
    EDGE_SERVICE_ACCOUNT: {
      title: 'Edge Ingestion Device Service Account (mTLS/JWT)',
      description: 'Headless high-frequency token used by Jetson AGX edge nodes to push XADD detection streams into Redis and batch APIs.',
      scopes: ['ehs:ingest:inference_batch', 'ehs:heartbeat:write'],
      rlsLevel: 'Write-only append to ingestion streams; zero read access to user PII',
      jwtPayload: {
        iss: 'https://auth.ehs-platform.cloud',
        sub: 'edge_jetson_agx_01',
        role: 'EDGE_SERVICE_ACCOUNT',
        tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        edge_device_id: 'NVIDIA-JETSON-AGX-01',
        scopes: ['ehs:ingest:inference_batch'],
      },
    },
  };

  const currentRoleData = rolesMatrix[selectedRole];

  const handleCopyJwt = () => {
    navigator.clipboard.writeText(JSON.stringify(currentRoleData.jwtPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                OAuth2 / JWT Claims & Multi-Tenant RBAC Workflows
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PostgreSQL RLS Bound
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Zero-Trust role-based access control with asymmetric RS256 JWT tokens. Claims strictly bind to PostgreSQL Row Level Security session variables (<code className="text-amber-400 font-mono">app.current_tenant_id</code>).
            </p>
          </div>

          <button
            onClick={handleCopyJwt}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'JWT Copied!' : 'Copy JWT Payload'}
          </button>
        </div>
      </div>

      {/* Role Selection & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Role Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            System Roles & Personas ({Object.keys(rolesMatrix).length})
          </span>

          <div className="space-y-2">
            {(Object.keys(rolesMatrix) as UserRole[]).map((rKey) => {
              const r = rolesMatrix[rKey];
              const isSelected = selectedRole === rKey;
              return (
                <button
                  key={rKey}
                  onClick={() => setSelectedRole(rKey)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono text-slate-200">{rKey}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-700'}`} />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold">{r.title}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: JWT Token Inspector & RLS Policy Mapping (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* JWT Claims Payload Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Decoded RS256 JWT Claims Payload ({selectedRole})
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Signature Verified (Public Key)
              </span>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72 scrollbar-thin">
              <pre>{JSON.stringify(currentRoleData.jwtPayload, null, 2)}</pre>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Granted OAuth2 Scopes:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentRoleData.scopes.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded font-mono text-[11px] text-amber-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* PostgreSQL RLS Session Binding Flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-800 pb-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Zero-Trust PostgreSQL Row Level Security (RLS) Execution Pipeline</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When an API request arrives with a verified JWT, the backend connection pooler injects the verified tenant claim into the database transaction context before executing queries:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-500">-- 1. Injected at connection start per transaction:</div>
              <div className="text-amber-400 font-bold">
                SET LOCAL app.current_tenant_id = '{currentRoleData.jwtPayload.tenant_id}';
              </div>
              <div className="text-slate-500 mt-2">-- 2. Evaluated transparently on all SELECT / INSERT / UPDATE:</div>
              <div className="text-emerald-400">
                CREATE POLICY tenant_isolation_violations ON violation_events <br />
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Cross-Tenant Breach Impossible:</strong> Even in the event of an application-level SQL injection, the PostgreSQL kernel strictly filters data to the tenant_id in the session variable.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
