
# BloodLink – Emergency Blood Coordination System

## Overview
A complete blood donation coordination platform connecting Receivers, Donors, and Organizations with emergency-first design, real-time status updates, and safety-enforced 3-month donor cooldowns.

---

## 🔐 Authentication & Onboarding

### Landing Page
- Hero section with emergency blood request CTA
- Quick stats (active requests, donors available)
- Role selection: "I Need Blood" | "I Want to Donate" | "I'm an Organization"

### Registration Flow
- **Receiver Registration**: Name, Email, Password, Type (Individual/Hospital), City/Area, Contact Number
- **Donor Registration**: Name, Email, Password, Blood Group, City/Area, Contact Number, Last Donation Date (optional)
- **Organization Registration**: Name, Email, Password, Type (Blood Bank/NGO), City/Area, Contact Info, License/Verification ID

### Login
- Email/Password login with role detection
- Redirect to role-specific dashboard

---

## 🩸 Receiver Dashboard (Individual & Hospital)

### Create Blood Request
- Blood Group (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Units Needed
- Hospital Name
- City/Area selection
- Urgency Level: 🔴 Emergency | 🟠 Within 24 Hours | 🟢 Planned
- Additional Notes

### My Requests View
- List of all submitted requests with lifecycle status:
  - **Pending** (Yellow) → Waiting for donors
  - **Matched** (Blue) → Donor accepted, showing donor contact details
  - **Fulfilled** (Green) → Completed
  - **Cancelled** (Gray)
- Ability to cancel pending requests
- Contact donor button when matched

### Hospital Verification Badge
- Hospitals display a "Verified" badge once organization confirms

---

## ❤️ Donor Dashboard

### Active Requests Feed
- Filtered list showing only compatible blood group requests in donor's area
- Blood group compatibility logic:
  - O- can donate to all
  - O+ can donate to O+, A+, B+, AB+
  - A- can donate to A-, A+, AB-, AB+
  - A+ can donate to A+, AB+
  - B- can donate to B-, B+, AB-, AB+
  - B+ can donate to B+, AB+
  - AB- can donate to AB-, AB+
  - AB+ can donate to AB+ only
- Each request card shows: Blood Group, Urgency Level, Hospital Name, City, Time Posted
- "Accept Request" button

### Donation Cooldown System
- After accepting a request → 3-month lockout begins
- During cooldown:
  - "Cooldown Active" banner with countdown timer
  - Cannot accept new requests
  - Can still view requests (read-only)
- Cooldown history visible in profile

### My Donations
- History of all accepted donations
- Status tracking for each

---

## 🏥 Organization Dashboard (Blood Banks & NGOs)

### Blood Inventory Management
- Add/Update blood stock by group
- Stock levels: Critical | Low | Adequate | Full
- Expiry date tracking for blood units

### Request Overview
- View all requests in their service area
- Ability to fulfill requests from inventory
- Mark as "Organization Fulfilled"

### Donor Network
- View registered donors in area (anonymized)
- Aggregate stats: Total donors, available donors, donors on cooldown

### Verification Queue
- Review and verify hospital registration requests
- Approve/Reject with notes

---

## 🔍 Matching Engine

### Blood Compatibility Matrix
- Automatic filtering based on donor-to-receiver compatibility
- Priority ranking: Emergency > Within 24 Hours > Planned

### Geographic Matching
- City/Area dropdown with predefined list
- Filter donors and requests within same city

### Backup Source Logic
- If no individual donors available in area, show nearby Organizations with matching blood stock

---

## 📱 UI/UX Design

### Emergency-First Theme
- **Primary Red** (#DC2626) for urgent actions and blood-related elements
- **Safety Green** (#16A34A) for confirmations and available status
- **Warning Orange** (#EA580C) for "Within 24 Hours" urgency
- High contrast text for accessibility

### Navigation
- **Desktop**: Top header with role-specific nav items
- **Mobile**: Bottom tab bar with key sections (Home, Requests, Profile, Notifications)

### Request Lifecycle Visual
- Step progress indicator showing request journey
- Color-coded status badges

### Real-Time Updates
- 5-second polling interval for status changes
- Visual indicators when new data arrives
- Toast notifications for status changes

---

## 💾 Data Persistence (Local Storage)

### Storage Structure
- `bloodlink_users` – All registered users with roles
- `bloodlink_requests` – Blood requests with status
- `bloodlink_donations` – Donation records with cooldown info
- `bloodlink_inventory` – Organization blood stock
- `bloodlink_session` – Current logged-in user

### Cross-Tab Sync
- Storage event listener for multi-tab consistency

---

## 🛡️ Safety & Access Control

### Role-Based Access
- Receivers cannot access donor management
- Donors cannot create blood requests
- Organizations have admin-level views

### 3-Month Donor Lock
- Automatic enforcement after accepting any request
- Cannot be bypassed
- Visual countdown and notification

### Request Verification
- Hospital requests flagged for Organization review
- Individual requests processed normally

---

## 📊 Key Pages Summary

1. **Landing Page** – Role selection and quick emergency access
2. **Login/Register** – Role-specific registration forms
3. **Receiver Dashboard** – Create requests, view status, contact donors
4. **Donor Dashboard** – View matching requests, accept donations, cooldown status
5. **Organization Dashboard** – Inventory, verification, area statistics
6. **Profile Settings** – Edit info, donation history, notification preferences
7. **Request Detail** – Full lifecycle view with all parties' info

---

## 🚀 Deliverables
- Fully functional React application
- All three user role dashboards
- Complete matching logic with blood compatibility
- Real-time polling updates
- Local Storage persistence
- Mobile-responsive design with bottom navigation
- Emergency-first red/green theme

