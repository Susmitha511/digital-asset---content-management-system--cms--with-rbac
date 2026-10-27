# Digital Asset & Content Management System (CMS) with Role-Based Access Control (RBAC)
### Final-Year B.E. Computer Science and Engineering (Cyber Security) Academic Project

An enterprise-grade, zero-trust digital asset and content management system engineered with the full MERN paradigm (MongoDB, Express.js, React, Node.js) with strict Role-Based Access Control, server-side authorization enforcement, sanitized file storage pipelines, and an immutable security audit logging trail.

---

## 🛡️ Key Cybersecurity Features

- **Role-Based Access Control (RBAC)**: Fine-grained permissions matrix mapped dynamically to system roles:
  - **Administrator (`admin`)**: Complete supervisory control, user provisioning, security policies, storage limits, and immutable audit logs.
  - **Content Editor / Reviewer (`editor`)**: Moderation approval queue, content publishing, asset categorization.
  - **Standard User (`user`)**: Individual encrypted asset vault, access request workflow, peer sharing, and publication drafting.
- **Cryptographic Session Authentication**:
  - Passwords securely hashed with `bcrypt` (work factor 10).
  - High-entropy JSON Web Tokens (JWT) stored exclusively in `HTTP-only`, `SameSite` cookies to prevent client-side XSS credential harvesting.
- **Defenses Against Broken Object-Level Authorization (BOLA)**:
  - All resource queries evaluate ownership server-side (`asset.ownerId === req.user._id || req.user.role === 'admin'`). Client-supplied role claims are never trusted.
- **File Ingestion Security Pipeline**:
  - Path traversal defense: Uploaded filenames are stripped of `../` sequences and given unique cryptographically random UUID storage keys.
  - MIME type verification and file extension whitelisting.
  - Storage quota enforcement preventing Denial of Service (DoS) via server disk exhaustion.
  - Streamed authorized downloads with download count telemetry and audit logging.
- **Immutable Security Audit Trail**:
  - Non-repudiable audit logging stream capturing timestamp, actor ID, email, action, resource type, details, and client IP address.
  - RFC-4180 compliant CSV export for institutional security reviews.
- **Last Active Administrator Invariant**:
  - Application logic strictly prohibits demoting or deactivating the last active administrator account, preventing administrative lockout.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Node.js (v22), Express.js, Multer, Helmet, Cookie-Parser, CORS |
| **Database** | Mongoose Schemas (MongoDB Atlas ready) & High-Performance Persistent JSON Document Store |
| **Security** | JWT, bcryptjs, crypto, HTTP-only Cookies |
| **Testing** | Automated Security & RBAC Test Suite |

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration values in `.env`:
- `PORT=3000`
- `JWT_SECRET=your_jwt_secret_key`
- `MONGODB_URI=` (Optional: Leave empty for zero-config persistent local engine, or provide your MongoDB Atlas URI for production)
- `UPLOAD_DIR=./uploads`

### 3. Run Development Server
```bash
npm run dev
```
The server will boot at `http://localhost:3000` with the Vite frontend automatically integrated into Express middlewares.

### 4. Run Test Suite
```bash
npm test
```

---

## 👥 Evaluator Demonstration Accounts

The system automatically initializes demonstration accounts with rich sample data on initial startup.
**Uniform Demo Password:** `CyberSec@2026!`

| Role | Email | Name / Department |
| :--- | :--- | :--- |
| **Administrator** | `admin@cms.cybersec.edu` | Prof. Marcus Vance (Cyber Security Operations) |
| **Lead Reviewer** | `reviewer@cms.cybersec.edu` | Elena Rostova (Media & Governance) |
| **Student / Researcher** | `alice.smith@cms.cybersec.edu` | Alice Smith (Network Forensics Lab) |
| **Student / Researcher** | `bob.martinez@cms.cybersec.edu` | Bob Martinez (Cryptographic Protocols Lab) |

> **Pro Tip**: Use the **"Demo Roles"** dropdown in the top navbar or the quick-login cards on the login page for 1-click evaluator switching!

---

## 📚 Project Documentation Files

All academic project review materials are available both in the repository and directly in the app via the **"Project Docs & ERD"** tab:
- `docs/architecture.md`: System Architecture & Data Flow diagrams
- `docs/database-design.md`: ER Diagram (Mermaid) and Mongoose Schema specifications
- `docs/security-design.md`: RBAC Matrix & OWASP Top 10 mitigation strategies
- `docs/user-manual.md`: Project Demonstration & Evaluator User Manual
