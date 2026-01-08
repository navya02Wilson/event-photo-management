# EventPhotoManagementServer – Backend Cursor Rules (Node.js)

## Project Overview
Node.js backend using **Express.js**, **PostgreSQL**, **JWT authentication**, **Google Drive integration**, and **face recognition (vector embeddings)**.  
The project follows a **strict layered architecture** with **explicit entity (model) definitions**.

---

## Architecture Principles (STRICT)

- Layered architecture is **MANDATORY**
- Each layer has **one responsibility**
- **No shortcuts**
- **No cross-layer violations**

```
Routes → Controllers → Services → Repositories → Models → Database
```

---

## Folder Structure (MANDATORY)

```
src/
├── app.js
├── server.js
│
├── config/
├── routes/
├── controllers/
├── services/          # Business logic + validation
├── repositories/
├── models/            # 🔴 ENTITY LAYER
├── middlewares/
├── exceptions/
├── utils/
├── security/
└── db/
    └── migrations/
```

---

## Entity (Model) Rules – CRITICAL

### Definition
- **Entities are defined as Models**
- Models MUST be placed ONLY inside:
```
src/models/
```

### Model Rules
Models:
- Represent database rows
- Contain fields and constructor only

Models MUST NOT:
- Contain business logic
- Access repositories
- Access services
- Perform validation
- Format API responses

### Example
```js
class Event {
  constructor({ id, name, eventDate, createdAt, updatedAt, isDeleted }) {
    this.id = id;
    this.name = name;
    this.eventDate = eventDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isDeleted = isDeleted;
  }
}

module.exports = Event;
```

---

## Controller Rules

- Controllers handle:
  - Request parsing
  - Calling service methods
- Controllers MUST NOT:
  - Contain business logic
  - Call repositories
  - Perform validation
  - Access database
- Controllers MUST:
  - Be async
  - Use asyncHandler
  - Return standardized responses

---

## Service Rules

- Services contain ALL business logic AND validation
- Services MAY call:
  - Their own repository
  - Other services
- Services MUST:
  - Validate inputs and business rules
  - Validate entity existence
  - Throw custom AppError
  - Handle all timestamps and audit fields
  - Use UTC timestamps
- Services MUST NOT:
  - Format HTTP responses

---

## Repository Rules (VERY IMPORTANT)

- Repositories contain ONLY database logic
- Repositories MUST:
  - Return Models
  - Use parameterized queries
- Repositories MUST NOT:
  - Contain business logic
  - Call other repositories

### Batch Operations (CRITICAL)
❌ NEVER do DB operations inside loops

✅ ALWAYS use batch queries

---

## Soft Delete Rules

- All transactional tables MUST include:
  - `is_deleted BOOLEAN DEFAULT false`
- Repositories MUST always filter:
```
is_deleted = false
```
- Physical deletes are FORBIDDEN for business data

---

## DTO Rules

- DTOs define API contracts
- DTOs MUST NOT:
  - Be reused as models
  - Contain database fields blindly
- Mapping handled by service and mappers

---

## Mapper Rules

- Mappers convert:
  - Model → Response DTO
  - Request DTO → Model
- Mappers MUST:
  - Be stateless
  - Handle null safety

---

## Timestamp Rules

- ALWAYS use UTC
- Use:
```js
new Date().toISOString()
```
- Client-provided timestamps are FORBIDDEN

---

## API Route Rules

- Hardcoded paths are FORBIDDEN
- Routes MUST use constants from:
```
constants/apiRoutes.js
```

---

## Security Rules

- JWT required for all endpoints except `/auth/**`
- Secrets MUST come from environment variables
- NEVER hardcode:
  - API keys
  - Tokens
  - Passwords
- NEVER log sensitive data

---

## Face Recognition Rules

- Face vectors handled ONLY in:
```
faceEmbedding.service.js
```
- Vector similarity queries ONLY in:
```
faceEmbedding.repository.js
```
- Controllers MUST NOT handle image logic

---

## Database Migration Rules

- PostgreSQL only
- Auto-sync is FORBIDDEN
- Use versioned SQL migrations
- Naming:
```
V1__description.sql
```

---

## Dependency Rules (CRITICAL)

- No circular dependencies
- No repository injection across services
- No service calling controller
- Dependency direction is ONE-WAY

---

## Context-Aware Cursor Instructions

When implementing new code, Cursor MUST:

1. Read existing similar files
2. Follow folder responsibility strictly
3. Implement validation and business logic in service layer
4. Add DTO + mapper as needed
5. Add migration
6. Use batch DB operations
7. Respect soft delete
8. Avoid circular dependencies
9. Use service interfaces logically
10. Never bypass layers

---

## Response Ending Rule (MANDATORY)

After generating or modifying any code or explanation, ALWAYS end with:

**This response is generated after reading cursor rules!!!**

