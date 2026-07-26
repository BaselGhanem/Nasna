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

**Stages 08 & 09 — Documents, Contracts & Employment Lifecycle**

Stage 08 adds a tenant-isolated employee document register for contracts, identity records, permits, certificates, secure HTTPS references, visibility controls, and expiry monitoring. HR Admin and Super Admin manage the register; employees can read only records explicitly shared with their own login. Firebase Storage is not used because Cloud Storage requires the Blaze plan. The Spark-compatible release stores document metadata and controlled references in Firestore.

Stage 09 adds immutable employment movements for transfers, promotions, reassignments, manager changes, employment-type changes, status changes, and work-mode changes. HR applies the current-dated movement and NASNA updates the employee record, account access, manager capability, audit log, and before/after movement history in one Firestore batch. Managers remain employees and cannot create HR movements.

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
nasna_companies/{companyId}/departments/{departmentCode}
nasna_companies/{companyId}/teams/{teamCode}
nasna_companies/{companyId}/jobGrades/{gradeCode}
nasna_companies/{companyId}/jobTitles/{jobTitleCode}
nasna_companies/{companyId}/positions/{positionCode}
nasna_companies/{companyId}/employees/{employeeCode}
nasna_companies/{companyId}/employeePrivate/{employeeCode}
nasna_companies/{companyId}/employeeDocuments/{documentId}
nasna_companies/{companyId}/employeeMovements/{movementId}
nasna_companies/{companyId}/auditLogs/{logId}
```

Structure, job, and employee codes are immutable uppercase identifiers containing 2–20 English letters, numbers, or hyphens. Records are disabled instead of deleted so future employee, attendance, and payroll history remains valid. Deactivating a parent record also disables active dependent records through the application workflow.

Position records connect a job title to a branch and department, with an optional team and work location plus approved headcount. Employee records link to positions and to a direct manager by immutable employee code. Private identity, personal contact, emergency, and HR-only details are stored separately from the company-readable employee directory.

Document records store metadata and optional company-controlled HTTPS references; binary employee files are never committed to GitHub or embedded in Firestore. Employment movements are append-only and link the before-and-after assignment to the employee record through `lastMovementId`.

## Access model

- `super_admin`
- `hr_admin`
- `employee`

`isManager` is an additive membership capability synchronized from active direct-report relationships. It never replaces the employee role or employee profile. Managers can read their own documents and employment history, but cannot create or change HR records.

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
