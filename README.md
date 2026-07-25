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

**Stage 07 — Employee Records, Self-Service & Manager Workspace**

Stage 07 adds the trusted employee file, one-login-per-employee provisioning, job and manager assignment, a private employee self-service profile, and a separate view-only workspace for managers and their direct reports. A manager always remains an employee; manager capability is enabled automatically by reporting relationships. Only HR Admin and Super Admin can create or change employee records.

Existing-company onboarding is supported by the official
[`NASNA_Employee_Import_Template.xlsx`](assets/templates/NASNA_Employee_Import_Template.xlsx).
NASNA validates required columns, structure codes, approved position capacity, duplicate records, manager existence, and circular reporting lines before import.

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
nasna_companies/{companyId}/auditLogs/{logId}
```

Structure, job, and employee codes are immutable uppercase identifiers containing 2–20 English letters, numbers, or hyphens. Records are disabled instead of deleted so future employee, attendance, and payroll history remains valid. Deactivating a parent record also disables active dependent records through the application workflow.

Position records connect a job title to a branch and department, with an optional team and work location plus approved headcount. Employee records link to positions and to a direct manager by immutable employee code. Private identity, personal contact, emergency, and HR-only details are stored separately from the company-readable employee directory.

## Access model

- `super_admin`
- `hr_admin`
- `employee`

`isManager` is an additive membership capability synchronized from active direct-report relationships. It never replaces the employee role or employee profile. Legacy `manager` memberships remain readable for backward compatibility but are not provisioned by the Stage 07 interface.

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
