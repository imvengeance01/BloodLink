# API Request & Response Reference

All JSON request/response shapes match the frontend types. Base URL: `http://localhost:3001` (or your deployed URL).

---

## Public

### GET /api/public/stats

No auth.

**Response 200**
```json
{
  "activeRequests": 0,
  "availableDonors": 12,
  "organizations": 3
}
```

---

## Auth

### POST /api/auth/login

**Request**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response 200**
```json
{
  "user": {
    "id": "cuid",
    "name": "Jane",
    "email": "user@example.com",
    "role": "receiver",
    "city": "Mumbai",
    "contactNumber": "+919876543210",
    "createdAt": "2025-02-05T00:00:00.000Z",
    "receiverType": "individual",
    "isVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 401** — wrong email or password  
`{ "error": "No account found with this email" | "Incorrect password", "code": "INVALID_CREDENTIALS" }`

---

### POST /api/auth/register/receiver

**Request**
```json
{
  "name": "City Hospital",
  "email": "hospital@example.com",
  "password": "password123",
  "city": "Mumbai",
  "contactNumber": "+919876543210",
  "receiverType": "hospital"
}
```
`receiverType`: `"individual"` | `"hospital"`. For `"hospital"` a verification request is created automatically.

**Response 201** — same shape as login: `{ "user", "token" }`.

**Response 409** — email already exists  
`{ "error": "An account with this email already exists", "code": "EMAIL_EXISTS" }`

---

### POST /api/auth/register/donor

**Request**
```json
{
  "name": "Donor Name",
  "email": "donor@example.com",
  "password": "password123",
  "city": "Mumbai",
  "contactNumber": "+919876543210",
  "bloodGroup": "O+",
  "lastDonationDate": "2024-01-01"
}
```
`bloodGroup`: one of `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.  
`lastDonationDate` optional, ISO date string.

**Response 201** — `{ "user", "token" }`. User includes `bloodGroup`, `lastDonationDate`, `cooldownEndDate` (optional).

---

### POST /api/auth/register/organization

**Request**
```json
{
  "name": "Blood Bank XYZ",
  "email": "org@example.com",
  "password": "password123",
  "city": "Mumbai",
  "contactNumber": "+919876543210",
  "organizationType": "blood_bank",
  "licenseId": "LIC-123"
}
```
`organizationType`: `"blood_bank"` | `"ngo"`.

**Response 201** — `{ "user", "token" }`.

---

### GET /api/auth/me

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "user": { ... }
}
```
Same user shape as login (no password).

**Response 401** — missing or invalid token  
`{ "error": "Authentication required", "code": "UNAUTHORIZED" }`

---

## Users

### PATCH /api/users/me

**Headers:** `Authorization: Bearer <token>`

**Request** — all fields optional
```json
{
  "name": "New Name",
  "contactNumber": "+919999999999",
  "city": "Delhi"
}
```

**Response 200**
```json
{
  "user": { ... }
}
```

---

## Requests

All request routes require auth.

### GET /api/requests

**Headers:** `Authorization: Bearer <token>`

**Query (optional):** `city`, `status`. For receiver: list is filtered by current user. For donor: defaults to `city=user.city`, `status=pending`. For organization: defaults to `city=user.city`.

**Response 200**
```json
[
  {
    "id": "cuid",
    "receiverId": "cuid",
    "receiverName": "Hospital",
    "receiverContact": "+919876543210",
    "bloodGroup": "O+",
    "unitsNeeded": 2,
    "hospitalName": "City Hospital",
    "city": "Mumbai",
    "urgencyLevel": "emergency",
    "notes": "Optional",
    "status": "pending",
    "createdAt": "2025-02-05T00:00:00.000Z",
    "updatedAt": "2025-02-05T00:00:00.000Z"
  }
]
```

---

### GET /api/requests/:id

**Response 200** — single request object.  
**Response 404** — not found.

---

### POST /api/requests

**Role:** receiver only.

**Request**
```json
{
  "bloodGroup": "O+",
  "unitsNeeded": 2,
  "hospitalName": "City Hospital",
  "city": "Mumbai",
  "urgencyLevel": "emergency",
  "notes": "Optional"
}
```
`urgencyLevel`: `"emergency"` | `"within_24_hours"` | `"planned"`.

**Response 201** — created request object.

---

### PATCH /api/requests/:id

**Request** — e.g. cancel or mark fulfilled
```json
{
  "status": "cancelled"
}
```
`status`: `"pending"` | `"matched"` | `"fulfilled"` | `"cancelled"`.

**Response 200** — updated request object.

---

### POST /api/requests/:id/accept

**Role:** donor only. Matches request to donor, creates donation record, sets 3‑month cooldown.

**Response 200** — updated request (status `matched`, donor fields set).

**Response 400** — e.g. request not pending, wrong city, donor on cooldown.

---

## Donations

### GET /api/donations

**Headers:** `Authorization: Bearer <token>`

**Query:** `donorId=me` or omit (current user as donor).

**Response 200**
```json
[
  {
    "id": "cuid",
    "donorId": "cuid",
    "requestId": "cuid",
    "receiverName": "Hospital",
    "bloodGroup": "O+",
    "hospitalName": "City Hospital",
    "donationDate": "2025-02-05T00:00:00.000Z",
    "cooldownEndDate": "2025-05-05T00:00:00.000Z"
  }
]
```

---

## Inventory

**Role:** organization only.

### GET /api/inventory

**Query:** `organizationId=me` or omit.

**Response 200**
```json
[
  {
    "id": "cuid",
    "organizationId": "cuid",
    "bloodGroup": "O+",
    "units": 10,
    "stockLevel": "adequate",
    "expiryDate": "2025-06-01",
    "lastUpdated": "2025-02-05T00:00:00.000Z"
  }
]
```
`stockLevel`: `"critical"` | `"low"` | `"adequate"` | `"full"`.

---

### POST /api/inventory

**Request**
```json
{
  "bloodGroup": "O+",
  "units": 10,
  "expiryDate": "2025-06-01"
}
```
If an item for that blood group already exists for the org, it is updated (upsert).

**Response 201** — created/updated inventory item.

---

### PATCH /api/inventory/:id

**Request**
```json
{
  "units": 15,
  "expiryDate": "2025-07-01"
}
```
Both optional.

**Response 200** — updated item. **Response 404** — not found.

---

## Verifications

**Role:** organization only.

### GET /api/verifications

**Query:** `city`, `status` (optional). Defaults to organization’s city.

**Response 200**
```json
[
  {
    "id": "cuid",
    "hospitalId": "cuid",
    "hospitalName": "City Hospital",
    "hospitalEmail": "hospital@example.com",
    "city": "Mumbai",
    "status": "pending",
    "notes": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2025-02-05T00:00:00.000Z"
  }
]
```

---

### PATCH /api/verifications/:id

**Request**
```json
{
  "status": "approved",
  "notes": "Optional notes"
}
```
`status`: `"approved"` | `"rejected"`. Approving sets the hospital user’s `isVerified` to `true`.

**Response 200** — updated verification. **Response 404** — not found.

---

## Error responses

- **400** — validation or business rule: `{ "error": "...", "code": "VALIDATION_ERROR" | "BAD_REQUEST", "details": [...] }`
- **401** — `{ "error": "Authentication required", "code": "UNAUTHORIZED" }`
- **403** — `{ "error": "Insufficient permissions" | "...", "code": "FORBIDDEN" }`
- **404** — `{ "error": "Not found", "code": "NOT_FOUND" }`
- **409** — e.g. email exists: `{ "error": "...", "code": "EMAIL_EXISTS" }`
- **429** — rate limit: `{ "error": "Too many requests", "code": "RATE_LIMIT" }`
