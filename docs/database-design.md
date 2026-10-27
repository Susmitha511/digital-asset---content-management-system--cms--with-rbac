# Database Design & Entity Relationship Model

### 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ ASSET : owns
    USER ||--o{ CONTENT : authors
    USER ||--o{ ACCESS_REQUEST : submits
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : generates
    CATEGORY ||--o{ ASSET : classifies
    CATEGORY ||--o{ CONTENT : categorizes
    ASSET ||--o{ ACCESS_REQUEST : target
    ASSET ||--o{ SHARE : subject
    USER ||--o{ SHARE : recipient
    ROLE ||--|{ USER : assigned_to

    USER {
        string _id PK
        string name
        string email UK
        string password
        string role FK
        string status
        string department
        number storageUsed
        number storageQuota
        datetime createdAt
    }

    ASSET {
        string _id PK
        string originalName
        string storedName UK
        string title
        string description
        string mimeType
        number size
        string category FK
        string[] tags
        string ownerId FK
        string visibility
        string status
        number downloadCount
        boolean isDeleted
        datetime createdAt
    }

    CONTENT {
        string _id PK
        string title
        string slug UK
        string summary
        string body
        string category FK
        string[] tags
        string authorId FK
        string status
        string rejectionReason
        string reviewedById FK
        datetime publishedAt
        datetime createdAt
    }

    ACCESS_REQUEST {
        string _id PK
        string assetId FK
        string requesterId FK
        string ownerId FK
        string status
        string reason
        string reviewNote
        datetime createdAt
    }

    SHARE {
        string _id PK
        string assetId FK
        string sharedById FK
        string sharedWithUserId FK
        string permission
        datetime createdAt
    }

    AUDIT_LOG {
        string _id PK
        string actorId
        string actorEmail
        string actorRole
        string action
        string resourceType
        string resourceId
        string details
        string ipAddress
        datetime timestamp
    }
```

### 2. Indexes & Performance Optimizations
- `User.email`: Unique index for $O(1)$ authentication lookups.
- `Asset.ownerId` + `Asset.createdAt`: Compound index for rapid personal repository queries.
- `Asset.category`: Index for rapid taxonomic filtering.
- `Content.slug`: Unique index for SEO and direct URL resolution.
- `AuditLog.timestamp`: Descending index for rapid security telemetry feeds.
