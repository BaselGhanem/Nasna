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

**Stage 10 — Requests, Approvals & Employee Self-Service**

Stage 08 adds a tenant-isolated employee document register for contracts, identity records, permits, certificates, secure HTTPS references, visibility controls, and expiry monitoring. HR Admin and Super Admin manage the register; employees can read only records explicitly shared with their own login. Firebase Storage is not used because Cloud Storage requires the Blaze plan. The Spark-compatible release stores document metadata and controlled references in Firestore.

Stage 09 adds immutable employment movements for transfers, promotions, reassignments, manager changes, employment-type changes, status changes, and work-mode changes. HR applies the current-dated movement and NASNA updates the employee record, account access, manager capability, audit log, and before/after movement history in one Firestore batch. Managers remain employees and cannot create HR movements.

Stage 10 adds a versioned request and workflow engine with three separate responsive workspaces:

- employees use the service catalog, drafts, request history, responses, comments, timelines, and in-app notifications;
- managers use a separate approval inbox and delegation area while retaining their employee self-service screen;
- HR operates fulfillment, restricted requests, server-backed configuration drafts, previews, immutable published workflow versions, retirement controls, service reporting, and metadata-only CSV exports.

There is no self-approval. A manager's personal request goes to their upper manager or an independent HR fallback. Confidential requests bypass the reporting line. Final contact, private-data, document, and movement changes are applied only by HR and are linked atomically to the Stage 10 request ID.

The Spark release does not use paid Cloud Functions or a server scheduler. SLA due dates and overdue indicators are stored and evaluated in the application, and a deterministic in-app SLA notification is created when an assigned workspace opens. An overdue request is never auto-approved. Assignment notifications are idempotent and written after the atomic request, counter, event, and task transaction so Firestore rule-evaluation limits cannot create duplicate requests or messages. Email, WhatsApp, leave, attendance, payroll, loans, recruitment, performance, and training request types remain inactive until their owning stages are implemented.

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

The Firebase project is defined in `.firebaserc`. `firebase.json` binds both
`firestore.rules` and `firestore.indexes.json` to the named database.

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
nasna_companies/{companyId}/requestTypes/{typeVersionId}
nasna_companies/{companyId}/workflowDefinitions/{workflowVersionId}
nasna_companies/{companyId}/workflowDrafts/{draftId}
nasna_companies/{companyId}/requestCounters/requests
nasna_companies/{companyId}/requestCounters/workflow_{draftId}
nasna_companies/{companyId}/requests/{requestId}
nasna_companies/{companyId}/requests/{requestId}/tasks/{taskId}
nasna_companies/{companyId}/requests/{requestId}/events/{eventId}
nasna_companies/{companyId}/requests/{requestId}/comments/{commentId}
nasna_companies/{companyId}/requests/{requestId}/attachments/{attachmentId}
nasna_companies/{companyId}/delegations/{delegationId}
nasna_companies/{companyId}/notifications/{notificationId}
nasna_companies/{companyId}/auditLogs/{logId}
```

Structure, job, and employee codes are immutable uppercase identifiers containing 2–20 English letters, numbers, or hyphens. Records are disabled instead of deleted so future employee, attendance, and payroll history remains valid. Deactivating a parent record also disables active dependent records through the application workflow.

Position records connect a job title to a branch and department, with an optional team and work location plus approved headcount. Employee records link to positions and to a direct manager by immutable employee code. Private identity, personal contact, emergency, and HR-only details are stored separately from the company-readable employee directory.

Document records store metadata and optional company-controlled HTTPS references; binary employee files are never committed to GitHub or embedded in Firestore. Employment movements are append-only and link the before-and-after assignment to the employee record through `lastMovementId`.

Workflow drafts are visible and editable only by HR administrators. Publishing creates a new request-type and workflow version in one transaction, retires any prior active version with the same code, and deletes the draft. Published definitions are immutable. Submitted requests and their events are never deleted. Terminal request states are immutable; a follow-up starts as a new linked business request rather than reopening history.

## Stage 10 operating runbook

- Open `requests.html` for employee self-service.
- Open `approvals.html` for a manager's team decision workspace; the manager remains an employee and cannot approve their own request.
- Open `hr-operations.html` for fulfillment, restricted requests, workflow configuration, and reporting.
- If an SLA is overdue, NASNA highlights it and creates one in-app reminder per request step and assignee. It never changes the decision.
- A restricted request routes directly to an independent HR administrator and is excluded from the manager's team history.
- A future-dated employment movement remains pending until its effective date because Spark has no background scheduler.
- Publish `firestore.rules` whenever a Stage 10 release changes its schema or authorization behavior.

### Monitoring

- Investigate any submitted request that has no pending task, active assignee, or due date.
- Investigate duplicate decision or fulfillment events for the same request and revision.
- Review overdue requests, inactive assignees, repeated information returns, and failed adapter references from the HR workspace.
- Treat any confidential title in a manager view, general notification, or metadata export as a privacy incident.

### Pilot and rollback

- Start with one low-risk general HR request and a small department using non-sensitive test data.
- Add contact, document, movement, and restricted request types only after their role-based UAT passes.
- If one type is defective, retire that published type so no new request can use it. Existing requests remain readable and continue against their immutable type and workflow versions.
- Never delete requests, tasks, events, or published workflow versions and never silently edit a published workflow. Correct the behavior in a new version.
- If an adapter produced an incorrect employee, document, or movement change, HR records a compensating request and linked audit correction; history is preserved.
- Roll back the GitHub UI only to the previous verified commit. Keep the Stage 10 security rules that protect already-created Stage 10 data until a tested compatible ruleset is deployed.

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
