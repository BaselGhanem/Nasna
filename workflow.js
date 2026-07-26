import {
  addComment,
  auth,
  cancelDelegation,
  cancelRequest,
  createDelegation,
  createRequest,
  dateInputValue,
  deleteWorkflowDraft,
  decideRequest,
  directReports,
  durationHours,
  ensureDefaultConfiguration,
  ensureSlaNotifications,
  fulfillRequest,
  isAdmin,
  isManager,
  loadConfiguration,
  loadDelegations,
  loadHrRequests,
  loadManagerRequests,
  loadNotifications,
  loadOwnRequests,
  loadRequestById,
  loadRequestComments,
  loadRequestEvents,
  loadRequestTypeVersions,
  loadSession,
  markNotificationRead,
  onAuthStateChanged,
  overdue,
  publishWorkflowDraft,
  reconcileExpiredDelegations,
  release,
  requestTypeById,
  respondToInformation,
  retireRequestType,
  roleLabel,
  saveWorkflowDraft,
  signOut,
  state,
  submitDraft,
  terminalStatuses,
  toDate,
  withdrawRequest,
  workflowById
} from "./workflow-core.js?v=20260726.4";

const pageType = document.body.dataset.page || `requests`;
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
    checkingAccess: `Checking your secure access…`,
    dashboard: `Dashboard`,
    myProfile: `My profile`,
    myRequests: `My requests`,
    approvalInbox: `Approval inbox`,
    hrOperations: `HR operations`,
    signOut: `Sign out`,
    signedInAs: `Signed in as`,
    managingAs: `Managing as`,
    employeeSelfService: `Employee self-service`,
    requestsTitle: `Requests & services`,
    requestsCopy: `Start a request, follow every step, answer questions, and keep a complete history in one place.`,
    trackedFromStart: `Tracked from submission to completion`,
    trackedCopy: `Your manager approves when required. HR alone performs final employee, document, or movement changes.`,
    stage10: `Stage 10 · Requests`,
    totalRequests: `Total requests`,
    allYourRequests: `All your requests`,
    inProgress: `In progress`,
    awaitingAction: `Awaiting an action`,
    needsYourReply: `Needs your reply`,
    informationRequested: `Information requested`,
    completed: `Completed`,
    closedSuccessfully: `Closed successfully`,
    serviceCatalog: `Service catalog`,
    startRequest: `Start a request`,
    catalogCopy: `Only Stage 10 services are active. Leave, attendance, payroll, and other future services stay hidden until their stages.`,
    catalogNotReady: `Service catalog is not ready`,
    catalogNotReadyCopy: `An HR administrator needs to initialize the published Stage 10 request definitions.`,
    requestHistory: `Request history`,
    searchRequests: `Search requests`,
    allStatuses: `All statuses`,
    noRequests: `No requests yet`,
    noRequestsCopy: `Choose a service to save a draft or submit your first request.`,
    loadMore: `Load more`,
    newRequest: `New request`,
    restrictedNotice: `This request bypasses the manager and is visible only to you and authorized HR staff.`,
    priority: `Priority`,
    priorityNormal: `Normal`,
    priorityHigh: `High`,
    priorityUrgent: `Urgent`,
    cancel: `Cancel`,
    saveDraft: `Save draft`,
    submitRequest: `Submit request`,
    requestSummary: `Request summary`,
    submittedInformation: `Submitted information`,
    conversation: `Conversation`,
    writeComment: `Write a comment`,
    addComment: `Add comment`,
    timeline: `Timeline`,
    availableActions: `Available actions`,
    provideInformation: `Provide the requested information`,
    sendInformation: `Send information`,
    updates: `Updates`,
    notifications: `Notifications`,
    noNotifications: `No notifications`,
    noNotificationsCopy: `Assignment and status updates will appear here.`,
    managerWorkspace: `Manager workspace`,
    approvalsCopy: `Review requests assigned to you and track non-confidential team requests without editing employee records.`,
    managerBoundary: `Approval is separate from employee administration`,
    managerBoundaryCopy: `You approve, reject, or request information. HR alone fulfills changes. Your own requests go to your upper manager or HR fallback and never to you.`,
    noSelfApproval: `No self-approval`,
    assignedToYou: `Assigned to you`,
    openApprovalTasks: `Open approval tasks`,
    overdue: `Overdue`,
    pastDueDate: `Past the due date`,
    teamRequests: `Team requests`,
    visibleTeamRequests: `Visible non-confidential requests`,
    awaitingInformation: `Awaiting information`,
    returnedToEmployees: `Returned to employees`,
    decisionQueue: `Decision queue`,
    inboxClear: `Your inbox is clear`,
    inboxClearCopy: `New requests assigned to you will appear here.`,
    coverage: `Coverage`,
    approvalDelegation: `Approval delegation`,
    delegationCopy: `Record temporary coverage. It never changes your employee or manager identity.`,
    newDelegation: `New`,
    noDelegations: `No delegations`,
    noDelegationsCopy: `Add coverage only when another authorized manager will handle your approvals.`,
    newDelegationTitle: `Create approval delegation`,
    delegationFormCopy: `Choose an active company manager and a bounded coverage period.`,
    delegate: `Delegate`,
    startDate: `Start date`,
    endDate: `End date`,
    createDelegation: `Create delegation`,
    decision: `Decision`,
    decisionNote: `Decision note`,
    decisionNotePlaceholder: `Add a clear note`,
    approve: `Approve`,
    requestInformation: `Request information`,
    reject: `Reject`,
    hrWorkspace: `HR operations workspace`,
    hrOperationsTitle: `Requests, fulfillment & control`,
    hrOperationsCopy: `Operate the company request queue, apply approved outcomes, inspect immutable workflow versions, and monitor service performance.`,
    atomicFulfillment: `Atomic fulfillment with an immutable audit trail`,
    atomicFulfillmentCopy: `Completing a data, document, or movement request updates the owning Stage 7–9 record and the Stage 10 request in one transaction linked by request ID.`,
    tenantIsolated: `Tenant isolated`,
    openQueue: `Open queue`,
    nonTerminalRequests: `Non-terminal requests`,
    assignedToHr: `Assigned to HR`,
    readyForHr: `Ready for HR action`,
    neverAutoApproved: `Never auto-approved`,
    fulfilledRequests: `Fulfilled requests`,
    operations: `Operations`,
    workflowConfiguration: `Workflow configuration`,
    serviceReporting: `Service reporting`,
    companyRequestQueue: `Company request queue`,
    queueClear: `The queue is clear`,
    queueClearCopy: `Requests will appear as employees and managers submit them.`,
    serviceControls: `Service controls`,
    operatingRules: `Operating rules`,
    noAutomaticApproval: `No automatic approval`,
    enforced: `Enforced`,
    noAutomaticApprovalCopy: `An SLA breach is highlighted but never changes the decision.`,
    restrictedRequests: `Restricted requests`,
    hrOnly: `HR only`,
    restrictedRequestsCopy: `Confidential requests bypass the reporting line and never appear in a manager team view.`,
    sparkSafe: `Firebase Spark safe`,
    inApp: `In-app`,
    sparkSafeCopy: `Notifications are in-app. Overdue state is calculated when the workspace opens because no paid scheduler is used.`,
    publishedVersions: `Published versions`,
    requestTypesAndWorkflows: `Request types & workflows`,
    immutableVersionCopy: `Published versions are immutable. A future change must create a new version so historical requests keep their original definition.`,
    newRequestType: `New request type`,
    configurationDrafts: `Configuration drafts`,
    draftPreviewPublish: `Draft, preview & publish`,
    noConfigurationDrafts: `No configuration drafts.`,
    configurationDesigner: `Configuration designer`,
    requestTypeDraft: `Request type draft`,
    configurationDesignerCopy: `Build and preview a controlled request version. Publishing makes it immutable.`,
    configurationCode: `Code`,
    configurationSla: `Total SLA hours`,
    nameEnglish: `English name`,
    nameArabic: `Arabic name`,
    descriptionEnglish: `English description`,
    descriptionArabic: `Arabic description`,
    category: `Category`,
    confidentiality: `Confidentiality`,
    normalVisibility: `Normal`,
    restrictedVisibility: `Restricted · HR only`,
    subjectMode: `Subject`,
    employeeSelf: `Employee self`,
    directReport: `Direct report`,
    initialResolver: `Initial resolver`,
    formFields: `Form fields`,
    controlledFormSchema: `Controlled form schema`,
    addField: `Add field`,
    preview: `Preview`,
    publishedImmutable: `After publishing, changes require a new version.`,
    editDraft: `Edit draft`,
    publishVersion: `Publish version`,
    deleteDraft: `Delete draft`,
    retireVersion: `Retire version`,
    draftSaved: `Configuration draft saved.`,
    versionPublished: `New immutable version published.`,
    versionRetired: `Request version retired.`,
    configurationDraftDeleted: `Configuration draft deleted.`,
    confirmPublishVersion: `Publish this version? It cannot be edited afterwards.`,
    confirmRetireVersion: `Retire this version? Existing requests keep their original workflow.`,
    confirmDeleteDraft: `Delete this configuration draft?`,
    fieldKey: `Field key`,
    fieldType: `Field type`,
    fieldNameEn: `English label`,
    fieldNameAr: `Arabic label`,
    required: `Required`,
    operationalReport: `Operational report`,
    exportCsv: `Export CSV`,
    reportExported: `CSV report exported.`,
    requestVolume: `Request volume`,
    requestVolumeCopy: `All requests in the current company.`,
    medianCycleTime: `Median cycle time`,
    medianCycleTimeCopy: `Median submitted-to-completed duration.`,
    p90CycleTime: `P90 cycle time`,
    p90CycleTimeCopy: `90% of completed requests finish within this time.`,
    slaCompliance: `SLA compliance`,
    slaComplianceCopy: `Open or completed requests that stayed within due time.`,
    informationReturnRate: `Information return rate`,
    informationReturnRateCopy: `Requests that needed additional employee information.`,
    rejectionRate: `Rejection rate`,
    rejectionRateCopy: `Rejected requests as a share of submitted requests.`,
    hrOnlyComment: `HR-only note`,
    hrAction: `HR action`,
    futureMovementNotice: `A future-dated movement stays pending until its effective date. Spark does not run a paid background scheduler.`,
    fulfillmentNote: `Fulfillment note`,
    fulfillmentNotePlaceholder: `Describe what HR completed`,
    reference: `Reference`,
    referencePlaceholder: `Letter number, external reference, or secure link`,
    completeAndApply: `Complete & apply`,
    cancelRequest: `Cancel request`,
    routeManager: `Manager approval`,
    routeHr: `HR fulfillment`,
    managerOnly: `Managers only`,
    restricted: `Restricted`,
    sla: `SLA`,
    version: `Version`,
    type: `Type`,
    requester: `Requester`,
    subjectEmployee: `Subject employee`,
    status: `Status`,
    submitted: `Submitted`,
    due: `Due`,
    route: `Route`,
    requestNumber: `Request number`,
    created: `Created`,
    notSubmitted: `Not submitted`,
    noDueDate: `No due date`,
    view: `View`,
    submit: `Submit`,
    withdraw: `Withdraw`,
    noComments: `No comments yet.`,
    noTimeline: `No timeline events yet.`,
    cancelDelegation: `Cancel`,
    active: `Active`,
    cancelled: `Cancelled`,
    delegatedTo: `Delegated to`,
    from: `From`,
    to: `to`,
    noEmployeeFile: `Your account needs an employee file before it can create a request.`,
    teamRequestNeedsManager: `This service is available only to managers with direct reports.`,
    noIndependentHr: `A request cannot be routed to its own requester. Add another active HR administrator or an upper manager.`,
    requiredField: `Complete all required fields.`,
    informationResponseRequired: `Enter the requested information before sending your response.`,
    decisionNoteRequired: `Add a clear reason before completing this decision.`,
    fulfillmentEvidenceRequired: `Add a fulfillment note or reference before completing this request.`,
    configurationCodeInvalid: `Use a code that starts with a letter and contains only lowercase letters, numbers, or underscores.`,
    configurationNameRequired: `Add both the English and Arabic request names.`,
    configurationDescriptionTooLong: `Keep each description within 500 characters.`,
    configurationCategoryInvalid: `Choose a valid request category.`,
    configurationSlaInvalid: `Enter an SLA between 1 and 8,760 hours.`,
    configurationFieldRequired: `Add at least one controlled form field.`,
    configurationFieldInvalid: `Each field needs a unique key and both English and Arabic labels.`,
    configurationDraftMissing: `This configuration draft no longer exists. Refresh and try again.`,
    configurationVersionConflict: `A newer version already exists. Refresh the configuration before publishing.`,
    confirmApprove: `Approve this request and move it to the next step?`,
    confirmReject: `Reject this request? The decision will be recorded permanently.`,
    confirmInformation: `Return this request to the employee for more information?`,
    confirmFulfill: `Complete this request and apply its linked outcome?`,
    confirmCancel: `Cancel this request? The reason will be recorded permanently.`,
    oneContactField: `Enter at least one contact field to update.`,
    expiryBeforeIssue: `Expiry date cannot be earlier than issue date.`,
    invalidTransition: `This request changed or the action is no longer available. Refresh and try again.`,
    genericError: `The action could not be completed. Try again.`,
    requestCreated: `Request submitted successfully.`,
    draftCreated: `Draft saved successfully.`,
    draftSubmitted: `Draft submitted successfully.`,
    requestWithdrawn: `Request withdrawn.`,
    informationSent: `Information sent.`,
    decisionSaved: `Decision saved.`,
    requestCompleted: `Request completed and linked to its owning record.`,
    requestCancelled: `Request cancelled.`,
    commentAdded: `Comment added.`,
    delegationCreated: `Delegation created.`,
    delegationCancelled: `Delegation cancelled.`,
    invalidDelegationDates: `Choose a start date no later than today and a future end date.`,
    delegateMissing: `Choose an active manager or HR administrator as the delegate.`,
    delegationBatchLimit: `More than 80 open approvals need reassignment. Complete some approvals before creating or ending this delegation.`,
    noPermission: `You do not have access to this workspace.`,
    signedOutError: `Sign-out could not be completed.`,
    statusDRAFT: `Draft`,
    statusSUBMITTED: `Submitted`,
    statusPENDING_APPROVAL: `Pending approval`,
    statusNEEDS_INFORMATION: `Needs information`,
    statusPENDING_FULFILLMENT: `Pending fulfillment`,
    statusAPPROVED: `Approved`,
    statusCOMPLETED: `Completed`,
    statusREJECTED: `Rejected`,
    statusWITHDRAWN: `Withdrawn`,
    statusCANCELLED: `Cancelled`,
    language: `العربية`,
    hours: `h`,
    noValue: `—`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من صلاحية الدخول…`,
    dashboard: `الرئيسية`,
    myProfile: `ملفي`,
    myRequests: `طلباتي`,
    approvalInbox: `صندوق الموافقات`,
    hrOperations: `عمليات HR`,
    signOut: `تسجيل الخروج`,
    signedInAs: `المستخدم الحالي`,
    managingAs: `تدير الفريق بصفتك`,
    employeeSelfService: `الخدمة الذاتية للموظف`,
    requestsTitle: `الطلبات والخدمات`,
    requestsCopy: `ابدأ طلبًا، وتابع كل خطوة، وأجب عن الاستفسارات، واحتفظ بسجل كامل في مكان واحد.`,
    trackedFromStart: `متابعة من الإرسال حتى الاكتمال`,
    trackedCopy: `يوافق المدير عند الحاجة، وHR وحده ينفّذ التغييرات النهائية على الموظف أو الوثيقة أو الحركة.`,
    stage10: `المرحلة 10 · الطلبات`,
    totalRequests: `إجمالي الطلبات`,
    allYourRequests: `جميع طلباتك`,
    inProgress: `قيد المعالجة`,
    awaitingAction: `بانتظار إجراء`,
    needsYourReply: `بحاجة إلى ردك`,
    informationRequested: `تم طلب معلومات`,
    completed: `مكتملة`,
    closedSuccessfully: `أُغلقت بنجاح`,
    serviceCatalog: `دليل الخدمات`,
    startRequest: `ابدأ طلبًا`,
    catalogCopy: `خدمات المرحلة 10 فقط مفعلة. الإجازات والحضور والرواتب والخدمات المستقبلية مخفية حتى مراحلها.`,
    catalogNotReady: `دليل الخدمات غير جاهز`,
    catalogNotReadyCopy: `يجب على مسؤول HR تهيئة تعريفات الطلبات المنشورة للمرحلة 10.`,
    requestHistory: `سجل الطلبات`,
    searchRequests: `ابحث في الطلبات`,
    allStatuses: `كل الحالات`,
    noRequests: `لا توجد طلبات بعد`,
    noRequestsCopy: `اختر خدمة لحفظ مسودة أو إرسال أول طلب.`,
    loadMore: `تحميل المزيد`,
    newRequest: `طلب جديد`,
    restrictedNotice: `يتجاوز هذا الطلب المدير ولا يظهر إلا لك ولموظفي HR المخولين.`,
    priority: `الأولوية`,
    priorityNormal: `عادية`,
    priorityHigh: `مرتفعة`,
    priorityUrgent: `عاجلة`,
    cancel: `إلغاء`,
    saveDraft: `حفظ كمسودة`,
    submitRequest: `إرسال الطلب`,
    requestSummary: `ملخص الطلب`,
    submittedInformation: `المعلومات المقدمة`,
    conversation: `المحادثة`,
    writeComment: `اكتب تعليقًا`,
    addComment: `إضافة تعليق`,
    timeline: `الخط الزمني`,
    availableActions: `الإجراءات المتاحة`,
    provideInformation: `اكتب المعلومات المطلوبة`,
    sendInformation: `إرسال المعلومات`,
    updates: `التحديثات`,
    notifications: `الإشعارات`,
    noNotifications: `لا توجد إشعارات`,
    noNotificationsCopy: `ستظهر هنا إشعارات التعيين وتغير الحالة.`,
    managerWorkspace: `مساحة المدير`,
    approvalsCopy: `راجع الطلبات المعينة لك وتابع طلبات فريقك غير السرية دون تعديل ملفات الموظفين.`,
    managerBoundary: `الموافقة منفصلة عن إدارة بيانات الموظف`,
    managerBoundaryCopy: `أنت توافق أو ترفض أو تطلب معلومات، وHR وحده ينفذ. طلباتك الشخصية تذهب لمديرك الأعلى أو إلى HR ولا تظهر لك.`,
    noSelfApproval: `لا موافقة ذاتية`,
    assignedToYou: `معينة لك`,
    openApprovalTasks: `مهام موافقة مفتوحة`,
    overdue: `متأخرة`,
    pastDueDate: `تجاوزت موعدها`,
    teamRequests: `طلبات الفريق`,
    visibleTeamRequests: `الطلبات غير السرية الظاهرة`,
    awaitingInformation: `بانتظار معلومات`,
    returnedToEmployees: `أُعيدت للموظفين`,
    decisionQueue: `قائمة القرارات`,
    inboxClear: `صندوقك فارغ`,
    inboxClearCopy: `ستظهر هنا الطلبات الجديدة المعينة لك.`,
    coverage: `التغطية`,
    approvalDelegation: `تفويض الموافقات`,
    delegationCopy: `سجّل تغطية مؤقتة دون تغيير هويتك كموظف أو مدير.`,
    newDelegation: `جديد`,
    noDelegations: `لا توجد تفويضات`,
    noDelegationsCopy: `أضف تغطية فقط عندما يتولى مدير مخول موافقاتك.`,
    newDelegationTitle: `إنشاء تفويض موافقات`,
    delegationFormCopy: `اختر مديرًا فعالًا وحدد فترة تغطية واضحة.`,
    delegate: `المفوّض إليه`,
    startDate: `تاريخ البداية`,
    endDate: `تاريخ النهاية`,
    createDelegation: `إنشاء التفويض`,
    decision: `القرار`,
    decisionNote: `ملاحظة القرار`,
    decisionNotePlaceholder: `اكتب ملاحظة واضحة`,
    approve: `موافقة`,
    requestInformation: `طلب معلومات`,
    reject: `رفض`,
    hrWorkspace: `مساحة عمليات HR`,
    hrOperationsTitle: `الطلبات والتنفيذ والضبط`,
    hrOperationsCopy: `أدر قائمة طلبات الشركة، ونفّذ النتائج المعتمدة، وراجع نسخ مسارات العمل الثابتة، وتابع أداء الخدمة.`,
    atomicFulfillment: `تنفيذ ذري مع سجل تدقيق غير قابل للتعديل`,
    atomicFulfillmentCopy: `إكمال طلب بيانات أو وثيقة أو حركة يحدّث سجل المرحلة 7–9 والطلب في المرحلة 10 ضمن معاملة واحدة مرتبطة بمعرّف الطلب.`,
    tenantIsolated: `عزل بيانات الشركة`,
    openQueue: `الطلبات المفتوحة`,
    nonTerminalRequests: `طلبات غير نهائية`,
    assignedToHr: `معينة إلى HR`,
    readyForHr: `جاهزة لإجراء HR`,
    neverAutoApproved: `لا تُعتمد تلقائيًا`,
    fulfilledRequests: `طلبات منفذة`,
    operations: `العمليات`,
    workflowConfiguration: `إعداد المسارات`,
    serviceReporting: `تقارير الخدمة`,
    companyRequestQueue: `قائمة طلبات الشركة`,
    queueClear: `القائمة فارغة`,
    queueClearCopy: `ستظهر الطلبات عندما يرسلها الموظفون والمديرون.`,
    serviceControls: `ضوابط الخدمة`,
    operatingRules: `قواعد التشغيل`,
    noAutomaticApproval: `لا موافقة تلقائية`,
    enforced: `مطبّق`,
    noAutomaticApprovalCopy: `يُبرز تجاوز SLA لكنه لا يغيّر القرار.`,
    restrictedRequests: `طلبات مقيّدة`,
    hrOnly: `HR فقط`,
    restrictedRequestsCopy: `تتجاوز الطلبات السرية التسلسل الإداري ولا تظهر للمدير.`,
    sparkSafe: `متوافق مع Firebase Spark`,
    inApp: `داخل النظام`,
    sparkSafeCopy: `الإشعارات داخل النظام، ويُحسب التأخير عند فتح المساحة لعدم استخدام مجدول مدفوع.`,
    publishedVersions: `النسخ المنشورة`,
    requestTypesAndWorkflows: `أنواع الطلبات ومساراتها`,
    immutableVersionCopy: `النسخة المنشورة ثابتة. أي تغيير لاحق ينشئ نسخة جديدة كي تحتفظ الطلبات القديمة بتعريفها الأصلي.`,
    newRequestType: `نوع طلب جديد`,
    configurationDrafts: `مسودات الإعداد`,
    draftPreviewPublish: `مسودة ومعاينة ونشر`,
    noConfigurationDrafts: `لا توجد مسودات إعداد.`,
    configurationDesigner: `مصمم الإعداد`,
    requestTypeDraft: `مسودة نوع طلب`,
    configurationDesignerCopy: `ابنِ نسخة طلب مضبوطة وعاينها. تصبح ثابتة بعد النشر.`,
    configurationCode: `الرمز`,
    configurationSla: `إجمالي ساعات الخدمة`,
    nameEnglish: `الاسم بالإنجليزية`,
    nameArabic: `الاسم بالعربية`,
    descriptionEnglish: `الوصف بالإنجليزية`,
    descriptionArabic: `الوصف بالعربية`,
    category: `التصنيف`,
    confidentiality: `السرّية`,
    normalVisibility: `عادي`,
    restrictedVisibility: `مقيّد · HR فقط`,
    subjectMode: `موضوع الطلب`,
    employeeSelf: `الموظف نفسه`,
    directReport: `موظف يتبع للمدير`,
    initialResolver: `الجهة الأولى`,
    formFields: `حقول النموذج`,
    controlledFormSchema: `بنية نموذج مضبوطة`,
    addField: `إضافة حقل`,
    preview: `المعاينة`,
    publishedImmutable: `بعد النشر، يتطلب أي تعديل إنشاء نسخة جديدة.`,
    editDraft: `تعديل المسودة`,
    publishVersion: `نشر النسخة`,
    deleteDraft: `حذف المسودة`,
    retireVersion: `إيقاف النسخة`,
    draftSaved: `تم حفظ مسودة الإعداد.`,
    versionPublished: `تم نشر نسخة ثابتة جديدة.`,
    versionRetired: `تم إيقاف نسخة الطلب.`,
    configurationDraftDeleted: `تم حذف مسودة الإعداد.`,
    confirmPublishVersion: `هل تريد نشر هذه النسخة؟ لن يمكن تعديلها بعد ذلك.`,
    confirmRetireVersion: `هل تريد إيقاف هذه النسخة؟ تحتفظ الطلبات الحالية بمسارها الأصلي.`,
    confirmDeleteDraft: `هل تريد حذف مسودة الإعداد؟`,
    fieldKey: `رمز الحقل`,
    fieldType: `نوع الحقل`,
    fieldNameEn: `العنوان بالإنجليزية`,
    fieldNameAr: `العنوان بالعربية`,
    required: `مطلوب`,
    operationalReport: `التقرير التشغيلي`,
    exportCsv: `تصدير CSV`,
    reportExported: `تم تصدير تقرير CSV.`,
    requestVolume: `حجم الطلبات`,
    requestVolumeCopy: `كل طلبات الشركة الحالية.`,
    medianCycleTime: `وسيط زمن الإنجاز`,
    medianCycleTimeCopy: `وسيط المدة من الإرسال حتى الاكتمال.`,
    p90CycleTime: `زمن الإنجاز P90`,
    p90CycleTimeCopy: `90٪ من الطلبات المكتملة تنتهي ضمن هذه المدة.`,
    slaCompliance: `الالتزام بـ SLA`,
    slaComplianceCopy: `الطلبات المفتوحة أو المكتملة التي لم تتجاوز موعدها.`,
    informationReturnRate: `نسبة طلب معلومات إضافية`,
    informationReturnRateCopy: `الطلبات التي احتاجت معلومات إضافية من الموظف.`,
    rejectionRate: `نسبة الرفض`,
    rejectionRateCopy: `الطلبات المرفوضة من إجمالي الطلبات المرسلة.`,
    hrOnlyComment: `ملاحظة داخلية لـ HR`,
    hrAction: `إجراء HR`,
    futureMovementNotice: `تبقى الحركة المستقبلية معلقة حتى تاريخ سريانها. خطة Spark لا تشغل مجدولًا مدفوعًا بالخلفية.`,
    fulfillmentNote: `ملاحظة التنفيذ`,
    fulfillmentNotePlaceholder: `اشرح ما أنجزه HR`,
    reference: `المرجع`,
    referencePlaceholder: `رقم كتاب أو مرجع خارجي أو رابط آمن`,
    completeAndApply: `إكمال وتنفيذ`,
    cancelRequest: `إلغاء الطلب`,
    routeManager: `موافقة المدير`,
    routeHr: `تنفيذ HR`,
    managerOnly: `للمديرين فقط`,
    restricted: `مقيّد`,
    sla: `مدة الخدمة`,
    version: `النسخة`,
    type: `النوع`,
    requester: `مقدم الطلب`,
    subjectEmployee: `الموظف موضوع الطلب`,
    status: `الحالة`,
    submitted: `تاريخ الإرسال`,
    due: `موعد الإنجاز`,
    route: `المسار`,
    requestNumber: `رقم الطلب`,
    created: `تاريخ الإنشاء`,
    notSubmitted: `لم يُرسل`,
    noDueDate: `لا يوجد موعد`,
    view: `عرض`,
    submit: `إرسال`,
    withdraw: `سحب`,
    noComments: `لا توجد تعليقات بعد.`,
    noTimeline: `لا توجد أحداث زمنية بعد.`,
    cancelDelegation: `إلغاء`,
    active: `فعال`,
    cancelled: `ملغى`,
    delegatedTo: `مفوّض إلى`,
    from: `من`,
    to: `حتى`,
    noEmployeeFile: `يحتاج حسابك إلى ملف موظف قبل إنشاء طلب.`,
    teamRequestNeedsManager: `هذه الخدمة متاحة فقط لمدير لديه موظفون يتبعون له مباشرة.`,
    noIndependentHr: `لا يمكن توجيه الطلب إلى صاحبه. أضف مسؤول HR فعالًا آخر أو مديرًا أعلى.`,
    requiredField: `أكمل كل الحقول المطلوبة.`,
    informationResponseRequired: `أدخل المعلومات المطلوبة قبل إرسال الرد.`,
    decisionNoteRequired: `أضف سببًا واضحًا قبل إكمال هذا القرار.`,
    fulfillmentEvidenceRequired: `أضف ملاحظة تنفيذ أو مرجعًا قبل إكمال الطلب.`,
    configurationCodeInvalid: `استخدم رمزًا يبدأ بحرف ويحتوي أحرفًا إنجليزية صغيرة أو أرقامًا أو شرطة سفلية فقط.`,
    configurationNameRequired: `أدخل اسم الطلب بالإنجليزية والعربية.`,
    configurationDescriptionTooLong: `اجعل كل وصف ضمن 500 حرف.`,
    configurationCategoryInvalid: `اختر تصنيف طلب صحيحًا.`,
    configurationSlaInvalid: `أدخل مدة خدمة بين ساعة و8760 ساعة.`,
    configurationFieldRequired: `أضف حقلًا واحدًا على الأقل للنموذج.`,
    configurationFieldInvalid: `يحتاج كل حقل رمزًا فريدًا وعنوانًا بالإنجليزية والعربية.`,
    configurationDraftMissing: `لم تعد مسودة الإعداد موجودة. حدّث الصفحة وحاول مجددًا.`,
    configurationVersionConflict: `توجد نسخة أحدث. حدّث الإعداد قبل النشر.`,
    confirmApprove: `هل تريد الموافقة على الطلب ونقله إلى الخطوة التالية؟`,
    confirmReject: `هل تريد رفض الطلب؟ سيتم حفظ القرار بشكل دائم.`,
    confirmInformation: `هل تريد إعادة الطلب للموظف لاستكمال المعلومات؟`,
    confirmFulfill: `هل تريد إكمال الطلب وتطبيق النتيجة المرتبطة به؟`,
    confirmCancel: `هل تريد إلغاء الطلب؟ سيتم حفظ السبب بشكل دائم.`,
    oneContactField: `أدخل حقل اتصال واحدًا على الأقل لتحديثه.`,
    expiryBeforeIssue: `لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ الإصدار.`,
    invalidTransition: `تغير الطلب أو لم يعد الإجراء متاحًا. حدّث الصفحة وحاول مجددًا.`,
    genericError: `تعذر إكمال الإجراء. حاول مرة أخرى.`,
    requestCreated: `تم إرسال الطلب بنجاح.`,
    draftCreated: `تم حفظ المسودة بنجاح.`,
    draftSubmitted: `تم إرسال المسودة بنجاح.`,
    requestWithdrawn: `تم سحب الطلب.`,
    informationSent: `تم إرسال المعلومات.`,
    decisionSaved: `تم حفظ القرار.`,
    requestCompleted: `اكتمل الطلب وتم ربطه بالسجل المسؤول عنه.`,
    requestCancelled: `تم إلغاء الطلب.`,
    commentAdded: `تمت إضافة التعليق.`,
    delegationCreated: `تم إنشاء التفويض.`,
    delegationCancelled: `تم إلغاء التفويض.`,
    invalidDelegationDates: `اختر تاريخ بدء لا يتجاوز اليوم وتاريخ انتهاء لاحقًا.`,
    delegateMissing: `اختر مديرًا فعالًا أو مسؤول موارد بشرية كمفوّض.`,
    delegationBatchLimit: `يوجد أكثر من 80 موافقة مفتوحة تحتاج لإعادة تعيين. أغلق بعض الموافقات قبل إنشاء التفويض أو إنهائه.`,
    noPermission: `لا تملك صلاحية الوصول إلى هذه المساحة.`,
    signedOutError: `تعذر تسجيل الخروج.`,
    statusDRAFT: `مسودة`,
    statusSUBMITTED: `مرسل`,
    statusPENDING_APPROVAL: `بانتظار الموافقة`,
    statusNEEDS_INFORMATION: `بحاجة إلى معلومات`,
    statusPENDING_FULFILLMENT: `بانتظار التنفيذ`,
    statusAPPROVED: `موافق عليه`,
    statusCOMPLETED: `مكتمل`,
    statusREJECTED: `مرفوض`,
    statusWITHDRAWN: `مسحوب`,
    statusCANCELLED: `ملغى`,
    language: `English`,
    hours: `س`,
    noValue: `—`
  }
};

const elements = Object.fromEntries([
  `authLoader`,
  `workflowApp`,
  `languageButton`,
  `languageLabel`,
  `signOutButton`,
  `signedInAvatar`,
  `signedInEmail`,
  `approvalsNav`,
  `hrOperationsNav`,
  `notificationButton`,
  `notificationCount`,
  `notificationPanel`,
  `notificationBackdrop`,
  `closeNotifications`,
  `notificationList`,
  `notificationEmpty`,
  `catalogGrid`,
  `catalogEmpty`,
  `requestList`,
  `requestEmpty`,
  `requestSearch`,
  `requestStatusFilter`,
  `requestModal`,
  `requestModalTitle`,
  `requestModalDescription`,
  `closeRequestModal`,
  `cancelRequestForm`,
  `requestForm`,
  `requestFields`,
  `restrictedNotice`,
  `requestPriority`,
  `requestFormError`,
  `saveDraftButton`,
  `submitRequestButton`,
  `detailModal`,
  `closeDetailModal`,
  `detailNumber`,
  `detailTitle`,
  `detailSubtitle`,
  `detailSummary`,
  `detailPayload`,
  `detailTimeline`,
  `commentList`,
  `commentForm`,
  `commentBody`,
  `hrOnlyComment`,
  `detailActionSection`,
  `detailActions`,
  `informationForm`,
  `informationResponse`,
  `decisionForm`,
  `decisionNote`,
  `decisionError`,
  `fulfillmentReference`,
  `futureMovementNotice`,
  `toast`,
  `toastMessage`,
  `totalRequests`,
  `openRequests`,
  `needsReply`,
  `completedRequests`,
  `assignedCount`,
  `overdueCount`,
  `teamRequestCount`,
  `managerNeedsInfo`,
  `openDelegationButton`,
  `delegationList`,
  `delegationEmpty`,
  `delegationModal`,
  `closeDelegationModal`,
  `cancelDelegationForm`,
  `delegationForm`,
  `delegateUid`,
  `delegationStart`,
  `delegationEnd`,
  `delegationError`,
  `hrOpenCount`,
  `hrAssignedCount`,
  `hrOverdueCount`,
  `hrCompletedCount`,
  `configurationList`,
  `configurationCount`,
  `configurationDraftSection`,
  `configurationDraftList`,
  `configurationDraftCount`,
  `configurationDraftEmpty`,
  `openConfigurationButton`,
  `configurationModal`,
  `closeConfigurationModal`,
  `configurationForm`,
  `configurationCode`,
  `configurationSla`,
  `configurationNameEn`,
  `configurationNameAr`,
  `configurationDescriptionEn`,
  `configurationDescriptionAr`,
  `configurationCategory`,
  `configurationConfidentiality`,
  `configurationSubjectMode`,
  `configurationResolver`,
  `configurationFields`,
  `addConfigurationField`,
  `configurationPreview`,
  `configurationRoutePreview`,
  `configurationError`,
  `cancelConfigurationForm`,
  `saveConfigurationDraft`,
  `exportReportButton`,
  `reportVolume`,
  `reportMedian`,
  `reportP90`,
  `reportSla`,
  `reportSlaBar`,
  `reportInfoRate`,
  `reportRejectionRate`
].map(id => [id, document.getElementById(id)]));

let language = safeStorage.get(storageKey)
  || (navigator.language.startsWith(`ar`) ? `ar` : `en`);
let requests = [];
let requestPaging = {
  cursor: null,
  hasMore: false,
  loading: false
};
let notifications = [];
let delegations = [];
let activeTypeId = ``;
let activeRequestIdempotencyKey = ``;
let activeRequest = null;
let activeConfigurationDraftId = ``;
let toastTimer = null;

const translate = key => translations[language][key] || translations.en[key] || key;

const localized = (record, key) => (
  record?.[`${key}${language === `ar` ? `Ar` : `En`}`]
  || record?.[`${key}En`]
  || record?.[`${key}Ar`]
  || ``
);

const escapeHtml = value => String(value ?? ``)
  .replaceAll(`&`, `&amp;`)
  .replaceAll(`<`, `&lt;`)
  .replaceAll(`>`, `&gt;`)
  .replaceAll(`"`, `&quot;`)
  .replaceAll(`'`, `&#039;`);

const formatDate = value => {
  const date = toDate(value);
  if (!date) return translate(`noValue`);
  return new Intl.DateTimeFormat(language === `ar` ? `ar-JO` : `en-GB`, {
    dateStyle: `medium`,
    timeStyle: `short`
  }).format(date);
};

const formatDateOnly = value => {
  const date = toDate(value);
  if (!date) return translate(`noValue`);
  return new Intl.DateTimeFormat(language === `ar` ? `ar-JO` : `en-GB`, {
    dateStyle: `medium`
  }).format(date);
};

const initial = value => String(value || `U`).trim().charAt(0).toUpperCase() || `U`;

const statusLabel = status => translate(`status${status}`);
const routeLabel = route => route === `manager`
  ? translate(`routeManager`)
  : route === `hr`
    ? translate(`routeHr`)
    : translate(`notSubmitted`);

const showToast = (key, error = false) => {
  if (!elements.toast || !elements.toastMessage) return;
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = translate(key);
  elements.toast.classList.toggle(`is-error`, error);
  elements.toast.classList.add(`is-visible`);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4300);
};

const errorKey = error => ({
  [`employee-file-required`]: `noEmployeeFile`,
  [`independent-hr-required`]: `noIndependentHr`,
  [`required-field`]: `requiredField`,
  [`information-response-required`]: `informationResponseRequired`,
  [`decision-note-required`]: `decisionNoteRequired`,
  [`fulfillment-evidence-required`]: `fulfillmentEvidenceRequired`,
  [`configuration-code-invalid`]: `configurationCodeInvalid`,
  [`configuration-name-required`]: `configurationNameRequired`,
  [`configuration-description-too-long`]: `configurationDescriptionTooLong`,
  [`configuration-category-invalid`]: `configurationCategoryInvalid`,
  [`configuration-sla-invalid`]: `configurationSlaInvalid`,
  [`configuration-field-required`]: `configurationFieldRequired`,
  [`configuration-field-invalid`]: `configurationFieldInvalid`,
  [`configuration-draft-missing`]: `configurationDraftMissing`,
  [`configuration-version-conflict`]: `configurationVersionConflict`,
  [`one-contact-field-required`]: `oneContactField`,
  [`expiry-before-issue`]: `expiryBeforeIssue`,
  [`direct-report-only`]: `teamRequestNeedsManager`,
  [`invalid-transition`]: `invalidTransition`,
  [`movement-not-effective-yet`]: `futureMovementNotice`,
  [`invalid-delegation-dates`]: `invalidDelegationDates`,
  [`delegate-missing`]: `delegateMissing`,
  [`delegation-batch-limit`]: `delegationBatchLimit`,
  [`permission-denied`]: `noPermission`,
  [`FirebaseError: Missing or insufficient permissions.`]: `noPermission`
}[error?.message] || (
  String(error?.message || ``).includes(`permission`)
    ? `noPermission`
    : `genericError`
));

const setLanguage = nextLanguage => {
  language = nextLanguage;
  safeStorage.set(storageKey, language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  auth.languageCode = language;
  elements.languageLabel.textContent = translate(`language`);
  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll(`[data-i18n-placeholder]`).forEach(element => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });
  document.title = {
    requests: language === `ar` ? `طلباتي | ناسنا` : `My Requests | NASNA`,
    approvals: language === `ar` ? `صندوق الموافقات | ناسنا` : `Approval Inbox | NASNA`,
    hr: language === `ar` ? `عمليات HR | ناسنا` : `HR Operations | NASNA`
  }[pageType];
  renderCurrentPage();
  renderNotifications();
  if (activeRequest) renderDetail(activeRequest, false);
  if (elements.configurationModal && !elements.configurationModal.hidden) {
    const configuration = collectConfiguration();
    elements.configurationFields.innerHTML = configuration.formSchema
      .map(configurationFieldRow)
      .join(``);
    updateConfigurationPreview();
  }
};

const renderHeader = () => {
  elements.signedInEmail.textContent = state.user.email || state.user.uid;
  elements.signedInAvatar.textContent = initial(
    state.ownEmployee?.fullNameEn || state.user.email
  );
  if (elements.approvalsNav) elements.approvalsNav.hidden = !isManager();
  if (elements.hrOperationsNav) elements.hrOperationsNav.hidden = !isAdmin();
};

const requestTypeFor = record => (
  requestTypeById(record.typeId)
  || {
    id: record.typeId,
    nameEn: record.typeCode,
    nameAr: record.typeCode,
    formSchema: []
  }
);

const requestSearchMatches = record => {
  const queryValue = String(elements.requestSearch?.value || ``).trim().toLowerCase();
  const status = elements.requestStatusFilter?.value || ``;
  if (status && record.status !== status) return false;
  if (!queryValue) return true;
  const type = requestTypeFor(record);
  return [
    record.requestNumber,
    record.requesterName,
    record.subjectName,
    type.nameEn,
    type.nameAr,
    record.typeCode
  ].some(value => String(value || ``).toLowerCase().includes(queryValue));
};

const requestRow = record => {
  const type = requestTypeFor(record);
  const detailPerson = pageType === `requests`
    ? record.subjectName
    : `${record.requesterName} → ${record.subjectName}`;
  const late = overdue(record);
  return `
    <button class="request-row${late ? ` is-overdue` : ``}" type="button" data-request-id="${escapeHtml(record.id)}">
      <span class="request-row-main">
        <strong>${escapeHtml(localized(type, `name`))}</strong>
        <span>${escapeHtml(record.requestNumber)} · ${escapeHtml(detailPerson)}</span>
      </span>
      <span class="request-row-meta">
        <strong>${escapeHtml(routeLabel(record.routeKind))}</strong>
        <span>${late ? escapeHtml(translate(`overdue`)) : escapeHtml(formatDate(record.dueAt || record.createdAt))}</span>
      </span>
      <span class="request-row-actions">
        <span class="status-badge" data-status="${escapeHtml(record.status)}">${escapeHtml(statusLabel(record.status))}</span>
        ${pageType === `requests` && record.status === `DRAFT`
          ? `<span class="text-button" data-action="submit-draft">${escapeHtml(translate(`submit`))}</span>`
          : ``}
      </span>
    </button>
  `;
};

const requestPageLoader = options => (
  pageType === `requests`
    ? loadOwnRequests(options)
    : pageType === `approvals`
      ? loadManagerRequests(options)
      : loadHrRequests(options)
);

const loadRequestsPage = async (reset = true) => {
  if (requestPaging.loading || (!reset && !requestPaging.hasMore)) {
    return requests;
  }
  requestPaging.loading = true;
  try {
    const page = await requestPageLoader({
      pageSize: 50,
      cursor: reset ? null : requestPaging.cursor
    });
    const merged = new Map(
      (reset ? [] : requests).map(record => [record.id, record])
    );
    page.records.forEach(record => merged.set(record.id, record));
    requests = [...merged.values()].sort((left, right) => (
      (toDate(right.createdAt)?.getTime() || 0)
      - (toDate(left.createdAt)?.getTime() || 0)
    ));
    requestPaging.cursor = page.cursor;
    requestPaging.hasMore = page.hasMore;
    return requests;
  } finally {
    requestPaging.loading = false;
  }
};

const renderRequests = () => {
  if (!elements.requestList) return;
  const visible = requests.filter(requestSearchMatches);
  const loadMore = requestPaging.hasMore
    ? `
      <button class="load-more-button" type="button" data-action="load-more">
        ${escapeHtml(translate(`loadMore`))}
      </button>
    `
    : ``;
  elements.requestList.innerHTML = visible.map(requestRow).join(``) + loadMore;
  elements.requestEmpty.hidden = visible.length > 0 || requestPaging.hasMore;
};

const catalogIcon = code => ({
  general_hr: `<path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"/>`,
  contact_update: `<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2M18 5h3m-1.5-1.5v3"/>`,
  sensitive_data_update: `<path d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z"/><path d="M9 12h6"/>`,
  document_renewal: `<path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6m-6 4h4"/>`,
  letter_certificate: `<path d="M5 4h14v16H5zM8 8h8m-8 4h8"/><path d="m9 17 2 2 4-4"/>`,
  confidential_request: `<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
  team_movement: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2M15 17h6m-3-3 3 3-3 3"/>`,
  transaction_correction: `<path d="M5 6h14M5 12h9M5 18h7"/><path d="m15 17 2 2 4-5"/>`,
  custom_company_request: `<path d="M4 19h16M6 16V8h12v8M9 8V5h6v3"/><path d="M12 11v3m-1.5-1.5h3"/>`
}[code] || `<path d="M6 3h12v18H6zM9 8h6m-6 4h6"/>`);

const renderCatalog = () => {
  if (!elements.catalogGrid) return;
  const reports = directReports();
  const types = state.requestTypes.filter(type => (
    type.subjectMode !== `direct_report`
    || (isManager() && reports.length > 0)
  ));
  elements.catalogGrid.innerHTML = types.map(type => {
    const workflow = workflowById(type.workflowId);
    const classes = [
      `catalog-card`,
      type.confidentiality === `restricted` ? `is-restricted` : ``,
      type.subjectMode === `direct_report` ? `is-manager` : ``
    ].filter(Boolean).join(` `);
    return `
      <button class="${classes}" type="button" data-type-id="${escapeHtml(type.id)}">
        <span>
          <span class="catalog-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${catalogIcon(type.code)}</svg></span>
          <h3>${escapeHtml(localized(type, `name`))}</h3>
          <p>${escapeHtml(localized(type, `description`))}</p>
        </span>
        <span class="catalog-meta">
          <span class="mini-chip">${escapeHtml(translate(`sla`))}: ${escapeHtml(workflow?.slaHours || 24)}${escapeHtml(translate(`hours`))}</span>
          ${type.confidentiality === `restricted`
            ? `<span class="mini-chip mini-chip--restricted">${escapeHtml(translate(`restricted`))}</span>`
            : ``}
          ${type.subjectMode === `direct_report`
            ? `<span class="mini-chip">${escapeHtml(translate(`managerOnly`))}</span>`
            : ``}
        </span>
      </button>
    `;
  }).join(``);
  elements.catalogEmpty.hidden = types.length > 0;
};

const requestCount = value => `${value}${requestPaging.hasMore ? `+` : ``}`;

const renderRequestStats = () => {
  if (elements.totalRequests) elements.totalRequests.textContent = requestCount(requests.length);
  if (elements.openRequests) {
    elements.openRequests.textContent = requestCount(
      requests.filter(record => !terminalStatuses.has(record.status) && record.status !== `DRAFT`).length
    );
  }
  if (elements.needsReply) {
    elements.needsReply.textContent = requestCount(
      requests.filter(record => record.status === `NEEDS_INFORMATION`).length
    );
  }
  if (elements.completedRequests) {
    elements.completedRequests.textContent = requestCount(
      requests.filter(record => record.status === `COMPLETED`).length
    );
  }
};

const renderManagerStats = () => {
  const assigned = requests.filter(record => (
    record.status === `PENDING_APPROVAL`
    && record.currentAssigneeIds.includes(state.user.uid)
  ));
  if (elements.assignedCount) elements.assignedCount.textContent = requestCount(assigned.length);
  if (elements.overdueCount) {
    elements.overdueCount.textContent = requestCount(assigned.filter(overdue).length);
  }
  if (elements.teamRequestCount) elements.teamRequestCount.textContent = requestCount(requests.length);
  if (elements.managerNeedsInfo) {
    elements.managerNeedsInfo.textContent = requestCount(
      requests.filter(record => record.status === `NEEDS_INFORMATION`).length
    );
  }
};

const renderHrStats = () => {
  const open = requests.filter(record => !terminalStatuses.has(record.status) && record.status !== `DRAFT`);
  if (elements.hrOpenCount) elements.hrOpenCount.textContent = requestCount(open.length);
  if (elements.hrAssignedCount) {
    elements.hrAssignedCount.textContent = requestCount(
      requests.filter(record => (
        record.status === `PENDING_FULFILLMENT`
        && record.currentAssigneeIds.includes(state.user.uid)
      )).length
    );
  }
  if (elements.hrOverdueCount) elements.hrOverdueCount.textContent = requestCount(open.filter(overdue).length);
  if (elements.hrCompletedCount) {
    elements.hrCompletedCount.textContent = requestCount(
      requests.filter(record => record.status === `COMPLETED`).length
    );
  }
};

const percentile = (values, point) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(point * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

const breachedSla = record => {
  const due = toDate(record.dueAt);
  if (!due || record.status === `DRAFT`) return false;
  const terminalTime = toDate(
    record.completedAt
    || record.withdrawnAt
    || (terminalStatuses.has(record.status) ? record.updatedAt : null)
  );
  const comparison = terminalTime || new Date();
  return comparison.getTime() > due.getTime();
};

const renderReporting = () => {
  if (!elements.reportVolume) return;
  const submitted = requests.filter(record => record.status !== `DRAFT`);
  const completed = requests.filter(record => record.status === `COMPLETED`);
  const durations = completed.map(durationHours);
  const median = percentile(durations, 0.5);
  const p90 = percentile(durations, 0.9);
  const compliant = submitted.filter(record => !breachedSla(record)).length;
  const slaRate = submitted.length ? Math.round((compliant / submitted.length) * 100) : 100;
  const infoRate = submitted.length
    ? Math.round((submitted.filter(record => (
        record.status === `NEEDS_INFORMATION`
        || record.outcome?.code === `needs_information`
        || Object.hasOwn(record.payload || {}, `informationResponse`)
      )).length / submitted.length) * 100)
    : 0;
  const rejectionRate = submitted.length
    ? Math.round((submitted.filter(record => record.status === `REJECTED`).length / submitted.length) * 100)
    : 0;

  elements.reportVolume.textContent = requestCount(requests.length);
  elements.reportMedian.textContent = `${median.toFixed(median < 10 ? 1 : 0)}${translate(`hours`)}`;
  elements.reportP90.textContent = `${p90.toFixed(p90 < 10 ? 1 : 0)}${translate(`hours`)}`;
  elements.reportSla.textContent = `${slaRate}%`;
  elements.reportSlaBar.style.width = `${slaRate}%`;
  elements.reportInfoRate.textContent = `${infoRate}%`;
  elements.reportRejectionRate.textContent = `${rejectionRate}%`;
};

const renderConfiguration = () => {
  if (!elements.configurationList) return;
  const versions = state.configurationTypes || state.requestTypes;
  elements.configurationCount.textContent = String(versions.length);
  elements.configurationList.innerHTML = versions.map(type => {
    const workflow = workflowById(type.workflowId);
    return `
      <article class="config-item">
        <header>
          <span>
            <h3>${escapeHtml(localized(type, `name`))}</h3>
            <p>${escapeHtml(type.code)} · ${escapeHtml(translate(`version`))} ${escapeHtml(type.version)}</p>
          </span>
          <span>
            <span class="status-badge" data-status="${type.status === `published` ? `APPROVED` : `CANCELLED`}">${escapeHtml(translate(type.status === `published` ? `active` : `cancelled`))}</span>
            <span class="mini-chip">${escapeHtml(workflow?.slaHours || 24)}${escapeHtml(translate(`hours`))}</span>
          </span>
        </header>
        <div class="workflow-steps">
          ${(workflow?.steps || []).map(step => `
            <span class="workflow-step">
              ${escapeHtml(Number(step.index) + 1)} ·
              ${escapeHtml(language === `ar` ? step.nameAr : step.nameEn)}
              · ${escapeHtml(step.mode)}
            </span>
          `).join(``)}
        </div>
        ${type.status === `published`
          ? `
            <div class="config-item-actions">
              <button class="config-action config-action--danger" type="button" data-retire-request-type="${escapeHtml(type.id)}">${escapeHtml(translate(`retireVersion`))}</button>
            </div>
          `
          : ``}
      </article>
    `;
  }).join(``);

  if (!elements.configurationDraftList) return;
  elements.configurationDraftCount.textContent = String(state.workflowDrafts.length);
  elements.configurationDraftEmpty.hidden = state.workflowDrafts.length > 0;
  elements.configurationDraftList.innerHTML = state.workflowDrafts.map(draft => `
    <article class="config-item">
      <header>
        <span>
          <h3>${escapeHtml(localized(draft, `name`))}</h3>
          <p>${escapeHtml(draft.code)} · ${escapeHtml(draft.formSchema?.length || 0)} ${escapeHtml(translate(`formFields`))}</p>
        </span>
        <span class="mini-chip">${escapeHtml(draft.slaHours)}${escapeHtml(translate(`hours`))}</span>
      </header>
      <div class="workflow-steps">
        <span class="workflow-step">${escapeHtml(routeLabel(draft.initialResolver === `hr` ? `hr` : `manager`))}</span>
        ${draft.confidentiality === `restricted`
          ? `<span class="mini-chip mini-chip--restricted">${escapeHtml(translate(`restricted`))}</span>`
          : ``}
      </div>
      <div class="config-item-actions">
        <button class="config-action" type="button" data-edit-workflow-draft="${escapeHtml(draft.id)}">${escapeHtml(translate(`editDraft`))}</button>
        <button class="config-action config-action--publish" type="button" data-publish-workflow-draft="${escapeHtml(draft.id)}">${escapeHtml(translate(`publishVersion`))}</button>
        <button class="config-action config-action--danger" type="button" data-delete-workflow-draft="${escapeHtml(draft.id)}">${escapeHtml(translate(`deleteDraft`))}</button>
      </div>
    </article>
  `).join(``);
};

const configurationFieldRow = schemaField => {
  const value = schemaField || {
    key: `details`,
    type: `textarea`,
    labelEn: `Details`,
    labelAr: `التفاصيل`,
    required: true
  };
  return `
    <div class="configuration-field-row" data-configuration-field>
      <div class="form-field"><label>${escapeHtml(translate(`fieldKey`))}</label><input data-config-key type="text" maxlength="40" value="${escapeHtml(value.key || ``)}" required></div>
      <div class="form-field"><label>${escapeHtml(translate(`fieldType`))}</label><select data-config-type>
        ${[`text`, `textarea`, `date`, `email`, `tel`, `url`].map(type => `
          <option value="${type}"${value.type === type ? ` selected` : ``}>${type}</option>
        `).join(``)}
      </select></div>
      <div class="form-field"><label>${escapeHtml(translate(`fieldNameEn`))}</label><input data-config-label-en type="text" maxlength="120" value="${escapeHtml(value.labelEn || ``)}" required></div>
      <div class="form-field"><label>${escapeHtml(translate(`fieldNameAr`))}</label><input data-config-label-ar type="text" maxlength="120" dir="rtl" value="${escapeHtml(value.labelAr || ``)}" required></div>
      <label class="configuration-required"><input data-config-required type="checkbox"${value.required ? ` checked` : ``}> <span>${escapeHtml(translate(`required`))}</span></label>
      <button class="remove-configuration-field" type="button" data-remove-configuration-field aria-label="${escapeHtml(translate(`deleteDraft`))}">×</button>
    </div>
  `;
};

const collectConfiguration = () => ({
  code: elements.configurationCode.value,
  nameEn: elements.configurationNameEn.value,
  nameAr: elements.configurationNameAr.value,
  descriptionEn: elements.configurationDescriptionEn.value,
  descriptionAr: elements.configurationDescriptionAr.value,
  category: elements.configurationCategory.value,
  confidentiality: elements.configurationConfidentiality.value,
  subjectMode: elements.configurationSubjectMode.value,
  initialResolver: elements.configurationResolver.value,
  slaHours: elements.configurationSla.value,
  formSchema: [...elements.configurationFields.querySelectorAll(`[data-configuration-field]`)]
    .map(row => ({
      key: row.querySelector(`[data-config-key]`).value,
      type: row.querySelector(`[data-config-type]`).value,
      labelEn: row.querySelector(`[data-config-label-en]`).value,
      labelAr: row.querySelector(`[data-config-label-ar]`).value,
      required: row.querySelector(`[data-config-required]`).checked
    }))
});

const updateConfigurationPreview = () => {
  if (!elements.configurationPreview) return;
  const configuration = collectConfiguration();
  const name = language === `ar`
    ? configuration.nameAr || translate(`requestTypeDraft`)
    : configuration.nameEn || translate(`requestTypeDraft`);
  const description = language === `ar`
    ? configuration.descriptionAr
    : configuration.descriptionEn;
  const restricted = configuration.confidentiality === `restricted`;
  const route = restricted ? `hr` : (
    configuration.initialResolver === `hr` ? `hr` : `manager`
  );
  if (restricted) {
    elements.configurationResolver.value = `hr`;
    elements.configurationResolver.disabled = true;
  } else {
    elements.configurationResolver.disabled = false;
  }
  elements.configurationPreview.innerHTML = `
    <span class="service-card-icon" aria-hidden="true">${restricted ? `🔒` : `↗`}</span>
    <span class="eyebrow">${escapeHtml(configuration.code || translate(`configurationCode`))}</span>
    <h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(description || translate(`configurationDesignerCopy`))}</p>
    <div class="service-card-meta">
      <span class="mini-chip">${escapeHtml(configuration.slaHours || 24)}${escapeHtml(translate(`hours`))}</span>
      ${restricted ? `<span class="mini-chip mini-chip--restricted">${escapeHtml(translate(`restricted`))}</span>` : ``}
    </div>
  `;
  const managerHours = Math.max(
    1,
    Math.min(Number(configuration.slaHours || 24) - 1, Math.round(Number(configuration.slaHours || 24) * 0.4))
  );
  elements.configurationRoutePreview.innerHTML = route === `manager`
    ? `
      <span class="workflow-step">1 · ${escapeHtml(translate(`routeManager`))} · ${escapeHtml(managerHours)}${escapeHtml(translate(`hours`))}</span>
      <span class="workflow-step">2 · ${escapeHtml(translate(`routeHr`))} · ${escapeHtml(Math.max(1, Number(configuration.slaHours || 24) - managerHours))}${escapeHtml(translate(`hours`))}</span>
    `
    : `<span class="workflow-step">1 · ${escapeHtml(translate(`routeHr`))} · ${escapeHtml(configuration.slaHours || 24)}${escapeHtml(translate(`hours`))}</span>`;
};

const openConfigurationDesigner = (draftId = ``) => {
  if (!elements.configurationModal) return;
  const draft = state.workflowDrafts.find(item => item.id === draftId);
  activeConfigurationDraftId = draft?.id || ``;
  elements.configurationForm.reset();
  elements.configurationCode.value = draft?.code || ``;
  elements.configurationSla.value = draft?.slaHours || 24;
  elements.configurationNameEn.value = draft?.nameEn || ``;
  elements.configurationNameAr.value = draft?.nameAr || ``;
  elements.configurationDescriptionEn.value = draft?.descriptionEn || ``;
  elements.configurationDescriptionAr.value = draft?.descriptionAr || ``;
  elements.configurationCategory.value = draft?.category || `custom`;
  elements.configurationConfidentiality.value = draft?.confidentiality || `normal`;
  elements.configurationSubjectMode.value = draft?.subjectMode || `self`;
  elements.configurationResolver.value = draft?.initialResolver || `direct_manager`;
  elements.configurationFields.innerHTML = (draft?.formSchema?.length
    ? draft.formSchema
    : [null]
  ).map(configurationFieldRow).join(``);
  elements.configurationError.textContent = ``;
  elements.configurationModal.hidden = false;
  updateConfigurationPreview();
};

const closeConfigurationDesigner = () => {
  if (!elements.configurationModal) return;
  elements.configurationModal.hidden = true;
  activeConfigurationDraftId = ``;
  elements.configurationError.textContent = ``;
};

const refreshConfiguration = async () => {
  await loadConfiguration();
  renderCatalog();
  renderConfiguration();
};

const handleConfigurationSubmit = async event => {
  event.preventDefault();
  elements.configurationError.textContent = ``;
  setButtonBusy(elements.saveConfigurationDraft, true);
  try {
    await saveWorkflowDraft(collectConfiguration(), activeConfigurationDraftId);
    closeConfigurationDesigner();
    await refreshConfiguration();
    showToast(`draftSaved`);
  } catch (error) {
    console.error(`NASNA workflow draft error.`, error);
    elements.configurationError.textContent = translate(errorKey(error));
  } finally {
    setButtonBusy(elements.saveConfigurationDraft, false);
  }
};

const handleConfigurationListClick = async event => {
  const editButton = event.target.closest(`[data-edit-workflow-draft]`);
  if (editButton) {
    openConfigurationDesigner(editButton.dataset.editWorkflowDraft);
    return;
  }
  const publishButton = event.target.closest(`[data-publish-workflow-draft]`);
  const deleteButton = event.target.closest(`[data-delete-workflow-draft]`);
  const retireButton = event.target.closest(`[data-retire-request-type]`);
  try {
    if (publishButton) {
      if (!window.confirm(translate(`confirmPublishVersion`))) return;
      setButtonBusy(publishButton, true);
      await publishWorkflowDraft(publishButton.dataset.publishWorkflowDraft);
      await refreshConfiguration();
      showToast(`versionPublished`);
    }
    if (deleteButton) {
      if (!window.confirm(translate(`confirmDeleteDraft`))) return;
      setButtonBusy(deleteButton, true);
      await deleteWorkflowDraft(deleteButton.dataset.deleteWorkflowDraft);
      await refreshConfiguration();
      showToast(`configurationDraftDeleted`);
    }
    if (retireButton) {
      if (!window.confirm(translate(`confirmRetireVersion`))) return;
      setButtonBusy(retireButton, true);
      await retireRequestType(retireButton.dataset.retireRequestType);
      await refreshConfiguration();
      showToast(`versionRetired`);
    }
  } catch (error) {
    console.error(`NASNA workflow configuration action error.`, error);
    showToast(errorKey(error), true);
  } finally {
    setButtonBusy(publishButton || deleteButton || retireButton, false);
  }
};

const csvValue = value => {
  const normalized = String(value ?? ``);
  const protectedValue = normalized.match(/^[=+\-@]/)
    ? `'${normalized}`
    : normalized;
  return `"${protectedValue.replaceAll(`"`, `""`)}"`;
};

const exportRequestReport = () => {
  const headers = [
    `requestNumber`,
    `typeCode`,
    `status`,
    `priority`,
    `route`,
    `requester`,
    `subject`,
    `createdAt`,
    `submittedAt`,
    `completedAt`,
    `durationHours`,
    `slaBreached`
  ];
  const rows = requests.map(record => [
    record.requestNumber,
    record.typeCode,
    record.status,
    record.priority,
    record.routeKind,
    record.requesterName,
    record.subjectName,
    toDate(record.createdAt)?.toISOString() || ``,
    toDate(record.submittedAt)?.toISOString() || ``,
    toDate(record.completedAt)?.toISOString() || ``,
    durationHours(record).toFixed(2),
    breachedSla(record) ? `true` : `false`
  ]);
  const csv = [
    headers.map(csvValue).join(`,`),
    ...rows.map(row => row.map(csvValue).join(`,`))
  ].join(`\r\n`);
  const blob = new Blob([`\uFEFF${csv}`], { type: `text/csv;charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement(`a`);
  link.href = url;
  link.download = `nasna-stage10-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`reportExported`);
};

const renderDelegations = () => {
  if (!elements.delegationList) return;
  elements.delegationList.innerHTML = delegations.map(record => {
    const delegate = state.members.find(member => member.uid === record.delegateUid);
    return `
      <article class="delegation-item">
        <header>
          <span>
            <h3>${escapeHtml(delegate?.displayName || delegate?.email || record.delegateUid)}</h3>
            <p>${escapeHtml(translate(`from`))} ${escapeHtml(formatDateOnly(record.startAt))} ${escapeHtml(translate(`to`))} ${escapeHtml(formatDateOnly(record.endAt))}</p>
          </span>
          <span class="status-badge" data-status="${record.status === `active` ? `APPROVED` : `CANCELLED`}">${escapeHtml(translate(record.status))}</span>
        </header>
        ${record.status === `active`
          ? `<button class="text-button" type="button" data-cancel-delegation="${escapeHtml(record.id)}">${escapeHtml(translate(`cancelDelegation`))}</button>`
          : ``}
      </article>
    `;
  }).join(``);
  elements.delegationEmpty.hidden = delegations.length > 0;
};

const renderNotifications = () => {
  if (!elements.notificationList) return;
  const unread = notifications.filter(item => !item.readAt).length;
  elements.notificationCount.textContent = String(unread);
  elements.notificationCount.hidden = unread === 0;
  elements.notificationList.innerHTML = notifications.map(item => `
    <button class="notification-item${item.readAt ? `` : ` is-unread`}" type="button" data-notification-id="${escapeHtml(item.id)}" data-request-id="${escapeHtml(item.requestId)}">
      <strong>${escapeHtml(language === `ar` ? item.titleAr : item.titleEn)}</strong>
      <span>${escapeHtml(language === `ar` ? item.bodyAr : item.bodyEn)}</span>
      <small>${escapeHtml(formatDate(item.createdAt))}</small>
    </button>
  `).join(``);
  elements.notificationEmpty.hidden = notifications.length > 0;
};

const renderCurrentPage = () => {
  renderRequests();
  if (pageType === `requests`) {
    renderCatalog();
    renderRequestStats();
  }
  if (pageType === `approvals`) {
    renderManagerStats();
    renderDelegations();
  }
  if (pageType === `hr`) {
    renderHrStats();
    renderConfiguration();
    renderReporting();
  }
};

const openRequestForm = typeId => {
  const type = requestTypeById(typeId);
  if (!type) return;
  if (!state.ownEmployee) {
    showToast(`noEmployeeFile`, true);
    return;
  }
  if (type.subjectMode === `direct_report` && directReports().length === 0) {
    showToast(`teamRequestNeedsManager`, true);
    return;
  }
  activeTypeId = typeId;
  activeRequestIdempotencyKey = crypto.randomUUID();
  elements.requestModalTitle.textContent = localized(type, `name`);
  elements.requestModalDescription.textContent = localized(type, `description`);
  elements.restrictedNotice.hidden = type.confidentiality !== `restricted`;
  const reportField = type.subjectMode === `direct_report`
    ? `
      <div class="form-field form-field--wide">
        <label for="subjectEmployeeId">${escapeHtml(translate(`subjectEmployee`))} <span>*</span></label>
        <select id="subjectEmployeeId" required>
          ${directReports().map(employee => `
            <option value="${escapeHtml(employee.id)}">${escapeHtml(language === `ar` ? employee.fullNameAr : employee.fullNameEn)} · ${escapeHtml(employee.id)}</option>
          `).join(``)}
        </select>
      </div>
    `
    : ``;
  elements.requestFields.innerHTML = reportField + type.formSchema.map(schemaField => {
    const label = language === `ar` ? schemaField.labelAr : schemaField.labelEn;
    const placeholder = language === `ar`
      ? schemaField.placeholderAr
      : schemaField.placeholderEn;
    const required = schemaField.required ? `required` : ``;
    const wide = schemaField.type === `textarea` || schemaField.type === `url`;
    let control = ``;
    if (schemaField.type === `textarea`) {
      control = `<textarea id="field-${escapeHtml(schemaField.key)}" data-field-key="${escapeHtml(schemaField.key)}" ${required} placeholder="${escapeHtml(placeholder)}"></textarea>`;
    } else if (schemaField.type === `select`) {
      control = `
        <select id="field-${escapeHtml(schemaField.key)}" data-field-key="${escapeHtml(schemaField.key)}" ${required}>
          <option value="">${escapeHtml(translate(`noValue`))}</option>
          ${(schemaField.choices || []).map(option => `
            <option value="${escapeHtml(option.value)}">${escapeHtml(language === `ar` ? option.labelAr : option.labelEn)}</option>
          `).join(``)}
        </select>
      `;
    } else {
      const typeAttribute = [`date`, `email`, `tel`, `url`].includes(schemaField.type)
        ? schemaField.type
        : `text`;
      control = `<input id="field-${escapeHtml(schemaField.key)}" data-field-key="${escapeHtml(schemaField.key)}" type="${typeAttribute}" ${required} placeholder="${escapeHtml(placeholder)}">`;
    }
    return `
      <div class="form-field${wide ? ` form-field--wide` : ``}">
        <label for="field-${escapeHtml(schemaField.key)}">${escapeHtml(label)} ${schemaField.required ? `<span>*</span>` : ``}</label>
        ${control}
      </div>
    `;
  }).join(``);
  elements.requestPriority.value = `normal`;
  elements.requestFormError.textContent = ``;
  elements.requestModal.hidden = false;
};

const closeRequestForm = () => {
  if (!elements.requestModal) return;
  elements.requestModal.hidden = true;
  activeTypeId = ``;
  activeRequestIdempotencyKey = ``;
  elements.requestForm?.reset();
};

const requestFormValues = () => Object.fromEntries(
  [...elements.requestFields.querySelectorAll(`[data-field-key]`)]
    .map(input => [input.dataset.fieldKey, input.value])
);

const setButtonBusy = (button, busy) => {
  if (!button) return;
  button.disabled = busy;
  button.dataset.busy = busy ? `true` : `false`;
};

const saveRequestFromForm = async submit => {
  const type = requestTypeById(activeTypeId);
  if (!type) return;
  elements.requestFormError.textContent = ``;
  setButtonBusy(elements.saveDraftButton, true);
  setButtonBusy(elements.submitRequestButton, true);
  try {
    await createRequest({
      typeId: type.id,
      values: requestFormValues(),
      subjectEmployeeId: document.getElementById(`subjectEmployeeId`)?.value || state.ownEmployee?.id,
      priority: elements.requestPriority.value,
      submit,
      idempotencyKey: activeRequestIdempotencyKey
    });
    closeRequestForm();
    await loadRequestsPage(true);
    notifications = await loadNotifications();
    renderCurrentPage();
    renderNotifications();
    showToast(submit ? `requestCreated` : `draftCreated`);
  } catch (error) {
    console.error(`NASNA request create error.`, error);
    elements.requestFormError.textContent = translate(errorKey(error));
  } finally {
    setButtonBusy(elements.saveDraftButton, false);
    setButtonBusy(elements.submitRequestButton, false);
  }
};

const payloadLabel = (type, key) => {
  const schemaField = type.formSchema?.find(item => item.key === key);
  if (schemaField) return language === `ar` ? schemaField.labelAr : schemaField.labelEn;
  if (key === `informationResponse`) {
    return language === `ar` ? `المعلومات الإضافية` : `Additional information`;
  }
  return key;
};

const payloadValue = (type, key, value) => {
  const schemaField = type.formSchema?.find(item => item.key === key);
  const option = schemaField?.choices?.find(item => item.value === value);
  if (option) return language === `ar` ? option.labelAr : option.labelEn;
  return value || translate(`noValue`);
};

const renderDetailActions = record => {
  if (!elements.detailActionSection) return;
  const assigned = record.currentAssigneeIds.includes(state.user.uid);
  if (pageType === `requests`) {
    elements.detailActionSection.hidden = false;
    elements.detailActions.innerHTML = ``;
    elements.informationForm.hidden = record.status !== `NEEDS_INFORMATION`;
    if (record.status === `DRAFT`) {
      elements.detailActions.innerHTML += `<button class="primary-button" type="button" data-detail-action="submit">${escapeHtml(translate(`submitRequest`))}</button>`;
    }
    if (
      !terminalStatuses.has(record.status)
      && record.status !== `DRAFT`
    ) {
      elements.detailActions.innerHTML += `<button class="danger-button" type="button" data-detail-action="withdraw">${escapeHtml(translate(`withdraw`))}</button>`;
    }
    if (!elements.detailActions.innerHTML && record.status !== `NEEDS_INFORMATION`) {
      elements.detailActionSection.hidden = true;
    }
    return;
  }

  if (pageType === `approvals`) {
    const available = assigned && record.status === `PENDING_APPROVAL` && record.requesterUid !== state.user.uid;
    elements.detailActionSection.hidden = !available;
    if (elements.decisionForm) elements.decisionForm.hidden = !available;
    return;
  }

  if (pageType === `hr`) {
    const available = assigned && record.status === `PENDING_FULFILLMENT` && record.requesterUid !== state.user.uid;
    elements.detailActionSection.hidden = !available;
    if (elements.decisionForm) elements.decisionForm.hidden = !available;
    const futureMovement = record.typeCode === `team_movement`
      && record.payload.effectiveDate
      && record.payload.effectiveDate > dateInputValue(new Date());
    if (elements.futureMovementNotice) elements.futureMovementNotice.hidden = !futureMovement;
    const fulfillButton = elements.decisionForm?.querySelector(`[data-decision="fulfill"]`);
    if (fulfillButton) fulfillButton.disabled = futureMovement;
  }
};

const renderDetail = async (record, loadRelated = true) => {
  activeRequest = record;
  const type = requestTypeFor(record);
  elements.detailNumber.textContent = record.requestNumber;
  elements.detailTitle.textContent = localized(type, `name`);
  elements.detailSubtitle.textContent = `${record.requesterName} · ${statusLabel(record.status)}`;
  const summary = [
    [translate(`status`), statusLabel(record.status)],
    [translate(`requester`), record.requesterName],
    [translate(`subjectEmployee`), record.subjectName],
    [translate(`priority`), translate(`priority${record.priority.charAt(0).toUpperCase()}${record.priority.slice(1)}`)],
    [translate(`submitted`), record.submittedAt ? formatDate(record.submittedAt) : translate(`notSubmitted`)],
    [translate(`due`), record.dueAt ? formatDate(record.dueAt) : translate(`noDueDate`)],
    [translate(`route`), routeLabel(record.routeKind)],
    [translate(`version`), `${record.typeVersion}`]
  ];
  elements.detailSummary.innerHTML = summary.map(([label, value]) => `
    <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>
  `).join(``);
  elements.detailPayload.innerHTML = Object.entries(record.payload || {}).map(([key, value]) => `
    <div><dt>${escapeHtml(payloadLabel(type, key))}</dt><dd>${escapeHtml(payloadValue(type, key, value))}</dd></div>
  `).join(``);
  renderDetailActions(record);

  if (loadRelated) {
    const [events, comments] = await Promise.all([
      loadRequestEvents(record.id),
      loadRequestComments(record.id)
    ]);
    elements.detailTimeline.innerHTML = events.length
      ? events.map(event => `
          <article class="timeline-item">
            <span class="timeline-dot"></span>
            <span>
              <strong>${escapeHtml(event.actorName || event.type)}</strong>
              <span>${escapeHtml(event.message || event.type)}</span>
              <small>${escapeHtml(formatDate(event.createdAt))}</small>
            </span>
          </article>
        `).join(``)
      : `<p>${escapeHtml(translate(`noTimeline`))}</p>`;
    elements.commentList.innerHTML = comments.length
      ? comments.map(comment => `
          <article class="comment-item">
            <strong>${escapeHtml(comment.authorName)}${comment.visibility === `hr_only` ? ` · HR` : ``}</strong>
            <p>${escapeHtml(comment.body)}</p>
            <small>${escapeHtml(formatDate(comment.createdAt))}</small>
          </article>
        `).join(``)
      : `<p>${escapeHtml(translate(`noComments`))}</p>`;
  }
  elements.detailModal.hidden = false;
};

const closeDetail = () => {
  elements.detailModal.hidden = true;
  activeRequest = null;
  elements.decisionNote && (elements.decisionNote.value = ``);
  elements.fulfillmentReference && (elements.fulfillmentReference.value = ``);
  elements.informationResponse && (elements.informationResponse.value = ``);
  elements.commentBody && (elements.commentBody.value = ``);
};

const refreshRequests = async () => {
  await loadRequestsPage(true);
  await loadRequestTypeVersions(requests);
  await ensureSlaNotifications(requests).catch(error => {
    console.warn(`NASNA SLA notification refresh skipped.`, error);
  });
  notifications = await loadNotifications();
  renderCurrentPage();
  renderNotifications();
};

const handleRequestListClick = async event => {
  const loadMoreButton = event.target.closest(`[data-action="load-more"]`);
  if (loadMoreButton) {
    setButtonBusy(loadMoreButton, true);
    try {
      await loadRequestsPage(false);
      await loadRequestTypeVersions(requests);
      renderCurrentPage();
    } catch (error) {
      console.error(`NASNA request pagination error.`, error);
      showToast(errorKey(error), true);
    } finally {
      setButtonBusy(loadMoreButton, false);
    }
    return;
  }
  const row = event.target.closest(`[data-request-id]`);
  if (!row) return;
  const record = requests.find(item => item.id === row.dataset.requestId);
  if (!record) return;
  if (event.target.closest(`[data-action="submit-draft"]`)) {
    try {
      await submitDraft(record.id);
      await refreshRequests();
      showToast(`draftSubmitted`);
    } catch (error) {
      console.error(`NASNA draft submit error.`, error);
      showToast(errorKey(error), true);
    }
    return;
  }
  await renderDetail(record);
};

const handleDetailAction = async event => {
  const action = event.target.closest(`[data-detail-action]`)?.dataset.detailAction;
  if (!action || !activeRequest) return;
  try {
    if (action === `submit`) {
      await submitDraft(activeRequest.id);
      showToast(`draftSubmitted`);
    }
    if (action === `withdraw`) {
      await withdrawRequest(activeRequest.id);
      showToast(`requestWithdrawn`);
    }
    closeDetail();
    await refreshRequests();
  } catch (error) {
    console.error(`NASNA request action error.`, error);
    showToast(errorKey(error), true);
  }
};

const handleInformationSubmit = async event => {
  event.preventDefault();
  if (!activeRequest) return;
  try {
    await respondToInformation(activeRequest.id, elements.informationResponse.value);
    closeDetail();
    await refreshRequests();
    showToast(`informationSent`);
  } catch (error) {
    console.error(`NASNA information response error.`, error);
    showToast(errorKey(error), true);
  }
};

const handleCommentSubmit = async event => {
  event.preventDefault();
  if (!activeRequest) return;
  try {
    await addComment(
      activeRequest.id,
      elements.commentBody.value,
      elements.hrOnlyComment?.checked ? `hr_only` : `participants`
    );
    elements.commentBody.value = ``;
    await renderDetail(activeRequest);
    showToast(`commentAdded`);
  } catch (error) {
    console.error(`NASNA comment error.`, error);
    showToast(errorKey(error), true);
  }
};

const handleDecision = async event => {
  const actionButton = event.target.closest(`[data-decision]`);
  const decision = actionButton?.dataset.decision;
  if (!decision || !activeRequest) return;
  elements.decisionError.textContent = ``;
  const confirmationKey = {
    approve: `confirmApprove`,
    reject: `confirmReject`,
    needs_information: `confirmInformation`,
    fulfill: `confirmFulfill`,
    cancel: `confirmCancel`
  }[decision];
  if (confirmationKey && !window.confirm(translate(confirmationKey))) return;
  setButtonBusy(actionButton, true);
  try {
    if (pageType === `approvals`) {
      await decideRequest(activeRequest.id, decision, elements.decisionNote.value);
      showToast(`decisionSaved`);
    }
    if (pageType === `hr`) {
      if (decision === `fulfill`) {
        await fulfillRequest(activeRequest.id, {
          note: elements.decisionNote.value,
          reference: elements.fulfillmentReference.value
        });
        showToast(`requestCompleted`);
      }
      if (decision === `needs_information`) {
        await decideRequest(activeRequest.id, decision, elements.decisionNote.value);
        showToast(`decisionSaved`);
      }
      if (decision === `cancel`) {
        await cancelRequest(activeRequest.id, elements.decisionNote.value);
        showToast(`requestCancelled`);
      }
    }
    closeDetail();
    await refreshRequests();
  } catch (error) {
    console.error(`NASNA request decision error.`, error);
    elements.decisionError.textContent = translate(errorKey(error));
  } finally {
    setButtonBusy(actionButton, false);
  }
};

const openNotifications = () => {
  elements.notificationPanel.classList.add(`is-open`);
  elements.notificationBackdrop.hidden = false;
};

const closeNotifications = () => {
  elements.notificationPanel.classList.remove(`is-open`);
  elements.notificationBackdrop.hidden = true;
};

const handleNotificationClick = async event => {
  const button = event.target.closest(`[data-notification-id]`);
  if (!button) return;
  const item = notifications.find(notification => notification.id === button.dataset.notificationId);
  if (!item) return;
  if (!item.readAt) {
    await markNotificationRead(item.id).catch(() => undefined);
    item.readAt = new Date();
    renderNotifications();
  }
  closeNotifications();
  const record = requests.find(request => request.id === item.requestId);
  if (record) {
    await renderDetail(record);
    return;
  }
  if (
    typeof item.href === `string`
    && item.href.match(/^(requests|approvals|hr-operations)[.]html[?]v=[0-9.]+&request=[a-zA-Z0-9_-]+$/)
  ) {
    window.location.assign(item.href);
  }
};

const openDelegation = () => {
  const candidates = state.members.filter(member => (
    member.uid !== state.user.uid
    && (
      member.role === `manager`
      || member.role === `super_admin`
      || member.role === `hr_admin`
      || member.isManager
    )
  ));
  elements.delegateUid.innerHTML = candidates.map(member => `
    <option value="${escapeHtml(member.uid)}">${escapeHtml(member.displayName || member.email)} · ${escapeHtml(roleLabel(member.role))}</option>
  `).join(``);
  const today = dateInputValue(new Date());
  const end = new Date();
  end.setDate(end.getDate() + 7);
  elements.delegationStart.min = today;
  elements.delegationStart.max = today;
  elements.delegationEnd.min = dateInputValue(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  elements.delegationStart.value = today;
  elements.delegationEnd.value = dateInputValue(end);
  elements.delegationError.textContent = ``;
  elements.delegationModal.hidden = false;
};

const closeDelegation = () => {
  elements.delegationModal.hidden = true;
  elements.delegationForm.reset();
};

const handleDelegationSubmit = async event => {
  event.preventDefault();
  try {
    await createDelegation(
      elements.delegateUid.value,
      elements.delegationStart.value,
      elements.delegationEnd.value
    );
    delegations = await loadDelegations();
    closeDelegation();
    renderDelegations();
    showToast(`delegationCreated`);
  } catch (error) {
    console.error(`NASNA delegation error.`, error);
    elements.delegationError.textContent = translate(errorKey(error));
  }
};

const handleDelegationListClick = async event => {
  const id = event.target.closest(`[data-cancel-delegation]`)?.dataset.cancelDelegation;
  if (!id) return;
  try {
    await cancelDelegation(id);
    delegations = await loadDelegations();
    renderDelegations();
    showToast(`delegationCancelled`);
  } catch (error) {
    console.error(`NASNA delegation cancel error.`, error);
    showToast(errorKey(error), true);
  }
};

const bindTabs = () => {
  document.querySelectorAll(`[data-tab]`).forEach(button => {
    button.addEventListener(`click`, () => {
      document.querySelectorAll(`[data-tab]`).forEach(item => {
        item.classList.toggle(`is-active`, item === button);
      });
      document.querySelectorAll(`[data-tab-panel]`).forEach(panel => {
        panel.hidden = panel.dataset.tabPanel !== button.dataset.tab;
      });
    });
  });
};

const bindEvents = () => {
  elements.languageButton?.addEventListener(`click`, () => {
    setLanguage(language === `en` ? `ar` : `en`);
  });
  elements.signOutButton?.addEventListener(`click`, async () => {
    elements.signOutButton.disabled = true;
    try {
      await signOut(auth);
      window.location.replace(`./?v=${release}`);
    } catch (error) {
      elements.signOutButton.disabled = false;
      showToast(`signedOutError`, true);
    }
  });
  elements.requestSearch?.addEventListener(`input`, renderRequests);
  elements.requestStatusFilter?.addEventListener(`change`, renderRequests);
  elements.requestList?.addEventListener(`click`, handleRequestListClick);
  elements.catalogGrid?.addEventListener(`click`, event => {
    const card = event.target.closest(`[data-type-id]`);
    if (card) openRequestForm(card.dataset.typeId);
  });
  elements.closeRequestModal?.addEventListener(`click`, closeRequestForm);
  elements.cancelRequestForm?.addEventListener(`click`, closeRequestForm);
  elements.requestModal?.addEventListener(`click`, event => {
    if (event.target === elements.requestModal) closeRequestForm();
  });
  elements.requestForm?.addEventListener(`submit`, event => {
    event.preventDefault();
    saveRequestFromForm(true);
  });
  elements.saveDraftButton?.addEventListener(`click`, () => saveRequestFromForm(false));
  elements.closeDetailModal?.addEventListener(`click`, closeDetail);
  elements.detailModal?.addEventListener(`click`, event => {
    if (event.target === elements.detailModal) closeDetail();
  });
  elements.detailActions?.addEventListener(`click`, handleDetailAction);
  elements.informationForm?.addEventListener(`submit`, handleInformationSubmit);
  elements.commentForm?.addEventListener(`submit`, handleCommentSubmit);
  elements.decisionForm?.addEventListener(`click`, handleDecision);
  elements.notificationButton?.addEventListener(`click`, openNotifications);
  elements.closeNotifications?.addEventListener(`click`, closeNotifications);
  elements.notificationBackdrop?.addEventListener(`click`, closeNotifications);
  elements.notificationList?.addEventListener(`click`, handleNotificationClick);
  elements.openDelegationButton?.addEventListener(`click`, openDelegation);
  elements.closeDelegationModal?.addEventListener(`click`, closeDelegation);
  elements.cancelDelegationForm?.addEventListener(`click`, closeDelegation);
  elements.delegationModal?.addEventListener(`click`, event => {
    if (event.target === elements.delegationModal) closeDelegation();
  });
  elements.delegationForm?.addEventListener(`submit`, handleDelegationSubmit);
  elements.delegationList?.addEventListener(`click`, handleDelegationListClick);
  elements.openConfigurationButton?.addEventListener(`click`, () => {
    openConfigurationDesigner();
  });
  elements.closeConfigurationModal?.addEventListener(`click`, closeConfigurationDesigner);
  elements.cancelConfigurationForm?.addEventListener(`click`, closeConfigurationDesigner);
  elements.configurationModal?.addEventListener(`click`, event => {
    if (event.target === elements.configurationModal) closeConfigurationDesigner();
  });
  elements.configurationForm?.addEventListener(`submit`, handleConfigurationSubmit);
  elements.configurationForm?.addEventListener(`input`, updateConfigurationPreview);
  elements.configurationForm?.addEventListener(`change`, updateConfigurationPreview);
  elements.addConfigurationField?.addEventListener(`click`, () => {
    elements.configurationFields.insertAdjacentHTML(
      `beforeend`,
      configurationFieldRow({
        key: ``,
        type: `text`,
        labelEn: ``,
        labelAr: ``,
        required: false
      })
    );
    updateConfigurationPreview();
  });
  elements.configurationFields?.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-remove-configuration-field]`);
    if (!button) return;
    button.closest(`[data-configuration-field]`)?.remove();
    updateConfigurationPreview();
  });
  elements.configurationList?.addEventListener(`click`, handleConfigurationListClick);
  elements.configurationDraftList?.addEventListener(`click`, handleConfigurationListClick);
  elements.exportReportButton?.addEventListener(`click`, exportRequestReport);
  bindTabs();
};

const reveal = () => {
  elements.authLoader.hidden = true;
  elements.workflowApp.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const initialize = async user => {
  await loadSession(user);
  if (pageType === `approvals` && !isManager()) throw new Error(`manager-access-required`);
  if (pageType === `hr` && !isAdmin()) throw new Error(`hr-access-required`);
  if (isAdmin()) await ensureDefaultConfiguration();
  await loadConfiguration();
  await loadRequestsPage(true);
  await loadRequestTypeVersions(requests);
  await ensureSlaNotifications(requests).catch(error => {
    console.warn(`NASNA SLA notification initialization skipped.`, error);
  });
  notifications = await loadNotifications();
  if (pageType === `approvals`) {
    delegations = await loadDelegations();
    const reconciled = await reconcileExpiredDelegations(delegations);
    if (reconciled) {
      await loadRequestsPage(true);
      delegations = await loadDelegations();
    }
  }
  renderHeader();
  setLanguage(language);
  renderCurrentPage();
  renderNotifications();
  reveal();

  const deepLinkId = new URLSearchParams(window.location.search).get(`request`);
  const deepLinked = requests.find(record => record.id === deepLinkId)
    || (deepLinkId
      ? await loadRequestById(deepLinkId).catch(() => null)
      : null);
  if (deepLinked) await loadRequestTypeVersions([deepLinked]);
  if (deepLinked) await renderDetail(deepLinked);
};

bindEvents();
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
    console.error(`NASNA Stage 10 initialization error.`, error);
    if ([`manager-access-required`, `hr-access-required`].includes(error.message)) {
      window.location.replace(`requests.html?error=permission&v=${release}`);
      return;
    }
    await signOut(auth).catch(() => undefined);
    window.location.replace(`./?error=access-disabled&v=${release}`);
  }
});
