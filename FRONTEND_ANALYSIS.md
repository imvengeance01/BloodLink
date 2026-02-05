# Frontend Analysis — BloodLink Connect

## Summary

The frontend is a **Lovable-built React (Vite) SPA** with **no HTTP API calls**. All data lives in **localStorage** via `src/lib/storage.ts`. This document derives the exact API surface, data models, and business rules so the backend can support the same behavior.

---

## 1. Tech Stack (Frontend)

- **React 18**, **Vite**, **TypeScript**
- **React Router**, **React Hook Form**, **Zod**
- **TanStack Query** (present but not used for API)
- **Shadcn UI** (Radix), **Tailwind**
- **Auth**: in-memory + localStorage session; no tokens today

---

## 2. User Roles & Types

| Role            | Type field              | Extra fields |
|-----------------|-------------------------|--------------|
| `receiver`      | `receiverType`: `individual` \| `hospital` | `isVerified: boolean` (hospitals only) |
| `donor`         | —                       | `bloodGroup`, `lastDonationDate?`, `cooldownEndDate?` |
| `organization`  | `organizationType`: `blood_bank` \| `ngo` | `licenseId` |

All users share: `id`, `name`, `email`, `password`, `role`, `city`, `contactNumber`, `createdAt`.

---

## 3. Data Models (from `src/types/index.ts`)

- **User** — BaseUser + role-specific (ReceiverUser | DonorUser | OrganizationUser).
- **BloodRequest** — `id`, `receiverId`, `receiverName`, `receiverContact`, `bloodGroup`, `unitsNeeded`, `hospitalName`, `city`, `urgencyLevel`, `notes?`, `status` (`pending` \| `matched` \| `fulfilled` \| `cancelled`), `createdAt`, `updatedAt`, optional: `donorId`, `donorName`, `donorContact`, `fulfilledBy` (`donor` \| `organization`), `organizationId`.
- **DonationRecord** — `id`, `donorId`, `requestId`, `receiverName`, `bloodGroup`, `hospitalName`, `donationDate`, `cooldownEndDate`.
- **BloodInventoryItem** — `id`, `organizationId`, `bloodGroup`, `units`, `stockLevel` (`critical` \| `low` \| `adequate` \| `full`), `expiryDate`, `lastUpdated`.
- **VerificationRequest** — `id`, `hospitalId`, `hospitalName`, `hospitalEmail`, `city`, `status` (`pending` \| `approved` \| `rejected`), `notes?`, `reviewedBy?`, `reviewedAt?`, `createdAt`.

Enums: **BloodGroup** (A+, A-, …), **UrgencyLevel** (`emergency` \| `within_24_hours` \| `planned`), **Cities** (fixed list in frontend).

---

## 4. Auth Flows

- **Login**: `email` + `password` → success returns user (frontend stores in context + localStorage as “session”). Backend must return **user + JWT**.
- **Register**: Role-specific payload; success → user stored as session. For **receiver + hospital**, frontend also creates a **VerificationRequest** (hospitalId empty; backend should create it with real `hospitalId`).
- **Logout**: Clear session (backend: stateless JWT; no endpoint required).
- **updateUser**: `Partial<User>` (name, contactNumber, city) — no email change in UI.
- **refreshUser**: Reload current user by id (backend: **GET /api/auth/me** or **GET /api/users/me** with JWT).

---

## 5. Storage → Required API Surface

| Frontend usage | Storage function(s) | Required backend API |
|----------------|---------------------|------------------------|
| Landing stats | getRequests, getUsers | **GET /api/public/stats** → `{ activeRequests, availableDonors, organizations }` |
| Login          | getUserByEmail       | **POST /api/auth/login** (email, password) → user + token |
| Register       | saveUser, saveVerification (hospital) | **POST /api/auth/register** (role-specific body); backend creates Verification when receiverType=hospital |
| Session / refresh | getUserById      | **GET /api/auth/me** (Bearer) → user |
| Profile update | saveUser             | **PATCH /api/users/me** (name, contactNumber, city) |
| Receiver: my requests | getRequestsByReceiver | **GET /api/requests** (receiverId=me) or **GET /api/users/me/requests** |
| Receiver: create request | saveRequest     | **POST /api/requests** |
| Receiver: cancel / mark fulfilled | saveRequest | **PATCH /api/requests/:id** (status) |
| Donor: compatible requests | getRequests (then filter by city, status=pending, BLOOD_COMPATIBILITY) | **GET /api/requests?city=:city&status=pending** (frontend filters by compatibility) |
| Donor: accept request | saveRequest, saveDonation, saveUser (cooldown) | **POST /api/requests/:id/accept** (donor) or **PATCH /api/requests/:id** + **POST /api/donations**; backend sets donor cooldown (e.g. +3 months) |
| Donor: my donations | getDonationsByDonor | **GET /api/donations** (donorId=me) or **GET /api/users/me/donations** |
| Org: dashboard  | getRequests (by city), getUsers (donors by city), getInventoryByOrganization | **GET /api/requests?city=:city**, **GET /api/users** (scope by role/city or stats), **GET /api/inventory** (organizationId=me) |
| Org: inventory  | getInventoryByOrganization, saveInventoryItem | **GET /api/inventory**, **POST /api/inventory**, **PATCH /api/inventory/:id** |
| Org: verifications | getVerifications (by city), saveVerification, getUsers, saveUser | **GET /api/verifications?city=:city**, **PATCH /api/verifications/:id** (approve/reject); approve updates hospital user `isVerified` |

---

## 6. Derived API Endpoints (Complete)

- **Public**
  - `GET /api/public/stats` — activeRequests, availableDonors, organizations (no auth).
- **Auth**
  - `POST /api/auth/register` — body by role (receiver/donor/organization); returns user + token; creates VerificationRequest when receiverType=hospital.
  - `POST /api/auth/login` — `{ email, password }` → user + token.
  - `GET /api/auth/me` — Bearer → current user.
- **Users**
  - `PATCH /api/users/me` — update name, contactNumber, city.
- **Requests**
  - `GET /api/requests` — query: `receiverId`, `city`, `status` (role-based filtering).
  - `GET /api/requests/:id`
  - `POST /api/requests` — create (receiver).
  - `PATCH /api/requests/:id` — cancel, match, fulfill.
  - `POST /api/requests/:id/accept` — donor accepts (creates donation, sets cooldown, sets request to matched).
- **Donations**
  - `GET /api/donations` — query: `donorId` (or “me”).
- **Inventory**
  - `GET /api/inventory` — query: `organizationId` (or “me”).
  - `POST /api/inventory` — add.
  - `PATCH /api/inventory/:id` — update.
- **Verifications**
  - `GET /api/verifications` — query: `status`, `city`.
  - `POST /api/verifications` — create (or created server-side on hospital register).
  - `PATCH /api/verifications/:id` — approve/reject; approve sets hospital user `isVerified`.

---

## 7. Business Rules (from UI)

- **Donor cooldown**: 3 months after donation (`addMonths(now, 3)` in DonorDashboard).
- **Receiver (hospital)**: `isVerified` false until an organization approves verification; individuals are auto-verified.
- **Blood compatibility**: Frontend uses `BLOOD_COMPATIBILITY`; donor sees requests in same city, status pending, and filters by compatibility. Backend may optionally enforce compatibility on accept.
- **Request status flow**: pending → matched (donor/org accepted) → fulfilled (receiver marks fulfilled); pending can go to cancelled.
- **Stock level**: Derived from units (0=critical, <5=low, <20=adequate, else full) in OrganizationInventory.
- **Verification**: Linked to hospital (receiver) by email/hospitalId; approve sets that user’s `isVerified = true`.
- **Cities**: Fixed list (CITIES) in frontend; backend should validate city against same or extended list.

---

## 8. Request/Response Shapes (Key)

- **Login**: `POST { email, password }` → `{ user: User, token: string }`.
- **Register**: `POST` role-specific (e.g. receiver: `name, email, password, city, contactNumber, receiverType, isVerified`) → `{ user, token }`.
- **Auth me**: `GET` Authorization → `{ user: User }`.
- **Requests list**: `GET` → `{ requests: BloodRequest[] }` (or array directly).
- **Create request**: `POST` body (bloodGroup, unitsNeeded, hospitalName, city, urgencyLevel, notes?) → `{ request: BloodRequest }`.
- **Stats**: `GET` → `{ activeRequests: number, availableDonors: number, organizations: number }`.

All responses that include **User** must omit or never return **password**. Frontend types include `password`; API should return user without `password` (or hashed only server-side).

---

## 9. Environment (Frontend)

- No `VITE_*` or `import.meta.env` usage found; no API base URL yet. For connection, frontend will need e.g. `VITE_API_URL=http://localhost:3001` and services that replace `storage` with `fetch(VITE_API_URL + '/api/...')`.

---

## 10. Role-Based Access (Implied)

- **Receiver**: Own requests only (create, list, cancel, mark fulfilled).
- **Donor**: List pending requests by city; accept (create donation, cooldown); list own donations.
- **Organization**: List requests by city; list donors (or stats) by city; full inventory CRUD for self; list/update verifications by city; approve/reject sets hospital `isVerified`.

Backend must enforce these with JWT role + resource ownership (e.g. receiverId === me, organizationId === me).
