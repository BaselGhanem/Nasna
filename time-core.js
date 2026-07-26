import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260727.1";
import { db } from "./firestore-config.js?v=20260727.1";

const release = `20260727.1`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const activeEmploymentStatuses = new Set([`active`, `probation`, `leave`]);
const maximumRosterAssignments = 140;

const state = {
  user: null,
  profile: null,
  companyId: ``,
  company: null,
  membership: null,
  ownEmployee: null,
  employees: [],
  members: [],
  locations: [],
  branches: [],
  settings: null,
  policy: null,
  templates: [],
  holidays: []
};

const companyCollection = name => collection(
  db,
  `nasna_companies`,
  state.companyId,
  name
);

const companyDoc = (name, id) => doc(
  db,
  `nasna_companies`,
  state.companyId,
  name,
  id
);

const snapshotRows = snapshot => snapshot.docs.map(item => ({
  id: item.id,
  ...item.data()
}));

const toDate = value => {
  if (!value) return null;
  if (typeof value.toDate === `function`) return value.toDate();
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
};

const pad = value => String(value).padStart(2, `0`);

const dateKey = value => {
  const date = toDate(value) || new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDateKey = value => {
  const match = String(value || ``).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const result = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    0,
    0,
    0,
    0
  );
  return Number.isNaN(result.getTime()) ? null : result;
};

const addDays = (value, amount) => {
  const result = parseDateKey(value) || toDate(value) || new Date();
  result.setDate(result.getDate() + Number(amount || 0));
  return dateKey(result);
};

const weekStart = value => {
  const result = parseDateKey(value) || toDate(value) || new Date();
  const configuredStart = Number(state.policy?.weekStartsOn ?? 1);
  const distance = (result.getDay() - configuredStart + 7) % 7;
  result.setDate(result.getDate() - distance);
  return dateKey(result);
};

const weekDates = value => {
  const start = weekStart(value);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
};

const timezoneParts = (value, timezone) => {
  try {
    const formatter = new Intl.DateTimeFormat(`en-CA-u-hc-h23`, {
      timeZone: timezone,
      year: `numeric`,
      month: `2-digit`,
      day: `2-digit`,
      hour: `2-digit`,
      minute: `2-digit`,
      hourCycle: `h23`
    });
    return Object.fromEntries(
      formatter.formatToParts(value)
        .filter(part => part.type !== `literal`)
        .map(part => [part.type, Number(part.value)])
    );
  } catch {
    return null;
  }
};

const zonedDateToUtc = (
  workDate,
  timeValue,
  timezone,
  dayOffset = 0
) => {
  const dateMatch = String(workDate || ``).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );
  const timeMatch = String(timeValue || ``).match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch || !timezone) return null;
  const targetDate = new Date(Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]) + Number(dayOffset || 0),
    Number(timeMatch[1]),
    Number(timeMatch[2])
  ));
  const target = {
    year: targetDate.getUTCFullYear(),
    month: targetDate.getUTCMonth() + 1,
    day: targetDate.getUTCDate(),
    hour: targetDate.getUTCHours(),
    minute: targetDate.getUTCMinutes()
  };
  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute
  );
  let guess = targetAsUtc;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = timezoneParts(new Date(guess), timezone);
    if (!parts) return null;
    const renderedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute
    );
    const correction = targetAsUtc - renderedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }
  const finalParts = timezoneParts(new Date(guess), timezone);
  if (
    !finalParts
    || finalParts.year !== target.year
    || finalParts.month !== target.month
    || finalParts.day !== target.day
    || finalParts.hour !== target.hour
    || finalParts.minute !== target.minute
  ) {
    return null;
  }
  return new Date(guess);
};

const isAdmin = () => adminRoles.has(state.membership?.role);

const isManager = () => Boolean(
  state.membership?.role === `manager`
  || state.membership?.isManager
  || state.employees.some(employee => (
    employee.managerEmployeeId === state.ownEmployee?.id
    && activeEmploymentStatuses.has(employee.employmentStatus)
  ))
);

const directReports = () => state.ownEmployee
  ? state.employees.filter(employee => (
      employee.managerEmployeeId === state.ownEmployee.id
      && activeEmploymentStatuses.has(employee.employmentStatus)
    ))
  : [];

const activeEmployees = () => state.employees.filter(employee => (
  activeEmploymentStatuses.has(employee.employmentStatus)
  && employee.accessStatus === `active`
));

const employeeById = id => (
  state.employees.find(employee => employee.id === id) || null
);

const templateById = id => (
  state.templates.find(template => template.id === id) || null
);

const locationById = id => (
  state.locations.find(location => location.id === id) || null
);

const auditRecord = (action, targetId, details = {}) => ({
  companyId: state.companyId,
  actorId: state.user.uid,
  actorEmail: state.user.email || ``,
  action,
  targetId,
  details,
  createdAt: serverTimestamp()
});

const loadTimeSession = async user => {
  const profileSnapshot = await getDoc(doc(db, `nasna_users`, user.uid));
  if (!profileSnapshot.exists()) throw new Error(`profile-missing`);
  const profile = profileSnapshot.data();
  if (profile.status !== `active` || !profile.activeCompanyId) {
    throw new Error(`access-disabled`);
  }

  const companyId = profile.activeCompanyId;
  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(doc(db, `nasna_companies`, companyId)),
    getDoc(doc(db, `nasna_companies`, companyId, `members`, user.uid))
  ]);
  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw new Error(`membership-missing`);
  }
  const membership = membershipSnapshot.data();
  if (membership.status !== `active`) throw new Error(`access-disabled`);

  state.user = user;
  state.profile = profile;
  state.companyId = companyId;
  state.company = companySnapshot.data();
  state.membership = membership;

  const [
    employeesSnapshot,
    membersSnapshot,
    locationsSnapshot,
    branchesSnapshot,
    settingsSnapshot,
    templatesSnapshot,
    holidaysSnapshot
  ] = await Promise.all([
    getDocs(query(companyCollection(`employees`), limit(500))),
    getDocs(query(companyCollection(`members`), limit(500))),
    getDocs(query(companyCollection(`locations`), limit(300))),
    getDocs(query(companyCollection(`branches`), limit(100))),
    getDoc(companyDoc(`timeSettings`, `current`)),
    getDocs(query(companyCollection(`shiftTemplates`), limit(200))),
    getDocs(query(companyCollection(`holidays`), limit(500)))
  ]);

  state.employees = snapshotRows(employeesSnapshot);
  state.members = snapshotRows(membersSnapshot);
  state.locations = snapshotRows(locationsSnapshot)
    .filter(item => item.status === `active`);
  state.branches = snapshotRows(branchesSnapshot)
    .filter(item => item.status === `active`);
  state.settings = settingsSnapshot.exists() ? settingsSnapshot.data() : null;
  state.templates = snapshotRows(templatesSnapshot)
    .sort((left, right) => left.code.localeCompare(right.code));
  state.holidays = snapshotRows(holidaysSnapshot)
    .sort((left, right) => left.date.localeCompare(right.date));
  state.ownEmployee = state.employees.find(employee => (
    employee.authUid === user.uid
    || employee.id === membership.employeeId
  )) || null;

  if (state.settings?.activePolicyId) {
    const policySnapshot = await getDoc(
      companyDoc(`timePolicies`, state.settings.activePolicyId)
    );
    state.policy = policySnapshot.exists() ? policySnapshot.data() : null;
  } else {
    state.policy = null;
  }
  return state;
};

const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ``));

const timeMinutes = value => {
  if (!validTime(value)) return null;
  const [hours, minutes] = value.split(`:`).map(Number);
  return hours * 60 + minutes;
};

const segmentDuration = segment => {
  const start = timeMinutes(segment.startTime);
  const end = timeMinutes(segment.endTime);
  if (start === null || end === null) return -1;
  const elapsed = end > start ? end - start : 1440 - start + end;
  return elapsed - Number(segment.breakMinutes || 0);
};

const normalizePolicy = input => {
  const timezone = String(input.timezone || `Asia/Amman`).trim();
  const workdayStart = String(input.workdayStart || `09:00`);
  const workdayEnd = String(input.workdayEnd || `17:00`);
  const workingDays = [...new Set(
    (Array.isArray(input.workingDays) ? input.workingDays : [])
      .map(Number)
      .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
  )].sort();
  const dailyMinutes = Number(input.dailyMinutes || 480);
  const maxDailyMinutes = Number(input.maxDailyMinutes || 720);
  const maxWeeklyMinutes = Number(input.maxWeeklyMinutes || 2880);
  const minRestMinutes = Number(input.minRestMinutes || 660);
  const effectiveFrom = String(input.effectiveFrom || dateKey(new Date()));
  const conflictMode = input.conflictMode === `warn` ? `warn` : `block`;
  const holidayWorkMode = input.holidayWorkMode === `warn` ? `warn` : `block`;

  if (
    !timezone
    || timezone.length > 80
    || !timezoneParts(new Date(), timezone)
    || !validTime(workdayStart)
    || !validTime(workdayEnd)
    || timeMinutes(workdayEnd) <= timeMinutes(workdayStart)
    || !workingDays.length
    || dailyMinutes < 60
    || dailyMinutes > 1440
    || maxDailyMinutes < dailyMinutes
    || maxDailyMinutes > 1440
    || maxWeeklyMinutes < maxDailyMinutes
    || maxWeeklyMinutes > 10080
    || minRestMinutes < 0
    || minRestMinutes > 1440
    || !parseDateKey(effectiveFrom)
  ) {
    throw new Error(`policy-invalid`);
  }

  return {
    timezone,
    weekStartsOn: Number(input.weekStartsOn ?? 1),
    workingDays,
    workdayStart,
    workdayEnd,
    dailyMinutes,
    maxDailyMinutes,
    maxWeeklyMinutes,
    minRestMinutes,
    conflictMode,
    holidayWorkMode,
    effectiveFrom
  };
};

const publishPolicy = async input => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const normalized = normalizePolicy(input);
  const settingsReference = companyDoc(`timeSettings`, `current`);
  const auditId = crypto.randomUUID();
  let newPolicy = null;

  await runTransaction(db, async transaction => {
    const settingsSnapshot = await transaction.get(settingsReference);
    const settings = settingsSnapshot.exists() ? settingsSnapshot.data() : null;
    const version = Number(settings?.policyVersion || 0) + 1;
    const policyId = `POLICY-V${version}-${crypto.randomUUID().slice(0, 8)}`;
    const policyReference = companyDoc(`timePolicies`, policyId);
    const record = {
      id: policyId,
      companyId: state.companyId,
      version,
      ...normalized,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    };
    transaction.set(policyReference, record);
    transaction.set(settingsReference, {
      id: `current`,
      companyId: state.companyId,
      activePolicyId: policyId,
      policyVersion: version,
      holidayCalendarYear: Number(settings?.holidayCalendarYear || 0),
      holidayCalendarConfirmedAt: settings?.holidayCalendarConfirmedAt || null,
      requestServicesEnabled: Boolean(settings?.requestServicesEnabled),
      requestTypeIds: Array.isArray(settings?.requestTypeIds)
        ? settings.requestTypeIds
        : [],
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      ...(settingsSnapshot.exists()
        ? {
            createdAt: settings.createdAt,
            createdBy: settings.createdBy
          }
        : {
            createdAt: serverTimestamp(),
            createdBy: state.user.uid
          })
    });
    transaction.set(
      companyDoc(`auditLogs`, auditId),
      auditRecord(`time_policy.published`, policyId, { version })
    );
    newPolicy = { ...record, createdAt: new Date(), updatedAt: new Date() };
  });

  state.policy = newPolicy;
  const settingsSnapshot = await getDoc(settingsReference);
  state.settings = settingsSnapshot.data();
  return newPolicy;
};

const normalizeTemplate = input => {
  const code = String(input.code || ``)
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9-]/g, `-`)
    .replaceAll(/-+/g, `-`)
    .replaceAll(/^-|-$/g, ``);
  const nameEn = String(input.nameEn || ``).trim();
  const nameAr = String(input.nameAr || ``).trim();
  const kind = [`standard`, `flexible`, `split`].includes(input.kind)
    ? input.kind
    : `standard`;
  const flexWindowMinutes = kind === `flexible`
    ? Number(input.flexWindowMinutes || 60)
    : 0;
  const inputSegments = Array.isArray(input.segments) ? input.segments : [];
  const requiredSegments = kind === `split` ? 2 : 1;
  const segments = inputSegments.slice(0, requiredSegments).map(segment => ({
    startTime: String(segment.startTime || ``),
    endTime: String(segment.endTime || ``),
    breakMinutes: Number(segment.breakMinutes || 0)
  }));

  if (
    !code.match(/^[A-Z0-9][A-Z0-9-]{1,19}$/)
    || !nameEn
    || !nameAr
    || nameEn.length > 100
    || nameAr.length > 100
    || segments.length !== requiredSegments
    || segments.some(segment => (
      !validTime(segment.startTime)
      || !validTime(segment.endTime)
      || segment.breakMinutes < 0
      || segment.breakMinutes > 240
      || segmentDuration(segment) <= 0
    ))
    || flexWindowMinutes < 0
    || flexWindowMinutes > 240
  ) {
    throw new Error(`template-invalid`);
  }

  const ordered = segments.map(segment => ({
    ...segment,
    start: timeMinutes(segment.startTime),
    end: timeMinutes(segment.endTime) <= timeMinutes(segment.startTime)
      ? timeMinutes(segment.endTime) + 1440
      : timeMinutes(segment.endTime)
  })).sort((left, right) => left.start - right.start);
  if (
    ordered.length === 2
    && ordered[0].end > ordered[1].start
  ) {
    throw new Error(`template-overlap`);
  }
  const totalMinutes = segments.reduce(
    (total, segment) => total + segmentDuration(segment),
    0
  );
  if (totalMinutes > Number(state.policy?.maxDailyMinutes || 1440)) {
    throw new Error(`template-daily-limit`);
  }

  return {
    code,
    nameEn,
    nameAr,
    kind,
    flexWindowMinutes,
    segments,
    totalMinutes,
    status: input.status === `inactive` ? `inactive` : `active`
  };
};

const saveShiftTemplate = async (input, existingId = ``) => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const normalized = normalizeTemplate(input);
  const id = existingId || normalized.code;
  const reference = companyDoc(`shiftTemplates`, id);
  const existingSnapshot = await getDoc(reference);
  if (
    existingSnapshot.exists()
    && existingSnapshot.data().code !== normalized.code
  ) {
    throw new Error(`template-code-immutable`);
  }
  if (!existingId && existingSnapshot.exists()) {
    throw new Error(`template-duplicate`);
  }
  const batch = writeBatch(db);
  const action = existingSnapshot.exists()
    ? `shift_template.updated`
    : `shift_template.created`;
  const common = {
    id,
    companyId: state.companyId,
    ...normalized,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  };
  if (existingSnapshot.exists()) {
    batch.update(reference, common);
  } else {
    batch.set(reference, {
      ...common,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
  }
  batch.set(
    companyDoc(`auditLogs`, crypto.randomUUID()),
    auditRecord(action, id, { kind: normalized.kind })
  );
  await batch.commit();
  const refreshed = await getDoc(reference);
  const record = { id: refreshed.id, ...refreshed.data() };
  state.templates = state.templates
    .filter(template => template.id !== id)
    .concat(record)
    .sort((left, right) => left.code.localeCompare(right.code));
  return record;
};

const normalizeHoliday = input => {
  const date = String(input.date || ``);
  const nameEn = String(input.nameEn || ``).trim();
  const nameAr = String(input.nameAr || ``).trim();
  const branchId = String(input.branchId || ``).trim();
  if (
    !parseDateKey(date)
    || !nameEn
    || !nameAr
    || nameEn.length > 120
    || nameAr.length > 120
    || (branchId && !state.branches.some(branch => branch.id === branchId))
  ) {
    throw new Error(`holiday-invalid`);
  }
  return {
    date,
    year: Number(date.slice(0, 4)),
    nameEn,
    nameAr,
    branchId,
    paid: input.paid !== false,
    status: input.status === `inactive` ? `inactive` : `active`
  };
};

const saveHoliday = async (input, existingId = ``) => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const normalized = normalizeHoliday(input);
  const id = existingId || `HOL-${normalized.date}-${crypto.randomUUID().slice(0, 8)}`;
  const reference = companyDoc(`holidays`, id);
  const existingSnapshot = await getDoc(reference);
  const batch = writeBatch(db);
  const action = existingSnapshot.exists()
    ? `holiday.updated`
    : `holiday.created`;
  const common = {
    id,
    companyId: state.companyId,
    ...normalized,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  };
  if (existingSnapshot.exists()) {
    batch.update(reference, common);
  } else {
    batch.set(reference, {
      ...common,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
  }
  batch.set(
    companyDoc(`auditLogs`, crypto.randomUUID()),
    auditRecord(action, id, { date: normalized.date })
  );
  await batch.commit();
  const refreshed = await getDoc(reference);
  const record = { id: refreshed.id, ...refreshed.data() };
  state.holidays = state.holidays
    .filter(holiday => holiday.id !== id)
    .concat(record)
    .sort((left, right) => left.date.localeCompare(right.date));
  return record;
};

const confirmHolidayCalendar = async year => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  if (!state.settings?.activePolicyId) throw new Error(`policy-required`);
  const normalizedYear = Number(year);
  if (
    !Number.isInteger(normalizedYear)
    || normalizedYear < 2020
    || normalizedYear > 2100
  ) {
    throw new Error(`holiday-year-invalid`);
  }
  const settingsReference = companyDoc(`timeSettings`, `current`);
  const batch = writeBatch(db);
  batch.update(settingsReference, {
    holidayCalendarYear: normalizedYear,
    holidayCalendarConfirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  batch.set(
    companyDoc(`auditLogs`, crypto.randomUUID()),
    auditRecord(`holiday_calendar.confirmed`, `current`, {
      year: normalizedYear
    })
  );
  await batch.commit();
  state.settings = (await getDoc(settingsReference)).data();
  return state.settings;
};

const localTimestamp = (workDate, timeValue, dayOffset = 0) => {
  const date = zonedDateToUtc(
    workDate,
    timeValue,
    state.policy?.timezone || `Asia/Amman`,
    dayOffset
  );
  return date ? Timestamp.fromDate(date) : null;
};

const assignmentSegments = (workDate, template, locationId) => {
  const records = template.segments.map(segment => {
    const startMinutes = timeMinutes(segment.startTime);
    const endMinutes = timeMinutes(segment.endTime);
    return {
      shiftTemplateId: template.id,
      startAt: localTimestamp(workDate, segment.startTime),
      endAt: localTimestamp(
        workDate,
        segment.endTime,
        endMinutes <= startMinutes ? 1 : 0
      ),
      breakMinutes: Number(segment.breakMinutes || 0),
      locationId
    };
  });
  if (records.some(record => !record.startAt || !record.endAt)) {
    throw new Error(`schedule-time-invalid`);
  }
  return records;
};

const rosterEntryId = (rosterId, employeeId, workDate) => (
  `${rosterId}__${employeeId}__${workDate}`
    .replaceAll(/[^A-Za-z0-9_-]/g, `-`)
    .slice(0, 180)
);

const lockId = (employeeId, workDate) => (
  `${employeeId}__${workDate}`.replaceAll(/[^A-Za-z0-9_-]/g, `-`)
);

const loadRosterAssignments = async rosterId => {
  if (!rosterId) return [];
  const snapshot = await getDocs(query(
    companyCollection(`shiftAssignments`),
    where(`rosterId`, `==`, rosterId),
    limit(maximumRosterAssignments + 1)
  ));
  const records = snapshotRows(snapshot);
  if (records.length > maximumRosterAssignments) {
    throw new Error(`roster-size-limit`);
  }
  return records;
};

const loadScheduleRange = async (
  startDate,
  endDate,
  { includeDrafts = false } = {}
) => {
  const statuses = includeDrafts
    ? [`draft`, `published`]
    : [`published`];
  let source;
  if (isAdmin()) {
    source = query(
      companyCollection(`shiftAssignments`),
      where(`workDate`, `>=`, startDate),
      where(`workDate`, `<=`, endDate),
      orderBy(`workDate`),
      limit(500)
    );
  } else if (isManager() && includeDrafts) {
    source = query(
      companyCollection(`shiftAssignments`),
      where(`managerEmployeeId`, `==`, state.ownEmployee.id),
      where(`workDate`, `>=`, startDate),
      where(`workDate`, `<=`, endDate),
      orderBy(`workDate`),
      limit(500)
    );
  } else {
    source = query(
      companyCollection(`shiftAssignments`),
      where(`employeeAuthUid`, `==`, state.user.uid),
      where(`status`, `==`, `published`),
      where(`workDate`, `>=`, startDate),
      where(`workDate`, `<=`, endDate),
      orderBy(`workDate`),
      limit(100)
    );
  }
  const snapshot = await getDocs(source);
  return snapshotRows(snapshot).filter(record => statuses.includes(record.status));
};

const loadRosters = async (startDate = ``, endDate = ``) => {
  if (!isAdmin() && !isManager()) return [];
  let source;
  if (isAdmin()) {
    source = query(
      companyCollection(`rosters`),
      orderBy(`updatedAt`, `desc`),
      limit(100)
    );
  } else {
    source = query(
      companyCollection(`rosters`),
      where(`ownerUid`, `==`, state.user.uid),
      orderBy(`updatedAt`, `desc`),
      limit(100)
    );
  }
  const snapshot = await getDocs(source);
  return snapshotRows(snapshot).filter(roster => (
    (!startDate || roster.endDate >= startDate)
    && (!endDate || roster.startDate <= endDate)
  ));
};

const saveRosterDraft = async ({
  rosterId = ``,
  startDate,
  employeeIds,
  selections,
  scopeManagerEmployeeId = ``,
  onProgress = null
}) => {
  if (!isAdmin() && !isManager()) throw new Error(`permission-denied`);
  if (!state.policy) throw new Error(`policy-required`);
  const normalizedStart = weekStart(startDate);
  const normalizedEnd = addDays(normalizedStart, 6);
  const allowedEmployees = isAdmin() ? activeEmployees() : directReports();
  const allowedIds = new Set(allowedEmployees.map(employee => employee.id));
  const selectedEmployees = [...new Set(employeeIds)]
    .map(employeeById)
    .filter(employee => employee && allowedIds.has(employee.id));
  if (!selectedEmployees.length) throw new Error(`roster-employees-required`);

  const entries = [];
  selectedEmployees.forEach(employee => {
    weekDates(normalizedStart).forEach(workDate => {
      const selection = selections?.[employee.id]?.[workDate];
      if (!selection?.templateId) return;
      const template = templateById(selection.templateId);
      const location = locationById(selection.locationId || employee.locationId);
      if (!template || template.status !== `active`) {
        throw new Error(`template-inactive`);
      }
      if (!location) throw new Error(`location-invalid`);
      entries.push({
        employee,
        workDate,
        template,
        locationId: location.id
      });
    });
  });
  if (!entries.length) throw new Error(`roster-assignments-required`);
  if (entries.length > maximumRosterAssignments) {
    throw new Error(`roster-size-limit`);
  }

  const id = rosterId || crypto.randomUUID();
  const rosterReference = companyDoc(`rosters`, id);
  const existingSnapshot = rosterId ? await getDoc(rosterReference) : null;
  if (existingSnapshot?.exists() && existingSnapshot.data().status !== `draft`) {
    throw new Error(`roster-immutable`);
  }
  const existingAssignments = existingSnapshot?.exists()
    ? await loadRosterAssignments(id)
    : [];
  const draftToken = crypto.randomUUID();
  const draftRevision = await runTransaction(db, async transaction => {
    const liveRoster = await transaction.get(rosterReference);
    if (
      liveRoster.exists()
      && (
        !existingSnapshot?.exists()
        || liveRoster.data().status !== `draft`
      )
    ) {
      throw new Error(`roster-changed`);
    }
    if (
      liveRoster.exists()
      && (
        liveRoster.data().ownerUid !== state.user.uid
        || liveRoster.data().startDate !== normalizedStart
        || liveRoster.data().endDate !== normalizedEnd
      )
    ) {
      throw new Error(`roster-changed`);
    }
    const revision = Number(liveRoster.data()?.revision || 0) + 1;
    const commonRoster = {
      id,
      companyId: state.companyId,
      ownerUid: state.user.uid,
      managerEmployeeId: isAdmin()
        ? String(scopeManagerEmployeeId || ``)
        : state.ownEmployee.id,
      scopeKind: isAdmin() ? `hr` : `manager`,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      timezone: state.policy.timezone,
      policyId: state.policy.id,
      status: `draft`,
      revision,
      assignmentCount: entries.length,
      draftState: `saving`,
      draftToken,
      publishTotal: entries.length,
      publishCompleted: 0,
      publishToken: ``,
      publishConflictResult: ``,
      publishOverrideReason: ``,
      lastPublishedAssignmentId: ``,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    };
    if (liveRoster.exists()) {
      transaction.update(rosterReference, commonRoster);
    } else {
      transaction.set(rosterReference, {
        ...commonRoster,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid,
        publishedAt: null,
        publishedBy: ``
      });
    }
    return revision;
  });
  if (typeof onProgress === `function`) {
    onProgress(0, entries.length, {
      rosterId: id,
      revision: draftRevision
    });
  }

  const entriesByEmployee = new Map();
  entries.forEach(entry => {
    if (!entriesByEmployee.has(entry.employee.id)) {
      entriesByEmployee.set(entry.employee.id, []);
    }
    entriesByEmployee.get(entry.employee.id).push(entry);
  });
  const employeeGroups = new Set([
    ...entriesByEmployee.keys(),
    ...existingAssignments
      .filter(assignment => assignment.status === `draft`)
      .map(assignment => assignment.employeeId)
  ]);
  let savedAssignments = 0;

  for (const employeeId of employeeGroups) {
    const employeeEntries = entriesByEmployee.get(employeeId) || [];
    const expectedIds = new Set(employeeEntries.map(entry => (
      rosterEntryId(id, entry.employee.id, entry.workDate)
    )));
    const batch = writeBatch(db);
    existingAssignments
      .filter(assignment => (
        assignment.status === `draft`
        && assignment.employeeId === employeeId
        && !expectedIds.has(assignment.id)
      ))
      .forEach(assignment => {
        batch.delete(companyDoc(`shiftAssignments`, assignment.id));
      });

    employeeEntries.forEach(({
      employee,
      workDate,
      template,
      locationId
    }) => {
      const assignmentId = rosterEntryId(id, employee.id, workDate);
      const existing = existingAssignments.find(
        item => item.id === assignmentId
      );
      const common = {
        id: assignmentId,
        companyId: state.companyId,
        rosterId: id,
        rosterRevision: draftRevision,
        employeeId: employee.id,
        employeeAuthUid: employee.authUid,
        managerEmployeeId: employee.managerEmployeeId || ``,
        branchId: employee.branchId,
        locationId,
        workDate,
        templateId: template.id,
        templateKind: template.kind,
        flexWindowMinutes: Number(template.flexWindowMinutes || 0),
        segments: assignmentSegments(workDate, template, locationId),
        totalMinutes: template.totalMinutes,
        status: `draft`,
        version: 0,
        previousAssignmentId: ``,
        supersededBy: ``,
        sourceRequestId: ``,
        conflictCheck: {
          policyId: state.policy.id,
          result: `pending`,
          reason: ``
        },
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      if (existing) {
        batch.update(companyDoc(`shiftAssignments`, assignmentId), common);
      } else {
        batch.set(companyDoc(`shiftAssignments`, assignmentId), {
          ...common,
          createdAt: serverTimestamp(),
          createdBy: state.user.uid,
          publishedAt: null,
          publishedBy: ``
        });
      }
    });
    await batch.commit();
    savedAssignments += employeeEntries.length;
    if (typeof onProgress === `function`) {
      onProgress(savedAssignments, entries.length, {
        rosterId: id,
        revision: draftRevision
      });
    }
  }

  const auditId = crypto.randomUUID();
  await runTransaction(db, async transaction => {
    const liveRoster = await transaction.get(rosterReference);
    if (
      !liveRoster.exists()
      || liveRoster.data().status !== `draft`
      || liveRoster.data().draftState !== `saving`
      || liveRoster.data().draftToken !== draftToken
      || Number(liveRoster.data().revision || 0) !== draftRevision
    ) {
      throw new Error(`roster-changed`);
    }
    transaction.update(rosterReference, {
      draftState: `ready`,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    transaction.set(
      companyDoc(`auditLogs`, auditId),
      auditRecord(`roster.updated`, id, {
        startDate: normalizedStart,
        assignmentCount: entries.length,
        revision: draftRevision,
        draftState: `ready`
      })
    );
  });
  return id;
};

const activeHoliday = (workDate, branchId) => state.holidays.find(holiday => (
  holiday.status === `active`
  && holiday.date === workDate
  && (!holiday.branchId || holiday.branchId === branchId)
));

const assignmentBounds = assignment => {
  const segments = Array.isArray(assignment.segments)
    ? assignment.segments
    : [];
  const starts = segments.map(segment => toDate(segment.startAt)).filter(Boolean);
  const ends = segments.map(segment => toDate(segment.endAt)).filter(Boolean);
  return {
    start: starts.sort((left, right) => left - right)[0] || null,
    end: ends.sort((left, right) => right - left)[0] || null
  };
};

const evaluateRosterConflicts = (
  draftAssignments,
  publishedAssignments
) => {
  const conflicts = [];
  const replacementKeys = new Set(draftAssignments.map(assignment => (
    `${assignment.employeeId}__${assignment.workDate}`
  )));
  const effectivePublished = publishedAssignments.filter(assignment => (
    !replacementKeys.has(`${assignment.employeeId}__${assignment.workDate}`)
  ));
  const byEmployee = new Map();
  [...effectivePublished, ...draftAssignments].forEach(assignment => {
    if (!byEmployee.has(assignment.employeeId)) {
      byEmployee.set(assignment.employeeId, []);
    }
    byEmployee.get(assignment.employeeId).push(assignment);
  });

  draftAssignments.forEach(assignment => {
    const holiday = activeHoliday(assignment.workDate, assignment.branchId);
    if (holiday) {
      conflicts.push({
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        code: `holiday`,
        severity: state.policy.holidayWorkMode,
        detail: holiday.nameEn
      });
    }
    if (Number(assignment.totalMinutes || 0) > state.policy.maxDailyMinutes) {
      conflicts.push({
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        code: `daily_limit`,
        severity: `block`,
        detail: String(assignment.totalMinutes)
      });
    }

    const employeeAssignments = byEmployee.get(assignment.employeeId) || [];
    const bounds = assignmentBounds(assignment);
    const previous = employeeAssignments
      .filter(item => (
        item.id !== assignment.id
        && item.workDate < assignment.workDate
      ))
      .sort((left, right) => right.workDate.localeCompare(left.workDate))[0];
    const next = employeeAssignments
      .filter(item => (
        item.id !== assignment.id
        && item.workDate > assignment.workDate
      ))
      .sort((left, right) => left.workDate.localeCompare(right.workDate))[0];
    const previousEnd = assignmentBounds(previous || {}).end;
    const nextStart = assignmentBounds(next || {}).start;
    if (
      previousEnd
      && bounds.start
      && (bounds.start - previousEnd) / 60000 < state.policy.minRestMinutes
    ) {
      conflicts.push({
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        code: `minimum_rest`,
        severity: state.policy.conflictMode,
        detail: previous.id
      });
    }
    if (
      nextStart
      && bounds.end
      && (nextStart - bounds.end) / 60000 < state.policy.minRestMinutes
    ) {
      conflicts.push({
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        code: `minimum_rest`,
        severity: state.policy.conflictMode,
        detail: next.id
      });
    }
  });

  byEmployee.forEach((assignments, employeeId) => {
    const draftWeeks = new Set(
      draftAssignments
        .filter(item => item.employeeId === employeeId)
        .map(item => weekStart(item.workDate))
    );
    draftWeeks.forEach(draftWeek => {
      const weeklyMinutes = assignments
        .filter(item => (
          item.status === `published`
          && weekStart(item.workDate) === draftWeek
        ))
        .reduce(
          (total, item) => total + Number(item.totalMinutes || 0),
          0
        );
      const weekDrafts = draftAssignments.filter(item => (
        item.employeeId === employeeId
        && weekStart(item.workDate) === draftWeek
      ));
      const draftMinutes = weekDrafts.reduce(
        (total, item) => total + Number(item.totalMinutes || 0),
        0
      );
      if (weeklyMinutes + draftMinutes > state.policy.maxWeeklyMinutes) {
        weekDrafts.forEach(item => conflicts.push({
          assignmentId: item.id,
          employeeId,
          code: `weekly_limit`,
          severity: `block`,
          detail: String(weeklyMinutes + draftMinutes)
        }));
      }
    });
  });

  return conflicts;
};

const publishRoster = async (
  rosterId,
  overrideReason = ``,
  onProgress = null
) => {
  if (!isAdmin() && !isManager()) throw new Error(`permission-denied`);
  if (!state.policy) throw new Error(`policy-required`);
  const rosterReference = companyDoc(`rosters`, rosterId);
  const [rosterSnapshot, rosterAssignments] = await Promise.all([
    getDoc(rosterReference),
    loadRosterAssignments(rosterId)
  ]);
  if (
    !rosterSnapshot.exists()
    || ![`draft`, `publishing`].includes(rosterSnapshot.data().status)
  ) {
    throw new Error(`roster-immutable`);
  }
  const rosterRevision = Number(rosterSnapshot.data().revision || 0);
  const currentAssignments = rosterAssignments.filter(item => (
    Number(item.rosterRevision || 0) === rosterRevision
  ));
  const publishable = currentAssignments
    .filter(item => item.status === `draft`)
    .sort((left, right) => (
      left.workDate.localeCompare(right.workDate)
      || left.employeeId.localeCompare(right.employeeId)
    ));
  if (
    rosterAssignments.length > maximumRosterAssignments
    || Number(rosterSnapshot.data().assignmentCount || 0)
      > maximumRosterAssignments
  ) {
    throw new Error(`roster-size-limit`);
  }
  if (
    rosterSnapshot.data().status === `draft`
    && (
      rosterSnapshot.data().draftState !== `ready`
      || currentAssignments.length
        !== Number(rosterSnapshot.data().assignmentCount || 0)
      || publishable.length !== currentAssignments.length
    )
  ) {
    throw new Error(`roster-save-incomplete`);
  }
  if (
    rosterSnapshot.data().status === `draft`
    && rosterSnapshot.data().policyId !== state.policy.id
  ) {
    throw new Error(`roster-policy-changed`);
  }
  let conflicts = [];
  let warnings = [];
  const normalizedOverride = String(overrideReason || ``).trim();
  let publishToken = String(rosterSnapshot.data().publishToken || ``);
  let conflictResult = rosterSnapshot.data().publishConflictResult || ``;
  let conflictReason = rosterSnapshot.data().publishOverrideReason || ``;
  if (rosterSnapshot.data().status === `draft`) {
    const rangeStart = addDays(rosterSnapshot.data().startDate, -1);
    const rangeEnd = addDays(rosterSnapshot.data().endDate, 1);
    const published = await loadScheduleRange(rangeStart, rangeEnd, {
      includeDrafts: true
    });
    conflicts = evaluateRosterConflicts(
      publishable,
      published.filter(item => item.status === `published`)
    );
    const blocking = conflicts.filter(
      conflict => conflict.severity === `block`
    );
    warnings = conflicts.filter(conflict => conflict.severity === `warn`);
    if (blocking.length) {
      const error = new Error(`roster-conflict-blocked`);
      error.conflicts = conflicts;
      throw error;
    }
    if (
      warnings.length
      && (!isAdmin() || normalizedOverride.length < 8)
    ) {
      const error = new Error(`roster-conflict-override-required`);
      error.conflicts = conflicts;
      throw error;
    }
    publishToken = crypto.randomUUID();
    conflictResult = warnings.length ? `override` : `passed`;
    conflictReason = warnings.length ? normalizedOverride : ``;
    await runTransaction(db, async transaction => {
      const liveRoster = await transaction.get(rosterReference);
      if (!liveRoster.exists() || liveRoster.data().status !== `draft`) {
        throw new Error(`roster-changed`);
      }
      transaction.update(rosterReference, {
        status: `publishing`,
        publishTotal: Number(liveRoster.data().assignmentCount || 0),
        publishCompleted: 0,
        publishToken,
        publishConflictResult: conflictResult,
        publishOverrideReason: conflictReason,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    if (typeof onProgress === `function`) {
      onProgress(0, Number(rosterSnapshot.data().assignmentCount || 0));
    }
  } else {
    if (!publishToken || ![`passed`, `override`].includes(conflictResult)) {
      throw new Error(`roster-changed`);
    }
    if (typeof onProgress === `function`) {
      onProgress(
        Number(rosterSnapshot.data().publishCompleted || 0),
        Number(rosterSnapshot.data().publishTotal || 0)
      );
    }
  }

  for (const candidate of publishable) {
    const assignmentReference = companyDoc(
      `shiftAssignments`,
      candidate.id
    );
    const lockReference = companyDoc(
      `scheduleLocks`,
      lockId(candidate.employeeId, candidate.workDate)
    );
    const completed = await runTransaction(db, async transaction => {
      const [liveRoster, liveAssignment, lockSnapshot] = await Promise.all([
        transaction.get(rosterReference),
        transaction.get(assignmentReference),
        transaction.get(lockReference)
      ]);
      if (
        !liveRoster.exists()
        || liveRoster.data().status !== `publishing`
        || liveRoster.data().publishToken !== publishToken
      ) {
        throw new Error(`roster-changed`);
      }
      if (!liveAssignment.exists()) throw new Error(`roster-changed`);
      if (liveAssignment.data().status === `published`) {
        return Number(liveRoster.data().publishCompleted || 0);
      }
      if (liveAssignment.data().status !== `draft`) {
        throw new Error(`roster-changed`);
      }
      if (
        Number(liveAssignment.data().rosterRevision || 0)
          !== Number(liveRoster.data().revision || 0)
      ) {
        throw new Error(`roster-changed`);
      }
      const previousReference = (
        lockSnapshot.exists()
        && lockSnapshot.data().currentAssignmentId
      )
        ? companyDoc(
            `shiftAssignments`,
            lockSnapshot.data().currentAssignmentId
          )
        : null;
      const previousSnapshot = previousReference
        ? await transaction.get(previousReference)
        : null;
      const assignment = liveAssignment.data();
      const nextVersion = Number(
        lockSnapshot.exists() ? lockSnapshot.data().version : 0
      ) + 1;
      const previousAssignmentId = previousSnapshot?.exists()
        ? previousSnapshot.id
        : ``;
      if (
        previousSnapshot?.exists()
        && previousSnapshot.data().status === `published`
      ) {
        transaction.update(previousReference, {
          status: `superseded`,
          supersededBy: assignment.id,
          updatedAt: serverTimestamp(),
          updatedBy: state.user.uid
        });
      }
      transaction.update(assignmentReference, {
        status: `published`,
        version: nextVersion,
        previousAssignmentId,
        conflictCheck: {
          policyId: liveRoster.data().policyId,
          result: conflictResult,
          reason: conflictReason
        },
        publishedAt: serverTimestamp(),
        publishedBy: state.user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      transaction.set(lockReference, {
        id: lockReference.id,
        companyId: state.companyId,
        employeeId: assignment.employeeId,
        employeeAuthUid: assignment.employeeAuthUid,
        managerEmployeeId: assignment.managerEmployeeId,
        workDate: assignment.workDate,
        currentAssignmentId: assignment.id,
        version: nextVersion,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      transaction.update(rosterReference, {
        publishCompleted: Number(
          liveRoster.data().publishCompleted || 0
        ) + 1,
        lastPublishedAssignmentId: assignment.id,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      return Number(liveRoster.data().publishCompleted || 0) + 1;
    });
    if (typeof onProgress === `function`) {
      onProgress(
        completed,
        Number(rosterSnapshot.data().assignmentCount || 0)
      );
    }
  }

  const auditId = crypto.randomUUID();
  await runTransaction(db, async transaction => {
    const liveRoster = await transaction.get(rosterReference);
    if (
      liveRoster.exists()
      && liveRoster.data().status === `published`
      && liveRoster.data().publishToken === publishToken
      && Number(liveRoster.data().publishCompleted || 0)
        === Number(liveRoster.data().publishTotal || 0)
    ) {
      return;
    }
    if (
      !liveRoster.exists()
      || liveRoster.data().status !== `publishing`
      || liveRoster.data().publishToken !== publishToken
      || Number(liveRoster.data().publishCompleted || 0)
        !== Number(liveRoster.data().publishTotal || 0)
    ) {
      throw new Error(`roster-publish-incomplete`);
    }
    transaction.update(rosterReference, {
      status: `published`,
      publishedAt: serverTimestamp(),
      publishedBy: state.user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    transaction.set(
      companyDoc(`auditLogs`, auditId),
      auditRecord(`roster.published`, rosterId, {
        assignmentCount: Number(liveRoster.data().publishTotal || 0),
        conflictResult,
        overrideReason: conflictReason
      })
    );
  });
  if (typeof onProgress === `function`) {
    const total = Number(rosterSnapshot.data().assignmentCount || 0);
    onProgress(total, total);
  }
  return {
    assignments: Number(rosterSnapshot.data().assignmentCount || 0),
    conflicts
  };
};

const stage11RequestDefinition = (code, version) => {
  const commonFields = [
    {
      key: `assignmentId`,
      type: `text`,
      labelEn: `Published shift assignment ID`,
      labelAr: `معرّف الوردية المنشورة`,
      required: true,
      sensitive: false,
      placeholderEn: ``,
      placeholderAr: ``,
      choices: []
    },
    {
      key: `workDate`,
      type: `date`,
      labelEn: `Work date`,
      labelAr: `تاريخ العمل`,
      required: true,
      sensitive: false,
      placeholderEn: ``,
      placeholderAr: ``,
      choices: []
    }
  ];
  const isSwap = code === `shift_swap`;
  const fields = isSwap
    ? commonFields.concat([
        {
          key: `colleagueEmployeeCode`,
          type: `text`,
          labelEn: `Colleague employee code`,
          labelAr: `رقم الموظف الزميل`,
          required: true,
          sensitive: false,
          placeholderEn: ``,
          placeholderAr: ``,
          choices: []
        },
        {
          key: `colleagueAssignmentId`,
          type: `text`,
          labelEn: `Colleague shift assignment ID`,
          labelAr: `معرّف وردية الزميل`,
          required: true,
          sensitive: false,
          placeholderEn: ``,
          placeholderAr: ``,
          choices: []
        },
        {
          key: `reason`,
          type: `textarea`,
          labelEn: `Reason`,
          labelAr: `السبب`,
          required: true,
          sensitive: false,
          placeholderEn: ``,
          placeholderAr: ``,
          choices: []
        }
      ])
    : commonFields.concat([
        {
          key: `requestedShiftTemplateId`,
          type: `text`,
          labelEn: `Requested shift code`,
          labelAr: `رمز الوردية المطلوبة`,
          required: true,
          sensitive: false,
          placeholderEn: ``,
          placeholderAr: ``,
          choices: []
        },
        {
          key: `reason`,
          type: `textarea`,
          labelEn: `Reason`,
          labelAr: `السبب`,
          required: true,
          sensitive: false,
          placeholderEn: ``,
          placeholderAr: ``,
          choices: []
        }
      ]);
  const workflowId = `${code}__workflow_v${version}`;
  return {
    type: {
      id: `${code}__v${version}`,
      companyId: state.companyId,
      code,
      version,
      nameEn: isSwap ? `Swap a published shift` : `Change a published shift`,
      nameAr: isSwap ? `تبديل وردية منشورة` : `تغيير وردية منشورة`,
      descriptionEn: isSwap
        ? `Request a controlled swap with another employee on the same work date.`
        : `Request a different shift for a date already published in your schedule.`,
      descriptionAr: isSwap
        ? `اطلب تبديلًا منضبطًا مع موظف آخر في تاريخ العمل نفسه.`
        : `اطلب وردية مختلفة ليوم منشور أصلًا في جدولك.`,
      category: `team`,
      confidentiality: `normal`,
      subjectMode: `self`,
      initialResolver: `direct_manager`,
      formSchema: fields,
      workflowId,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    },
    workflow: {
      id: workflowId,
      companyId: state.companyId,
      requestTypeCode: code,
      version,
      steps: [
        {
          index: 0,
          type: `approval`,
          resolver: `direct_manager`,
          mode: `sequential`,
          slaHours: 24,
          nameEn: `Manager schedule approval`,
          nameAr: `موافقة المدير على الجدول`
        },
        {
          index: 1,
          type: `fulfillment`,
          resolver: `hr`,
          mode: `parallel_any`,
          slaHours: 24,
          nameEn: `HR schedule update`,
          nameAr: `تحديث الجدول لدى HR`
        }
      ],
      slaHours: 48,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    }
  };
};

const activateShiftRequestServices = async () => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const currentYear = new Date().getFullYear();
  if (!state.settings?.activePolicyId) throw new Error(`policy-required`);
  if (state.settings.holidayCalendarYear !== currentYear) {
    throw new Error(`holiday-calendar-required`);
  }
  if (!state.templates.some(template => template.status === `active`)) {
    throw new Error(`template-required`);
  }
  const publishedRosterSnapshot = await getDocs(query(
    companyCollection(`rosters`),
    where(`status`, `==`, `published`),
    limit(1)
  ));
  if (publishedRosterSnapshot.empty) throw new Error(`published-roster-required`);

  const typesSnapshot = await getDocs(query(
    companyCollection(`requestTypes`),
    limit(200)
  ));
  const existingTypes = snapshotRows(typesSnapshot);
  const batch = writeBatch(db);
  const activeTypeIds = [];
  let pendingWrites = 0;
  [`shift_change`, `shift_swap`].forEach(code => {
    const published = existingTypes.find(type => (
      type.code === code && type.status === `published`
    ));
    if (published) {
      activeTypeIds.push(published.id);
      return;
    }
    const version = existingTypes
      .filter(type => type.code === code)
      .reduce((maximum, type) => (
        Math.max(maximum, Number(type.version || 0))
      ), 0) + 1;
    const definition = stage11RequestDefinition(code, version);
    batch.set(
      companyDoc(`workflowDefinitions`, definition.workflow.id),
      definition.workflow
    );
    batch.set(
      companyDoc(`requestTypes`, definition.type.id),
      definition.type
    );
    activeTypeIds.push(definition.type.id);
    pendingWrites += 2;
  });
  batch.update(companyDoc(`timeSettings`, `current`), {
    requestServicesEnabled: true,
    requestTypeIds: activeTypeIds,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  batch.set(
    companyDoc(`auditLogs`, crypto.randomUUID()),
    auditRecord(`shift_requests.activated`, `current`, {
      requestTypeIds: activeTypeIds
    })
  );
  pendingWrites += 2;
  if (pendingWrites) await batch.commit();
  state.settings = (await getDoc(companyDoc(`timeSettings`, `current`))).data();
  return activeTypeIds;
};

export {
  Timestamp,
  activateShiftRequestServices,
  activeEmployees,
  addDays,
  adminRoles,
  auth,
  confirmHolidayCalendar,
  dateKey,
  directReports,
  employeeById,
  evaluateRosterConflicts,
  isAdmin,
  isManager,
  loadRosterAssignments,
  loadRosters,
  loadScheduleRange,
  loadTimeSession,
  locationById,
  maximumRosterAssignments,
  onAuthStateChanged,
  parseDateKey,
  publishPolicy,
  publishRoster,
  release,
  saveHoliday,
  saveRosterDraft,
  saveShiftTemplate,
  signOut,
  state,
  templateById,
  toDate,
  weekDates,
  weekStart
};
