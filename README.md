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

**Stage 05.1 — Branches & Work Locations**

Company and access management is complete. The current stage adds company branches and physical work locations with bilingual records, role-enforced editing, soft deactivation, tenant isolation, and immutable audit logs.

**Live application:** https://baselghanem.github.io/Nasna/

## Firestore activation

NASNA uses the existing named Firestore database:

`ai-studio-2f881b3f-5867-4dfd-b360-c85f26c6ded4`

The legacy project data is left untouched. NASNA stores its data only in collections prefixed with `nasna_`.

1. From the repository root, authenticate Firebase CLI.
2. Publish the included rules to the named database:

```bash
firebase deploy --only firestore:ai-studio-2f881b3f-5867-4dfd-b360-c85f26c6ded4
```

The Firebase project is defined in `.firebaserc`. `firebase.json` binds `firestore.rules` to the named database.

## Data architecture

```text
nasna_users/{uid}
nasna_companies/{companyId}
nasna_companies/{companyId}/members/{uid}
nasna_companies/{companyId}/branches/{branchCode}
nasna_companies/{companyId}/locations/{locationCode}
nasna_companies/{companyId}/auditLogs/{logId}
```

Branch and location codes are immutable uppercase identifiers containing 2–20 English letters, numbers, or hyphens. Records are disabled instead of deleted so future employee and attendance history remains valid.

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
