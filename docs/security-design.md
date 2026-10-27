# Cybersecurity Architecture & RBAC Threat Mitigation

### 1. Role-Based Access Control (RBAC) Matrix

| Feature / Permission | Administrator (`admin`) | Editor / Reviewer (`editor`) | Standard User (`user`) | Unauthenticated Visitor |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard** | Complete System Metrics | Content & Review Queue | Personal Quota & Assets | No (Redirect to Login) |
| **Upload Assets** | Yes (Unlimited/Configured) | Yes | Yes (Quota Bounded) | No |
| **View Public Assets** | Yes | Yes | Yes | Yes |
| **View Restricted Assets** | Yes | Yes | If Approved / Shared | No |
| **View Private Assets** | Yes | Own Only | Own Only | No |
| **Edit Asset Metadata** | All Assets | All Assets | Own Assets Only | No |
| **Delete Asset (Soft)** | Any Asset | No | Own Assets Only | No |
| **Permanent File Purge** | Yes | No | No | No |
| **Download Asset File** | Yes (Logged) | Yes (Logged) | Authorized Only | Public Only |
| **Peer Sharing** | Yes | Yes | Own Assets | No |
| **Request Asset Access** | N/A | Yes | Yes | No |
| **Review Access Requests**| Yes | Yes | For Owned Assets | No |
| **Submit Content** | Yes (Direct Publish) | Yes (Direct Publish) | Yes (Pending Review) | No |
| **Approve / Reject Content**| Yes | Yes | No | No |
| **User Management** | Create / Role / Status | View Directory Only | No | No |
| **Demote Last Admin** | Blocked by Invariant | No | No | No |
| **Immutable Audit Logs** | View & CSV Export | View Only | No | No |
| **System Settings** | Full Configuration | No | No | No |

### 2. OWASP Top 10 Mitigation Strategies
1. **Broken Access Control (A01:2021)**:
   - Server-side authorization middleware verifies the user's role and permission on every single API request.
   - Resource ownership validation is computed on the server (`asset.ownerId === req.user._id`), never relying on client headers.
2. **Cryptographic Failures (A02:2021)**:
   - Passwords hashed with bcrypt (work factor 10).
   - Sessions signed with high-entropy JWT secrets stored in environment variables.
   - Password reset tokens stored as SHA-256 hashes with 1-hour expiration.
3. **Injection (A03:2021)**:
   - JSON parameter validation and typed schemas prevent NoSQL parameter injection.
   - Filenames stripped of path traversal sequences (`..`, `/`, `\`).
4. **Vulnerable and Outdated Components (A06:2021)**:
   - Modern dependencies audited and pinned to stable LTS releases.
5. **Identification and Authentication Failures (A07:2021)**:
   - Tokens stored exclusively in HTTP-only, SameSite cookies.
   - Account status check halts inactive or suspended users immediately.
6. **Security Logging and Monitoring Failures (A09:2021)**:
   - Immutable audit logs capture actor ID, action, resource, IP address, user-agent, and timestamps.
   - Exportable to RFC-4180 CSV for compliance reviews.
