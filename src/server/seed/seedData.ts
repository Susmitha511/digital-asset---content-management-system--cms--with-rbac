import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { dbStore } from '../db/store.js';

export const ALL_PERMISSIONS = [
  // Asset permissions
  { id: 'asset:view_all', name: 'View All Assets', category: 'Asset', description: 'View any uploaded asset across the entire system' },
  { id: 'asset:view_own', name: 'View Own Assets', category: 'Asset', description: 'View only self-uploaded assets and shared assets' },
  { id: 'asset:create', name: 'Upload Assets', category: 'Asset', description: 'Upload new digital assets up to storage quota' },
  { id: 'asset:edit_own', name: 'Edit Own Assets', category: 'Asset', description: 'Modify metadata of personal assets' },
  { id: 'asset:edit_all', name: 'Edit All Assets', category: 'Asset', description: 'Modify metadata of any asset in system' },
  { id: 'asset:delete_own', name: 'Delete Own Assets', category: 'Asset', description: 'Delete or archive personal digital assets' },
  { id: 'asset:delete_all', name: 'Delete Any Asset', category: 'Asset', description: 'Permanently remove or archive any asset' },
  { id: 'asset:download', name: 'Download Assets', category: 'Asset', description: 'Download authorized digital asset files' },
  { id: 'asset:share', name: 'Share Assets', category: 'Asset', description: 'Grant peer access to restricted assets' },

  // Content permissions
  { id: 'content:view_all', name: 'View Content', category: 'Content', description: 'Browse and search published articles and content' },
  { id: 'content:submit', name: 'Submit Content', category: 'Content', description: 'Draft and submit content for administrative review' },
  { id: 'content:review', name: 'Review & Approve Content', category: 'Content', description: 'Review, approve, or reject submissions with feedback' },
  { id: 'content:publish', name: 'Publish Directly', category: 'Content', description: 'Instantly publish content without moderation' },
  { id: 'content:delete', name: 'Delete Content', category: 'Content', description: 'Archive or remove published content' },

  // User management permissions
  { id: 'user:view_all', name: 'View All Users', category: 'User', description: 'Access user directory, statuses, and storage stats' },
  { id: 'user:create', name: 'Create Users', category: 'User', description: 'Provision new accounts directly from administration' },
  { id: 'user:edit', name: 'Edit User Profile', category: 'User', description: 'Update user attributes, quotas, and departments' },
  { id: 'user:change_role', name: 'Change Roles & RBAC', category: 'User', description: 'Promote, demote, or change role assignments' },
  { id: 'user:status', name: 'Activate/Deactivate Accounts', category: 'User', description: 'Toggle user active, inactive, or suspended status' },

  // Category and Tag permissions
  { id: 'category:manage', name: 'Manage Categories & Tags', category: 'System', description: 'Create, update, and manage asset taxonomies' },

  // Governance & Security
  { id: 'audit:view', name: 'View Audit Logs', category: 'Audit', description: 'Inspect immutable security logs and activity records' },
  { id: 'analytics:view', name: 'View Analytics & Reports', category: 'System', description: 'View system health, storage, and activity charts' },
  { id: 'reports:export', name: 'Export Reports (CSV)', category: 'System', description: 'Generate and download administrative CSV reports' },
  { id: 'settings:manage', name: 'System Settings', category: 'System', description: 'Configure upload limits, security headers, and branding' },
];

export async function seedDatabaseIfEmpty() {
  const usersCol = dbStore.getCollection('users');
  const existingUsers = usersCol.find();
  if (existingUsers.length > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial demonstration database with RBAC, assets, and audit logs...');

  const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // 1. Roles
  const rolesCol = dbStore.getCollection('roles');
  rolesCol.create({
    _id: 'role-admin',
    name: 'admin',
    displayName: 'System Administrator',
    description: 'Full supervisory authority across all assets, users, moderation workflows, and security audit logs.',
    permissions: ALL_PERMISSIONS.map(p => p.id),
    isSystem: true
  });

  rolesCol.create({
    _id: 'role-editor',
    name: 'editor',
    displayName: 'Content Editor & Reviewer',
    description: 'Authorized to review, approve, and curate digital assets and user content submissions.',
    permissions: [
      'asset:view_all', 'asset:view_own', 'asset:create', 'asset:edit_own', 'asset:edit_all',
      'asset:download', 'asset:share',
      'content:view_all', 'content:submit', 'content:review', 'content:publish',
      'category:manage', 'analytics:view'
    ],
    isSystem: true
  });

  rolesCol.create({
    _id: 'role-user',
    name: 'user',
    displayName: 'Standard User (Student / Researcher)',
    description: 'Can upload personal assets, manage personal files, request access, and submit content for moderation.',
    permissions: [
      'asset:view_own', 'asset:create', 'asset:edit_own', 'asset:delete_own',
      'asset:download', 'asset:share',
      'content:view_all', 'content:submit'
    ],
    isSystem: true
  });

  // 2. Hash standard demo password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('CyberSec@2026!', salt);

  // 3. Users (1 admin, 1 editor, 5 sample users)
  const admin = usersCol.create({
    _id: 'user-admin-1',
    name: 'Prof. Marcus Vance (Admin)',
    email: 'admin@cms.cybersec.edu',
    password: passwordHash,
    role: 'admin',
    status: 'active',
    department: 'Cyber Security Operations Center',
    storageUsed: 14200000,
    storageQuota: 1073741824, // 1 GB
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 3600000).toISOString()
  });

  const editor = usersCol.create({
    _id: 'user-editor-1',
    name: 'Elena Rostova (Lead Reviewer)',
    email: 'reviewer@cms.cybersec.edu',
    password: passwordHash,
    role: 'editor',
    status: 'active',
    department: 'Digital Media & Information Governance',
    storageUsed: 8400000,
    storageQuota: 536870912, // 512 MB
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 7200000).toISOString()
  });

  const alice = usersCol.create({
    _id: 'user-alice-1',
    name: 'Alice Smith',
    email: 'alice.smith@cms.cybersec.edu',
    password: passwordHash,
    role: 'user',
    status: 'active',
    department: 'Network Forensics Lab',
    storageUsed: 4200000,
    storageQuota: 104857600, // 100 MB
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 14400000).toISOString()
  });

  const bob = usersCol.create({
    _id: 'user-bob-1',
    name: 'Bob Martinez',
    email: 'bob.martinez@cms.cybersec.edu',
    password: passwordHash,
    role: 'user',
    status: 'active',
    department: 'Cryptographic Protocols Lab',
    storageUsed: 6100000,
    storageQuota: 104857600,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 28800000).toISOString()
  });

  const carol = usersCol.create({
    _id: 'user-carol-1',
    name: 'Carol Zhang',
    email: 'carol.zhang@cms.cybersec.edu',
    password: passwordHash,
    role: 'user',
    status: 'active',
    department: 'Malware Analysis & Reverse Eng.',
    storageUsed: 2900000,
    storageQuota: 104857600,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 43200000).toISOString()
  });

  const david = usersCol.create({
    _id: 'user-david-1',
    name: 'David Kumar',
    email: 'david.kumar@cms.cybersec.edu',
    password: passwordHash,
    role: 'user',
    status: 'active',
    department: 'Cloud Infrastructure Security',
    storageUsed: 5800000,
    storageQuota: 104857600,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 86400000).toISOString()
  });

  const emma = usersCol.create({
    _id: 'user-emma-1',
    name: 'Emma Wilson',
    email: 'emma.wilson@cms.cybersec.edu',
    password: passwordHash,
    role: 'user',
    status: 'inactive',
    department: 'Application Penetration Testing',
    storageUsed: 1200000,
    storageQuota: 104857600,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    lastLoginAt: new Date(Date.now() - 259200000).toISOString()
  });

  // 4. Categories
  const catCol = dbStore.getCollection('categories');
  const catResearch = catCol.create({
    _id: 'cat-1',
    name: 'Research Papers & Specs',
    slug: 'research-papers',
    description: 'Peer-reviewed academic research papers, formal specifications, and threat model analyses.',
    color: '#3b82f6',
    assetCount: 3
  });

  const catArchitecture = catCol.create({
    _id: 'cat-2',
    name: 'System Architecture Diagrams',
    slug: 'architecture-diagrams',
    description: 'Visual system topologies, zero-trust network boundaries, and cryptographic workflow diagrams.',
    color: '#8b5cf6',
    assetCount: 2
  });

  const catIncident = catCol.create({
    _id: 'cat-3',
    name: 'Incident Response Reports',
    slug: 'incident-response',
    description: 'Post-incident root cause forensics, audit summaries, and containment timelines.',
    color: '#ef4444',
    assetCount: 2
  });

  const catPolicy = catCol.create({
    _id: 'cat-4',
    name: 'Security Governance & Policies',
    slug: 'governance-policies',
    description: 'Institutional compliance standards, RBAC privilege policies, and data handling protocols.',
    color: '#10b981',
    assetCount: 2
  });

  const catMedia = catCol.create({
    _id: 'cat-5',
    name: 'Instructional Media & Audio',
    slug: 'instructional-media',
    description: 'Lecture audio recordings, walkthroughs, presentations, and cyber lab assets.',
    color: '#f59e0b',
    assetCount: 2
  });

  // 5. Create actual physical sample asset files on disk
  const samplePdfPath = path.resolve(UPLOAD_DIR, 'nist-zero-trust-architecture-sp800-207.pdf');
  const sampleTxtPath = path.resolve(UPLOAD_DIR, 'rbac-security-policy-guidelines-2026.txt');
  const sampleSvgPath = path.resolve(UPLOAD_DIR, 'network-topology-defense-in-depth.svg');
  const sampleJsonPath = path.resolve(UPLOAD_DIR, 'threat-intel-indicators-ioc.json');
  const sampleAudioTxtPath = path.resolve(UPLOAD_DIR, 'cryptanalysis-lecture-overview.txt');

  fs.writeFileSync(samplePdfPath, `%PDF-1.4\n1 0 obj\n<< /Title (NIST SP 800-207 Zero Trust Architecture Guide)\n/Author (Department of Cyber Security) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\nSample NIST 800-207 Zero Trust Document for College Final Year Project Verification.`);
  fs.writeFileSync(sampleTxtPath, `# INSTITUTIONAL ACCESS CONTROL & RBAC STANDARD (2026)\n\n1. Purpose: Enforce strict least-privilege role-based access control.\n2. Invariants: Server-side token validation, role hierarchy, auditable transactions.\n3. Implementation: Digital Asset & Content Management System.`);
  fs.writeFileSync(sampleSvgPath, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <rect width="800" height="500" fill="#0f172a"/>
    <text x="400" y="50" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8" text-anchor="middle">Enterprise Zero-Trust Network Defense Topology</text>
    <rect x="50" y="100" width="200" height="120" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
    <text x="150" y="145" font-family="system-ui" font-size="14" fill="#f8fafc" text-anchor="middle" font-weight="600">Identity &amp; Access (IdP)</text>
    <text x="150" y="175" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">JWT / RBAC Policy Engine</text>
    <rect x="300" y="100" width="200" height="120" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
    <text x="400" y="145" font-family="system-ui" font-size="14" fill="#f8fafc" text-anchor="middle" font-weight="600">API Gateway &amp; Shield</text>
    <text x="400" y="175" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">Helmet / Rate Limiting</text>
    <rect x="550" y="100" width="200" height="120" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <text x="650" y="145" font-family="system-ui" font-size="14" fill="#f8fafc" text-anchor="middle" font-weight="600">Encrypted Asset Vault</text>
    <text x="650" y="175" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">RBAC Access Boundary</text>
    <line x1="250" y1="160" x2="300" y2="160" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4"/>
    <line x1="500" y1="160" x2="550" y2="160" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4"/>
    <rect x="150" y="300" width="500" height="140" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <text x="400" y="340" font-family="system-ui" font-size="15" fill="#f8fafc" text-anchor="middle" font-weight="600">Immutable Audit Logging &amp; Threat Intelligence Stream</text>
    <text x="400" y="375" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">Every CRUD event, authentication change, and file download is permanently cataloged.</text>
  </svg>`);
  fs.writeFileSync(sampleJsonPath, JSON.stringify({
    feed: 'CISA Alert AA24-300A',
    threatCategory: 'Advanced Persistent Threat',
    targetAssets: ['CMS Repositories', 'Unauthenticated Endpoints'],
    mitigation: 'Strict HTTP-only JWT cookies, RBAC, input sanitization'
  }, null, 2));
  fs.writeFileSync(sampleAudioTxtPath, `[TRANSCRIPT - CYBER FORENSICS LECTURE 07]\nTopic: Memory dump carving, volatile artifact recovery, and non-repudiation in digital asset investigations.`);

  // 6. Assets Collection
  const assetsCol = dbStore.getCollection('assets');
  const asset1 = assetsCol.create({
    _id: 'asset-1',
    originalName: 'nist-zero-trust-architecture-sp800-207.pdf',
    storedName: 'nist-zero-trust-architecture-sp800-207.pdf',
    title: 'NIST SP 800-207 Zero Trust Architecture Specification',
    description: 'Comprehensive guidelines on deploying zero trust enterprise environments, continuous authentication, and micro-segmentation.',
    mimeType: 'application/pdf',
    size: 2450000,
    category: 'Research Papers & Specs',
    tags: ['zero-trust', 'nist', 'compliance', 'architecture'],
    ownerId: admin._id,
    ownerName: admin.name,
    visibility: 'public',
    status: 'active',
    downloadCount: 42,
    filePath: 'nist-zero-trust-architecture-sp800-207.pdf',
    createdAt: new Date(Date.now() - 604800000).toISOString()
  });

  const asset2 = assetsCol.create({
    _id: 'asset-2',
    originalName: 'network-topology-defense-in-depth.svg',
    storedName: 'network-topology-defense-in-depth.svg',
    title: 'Enterprise Defense-in-Depth Network Blueprint',
    description: 'Detailed multi-tier network architecture diagram illustrating perimeter firewalling, DMZ, and internal asset vault protection.',
    mimeType: 'image/svg+xml',
    size: 450000,
    category: 'System Architecture Diagrams',
    tags: ['diagram', 'network', 'zero-trust', 'topology'],
    ownerId: admin._id,
    ownerName: admin.name,
    visibility: 'public',
    status: 'active',
    downloadCount: 78,
    filePath: 'network-topology-defense-in-depth.svg',
    createdAt: new Date(Date.now() - 518400000).toISOString()
  });

  const asset3 = assetsCol.create({
    _id: 'asset-3',
    originalName: 'rbac-security-policy-guidelines-2026.txt',
    storedName: 'rbac-security-policy-guidelines-2026.txt',
    title: 'Institutional Role-Based Access Control Directive',
    description: 'Internal security guidelines defining role escalation prevention, separation of duties, and authorization matrices.',
    mimeType: 'text/plain',
    size: 98000,
    category: 'Security Governance & Policies',
    tags: ['rbac', 'policy', 'governance', 'cybersecurity'],
    ownerId: editor._id,
    ownerName: editor.name,
    visibility: 'restricted',
    status: 'active',
    downloadCount: 19,
    filePath: 'rbac-security-policy-guidelines-2026.txt',
    createdAt: new Date(Date.now() - 345600000).toISOString()
  });

  const asset4 = assetsCol.create({
    _id: 'asset-4',
    originalName: 'threat-intel-indicators-ioc.json',
    storedName: 'threat-intel-indicators-ioc.json',
    title: 'Q4 Indicators of Compromise (IoC) Threat Feed',
    description: 'Structured JSON telemetry of detected malicious hashes, command-and-control IPs, and compromised user-agent patterns.',
    mimeType: 'application/json',
    size: 154000,
    category: 'Incident Response Reports',
    tags: ['threat-intel', 'ioc', 'incident-response', 'json'],
    ownerId: alice._id,
    ownerName: alice.name,
    visibility: 'private',
    status: 'active',
    downloadCount: 5,
    filePath: 'threat-intel-indicators-ioc.json',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  });

  const asset5 = assetsCol.create({
    _id: 'asset-5',
    originalName: 'cryptanalysis-lecture-overview.txt',
    storedName: 'cryptanalysis-lecture-overview.txt',
    title: 'Cryptanalysis & Quantum-Resistant Algorithms Brief',
    description: 'Lecture summary examining lattice-based cryptography, Kyber key encapsulation, and post-quantum migration strategies.',
    mimeType: 'text/plain',
    size: 112000,
    category: 'Instructional Media & Audio',
    tags: ['cryptography', 'quantum', 'research', 'algorithms'],
    ownerId: bob._id,
    ownerName: bob.name,
    visibility: 'public',
    status: 'active',
    downloadCount: 31,
    filePath: 'cryptanalysis-lecture-overview.txt',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  });

  // 7. Content Collection
  const contentCol = dbStore.getCollection('contents');
  contentCol.create({
    _id: 'content-1',
    title: 'Implementation of Zero-Trust RBAC in Modern Cloud CMS Architectures',
    slug: 'implementation-zero-trust-rbac-cloud-cms',
    summary: 'A deep dive into how cryptographic session verification and granular server-side authorization prevent horizontal privilege escalation in asset repositories.',
    body: `Role-Based Access Control (RBAC) remains the gold standard in organizational security systems. However, modern perimeterless architectures demand integrating Zero-Trust principles directly into the web application tier.

Key principles enforced in this implementation:
1. Server-Side Nonce and Token Validation: Every incoming REST call evaluates validated user roles stored securely inside HTTP-only cookies, never trusting client-supplied role payloads.
2. Resource Ownership Enforcement: A user possesses explicit write and delete privileges exclusively over resources tied to their verified User ID, preventing Broken Object Level Authorization (BOLA).
3. Immutable Audit Trails: Security auditors can trace every file read, access request, and role modification with non-repudiable timestamping.`,
    category: 'Research Papers & Specs',
    tags: ['zero-trust', 'rbac', 'security-architecture', 'cloud'],
    authorId: admin._id,
    authorName: admin.name,
    status: 'published',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    reviewedById: admin._id,
    reviewedByName: admin.name,
    reviewedAt: new Date(Date.now() - 432000000).toISOString()
  });

  contentCol.create({
    _id: 'content-2',
    title: 'Securing File Upload Pipelines Against Web Shell and MIME Confusion Exploits',
    slug: 'securing-file-upload-pipelines-mime-confusion',
    summary: 'Analysis of upload sanitization, binary magic-byte inspection, file-size enforcement, and isolated storage pathways to thwart remote code execution.',
    body: `File upload vulnerabilities frequently introduce critical Remote Code Execution (RCE) vectors when developers rely solely on filename extensions.

To achieve robust defense-in-depth:
- Strip path traversal tokens (\`..\`) and normalize filenames using UUID storage keys.
- Store uploaded files strictly outside the public web root.
- Validate Content-Type headers in tandem with server-side buffer inspections.
- Enforce strict per-user storage quotas to mitigate denial-of-service attempts via disk exhaustion.`,
    category: 'Security Governance & Policies',
    tags: ['file-upload', 'rce', 'web-security', 'owasp'],
    authorId: alice._id,
    authorName: alice.name,
    status: 'published',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    reviewedById: editor._id,
    reviewedByName: editor.name,
    reviewedAt: new Date(Date.now() - 172800000).toISOString()
  });

  contentCol.create({
    _id: 'content-3',
    title: 'Analysis of Supply Chain Vulnerabilities in Node.js NPM Ecosystems',
    slug: 'analysis-supply-chain-vulnerabilities-npm',
    summary: 'Investigation of malicious package typosquatting, dependency confusion attacks, and automated SBOM verification protocols.',
    body: `Modern software development heavily relies on external package registries. This article presents a systematic study on verifying software bill of materials (SBOM) and conducting automated security audits during CI/CD execution.`,
    category: 'Research Papers & Specs',
    tags: ['supply-chain', 'npm', 'dependencies', 'devsecops'],
    authorId: bob._id,
    authorName: bob.name,
    status: 'pending_review',
    createdAt: new Date(Date.now() - 72000000).toISOString()
  });

  contentCol.create({
    _id: 'content-4',
    title: 'Bypassing Legacy WAF Rules via Unicode Homoglyph Obfuscation',
    slug: 'bypassing-legacy-waf-unicode-homoglyph',
    summary: 'Technical review on character encoding quirks that can evade static regex-based web application firewalls.',
    body: `This research article explores character set transformations. Needs additional mitigation guidelines before publication approval.`,
    category: 'Incident Response Reports',
    tags: ['waf', 'evasion', 'unicode'],
    authorId: david._id,
    authorName: david.name,
    status: 'rejected',
    rejectionReason: 'Requires detailed defensive remediation steps and responsible disclosure compliance before public dissemination.',
    reviewedById: editor._id,
    reviewedByName: editor.name,
    reviewedAt: new Date(Date.now() - 36000000).toISOString(),
    createdAt: new Date(Date.now() - 108000000).toISOString()
  });

  // 8. Access Requests
  const accessReqCol = dbStore.getCollection('access_requests');
  accessReqCol.create({
    _id: 'req-1',
    assetId: asset3._id,
    assetTitle: asset3.title,
    requesterId: alice._id,
    requesterName: alice.name,
    requesterEmail: alice.email,
    ownerId: editor._id,
    status: 'pending',
    reason: 'Requesting access to examine the Institutional RBAC directive for the upcoming semester network forensics project.',
    createdAt: new Date(Date.now() - 43200000).toISOString()
  });

  accessReqCol.create({
    _id: 'req-2',
    assetId: asset4._id,
    assetTitle: asset4.title,
    requesterId: bob._id,
    requesterName: bob.name,
    requesterEmail: bob.email,
    ownerId: alice._id,
    status: 'approved',
    reason: 'Collaborative analysis on correlating Q4 malicious threat actors with known cryptographic key leakage.',
    reviewNote: 'Approved for collaborative research.',
    reviewedAt: new Date(Date.now() - 14400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  });

  // 9. Shares
  const sharesCol = dbStore.getCollection('shares');
  sharesCol.create({
    _id: 'share-1',
    assetId: asset4._id,
    assetTitle: asset4.title,
    sharedById: alice._id,
    sharedByName: alice.name,
    sharedWithUserId: bob._id,
    sharedWithEmail: bob.email,
    permission: 'download',
    createdAt: new Date(Date.now() - 14400000).toISOString()
  });

  // 10. Notifications
  const notifCol = dbStore.getCollection('notifications');
  notifCol.create({
    _id: 'notif-1',
    userId: admin._id,
    title: 'New Content Submission Pending Review',
    message: 'Bob Martinez submitted "Analysis of Supply Chain Vulnerabilities in Node.js NPM Ecosystems" for publishing approval.',
    type: 'info',
    link: '/admin/approvals',
    isRead: false,
    createdAt: new Date(Date.now() - 72000000).toISOString()
  });

  notifCol.create({
    _id: 'notif-2',
    userId: editor._id,
    title: 'Access Request Received',
    message: 'Alice Smith requested access to "Institutional Role-Based Access Control Directive".',
    type: 'warning',
    link: '/admin/approvals',
    isRead: false,
    createdAt: new Date(Date.now() - 43200000).toISOString()
  });

  notifCol.create({
    _id: 'notif-3',
    userId: alice._id,
    title: 'Asset Shared With You',
    message: 'Prof. Marcus Vance approved your access request for the zero-trust architecture document.',
    type: 'success',
    link: '/user/shared-with-me',
    isRead: true,
    createdAt: new Date(Date.now() - 21600000).toISOString()
  });

  notifCol.create({
    _id: 'notif-4',
    userId: david._id,
    title: 'Submission Review Feedback',
    message: 'Your content submission "Bypassing Legacy WAF Rules" was reviewed with revision notes.',
    type: 'alert',
    link: '/user/submissions',
    isRead: false,
    createdAt: new Date(Date.now() - 36000000).toISOString()
  });

  // 11. Immutable Audit Logs
  const auditCol = dbStore.getCollection('audit_logs');
  const auditEvents = [
    {
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'admin',
      action: 'SYSTEM_BOOT_INITIALIZED',
      resourceType: 'System',
      resourceId: 'sys-0',
      details: 'Digital Asset CMS initialized with Zero-Trust RBAC security policies.',
      timestamp: new Date(Date.now() - 604800000).toISOString()
    },
    {
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'admin',
      action: 'ASSET_UPLOAD',
      resourceType: 'Asset',
      resourceId: asset1._id,
      details: 'Uploaded asset "NIST SP 800-207 Zero Trust Architecture Specification" (application/pdf, 2.45MB).',
      timestamp: new Date(Date.now() - 604700000).toISOString()
    },
    {
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'admin',
      action: 'ROLE_POLICY_CONFIGURED',
      resourceType: 'Role',
      resourceId: 'role-editor',
      details: 'Updated granular permissions matrix for Content Editor role.',
      timestamp: new Date(Date.now() - 500000000).toISOString()
    },
    {
      actorId: alice._id,
      actorEmail: alice.email,
      actorRole: 'user',
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'Auth',
      resourceId: alice._id,
      details: 'Secure login via HTTP-only JWT session from 192.168.1.104.',
      timestamp: new Date(Date.now() - 172850000).toISOString()
    },
    {
      actorId: alice._id,
      actorEmail: alice.email,
      actorRole: 'user',
      action: 'ASSET_UPLOAD',
      resourceType: 'Asset',
      resourceId: asset4._id,
      details: 'Uploaded private threat telemetry "Q4 Indicators of Compromise Threat Feed" (application/json, 154KB).',
      timestamp: new Date(Date.now() - 172800000).toISOString()
    },
    {
      actorId: editor._id,
      actorEmail: editor.email,
      actorRole: 'editor',
      action: 'CONTENT_PUBLISHED',
      resourceType: 'Content',
      resourceId: 'content-2',
      details: 'Approved and published article: "Securing File Upload Pipelines Against Web Shell Exploits".',
      timestamp: new Date(Date.now() - 172700000).toISOString()
    },
    {
      actorId: david._id,
      actorEmail: david.email,
      actorRole: 'user',
      action: 'ACCESS_REQUEST_SUBMITTED',
      resourceType: 'AccessRequest',
      resourceId: 'req-1',
      details: 'Submitted access request for restricted asset "Institutional Role-Based Access Control Directive".',
      timestamp: new Date(Date.now() - 43200000).toISOString()
    },
    {
      actorId: editor._id,
      actorEmail: editor.email,
      actorRole: 'editor',
      action: 'CONTENT_REJECTED',
      resourceType: 'Content',
      resourceId: 'content-4',
      details: 'Rejected submission "Bypassing Legacy WAF Rules via Unicode Homoglyph Obfuscation" with revision requirement.',
      timestamp: new Date(Date.now() - 36000000).toISOString()
    },
    {
      actorId: alice._id,
      actorEmail: alice.email,
      actorRole: 'user',
      action: 'ASSET_DOWNLOAD_AUTHORIZED',
      resourceType: 'Asset',
      resourceId: asset2._id,
      details: 'Authorized secure download of "Enterprise Defense-in-Depth Network Blueprint".',
      timestamp: new Date(Date.now() - 12000000).toISOString()
    }
  ];

  for (const evt of auditEvents) {
    auditCol.create({
      _id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      ...evt
    });
  }

  // 12. System Settings
  const settingsCol = dbStore.getCollection('system_settings');
  settingsCol.create({
    _id: 'sys-settings-1',
    appName: 'SecureAsset CMS',
    orgName: 'Department of Computer Science & Cyber Security',
    maxUploadSizeMB: 50,
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'text/markdown', 'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4', 'audio/mpeg'
    ],
    defaultStorageQuotaMB: 100,
    enableRegistration: true,
    enableAuditLog: true,
    maintenanceMode: false,
    updatedAt: new Date().toISOString()
  });

  console.log('Database seeded successfully with administrator, test users, assets, content, and security audit records.');
}
