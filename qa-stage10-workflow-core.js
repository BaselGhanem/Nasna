export const release = `20260726.4`;
export const auth = { languageCode: `en` };
export const terminalStatuses = new Set([
  `COMPLETED`,
  `REJECTED`,
  `WITHDRAWN`,
  `CANCELLED`
]);

const actor = new URLSearchParams(location.search).get(`actor`) || `employee`;
const users = {
  employee: { uid: `employee-uid`, email: `employee@nasna.test` },
  manager: { uid: `manager-uid`, email: `manager@nasna.test` },
  admin: { uid: `admin-uid`, email: `hr@nasna.test` }
};

const employees = [
  {
    id: `HR-1`,
    authUid: `admin-uid`,
    fullNameEn: `Hala HR`,
    fullNameAr: `هالة الموارد البشرية`,
    workEmail: `hr@nasna.test`,
    managerEmployeeId: ``,
    employmentStatus: `active`
  },
  {
    id: `MGR-1`,
    authUid: `manager-uid`,
    fullNameEn: `Mona Manager`,
    fullNameAr: `منى المديرة`,
    workEmail: `manager@nasna.test`,
    managerEmployeeId: `HR-1`,
    employmentStatus: `active`
  },
  {
    id: `EMP-1`,
    authUid: `employee-uid`,
    fullNameEn: `Omar Employee`,
    fullNameAr: `عمر الموظف`,
    workEmail: `employee@nasna.test`,
    managerEmployeeId: `MGR-1`,
    employmentStatus: `active`
  }
];

const members = [
  {
    uid: `admin-uid`,
    employeeId: `HR-1`,
    email: `hr@nasna.test`,
    displayName: `Hala HR`,
    role: `hr_admin`,
    isManager: true,
    status: `active`
  },
  {
    uid: `manager-uid`,
    employeeId: `MGR-1`,
    email: `manager@nasna.test`,
    displayName: `Mona Manager`,
    role: `employee`,
    isManager: true,
    status: `active`
  },
  {
    uid: `employee-uid`,
    employeeId: `EMP-1`,
    email: `employee@nasna.test`,
    displayName: `Omar Employee`,
    role: `employee`,
    isManager: false,
    status: `active`
  }
];

const textField = (key, labelEn, labelAr) => ({
  key,
  type: `textarea`,
  labelEn,
  labelAr,
  required: true,
  placeholderEn: `Add clear details`,
  placeholderAr: `أضف التفاصيل بوضوح`,
  choices: []
});

const requestTypes = [
  {
    id: `general_hr__v1`,
    code: `general_hr`,
    version: 1,
    nameEn: `General HR request`,
    nameAr: `طلب عام للموارد البشرية`,
    descriptionEn: `Ask HR for support through a tracked request.`,
    descriptionAr: `اطلب مساعدة الموارد البشرية ضمن طلب متتبع.`,
    category: `general`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    formSchema: [textField(`details`, `Details`, `التفاصيل`)],
    workflowId: `general_hr__workflow_v1`,
    status: `published`
  },
  {
    id: `confidential_request__v1`,
    code: `confidential_request`,
    version: 1,
    nameEn: `Confidential HR request`,
    nameAr: `طلب سري للموارد البشرية`,
    descriptionEn: `A restricted request routed directly to HR.`,
    descriptionAr: `طلب مقيّد يذهب مباشرة إلى الموارد البشرية.`,
    category: `confidential`,
    confidentiality: `restricted`,
    subjectMode: `self`,
    initialResolver: `hr`,
    formSchema: [textField(`details`, `Confidential details`, `التفاصيل السرية`)],
    workflowId: `confidential_request__workflow_v1`,
    status: `published`
  },
  {
    id: `team_movement__v1`,
    code: `team_movement`,
    version: 1,
    nameEn: `Team movement request`,
    nameAr: `طلب حركة لفريقك`,
    descriptionEn: `Ask HR to validate and apply a direct-report movement.`,
    descriptionAr: `اطلب من HR التحقق من حركة لأحد موظفيك وتنفيذها.`,
    category: `team`,
    confidentiality: `normal`,
    subjectMode: `direct_report`,
    initialResolver: `hr`,
    formSchema: [textField(`reason`, `Reason`, `السبب`)],
    workflowId: `team_movement__workflow_v1`,
    status: `published`
  }
];

const workflows = [
  {
    id: `general_hr__workflow_v1`,
    slaHours: 72,
    status: `published`,
    steps: [
      {
        index: 0,
        type: `approval`,
        resolver: `direct_manager`,
        mode: `sequential`,
        nameEn: `Manager approval`,
        nameAr: `موافقة المدير`
      },
      {
        index: 1,
        type: `fulfillment`,
        resolver: `hr`,
        mode: `parallel_any`,
        nameEn: `HR fulfillment`,
        nameAr: `تنفيذ HR`
      }
    ]
  },
  {
    id: `confidential_request__workflow_v1`,
    slaHours: 24,
    status: `published`,
    steps: [
      {
        index: 0,
        type: `fulfillment`,
        resolver: `hr`,
        mode: `parallel_any`,
        nameEn: `Restricted HR handling`,
        nameAr: `معالجة HR المقيّدة`
      }
    ]
  },
  {
    id: `team_movement__workflow_v1`,
    slaHours: 72,
    status: `published`,
    steps: [
      {
        index: 0,
        type: `fulfillment`,
        resolver: `hr`,
        mode: `parallel_any`,
        nameEn: `HR validation & fulfillment`,
        nameAr: `تحقق HR والتنفيذ`
      }
    ]
  }
];

const workflowDrafts = [
  {
    id: `DRAFT-EMPLOYMENT-LETTER`,
    code: `employment_letter`,
    nameEn: `Employment letter`,
    nameAr: `كتاب إثبات عمل`,
    descriptionEn: `Request a tracked employment letter.`,
    descriptionAr: `اطلب كتاب إثبات عمل ضمن مسار متتبع.`,
    category: `documents`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    slaHours: 48,
    formSchema: [textField(`purpose`, `Purpose`, `الغرض`)],
    updatedAt: new Date()
  }
];

const date = value => new Date(value);

const baseRequest = (id, extra = {}) => ({
  id,
  requestNumber: `REQ-2026-${id.replaceAll(`-`, ``).slice(-6).toUpperCase()}`,
  typeId: `general_hr__v1`,
  typeCode: `general_hr`,
  typeVersion: 1,
  workflowId: `general_hr__workflow_v1`,
  requesterUid: `employee-uid`,
  requesterEmployeeId: `EMP-1`,
  requesterName: `Omar Employee`,
  subjectEmployeeId: `EMP-1`,
  subjectName: `Omar Employee`,
  managerEmployeeId: `MGR-1`,
  status: `PENDING_APPROVAL`,
  previousStatus: ``,
  currentStep: 0,
  currentStepType: `approval`,
  currentAssigneeIds: [`manager-uid`],
  previousAssigneeIds: [],
  routeKind: `manager`,
  payload: { details: `Please review this employee request.` },
  confidentiality: `normal`,
  priority: `normal`,
  dueAt: date(`2026-07-28T10:00:00Z`),
  submittedAt: date(`2026-07-25T09:00:00Z`),
  createdAt: date(`2026-07-25T09:00:00Z`),
  completedAt: null,
  outcome: {},
  ...extra
});

const ownRequests = [
  baseRequest(`OWN-INFO`, {
    status: `NEEDS_INFORMATION`,
    previousStatus: `PENDING_APPROVAL`,
    currentAssigneeIds: [],
    previousAssigneeIds: [`manager-uid`],
    outcome: { code: `needs_information`, note: `Please add the reference.` }
  }),
  baseRequest(`OWN-DONE`, {
    status: `COMPLETED`,
    currentStep: 1,
    currentStepType: `fulfillment`,
    currentAssigneeIds: [],
    routeKind: `hr`,
    completedAt: date(`2026-07-26T08:00:00Z`),
    outcome: { code: `fulfilled`, note: `Completed` }
  })
];

const managerRequests = [
  baseRequest(`MGR-PENDING`),
  baseRequest(`MGR-OWN`, {
    requesterUid: `manager-uid`,
    requesterEmployeeId: `MGR-1`,
    requesterName: `Mona Manager`,
    subjectEmployeeId: `MGR-1`,
    subjectName: `Mona Manager`,
    managerEmployeeId: `HR-1`,
    status: `PENDING_FULFILLMENT`,
    currentStepType: `fulfillment`,
    currentAssigneeIds: [`admin-uid`],
    routeKind: `hr`
  })
];

const hrRequests = [
  baseRequest(`HR-PENDING`, {
    status: `PENDING_FULFILLMENT`,
    currentStep: 1,
    currentStepType: `fulfillment`,
    currentAssigneeIds: [`admin-uid`],
    routeKind: `hr`
  }),
  baseRequest(`HR-FUTURE`, {
    typeId: `team_movement__v1`,
    typeCode: `team_movement`,
    workflowId: `team_movement__workflow_v1`,
    requesterUid: `manager-uid`,
    requesterEmployeeId: `MGR-1`,
    requesterName: `Mona Manager`,
    subjectEmployeeId: `EMP-1`,
    subjectName: `Omar Employee`,
    managerEmployeeId: `HR-1`,
    status: `PENDING_FULFILLMENT`,
    currentStepType: `fulfillment`,
    currentAssigneeIds: [`admin-uid`],
    routeKind: `hr`,
    payload: {
      reason: `Approved team reassignment`,
      effectiveDate: `2026-08-05`
    }
  }),
  baseRequest(`HR-DONE`, {
    status: `COMPLETED`,
    currentStep: 1,
    currentStepType: `fulfillment`,
    currentAssigneeIds: [],
    routeKind: `hr`,
    completedAt: date(`2026-07-26T08:00:00Z`),
    outcome: { code: `fulfilled`, note: `Completed` }
  })
];

const requestsById = new Map(
  [...ownRequests, ...managerRequests, ...hrRequests]
    .map(record => [record.id, record])
);
const commentsByRequest = new Map();
const delegations = [];
const notificationsByActor = {
  employee: [
    {
      id: `NOTICE-EMP`,
      requestId: `OWN-INFO`,
      titleEn: `Information requested`,
      titleAr: `مطلوب معلومات`,
      bodyEn: `Your manager needs a clarification.`,
      bodyAr: `مديرك يحتاج إلى توضيح.`,
      readAt: null,
      createdAt: date(`2026-07-26T09:00:00Z`)
    }
  ],
  manager: [],
  admin: []
};

const membershipFor = key => ({
  employee: members.find(member => member.uid === `employee-uid`),
  manager: members.find(member => member.uid === `manager-uid`),
  admin: members.find(member => member.uid === `admin-uid`)
}[key]);

export const state = {
  user: users[actor],
  profile: {
    uid: users[actor].uid,
    activeCompanyId: `company-1`,
    status: `active`
  },
  companyId: `company-1`,
  company: {
    id: `company-1`,
    nameEn: `Dar Aldawa`,
    nameAr: `دار الدواء`,
    status: `active`
  },
  membership: membershipFor(actor),
  ownEmployee: employees.find(employee => (
    employee.authUid === users[actor].uid
  )),
  employees,
  members,
  configurationTypes: requestTypes,
  workflowDrafts,
  requestTypes,
  workflows
};

export const onAuthStateChanged = (_auth, callback) => {
  queueMicrotask(() => callback(users[actor]));
  return () => undefined;
};

export const signOut = async () => undefined;
export const loadSession = async () => state;
export const ensureDefaultConfiguration = async () => false;
export const loadConfiguration = async () => ({
  requestTypes,
  workflows,
  configurationTypes: requestTypes,
  workflowDrafts
});
export const ensureSlaNotifications = async () => 0;
export const isAdmin = () => state.membership.role === `hr_admin`;
export const isManager = () => Boolean(
  state.membership.isManager
  || state.employees.some(employee => (
    employee.managerEmployeeId === state.ownEmployee.id
  ))
);
export const directReports = () => state.employees.filter(employee => (
  employee.managerEmployeeId === state.ownEmployee.id
));
export const requestTypeById = id => (
  requestTypes.find(type => type.id === id) || null
);
export const workflowById = id => (
  workflows.find(workflow => workflow.id === id) || null
);
export const roleLabel = role => ({
  super_admin: `Super Admin`,
  hr_admin: `HR Admin`,
  manager: `Manager`,
  employee: `Employee`
}[role] || role);
export const toDate = value => {
  if (!value) return null;
  if (typeof value.toDate === `function`) return value.toDate();
  return value instanceof Date ? value : new Date(value);
};
export const dateInputValue = value => {
  const parsed = toDate(value);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, `0`);
  const day = String(parsed.getDate()).padStart(2, `0`);
  return `${year}-${month}-${day}`;
};
export const overdue = record => (
  !terminalStatuses.has(record.status)
  && Boolean(record.dueAt)
  && toDate(record.dueAt).getTime() < Date.now()
);
export const durationHours = record => {
  if (!record.completedAt || !record.submittedAt) return 0;
  return Math.max(
    0,
    (toDate(record.completedAt).getTime() - toDate(record.submittedAt).getTime())
      / 3600000
  );
};

const pageResult = (records, options) => options
  ? { records, cursor: null, hasMore: false }
  : records;

export const loadOwnRequests = async options => pageResult(ownRequests, options);
export const loadManagerRequests = async options => pageResult(managerRequests, options);
export const loadHrRequests = async options => pageResult(hrRequests, options);
export const loadRequestById = async requestId => requestsById.get(requestId) || null;
export const loadRequestTypeVersions = async () => [];
export const loadNotifications = async () => notificationsByActor[actor];
export const loadDelegations = async () => delegations;
export const loadRequestEvents = async requestId => [
  {
    id: `${requestId}-EVENT`,
    actorName: requestsById.get(requestId)?.requesterName || `Employee`,
    type: `SUBMITTED`,
    message: `Request submitted`,
    createdAt: date(`2026-07-25T09:00:00Z`)
  }
];
export const loadRequestComments = async requestId => (
  commentsByRequest.get(requestId) || []
);

export const createRequest = async ({
  typeId,
  values,
  subjectEmployeeId,
  priority,
  submit
}) => {
  const id = `OWN-NEW-${ownRequests.length + 1}`;
  const type = requestTypeById(typeId);
  const record = baseRequest(id, {
    typeId,
    typeCode: type.code,
    workflowId: type.workflowId,
    subjectEmployeeId,
    subjectName: state.employees.find(employee => (
      employee.id === subjectEmployeeId
    ))?.fullNameEn || state.ownEmployee.fullNameEn,
    payload: values,
    priority,
    status: submit ? `PENDING_APPROVAL` : `DRAFT`,
    currentAssigneeIds: submit ? [`manager-uid`] : [],
    routeKind: submit ? `manager` : ``,
    submittedAt: submit ? new Date() : null
  });
  ownRequests.unshift(record);
  requestsById.set(id, record);
  return id;
};

export const submitDraft = async requestId => {
  const record = requestsById.get(requestId);
  record.status = `PENDING_APPROVAL`;
  record.currentAssigneeIds = [`manager-uid`];
  record.routeKind = `manager`;
};
export const withdrawRequest = async requestId => {
  const record = requestsById.get(requestId);
  record.status = `WITHDRAWN`;
  record.currentAssigneeIds = [];
};
export const respondToInformation = async (requestId, responseText) => {
  const record = requestsById.get(requestId);
  record.status = record.previousStatus || `PENDING_APPROVAL`;
  record.payload.informationResponse = responseText;
  record.currentAssigneeIds = record.previousAssigneeIds || [`manager-uid`];
};
export const decideRequest = async (requestId, decision, note) => {
  const record = requestsById.get(requestId);
  if (decision === `approve`) {
    record.status = `PENDING_FULFILLMENT`;
    record.routeKind = `hr`;
    record.currentAssigneeIds = [`admin-uid`];
  }
  if (decision === `needs_information`) {
    record.previousStatus = record.status;
    record.status = `NEEDS_INFORMATION`;
    record.currentAssigneeIds = [];
  }
  if (decision === `reject`) {
    record.status = `REJECTED`;
    record.currentAssigneeIds = [];
  }
  record.outcome = { code: decision, note };
};
export const fulfillRequest = async (requestId, { note, reference }) => {
  const record = requestsById.get(requestId);
  record.status = `COMPLETED`;
  record.currentAssigneeIds = [];
  record.completedAt = new Date();
  record.outcome = { code: `fulfilled`, note };
  record.fulfillmentRef = { kind: `request`, id: requestId, reference };
};
export const cancelRequest = async (requestId, note) => {
  const record = requestsById.get(requestId);
  record.status = `CANCELLED`;
  record.currentAssigneeIds = [];
  record.outcome = { code: `cancelled`, note };
};
export const addComment = async (requestId, body, visibility) => {
  const current = commentsByRequest.get(requestId) || [];
  current.push({
    id: `${requestId}-COMMENT-${current.length + 1}`,
    authorName: state.ownEmployee.fullNameEn,
    body,
    visibility,
    createdAt: new Date()
  });
  commentsByRequest.set(requestId, current);
};
export const markNotificationRead = async id => {
  const item = notificationsByActor[actor].find(notification => (
    notification.id === id
  ));
  if (item) item.readAt = new Date();
};
export const createDelegation = async (delegateUid, startDate, endDate) => {
  delegations.unshift({
    id: `DELEGATION-${delegations.length + 1}`,
    delegatorUid: state.user.uid,
    delegateUid,
    startAt: date(`${startDate}T00:00:00`),
    endAt: date(`${endDate}T00:00:00`),
    status: `active`
  });
};
export const cancelDelegation = async id => {
  const record = delegations.find(delegation => delegation.id === id);
  if (record) record.status = `cancelled`;
};
export const reconcileExpiredDelegations = async () => 0;
export const saveWorkflowDraft = async (input, draftId = ``) => {
  const existing = workflowDrafts.find(draft => draft.id === draftId);
  if (existing) {
    Object.assign(existing, input, { updatedAt: new Date() });
    return existing.id;
  }
  const id = `DRAFT-${workflowDrafts.length + 1}`;
  workflowDrafts.unshift({ ...input, id, updatedAt: new Date() });
  return id;
};
export const publishWorkflowDraft = async draftId => {
  const index = workflowDrafts.findIndex(draft => draft.id === draftId);
  if (index < 0) throw new Error(`configuration-draft-missing`);
  const [draft] = workflowDrafts.splice(index, 1);
  requestTypes
    .filter(type => type.code === draft.code)
    .forEach(type => {
      type.status = `retired`;
    });
  const version = requestTypes
    .filter(type => type.code === draft.code)
    .reduce((maximum, type) => Math.max(maximum, type.version), 0) + 1;
  const workflowId = `${draft.code}__workflow_v${version}`;
  workflows.push({
    id: workflowId,
    status: `published`,
    slaHours: Number(draft.slaHours),
    steps: [{
      index: 0,
      type: `fulfillment`,
      resolver: `hr`,
      mode: `parallel_any`,
      nameEn: `HR fulfillment`,
      nameAr: `تنفيذ HR`
    }]
  });
  requestTypes.push({
    ...draft,
    id: `${draft.code}__v${version}`,
    version,
    workflowId,
    status: `published`
  });
};
export const deleteWorkflowDraft = async draftId => {
  const index = workflowDrafts.findIndex(draft => draft.id === draftId);
  if (index >= 0) workflowDrafts.splice(index, 1);
};
export const retireRequestType = async typeId => {
  const type = requestTypes.find(item => item.id === typeId);
  if (type) type.status = `retired`;
};
