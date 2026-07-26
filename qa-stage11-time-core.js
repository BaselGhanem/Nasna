export const release = `20260727.1`;
export const auth = { languageCode: `en` };
export const maximumRosterAssignments = 140;

const actor = new URLSearchParams(location.search).get(`actor`) || `employee`;
const users = {
  employee: { uid: `employee-uid`, email: `employee@nasna.test` },
  manager: { uid: `manager-uid`, email: `manager@nasna.test` },
  admin: { uid: `admin-uid`, email: `hr@nasna.test` }
};

export const toDate = value => {
  if (!value) return null;
  if (typeof value.toDate === `function`) return value.toDate();
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad = value => String(value).padStart(2, `0`);

export const dateKey = value => {
  const date = toDate(value) || new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseDateKey = value => {
  const match = String(value || ``).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const addDays = (value, amount) => {
  const date = parseDateKey(value) || toDate(value) || new Date();
  date.setDate(date.getDate() + Number(amount || 0));
  return dateKey(date);
};

export const weekStart = value => {
  const date = parseDateKey(value) || toDate(value) || new Date();
  const delta = (date.getDay() - 1 + 7) % 7;
  date.setDate(date.getDate() - delta);
  return dateKey(date);
};

export const weekDates = value => (
  Array.from({ length: 7 }, (_, index) => addDays(weekStart(value), index))
);

const currentWeek = weekStart(new Date());
const atTime = (workDate, hour, minute = 0) => {
  const date = parseDateKey(workDate);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const employees = [
  {
    id: `HR-1`,
    employeeCode: `HR-1`,
    authUid: `admin-uid`,
    fullNameEn: `Hala HR`,
    fullNameAr: `هالة الموارد البشرية`,
    workEmail: `hr@nasna.test`,
    managerEmployeeId: ``,
    branchId: `MAIN`,
    locationId: `HQ`,
    departmentId: `PEOPLE`,
    employmentStatus: `active`,
    accessStatus: `active`
  },
  {
    id: `MGR-1`,
    employeeCode: `MGR-1`,
    authUid: `manager-uid`,
    fullNameEn: `Mona Manager`,
    fullNameAr: `منى المديرة`,
    workEmail: `manager@nasna.test`,
    managerEmployeeId: `HR-1`,
    branchId: `MAIN`,
    locationId: `HQ`,
    departmentId: `OPS`,
    employmentStatus: `active`,
    accessStatus: `active`
  },
  {
    id: `EMP-1`,
    employeeCode: `EMP-1`,
    authUid: `employee-uid`,
    fullNameEn: `Omar Employee`,
    fullNameAr: `عمر الموظف`,
    workEmail: `employee@nasna.test`,
    managerEmployeeId: `MGR-1`,
    branchId: `MAIN`,
    locationId: `HQ`,
    departmentId: `OPS`,
    employmentStatus: `active`,
    accessStatus: `active`
  },
  {
    id: `EMP-2`,
    employeeCode: `EMP-2`,
    authUid: `colleague-uid`,
    fullNameEn: `Rana Colleague`,
    fullNameAr: `رنا الزميلة`,
    workEmail: `colleague@nasna.test`,
    managerEmployeeId: `MGR-1`,
    branchId: `MAIN`,
    locationId: `BRANCH-1`,
    departmentId: `OPS`,
    employmentStatus: `active`,
    accessStatus: `active`
  }
];

const members = [
  {
    uid: `admin-uid`,
    employeeId: `HR-1`,
    role: `hr_admin`,
    isManager: true,
    status: `active`
  },
  {
    uid: `manager-uid`,
    employeeId: `MGR-1`,
    role: `employee`,
    isManager: true,
    status: `active`
  },
  {
    uid: `employee-uid`,
    employeeId: `EMP-1`,
    role: `employee`,
    isManager: false,
    status: `active`
  }
];

const templates = [
  {
    id: `DAY`,
    code: `DAY`,
    nameEn: `Day shift`,
    nameAr: `وردية نهارية`,
    kind: `standard`,
    flexWindowMinutes: 0,
    totalMinutes: 480,
    status: `active`,
    segments: [
      { startTime: `09:00`, endTime: `17:30`, breakMinutes: 30 }
    ]
  },
  {
    id: `SPLIT`,
    code: `SPLIT`,
    nameEn: `Split service`,
    nameAr: `وردية مقسمة`,
    kind: `split`,
    flexWindowMinutes: 0,
    totalMinutes: 480,
    status: `active`,
    segments: [
      { startTime: `08:00`, endTime: `12:00`, breakMinutes: 0 },
      { startTime: `16:00`, endTime: `20:00`, breakMinutes: 0 }
    ]
  }
];

const locations = [
  {
    id: `HQ`,
    nameEn: `Head office`,
    nameAr: `المكتب الرئيسي`,
    status: `active`
  },
  {
    id: `BRANCH-1`,
    nameEn: `Downtown branch`,
    nameAr: `فرع وسط البلد`,
    status: `active`
  }
];

const assignment = (
  id,
  employeeId,
  workDate,
  templateId = `DAY`,
  locationId = `HQ`
) => {
  const employee = employees.find(item => item.id === employeeId);
  const template = templates.find(item => item.id === templateId);
  const segments = template.segments.map(segment => ({
    shiftTemplateId: template.id,
    startAt: atTime(workDate, Number(segment.startTime.slice(0, 2))),
    endAt: atTime(workDate, Number(segment.endTime.slice(0, 2))),
    breakMinutes: segment.breakMinutes,
    locationId
  }));
  return {
    id,
    rosterId: `PUBLISHED-1`,
    rosterRevision: 1,
    employeeId,
    employeeAuthUid: employee.authUid,
    managerEmployeeId: employee.managerEmployeeId,
    branchId: employee.branchId,
    locationId,
    workDate,
    templateId,
    templateKind: template.kind,
    flexWindowMinutes: Number(template.flexWindowMinutes || 0),
    segments,
    totalMinutes: template.totalMinutes,
    status: `published`,
    version: 1
  };
};

let assignments = [
  assignment(`SHIFT-EMP-1-1`, `EMP-1`, addDays(currentWeek, 0)),
  assignment(`SHIFT-EMP-1-2`, `EMP-1`, addDays(currentWeek, 1), `SPLIT`),
  assignment(`SHIFT-EMP-2-1`, `EMP-2`, addDays(currentWeek, 0), `SPLIT`, `BRANCH-1`)
];

let rosters = [{
  id: `PUBLISHED-1`,
  ownerUid: `manager-uid`,
  managerEmployeeId: `MGR-1`,
  scopeKind: `manager`,
  startDate: currentWeek,
  endDate: addDays(currentWeek, 6),
  status: `published`,
  assignmentCount: 3,
  draftState: `ready`,
  draftToken: `published-draft-token`,
  publishTotal: 3,
  publishCompleted: 3,
  publishToken: `published-token`,
  publishConflictResult: `passed`,
  publishOverrideReason: ``,
  lastPublishedAssignmentId: `SHIFT-EMP-2-1`,
  revision: 1
}];
let simulatedPublishInterruptDelivered = false;

export const state = {
  user: null,
  companyId: `COMPANY-1`,
  company: { nameEn: `NASNA Demo`, nameAr: `شركة ناسنا` },
  membership: null,
  ownEmployee: null,
  employees,
  members,
  branches: [
    { id: `MAIN`, nameEn: `Main branch`, nameAr: `الفرع الرئيسي`, status: `active` }
  ],
  locations,
  templates,
  holidays: [{
    id: `HOL-1`,
    date: addDays(currentWeek, 3),
    year: Number(currentWeek.slice(0, 4)),
    nameEn: `Company holiday`,
    nameAr: `عطلة الشركة`,
    branchId: ``,
    status: `active`
  }],
  settings: {
    id: `current`,
    activePolicyId: `POLICY-V1`,
    policyVersion: 1,
    holidayCalendarYear: new Date().getFullYear(),
    requestServicesEnabled: true,
    requestTypeIds: [`shift_change__v1`, `shift_swap__v1`]
  },
  policy: {
    id: `POLICY-V1`,
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
    effectiveFrom: currentWeek,
    status: `published`
  }
};

export const onAuthStateChanged = (_auth, callback) => {
  queueMicrotask(() => callback(users[actor]));
  return () => undefined;
};

export const signOut = async () => undefined;

export const loadTimeSession = async user => {
  state.user = user;
  state.membership = members.find(item => item.uid === user.uid);
  state.ownEmployee = employees.find(item => item.authUid === user.uid);
  return state;
};

export const isAdmin = () => (
  state.membership?.role === `hr_admin`
  || state.membership?.role === `super_admin`
);

export const isManager = () => Boolean(
  state.membership?.isManager
  || employees.some(item => item.managerEmployeeId === state.ownEmployee?.id)
);

export const activeEmployees = () => employees.filter(item => (
  item.accessStatus === `active`
  && [`active`, `probation`, `leave`].includes(item.employmentStatus)
));

export const directReports = () => activeEmployees().filter(item => (
  item.managerEmployeeId === state.ownEmployee?.id
));

export const employeeById = id => employees.find(item => item.id === id) || null;
export const templateById = id => templates.find(item => item.id === id) || null;
export const locationById = id => locations.find(item => item.id === id) || null;

export const loadScheduleRange = async (startDate, endDate) => (
  assignments.filter(item => (
    item.workDate >= startDate
    && item.workDate <= endDate
    && (
      isAdmin()
      || (isManager() && item.managerEmployeeId === state.ownEmployee.id)
      || item.employeeAuthUid === state.user.uid
    )
  ))
);

export const loadRosters = async () => (
  [...rosters].reverse().filter(item => (
    isAdmin()
    || item.ownerUid === state.user.uid
  ))
);

export const loadRosterAssignments = async rosterId => (
  assignments.filter(item => item.rosterId === rosterId)
);

export const saveRosterDraft = async ({
  rosterId,
  startDate,
  employeeIds,
  selections,
  scopeManagerEmployeeId,
  onProgress
}) => {
  const id = rosterId || `DRAFT-1`;
  const existingRoster = rosters.find(item => item.id === id);
  const revision = Number(existingRoster?.revision || 0) + 1;
  const nextAssignments = [];
  employeeIds.forEach(employeeId => {
    Object.entries(selections[employeeId] || {}).forEach(([workDate, selection]) => {
      nextAssignments.push({
        ...assignment(
          `${id}-${employeeId}-${workDate}`,
          employeeId,
          workDate,
          selection.templateId,
          selection.locationId
        ),
        rosterId: id,
        rosterRevision: revision,
        status: `draft`,
        version: 0
      });
    });
  });
  onProgress?.(0, nextAssignments.length, {
    rosterId: id,
    revision
  });
  assignments = assignments.filter(item => item.rosterId !== id).concat(nextAssignments);
  rosters = rosters.filter(item => item.id !== id).concat({
    id,
    ownerUid: state.user.uid,
    managerEmployeeId: scopeManagerEmployeeId || state.ownEmployee.id,
    scopeKind: isAdmin() ? `hr` : `manager`,
    startDate,
    endDate: addDays(startDate, 6),
    status: `draft`,
    draftState: `ready`,
    draftToken: `draft-save-token-${revision}`,
    assignmentCount: nextAssignments.length,
    publishTotal: nextAssignments.length,
    publishCompleted: 0,
    publishToken: ``,
    publishConflictResult: ``,
    publishOverrideReason: ``,
    lastPublishedAssignmentId: ``,
    revision
  });
  onProgress?.(nextAssignments.length, nextAssignments.length, {
    rosterId: id,
    revision
  });
  return id;
};

export const publishRoster = async (
  rosterId,
  _overrideReason = ``,
  onProgress = null
) => {
  const roster = rosters.find(item => item.id === rosterId);
  const total = Number(roster?.assignmentCount || 0);
  const startingCompleted = roster?.status === `publishing`
    ? Number(roster.publishCompleted || 0)
    : 0;
  rosters = rosters.map(item => (
    item.id !== rosterId || item.status === `publishing`
      ? item
      : {
          ...item,
          status: `publishing`,
          publishTotal: total,
          publishCompleted: 0,
          publishToken: `publish-token`,
          publishConflictResult: `passed`
        }
  ));
  onProgress?.(startingCompleted, total);
  let completed = startingCompleted;
  assignments = assignments.map(item => {
    if (item.rosterId !== rosterId || item.status !== `draft`) return item;
    completed += 1;
    onProgress?.(completed, total);
    return { ...item, status: `published`, version: 2 };
  });
  const shouldInterrupt = new URLSearchParams(
    globalThis.location?.search || ``
  ).get(`interruptPublish`) === `1`;
  if (
    shouldInterrupt
    && !simulatedPublishInterruptDelivered
    && total > 1
  ) {
    simulatedPublishInterruptDelivered = true;
    const partialCompleted = Math.min(1, completed);
    let retainedPublished = 0;
    assignments = assignments.map(item => {
      if (
        item.rosterId !== rosterId
        || item.status !== `published`
        || retainedPublished < partialCompleted
      ) {
        if (item.rosterId === rosterId && item.status === `published`) {
          retainedPublished += 1;
        }
        return item;
      }
      return { ...item, status: `draft`, version: 0 };
    });
    rosters = rosters.map(item => (
      item.id === rosterId
        ? { ...item, publishCompleted: partialCompleted }
        : item
    ));
    throw new Error(`roster-publish-incomplete`);
  }
  rosters = rosters.map(item => (
    item.id === rosterId
      ? {
          ...item,
          status: `published`,
          publishCompleted: total,
          lastPublishedAssignmentId: assignments
            .filter(assignment => assignment.rosterId === rosterId)
            .at(-1)?.id || ``
        }
      : item
  ));
  return { assignments: total, conflicts: [] };
};

export const evaluateRosterConflicts = () => [];

export const publishPolicy = async () => state.policy;
export const saveShiftTemplate = async () => templates[0];
export const saveHoliday = async () => state.holidays[0];
export const confirmHolidayCalendar = async year => {
  state.settings.holidayCalendarYear = year;
  return state.settings;
};
export const activateShiftRequestServices = async () => {
  state.settings.requestServicesEnabled = true;
  return state.settings.requestTypeIds;
};
