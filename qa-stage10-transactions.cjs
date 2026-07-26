const assert = require(`node:assert/strict`);
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
  updateDoc,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna-stage10-transactions`;
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

const event = (requestId, id, actorUid, type) => ({
  id,
  companyId,
  requestId,
  actorUid,
  actorName: actorUid,
  actorRole: actorUid.startsWith(`hr`) ? `hr_admin` : `employee`,
  type,
  message: type,
  payload: {},
  createdAt: serverTimestamp()
});

const task = ({
  requestId,
  id,
  assigneeUid,
  createdBy,
  stepIndex = 0,
  stepType = `approval`,
  mode = `sequential`
}) => ({
  id,
  companyId,
  requestId,
  stepIndex,
  stepType,
  mode,
  assigneeUid,
  assigneeRole: assigneeUid.startsWith(`hr`) ? `hr_admin` : `employee`,
  status: `PENDING`,
  decision: ``,
  note: ``,
  dueAt: new Date(`2026-08-10T00:00:00Z`),
  actedAt: null,
  createdAt: serverTimestamp(),
  createdBy,
  updatedAt: serverTimestamp(),
  updatedBy: createdBy
});

const notification = ({
  id,
  requestId,
  recipientUid,
  createdBy,
  kind = `assignment`
}) => ({
  id,
  companyId,
  requestId,
  recipientUid,
  titleEn: `Request update`,
  titleAr: `تحديث الطلب`,
  bodyEn: requestId,
  bodyAr: requestId,
  kind,
  href: `requests.html?v=20260726.4&request=${requestId}`,
  readAt: null,
  createdAt: serverTimestamp(),
  createdBy
});

const request = (id, sequence, eventId) => ({
  id,
  companyId,
  requestNumber: `REQ-2026-${String(sequence).padStart(6, `0`)}`,
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
  delegationId: ``,
  originalAssigneeIds: [],
  routeKind: `manager`,
  payload: { details: `A complete request` },
  confidentiality: `normal`,
  priority: `normal`,
  dueAt: new Date(`2026-08-10T00:00:00Z`),
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
    for (const item of [
      member(`hr`, `hr_admin`, `HR-1`),
      member(`hr-two`, `hr_admin`, `HR-2`),
      member(`manager`, `employee`, `MGR-1`, true),
      member(`employee`, `employee`, `EMP-1`)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `members`, item.uid),
        item
      );
      await setDoc(doc(database, `nasna_users`, item.uid), {
        uid: item.uid,
        employeeId: item.employeeId,
        email: item.email,
        displayName: item.displayName,
        activeCompanyId: companyId,
        status: `active`,
        locale: `en`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    for (const item of [
      employee(`HR-1`, `hr`),
      employee(`HR-2`, `hr-two`),
      employee(`MGR-1`, `manager`),
      employee(`EMP-1`, `employee`, `MGR-1`)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `employees`, item.id),
        item
      );
    }
  });
};

const createWorkflowConfiguration = async database => {
  const workflowId = `general_hr__workflow_v1`;
  const typeId = `general_hr__v1`;
  const batch = writeBatch(database);
  batch.set(
    doc(database, `nasna_companies`, companyId, `workflowDefinitions`, workflowId),
    {
      id: workflowId,
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
          nameEn: `Manager`,
          nameAr: `المدير`
        },
        {
          index: 1,
          type: `fulfillment`,
          resolver: `hr`,
          mode: `parallel_any`,
          slaHours: 48,
          nameEn: `HR`,
          nameAr: `الموارد البشرية`
        }
      ],
      slaHours: 72,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: `hr`
    }
  );
  batch.set(
    doc(database, `nasna_companies`, companyId, `requestTypes`, typeId),
    {
      id: typeId,
      companyId,
      code: `general_hr`,
      version: 1,
      nameEn: `General HR request`,
      nameAr: `طلب عام`,
      descriptionEn: `Tracked request`,
      descriptionAr: `طلب متتبع`,
      category: `general`,
      confidentiality: `normal`,
      subjectMode: `self`,
      initialResolver: `direct_manager`,
      formSchema: [{ key: `details`, type: `textarea`, required: true }],
      workflowId,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: `hr`
    }
  );
  await batch.commit();
};

const createEmployeeRequest = async (database, id, sequence) => {
  const eventId = `EVENT-${id}-SUBMIT`;
  const taskId = `step-0-manager-${id}`;
  const notificationId = `NOTIFY-${id}-MANAGER`;
  const batch = writeBatch(database);
  const counterReference = doc(
    database,
    `nasna_companies`,
    companyId,
    `requestCounters`,
    `requests`
  );
  if (sequence === 1) {
    batch.set(counterReference, {
      companyId,
      value: 1,
      lastRequestId: id,
      lastRequestNumber: `REQ-2026-${String(sequence).padStart(6, `0`)}`,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    });
  } else {
    batch.update(counterReference, {
      value: sequence,
      lastRequestId: id,
      lastRequestNumber: `REQ-2026-${String(sequence).padStart(6, `0`)}`,
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    });
  }
  batch.set(
    doc(database, `nasna_companies`, companyId, `requests`, id),
    request(id, sequence, eventId)
  );
  batch.set(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      id,
      `events`,
      eventId
    ),
    event(id, eventId, `employee`, `SUBMITTED`)
  );
  batch.set(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      id,
      `tasks`,
      taskId
    ),
    task({
      requestId: id,
      id: taskId,
      assigneeUid: `manager`,
      createdBy: `employee`
    })
  );
  await batch.commit();
  await setDoc(
    doc(database, `nasna_companies`, companyId, `notifications`, notificationId),
    notification({
      id: notificationId,
      requestId: id,
      recipientUid: `manager`,
      createdBy: `employee`
    })
  );
  return { eventId, taskId };
};

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
  const managerDb = environment.authenticatedContext(`manager`, {
    email: `manager@nasna.test`
  }).firestore();
  const hrDb = environment.authenticatedContext(`hr`, {
    email: `hr@nasna.test`
  }).firestore();

  await assertSucceeds(createWorkflowConfiguration(hrDb));

  const lifecycleId = `TX-10001`;
  const lifecycle = await assertSucceeds(
    createEmployeeRequest(employeeDb, lifecycleId, 1)
  );

  const needsInfoEventId = `EVENT-TX-NEEDS-INFO`;
  const needsInfoNotificationId = `NOTIFY-TX-NEEDS-INFO`;
  const needsInfoBatch = writeBatch(managerDb);
  needsInfoBatch.update(
    doc(managerDb, `nasna_companies`, companyId, `requests`, lifecycleId),
    {
      status: `NEEDS_INFORMATION`,
      previousStatus: `PENDING_APPROVAL`,
      currentAssigneeIds: [],
      previousAssigneeIds: [`manager`],
      outcome: { code: `needs_information`, note: `Please clarify` },
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 1,
      lastEventId: needsInfoEventId
    }
  );
  needsInfoBatch.update(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `tasks`,
      lifecycle.taskId
    ),
    {
      status: `NEEDS_INFORMATION`,
      decision: `needs_information`,
      note: `Please clarify`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `manager`
    }
  );
  needsInfoBatch.set(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `events`,
      needsInfoEventId
    ),
    event(lifecycleId, needsInfoEventId, `manager`, `INFORMATION_REQUESTED`)
  );
  needsInfoBatch.set(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `notifications`,
      needsInfoNotificationId
    ),
    notification({
      id: needsInfoNotificationId,
      requestId: lifecycleId,
      recipientUid: `employee`,
      createdBy: `manager`,
      kind: `information`
    })
  );
  await assertSucceeds(needsInfoBatch.commit());

  const responseEventId = `EVENT-TX-RESPONSE`;
  const resumedTaskId = `step-0-manager-resume-${lifecycleId}`;
  const responseNotificationId = `NOTIFY-TX-RESPONSE`;
  const responseBatch = writeBatch(employeeDb);
  responseBatch.update(
    doc(employeeDb, `nasna_companies`, companyId, `requests`, lifecycleId),
    {
      status: `PENDING_APPROVAL`,
      previousStatus: ``,
      currentAssigneeIds: [`manager`],
      previousAssigneeIds: [],
      payload: {
        details: `A complete request`,
        informationResponse: `Here is the clarification`
      },
      dueAt: new Date(`2026-08-11T00:00:00Z`),
      updatedAt: serverTimestamp(),
      updatedBy: `employee`,
      revision: 2,
      lastEventId: responseEventId
    }
  );
  responseBatch.set(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `events`,
      responseEventId
    ),
    event(lifecycleId, responseEventId, `employee`, `INFORMATION_PROVIDED`)
  );
  responseBatch.set(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `tasks`,
      resumedTaskId
    ),
    task({
      requestId: lifecycleId,
      id: resumedTaskId,
      assigneeUid: `manager`,
      createdBy: `employee`
    })
  );
  responseBatch.set(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `notifications`,
      responseNotificationId
    ),
    notification({
      id: responseNotificationId,
      requestId: lifecycleId,
      recipientUid: `manager`,
      createdBy: `employee`
    })
  );
  await assertSucceeds(responseBatch.commit());

  const approvalEventId = `EVENT-TX-APPROVE`;
  const hrTaskId = `step-1-hr-${lifecycleId}`;
  const hrTwoTaskId = `step-1-hr-two-${lifecycleId}`;
  const approvalBatch = writeBatch(managerDb);
  approvalBatch.update(
    doc(managerDb, `nasna_companies`, companyId, `requests`, lifecycleId),
    {
      status: `PENDING_FULFILLMENT`,
      currentStep: 1,
      currentStepType: `fulfillment`,
      currentAssigneeIds: [`hr`, `hr-two`],
      routeKind: `hr`,
      dueAt: new Date(`2026-08-12T00:00:00Z`),
      outcome: { code: `manager_approved`, note: `Approved` },
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 3,
      lastEventId: approvalEventId
    }
  );
  approvalBatch.update(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `tasks`,
      resumedTaskId
    ),
    {
      status: `APPROVED`,
      decision: `approve`,
      note: `Approved`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `manager`
    }
  );
  approvalBatch.set(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `events`,
      approvalEventId
    ),
    event(lifecycleId, approvalEventId, `manager`, `APPROVED`)
  );
  for (const [assigneeUid, id] of [
    [`hr`, hrTaskId],
    [`hr-two`, hrTwoTaskId]
  ]) {
    approvalBatch.set(
      doc(
        managerDb,
        `nasna_companies`,
        companyId,
        `requests`,
        lifecycleId,
        `tasks`,
        id
      ),
      task({
        requestId: lifecycleId,
        id,
        assigneeUid,
        createdBy: `manager`,
        stepIndex: 1,
        stepType: `fulfillment`,
        mode: `parallel_any`
      })
    );
    const notificationId = `NOTIFY-${id}`;
    approvalBatch.set(
      doc(
        managerDb,
        `nasna_companies`,
        companyId,
        `notifications`,
        notificationId
      ),
      notification({
        id: notificationId,
        requestId: lifecycleId,
        recipientUid: assigneeUid,
        createdBy: `manager`
      })
    );
  }
  await assertSucceeds(approvalBatch.commit());

  const fulfillmentEventId = `EVENT-TX-FULFILL`;
  const fulfillmentNotificationId = `NOTIFY-TX-FULFILL`;
  const fulfillmentBatch = writeBatch(hrDb);
  fulfillmentBatch.update(
    doc(hrDb, `nasna_companies`, companyId, `requests`, lifecycleId),
    {
      status: `COMPLETED`,
      currentAssigneeIds: [],
      outcome: { code: `fulfilled`, note: `Completed` },
      fulfillmentRef: { kind: `request`, id: lifecycleId, reference: `` },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`,
      revision: 4,
      lastEventId: fulfillmentEventId
    }
  );
  fulfillmentBatch.update(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `tasks`,
      hrTaskId
    ),
    {
      status: `APPROVED`,
      decision: `approve`,
      note: `Completed`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  fulfillmentBatch.update(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `tasks`,
      hrTwoTaskId
    ),
    {
      status: `CANCELLED`,
      decision: `cancel`,
      note: `Parallel fulfillment completed`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  fulfillmentBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requests`,
      lifecycleId,
      `events`,
      fulfillmentEventId
    ),
    event(lifecycleId, fulfillmentEventId, `hr`, `FULFILLED`)
  );
  fulfillmentBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `notifications`,
      fulfillmentNotificationId
    ),
    notification({
      id: fulfillmentNotificationId,
      requestId: lifecycleId,
      recipientUid: `employee`,
      createdBy: `hr`,
      kind: `status`
    })
  );
  await assertSucceeds(fulfillmentBatch.commit());

  const completedRequestSnapshot = await assertSucceeds(getDoc(doc(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requests`,
    lifecycleId
  )));
  assert.equal(completedRequestSnapshot.data().status, `COMPLETED`);
  await assertFails(updateDoc(
    doc(hrDb, `nasna_companies`, companyId, `requests`, lifecycleId),
    {
      outcome: { code: `tampered`, note: `` },
      updatedAt: serverTimestamp(),
      updatedBy: `hr`,
      revision: 5,
      lastEventId: `EVENT-TX-TAMPER`
    }
  ));

  const withdrawId = `TX-10002`;
  const withdraw = await assertSucceeds(
    createEmployeeRequest(employeeDb, withdrawId, 2)
  );
  const withdrawEventId = `EVENT-TX-WITHDRAW`;
  const withdrawBatch = writeBatch(employeeDb);
  withdrawBatch.update(
    doc(employeeDb, `nasna_companies`, companyId, `requests`, withdrawId),
    {
      status: `WITHDRAWN`,
      currentAssigneeIds: [],
      outcome: { code: `withdrawn_by_requester`, note: `` },
      withdrawnAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `employee`,
      revision: 1,
      lastEventId: withdrawEventId
    }
  );
  withdrawBatch.update(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      withdrawId,
      `tasks`,
      withdraw.taskId
    ),
    {
      status: `CANCELLED`,
      decision: `cancel`,
      note: `Request withdrawn`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `employee`
    }
  );
  withdrawBatch.set(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      withdrawId,
      `events`,
      withdrawEventId
    ),
    event(withdrawId, withdrawEventId, `employee`, `WITHDRAWN`)
  );
  await assertSucceeds(withdrawBatch.commit());

  const withdrawnTaskSnapshot = await assertSucceeds(getDoc(doc(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requests`,
    withdrawId,
    `tasks`,
    withdraw.taskId
  )));
  assert.equal(withdrawnTaskSnapshot.data().status, `CANCELLED`);

  const workflowDraftId = `DRAFT-1`;
  const workflowDraft = {
    id: workflowDraftId,
    companyId,
    code: `employment_letter`,
    nameEn: `Employment letter`,
    nameAr: `كتاب إثبات عمل`,
    descriptionEn: `Request a tracked employment letter.`,
    descriptionAr: `طلب كتاب إثبات عمل قابل للتتبع.`,
    category: `documents`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    slaHours: 48,
    formSchema: [{
      key: `purpose`,
      type: `text`,
      labelEn: `Purpose`,
      labelAr: `الغرض`,
      required: true,
      sensitive: false,
      placeholderEn: ``,
      placeholderAr: ``,
      choices: []
    }],
    createdAt: serverTimestamp(),
    createdBy: `hr`,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  };
  await assertFails(setDoc(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `workflowDrafts`,
      `EMPLOYEE-DRAFT`
    ),
    {
      ...workflowDraft,
      id: `EMPLOYEE-DRAFT`,
      createdBy: `employee`,
      updatedBy: `employee`
    }
  ));
  await assertSucceeds(setDoc(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `workflowDrafts`,
      workflowDraftId
    ),
    workflowDraft
  ));

  const publishBatch = writeBatch(hrDb);
  publishBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `workflowDefinitions`,
      `employment_letter__workflow_v1`
    ),
    {
      id: `employment_letter__workflow_v1`,
      companyId,
      requestTypeCode: `employment_letter`,
      version: 1,
      steps: [{
        index: 0,
        type: `fulfillment`,
        resolver: `hr`,
        mode: `parallel_any`,
        slaHours: 48,
        nameEn: `HR fulfillment`,
        nameAr: `تنفيذ الموارد البشرية`
      }],
      slaHours: 48,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: `hr`
    }
  );
  publishBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requestTypes`,
      `employment_letter__v1`
    ),
    {
      id: `employment_letter__v1`,
      companyId,
      code: `employment_letter`,
      version: 1,
      nameEn: workflowDraft.nameEn,
      nameAr: workflowDraft.nameAr,
      descriptionEn: workflowDraft.descriptionEn,
      descriptionAr: workflowDraft.descriptionAr,
      category: workflowDraft.category,
      confidentiality: workflowDraft.confidentiality,
      subjectMode: workflowDraft.subjectMode,
      initialResolver: `hr`,
      formSchema: workflowDraft.formSchema,
      workflowId: `employment_letter__workflow_v1`,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: `hr`
    }
  );
  publishBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requestCounters`,
      `workflow_${workflowDraftId}`
    ),
    {
      companyId,
      value: 1,
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  publishBatch.delete(doc(
    hrDb,
    `nasna_companies`,
    companyId,
    `workflowDrafts`,
    workflowDraftId
  ));
  await assertSucceeds(publishBatch.commit());
  const publishedType = await assertSucceeds(getDoc(doc(
    hrDb,
    `nasna_companies`,
    companyId,
    `requestTypes`,
    `employment_letter__v1`
  )));
  assert.equal(publishedType.data().status, `published`);

  await environment.cleanup();
  console.log(`stage10-transactions-ok`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
