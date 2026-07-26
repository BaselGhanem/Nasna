const fs = require(`node:fs`);
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require(`@firebase/rules-unit-testing`);
const {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna-stage105-hardening`;
const companyId = `COMPANY-1`;

const member = (uid, role, employeeId, isManager = false) => ({
  uid,
  companyId,
  email: `${uid}@nasna.test`,
  displayName: uid,
  role,
  isManager,
  status: `active`,
  employeeId,
  createdAt: new Date(),
  createdBy: `seed`,
  updatedAt: new Date(),
  updatedBy: `seed`
});

const employee = (id, authUid, managerEmployeeId = ``) => ({
  id,
  companyId,
  employeeCode: id,
  authUid,
  accessStatus: `active`,
  fullNameEn: id,
  fullNameAr: `موظف`,
  workEmail: `${authUid}@nasna.test`,
  workPhone: ``,
  positionId: `POS-1`,
  jobTitleId: `TITLE-1`,
  branchId: `MAIN`,
  locationId: `HQ`,
  departmentId: `PEOPLE`,
  teamId: `CORE`,
  managerEmployeeId,
  hireDate: new Date(`2026-01-01T00:00:00Z`),
  employmentType: `permanent`,
  employmentStatus: `active`,
  workMode: `onsite`,
  createdAt: new Date(),
  createdBy: `seed`,
  updatedAt: new Date(),
  updatedBy: `seed`
});

const auditRecord = (actorId, actorEmail, action, targetId) => ({
  companyId,
  actorId,
  actorEmail,
  action,
  targetId,
  details: {},
  createdAt: serverTimestamp()
});

const eventRecord = (requestId, eventId) => ({
  id: eventId,
  companyId,
  requestId,
  actorUid: `employee`,
  actorName: `Employee`,
  actorRole: `employee`,
  type: `SUBMITTED`,
  message: `Request submitted`,
  payload: { status: `PENDING_APPROVAL` },
  createdAt: serverTimestamp()
});

const requestRecord = (requestId, requestNumber, eventId, sequence) => ({
  id: requestId,
  companyId,
  requestNumber,
  sequence,
  typeId: `general_hr__v1`,
  typeCode: `general_hr`,
  typeVersion: 1,
  workflowId: `general_hr__workflow_v1`,
  requesterUid: `employee`,
  requesterEmployeeId: `EMP-1`,
  requesterName: `Employee`,
  subjectEmployeeId: `EMP-1`,
  subjectName: `Employee`,
  managerEmployeeId: `MGR-1`,
  status: `PENDING_APPROVAL`,
  previousStatus: ``,
  currentStep: 0,
  currentStepType: `approval`,
  currentAssigneeIds: [`manager`],
  previousAssigneeIds: [],
  slaRemainingHours: 0,
  delegationId: ``,
  originalAssigneeIds: [],
  routeKind: `manager`,
  payload: { details: `Test request` },
  confidentiality: `normal`,
  priority: `normal`,
  dueAt: new Date(`2026-08-01T00:00:00Z`),
  submittedAt: serverTimestamp(),
  createdAt: serverTimestamp(),
  createdBy: `employee`,
  updatedAt: serverTimestamp(),
  updatedBy: `employee`,
  revision: 0,
  lastEventId: eventId,
  outcome: {},
  fulfillmentRef: {},
  completedAt: null,
  withdrawnAt: null
});

const writeRequest = (
  database,
  requestId,
  requestNumber,
  eventId,
  counterValue
) => {
  const batch = writeBatch(database);
  batch.set(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requestCounters`,
      `requests`
    ),
    {
      companyId,
      value: counterValue,
      lastRequestId: requestId,
      lastRequestNumber: requestNumber,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    }
  );
  batch.set(
    doc(database, `nasna_companies`, companyId, `requests`, requestId),
    requestRecord(requestId, requestNumber, eventId, counterValue)
  );
  batch.set(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      requestId,
      `events`,
      eventId
    ),
    eventRecord(requestId, eventId)
  );
  return batch.commit();
};

const seed = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(database, `nasna_companies`, companyId), {
      id: companyId,
      ownerId: `hr`,
      nameEn: `Company`,
      nameAr: `شركة`,
      status: `active`
    });
    for (const record of [
      member(`hr`, `hr_admin`, `HR-1`),
      member(`manager`, `employee`, `MGR-1`, true),
      member(`employee`, `employee`, `EMP-1`)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `members`, record.uid),
        record
      );
    }
    for (const record of [
      employee(`HR-1`, `hr`),
      employee(`MGR-1`, `manager`),
      employee(`EMP-1`, `employee`, `MGR-1`)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `employees`, record.id),
        record
      );
    }
    await setDoc(
      doc(
        database,
        `nasna_companies`,
        companyId,
        `workflowDefinitions`,
        `general_hr__workflow_v1`
      ),
      {
        id: `general_hr__workflow_v1`,
        companyId,
        requestTypeCode: `general_hr`,
        version: 1,
        steps: [
          {
            index: 0,
            type: `approval`,
            resolver: `direct_manager`,
            mode: `sequential`,
            slaHours: 24,
            nameEn: `Manager approval`,
            nameAr: `موافقة المدير`
          },
          {
            index: 1,
            type: `fulfillment`,
            resolver: `hr`,
            mode: `parallel_any`,
            slaHours: 48,
            nameEn: `HR fulfillment`,
            nameAr: `تنفيذ الموارد البشرية`
          }
        ],
        slaHours: 72,
        status: `published`,
        createdAt: new Date(),
        createdBy: `hr`
      }
    );
    await setDoc(
      doc(
        database,
        `nasna_companies`,
        companyId,
        `requestTypes`,
        `general_hr__v1`
      ),
      {
        id: `general_hr__v1`,
        companyId,
        code: `general_hr`,
        version: 1,
        nameEn: `General HR request`,
        nameAr: `طلب عام`,
        descriptionEn: `Description`,
        descriptionAr: `وصف`,
        category: `general`,
        confidentiality: `normal`,
        subjectMode: `self`,
        initialResolver: `direct_manager`,
        formSchema: [
          {
            key: `details`,
            type: `textarea`,
            required: true
          }
        ],
        workflowId: `general_hr__workflow_v1`,
        status: `published`,
        createdAt: new Date(),
        createdBy: `hr`
      }
    );
  });
};

const branchRecord = (id, name) => ({
  id,
  companyId,
  code: id,
  nameEn: name,
  nameAr: `فرع`,
  status: `active`,
  createdAt: serverTimestamp(),
  createdBy: `hr`,
  updatedAt: serverTimestamp(),
  updatedBy: `hr`
});

(async () => {
  const environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(`firestore.rules`, `utf8`)
    }
  });
  await environment.clearFirestore();
  await seed(environment);

  const employeeDb = environment.authenticatedContext(`employee`, {
    email: `employee@nasna.test`
  }).firestore();
  const hrDb = environment.authenticatedContext(`hr`, {
    email: `hr@nasna.test`
  }).firestore();

  await assertFails(setDoc(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `auditLogs`,
      `FORGED-EMPLOYEE`
    ),
    auditRecord(
      `employee`,
      `employee@nasna.test`,
      `employee.updated`,
      `EMP-1`
    )
  ));

  await assertFails(setDoc(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `auditLogs`,
      `FORGED-HR`
    ),
    auditRecord(`hr`, `hr@nasna.test`, `branch.created`, `FAKE`)
  ));

  const legitimateAuditBatch = writeBatch(hrDb);
  legitimateAuditBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `branches`, `AMMAN`),
    branchRecord(`AMMAN`, `Amman`)
  );
  legitimateAuditBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `auditLogs`, `AUDIT-AMMAN`),
    auditRecord(`hr`, `hr@nasna.test`, `branch.created`, `AMMAN`)
  );
  await assertSucceeds(legitimateAuditBatch.commit());

  const gradeBatch = writeBatch(hrDb);
  gradeBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `jobGrades`, `G1`),
    {
      id: `G1`,
      companyId,
      code: `G1`,
      nameEn: `Grade 1`,
      nameAr: `الدرجة 1`,
      level: 1,
      status: `active`,
      createdAt: serverTimestamp(),
      createdBy: `hr`,
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  gradeBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `auditLogs`, `AUDIT-G1`),
    auditRecord(`hr`, `hr@nasna.test`, `grade.created`, `G1`)
  );
  await assertSucceeds(gradeBatch.commit());

  const spoofedEmailBatch = writeBatch(hrDb);
  spoofedEmailBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `branches`, `IRBID`),
    branchRecord(`IRBID`, `Irbid`)
  );
  spoofedEmailBatch.set(
    doc(hrDb, `nasna_companies`, companyId, `auditLogs`, `AUDIT-IRBID`),
    auditRecord(`hr`, `spoofed@nasna.test`, `branch.created`, `IRBID`)
  );
  await assertFails(spoofedEmailBatch.commit());

  await assertFails(setDoc(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requestCounters`,
      `requests`
    ),
    {
      companyId,
      value: 1,
      lastRequestId: `MISSING`,
      lastRequestNumber: `REQ-GENERALH-2026-000001`,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    }
  ));

  await assertSucceeds(writeRequest(
    employeeDb,
    `REQUEST-1`,
    `REQ-GENERALH-2026-000001`,
    `EVENT-1`,
    1
  ));

  await assertFails(setDoc(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requestCounters`,
      `requests`
    ),
    {
      companyId,
      value: 2,
      lastRequestId: `REQUEST-1`,
      lastRequestNumber: `REQ-GENERALH-2026-000001`,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    }
  ));

  await assertSucceeds(writeRequest(
    employeeDb,
    `REQUEST-2`,
    `REQ-GENERALH-2026-000002`,
    `EVENT-2`,
    2
  ));

  const counterSnapshot = await assertSucceeds(getDoc(doc(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requestCounters`,
    `requests`
  )));
  if (counterSnapshot.data().lastRequestId !== `REQUEST-2`) {
    throw new Error(`request-counter-link-missing`);
  }

  await assertFails(setDoc(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      `REQUEST-2`,
      `tasks`,
      `FORGED-TASK`
    ),
    {
      id: `FORGED-TASK`,
      companyId,
      requestId: `REQUEST-2`,
      stepIndex: 0,
      stepType: `approval`,
      mode: `sequential`,
      assigneeUid: `manager`,
      assigneeRole: `employee`,
      status: `PENDING`,
      decision: ``,
      note: ``,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actedAt: null,
      createdAt: serverTimestamp(),
      createdBy: `employee`,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    }
  ));

  await environment.cleanup();
  console.log(`stage105-rules-ok`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
