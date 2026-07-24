<p align="center">
  <img src="assets/brand/nasna-logo.svg" alt="NASNA People Management Platform" width="720">
</p>

<p align="center"><strong>Your People. One Platform.</strong></p>

NASNA is a modern People Management Platform built for companies that want a clear, connected, and human-centered way to manage their workforce.

## Product Identity

- **Brand:** NASNA
- **Arabic:** ناسنا
- **Category:** People Management Platform
- **Arabic tagline:** ناسك. منصة واحدة.
- **English tagline:** Your People. One Platform.
- **Brand owner:** X Academy

## Product Roadmap

NASNA will be delivered progressively as independent but connected modules:

1. **NASNA Core** — People records, organization structure, roles, and documents.
2. **NASNA Time** — Attendance, shifts, and leave.
3. **NASNA Pay** — Payroll, benefits, loans, and settlements.
4. **NASNA Talent** — Recruitment, onboarding, performance, and succession.
5. **NASNA Learn** — Training and development.
6. **NASNA Insights** — People analytics and executive dashboards.

## Current Stage

**Stage 04 — Company & Access Management**

The authenticated workspace now includes multi-company Firestore architecture, company onboarding, tenant isolation, four access roles, user provisioning, account disabling, and immutable audit logs.

**Live application:** https://baselghanem.github.io/Nasna/

## Firestore activation

The Firebase project must contain a `(default)` Firestore database before Stage 04 can store data.

1. Create Firestore in Production mode.
2. From the repository root, authenticate Firebase CLI.
3. Publish the included rules:

```bash
firebase deploy --only firestore:rules
```

The deployment target is defined in `.firebaserc`, and `firebase.json` points to `firestore.rules`.

## Data architecture

```text
users/{uid}
companies/{companyId}
companies/{companyId}/members/{uid}
companies/{companyId}/auditLogs/{logId}
```

## Access roles

- `super_admin`
- `hr_admin`
- `manager`
- `employee`

## Technology Direction

- HTML5
- Modern CSS
- Vanilla JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase Spark plan
- GitHub version control

## Security Principle

No real employee data, passwords, private keys, or Firebase service-account files may be committed to this public repository. Access control is enforced by Firestore Security Rules, not by UI visibility alone.

---

**NASNA** — Powered by X Academy
