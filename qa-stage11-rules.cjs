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

const projectId = `demo-nasna-stage11`;
const companyId = `COMPANY-1`;
const workDate = `2026-07-28`;
const path = (database, collectionName, id) => doc(
  database,
  `nasna_companies`,
  companyId,
  collectionName,
  id
);

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
  departmentId: `OPS`,
  teamId: `TEAM-1`,
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

const policy = {
  id: `POLICY-V1`,
  companyId,
  version: 1,
  timezone: `Asia/Amman`,
  weekStartsOn: 1,
  workingDays: [0, 1, 2, 3, 4],
  workdayStart: `09:00`,
  workdayEnd: `17:00`,
  dailyMinutes: 480,
  maxDailyMinutes: 720,
  maxWeeklyMinutes: 2880,
  minRestMinutes: 660,
  conflictMode: `block`,
  holidayWorkMode: `warn`,
  effectiveFrom: `2026-07-01`,
  status: `published`,
  createdAt: new Date(),
  createdBy: `hr`,
  updatedAt: new Date(),
  updatedBy: `hr`
};

const template = (id, startTime, endTime) => ({
  id,
  companyId,
  code: id,
  nameEn: `${id} shift`,
  nameAr: `وردية ${id}`,
  kind: `standard`,
  flexWindowMinutes: 0,
  segments: [{ startTime, endTime, breakMinutes: 0 }],
  totalMinutes: 480,
  status: `active`,
  createdAt: new Date(),
  createdBy: `hr`,
  updatedAt: new Date(),
  updatedBy: `hr`
});

const shiftSegment = (templateId, startHour, endHour) => ({
  shiftTemplateId: templateId,
  startAt: new Date(`2026-07-28T${String(startHour).padStart(2, `0`)}:00:00Z`),
  endAt: new Date(`2026-07-28T${String(endHour).padStart(2, `0`)}:00:00Z`),
  breakMinutes: 0,
  locationId: `HQ`
});

const shift = ({
  id,
  employeeId,
  employeeAuthUid,
  managerEmployeeId,
  templateId = `DAY`,
  status = `published`,
  version = 1,
  rosterId = `ROSTER-1`
}) => ({
  id,
  companyId,
  rosterId,
  rosterRevision: rosterId.startsWith(`REQUEST-`) ? 0 : 1,
  employeeId,
  employeeAuthUid,
  managerEmployeeId,
  branchId: `MAIN`,
  locationId: `HQ`,
  workDate,
  templateId,
  templateKind: `standard`,
  flexWindowMinutes: 0,
  segments: [
    templateId === `LATE`
      ? shiftSegment(`LATE`, 12, 20)
      : shiftSegment(`DAY`, 6, 14)
  ],
  totalMinutes: 480,
  status,
  version,
  previousAssignmentId: ``,
  supersededBy: ``,
  sourceRequestId: ``,
  conflictCheck: {
    policyId: `POLICY-V1`,
    result: status === `draft` ? `pending` : `passed`,
    reason: ``
  },
  createdAt: new Date(),
  createdBy: `manager`,
  publishedAt: status === `published` ? new Date() : null,
  publishedBy: status === `published` ? `manager` : ``,
  updatedAt: new Date(),
  updatedBy: `manager`
});

const workflow = code => ({
  id: `${code}__workflow_v1`,
  companyId,
  requestTypeCode: code,
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
      slaHours: 24,
      nameEn: `HR fulfillment`,
      nameAr: `تنفيذ الموارد البشرية`
    }
  ],
  slaHours: 48,
  status: `published`,
  createdAt: new Date(),
  createdBy: `hr`
});

const type = code => ({
  id: `${code}__v1`,
  companyId,
  code,
  version: 1,
  nameEn: code,
  nameAr: `طلب وردية`,
  descriptionEn: `Stage 11 request`,
  descriptionAr: `طلب من المرحلة 11`,
  category: `team`,
  confidentiality: `normal`,
  subjectMode: `self`,
  initialResolver: `direct_manager`,
  formSchema: [],
  workflowId: `${code}__workflow_v1`,
  status: `published`,
  createdAt: new Date(),
  createdBy: `hr`
});

const requestRecord = ({
  id,
  status = `PENDING_APPROVAL`,
  currentStep = 0,
  currentStepType = `approval`,
  currentAssigneeIds = [`manager`],
  routeKind = `manager`,
  revision = 0,
  lastEventId = `EVENT-1`
}) => ({
  id,
  companyId,
  requestNumber: `REQ-SHIFTCHA-2026-000001`,
  sequence: 1,
  typeId: `shift_change__v1`,
  typeCode: `shift_change`,
  typeVersion: 1,
  workflowId: `shift_change__workflow_v1`,
  requesterUid: `employee`,
  requesterEmployeeId: `EMP-1`,
  requesterName: `Employee`,
  subjectEmployeeId: `EMP-1`,
  subjectName: `Employee`,
  managerEmployeeId: `MGR-1`,
  status,
  previousStatus: ``,
  currentStep,
  currentStepType,
  currentAssigneeIds,
  previousAssigneeIds: [],
  slaRemainingHours: 0,
  delegationId: ``,
  originalAssigneeIds: [],
  routeKind,
  payload: {
    assignmentId: `SHIFT-EMP-1`,
    workDate,
    requestedShiftTemplateId: `LATE`,
    reason: `Family appointment`
  },
  confidentiality: `normal`,
  priority: `normal`,
  dueAt: new Date(`2026-07-30T12:00:00Z`),
  submittedAt: new Date(),
  createdAt: new Date(),
  createdBy: `employee`,
  updatedAt: new Date(),
  updatedBy: status === `PENDING_FULFILLMENT` ? `manager` : `employee`,
  revision,
  lastEventId,
  outcome: {},
  fulfillmentRef: {},
  completedAt: null,
  withdrawnAt: null
});

const eventRecord = (
  requestId,
  eventId,
  actorUid,
  typeName,
  payload = {}
) => ({
  id: eventId,
  companyId,
  requestId,
  actorUid,
  actorName: actorUid,
  actorRole: actorUid === `hr` ? `hr_admin` : `employee`,
  type: typeName,
  message: typeName,
  payload,
  createdAt: serverTimestamp()
});

const auditRecord = (action, targetId) => ({
  companyId,
  actorId: `manager`,
  actorEmail: `manager@nasna.test`,
  action,
  targetId,
  details: { source: `stage11-rules-qa` },
  createdAt: serverTimestamp()
});

const rosterRecord = ({
  id = `ROSTER-PUBLISH-QA`,
  status = `draft`,
  publishCompleted = 0,
  lastPublishedAssignmentId = ``,
  publishedAt = null,
  publishedBy = ``
} = {}) => ({
  id,
  companyId,
  ownerUid: `manager`,
  managerEmployeeId: `MGR-1`,
  scopeKind: `manager`,
  startDate: `2026-07-27`,
  endDate: `2026-08-02`,
  timezone: `Asia/Amman`,
  policyId: policy.id,
  status,
  revision: 1,
  assignmentCount: 1,
  draftState: `ready`,
  draftToken: `draft-token-stage11`,
  publishTotal: 1,
  publishCompleted,
  publishToken: status === `draft` ? `` : `publish-token-stage11`,
  publishConflictResult: status === `draft` ? `` : `passed`,
  publishOverrideReason: ``,
  lastPublishedAssignmentId,
  createdAt: new Date(),
  createdBy: `manager`,
  publishedAt,
  publishedBy,
  updatedAt: new Date(),
  updatedBy: `manager`
});

const seed = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(database, `nasna_companies`, companyId), {
      id: companyId,
      ownerId: `hr`,
      nameEn: `NASNA`,
      nameAr: `ناسنا`,
      status: `active`
    });
    for (const record of [
      member(`hr`, `hr_admin`, `HR-1`, true),
      member(`manager`, `employee`, `MGR-1`, true),
      member(`employee`, `employee`, `EMP-1`),
      member(`colleague`, `employee`, `EMP-2`),
      member(`worker3`, `employee`, `EMP-3`),
      member(`worker4`, `employee`, `EMP-4`),
      member(`worker5`, `employee`, `EMP-5`),
      member(`other-manager`, `employee`, `MGR-2`, true)
    ]) {
      await setDoc(path(database, `members`, record.uid), record);
    }
    for (const record of [
      employee(`HR-1`, `hr`),
      employee(`MGR-1`, `manager`, `HR-1`),
      employee(`EMP-1`, `employee`, `MGR-1`),
      employee(`EMP-2`, `colleague`, `MGR-1`),
      employee(`EMP-3`, `worker3`, `MGR-1`),
      employee(`EMP-4`, `worker4`, `MGR-1`),
      employee(`EMP-5`, `worker5`, `MGR-1`),
      employee(`MGR-2`, `other-manager`, `HR-1`)
    ]) {
      await setDoc(path(database, `employees`, record.id), record);
    }
    await setDoc(path(database, `locations`, `HQ`), {
      id: `HQ`,
      companyId,
      code: `HQ`,
      branchId: `MAIN`,
      nameEn: `HQ`,
      nameAr: `المركز`,
      city: `Amman`,
      address: ``,
      timezone: `Asia/Amman`,
      status: `active`
    });
    await setDoc(path(database, `timePolicies`, policy.id), policy);
    await setDoc(path(database, `timeSettings`, `current`), {
      id: `current`,
      companyId,
      activePolicyId: policy.id,
      policyVersion: 1,
      holidayCalendarYear: 2026,
      holidayCalendarConfirmedAt: new Date(),
      requestServicesEnabled: true,
      requestTypeIds: [`shift_change__v1`, `shift_swap__v1`],
      createdAt: new Date(),
      createdBy: `hr`,
      updatedAt: new Date(),
      updatedBy: `hr`
    });
    await setDoc(path(database, `shiftTemplates`, `DAY`), template(`DAY`, `09:00`, `17:00`));
    await setDoc(path(database, `shiftTemplates`, `LATE`), template(`LATE`, `15:00`, `23:00`));
    await setDoc(path(database, `workflowDefinitions`, `shift_change__workflow_v1`), workflow(`shift_change`));
    await setDoc(path(database, `workflowDefinitions`, `shift_swap__workflow_v1`), workflow(`shift_swap`));
    await setDoc(path(database, `requestTypes`, `shift_change__v1`), type(`shift_change`));
    await setDoc(path(database, `requestTypes`, `shift_swap__v1`), type(`shift_swap`));
    await setDoc(path(database, `shiftAssignments`, `SHIFT-EMP-1`), shift({
      id: `SHIFT-EMP-1`,
      employeeId: `EMP-1`,
      employeeAuthUid: `employee`,
      managerEmployeeId: `MGR-1`
    }));
    await setDoc(path(database, `shiftAssignments`, `SHIFT-EMP-2`), shift({
      id: `SHIFT-EMP-2`,
      employeeId: `EMP-2`,
      employeeAuthUid: `colleague`,
      managerEmployeeId: `MGR-1`,
      templateId: `LATE`
    }));
    await setDoc(path(database, `shiftAssignments`, `SHIFT-EMP-3`), shift({
      id: `SHIFT-EMP-3`,
      employeeId: `EMP-3`,
      employeeAuthUid: `worker3`,
      managerEmployeeId: `MGR-1`
    }));
    await setDoc(path(database, `shiftAssignments`, `SHIFT-EMP-4`), shift({
      id: `SHIFT-EMP-4`,
      employeeId: `EMP-4`,
      employeeAuthUid: `worker4`,
      managerEmployeeId: `MGR-1`,
      templateId: `LATE`
    }));
    await setDoc(path(database, `shiftAssignments`, `DRAFT-EMP-1`), shift({
      id: `DRAFT-EMP-1`,
      employeeId: `EMP-1`,
      employeeAuthUid: `employee`,
      managerEmployeeId: `MGR-1`,
      status: `draft`,
      version: 0,
      rosterId: `DRAFT-ROSTER`
    }));
    await setDoc(path(database, `scheduleLocks`, `EMP-1__${workDate}`), {
      id: `EMP-1__${workDate}`,
      companyId,
      employeeId: `EMP-1`,
      employeeAuthUid: `employee`,
      managerEmployeeId: `MGR-1`,
      workDate,
      currentAssignmentId: `SHIFT-EMP-1`,
      version: 1,
      updatedAt: new Date(),
      updatedBy: `manager`
    });
    await setDoc(path(database, `scheduleLocks`, `EMP-3__${workDate}`), {
      id: `EMP-3__${workDate}`,
      companyId,
      employeeId: `EMP-3`,
      employeeAuthUid: `worker3`,
      managerEmployeeId: `MGR-1`,
      workDate,
      currentAssignmentId: `SHIFT-EMP-3`,
      version: 1,
      updatedAt: new Date(),
      updatedBy: `manager`
    });
    await setDoc(path(database, `scheduleLocks`, `EMP-4__${workDate}`), {
      id: `EMP-4__${workDate}`,
      companyId,
      employeeId: `EMP-4`,
      employeeAuthUid: `worker4`,
      managerEmployeeId: `MGR-1`,
      workDate,
      currentAssignmentId: `SHIFT-EMP-4`,
      version: 1,
      updatedAt: new Date(),
      updatedBy: `manager`
    });
  });
};

const createShiftChangeRequest = (database, assignmentId, requestId) => {
  const eventId = `EVENT-${requestId}`;
  const requestNumber = `REQ-SHIFTCHA-2026-${requestId.slice(-6).padStart(6, `0`)}`;
  const record = requestRecord({ id: requestId, lastEventId: eventId });
  record.requestNumber = requestNumber;
  record.payload.assignmentId = assignmentId;
  record.createdAt = serverTimestamp();
  record.updatedAt = serverTimestamp();
  record.submittedAt = serverTimestamp();
  const batch = writeBatch(database);
  batch.set(path(database, `requestCounters`, `requests`), {
    companyId,
    value: 1,
    lastRequestId: requestId,
    lastRequestNumber: requestNumber,
    updatedAt: serverTimestamp(),
    updatedBy: `employee`
  });
  batch.set(path(database, `requests`, requestId), record);
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
    eventRecord(requestId, eventId, `employee`, `SUBMITTED`)
  );
  return batch.commit();
};

const seedPendingFulfillment = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    const requestId = `REQUEST-FULFILL`;
    await setDoc(
      path(database, `requests`, requestId),
      requestRecord({
        id: requestId,
        status: `PENDING_FULFILLMENT`,
        currentStep: 1,
        currentStepType: `fulfillment`,
        currentAssigneeIds: [`hr`],
        routeKind: `hr`,
        revision: 1,
        lastEventId: `MANAGER-APPROVED`
      })
    );
    await setDoc(
      doc(
        database,
        `nasna_companies`,
        companyId,
        `requests`,
        requestId,
        `tasks`,
        `HR-TASK`
      ),
      {
        id: `HR-TASK`,
        companyId,
        requestId,
        stepIndex: 1,
        stepType: `fulfillment`,
        mode: `parallel_any`,
        assigneeUid: `hr`,
        assigneeRole: `hr_admin`,
        status: `PENDING`,
        decision: ``,
        note: ``,
        dueAt: new Date(`2026-07-30T12:00:00Z`),
        actedAt: null,
        createdAt: new Date(),
        createdBy: `manager`,
        updatedAt: new Date(),
        updatedBy: `manager`
      }
    );
  });
};

const applyShiftChangeSchedule = database => {
  const requestId = `REQUEST-FULFILL`;
  const replacementId = `SHIFT-${requestId}-EMP-1`;
  const replacement = {
    ...shift({
      id: replacementId,
      employeeId: `EMP-1`,
      employeeAuthUid: `employee`,
      managerEmployeeId: `MGR-1`,
      templateId: `LATE`,
      version: 2,
      rosterId: `REQUEST-${requestId}`
    }),
    previousAssignmentId: `SHIFT-EMP-1`,
    sourceRequestId: requestId,
    createdAt: serverTimestamp(),
    createdBy: `hr`,
    publishedAt: serverTimestamp(),
    publishedBy: `hr`,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  };
  const batch = writeBatch(database);
  batch.set(path(database, `shiftAssignments`, replacementId), replacement);
  batch.update(path(database, `shiftAssignments`, `SHIFT-EMP-1`), {
    status: `superseded`,
    supersededBy: replacementId,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  });
  batch.update(path(database, `scheduleLocks`, `EMP-1__${workDate}`), {
    currentAssignmentId: replacementId,
    version: 2,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  });
  return batch.commit();
};

const completeShiftChangeRequest = (
  database,
  replacementId = `SHIFT-REQUEST-FULFILL-EMP-1`
) => {
  const requestId = `REQUEST-FULFILL`;
  const eventId = `FULFILLED-EVENT`;
  const batch = writeBatch(database);
  batch.update(path(database, `requests`, requestId), {
    status: `COMPLETED`,
    currentAssigneeIds: [],
    outcome: { code: `fulfilled`, note: `` },
    fulfillmentRef: {
      kind: `shift_change`,
      id: replacementId,
      colleagueId: ``,
      requestId
    },
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: `hr`,
    revision: 2,
    lastEventId: eventId
  });
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
    eventRecord(requestId, eventId, `hr`, `FULFILLED`, {
      fulfillmentRef: {
        kind: `shift_change`,
        id: replacementId,
        colleagueId: ``,
        requestId
      }
    })
  );
  return batch.commit();
};

const finalizeShiftChangeTask = database => {
  const requestId = `REQUEST-FULFILL`;
  const batch = writeBatch(database);
  batch.update(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      requestId,
      `tasks`,
      `HR-TASK`
    ),
    {
      status: `APPROVED`,
      decision: `approve`,
      note: ``,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  return batch.commit();
};

const seedPendingShiftSwap = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    const requestId = `REQUEST-SWAP-FULFILL`;
    const record = requestRecord({
      id: requestId,
      status: `PENDING_FULFILLMENT`,
      currentStep: 1,
      currentStepType: `fulfillment`,
      currentAssigneeIds: [`hr`],
      routeKind: `hr`,
      revision: 1,
      lastEventId: `SWAP-MANAGER-APPROVED`
    });
    Object.assign(record, {
      requestNumber: `REQ-SHIFTSWA-2026-000001`,
      typeId: `shift_swap__v1`,
      typeCode: `shift_swap`,
      workflowId: `shift_swap__workflow_v1`,
      requesterUid: `worker3`,
      requesterEmployeeId: `EMP-3`,
      requesterName: `EMP-3`,
      subjectEmployeeId: `EMP-3`,
      subjectName: `EMP-3`,
      payload: {
        assignmentId: `SHIFT-EMP-3`,
        workDate,
        colleagueEmployeeCode: `EMP-4`,
        colleagueAssignmentId: `SHIFT-EMP-4`,
        reason: `Approved operational swap`
      }
    });
    await setDoc(path(database, `requests`, requestId), record);
    await setDoc(
      doc(
        database,
        `nasna_companies`,
        companyId,
        `requests`,
        requestId,
        `tasks`,
        `SWAP-HR-TASK`
      ),
      {
        id: `SWAP-HR-TASK`,
        companyId,
        requestId,
        stepIndex: 1,
        stepType: `fulfillment`,
        mode: `parallel_any`,
        assigneeUid: `hr`,
        assigneeRole: `hr_admin`,
        status: `PENDING`,
        decision: ``,
        note: ``,
        dueAt: new Date(`2026-07-30T12:00:00Z`),
        actedAt: null,
        createdAt: new Date(),
        createdBy: `manager`,
        updatedAt: new Date(),
        updatedBy: `manager`
      }
    );
  });
};

const applyShiftSwapSchedule = database => {
  const requestId = `REQUEST-SWAP-FULFILL`;
  const firstReplacementId = `SHIFT-${requestId}-EMP-3`;
  const secondReplacementId = `SHIFT-${requestId}-EMP-4`;
  const firstReplacement = {
    ...shift({
      id: firstReplacementId,
      employeeId: `EMP-3`,
      employeeAuthUid: `worker3`,
      managerEmployeeId: `MGR-1`,
      templateId: `LATE`,
      version: 2,
      rosterId: `REQUEST-${requestId}`
    }),
    previousAssignmentId: `SHIFT-EMP-3`,
    sourceRequestId: requestId,
    createdAt: serverTimestamp(),
    createdBy: `hr`,
    publishedAt: serverTimestamp(),
    publishedBy: `hr`,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  };
  const secondReplacement = {
    ...shift({
      id: secondReplacementId,
      employeeId: `EMP-4`,
      employeeAuthUid: `worker4`,
      managerEmployeeId: `MGR-1`,
      templateId: `DAY`,
      version: 2,
      rosterId: `REQUEST-${requestId}`
    }),
    previousAssignmentId: `SHIFT-EMP-4`,
    sourceRequestId: requestId,
    createdAt: serverTimestamp(),
    createdBy: `hr`,
    publishedAt: serverTimestamp(),
    publishedBy: `hr`,
    updatedAt: serverTimestamp(),
    updatedBy: `hr`
  };
  const batch = writeBatch(database);
  batch.set(
    path(database, `shiftAssignments`, firstReplacementId),
    firstReplacement
  );
  batch.set(
    path(database, `shiftAssignments`, secondReplacementId),
    secondReplacement
  );
  [
    [`SHIFT-EMP-3`, firstReplacementId],
    [`SHIFT-EMP-4`, secondReplacementId]
  ].forEach(([originalId, replacementId]) => {
    batch.update(path(database, `shiftAssignments`, originalId), {
      status: `superseded`,
      supersededBy: replacementId,
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    });
  });
  [
    [`EMP-3`, firstReplacementId],
    [`EMP-4`, secondReplacementId]
  ].forEach(([employeeId, replacementId]) => {
    batch.update(
      path(database, `scheduleLocks`, `${employeeId}__${workDate}`),
      {
        currentAssignmentId: replacementId,
        version: 2,
        updatedAt: serverTimestamp(),
        updatedBy: `hr`
      }
    );
  });
  return batch.commit();
};

const completeShiftSwapRequest = database => {
  const requestId = `REQUEST-SWAP-FULFILL`;
  const firstReplacementId = `SHIFT-${requestId}-EMP-3`;
  const secondReplacementId = `SHIFT-${requestId}-EMP-4`;
  const eventId = `SWAP-FULFILLED-EVENT`;
  const batch = writeBatch(database);
  batch.update(path(database, `requests`, requestId), {
    status: `COMPLETED`,
    currentAssigneeIds: [],
    outcome: { code: `fulfilled`, note: `` },
    fulfillmentRef: {
      kind: `shift_swap`,
      id: firstReplacementId,
      colleagueId: secondReplacementId,
      requestId
    },
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: `hr`,
    revision: 2,
    lastEventId: eventId
  });
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
    eventRecord(requestId, eventId, `hr`, `FULFILLED`, {
      fulfillmentRef: {
        kind: `shift_swap`,
        id: firstReplacementId,
        colleagueId: secondReplacementId,
        requestId
      }
    })
  );
  return batch.commit();
};

const finalizeShiftSwapTask = database => {
  const requestId = `REQUEST-SWAP-FULFILL`;
  const batch = writeBatch(database);
  batch.update(
    doc(
      database,
      `nasna_companies`,
      companyId,
      `requests`,
      requestId,
      `tasks`,
      `SWAP-HR-TASK`
    ),
    {
      status: `APPROVED`,
      decision: `approve`,
      note: ``,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    }
  );
  return batch.commit();
};

const notifyCompletedShiftSwap = database => {
  const requestId = `REQUEST-SWAP-FULFILL`;
  const batch = writeBatch(database);
  batch.set(path(database, `notifications`, `SWAP-NOTIFICATION`), {
    id: `SWAP-NOTIFICATION`,
    companyId,
    requestId,
    recipientUid: `worker3`,
    titleEn: `Request completed`,
    titleAr: `اكتمل الطلب`,
    bodyEn: `The shift swap is complete.`,
    bodyAr: `اكتمل تبديل الوردية.`,
    kind: `status`,
    href: `requests.html?v=20260727.1&request=${requestId}`,
    readAt: null,
    createdAt: serverTimestamp(),
    createdBy: `hr`
  });
  return batch.commit();
};

const seedResumableRoster = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(
      path(database, `rosters`, `ROSTER-PUBLISH-QA`),
      rosterRecord()
    );
    await setDoc(
      path(database, `shiftAssignments`, `DRAFT-PUBLISH-EMP-5`),
      shift({
        id: `DRAFT-PUBLISH-EMP-5`,
        employeeId: `EMP-5`,
        employeeAuthUid: `worker5`,
        managerEmployeeId: `MGR-1`,
        status: `draft`,
        version: 0,
        rosterId: `ROSTER-PUBLISH-QA`
      })
    );
  });
};

const publishResumableRoster = async database => {
  const rosterReference = path(
    database,
    `rosters`,
    `ROSTER-PUBLISH-QA`
  );
  const assignmentReference = path(
    database,
    `shiftAssignments`,
    `DRAFT-PUBLISH-EMP-5`
  );
  const lockReference = path(
    database,
    `scheduleLocks`,
    `EMP-5__${workDate}`
  );
  const startBatch = writeBatch(database);
  startBatch.update(rosterReference, {
    status: `publishing`,
    publishToken: `publish-token-stage11`,
    publishConflictResult: `passed`,
    publishOverrideReason: ``,
    updatedAt: serverTimestamp(),
    updatedBy: `manager`
  });
  await startBatch.commit();

  const assignmentBatch = writeBatch(database);
  assignmentBatch.update(assignmentReference, {
    status: `published`,
    version: 1,
    previousAssignmentId: ``,
    conflictCheck: {
      policyId: policy.id,
      result: `passed`,
      reason: ``
    },
    publishedAt: serverTimestamp(),
    publishedBy: `manager`,
    updatedAt: serverTimestamp(),
    updatedBy: `manager`
  });
  assignmentBatch.set(lockReference, {
    id: `EMP-5__${workDate}`,
    companyId,
    employeeId: `EMP-5`,
    employeeAuthUid: `worker5`,
    managerEmployeeId: `MGR-1`,
    workDate,
    currentAssignmentId: `DRAFT-PUBLISH-EMP-5`,
    version: 1,
    updatedAt: serverTimestamp(),
    updatedBy: `manager`
  });
  assignmentBatch.update(rosterReference, {
    publishCompleted: 1,
    lastPublishedAssignmentId: `DRAFT-PUBLISH-EMP-5`,
    updatedAt: serverTimestamp(),
    updatedBy: `manager`
  });
  await assignmentBatch.commit();

  const finalBatch = writeBatch(database);
  finalBatch.update(rosterReference, {
    status: `published`,
    publishedAt: serverTimestamp(),
    publishedBy: `manager`,
    updatedAt: serverTimestamp(),
    updatedBy: `manager`
  });
  finalBatch.set(
    path(database, `auditLogs`, `ROSTER-PUBLISHED-AUDIT`),
    auditRecord(`roster.published`, `ROSTER-PUBLISH-QA`)
  );
  return finalBatch.commit();
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
  const otherManagerDb = environment.authenticatedContext(`other-manager`, {
    email: `other-manager@nasna.test`
  }).firestore();
  const hrDb = environment.authenticatedContext(`hr`, {
    email: `hr@nasna.test`
  }).firestore();

  await assertSucceeds(getDoc(path(employeeDb, `shiftAssignments`, `SHIFT-EMP-1`)));
  await assertFails(getDoc(path(employeeDb, `shiftAssignments`, `SHIFT-EMP-2`)));
  await assertFails(getDoc(path(employeeDb, `shiftAssignments`, `DRAFT-EMP-1`)));
  await assertSucceeds(getDoc(path(managerDb, `shiftAssignments`, `SHIFT-EMP-1`)));
  await assertSucceeds(getDoc(path(managerDb, `shiftAssignments`, `SHIFT-EMP-2`)));
  await assertFails(getDoc(path(otherManagerDb, `shiftAssignments`, `SHIFT-EMP-1`)));
  await assertSucceeds(getDoc(path(hrDb, `shiftAssignments`, `SHIFT-EMP-2`)));
  await assertFails(setDoc(path(employeeDb, `shiftTemplates`, `UNSAFE`), {
    id: `UNSAFE`
  }));
  await assertFails(setDoc(
    path(hrDb, `timeSettings`, `current`),
    {
      holidayCalendarConfirmedAt: null,
      updatedAt: serverTimestamp(),
      updatedBy: `hr`
    },
    { merge: true }
  ));
  await assertSucceeds(
    createShiftChangeRequest(employeeDb, `SHIFT-EMP-1`, `000001`)
  );
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(path(context.firestore(), `requestCounters`, `requests`), {
      companyId,
      value: 0,
      updatedAt: new Date(),
      updatedBy: `seed`
    });
  });
  await assertFails(
    createShiftChangeRequest(employeeDb, `SHIFT-EMP-2`, `000002`)
  );

  await seedPendingFulfillment(environment);
  await assertFails(completeShiftChangeRequest(hrDb));
  await assertFails(finalizeShiftChangeTask(hrDb));
  await assertSucceeds(applyShiftChangeSchedule(hrDb));
  const stagedChangeRequest = await getDoc(
    path(hrDb, `requests`, `REQUEST-FULFILL`)
  );
  if (stagedChangeRequest.data().status !== `PENDING_FULFILLMENT`) {
    throw new Error(`Shift change closed before schedule verification.`);
  }
  await assertFails(
    completeShiftChangeRequest(hrDb, `SHIFT-NOT-APPLIED`)
  );
  await assertSucceeds(completeShiftChangeRequest(hrDb));
  await assertSucceeds(finalizeShiftChangeTask(hrDb));
  const replacementSnapshot = await getDoc(
    path(hrDb, `shiftAssignments`, `SHIFT-REQUEST-FULFILL-EMP-1`)
  );
  if (
    !replacementSnapshot.exists()
    || replacementSnapshot.data().status !== `published`
    || replacementSnapshot.data().sourceRequestId !== `REQUEST-FULFILL`
  ) {
    throw new Error(`Resumable shift fulfillment did not publish the replacement.`);
  }

  await seedPendingShiftSwap(environment);
  await assertSucceeds(applyShiftSwapSchedule(hrDb));
  const stagedSwapRequest = await getDoc(
    path(hrDb, `requests`, `REQUEST-SWAP-FULFILL`)
  );
  if (stagedSwapRequest.data().status !== `PENDING_FULFILLMENT`) {
    throw new Error(`Shift swap closed before schedule verification.`);
  }
  await assertSucceeds(completeShiftSwapRequest(hrDb));
  await assertSucceeds(finalizeShiftSwapTask(hrDb));
  await assertSucceeds(notifyCompletedShiftSwap(hrDb));
  const [firstSwapReplacement, secondSwapReplacement] = await Promise.all([
    getDoc(path(
      hrDb,
      `shiftAssignments`,
      `SHIFT-REQUEST-SWAP-FULFILL-EMP-3`
    )),
    getDoc(path(
      hrDb,
      `shiftAssignments`,
      `SHIFT-REQUEST-SWAP-FULFILL-EMP-4`
    ))
  ]);
  if (
    firstSwapReplacement.data().templateId !== `LATE`
    || secondSwapReplacement.data().templateId !== `DAY`
  ) {
    throw new Error(`Resumable shift swap did not exchange both assignments.`);
  }

  await seedResumableRoster(environment);
  await assertSucceeds(publishResumableRoster(managerDb));
  const publishedRoster = await getDoc(
    path(managerDb, `rosters`, `ROSTER-PUBLISH-QA`)
  );
  if (
    publishedRoster.data().status !== `published`
    || publishedRoster.data().publishCompleted !== 1
  ) {
    throw new Error(`Resumable roster publication did not complete.`);
  }

  await environment.cleanup();
  console.log(`Stage 11 Firestore authorization and resumable change, swap, and roster QA passed.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
