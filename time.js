import {
  activateShiftRequestServices,
  activeEmployees,
  addDays,
  auth,
  confirmHolidayCalendar,
  dateKey,
  directReports,
  employeeById,
  isAdmin,
  isManager,
  loadRosterAssignments,
  loadRosters,
  loadScheduleRange,
  loadTimeSession,
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
} from "./time-core.js?v=20260727.1";

const pageType = document.body.dataset.timePage || `employee`;
const storageKey = `nasna-language`;
const safeStorage = {
  get: key => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your schedule access…`,
    checkingManagerAccess: `Checking your team scheduling access…`,
    checkingHrAccess: `Checking HR time-administration access…`,
    dashboard: `Dashboard`,
    myProfile: `My profile`,
    mySchedule: `My schedule`,
    teamSchedule: `Team schedule`,
    myRequests: `My requests`,
    approvalInbox: `Approval inbox`,
    hrOperations: `HR operations`,
    timeAdmin: `Time admin`,
    signOut: `Sign out`,
    signedInAs: `Signed in as`,
    planningAs: `Planning as`,
    administeringAs: `Administering as`,
    stage11Time: `Stage 11 · NASNA Time`,
    myScheduleTitle: `My published work schedule`,
    myScheduleCopy: `See your official shifts, split-shift segments, work locations, and company holidays.`,
    publishedOnly: `Only published schedules are official`,
    publishedOnlyCopy: `Draft plans stay private to the planner. A change or swap follows the tracked approval workflow.`,
    sparkSafe: `Firebase Spark safe`,
    scheduleWeek: `Schedule week`,
    previousWeek: `Previous`,
    thisWeek: `This week`,
    nextWeek: `Next`,
    scheduledDays: `Scheduled days`,
    publishedDays: `Published work days`,
    scheduledHours: `Scheduled hours`,
    afterBreaks: `After unpaid breaks`,
    splitShifts: `Split shifts`,
    multiSegmentDays: `Multi-segment days`,
    flexWindowLabel: `{minutes} min flex window`,
    holidays: `Holidays`,
    companyCalendar: `Company calendar`,
    officialRoster: `Official roster`,
    weekDetails: `Week details`,
    noPublishedSchedule: `No published schedule for this week`,
    noPublishedScheduleCopy: `Your manager or HR will publish the official roster when planning is complete.`,
    offDay: `Not scheduled`,
    holiday: `Holiday`,
    changeShift: `Request change`,
    swapShift: `Request swap`,
    break: `break`,
    managerWorkspace: `Manager workspace`,
    teamScheduleTitle: `Plan and publish your team roster`,
    teamScheduleCopy: `Your manager screen is separate from your employee schedule. Plan direct reports, validate conflicts, then publish an official version.`,
    managerScheduleBoundary: `Managers schedule direct reports only`,
    managerScheduleBoundaryCopy: `You remain an employee. This workspace does not let you create employees, edit HR files, or alter another manager’s team.`,
    versionedPublishing: `Versioned publishing`,
    rosterWeek: `Roster week`,
    managerScope: `Manager scope`,
    allEmployees: `All active employees`,
    unsavedDraft: `Unsaved draft`,
    draft: `Draft`,
    saving: `Saving`,
    publishing: `Publishing`,
    published: `Published`,
    draftCopy: `Save a draft before publishing.`,
    savingCopy: `Saving the draft safely: {completed}/{total} assignments.`,
    incompleteDraftCopy: `The previous save was interrupted. Save again to rebuild this draft safely.`,
    savedDraftCopy: `Draft saved. Review the grid and publish when ready.`,
    publishingCopy: `Publishing safely: {completed}/{total} assignments. You can resume after an interruption.`,
    publishedCopy: `The roster is published and locked. Save a new draft to create a controlled revision.`,
    saveDraft: `Save draft`,
    publishRoster: `Publish roster`,
    resumePublishing: `Resume publishing`,
    weeklyPlanner: `Weekly planner`,
    assignShifts: `Assign published shift templates`,
    assignShiftsCopy: `An empty cell is a non-working day. Split templates carry both segments automatically.`,
    off: `Off`,
    noDirectReports: `No employees are available in this scope`,
    noDirectReportsCopy: `HR must create and assign employees before a roster can be planned.`,
    conflictPolicy: `Conflict policy`,
    publishChecks: `Checks applied before publishing`,
    checkDailyLimit: `Daily-hours limit`,
    checkWeeklyLimit: `Weekly-hours limit`,
    checkMinimumRest: `Minimum rest between shifts`,
    checkHolidays: `Published holiday calendar`,
    checkAtomicPublish: `Resumable per-day atomic publishing and locks`,
    noConflicts: `No conflicts detected in the current draft.`,
    hrOverride: `HR override`,
    overrideWarnings: `Document warning override`,
    overrideWarningsCopy: `Only HR may publish a warning-level conflict, and the reason becomes part of the audit trail.`,
    overrideReason: `Override reason`,
    publishWithOverride: `Publish with override`,
    cancel: `Cancel`,
    stage11Foundation: `Stage 11 · Scheduling foundation`,
    timeAdminTitle: `Work calendars, shifts, and publishing controls`,
    timeAdminCopy: `HR publishes the company calendar and shift templates. Managers plan teams; attendance punches begin only in Stage 12.`,
    stageBoundary: `Stage boundary is enforced`,
    stageBoundaryCopy: `This release schedules work. Clock-in, missing punches, overtime, and attendance corrections remain disabled until Stage 12; leave remains Stage 13.`,
    sparkCompatible: `Spark compatible`,
    activePolicy: `Active policy`,
    versionedCalendar: `Versioned work calendar`,
    activeTemplates: `Active templates`,
    availableForPlanning: `Available for planning`,
    publishedHolidays: `Published holidays`,
    calendarNotConfirmed: `Calendar not confirmed`,
    shiftServices: `Shift services`,
    inactive: `Inactive`,
    active: `Active`,
    activatedAfterReadiness: `Activated only after readiness`,
    calendarPolicy: `Calendar policy`,
    publishWorkPolicy: `Publish a work-calendar version`,
    policyImmutableCopy: `Publishing creates a new immutable policy version and makes it active for future rosters and SLA dates.`,
    timezone: `Timezone`,
    weekStartsOn: `Week starts on`,
    sunday: `Sunday`,
    monday: `Monday`,
    saturday: `Saturday`,
    businessDayStart: `Business day starts`,
    businessDayEnd: `Business day ends`,
    standardDailyHours: `Standard daily hours`,
    maximumDailyHours: `Maximum daily hours`,
    maximumWeeklyHours: `Maximum weekly hours`,
    minimumRestHours: `Minimum rest hours`,
    restConflictPolicy: `Rest conflict policy`,
    holidayWorkPolicy: `Holiday work policy`,
    blockPublishing: `Block publishing`,
    hrWarningOverride: `HR warning override`,
    effectiveFrom: `Effective from`,
    workingDays: `Working days`,
    sun: `Sun`,
    mon: `Mon`,
    tue: `Tue`,
    wed: `Wed`,
    thu: `Thu`,
    fri: `Fri`,
    sat: `Sat`,
    publishPolicy: `Publish policy version`,
    shiftLibrary: `Shift library`,
    shiftTemplates: `Shift templates`,
    shiftTemplatesCopy: `Standard, flexible, and split templates are copied into each published assignment.`,
    newTemplate: `New template`,
    noTemplates: `No shift templates`,
    noTemplatesCopy: `Publish the policy, then add the first template.`,
    holidayCalendar: `Holiday calendar`,
    publishedDaysOff: `Published days off`,
    holidayCalendarCopy: `A holiday may apply company-wide or to one branch. Confirm the year after review.`,
    newHoliday: `New holiday`,
    calendarYear: `Calendar year`,
    confirmCalendar: `Confirm year`,
    noHolidays: `No holidays published`,
    noHolidaysCopy: `Add official dates or confirm that the selected year has none.`,
    activationGate: `Activation gate`,
    enableShiftRequests: `Enable shift-change services`,
    enableShiftRequestsCopy: `Stage 10 request types appear only after Stage 11 has all required reference data.`,
    readyPolicy: `Published policy`,
    readyHoliday: `Confirmed holiday year`,
    readyTemplates: `Active shift template`,
    readyRoster: `Published roster`,
    requestActivationCopy: `Activation publishes immutable Shift Change and Shift Swap definitions. HR performs the final schedule update after manager approval.`,
    activateShiftRequests: `Activate shift requests`,
    publishingHistory: `Publishing history`,
    recentRosters: `Recent rosters`,
    openPlanner: `Open planner`,
    noRosters: `No rosters yet`,
    noRostersCopy: `The first draft appears after HR or a manager saves a week.`,
    shiftTemplate: `Shift template`,
    code: `Code`,
    templateKind: `Template kind`,
    standard: `Standard`,
    flexible: `Flexible`,
    split: `Split`,
    nameEnglish: `English name`,
    nameArabic: `Arabic name`,
    segmentOneStart: `First segment starts`,
    segmentOneEnd: `First segment ends`,
    segmentTwoStart: `Second segment starts`,
    segmentTwoEnd: `Second segment ends`,
    breakMinutes: `Break minutes`,
    flexWindow: `Flex window minutes`,
    status: `Status`,
    saveTemplate: `Save template`,
    date: `Date`,
    branchScope: `Branch scope`,
    allBranches: `All branches`,
    paidHoliday: `Paid holiday`,
    saveHoliday: `Save holiday`,
    edit: `Edit`,
    companyWide: `Company-wide`,
    assignments: `assignments`,
    policyPublished: `Work-calendar policy published.`,
    templateSaved: `Shift template saved.`,
    holidaySaved: `Holiday saved.`,
    holidayConfirmed: `Holiday calendar confirmed.`,
    rosterSaved: `Roster draft saved.`,
    rosterPublished: `Roster published and locked.`,
    servicesActivated: `Shift change and swap services are active.`,
    permissionDenied: `You do not have permission for this action.`,
    policyInvalid: `Review the calendar times, working days, and hour limits.`,
    policyRequired: `Publish the work-calendar policy first.`,
    templateInvalid: `Review the shift code, names, segments, and breaks.`,
    templateOverlap: `Split-shift segments cannot overlap.`,
    templateDailyLimit: `This template exceeds the active daily-hours limit.`,
    templateInactive: `Choose an active shift template.`,
    holidayInvalid: `Complete a valid date, names, and branch scope.`,
    holidayYearInvalid: `Choose a valid calendar year.`,
    holidayCalendarRequired: `Confirm the current holiday year first.`,
    templateRequired: `Add at least one active shift template.`,
    publishedRosterRequired: `Publish at least one roster first.`,
    rosterEmployeesRequired: `Choose at least one employee.`,
    rosterAssignmentsRequired: `Assign at least one shift.`,
    rosterSizeLimit: `A weekly roster is limited to 140 assignments. Split the scope and publish another roster.`,
    rosterImmutable: `This roster is already published. Save a new draft for a revision.`,
    rosterSaveIncomplete: `The roster draft is incomplete. Save it again before publishing.`,
    rosterPublishIncomplete: `Publishing is incomplete. Resume publishing to finish the roster.`,
    rosterChanged: `This roster changed in another session. The latest version has been reloaded.`,
    rosterPolicyChanged: `The active work policy changed. Save the draft again before publishing.`,
    rosterConflictBlocked: `Publishing is blocked by policy conflicts.`,
    rosterConflictOverrideRequired: `HR must document an override reason for warning-level conflicts.`,
    scheduleTimeInvalid: `A shift uses a local time that does not exist in the active timezone on that date. Choose another template or time.`,
    genericError: `The action could not be completed. Refresh and try again.`,
    signedOutError: `Sign-out could not be completed.`,
    language: `العربية`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من صلاحية عرض الجدول…`,
    checkingManagerAccess: `جارٍ التحقق من صلاحية جدولة الفريق…`,
    checkingHrAccess: `جارٍ التحقق من صلاحية إدارة الوقت لدى HR…`,
    dashboard: `الرئيسية`,
    myProfile: `ملفي`,
    mySchedule: `جدولي`,
    teamSchedule: `جدول الفريق`,
    myRequests: `طلباتي`,
    approvalInbox: `صندوق الموافقات`,
    hrOperations: `عمليات HR`,
    timeAdmin: `إدارة الوقت`,
    signOut: `تسجيل الخروج`,
    signedInAs: `المستخدم الحالي`,
    planningAs: `تخطط بصفتك`,
    administeringAs: `تدير النظام بصفتك`,
    stage11Time: `المرحلة 11 · وقت ناسنا`,
    myScheduleTitle: `جدول عملي المنشور`,
    myScheduleCopy: `اعرض وردياتك الرسمية وأجزاء الوردية المقسمة ومواقع العمل وعطل الشركة.`,
    publishedOnly: `الجداول المنشورة فقط رسمية`,
    publishedOnlyCopy: `تبقى المسودات خاصة بمن يخطط الجدول. التغيير أو التبديل يمر عبر مسار الموافقات المتتبع.`,
    sparkSafe: `آمن على Firebase Spark`,
    scheduleWeek: `أسبوع الجدول`,
    previousWeek: `السابق`,
    thisWeek: `هذا الأسبوع`,
    nextWeek: `التالي`,
    scheduledDays: `أيام العمل`,
    publishedDays: `أيام عمل منشورة`,
    scheduledHours: `ساعات العمل`,
    afterBreaks: `بعد الاستراحات غير المدفوعة`,
    splitShifts: `ورديات مقسمة`,
    multiSegmentDays: `أيام متعددة الفترات`,
    flexWindowLabel: `نافذة مرونة {minutes} دقيقة`,
    holidays: `العطل`,
    companyCalendar: `تقويم الشركة`,
    officialRoster: `الجدول الرسمي`,
    weekDetails: `تفاصيل الأسبوع`,
    noPublishedSchedule: `لا يوجد جدول منشور لهذا الأسبوع`,
    noPublishedScheduleCopy: `سينشر مديرك أو HR الجدول الرسمي بعد اكتمال التخطيط.`,
    offDay: `غير مجدول`,
    holiday: `عطلة`,
    changeShift: `طلب تغيير`,
    swapShift: `طلب تبديل`,
    break: `استراحة`,
    managerWorkspace: `مساحة المدير`,
    teamScheduleTitle: `خطط جدول فريقك وانشره`,
    teamScheduleCopy: `شاشة المدير منفصلة عن جدوله كموظف. خطط للمرؤوسين، تحقق من التعارضات، ثم انشر نسخة رسمية.`,
    managerScheduleBoundary: `المدير يجدول مرؤوسيه المباشرين فقط`,
    managerScheduleBoundaryCopy: `تبقى موظفًا. لا تتيح لك هذه الشاشة إنشاء موظف أو تعديل ملف HR أو تغيير فريق مدير آخر.`,
    versionedPublishing: `نشر بإصدارات`,
    rosterWeek: `أسبوع الجدول`,
    managerScope: `نطاق المدير`,
    allEmployees: `كل الموظفين الفعالين`,
    unsavedDraft: `مسودة غير محفوظة`,
    draft: `مسودة`,
    saving: `جارٍ الحفظ`,
    publishing: `جارٍ النشر`,
    published: `منشور`,
    draftCopy: `احفظ المسودة قبل النشر.`,
    savingCopy: `جارٍ حفظ المسودة بأمان: {completed}/{total} تعيينًا.`,
    incompleteDraftCopy: `انقطع الحفظ السابق. احفظ مجددًا لإعادة بناء المسودة بأمان.`,
    savedDraftCopy: `تم حفظ المسودة. راجع الجدول ثم انشره عند الجاهزية.`,
    publishingCopy: `جارٍ النشر بأمان: {completed}/{total} تعيينًا. يمكنك الاستكمال بعد أي انقطاع.`,
    publishedCopy: `الجدول منشور ومقفل. احفظ مسودة جديدة لإنشاء تعديل منضبط.`,
    saveDraft: `حفظ المسودة`,
    publishRoster: `نشر الجدول`,
    resumePublishing: `استكمال النشر`,
    weeklyPlanner: `مخطط الأسبوع`,
    assignShifts: `عيّن قوالب الورديات المنشورة`,
    assignShiftsCopy: `الخانة الفارغة يوم غير عامل. القالب المقسم يحمل الفترتين تلقائيًا.`,
    off: `إجازة أسبوعية`,
    noDirectReports: `لا يوجد موظفون ضمن هذا النطاق`,
    noDirectReportsCopy: `يجب أن ينشئ HR الموظفين ويعينهم قبل تخطيط الجدول.`,
    conflictPolicy: `سياسة التعارض`,
    publishChecks: `الفحوصات قبل النشر`,
    checkDailyLimit: `حد الساعات اليومية`,
    checkWeeklyLimit: `حد الساعات الأسبوعية`,
    checkMinimumRest: `الراحة الدنيا بين الورديات`,
    checkHolidays: `تقويم العطل المنشور`,
    checkAtomicPublish: `نشر ذري يومي قابل للاستكمال مع أقفال`,
    noConflicts: `لا توجد تعارضات في المسودة الحالية.`,
    hrOverride: `تجاوز HR`,
    overrideWarnings: `توثيق تجاوز التحذير`,
    overrideWarningsCopy: `HR وحده يستطيع نشر تعارض بمستوى تحذير، ويصبح السبب جزءًا من سجل التدقيق.`,
    overrideReason: `سبب التجاوز`,
    publishWithOverride: `النشر مع التجاوز`,
    cancel: `إلغاء`,
    stage11Foundation: `المرحلة 11 · أساس الجدولة`,
    timeAdminTitle: `تقويمات العمل والورديات وضوابط النشر`,
    timeAdminCopy: `ينشر HR تقويم الشركة وقوالب الورديات. يخطط المديرون للفرق؛ البصمة تبدأ فقط في المرحلة 12.`,
    stageBoundary: `حدود المرحلة مطبقة`,
    stageBoundaryCopy: `هذا الإصدار يجدول العمل. الدخول والخروج والنواقص والإضافي وتصحيح الحضور تبقى معطلة حتى المرحلة 12، والإجازات في 13.`,
    sparkCompatible: `متوافق مع Spark`,
    activePolicy: `السياسة الفعالة`,
    versionedCalendar: `تقويم عمل بإصدارات`,
    activeTemplates: `القوالب الفعالة`,
    availableForPlanning: `متاحة للتخطيط`,
    publishedHolidays: `العطل المنشورة`,
    calendarNotConfirmed: `التقويم غير مؤكد`,
    shiftServices: `خدمات الورديات`,
    inactive: `غير فعالة`,
    active: `فعال`,
    activatedAfterReadiness: `تتفعل بعد الجاهزية فقط`,
    calendarPolicy: `سياسة التقويم`,
    publishWorkPolicy: `نشر إصدار لتقويم العمل`,
    policyImmutableCopy: `ينشئ النشر إصدار سياسة غير قابل للتعديل ويجعله فعالًا للجداول واحتساب مواعيد SLA المستقبلية.`,
    timezone: `المنطقة الزمنية`,
    weekStartsOn: `بداية الأسبوع`,
    sunday: `الأحد`,
    monday: `الاثنين`,
    saturday: `السبت`,
    businessDayStart: `بداية يوم العمل الإداري`,
    businessDayEnd: `نهاية يوم العمل الإداري`,
    standardDailyHours: `الساعات اليومية القياسية`,
    maximumDailyHours: `الحد اليومي للساعات`,
    maximumWeeklyHours: `الحد الأسبوعي للساعات`,
    minimumRestHours: `الراحة الدنيا بالساعات`,
    restConflictPolicy: `سياسة تعارض الراحة`,
    holidayWorkPolicy: `سياسة العمل في العطل`,
    blockPublishing: `منع النشر`,
    hrWarningOverride: `تحذير مع تجاوز HR`,
    effectiveFrom: `ساري من`,
    workingDays: `أيام العمل`,
    sun: `أحد`,
    mon: `اثنين`,
    tue: `ثلاثاء`,
    wed: `أربعاء`,
    thu: `خميس`,
    fri: `جمعة`,
    sat: `سبت`,
    publishPolicy: `نشر إصدار السياسة`,
    shiftLibrary: `مكتبة الورديات`,
    shiftTemplates: `قوالب الورديات`,
    shiftTemplatesCopy: `تُنسخ القوالب العادية والمرنة والمقسمة داخل كل تعيين منشور.`,
    newTemplate: `قالب جديد`,
    noTemplates: `لا توجد قوالب ورديات`,
    noTemplatesCopy: `انشر السياسة ثم أضف أول قالب.`,
    holidayCalendar: `تقويم العطل`,
    publishedDaysOff: `أيام العطل المنشورة`,
    holidayCalendarCopy: `يمكن للعطلة أن تشمل الشركة أو فرعًا واحدًا. أكد السنة بعد المراجعة.`,
    newHoliday: `عطلة جديدة`,
    calendarYear: `سنة التقويم`,
    confirmCalendar: `تأكيد السنة`,
    noHolidays: `لا توجد عطل منشورة`,
    noHolidaysCopy: `أضف التواريخ الرسمية أو أكد أن السنة المختارة بلا عطل.`,
    activationGate: `بوابة التفعيل`,
    enableShiftRequests: `تفعيل خدمات تغيير الوردية`,
    enableShiftRequestsCopy: `لا تظهر أنواع طلبات المرحلة 10 قبل اكتمال بيانات المرحلة 11 المرجعية.`,
    readyPolicy: `سياسة منشورة`,
    readyHoliday: `سنة عطل مؤكدة`,
    readyTemplates: `قالب وردية فعال`,
    readyRoster: `جدول منشور`,
    requestActivationCopy: `ينشر التفعيل تعريفين غير قابلين للتعديل: تغيير الوردية وتبديلها. ينفذ HR تحديث الجدول النهائي بعد موافقة المدير.`,
    activateShiftRequests: `تفعيل طلبات الورديات`,
    publishingHistory: `سجل النشر`,
    recentRosters: `الجداول الأخيرة`,
    openPlanner: `فتح المخطط`,
    noRosters: `لا توجد جداول بعد`,
    noRostersCopy: `تظهر أول مسودة بعد أن يحفظ HR أو المدير أسبوعًا.`,
    shiftTemplate: `قالب وردية`,
    code: `الرمز`,
    templateKind: `نوع القالب`,
    standard: `عادي`,
    flexible: `مرن`,
    split: `مقسم`,
    nameEnglish: `الاسم بالإنجليزية`,
    nameArabic: `الاسم بالعربية`,
    segmentOneStart: `بداية الفترة الأولى`,
    segmentOneEnd: `نهاية الفترة الأولى`,
    segmentTwoStart: `بداية الفترة الثانية`,
    segmentTwoEnd: `نهاية الفترة الثانية`,
    breakMinutes: `دقائق الاستراحة`,
    flexWindow: `نافذة المرونة بالدقائق`,
    status: `الحالة`,
    saveTemplate: `حفظ القالب`,
    date: `التاريخ`,
    branchScope: `نطاق الفرع`,
    allBranches: `كل الفروع`,
    paidHoliday: `عطلة مدفوعة`,
    saveHoliday: `حفظ العطلة`,
    edit: `تعديل`,
    companyWide: `كل الشركة`,
    assignments: `تعيينات`,
    policyPublished: `تم نشر سياسة تقويم العمل.`,
    templateSaved: `تم حفظ قالب الوردية.`,
    holidaySaved: `تم حفظ العطلة.`,
    holidayConfirmed: `تم تأكيد تقويم العطل.`,
    rosterSaved: `تم حفظ مسودة الجدول.`,
    rosterPublished: `تم نشر الجدول وإقفاله.`,
    servicesActivated: `تم تفعيل خدمتي تغيير الوردية وتبديلها.`,
    permissionDenied: `لا تملك صلاحية هذا الإجراء.`,
    policyInvalid: `راجع أوقات التقويم وأيام العمل وحدود الساعات.`,
    policyRequired: `انشر سياسة تقويم العمل أولًا.`,
    templateInvalid: `راجع رمز الوردية وأسماءها وفتراتها واستراحاتها.`,
    templateOverlap: `لا يجوز أن تتداخل فترتا الوردية المقسمة.`,
    templateDailyLimit: `يتجاوز هذا القالب حد الساعات اليومية الفعال.`,
    templateInactive: `اختر قالب وردية فعالًا.`,
    holidayInvalid: `أكمل تاريخًا وأسماء ونطاق فرع صحيحًا.`,
    holidayYearInvalid: `اختر سنة تقويم صحيحة.`,
    holidayCalendarRequired: `أكد سنة العطل الحالية أولًا.`,
    templateRequired: `أضف قالب وردية فعالًا واحدًا على الأقل.`,
    publishedRosterRequired: `انشر جدولًا واحدًا على الأقل أولًا.`,
    rosterEmployeesRequired: `اختر موظفًا واحدًا على الأقل.`,
    rosterAssignmentsRequired: `عيّن وردية واحدة على الأقل.`,
    rosterSizeLimit: `حد الجدول الأسبوعي 140 تعيينًا. قسّم النطاق وانشر جدولًا آخر.`,
    rosterImmutable: `هذا الجدول منشور. احفظ مسودة جديدة لإنشاء تعديل.`,
    rosterSaveIncomplete: `مسودة الجدول غير مكتملة. احفظها مجددًا قبل النشر.`,
    rosterPublishIncomplete: `النشر غير مكتمل. استكمل النشر لإنهاء الجدول.`,
    rosterChanged: `تغير هذا الجدول في جلسة أخرى. تم تحميل أحدث نسخة.`,
    rosterPolicyChanged: `تغيرت سياسة العمل الفعالة. احفظ المسودة مجددًا قبل النشر.`,
    rosterConflictBlocked: `تم منع النشر بسبب تعارضات مع السياسة.`,
    rosterConflictOverrideRequired: `يجب على HR توثيق سبب تجاوز تعارضات التحذير.`,
    scheduleTimeInvalid: `تستخدم الوردية وقتًا محليًا غير موجود في المنطقة الزمنية الفعالة لذلك التاريخ. اختر قالبًا أو وقتًا آخر.`,
    genericError: `تعذر إكمال الإجراء. حدّث الصفحة وحاول مجددًا.`,
    signedOutError: `تعذر تسجيل الخروج.`,
    language: `English`
  }
};

const elements = Object.fromEntries(
  [...document.querySelectorAll(`[id]`)].map(element => [element.id, element])
);
const documentElement = document.documentElement;
let language = safeStorage.get(storageKey)
  || (navigator.language.startsWith(`ar`) ? `ar` : `en`);
let selectedWeek = weekStart(new Date());
let scheduleAssignments = [];
let rosters = [];
let currentRoster = null;
let plannerEmployees = [];
let plannerSelections = {};
let lastConflicts = [];
let toastTimer = null;
let publishedRosterReady = false;

const t = key => translations[language][key] || translations.en[key] || key;
const escapeHtml = value => String(value ?? ``)
  .replaceAll(`&`, `&amp;`)
  .replaceAll(`<`, `&lt;`)
  .replaceAll(`>`, `&gt;`)
  .replaceAll(`"`, `&quot;`)
  .replaceAll(`'`, `&#039;`);

const localized = (record, field = `name`) => (
  record?.[`${field}${language === `ar` ? `Ar` : `En`}`]
  || record?.[`${field}En`]
  || record?.[`${field}Ar`]
  || record?.id
  || `—`
);

const formatDate = (value, options = {}) => {
  const date = parseDateKey(value) || toDate(value);
  if (!date) return `—`;
  return new Intl.DateTimeFormat(
    language === `ar` ? `ar-JO` : `en-GB`,
    options
  ).format(date);
};

const formatTime = value => {
  const date = toDate(value);
  if (!date) return `—`;
  return new Intl.DateTimeFormat(
    language === `ar` ? `ar-JO` : `en-GB`,
    { hour: `2-digit`, minute: `2-digit` }
  ).format(date);
};

const hoursLabel = minutes => {
  const hours = Number(minutes || 0) / 60;
  return new Intl.NumberFormat(
    language === `ar` ? `ar-JO` : `en-GB`,
    { maximumFractionDigits: 1 }
  ).format(hours);
};

const showToast = key => {
  if (!elements.toast || !elements.toastMessage) return;
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = t(key);
  elements.toast.classList.add(`is-visible`);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4200);
};

const errorKey = error => ({
  "permission-denied": `permissionDenied`,
  "policy-invalid": `policyInvalid`,
  "policy-required": `policyRequired`,
  "template-invalid": `templateInvalid`,
  "template-overlap": `templateOverlap`,
  "template-daily-limit": `templateDailyLimit`,
  "template-inactive": `templateInactive`,
  "holiday-invalid": `holidayInvalid`,
  "holiday-year-invalid": `holidayYearInvalid`,
  "holiday-calendar-required": `holidayCalendarRequired`,
  "template-required": `templateRequired`,
  "published-roster-required": `publishedRosterRequired`,
  "roster-employees-required": `rosterEmployeesRequired`,
  "roster-assignments-required": `rosterAssignmentsRequired`,
  "roster-size-limit": `rosterSizeLimit`,
  "roster-immutable": `rosterImmutable`,
  "roster-save-incomplete": `rosterSaveIncomplete`,
  "roster-publish-incomplete": `rosterPublishIncomplete`,
  "roster-changed": `rosterChanged`,
  "roster-policy-changed": `rosterPolicyChanged`,
  "roster-conflict-blocked": `rosterConflictBlocked`,
  "roster-conflict-override-required": `rosterConflictOverrideRequired`,
  "schedule-time-invalid": `scheduleTimeInvalid`
}[error?.message] || `genericError`);

const renderHeader = () => {
  if (elements.signedInEmail) {
    elements.signedInEmail.textContent = state.user.email || state.user.uid;
  }
  if (elements.signedInAvatar) {
    elements.signedInAvatar.textContent = String(
      state.ownEmployee?.fullNameEn
      || state.user.email
      || `U`
    ).trim().charAt(0).toUpperCase() || `U`;
  }
  if (elements.teamScheduleNav) {
    elements.teamScheduleNav.hidden = !isManager() && !isAdmin();
  }
  if (elements.timeAdminNav) {
    elements.timeAdminNav.hidden = !isAdmin();
  }
};

const weekLabel = () => {
  const end = addDays(selectedWeek, 6);
  return `${formatDate(selectedWeek, {
    day: `numeric`,
    month: `short`
  })} – ${formatDate(end, {
    day: `numeric`,
    month: `short`,
    year: `numeric`
  })}`;
};

const renderWeekLabel = () => {
  if (elements.weekLabel) elements.weekLabel.textContent = weekLabel();
};

const renderEmployeeSchedule = () => {
  renderWeekLabel();
  const own = state.ownEmployee;
  const assignmentsByDate = new Map(
    scheduleAssignments
      .filter(assignment => (
        assignment.status === `published`
        && assignment.employeeAuthUid === state.user.uid
      ))
      .map(assignment => [assignment.workDate, assignment])
  );
  const holidayRows = state.holidays.filter(holiday => (
    holiday.status === `active`
    && holiday.date >= selectedWeek
    && holiday.date <= addDays(selectedWeek, 6)
    && (!holiday.branchId || holiday.branchId === own?.branchId)
  ));
  const scheduled = [...assignmentsByDate.values()];
  elements.scheduledDays.textContent = String(scheduled.length);
  elements.scheduledHours.textContent = hoursLabel(
    scheduled.reduce((total, row) => total + Number(row.totalMinutes || 0), 0)
  );
  elements.splitShiftCount.textContent = String(
    scheduled.filter(row => row.segments?.length > 1).length
  );
  elements.holidayCount.textContent = String(holidayRows.length);

  const today = dateKey(new Date());
  const requestActionsEnabled = Boolean(state.settings?.requestServicesEnabled);
  elements.employeeScheduleGrid.innerHTML = weekDates(selectedWeek).map(workDate => {
    const date = parseDateKey(workDate);
    const assignment = assignmentsByDate.get(workDate);
    const holiday = holidayRows.find(item => item.date === workDate);
    const template = assignment ? templateById(assignment.templateId) : null;
    const location = assignment
      ? state.locations.find(item => item.id === assignment.locationId)
      : null;
    const segments = assignment?.segments || [];
    const actions = assignment && requestActionsEnabled
      ? `
        <div class="shift-actions">
          <a class="shift-action-link" href="requests.html?v=${release}&type=shift_change&assignmentId=${encodeURIComponent(assignment.id)}&workDate=${encodeURIComponent(workDate)}">${escapeHtml(t(`changeShift`))}</a>
          <a class="shift-action-link" href="requests.html?v=${release}&type=shift_swap&assignmentId=${encodeURIComponent(assignment.id)}&workDate=${encodeURIComponent(workDate)}">${escapeHtml(t(`swapShift`))}</a>
        </div>
      `
      : ``;
    return `
      <article class="schedule-day${workDate === today ? ` is-today` : ``}${holiday ? ` is-holiday` : ``}">
        <header>
          <span>
            <strong>${escapeHtml(formatDate(workDate, { weekday: `short` }))}</strong>
            <small>${escapeHtml(formatDate(workDate, { month: `short`, year: `numeric` }))}</small>
          </span>
          <span class="day-number">${escapeHtml(date?.getDate() || ``)}</span>
        </header>
        ${holiday ? `<div class="holiday-label">${escapeHtml(localized(holiday))}</div>` : ``}
        ${assignment
          ? `
            <strong>${escapeHtml(localized(template))}</strong>
            ${segments.map((segment, index) => `
              <div class="shift-segment">
                <strong>${escapeHtml(formatTime(segment.startAt))} – ${escapeHtml(formatTime(segment.endAt))}</strong>
                <small>${escapeHtml(segment.breakMinutes)} ${escapeHtml(t(`break`))}${segments.length > 1 ? ` · ${index + 1}/${segments.length}` : ``}</small>
              </div>
            `).join(``)}
            <span class="shift-location">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>
              ${escapeHtml(localized(location))}
            </span>
            <span class="shift-meta">${escapeHtml(hoursLabel(assignment.totalMinutes))}h · v${escapeHtml(assignment.version)}${Number(assignment.flexWindowMinutes || 0) > 0 ? ` · ${escapeHtml(t(`flexWindowLabel`).replace(`{minutes}`, String(assignment.flexWindowMinutes)))}` : ``}</span>
            ${actions}
          `
          : `<div class="off-day">${escapeHtml(t(`offDay`))}</div>`
        }
      </article>
    `;
  }).join(``);
  elements.scheduleEmpty.hidden = scheduled.length > 0 || holidayRows.length > 0;
};

const managerCandidates = () => activeEmployees()
  .filter(candidate => activeEmployees().some(employee => (
    employee.managerEmployeeId === candidate.id
  )));

const selectedScopeManager = () => (
  isAdmin() ? elements.managerScopeFilter?.value || `` : state.ownEmployee?.id || ``
);

const employeesForPlanner = () => {
  if (!isAdmin()) return directReports();
  const managerId = selectedScopeManager();
  if (!managerId) return activeEmployees();
  return activeEmployees().filter(employee => employee.managerEmployeeId === managerId);
};

const setSelection = (employeeId, workDate, templateId, locationId) => {
  if (!plannerSelections[employeeId]) plannerSelections[employeeId] = {};
  if (!templateId) {
    delete plannerSelections[employeeId][workDate];
    return;
  }
  plannerSelections[employeeId][workDate] = { templateId, locationId };
};

const hydrateSelections = assignments => {
  plannerSelections = {};
  assignments.forEach(assignment => {
    if (
      !plannerEmployees.some(employee => employee.id === assignment.employeeId)
      || ![`draft`, `published`].includes(assignment.status)
    ) {
      return;
    }
    setSelection(
      assignment.employeeId,
      assignment.workDate,
      assignment.templateId,
      assignment.locationId
    );
  });
};

const templateOptions = selectedId => [
  `<option value="">${escapeHtml(t(`off`))}</option>`,
  ...state.templates
    .filter(template => template.status === `active`)
    .map(template => `
      <option value="${escapeHtml(template.id)}"${template.id === selectedId ? ` selected` : ``}>
        ${escapeHtml(template.code)} · ${escapeHtml(localized(template))}
      </option>
    `)
].join(``);

const locationOptions = selectedId => state.locations.map(location => `
  <option value="${escapeHtml(location.id)}"${location.id === selectedId ? ` selected` : ``}>
    ${escapeHtml(localized(location))}
  </option>
`).join(``);

const renderPlanner = () => {
  renderWeekLabel();
  plannerEmployees = employeesForPlanner();
  const plannerLocked = currentRoster?.status === `publishing`;
  elements.plannerEmpty.hidden = plannerEmployees.length > 0;
  elements.plannerGrid.hidden = plannerEmployees.length === 0;
  const dates = weekDates(selectedWeek);
  const headers = [
    `<div class="planner-cell planner-header-cell">${escapeHtml(t(`allEmployees`))}</div>`,
    ...dates.map(workDate => `
      <div class="planner-cell planner-header-cell">
        <strong>${escapeHtml(formatDate(workDate, { weekday: `short` }))}</strong>
        ${escapeHtml(formatDate(workDate, { day: `numeric`, month: `short` }))}
      </div>
    `)
  ];
  const rows = plannerEmployees.flatMap(employee => {
    const defaultLocation = employee.locationId || state.locations[0]?.id || ``;
    return [
      `
        <div class="planner-cell employee-cell">
          <strong>${escapeHtml(localized(employee, `fullName`))}</strong>
          <small>${escapeHtml(employee.employeeCode)} · ${escapeHtml(employee.departmentId)}</small>
        </div>
      `,
      ...dates.map(workDate => {
        const selection = plannerSelections[employee.id]?.[workDate] || {};
        const locationId = selection.locationId || defaultLocation;
        return `
          <div class="planner-cell${selection.templateId ? ` has-shift` : ``}" data-planner-cell="${escapeHtml(employee.id)}__${escapeHtml(workDate)}">
            <select class="planner-select" data-employee-id="${escapeHtml(employee.id)}" data-work-date="${escapeHtml(workDate)}" aria-label="${escapeHtml(localized(employee, `fullName`))} ${escapeHtml(workDate)}"${plannerLocked ? ` disabled` : ``}>
              ${templateOptions(selection.templateId || ``)}
            </select>
            <select class="planner-location" data-location-for="${escapeHtml(employee.id)}__${escapeHtml(workDate)}"${selection.templateId && !plannerLocked ? `` : ` disabled`}>
              ${locationOptions(locationId)}
            </select>
          </div>
        `;
      })
    ];
  });
  elements.plannerGrid.innerHTML = headers.concat(rows).join(``);

  elements.publishRosterButton.textContent = t(`publishRoster`);
  elements.saveRosterButton.textContent = t(`saveDraft`);
  elements.saveRosterButton.disabled = plannerLocked;
  if (
    currentRoster?.status === `draft`
    && currentRoster.draftState === `ready`
  ) {
    elements.rosterStatus.textContent = t(`draft`);
    elements.rosterStatus.className = `status-badge is-draft`;
    elements.rosterMeta.textContent = t(`savedDraftCopy`);
    elements.publishRosterButton.disabled = false;
  } else if (currentRoster?.status === `draft`) {
    elements.rosterStatus.textContent = t(`saving`);
    elements.rosterStatus.className = `status-badge is-saving`;
    elements.rosterMeta.textContent = t(`incompleteDraftCopy`);
    elements.publishRosterButton.disabled = true;
  } else if (currentRoster?.status === `publishing`) {
    elements.rosterStatus.textContent = t(`publishing`);
    elements.rosterStatus.className = `status-badge is-publishing`;
    elements.rosterMeta.textContent = t(`publishingCopy`)
      .replace(
        `{completed}`,
        String(currentRoster.publishCompleted || 0)
      )
      .replace(`{total}`, String(currentRoster.publishTotal || 0));
    elements.publishRosterButton.textContent = t(`resumePublishing`);
    elements.publishRosterButton.disabled = false;
  } else if (currentRoster?.status === `published`) {
    elements.rosterStatus.textContent = t(`published`);
    elements.rosterStatus.className = `status-badge is-published`;
    elements.rosterMeta.textContent = t(`publishedCopy`);
    elements.publishRosterButton.disabled = true;
  } else {
    elements.rosterStatus.textContent = t(`unsavedDraft`);
    elements.rosterStatus.className = `status-badge is-draft`;
    elements.rosterMeta.textContent = t(`draftCopy`);
    elements.publishRosterButton.disabled = true;
  }
  renderConflicts([]);
};

const renderConflicts = conflicts => {
  lastConflicts = conflicts || [];
  if (!elements.conflictList) return;
  if (!lastConflicts.length) {
    elements.conflictList.innerHTML = `
      <div class="conflict-item">
        <span>✓</span>
        <span>${escapeHtml(t(`noConflicts`))}</span>
      </div>
    `;
    return;
  }
  elements.conflictList.innerHTML = lastConflicts.map(conflict => {
    const employee = employeeById(conflict.employeeId);
    return `
      <div class="conflict-item${conflict.severity === `block` ? ` is-block` : ``}">
        <strong>${escapeHtml(conflict.severity.toUpperCase())}</strong>
        <span>${escapeHtml(localized(employee, `fullName`))} · ${escapeHtml(conflict.code.replaceAll(`_`, ` `))} · ${escapeHtml(conflict.detail)}</span>
      </div>
    `;
  }).join(``);
};

const refreshManagerPage = async () => {
  rosters = await loadRosters(selectedWeek, addDays(selectedWeek, 6));
  const scopeManagerId = selectedScopeManager();
  const matchingRosters = rosters.filter(roster => (
    roster.startDate === selectedWeek
    && roster.ownerUid === state.user.uid
    && (!isAdmin() || roster.managerEmployeeId === scopeManagerId)
  ));
  currentRoster = [`publishing`, `draft`, `published`]
    .map(status => matchingRosters.find(roster => roster.status === status))
    .find(Boolean) || null;
  plannerEmployees = employeesForPlanner();
  const sourceAssignments = currentRoster
    && [`draft`, `publishing`].includes(currentRoster.status)
    ? (await loadRosterAssignments(currentRoster.id)).filter(assignment => (
        Number(assignment.rosterRevision || 0)
          === Number(currentRoster.revision || 0)
      ))
    : (await loadScheduleRange(selectedWeek, addDays(selectedWeek, 6), {
        includeDrafts: true
      })).filter(assignment => assignment.status === `published`);
  hydrateSelections(sourceAssignments);
  renderPlanner();
};

const renderManagerScope = () => {
  if (!isAdmin() || !elements.plannerScope) return;
  elements.plannerScope.hidden = false;
  const current = elements.managerScopeFilter.value;
  elements.managerScopeFilter.innerHTML = `
    <option value="">${escapeHtml(t(`allEmployees`))}</option>
    ${managerCandidates().map(manager => `
      <option value="${escapeHtml(manager.id)}">${escapeHtml(localized(manager, `fullName`))} · ${escapeHtml(manager.id)}</option>
    `).join(``)}
  `;
  elements.managerScopeFilter.value = managerCandidates().some(item => item.id === current)
    ? current
    : ``;
};

const fillPolicyForm = () => {
  if (!elements.policyForm) return;
  const policy = state.policy;
  elements.policyTimezone.value = policy?.timezone || `Asia/Amman`;
  elements.weekStartsOn.value = String(policy?.weekStartsOn ?? 1);
  elements.workdayStart.value = policy?.workdayStart || `09:00`;
  elements.workdayEnd.value = policy?.workdayEnd || `17:00`;
  elements.dailyHours.value = Number(policy?.dailyMinutes || 480) / 60;
  elements.maxDailyHours.value = Number(policy?.maxDailyMinutes || 720) / 60;
  elements.maxWeeklyHours.value = Number(policy?.maxWeeklyMinutes || 2880) / 60;
  elements.minimumRestHours.value = Number(policy?.minRestMinutes || 660) / 60;
  elements.conflictMode.value = policy?.conflictMode || `block`;
  elements.holidayWorkMode.value = policy?.holidayWorkMode || `block`;
  elements.policyEffectiveFrom.value = policy?.effectiveFrom || dateKey(new Date());
  const workingDays = new Set(policy?.workingDays || [1, 2, 3, 4]);
  document.querySelectorAll(`[name="workingDay"]`).forEach(input => {
    input.checked = workingDays.has(Number(input.value));
  });
};

const renderTemplateList = () => {
  const records = state.templates;
  elements.templateEmpty.hidden = records.length > 0;
  elements.templateList.innerHTML = records.map(template => `
    <article class="admin-row">
      <span>
        <strong>${escapeHtml(template.code)} · ${escapeHtml(localized(template))}</strong>
        <small>${escapeHtml(t(template.kind))} · ${escapeHtml(hoursLabel(template.totalMinutes))}h · ${escapeHtml(t(template.status))}</small>
      </span>
      <span class="row-actions">
        <button class="mini-button" type="button" data-edit-template="${escapeHtml(template.id)}">${escapeHtml(t(`edit`))}</button>
      </span>
    </article>
  `).join(``);
};

const renderHolidayList = () => {
  const year = Number(elements.holidayCalendarYear.value || new Date().getFullYear());
  const records = state.holidays.filter(holiday => holiday.year === year);
  elements.holidayEmpty.hidden = records.length > 0;
  elements.holidayList.innerHTML = records.map(holiday => {
    const branch = state.branches.find(item => item.id === holiday.branchId);
    return `
      <article class="admin-row">
        <span>
          <strong>${escapeHtml(formatDate(holiday.date, { day: `numeric`, month: `short` }))} · ${escapeHtml(localized(holiday))}</strong>
          <small>${escapeHtml(branch ? localized(branch) : t(`companyWide`))} · ${escapeHtml(t(holiday.status))}</small>
        </span>
        <span class="row-actions">
          <button class="mini-button" type="button" data-edit-holiday="${escapeHtml(holiday.id)}">${escapeHtml(t(`edit`))}</button>
        </span>
      </article>
    `;
  }).join(``);
};

const renderRosterList = () => {
  elements.rosterEmpty.hidden = rosters.length > 0;
  elements.rosterList.innerHTML = rosters.slice(0, 20).map(roster => {
    const progress = roster.status === `publishing`
      ? ` · ${Number(roster.publishCompleted || 0)}/${Number(roster.publishTotal || 0)}`
      : ``;
    const badgeClass = roster.status === `published`
      ? `is-published`
      : roster.status === `publishing`
        ? `is-publishing`
        : roster.draftState === `saving`
          ? `is-saving`
          : `is-draft`;
    return `
      <article class="roster-row">
        <span>
          <strong>${escapeHtml(formatDate(roster.startDate, { day: `numeric`, month: `short` }))} – ${escapeHtml(formatDate(roster.endDate, { day: `numeric`, month: `short` }))}</strong>
          <small>${escapeHtml(t(roster.status))}${escapeHtml(progress)} · ${escapeHtml(roster.assignmentCount)} ${escapeHtml(t(`assignments`))}</small>
        </span>
        <span class="status-badge ${badgeClass}">${escapeHtml(t(roster.status === `draft` && roster.draftState === `saving` ? `saving` : roster.status))}</span>
      </article>
    `;
  }).join(``);
};

const renderReadiness = () => {
  const year = new Date().getFullYear();
  const policyReady = Boolean(state.settings?.activePolicyId && state.policy);
  const holidayReady = state.settings?.holidayCalendarYear === year;
  const templateReady = state.templates.some(template => template.status === `active`);
  const checks = [
    [elements.policyReady, policyReady],
    [elements.holidayReady, holidayReady],
    [elements.templateReady, templateReady],
    [elements.rosterReady, publishedRosterReady]
  ];
  checks.forEach(([element, ready]) => {
    element.classList.toggle(`is-ready`, ready);
    element.querySelector(`b`).textContent = ready ? `✓` : `○`;
  });
  elements.activateRequestsButton.disabled = !checks.every(([, ready]) => ready)
    || Boolean(state.settings?.requestServicesEnabled);
  elements.requestServiceStatus.textContent = state.settings?.requestServicesEnabled
    ? t(`active`)
    : t(`inactive`);
};

const renderAdmin = async () => {
  fillPolicyForm();
  elements.holidayCalendarYear.value = String(
    state.settings?.holidayCalendarYear || new Date().getFullYear()
  );
  rosters = await loadRosters();
  publishedRosterReady = rosters.some(roster => roster.status === `published`);
  elements.policyVersion.textContent = state.policy
    ? `v${state.policy.version}`
    : `—`;
  elements.activeTemplateCount.textContent = String(
    state.templates.filter(template => template.status === `active`).length
  );
  elements.activeHolidayCount.textContent = String(
    state.holidays.filter(holiday => holiday.status === `active`).length
  );
  elements.holidayYearLabel.textContent = state.settings?.holidayCalendarYear
    ? String(state.settings.holidayCalendarYear)
    : t(`calendarNotConfirmed`);
  renderTemplateList();
  renderHolidayList();
  renderRosterList();
  renderReadiness();
};

const rerenderDynamic = () => {
  if (!state.user) return;
  renderHeader();
  if (pageType === `employee`) renderEmployeeSchedule();
  if (pageType === `manager`) {
    renderManagerScope();
    renderPlanner();
  }
  if (pageType === `admin`) {
    elements.policyVersion.textContent = state.policy
      ? `v${state.policy.version}`
      : `—`;
    elements.activeTemplateCount.textContent = String(
      state.templates.filter(template => template.status === `active`).length
    );
    elements.activeHolidayCount.textContent = String(
      state.holidays.filter(holiday => holiday.status === `active`).length
    );
    elements.holidayYearLabel.textContent = state.settings?.holidayCalendarYear
      ? String(state.settings.holidayCalendarYear)
      : t(`calendarNotConfirmed`);
    renderTemplateList();
    renderHolidayList();
    renderRosterList();
    renderReadiness();
  }
};

const setLanguage = nextLanguage => {
  language = nextLanguage;
  safeStorage.set(storageKey, language);
  documentElement.lang = language;
  documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  auth.languageCode = language;
  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  if (elements.languageLabel) elements.languageLabel.textContent = t(`language`);
  rerenderDynamic();
};

const reveal = () => {
  elements.authLoader.hidden = true;
  elements.timeApp.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const openModal = element => {
  if (!element) return;
  element.hidden = false;
  document.body.classList.add(`modal-open`);
};

const closeModal = element => {
  if (!element) return;
  element.hidden = true;
  document.body.classList.remove(`modal-open`);
};

const openTemplateModal = template => {
  elements.templateForm.reset();
  elements.templateExistingId.value = template?.id || ``;
  elements.templateCode.disabled = Boolean(template);
  elements.templateCode.value = template?.code || ``;
  elements.templateKind.value = template?.kind || `standard`;
  elements.templateNameEn.value = template?.nameEn || ``;
  elements.templateNameAr.value = template?.nameAr || ``;
  elements.segmentOneStart.value = template?.segments?.[0]?.startTime || `09:00`;
  elements.segmentOneEnd.value = template?.segments?.[0]?.endTime || `17:00`;
  elements.segmentOneBreak.value = template?.segments?.[0]?.breakMinutes ?? 60;
  elements.segmentTwoStart.value = template?.segments?.[1]?.startTime || `18:00`;
  elements.segmentTwoEnd.value = template?.segments?.[1]?.endTime || `22:00`;
  elements.segmentTwoBreak.value = template?.segments?.[1]?.breakMinutes ?? 0;
  elements.flexWindowMinutes.value = template?.flexWindowMinutes ?? 60;
  elements.templateStatus.value = template?.status || `active`;
  elements.templateError.textContent = ``;
  syncTemplateKind();
  openModal(elements.templateModal);
};

const syncTemplateKind = () => {
  const kind = elements.templateKind?.value;
  document.querySelectorAll(`.split-field`).forEach(field => {
    field.hidden = kind !== `split`;
  });
  if (elements.flexWindowField) {
    elements.flexWindowField.hidden = kind !== `flexible`;
  }
};

const openHolidayModal = holiday => {
  elements.holidayForm.reset();
  elements.holidayExistingId.value = holiday?.id || ``;
  elements.holidayDate.value = holiday?.date || dateKey(new Date());
  elements.holidayNameEn.value = holiday?.nameEn || ``;
  elements.holidayNameAr.value = holiday?.nameAr || ``;
  elements.holidayStatus.value = holiday?.status || `active`;
  elements.holidayPaid.checked = holiday?.paid !== false;
  elements.holidayBranch.innerHTML = `
    <option value="">${escapeHtml(t(`allBranches`))}</option>
    ${state.branches.map(branch => `
      <option value="${escapeHtml(branch.id)}">${escapeHtml(localized(branch))}</option>
    `).join(``)}
  `;
  elements.holidayBranch.value = holiday?.branchId || ``;
  elements.holidayError.textContent = ``;
  openModal(elements.holidayModal);
};

const shiftWeek = async amount => {
  selectedWeek = addDays(selectedWeek, amount * 7);
  if (pageType === `employee`) {
    scheduleAssignments = await loadScheduleRange(
      selectedWeek,
      addDays(selectedWeek, 6)
    );
    renderEmployeeSchedule();
  }
  if (pageType === `manager`) await refreshManagerPage();
};

const bindCommonEvents = () => {
  elements.languageButton?.addEventListener(`click`, () => {
    setLanguage(language === `en` ? `ar` : `en`);
  });
  elements.signOutButton?.addEventListener(`click`, async () => {
    elements.signOutButton.disabled = true;
    try {
      await signOut(auth);
      window.location.replace(`./?v=${release}`);
    } catch (error) {
      console.error(`NASNA Time sign-out error.`, error);
      showToast(`signedOutError`);
      elements.signOutButton.disabled = false;
    }
  });
  elements.previousWeek?.addEventListener(`click`, () => shiftWeek(-1));
  elements.nextWeek?.addEventListener(`click`, () => shiftWeek(1));
  elements.currentWeek?.addEventListener(`click`, async () => {
    selectedWeek = weekStart(new Date());
    if (pageType === `employee`) {
      scheduleAssignments = await loadScheduleRange(
        selectedWeek,
        addDays(selectedWeek, 6)
      );
      renderEmployeeSchedule();
    }
    if (pageType === `manager`) await refreshManagerPage();
  });
};

const renderPlannerProgress = (mode, completed, total) => {
  const isPublishingProgress = mode === `publishing`;
  elements.rosterStatus.textContent = t(
    isPublishingProgress ? `publishing` : `saving`
  );
  elements.rosterStatus.className = `status-badge ${
    isPublishingProgress ? `is-publishing` : `is-saving`
  }`;
  elements.rosterMeta.textContent = t(
    isPublishingProgress ? `publishingCopy` : `savingCopy`
  )
    .replace(`{completed}`, String(completed))
    .replace(`{total}`, String(total));
  if (isPublishingProgress) {
    elements.publishRosterButton.textContent = t(`resumePublishing`);
  }
};

const bindManagerEvents = () => {
  elements.managerScopeFilter?.addEventListener(`change`, async () => {
    currentRoster = null;
    await refreshManagerPage();
  });
  elements.plannerGrid?.addEventListener(`change`, event => {
    if (event.target.matches(`.planner-select`)) {
      const employeeId = event.target.dataset.employeeId;
      const workDate = event.target.dataset.workDate;
      const locationSelect = [
        ...elements.plannerGrid.querySelectorAll(`[data-location-for]`)
      ].find(candidate => (
        candidate.dataset.locationFor === `${employeeId}__${workDate}`
      ));
      if (!locationSelect) return;
      locationSelect.disabled = !event.target.value;
      setSelection(
        employeeId,
        workDate,
        event.target.value,
        locationSelect.value
      );
      event.target.closest(`.planner-cell`).classList.toggle(
        `has-shift`,
        Boolean(event.target.value)
      );
      elements.publishRosterButton.disabled = true;
      elements.rosterStatus.textContent = t(`unsavedDraft`);
      elements.rosterMeta.textContent = t(`draftCopy`);
    }
    if (event.target.matches(`.planner-location`)) {
      const [employeeId, workDate] = event.target.dataset.locationFor.split(`__`);
      const current = plannerSelections[employeeId]?.[workDate];
      if (current) current.locationId = event.target.value;
      elements.publishRosterButton.disabled = true;
    }
  });
  elements.saveRosterButton?.addEventListener(`click`, async () => {
    elements.saveRosterButton.disabled = true;
    let savingContext = null;
    try {
      const rosterId = await saveRosterDraft({
        rosterId: currentRoster?.status === `draft` ? currentRoster.id : ``,
        startDate: selectedWeek,
        employeeIds: plannerEmployees.map(employee => employee.id),
        selections: plannerSelections,
        scopeManagerEmployeeId: selectedScopeManager(),
        onProgress: (completed, total, context) => {
          savingContext = context || savingContext;
          renderPlannerProgress(`saving`, completed, total);
        }
      });
      currentRoster = {
        id: rosterId,
        status: `draft`,
        draftState: `ready`,
        ownerUid: state.user.uid,
        startDate: selectedWeek,
        managerEmployeeId: selectedScopeManager()
      };
      showToast(`rosterSaved`);
      await refreshManagerPage();
    } catch (error) {
      console.error(`NASNA roster save error.`, error);
      if (savingContext?.rosterId) {
        currentRoster = {
          ...(currentRoster || {}),
          id: savingContext.rosterId,
          revision: savingContext.revision,
          status: `draft`,
          draftState: `saving`,
          ownerUid: state.user.uid,
          startDate: selectedWeek,
          managerEmployeeId: selectedScopeManager()
        };
        elements.rosterStatus.textContent = t(`saving`);
        elements.rosterStatus.className = `status-badge is-saving`;
        elements.rosterMeta.textContent = t(`incompleteDraftCopy`);
        elements.publishRosterButton.disabled = true;
      }
      if (error.message === `roster-changed`) {
        try {
          await refreshManagerPage();
        } catch (refreshError) {
          console.warn(
            `NASNA roster refresh after concurrent save.`,
            refreshError
          );
        }
      }
      showToast(errorKey(error));
    } finally {
      elements.saveRosterButton.textContent = t(`saveDraft`);
      elements.saveRosterButton.disabled =
        currentRoster?.status === `publishing`;
    }
  });
  elements.publishRosterButton?.addEventListener(`click`, async () => {
    if (!currentRoster) return;
    elements.publishRosterButton.disabled = true;
    try {
      await publishRoster(
        currentRoster.id,
        ``,
        (completed, total) => {
          renderPlannerProgress(`publishing`, completed, total);
        }
      );
      showToast(`rosterPublished`);
      await refreshManagerPage();
    } catch (error) {
      console.error(`NASNA roster publish error.`, error);
      try {
        await refreshManagerPage();
      } catch (refreshError) {
        console.warn(
          `NASNA roster refresh after publish error.`,
          refreshError
        );
      }
      renderConflicts(error.conflicts || []);
      if (
        error.message === `roster-conflict-override-required`
        && isAdmin()
      ) {
        elements.overrideError.textContent = ``;
        openModal(elements.overrideModal);
      } else {
        showToast(errorKey(error));
      }
    } finally {
      elements.publishRosterButton.disabled = !currentRoster
        || ![`draft`, `publishing`].includes(currentRoster.status)
        || (
          currentRoster.status === `draft`
          && currentRoster.draftState !== `ready`
        );
    }
  });
  elements.overrideForm?.addEventListener(`submit`, async event => {
    event.preventDefault();
    const reason = elements.overrideReason.value.trim();
    if (reason.length < 8) {
      elements.overrideError.textContent = t(`overrideReason`);
      return;
    }
    try {
      await publishRoster(
        currentRoster.id,
        reason,
        (completed, total) => {
          renderPlannerProgress(`publishing`, completed, total);
        }
      );
      closeModal(elements.overrideModal);
      showToast(`rosterPublished`);
      await refreshManagerPage();
    } catch (error) {
      console.error(`NASNA roster override error.`, error);
      try {
        await refreshManagerPage();
      } catch (refreshError) {
        console.warn(
          `NASNA roster refresh after override error.`,
          refreshError
        );
      }
      elements.overrideError.textContent = t(errorKey(error));
    }
  });
  elements.closeOverrideModal?.addEventListener(`click`, () => closeModal(elements.overrideModal));
  elements.cancelOverride?.addEventListener(`click`, () => closeModal(elements.overrideModal));
};

const bindAdminEvents = () => {
  elements.policyForm?.addEventListener(`submit`, async event => {
    event.preventDefault();
    elements.policyError.textContent = ``;
    const submitButton = elements.policyForm.querySelector(`[type="submit"]`);
    submitButton.disabled = true;
    try {
      await publishPolicy({
        timezone: elements.policyTimezone.value,
        weekStartsOn: Number(elements.weekStartsOn.value),
        workdayStart: elements.workdayStart.value,
        workdayEnd: elements.workdayEnd.value,
        dailyMinutes: Number(elements.dailyHours.value) * 60,
        maxDailyMinutes: Number(elements.maxDailyHours.value) * 60,
        maxWeeklyMinutes: Number(elements.maxWeeklyHours.value) * 60,
        minRestMinutes: Number(elements.minimumRestHours.value) * 60,
        conflictMode: elements.conflictMode.value,
        holidayWorkMode: elements.holidayWorkMode.value,
        effectiveFrom: elements.policyEffectiveFrom.value,
        workingDays: [...document.querySelectorAll(`[name="workingDay"]:checked`)]
          .map(input => Number(input.value))
      });
      showToast(`policyPublished`);
      await renderAdmin();
    } catch (error) {
      console.error(`NASNA policy publish error.`, error);
      elements.policyError.textContent = t(errorKey(error));
    } finally {
      submitButton.disabled = false;
    }
  });
  elements.newTemplateButton?.addEventListener(`click`, () => openTemplateModal(null));
  elements.templateKind?.addEventListener(`change`, syncTemplateKind);
  elements.templateList?.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-edit-template]`);
    if (!button) return;
    openTemplateModal(state.templates.find(item => item.id === button.dataset.editTemplate));
  });
  elements.templateForm?.addEventListener(`submit`, async event => {
    event.preventDefault();
    elements.templateError.textContent = ``;
    const kind = elements.templateKind.value;
    const segments = [{
      startTime: elements.segmentOneStart.value,
      endTime: elements.segmentOneEnd.value,
      breakMinutes: Number(elements.segmentOneBreak.value)
    }];
    if (kind === `split`) {
      segments.push({
        startTime: elements.segmentTwoStart.value,
        endTime: elements.segmentTwoEnd.value,
        breakMinutes: Number(elements.segmentTwoBreak.value)
      });
    }
    try {
      await saveShiftTemplate({
        code: elements.templateCode.value,
        nameEn: elements.templateNameEn.value,
        nameAr: elements.templateNameAr.value,
        kind,
        segments,
        flexWindowMinutes: Number(elements.flexWindowMinutes.value),
        status: elements.templateStatus.value
      }, elements.templateExistingId.value);
      closeModal(elements.templateModal);
      showToast(`templateSaved`);
      renderTemplateList();
      renderReadiness();
    } catch (error) {
      console.error(`NASNA template save error.`, error);
      elements.templateError.textContent = t(errorKey(error));
    }
  });
  elements.closeTemplateModal?.addEventListener(`click`, () => closeModal(elements.templateModal));
  elements.cancelTemplate?.addEventListener(`click`, () => closeModal(elements.templateModal));
  elements.newHolidayButton?.addEventListener(`click`, () => openHolidayModal(null));
  elements.holidayList?.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-edit-holiday]`);
    if (!button) return;
    openHolidayModal(state.holidays.find(item => item.id === button.dataset.editHoliday));
  });
  elements.holidayForm?.addEventListener(`submit`, async event => {
    event.preventDefault();
    elements.holidayError.textContent = ``;
    try {
      await saveHoliday({
        date: elements.holidayDate.value,
        nameEn: elements.holidayNameEn.value,
        nameAr: elements.holidayNameAr.value,
        branchId: elements.holidayBranch.value,
        status: elements.holidayStatus.value,
        paid: elements.holidayPaid.checked
      }, elements.holidayExistingId.value);
      closeModal(elements.holidayModal);
      showToast(`holidaySaved`);
      renderHolidayList();
      renderReadiness();
    } catch (error) {
      console.error(`NASNA holiday save error.`, error);
      elements.holidayError.textContent = t(errorKey(error));
    }
  });
  elements.closeHolidayModal?.addEventListener(`click`, () => closeModal(elements.holidayModal));
  elements.cancelHoliday?.addEventListener(`click`, () => closeModal(elements.holidayModal));
  elements.holidayCalendarYear?.addEventListener(`change`, renderHolidayList);
  elements.confirmHolidayCalendar?.addEventListener(`click`, async () => {
    try {
      await confirmHolidayCalendar(Number(elements.holidayCalendarYear.value));
      showToast(`holidayConfirmed`);
      await renderAdmin();
    } catch (error) {
      console.error(`NASNA holiday confirmation error.`, error);
      showToast(errorKey(error));
    }
  });
  elements.activateRequestsButton?.addEventListener(`click`, async () => {
    elements.activateRequestsButton.disabled = true;
    try {
      await activateShiftRequestServices();
      showToast(`servicesActivated`);
      renderReadiness();
    } catch (error) {
      console.error(`NASNA shift service activation error.`, error);
      showToast(errorKey(error));
      renderReadiness();
    }
  });
};

const initialize = async user => {
  await loadTimeSession(user);
  selectedWeek = weekStart(new Date());
  if (pageType === `admin` && !isAdmin()) throw new Error(`hr-access-required`);
  if (pageType === `manager` && !isAdmin() && !isManager()) {
    throw new Error(`manager-access-required`);
  }
  renderHeader();
  if (pageType === `employee`) {
    scheduleAssignments = await loadScheduleRange(
      selectedWeek,
      addDays(selectedWeek, 6)
    );
    renderEmployeeSchedule();
  }
  if (pageType === `manager`) {
    renderManagerScope();
    await refreshManagerPage();
  }
  if (pageType === `admin`) await renderAdmin();
  setLanguage(language);
  reveal();
};

bindCommonEvents();
if (pageType === `manager`) bindManagerEvents();
if (pageType === `admin`) bindAdminEvents();
setLanguage(language);

const fallbackTimer = window.setTimeout(() => {
  window.location.replace(`./?v=${release}`);
}, 10000);

onAuthStateChanged(auth, async user => {
  window.clearTimeout(fallbackTimer);
  if (!user) {
    window.location.replace(`./?v=${release}`);
    return;
  }
  try {
    await initialize(user);
  } catch (error) {
    console.error(`NASNA Stage 11 initialization error.`, error);
    if ([`manager-access-required`, `hr-access-required`].includes(error.message)) {
      window.location.replace(`schedule.html?error=permission&v=${release}`);
      return;
    }
    await signOut(auth).catch(() => undefined);
    window.location.replace(`./?error=access-disabled&v=${release}`);
  }
});
