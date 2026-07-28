const fs = require(`node:fs`);
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require(`@firebase/rules-unit-testing`);
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna-stage10`;
const companyId = `COMPANY-1`;
const delegationStartAt = new Date(Date.now() - 60_000);
const delegationEndAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

const workflow = (id, code, steps) => ({
  id,
  companyId,
  requestTypeCode: code,
  version: 1,
  steps,
  slaHours: 72,
  status: `published`,
  createdAt: new Date(),
  createdBy: `hr`
});

const requestType = ({
  id,
  code,
  initialResolver,
  subjectMode = `self`,
  confidentiality = `normal`
}) => ({
  id,
  companyId,
  code,
  version: 1,
  nameEn: code,
  nameAr: `طلب`,
  descriptionEn: `Description`,
  descriptionAr: `وصف`,
  category: confidentiality === `restricted` ? `confidential` : `general`,
  confidentiality,
  subjectMode,
  initialResolver,
  formSchema: [{ key: `details`, type: `textarea`, required: true }],
  workflowId: `${code}__workflow_v1`,
  status: `published`,
  createdAt: new Date(),
  createdBy: `hr`
});

const requestRecord = ({
  id,
  requesterUid = `employee`,
  requesterEmployeeId = `EMP-1`,
  requesterName = `Employee`,
  subjectEmployeeId = requesterEmployeeId,
  subjectName = requesterName,
  managerEmployeeId = `MGR-1`,
  typeId = `general_hr__v1`,
  typeCode = `general_hr`,
  workflowId = `general_hr__workflow_v1`,
  confidentiality = `normal`,
  status = `PENDING_APPROVAL`,
  routeKind = `manager`,
  assignees = [`manager`],
  currentStep = 0,
  currentStepType = `approval`,
  eventId
}) => ({
  id,
  companyId,
  requestNumber: `REQ-2026-${id.replaceAll(`-`, ``).slice(0, 6).toUpperCase().padEnd(6, `0`)}`,
  typeId,
  typeCode,
  typeVersion: 1,
  workflowId,
  requesterUid,
  requesterEmployeeId,
  requesterName,
  subjectEmployeeId,
  subjectName,
  managerEmployeeId,
  status,
  previousStatus: ``,
  currentStep,
  currentStepType,
  currentAssigneeIds: assignees,
  previousAssigneeIds: [],
  delegationId: ``,
  originalAssigneeIds: [],
  routeKind,
  payload: { details: `Test request` },
  confidentiality,
  priority: `normal`,
  dueAt: new Date(`2026-08-01T00:00:00Z`),
  submittedAt: serverTimestamp(),
  createdAt: serverTimestamp(),
  createdBy: requesterUid,
  updatedAt: serverTimestamp(),
  updatedBy: requesterUid,
  revision: 0,
  lastEventId: eventId,
  outcome: {},
  fulfillmentRef: {},
  completedAt: null,
  withdrawnAt: null
});

const eventRecord = (requestId, eventId, actorUid, type = `SUBMITTED`) => ({
  id: eventId,
  companyId,
  requestId,
  actorUid,
  actorName: actorUid,
  actorRole: actorUid === `hr` ? `hr_admin` : `employee`,
  type,
  message: type,
  payload: {},
  createdAt: serverTimestamp()
});

const createRequestBatch = async (database, data) => {
  const counterReference = doc(
    database,
    `nasna_companies`,
    companyId,
    `requestCounters`,
    `requests`
  );
  const counterSnapshot = await getDoc(counterReference);
  const nextValue = counterSnapshot.exists()
    ? Number(counterSnapshot.data().value || 0) + 1
    : 1;
  const batch = writeBatch(database);
  batch.set(counterReference, {
    companyId,
    value: nextValue,
    lastRequestId: data.id,
    lastRequestNumber: data.requestNumber,
    updatedAt: serverTimestamp(),
    updatedBy: data.requesterUid
  });
  batch.set(
    doc(database, `nasna_companies`, companyId, `requests`, data.id),
    { ...data, sequence: nextValue }
  );
  batch.set(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      data.id,
      `events`,
      data.lastEventId
    ),
    eventRecord(data.id, data.lastEventId, data.requesterUid)
  );
  await batch.commit();
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
    const members = [
      member(`hr`, `hr_admin`, `HR-1`),
      member(`hr-two`, `hr_admin`, `HR-2`),
      member(`upper`, `employee`, `UPPER-1`, true),
      member(`manager`, `employee`, `MGR-1`, true),
      member(`delegate`, `employee`, `DEL-1`, true),
      member(`employee`, `employee`, `EMP-1`),
      member(`outsider`, `employee`, `OUT-1`)
    ];
    for (const item of members) {
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
      employee(`UPPER-1`, `upper`),
      employee(`MGR-1`, `manager`, `UPPER-1`),
      employee(`DEL-1`, `delegate`, `UPPER-1`),
      employee(`EMP-1`, `employee`, `MGR-1`),
      employee(`OUT-1`, `outsider`, `UPPER-1`),
      employee(`HR-1`, `hr`),
      employee(`HR-2`, `hr-two`)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `employees`, item.id),
        item
      );
    }
    const managerSteps = [
      { index: 0, type: `approval`, resolver: `direct_manager`, mode: `sequential`, slaHours: 24, nameEn: `Manager`, nameAr: `المدير` },
      { index: 1, type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 48, nameEn: `HR`, nameAr: `الموارد البشرية` }
    ];
    const hrSteps = [
      { index: 0, type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 24, nameEn: `HR`, nameAr: `الموارد البشرية` }
    ];
    for (const item of [
      workflow(`general_hr__workflow_v1`, `general_hr`, managerSteps),
      workflow(`confidential_request__workflow_v1`, `confidential_request`, hrSteps),
      workflow(`team_movement__workflow_v1`, `team_movement`, hrSteps)
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `workflowDefinitions`, item.id),
        item
      );
    }
    for (const item of [
      requestType({
        id: `general_hr__v1`,
        code: `general_hr`,
        initialResolver: `direct_manager`
      }),
      requestType({
        id: `confidential_request__v1`,
        code: `confidential_request`,
        initialResolver: `hr`,
        confidentiality: `restricted`
      }),
      requestType({
        id: `team_movement__v1`,
        code: `team_movement`,
        initialResolver: `hr`,
        subjectMode: `direct_report`
      })
    ]) {
      await setDoc(
        doc(database, `nasna_companies`, companyId, `requestTypes`, item.id),
        item
      );
    }
  });
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
  const delegateDb = environment.authenticatedContext(`delegate`, {
    email: `delegate@nasna.test`
  }).firestore();
  const hrDb = environment.authenticatedContext(`hr`, {
    email: `hr@nasna.test`
  }).firestore();
  const outsiderDb = environment.authenticatedContext(`outsider`, {
    email: `outsider@nasna.test`
  }).firestore();

  const employeeRequest = requestRecord({
    id: `A10001`,
    eventId: `EVENT-A10001`
  });
  await assertSucceeds(createRequestBatch(employeeDb, employeeRequest));

  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      employeeRequest.id,
      `comments`,
      `PARTICIPANT-COMMENT`
    ), {
      id: `PARTICIPANT-COMMENT`,
      companyId,
      requestId: employeeRequest.id,
      authorUid: `manager`,
      authorName: `Manager`,
      authorRole: `manager`,
      body: `Visible to participants`,
      visibility: `participants`,
      createdAt: new Date()
    });
    await setDoc(doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      employeeRequest.id,
      `comments`,
      `HR-COMMENT`
    ), {
      id: `HR-COMMENT`,
      companyId,
      requestId: employeeRequest.id,
      authorUid: `hr`,
      authorName: `HR`,
      authorRole: `hr_admin`,
      body: `Internal HR note`,
      visibility: `hr_only`,
      createdAt: new Date()
    });
  });
  await assertSucceeds(getDoc(doc(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id,
    `comments`,
    `PARTICIPANT-COMMENT`
  )));
  await assertFails(getDoc(doc(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id,
    `comments`,
    `HR-COMMENT`
  )));
  await assertFails(getDoc(doc(
    managerDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id,
    `comments`,
    `HR-COMMENT`
  )));
  await assertSucceeds(getDoc(doc(
    hrDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id,
    `comments`,
    `HR-COMMENT`
  )));
  await assertSucceeds(getDocs(query(
    collection(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      employeeRequest.id,
      `comments`
    ),
    where(`visibility`, `==`, `participants`)
  )));
  await assertFails(getDocs(collection(
    employeeDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id,
    `comments`
  )));

  await assertFails(createRequestBatch(employeeDb, requestRecord({
    id: `A10002`,
    assignees: [`employee`],
    eventId: `EVENT-A10002`
  })));

  const confidential = requestRecord({
    id: `A10003`,
    typeId: `confidential_request__v1`,
    typeCode: `confidential_request`,
    workflowId: `confidential_request__workflow_v1`,
    confidentiality: `restricted`,
    status: `PENDING_FULFILLMENT`,
    routeKind: `hr`,
    assignees: [`hr`],
    currentStepType: `fulfillment`,
    eventId: `EVENT-A10003`
  });
  await assertSucceeds(createRequestBatch(employeeDb, confidential));
  await assertFails(getDoc(doc(
    managerDb,
    `nasna_companies`,
    companyId,
    `requests`,
    confidential.id
  )));
  await assertSucceeds(getDoc(doc(
    hrDb,
    `nasna_companies`,
    companyId,
    `requests`,
    confidential.id
  )));
  await assertFails(getDoc(doc(
    outsiderDb,
    `nasna_companies`,
    companyId,
    `requests`,
    employeeRequest.id
  )));

  const approvalEventId = `EVENT-APPROVE`;
  const approvalBatch = writeBatch(managerDb);
  approvalBatch.update(
    doc(managerDb, `nasna_companies`, companyId, `requests`, employeeRequest.id),
    {
      status: `PENDING_FULFILLMENT`,
      currentStep: 1,
      currentStepType: `fulfillment`,
      currentAssigneeIds: [`hr`],
      routeKind: `hr`,
      dueAt: new Date(`2026-08-02T00:00:00Z`),
      outcome: { code: `manager_approved`, note: `` },
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 1,
      lastEventId: approvalEventId
    }
  );
  approvalBatch.set(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      employeeRequest.id,
      `events`,
      approvalEventId
    ),
    eventRecord(employeeRequest.id, approvalEventId, `manager`, `APPROVED`)
  );
  await assertSucceeds(approvalBatch.commit());

  await assertFails(updateDoc(
    doc(managerDb, `nasna_companies`, companyId, `requests`, employeeRequest.id),
    {
      status: `COMPLETED`,
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 2,
      lastEventId: `MISSING-EVENT`
    }
  ));

  const completionEventId = `EVENT-COMPLETE`;
  const completionBatch = writeBatch(hrDb);
  completionBatch.update(
    doc(hrDb, `nasna_companies`, companyId, `requests`, employeeRequest.id),
    {
      status: `COMPLETED`,
      currentAssigneeIds: [],
      outcome: { code: `fulfilled`, note: `Done` },
      fulfillmentRef: { kind: `request`, id: employeeRequest.id },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`,
      revision: 2,
      lastEventId: completionEventId
    }
  );
  completionBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requests`,
      employeeRequest.id,
      `events`,
      completionEventId
    ),
    eventRecord(employeeRequest.id, completionEventId, `hr`, `FULFILLED`)
  );
  await assertSucceeds(completionBatch.commit());
  await assertFails(updateDoc(
    doc(hrDb, `nasna_companies`, companyId, `requests`, employeeRequest.id),
    {
      outcome: { code: `changed`, note: `` },
      updatedAt: serverTimestamp(),
      updatedBy: `hr`,
      revision: 3,
      lastEventId: `EVENT-ILLEGAL`
    }
  ));

  const managerOwn = requestRecord({
    id: `A10004`,
    requesterUid: `manager`,
    requesterEmployeeId: `MGR-1`,
    requesterName: `Manager`,
    subjectEmployeeId: `MGR-1`,
    subjectName: `Manager`,
    managerEmployeeId: `UPPER-1`,
    assignees: [`upper`],
    eventId: `EVENT-A10004`
  });
  await assertSucceeds(createRequestBatch(managerDb, managerOwn));
  await assertFails(updateDoc(
    doc(managerDb, `nasna_companies`, companyId, `requests`, managerOwn.id),
    {
      status: `PENDING_FULFILLMENT`,
      currentAssigneeIds: [`hr`],
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 1,
      lastEventId: `EVENT-SELF`
    }
  ));

  const teamRequest = requestRecord({
    id: `A10005`,
    requesterUid: `manager`,
    requesterEmployeeId: `MGR-1`,
    requesterName: `Manager`,
    subjectEmployeeId: `EMP-1`,
    subjectName: `Employee`,
    managerEmployeeId: `UPPER-1`,
    typeId: `team_movement__v1`,
    typeCode: `team_movement`,
    workflowId: `team_movement__workflow_v1`,
    status: `PENDING_FULFILLMENT`,
    routeKind: `hr`,
    assignees: [`hr`],
    currentStepType: `fulfillment`,
    eventId: `EVENT-A10005`
  });
  await assertSucceeds(createRequestBatch(managerDb, teamRequest));
  await assertFails(createRequestBatch(employeeDb, requestRecord({
    id: `A10006`,
    subjectEmployeeId: `OUT-1`,
    subjectName: `Outsider`,
    typeId: `team_movement__v1`,
    typeCode: `team_movement`,
    workflowId: `team_movement__workflow_v1`,
    status: `PENDING_FULFILLMENT`,
    routeKind: `hr`,
    assignees: [`hr`],
    currentStepType: `fulfillment`,
    eventId: `EVENT-A10006`
  })));

  await assertFails(updateDoc(
    doc(managerDb, `nasna_companies`, companyId, `employees`, `EMP-1`),
    {
      workPhone: `+962790000001`,
      updatedAt: serverTimestamp(),
      updatedBy: `manager`
    }
  ));

  await assertFails(updateDoc(
    doc(hrDb, `nasna_companies`, companyId, `workflowDefinitions`, `general_hr__workflow_v1`),
    { slaHours: 1 }
  ));

  const managerQuery = query(
    collection(managerDb, `nasna_companies`, companyId, `requests`),
    where(`managerEmployeeId`, `==`, `MGR-1`),
    where(`confidentiality`, `==`, `normal`)
  );
  await assertSucceeds(getDocs(managerQuery));

  const withdrawable = requestRecord({
    id: `A10007`,
    eventId: `EVENT-A10007`
  });
  await assertSucceeds(createRequestBatch(employeeDb, withdrawable));
  const withdrawEventId = `EVENT-WITHDRAW`;
  const withdrawBatch = writeBatch(employeeDb);
  withdrawBatch.update(
    doc(employeeDb, `nasna_companies`, companyId, `requests`, withdrawable.id),
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
  withdrawBatch.set(
    doc(
      employeeDb,
      `nasna_companies`,
      companyId,
      `requests`,
      withdrawable.id,
      `events`,
      withdrawEventId
    ),
    eventRecord(withdrawable.id, withdrawEventId, `employee`, `WITHDRAWN`)
  );
  await assertSucceeds(withdrawBatch.commit());

  const needsInfoEventId = `EVENT-NEEDS-INFO`;
  const needsInfoBatch = writeBatch(hrDb);
  needsInfoBatch.update(
    doc(hrDb, `nasna_companies`, companyId, `requests`, confidential.id),
    {
      status: `NEEDS_INFORMATION`,
      previousStatus: `PENDING_FULFILLMENT`,
      currentAssigneeIds: [],
      previousAssigneeIds: [`hr`],
      outcome: { code: `needs_information`, note: `Clarify` },
      updatedAt: serverTimestamp(),
      updatedBy: `hr`,
      revision: 1,
      lastEventId: needsInfoEventId
    }
  );
  needsInfoBatch.set(
    doc(
      hrDb,
      `nasna_companies`,
      companyId,
      `requests`,
      confidential.id,
      `events`,
      needsInfoEventId
    ),
    eventRecord(confidential.id, needsInfoEventId, `hr`, `INFORMATION_REQUESTED`)
  );
  await assertSucceeds(needsInfoBatch.commit());

  const responseEventId = `EVENT-INFO-RESPONSE`;
  const responseBatch = writeBatch(employeeDb);
  responseBatch.update(
    doc(employeeDb, `nasna_companies`, companyId, `requests`, confidential.id),
    {
      status: `PENDING_FULFILLMENT`,
      previousStatus: ``,
      currentAssigneeIds: [`hr`],
      previousAssigneeIds: [],
      payload: { details: `Test request`, informationResponse: `Clarified` },
      dueAt: new Date(`2026-08-03T00:00:00Z`),
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
      confidential.id,
      `events`,
      responseEventId
    ),
    eventRecord(confidential.id, responseEventId, `employee`, `INFORMATION_PROVIDED`)
  );
  await assertSucceeds(responseBatch.commit());

  const delegatable = requestRecord({
    id: `A10008`,
    eventId: `EVENT-A10008`
  });
  await assertSucceeds(createRequestBatch(employeeDb, delegatable));
  const delegationId = `DELEGATION-1`;
  const delegationEventId = `EVENT-DELEGATE`;
  const delegationBatch = writeBatch(managerDb);
  delegationBatch.set(
    doc(managerDb, `nasna_companies`, companyId, `delegations`, delegationId),
    {
      id: delegationId,
      companyId,
      delegatorUid: `manager`,
      delegateUid: `delegate`,
      startAt: delegationStartAt,
      endAt: delegationEndAt,
      status: `active`,
      createdAt: serverTimestamp(),
      createdBy: `manager`,
      updatedAt: serverTimestamp(),
      updatedBy: `manager`
    }
  );
  delegationBatch.update(
    doc(managerDb, `nasna_companies`, companyId, `members`, `manager`),
    {
      activeDelegationId: delegationId,
      activeDelegateUid: `delegate`,
      activeDelegationStartAt: delegationStartAt,
      activeDelegationEndAt: delegationEndAt,
      updatedAt: serverTimestamp(),
      updatedBy: `manager`
    }
  );
  delegationBatch.update(
    doc(managerDb, `nasna_companies`, companyId, `requests`, delegatable.id),
    {
      currentAssigneeIds: [`delegate`],
      delegationId,
      originalAssigneeIds: [`manager`],
      dueAt: new Date(`2026-08-04T00:00:00Z`),
      updatedAt: serverTimestamp(),
      updatedBy: `manager`,
      revision: 1,
      lastEventId: delegationEventId
    }
  );
  delegationBatch.set(
    doc(
      managerDb,
      `nasna_companies`,
      companyId,
      `requests`,
      delegatable.id,
      `events`,
      delegationEventId
    ),
    eventRecord(delegatable.id, delegationEventId, `manager`, `DELEGATED`)
  );
  await assertSucceeds(delegationBatch.commit());
  await assertSucceeds(getDoc(doc(
    delegateDb,
    `nasna_companies`,
    companyId,
    `requests`,
    delegatable.id
  )));

  await environment.cleanup();
  console.log(`stage10-rules-ok`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
