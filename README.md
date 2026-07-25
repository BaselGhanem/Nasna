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

**Stages 05 & 06 — Organization & Job Architecture**

Company access, branches, and work locations are complete. Stages 05 and 06 add departments, teams, a live organization chart, job grades, bilingual job titles and descriptions, and approved organizational positions. Editing is role-enforced, tenant-isolated, audited, and uses soft deactivation instead of deletion.

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
nasna_companies/{companyId}/auditLogs/{logId}
```

Structure and job codes are immutable uppercase identifiers containing 2–20 English letters, numbers, or hyphens. Records are disabled instead of deleted so future employee, attendance, and payroll history remains valid. Deactivating a parent record also disables active dependent records through the application workflow.

Position records connect a job title to a branch and department, with an optional team and work location plus approved headcount. Department manager assignment is intentionally deferred until employee profiles are available, so managers can be linked to real employee records rather than authentication accounts.

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
