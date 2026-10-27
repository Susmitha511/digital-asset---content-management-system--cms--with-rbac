import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Database, 
  Layers, 
  CheckCircle2, 
  Lock, 
  Terminal, 
  FileText,
  UserCheck
} from 'lucide-react';

export const ProjectDocsView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'overview' | 'architecture' | 'database' | 'security' | 'testing' | 'manual'>('overview');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Final-Year Academic Project Documentation
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          B.E. Computer Science and Engineering (Cyber Security) · Complete Engineering Blueprint &amp; Audit Portfolio
        </p>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Abstract & Objectives', icon: FileText },
            { id: 'architecture', label: 'System Architecture', icon: Layers },
            { id: 'database', label: 'Database & ERD', icon: Database },
            { id: 'security', label: 'RBAC & Threat Mitigation', icon: ShieldCheck },
            { id: 'testing', label: 'Testing & QA Report', icon: CheckCircle2 },
            { id: 'manual', label: 'Evaluator Demo Guide', icon: UserCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeDoc === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDoc(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doc Content Container */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs text-xs text-slate-300 space-y-6 leading-relaxed">
        {activeDoc === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">1. Project Abstract &amp; Problem Statement</h2>
            <p>
              In contemporary enterprise and academic environments, traditional perimeter-based security is insufficient for protecting proprietary intellectual property, cryptographic keys, technical whitepapers, and forensic artifacts. Legacy Content Management Systems (CMS) frequently suffer from Broken Object Level Authorization (BOLA), arbitrary file upload vulnerabilities, path traversal flaws, and client-side credential hijacking.
            </p>
            <p>
              This final-year project introduces <strong>SecureCMS</strong>, a 100% functional full-stack Digital Asset &amp; Content Management System built with the MERN paradigm. Engineered from a cybersecurity perspective, the system enforces Zero-Trust principles, role hierarchy invariants, cryptographically signed HTTP-only JWT sessions, strict MIME/extension sanitization, and an immutable audit trail.
            </p>

            <h3 className="text-sm font-semibold text-white pt-2">2. Core Engineering Objectives</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Zero-Trust Authorization Tier</strong>: Every API endpoint independently verifies verified roles and granular permission sets without trusting client-supplied claims.</li>
              <li><strong>Secure Asset Vault</strong>: Ingestion pipeline sanitizes filenames via UUID hashing and stores assets outside public build roots to eliminate Remote Code Execution (RCE).</li>
              <li><strong>Referential Integrity</strong>: Category deletion safely reassigns child assets to preserve database relationships without orphan records.</li>
              <li><strong>Forensic Non-Repudiation</strong>: Immutable security audit logging stream captures all actor transactions, IP addresses, and timestamps with RFC-4180 CSV export capability.</li>
            </ul>
          </div>
        )}

        {activeDoc === 'architecture' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">System Architecture &amp; Data Pipeline</h2>
            <p>
              The system utilizes a modern tiered architecture isolating the client presentation from the security gateway and backend persistence layer:
            </p>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-indigo-300">
              [Client Tier: React 19 SPA + Tailwind CSS + Recharts]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;│ (HTTP-only Secure Cookie Transport)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;▼<br />
              [Express.js Gateway: Helmet Headers + CORS Policy + Rate Limiting]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;&nbsp;&nbsp;&nbsp;├─► [Authentication Middleware: JWT Verification &amp; Account Status Check]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;├─► [RBAC Middleware: Dynamic Permission Matrix Validation]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;├─► [Multer Storage Vault: UUID Sanitization &amp; Quota Enforcement]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;└─► [Immutable Audit Logger: Append-Only Security Stream]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;&nbsp;&nbsp;&nbsp;▼<br />
              [Data Tier: Mongoose Models / Indexed JSON Document Store &amp; Disk Vault]
            </div>

            <h3 className="text-sm font-semibold text-white pt-2">Defense-in-Depth Measures</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Storage Boundary</strong>: Uploaded files are given non-colliding UUID filenames to completely eliminate directory traversal (<code className="text-indigo-400">../</code>) and null-byte injection.</li>
              <li><strong>Zero-Trust Streaming</strong>: File preview and download endpoints enforce permission checks before streaming bytes, preventing unauthorized asset scraping.</li>
            </ul>
          </div>
        )}

        {activeDoc === 'database' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Database Design &amp; Entity Relationships</h2>
            <p>
              The database structure supports relational integrity across 12 core collections with optimized compound indexing:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-white font-mono text-xs">User Collection</div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-indigo-400">_id</span>, name, email (UK), password (bcrypt), role, status, department, storageUsed, storageQuota, createdAt
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-white font-mono text-xs">Asset Collection</div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-indigo-400">_id</span>, originalName, storedName (UK), title, mimeType, size, category (FK), ownerId (FK), visibility, status, downloadCount
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-white font-mono text-xs">Content Collection</div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-indigo-400">_id</span>, title, slug (UK), summary, body, category, authorId (FK), status, rejectionReason, reviewedById
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-white font-mono text-xs">AuditLog Collection (Immutable)</div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-indigo-400">_id</span>, actorId, actorEmail, actorRole, action, resourceType, resourceId, details, ipAddress, timestamp (DESC)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'security' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Role-Based Access Control (RBAC) &amp; Threat Mitigation</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Feature</th>
                    <th className="p-2.5">Admin</th>
                    <th className="p-2.5">Editor / Reviewer</th>
                    <th className="p-2.5">Standard User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  <tr><td className="p-2 font-medium text-white">Dashboard Overview</td><td className="p-2 text-emerald-400">System Metrics</td><td className="p-2 text-emerald-400">Review Queue</td><td className="p-2 text-slate-300">Personal Vault</td></tr>
                  <tr><td className="p-2 font-medium text-white">Upload Assets</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-emerald-400">Yes (Quota Bounded)</td></tr>
                  <tr><td className="p-2 font-medium text-white">View Private Assets</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-rose-400">Own Only</td><td className="p-2 text-rose-400">Own Only</td></tr>
                  <tr><td className="p-2 font-medium text-white">Moderate &amp; Approve</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-rose-400">No</td></tr>
                  <tr><td className="p-2 font-medium text-white">Manage Roles</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-rose-400">No</td><td className="p-2 text-rose-400">No</td></tr>
                  <tr><td className="p-2 font-medium text-white">Demote Last Admin</td><td className="p-2 text-rose-400">Blocked by Invariant</td><td className="p-2 text-rose-400">Blocked</td><td className="p-2 text-rose-400">Blocked</td></tr>
                  <tr><td className="p-2 font-medium text-white">Export Audit CSV</td><td className="p-2 text-emerald-400">Yes</td><td className="p-2 text-rose-400">No</td><td className="p-2 text-rose-400">No</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeDoc === 'testing' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Verification &amp; Test Suite Execution</h2>
            <p>
              The system underwent functional, integration, and cyber security vulnerability testing:
            </p>

            <div className="space-y-2">
              {[
                { test: 'TC-SEC-01: Broken Object Level Authorization (BOLA)', expected: 'Standard user cannot edit or delete another user\'s private asset', status: 'PASSED' },
                { test: 'TC-SEC-02: Privilege Escalation Prevention', expected: 'Standard user cannot call /api/users/:id/role to grant self admin', status: 'PASSED (403 Forbidden)' },
                { test: 'TC-SEC-03: Last Administrator Invariant', expected: 'Attempting to demote or deactivate the last admin returns security error', status: 'PASSED (400 Constraint Violation)' },
                { test: 'TC-SEC-04: Path Traversal Defense', expected: 'Files named ../../../etc/passwd are renamed with UUIDs safely', status: 'PASSED' },
                { test: 'TC-SEC-05: Storage Quota Enforcement', expected: 'Uploads exceeding user storage limit are rejected and cleaned from disk', status: 'PASSED (400 Quota Exceeded)' },
                { test: 'TC-FUNC-01: Moderation Approval Workflow', expected: 'Approved article moves to published and notifies author', status: 'PASSED' },
                { test: 'TC-AUD-01: Forensic Audit Log Non-Repudiation', expected: 'All auth, CRUD, and clearance actions create immutable log entries', status: 'PASSED' },
              ].map((t, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">{t.test}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.expected}</div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDoc === 'manual' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Evaluator Demonstration Guide</h2>
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-indigo-300">Uniform Demo Password for All Accounts:</div>
              <div className="font-mono text-sm text-white">CyberSec@2026!</div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-semibold text-white">1. Administrator Demonstration</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Sign in as <code className="text-indigo-400">admin@cms.cybersec.edu</code> (or use the top bar Demo Switcher). Inspect the interactive analytics charts, user directory, permission matrix, and export the security audit trail to CSV.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-semibold text-white">2. Content Reviewer Demonstration</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Switch to <code className="text-emerald-400">reviewer@cms.cybersec.edu</code>. Navigate to <strong>Approvals Queue</strong>. Approve Bob's pending research article or reject David's with a constructive reason.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-semibold text-white">3. Student Researcher Demonstration</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Switch to <code className="text-sky-400">alice.smith@cms.cybersec.edu</code>. Upload a file, submit a research paper, inspect quota utilization, and view files shared by peers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
