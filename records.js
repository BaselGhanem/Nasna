import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260726.4";
import { db } from "./firestore-config.js?v=20260726.4";

const release = `20260726.4`;
const pageType = document.body.dataset.page || `documents`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const activeEmploymentStatuses = new Set([`active`, `probation`, `leave`]);
const employmentTypes = new Set([`permanent`, `fixed_term`, `part_time`, `intern`, `consultant`]);
const employmentStatuses = new Set([`active`, `probation`, `leave`, `suspended`]);
const workModes = new Set([`onsite`, `hybrid`, `remote`]);
const documentTypes = new Set([
  `contract`,
  `national_id`,
  `passport`,
  `work_permit`,
  `insurance`,
  `certificate`,
  `other`
]);
const documentVisibilities = new Set([`employee`, `hr_only`]);
const documentStatuses = new Set([`active`, `revoked`]);
const movementTypes = new Set([
  `transfer`,
  `promotion`,
  `reassignment`,
  `manager_change`,
  `employment_change`,
  `status_change`,
  `work_mode_change`
]);

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your access…`,
    dashboard: `Dashboard`,
    myProfile: `My profile`,
    employeeRecords: `Employees`,
    documents: `Documents`,
    employmentHistory: `History`,
    requests: `Requests`,
    signOut: `Sign out`,
    signedInAs: `Signed in as`,
    stage08: `Stage 08 · NASNA Core`,
    documentsTitle: `Employee documents & contracts`,
    documentsCopy: `A controlled register for contracts, identity documents, permits, certificates, and expiry dates.`,
    trustedRegister: `Trusted document register`,
    documentsBannerAdmin: `HR document control`,
    documentsBannerAdminCopy: `HR can register, update, revoke, and monitor employee documents. Employees see only documents explicitly shared with them.`,
    documentsBannerEmployee: `My employment documents`,
    documentsBannerEmployeeCopy: `View the documents HR has shared with your employee account. HR-only records remain private.`,
    sparkCompatible: `Firebase Spark compatible`,
    sparkBoundaryCopy: `NASNA stores document metadata and secure HTTPS references. Binary file upload requires Firebase Blaze and is intentionally disabled.`,
    totalDocuments: `Total documents`,
    registeredDocuments: `Registered records`,
    currentDocuments: `Current`,
    validDocuments: `Valid and active`,
    expiringSoon: `Expiring soon`,
    nextThirtyDays: `Within 30 days`,
    expiredDocuments: `Expired`,
    needsAttention: `Needs HR attention`,
    documentDirectory: `Document directory`,
    allEmployeeDocuments: `All employee documents`,
    myDocuments: `My shared documents`,
    addDocument: `Add document`,
    searchDocuments: `Search documents`,
    allEmployees: `All employees`,
    allDocumentTypes: `All document types`,
    allStates: `All states`,
    contract: `Contract`,
    nationalId: `National ID`,
    passport: `Passport`,
    workPermit: `Work permit`,
    insurance: `Insurance`,
    certificate: `Certificate`,
    other: `Other`,
    revoked: `Revoked`,
    noDocuments: `No documents found`,
    noDocumentsCopy: `Add the first employee document or change the current filters.`,
    documentRecord: `Document record`,
    employee: `Employee`,
    documentType: `Document type`,
    documentTitle: `Document title`,
    documentNumber: `Document number`,
    visibility: `Visibility`,
    employeeVisible: `Employee visible`,
    hrOnly: `HR only`,
    issueDate: `Issue date`,
    expiryDate: `Expiry date`,
    recordStatus: `Record status`,
    active: `Active`,
    secureReference: `Secure HTTPS reference`,
    secureReferenceHelp: `Optional. Use a company-controlled HTTPS link with appropriate access restrictions.`,
    cancel: `Cancel`,
    saveDocument: `Save document`,
    updateDocument: `Update document`,
    openReference: `Open reference`,
    edit: `Edit`,
    noExpiry: `No expiry`,
    documentSaved: `Document saved successfully.`,
    documentUpdated: `Document updated successfully.`,
    duplicateDocument: `This employee already has an active document with the same type and number.`,
    invalidHttpsUrl: `The reference must be a valid HTTPS URL.`,
    expiryBeforeIssue: `Expiry date cannot be earlier than issue date.`,
    requiredFields: `Complete all required fields.`,
    permissionDenied: `You do not have permission to complete this action.`,
    networkError: `The connection was interrupted. Try again.`,
    genericError: `The action could not be completed. Try again.`,
    loading: `Saving…`,
    signOutError: `Sign-out could not be completed.`,
    stage09: `Stage 09 · NASNA Core`,
    lifecycleTitle: `Employment lifecycle & movement history`,
    lifecycleCopy: `Every transfer, promotion, reporting change, and employment-status change is recorded as an immutable HR action.`,
    controlledActions: `Controlled HR actions`,
    lifecycleBannerAdmin: `Apply employee changes with history`,
    lifecycleBannerAdminCopy: `HR applies a current-dated movement once. NASNA updates the employee record and writes the before-and-after history in the same Firestore batch.`,
    lifecycleBannerEmployee: `My employment history`,
    lifecycleBannerEmployeeCopy: `View the official movements applied to your employee record. Managers cannot edit this history.`,
    immutableHistory: `Immutable movement history`,
    immutableHistoryCopy: `Movement records cannot be edited or deleted. Managers have no write access; they remain employees with their own private history.`,
    totalMovements: `Total movements`,
    recordedActions: `Recorded HR actions`,
    transfersAndPromotions: `Transfers & promotions`,
    positionChanges: `Position changes`,
    managerChanges: `Manager changes`,
    reportingChanges: `Reporting-line changes`,
    statusChanges: `Status changes`,
    employmentChanges: `Employment-state changes`,
    movementTimeline: `Movement timeline`,
    allEmployeeMovements: `All employee movements`,
    myEmploymentHistory: `My employment history`,
    newMovement: `New movement`,
    searchMovements: `Search movements`,
    allMovementTypes: `All movement types`,
    transfer: `Transfer`,
    promotion: `Promotion`,
    reassignment: `Reassignment`,
    managerChange: `Manager change`,
    employmentChange: `Employment change`,
    statusChange: `Status change`,
    workModeChange: `Work mode change`,
    noMovements: `No employment movements found`,
    noMovementsCopy: `The timeline starts when HR applies the first employee movement.`,
    hrAction: `HR action`,
    movementType: `Movement type`,
    effectiveDate: `Effective date`,
    effectiveDateHelp: `Today or an earlier date. Future automation requires a server scheduler and is not used on Spark.`,
    newPosition: `New position`,
    newManager: `New direct manager`,
    newEmploymentType: `Employment type`,
    newEmploymentStatus: `Employment status`,
    newWorkMode: `Work mode`,
    movementReason: `Reason / employee-visible note`,
    movementReasonHelp: `This note is visible to the employee. Do not enter confidential investigation details.`,
    applyMovement: `Apply movement`,
    applying: `Applying…`,
    currentPosition: `Current position`,
    currentManager: `Current manager`,
    currentStatus: `Current status`,
    currentArrangement: `Current arrangement`,
    noManager: `No direct manager`,
    permanent: `Permanent`,
    fixedTerm: `Fixed term`,
    partTime: `Part time`,
    intern: `Intern`,
    consultant: `Consultant`,
    probation: `Probation`,
    leave: `On leave`,
    suspended: `Suspended`,
    onsite: `On-site`,
    hybrid: `Hybrid`,
    remote: `Remote`,
    position: `Position`,
    manager: `Manager`,
    employmentType: `Employment type`,
    employmentStatus: `Employment status`,
    workMode: `Work mode`,
    before: `Before`,
    after: `After`,
    movementApplied: `Employment movement applied and recorded.`,
    movementRequired: `Change at least one employment field before applying the movement.`,
    futureMovementNotAllowed: `The effective date cannot be in the future on the Spark workflow.`,
    invalidPosition: `Select an active position.`,
    positionFull: `The selected position has reached its approved headcount.`,
    invalidManager: `Select an active employee as the direct manager.`,
    managerCycle: `This reporting line would create a management cycle.`,
    managerHasReports: `This employee cannot be suspended while active employees report to them.`,
    ownerCannotSuspend: `The company owner cannot be suspended.`,
    cannotSuspendSelf: `You cannot suspend your own active HR account.`,
    movementTypeMismatch: `The selected movement type does not match the field being changed.`,
    unknown: `Not available`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من الصلاحية…`,
    dashboard: `الرئيسية`,
    myProfile: `ملفي`,
    employeeRecords: `الموظفون`,
    documents: `الوثائق`,
    employmentHistory: `السجل الوظيفي`,
    requests: `الطلبات`,
    signOut: `تسجيل الخروج`,
    signedInAs: `المستخدم الحالي`,
    stage08: `المرحلة 08 · ناسنا الأساسي`,
    documentsTitle: `وثائق الموظفين والعقود`,
    documentsCopy: `سجل منضبط للعقود ووثائق الهوية والتصاريح والشهادات ومواعيد الانتهاء.`,
    trustedRegister: `سجل وثائق موثوق`,
    documentsBannerAdmin: `ضبط وثائق الموارد البشرية`,
    documentsBannerAdminCopy: `تستطيع الموارد البشرية تسجيل الوثائق وتحديثها وإلغاءها ومراقبة انتهائها. الموظف يرى فقط ما تتم مشاركته معه.`,
    documentsBannerEmployee: `وثائقي الوظيفية`,
    documentsBannerEmployeeCopy: `اعرض الوثائق التي شاركتها الموارد البشرية مع حسابك. السجلات الداخلية للموارد البشرية تبقى خاصة.`,
    sparkCompatible: `متوافق مع Firebase Spark`,
    sparkBoundaryCopy: `يحفظ ناسنا بيانات الوثيقة والرابط الآمن. رفع الملف نفسه يحتاج Firebase Blaze ولذلك هو معطل عمداً.`,
    totalDocuments: `إجمالي الوثائق`,
    registeredDocuments: `السجلات المسجلة`,
    currentDocuments: `سارية`,
    validDocuments: `فعالة وغير منتهية`,
    expiringSoon: `تنتهي قريباً`,
    nextThirtyDays: `خلال 30 يوماً`,
    expiredDocuments: `منتهية`,
    needsAttention: `تحتاج متابعة HR`,
    documentDirectory: `دليل الوثائق`,
    allEmployeeDocuments: `كل وثائق الموظفين`,
    myDocuments: `وثائقي المشتركة`,
    addDocument: `إضافة وثيقة`,
    searchDocuments: `ابحث في الوثائق`,
    allEmployees: `كل الموظفين`,
    allDocumentTypes: `كل أنواع الوثائق`,
    allStates: `كل الحالات`,
    contract: `عقد`,
    nationalId: `هوية شخصية`,
    passport: `جواز سفر`,
    workPermit: `تصريح عمل`,
    insurance: `تأمين`,
    certificate: `شهادة`,
    other: `أخرى`,
    revoked: `ملغاة`,
    noDocuments: `لا توجد وثائق مطابقة`,
    noDocumentsCopy: `أضف أول وثيقة أو غيّر عوامل التصفية الحالية.`,
    documentRecord: `سجل الوثيقة`,
    employee: `الموظف`,
    documentType: `نوع الوثيقة`,
    documentTitle: `عنوان الوثيقة`,
    documentNumber: `رقم الوثيقة`,
    visibility: `الظهور`,
    employeeVisible: `ظاهرة للموظف`,
    hrOnly: `للموارد البشرية فقط`,
    issueDate: `تاريخ الإصدار`,
    expiryDate: `تاريخ الانتهاء`,
    recordStatus: `حالة السجل`,
    active: `فعال`,
    secureReference: `رابط HTTPS آمن`,
    secureReferenceHelp: `اختياري. استخدم رابطاً تابعاً للشركة ومحمياً بصلاحيات مناسبة.`,
    cancel: `إلغاء`,
    saveDocument: `حفظ الوثيقة`,
    updateDocument: `تحديث الوثيقة`,
    openReference: `فتح المرجع`,
    edit: `تعديل`,
    noExpiry: `بدون انتهاء`,
    documentSaved: `تم حفظ الوثيقة بنجاح.`,
    documentUpdated: `تم تحديث الوثيقة بنجاح.`,
    duplicateDocument: `لدى الموظف وثيقة فعالة من نفس النوع والرقم.`,
    invalidHttpsUrl: `يجب أن يكون المرجع رابط HTTPS صالحاً.`,
    expiryBeforeIssue: `لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ الإصدار.`,
    requiredFields: `أكمل جميع الحقول المطلوبة.`,
    permissionDenied: `لا تملك صلاحية تنفيذ هذه العملية.`,
    networkError: `انقطع الاتصال. حاول مرة أخرى.`,
    genericError: `تعذر إكمال العملية. حاول مرة أخرى.`,
    loading: `جارٍ الحفظ…`,
    signOutError: `تعذر تسجيل الخروج.`,
    stage09: `المرحلة 09 · ناسنا الأساسي`,
    lifecycleTitle: `دورة حياة الموظف وسجل الحركات`,
    lifecycleCopy: `يتم تسجيل كل نقل أو ترقية أو تغيير مدير أو حالة وظيفية كعملية موارد بشرية غير قابلة للتلاعب.`,
    controlledActions: `عمليات موارد بشرية منضبطة`,
    lifecycleBannerAdmin: `نفّذ تغييرات الموظف مع حفظ التاريخ`,
    lifecycleBannerAdminCopy: `تنفذ الموارد البشرية الحركة بتاريخ حالي أو سابق، ويحدّث ناسنا الملف ويحفظ بيانات ما قبل وما بعد في نفس العملية.`,
    lifecycleBannerEmployee: `سجلي الوظيفي`,
    lifecycleBannerEmployeeCopy: `اعرض الحركات الرسمية المنفذة على ملفك الوظيفي. لا يستطيع المدير تعديل هذا السجل.`,
    immutableHistory: `تاريخ حركات غير قابل للتعديل`,
    immutableHistoryCopy: `لا يمكن تعديل أو حذف الحركة. المدير لا يملك صلاحية كتابة ويبقى موظفاً له سجله الخاص.`,
    totalMovements: `إجمالي الحركات`,
    recordedActions: `عمليات HR المسجلة`,
    transfersAndPromotions: `النقل والترقيات`,
    positionChanges: `تغييرات المنصب`,
    managerChanges: `تغيير المدير`,
    reportingChanges: `تغييرات التبعية`,
    statusChanges: `تغيير الحالة`,
    employmentChanges: `تغييرات الوضع الوظيفي`,
    movementTimeline: `الخط الزمني للحركات`,
    allEmployeeMovements: `كل حركات الموظفين`,
    myEmploymentHistory: `سجلي الوظيفي`,
    newMovement: `حركة جديدة`,
    searchMovements: `ابحث في الحركات`,
    allMovementTypes: `كل أنواع الحركات`,
    transfer: `نقل`,
    promotion: `ترقية`,
    reassignment: `إعادة تعيين`,
    managerChange: `تغيير المدير`,
    employmentChange: `تغيير نوع التوظيف`,
    statusChange: `تغيير الحالة`,
    workModeChange: `تغيير نظام العمل`,
    noMovements: `لا توجد حركات وظيفية`,
    noMovementsCopy: `يبدأ الخط الزمني عند تنفيذ أول حركة على الموظف.`,
    hrAction: `عملية موارد بشرية`,
    movementType: `نوع الحركة`,
    effectiveDate: `تاريخ السريان`,
    effectiveDateHelp: `اليوم أو تاريخ سابق. التشغيل المستقبلي يحتاج خادماً مجدولاً وغير مستخدم على Spark.`,
    newPosition: `المنصب الجديد`,
    newManager: `المدير المباشر الجديد`,
    newEmploymentType: `نوع التوظيف`,
    newEmploymentStatus: `الحالة الوظيفية`,
    newWorkMode: `نظام العمل`,
    movementReason: `السبب / ملاحظة ظاهرة للموظف`,
    movementReasonHelp: `هذه الملاحظة ظاهرة للموظف؛ لا تكتب تفاصيل تحقيقات سرية.`,
    applyMovement: `تنفيذ الحركة`,
    applying: `جارٍ التنفيذ…`,
    currentPosition: `المنصب الحالي`,
    currentManager: `المدير الحالي`,
    currentStatus: `الحالة الحالية`,
    currentArrangement: `نظام العمل الحالي`,
    noManager: `لا يوجد مدير مباشر`,
    permanent: `دائم`,
    fixedTerm: `محدد المدة`,
    partTime: `دوام جزئي`,
    intern: `متدرب`,
    consultant: `مستشار`,
    probation: `فترة تجربة`,
    leave: `في إجازة`,
    suspended: `موقوف`,
    onsite: `من الموقع`,
    hybrid: `هجين`,
    remote: `عن بُعد`,
    position: `المنصب`,
    manager: `المدير`,
    employmentType: `نوع التوظيف`,
    employmentStatus: `الحالة الوظيفية`,
    workMode: `نظام العمل`,
    before: `قبل`,
    after: `بعد`,
    movementApplied: `تم تنفيذ الحركة الوظيفية وتسجيلها.`,
    movementRequired: `غيّر حقلاً وظيفياً واحداً على الأقل قبل التنفيذ.`,
    futureMovementNotAllowed: `لا يمكن استخدام تاريخ مستقبلي ضمن مسار Spark.`,
    invalidPosition: `اختر منصباً فعالاً.`,
    positionFull: `وصل المنصب إلى العدد المعتمد.`,
    invalidManager: `اختر موظفاً فعالاً كمدير مباشر.`,
    managerCycle: `هذا الربط سيُنشئ حلقة في التسلسل الإداري.`,
    managerHasReports: `لا يمكن إيقاف الموظف ما دام لديه مرؤوسون فعالون.`,
    ownerCannotSuspend: `لا يمكن إيقاف مالك الشركة.`,
    cannotSuspendSelf: `لا يمكنك إيقاف حساب HR الذي تستخدمه حالياً.`,
    movementTypeMismatch: `نوع الحركة لا يطابق الحقل الذي يتم تغييره.`,
    unknown: `غير متاح`
  }
};

const elements = Object.fromEntries(
  Array.from(document.querySelectorAll(`[id]`)).map(element => [element.id, element])
);

const state = {
  language: localStorage.getItem(`nasna-language`) === `ar` ? `ar` : `en`,
  user: null,
  userProfile: null,
  companyId: ``,
  company: null,
  membership: null,
  ownEmployee: null,
  employees: [],
  positions: [],
  titles: [],
  members: [],
  documents: [],
  movements: [],
  editingDocumentId: null,
  toastTimer: null
};

const translate = key => translations[state.language][key] || key;
const safeTrim = value => String(value ?? ``).trim();
const normalizeSearch = value => safeTrim(value).toLocaleLowerCase();
const escapeHtml = value => String(value ?? ``)
  .replaceAll(`&`, `&amp;`)
  .replaceAll(`<`, `&lt;`)
  .replaceAll(`>`, `&gt;`)
  .replaceAll(`"`, `&quot;`)
  .replaceAll(`'`, `&#039;`);

const isAdmin = () => adminRoles.has(state.membership?.role);
const isEmployeeActive = employee => activeEmploymentStatuses.has(employee?.employmentStatus);
const localizedName = record => {
  if (!record) return ``;
  if (state.language === `ar`) {
    return record.fullNameAr || record.nameAr || record.fullNameEn || record.nameEn || record.id || ``;
  }
  return record.fullNameEn || record.nameEn || record.fullNameAr || record.nameAr || record.id || ``;
};
const initialFor = value => safeTrim(value).charAt(0).toUpperCase() || `N`;
const employeeById = id => state.employees.find(employee => employee.id === id) || null;
const positionById = id => state.positions.find(position => position.id === id) || null;
const titleById = id => state.titles.find(title => title.id === id) || null;
const companyCollection = name => collection(db, `nasna_companies`, state.companyId, name);
const companyDoc = (name, id) => doc(db, `nasna_companies`, state.companyId, name, id);
const auditRef = () => doc(companyCollection(`auditLogs`));
const auditRecord = (action, targetId, details = {}) => ({
  companyId: state.companyId,
  actorId: state.user.uid,
  actorEmail: state.user.email || ``,
  action,
  targetId,
  details,
  createdAt: serverTimestamp()
});

const toDate = value => {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const formatDate = value => {
  const date = toDate(value);
  if (!date) return translate(`unknown`);
  return new Intl.DateTimeFormat(state.language === `ar` ? `ar-JO` : `en-GB`, {
    day: `2-digit`,
    month: `short`,
    year: `numeric`,
    timeZone: `UTC`
  }).format(date);
};

const inputDate = value => {
  const date = toDate(value);
  if (!date) return ``;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, `0`);
  const day = String(date.getUTCDate()).padStart(2, `0`);
  return `${year}-${month}-${day}`;
};

const timestampFromInput = value => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
};

const todayInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, `0`);
  const day = String(date.getDate()).padStart(2, `0`);
  return `${year}-${month}-${day}`;
};

const safeHttpsUrl = value => {
  const raw = safeTrim(value);
  if (!raw) return ``;
  try {
    const url = new URL(raw);
    return url.protocol === `https:` ? url.href : ``;
  } catch {
    return ``;
  }
};

const showToast = (key, type = `success`) => {
  window.clearTimeout(state.toastTimer);
  elements.toastMessage.textContent = translate(key);
  elements.toast.classList.toggle(`is-error`, type === `error`);
  elements.toast.classList.add(`is-visible`);
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4500);
};

const setError = (element, message = ``) => {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
};

const setButtonLoading = (button, loading, loadingKey) => {
  if (!button) return;
  button.disabled = loading;
  const label = button.querySelector(`span`);
  if (!label) return;
  if (loading) {
    button.dataset.originalLabel = label.textContent;
    label.textContent = translate(loadingKey);
  } else if (button.dataset.originalLabel) {
    label.textContent = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
};

const firebaseErrorKey = error => {
  if ([`permission-denied`, `firestore/permission-denied`].includes(error?.code)) return `permissionDenied`;
  if ([`unavailable`, `firestore/unavailable`].includes(error?.code)) return `networkError`;
  return `genericError`;
};

const employmentTypeLabel = value => ({
  permanent: translate(`permanent`),
  fixed_term: translate(`fixedTerm`),
  part_time: translate(`partTime`),
  intern: translate(`intern`),
  consultant: translate(`consultant`)
})[value] || translate(`unknown`);

const employmentStatusLabel = value => ({
  active: translate(`active`),
  probation: translate(`probation`),
  leave: translate(`leave`),
  suspended: translate(`suspended`)
})[value] || translate(`unknown`);

const workModeLabel = value => ({
  onsite: translate(`onsite`),
  hybrid: translate(`hybrid`),
  remote: translate(`remote`)
})[value] || translate(`unknown`);

const documentTypeLabel = value => ({
  contract: translate(`contract`),
  national_id: translate(`nationalId`),
  passport: translate(`passport`),
  work_permit: translate(`workPermit`),
  insurance: translate(`insurance`),
  certificate: translate(`certificate`),
  other: translate(`other`)
})[value] || translate(`other`);

const movementTypeLabel = value => ({
  transfer: translate(`transfer`),
  promotion: translate(`promotion`),
  reassignment: translate(`reassignment`),
  manager_change: translate(`managerChange`),
  employment_change: translate(`employmentChange`),
  status_change: translate(`statusChange`),
  work_mode_change: translate(`workModeChange`)
})[value] || translate(`unknown`);

const positionLabel = id => {
  const position = positionById(id);
  if (!position) return id || translate(`unknown`);
  const title = titleById(position.jobTitleId);
  const titleName = localizedName(title);
  return titleName ? `${titleName} · ${position.code}` : position.code;
};

const managerLabel = id => {
  if (!id) return translate(`noManager`);
  const employee = employeeById(id);
  return employee ? localizedName(employee) : id;
};

const documentState = record => {
  if (record.status === `revoked`) return `revoked`;
  const expiryDate = toDate(record.expiryDate);
  if (!expiryDate) return `current`;
  const today = new Date(`${todayInput()}T00:00:00Z`);
  const differenceDays = Math.floor((expiryDate.getTime() - today.getTime()) / 86400000);
  if (differenceDays < 0) return `expired`;
  if (differenceDays <= 30) return `expiring`;
  return `current`;
};

const documentStateLabel = record => ({
  current: translate(`currentDocuments`),
  expiring: translate(`expiringSoon`),
  expired: translate(`expiredDocuments`),
  revoked: translate(`revoked`)
})[documentState(record)];

const renderSharedHeader = () => {
  const email = state.user?.email || state.user?.uid || ``;
  elements.signedInEmail.textContent = email;
  elements.signedInAvatar.textContent = initialFor(email);
  if (elements.myProfileNav) elements.myProfileNav.hidden = !state.ownEmployee;
  if (elements.peopleAdminNav) elements.peopleAdminNav.hidden = !isAdmin();

  if (pageType === `documents`) {
    elements.openDocumentButton.hidden = !isAdmin();
    elements.documentEmployeeFilter.hidden = !isAdmin();
    elements.documentsDirectoryTitle.textContent = translate(isAdmin() ? `allEmployeeDocuments` : `myDocuments`);
    elements.documentsBannerTitle.textContent = translate(isAdmin() ? `documentsBannerAdmin` : `documentsBannerEmployee`);
    elements.documentsBannerCopy.textContent = translate(isAdmin() ? `documentsBannerAdminCopy` : `documentsBannerEmployeeCopy`);
  }

  if (pageType === `lifecycle`) {
    elements.openMovementButton.hidden = !isAdmin();
    elements.movementEmployeeFilter.hidden = !isAdmin();
    elements.movementDirectoryTitle.textContent = translate(isAdmin() ? `allEmployeeMovements` : `myEmploymentHistory`);
    elements.lifecycleBannerTitle.textContent = translate(isAdmin() ? `lifecycleBannerAdmin` : `lifecycleBannerEmployee`);
    elements.lifecycleBannerCopy.textContent = translate(isAdmin() ? `lifecycleBannerAdminCopy` : `lifecycleBannerEmployeeCopy`);
  }
};

const setLanguage = language => {
  state.language = language === `ar` ? `ar` : `en`;
  localStorage.setItem(`nasna-language`, state.language);
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === `ar` ? `rtl` : `ltr`;
  auth.languageCode = state.language;
  elements.languageLabel.textContent = state.language === `ar` ? `English` : `العربية`;

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll(`[data-i18n-placeholder]`).forEach(element => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });

  document.title = pageType === `documents`
    ? state.language === `ar` ? `الوثائق والعقود | ناسنا` : `Documents & Contracts | NASNA`
    : state.language === `ar` ? `دورة حياة الموظف | ناسنا` : `Employment Lifecycle | NASNA`;

  if (state.company) {
    populateFilters();
    renderSharedHeader();
    if (pageType === `documents`) renderDocuments();
    if (pageType === `lifecycle`) renderMovements();
  }
};

const loadReferenceData = async () => {
  const [employeesSnapshot, positionsSnapshot, titlesSnapshot, membersSnapshot] = await Promise.all([
    getDocs(companyCollection(`employees`)),
    getDocs(companyCollection(`positions`)),
    getDocs(companyCollection(`jobTitles`)),
    getDocs(companyCollection(`members`))
  ]);
  state.employees = employeesSnapshot.docs.map(record => record.data()).sort((a, b) => (
    localizedName(a).localeCompare(localizedName(b), state.language)
  ));
  state.positions = positionsSnapshot.docs.map(record => record.data());
  state.titles = titlesSnapshot.docs.map(record => record.data());
  state.members = membersSnapshot.docs.map(record => record.data());
  state.ownEmployee = state.employees.find(employee => (
    employee.authUid === state.user.uid
    || employee.id === state.membership.employeeId
  )) || null;
};

const loadDocuments = async () => {
  const source = isAdmin()
    ? companyCollection(`employeeDocuments`)
    : query(
        companyCollection(`employeeDocuments`),
        where(`employeeAuthUid`, `==`, state.user.uid),
        where(`visibility`, `==`, `employee`)
      );
  const snapshot = await getDocs(source);
  state.documents = snapshot.docs.map(record => record.data()).sort((a, b) => {
    const aDate = toDate(a.expiryDate)?.getTime() || Number.MAX_SAFE_INTEGER;
    const bDate = toDate(b.expiryDate)?.getTime() || Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
};

const loadMovements = async () => {
  const source = isAdmin()
    ? companyCollection(`employeeMovements`)
    : query(companyCollection(`employeeMovements`), where(`employeeAuthUid`, `==`, state.user.uid));
  const snapshot = await getDocs(source);
  state.movements = snapshot.docs.map(record => record.data()).sort((a, b) => {
    const effectiveDifference = (toDate(b.effectiveDate)?.getTime() || 0) - (toDate(a.effectiveDate)?.getTime() || 0);
    if (effectiveDifference) return effectiveDifference;
    return (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0);
  });
};

const loadSession = async user => {
  state.user = user;
  const profileSnapshot = await getDoc(doc(db, `nasna_users`, user.uid));
  if (!profileSnapshot.exists()) throw Object.assign(new Error(`Missing NASNA profile.`), { code: `permission-denied` });
  state.userProfile = profileSnapshot.data();
  state.companyId = state.userProfile.activeCompanyId;
  if (!state.companyId || state.userProfile.status !== `active`) {
    throw Object.assign(new Error(`Disabled NASNA access.`), { code: `permission-denied` });
  }

  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(doc(db, `nasna_companies`, state.companyId)),
    getDoc(companyDoc(`members`, user.uid))
  ]);
  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw Object.assign(new Error(`Missing company membership.`), { code: `permission-denied` });
  }
  state.company = companySnapshot.data();
  state.membership = membershipSnapshot.data();
  if (state.membership.status !== `active`) {
    throw Object.assign(new Error(`Disabled company membership.`), { code: `permission-denied` });
  }

  await loadReferenceData();
  if (!isAdmin() && !state.ownEmployee) {
    window.location.replace(`dashboard.html?v=${release}`);
    return false;
  }
  if (pageType === `documents`) await loadDocuments();
  if (pageType === `lifecycle`) await loadMovements();
  return true;
};

const populateEmployeeOptions = (select, includeAll = false, selectedValue = ``) => {
  if (!select) return;
  const firstOption = includeAll
    ? `<option value="">${escapeHtml(translate(`allEmployees`))}</option>`
    : `<option value="">${escapeHtml(translate(`employee`))}</option>`;
  select.innerHTML = firstOption + state.employees.map(employee => `
    <option value="${escapeHtml(employee.id)}"${employee.id === selectedValue ? ` selected` : ``}>
      ${escapeHtml(`${employee.id} · ${localizedName(employee)}`)}
    </option>
  `).join(``);
};

const populateFilters = () => {
  if (pageType === `documents`) {
    const employeeFilterValue = elements.documentEmployeeFilter?.value || ``;
    populateEmployeeOptions(elements.documentEmployeeFilter, true, employeeFilterValue);
    const typeValue = elements.documentTypeFilter?.value || ``;
    const stateValue = elements.documentStateFilter?.value || ``;
    if (elements.documentTypeFilter) elements.documentTypeFilter.value = typeValue;
    if (elements.documentStateFilter) elements.documentStateFilter.value = stateValue;
  }
  if (pageType === `lifecycle`) {
    const employeeFilterValue = elements.movementEmployeeFilter?.value || ``;
    populateEmployeeOptions(elements.movementEmployeeFilter, true, employeeFilterValue);
    const typeValue = elements.movementTypeFilter?.value || ``;
    if (elements.movementTypeFilter) elements.movementTypeFilter.value = typeValue;
  }
};

const renderDocuments = () => {
  const states = state.documents.map(record => documentState(record));
  elements.totalDocuments.textContent = String(state.documents.length);
  elements.currentDocuments.textContent = String(states.filter(value => value === `current`).length);
  elements.expiringDocuments.textContent = String(states.filter(value => value === `expiring`).length);
  elements.expiredDocuments.textContent = String(states.filter(value => value === `expired`).length);

  const search = normalizeSearch(elements.documentSearch.value);
  const employeeFilter = elements.documentEmployeeFilter.value;
  const typeFilter = elements.documentTypeFilter.value;
  const stateFilter = elements.documentStateFilter.value;
  const filtered = state.documents.filter(record => {
    const employee = employeeById(record.employeeId);
    const haystack = [
      record.title,
      record.documentNumber,
      record.employeeId,
      localizedName(employee),
      documentTypeLabel(record.type)
    ].join(` `).toLocaleLowerCase();
    return (!search || haystack.includes(search))
      && (!employeeFilter || record.employeeId === employeeFilter)
      && (!typeFilter || record.type === typeFilter)
      && (!stateFilter || documentState(record) === stateFilter);
  });

  elements.documentsGrid.innerHTML = filtered.map(record => {
    const employee = employeeById(record.employeeId);
    const stateName = documentState(record);
    const link = safeHttpsUrl(record.linkUrl);
    return `
      <article class="document-card" data-document-id="${escapeHtml(record.id)}">
        <header class="document-card__header">
          <span class="document-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6m-6 4h6"/></svg>
          </span>
          <span class="badge badge--${escapeHtml(stateName)}">${escapeHtml(documentStateLabel(record))}</span>
        </header>
        <div>
          <p class="eyebrow">${escapeHtml(documentTypeLabel(record.type))}</p>
          <h3 dir="auto">${escapeHtml(record.title)}</h3>
        </div>
        <div class="person-line">
          <span class="avatar">${escapeHtml(initialFor(localizedName(employee)))}</span>
          <span>
            <strong dir="auto">${escapeHtml(localizedName(employee) || record.employeeId)}</strong>
            <small>${escapeHtml(record.employeeId)}</small>
          </span>
        </div>
        <dl class="metadata-grid">
          <div><dt>${escapeHtml(translate(`documentNumber`))}</dt><dd dir="auto">${escapeHtml(record.documentNumber || translate(`unknown`))}</dd></div>
          <div><dt>${escapeHtml(translate(`issueDate`))}</dt><dd>${escapeHtml(record.issueDate ? formatDate(record.issueDate) : translate(`unknown`))}</dd></div>
          <div><dt>${escapeHtml(translate(`expiryDate`))}</dt><dd>${escapeHtml(record.expiryDate ? formatDate(record.expiryDate) : translate(`noExpiry`))}</dd></div>
          <div><dt>${escapeHtml(translate(`visibility`))}</dt><dd>${escapeHtml(translate(record.visibility === `employee` ? `employeeVisible` : `hrOnly`))}</dd></div>
        </dl>
        <footer class="document-card__footer">
          <span class="badge badge--${record.visibility === `employee` ? `employee` : `hr-only`}">${escapeHtml(translate(record.visibility === `employee` ? `employeeVisible` : `hrOnly`))}</span>
          <span class="workspace-actions">
            ${link ? `<a class="text-button" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(translate(`openReference`))}</a>` : ``}
            ${isAdmin() ? `<button class="text-button" type="button" data-action="edit-document">${escapeHtml(translate(`edit`))}</button>` : ``}
          </span>
        </footer>
      </article>
    `;
  }).join(``);
  elements.documentsEmpty.hidden = Boolean(filtered.length);
};

const openDocumentModal = documentId => {
  if (!isAdmin()) {
    showToast(`permissionDenied`, `error`);
    return;
  }
  const existing = documentId
    ? state.documents.find(record => record.id === documentId)
    : null;
  state.editingDocumentId = existing?.id || null;
  elements.documentForm.reset();
  setError(elements.documentFormError);
  elements.documentMode.value = existing ? `edit` : `create`;
  elements.documentId.value = existing?.id || ``;
  populateEmployeeOptions(elements.documentEmployeeId, false, existing?.employeeId || ``);
  elements.documentEmployeeId.disabled = Boolean(existing);
  elements.documentModalTitle.textContent = translate(existing ? `updateDocument` : `addDocument`);
  elements.saveDocumentButton.querySelector(`span`).textContent = translate(existing ? `updateDocument` : `saveDocument`);

  if (existing) {
    elements.documentType.value = existing.type;
    elements.documentTitle.value = existing.title || ``;
    elements.documentNumber.value = existing.documentNumber || ``;
    elements.documentVisibility.value = existing.visibility || `employee`;
    elements.documentIssueDate.value = inputDate(existing.issueDate);
    elements.documentExpiryDate.value = inputDate(existing.expiryDate);
    elements.documentStatus.value = existing.status || `active`;
    elements.documentLinkUrl.value = existing.linkUrl || ``;
  } else {
    elements.documentType.value = `contract`;
    elements.documentVisibility.value = `employee`;
    elements.documentStatus.value = `active`;
  }
  elements.documentModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => elements.documentEmployeeId.focus(), 0);
};

const closeDocumentModal = () => {
  elements.documentModal.hidden = true;
  document.body.style.overflow = ``;
  state.editingDocumentId = null;
};

const validateDocumentForm = () => {
  setError(elements.documentFormError);
  const existing = state.editingDocumentId
    ? state.documents.find(record => record.id === state.editingDocumentId)
    : null;
  const employeeId = existing?.employeeId || safeTrim(elements.documentEmployeeId.value);
  const employee = employeeById(employeeId);
  const type = safeTrim(elements.documentType.value);
  const title = safeTrim(elements.documentTitle.value);
  const documentNumber = safeTrim(elements.documentNumber.value);
  const visibility = safeTrim(elements.documentVisibility.value);
  const issueDate = elements.documentIssueDate.value;
  const expiryDate = elements.documentExpiryDate.value;
  const status = safeTrim(elements.documentStatus.value);
  const rawLinkUrl = safeTrim(elements.documentLinkUrl.value);
  const linkUrl = safeHttpsUrl(rawLinkUrl);

  if (!employee || !documentTypes.has(type) || !title || !documentVisibilities.has(visibility) || !documentStatuses.has(status)) {
    setError(elements.documentFormError, translate(`requiredFields`));
    return null;
  }
  if (rawLinkUrl && !linkUrl) {
    setError(elements.documentFormError, translate(`invalidHttpsUrl`));
    elements.documentLinkUrl.focus();
    return null;
  }
  if (issueDate && expiryDate && expiryDate < issueDate) {
    setError(elements.documentFormError, translate(`expiryBeforeIssue`));
    elements.documentExpiryDate.focus();
    return null;
  }
  if (
    documentNumber
    && status === `active`
    && state.documents.some(record => (
      record.id !== existing?.id
      && record.employeeId === employeeId
      && record.type === type
      && record.status === `active`
      && normalizeSearch(record.documentNumber) === normalizeSearch(documentNumber)
    ))
  ) {
    setError(elements.documentFormError, translate(`duplicateDocument`));
    elements.documentNumber.focus();
    return null;
  }
  return {
    existing,
    employee,
    employeeId,
    type,
    title,
    documentNumber,
    visibility,
    issueDate,
    expiryDate,
    status,
    linkUrl
  };
};

const handleDocumentSubmit = async event => {
  event.preventDefault();
  if (!isAdmin()) {
    showToast(`permissionDenied`, `error`);
    return;
  }
  const values = validateDocumentForm();
  if (!values) return;
  setButtonLoading(elements.saveDocumentButton, true, `loading`);
  try {
    const id = values.existing?.id || crypto.randomUUID();
    const batch = writeBatch(db);
    batch.set(companyDoc(`employeeDocuments`, id), {
      id,
      companyId: state.companyId,
      employeeId: values.employeeId,
      employeeAuthUid: values.employee.authUid,
      type: values.type,
      title: values.title,
      documentNumber: values.documentNumber,
      issueDate: timestampFromInput(values.issueDate),
      expiryDate: timestampFromInput(values.expiryDate),
      linkUrl: values.linkUrl,
      visibility: values.visibility,
      status: values.status,
      createdAt: values.existing?.createdAt || serverTimestamp(),
      createdBy: values.existing?.createdBy || state.user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    batch.set(auditRef(), auditRecord(
      values.existing ? `employee_document.updated` : `employee_document.created`,
      id,
      {
        employeeId: values.employeeId,
        documentType: values.type,
        visibility: values.visibility,
        status: values.status
      }
    ));
    await batch.commit();
    await loadDocuments();
    closeDocumentModal();
    renderDocuments();
    showToast(values.existing ? `documentUpdated` : `documentSaved`);
  } catch (error) {
    console.error(`NASNA document save error.`, error);
    setError(elements.documentFormError, translate(firebaseErrorKey(error)));
  } finally {
    setButtonLoading(elements.saveDocumentButton, false, `loading`);
  }
};

const movementChangeRows = movement => {
  const candidates = [
    {
      key: `position`,
      previous: movement.previousPositionId,
      next: movement.newPositionId,
      label: positionLabel
    },
    {
      key: `manager`,
      previous: movement.previousManagerEmployeeId,
      next: movement.newManagerEmployeeId,
      label: managerLabel
    },
    {
      key: `employmentType`,
      previous: movement.previousEmploymentType,
      next: movement.newEmploymentType,
      label: employmentTypeLabel
    },
    {
      key: `employmentStatus`,
      previous: movement.previousEmploymentStatus,
      next: movement.newEmploymentStatus,
      label: employmentStatusLabel
    },
    {
      key: `workMode`,
      previous: movement.previousWorkMode,
      next: movement.newWorkMode,
      label: workModeLabel
    }
  ];
  return candidates.filter(item => item.previous !== item.next).map(item => `
    <div class="change-row">
      <span>
        <small>${escapeHtml(translate(`before`))}</small>
        <strong dir="auto">${escapeHtml(item.label(item.previous))}</strong>
      </span>
      <span class="change-arrow">→</span>
      <span>
        <small>${escapeHtml(translate(`after`))}</small>
        <strong dir="auto">${escapeHtml(item.label(item.next))}</strong>
      </span>
    </div>
  `).join(``);
};

const renderMovements = () => {
  elements.totalMovements.textContent = String(state.movements.length);
  elements.careerMovements.textContent = String(state.movements.filter(record => (
    [`transfer`, `promotion`, `reassignment`].includes(record.movementType)
  )).length);
  elements.managerMovements.textContent = String(state.movements.filter(record => (
    record.previousManagerEmployeeId !== record.newManagerEmployeeId
  )).length);
  elements.statusMovements.textContent = String(state.movements.filter(record => (
    record.previousEmploymentStatus !== record.newEmploymentStatus
  )).length);

  const search = normalizeSearch(elements.movementSearch.value);
  const employeeFilter = elements.movementEmployeeFilter.value;
  const typeFilter = elements.movementTypeFilter.value;
  const filtered = state.movements.filter(record => {
    const employee = employeeById(record.employeeId);
    const haystack = [
      record.employeeId,
      localizedName(employee),
      movementTypeLabel(record.movementType),
      record.reason
    ].join(` `).toLocaleLowerCase();
    return (!search || haystack.includes(search))
      && (!employeeFilter || record.employeeId === employeeFilter)
      && (!typeFilter || record.movementType === typeFilter);
  });

  elements.movementsList.innerHTML = filtered.map(record => {
    const employee = employeeById(record.employeeId);
    return `
      <article class="movement-card">
        <span class="movement-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="8" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="11" cy="18" r="1.5"/></svg>
        </span>
        <header class="movement-card__header">
          <div>
            <p class="eyebrow">${escapeHtml(movementTypeLabel(record.movementType))}</p>
            <h3 dir="auto">${escapeHtml(localizedName(employee) || record.employeeId)}</h3>
            <p>${escapeHtml(`${record.employeeId} · ${formatDate(record.effectiveDate)}`)}</p>
          </div>
          <span class="badge badge--current">${escapeHtml(movementTypeLabel(record.movementType))}</span>
        </header>
        <div class="movement-changes">${movementChangeRows(record)}</div>
        <p class="movement-reason" dir="auto">${escapeHtml(record.reason)}</p>
      </article>
    `;
  }).join(``);
  elements.movementsEmpty.hidden = Boolean(filtered.length);
};

const renderPositionOptions = selectedValue => {
  elements.movementPositionId.innerHTML = `
    <option value="">${escapeHtml(translate(`newPosition`))}</option>
    ${state.positions
      .filter(position => position.status === `active`)
      .sort((a, b) => positionLabel(a.id).localeCompare(positionLabel(b.id), state.language))
      .map(position => `
        <option value="${escapeHtml(position.id)}"${position.id === selectedValue ? ` selected` : ``}>
          ${escapeHtml(positionLabel(position.id))}
        </option>
      `).join(``)}
  `;
};

const renderManagerOptions = employeeId => {
  const currentValue = elements.movementManagerEmployeeId.value;
  elements.movementManagerEmployeeId.innerHTML = `
    <option value="">${escapeHtml(translate(`noManager`))}</option>
    ${state.employees
      .filter(employee => employee.id !== employeeId && isEmployeeActive(employee))
      .map(employee => `
        <option value="${escapeHtml(employee.id)}"${employee.id === currentValue ? ` selected` : ``}>
          ${escapeHtml(`${employee.id} · ${localizedName(employee)}`)}
        </option>
      `).join(``)}
  `;
};

const fillMovementFromEmployee = () => {
  const employee = employeeById(elements.movementEmployeeId.value);
  if (!employee) {
    elements.movementCurrentSummary.hidden = true;
    renderPositionOptions(``);
    renderManagerOptions(``);
    return;
  }
  renderPositionOptions(employee.positionId);
  renderManagerOptions(employee.id);
  elements.movementManagerEmployeeId.value = employee.managerEmployeeId || ``;
  elements.movementEmploymentType.value = employee.employmentType;
  elements.movementEmploymentStatus.value = employee.employmentStatus;
  elements.movementWorkMode.value = employee.workMode;
  elements.movementCurrentSummary.innerHTML = [
    [`currentPosition`, positionLabel(employee.positionId)],
    [`currentManager`, managerLabel(employee.managerEmployeeId)],
    [`currentStatus`, employmentStatusLabel(employee.employmentStatus)],
    [`currentArrangement`, `${employmentTypeLabel(employee.employmentType)} · ${workModeLabel(employee.workMode)}`]
  ].map(([key, value]) => `
    <span>
      <small>${escapeHtml(translate(key))}</small>
      <strong dir="auto">${escapeHtml(value)}</strong>
    </span>
  `).join(``);
  elements.movementCurrentSummary.hidden = false;
};

const openMovementModal = () => {
  if (!isAdmin()) {
    showToast(`permissionDenied`, `error`);
    return;
  }
  elements.movementForm.reset();
  setError(elements.movementFormError);
  populateEmployeeOptions(elements.movementEmployeeId);
  elements.movementType.value = `transfer`;
  elements.movementEffectiveDate.value = todayInput();
  elements.movementEffectiveDate.max = todayInput();
  elements.movementCurrentSummary.hidden = true;
  renderPositionOptions(``);
  renderManagerOptions(``);
  elements.movementModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => elements.movementEmployeeId.focus(), 0);
};

const closeMovementModal = () => {
  elements.movementModal.hidden = true;
  document.body.style.overflow = ``;
};

const reportingGraphHasCycle = employees => {
  const managerByEmployee = new Map(employees.map(employee => [
    employee.id,
    employee.managerEmployeeId || ``
  ]));
  for (const employee of employees) {
    const path = new Set();
    let currentId = employee.id;
    while (currentId) {
      if (path.has(currentId)) return true;
      path.add(currentId);
      currentId = managerByEmployee.get(currentId) || ``;
    }
  }
  return false;
};

const positionFilledCount = (positionId, excludeEmployeeId = ``) => state.employees.filter(employee => (
  employee.id !== excludeEmployeeId
  && employee.positionId === positionId
  && isEmployeeActive(employee)
)).length;

const movementTypeMatches = values => {
  const positionChanged = values.employee.positionId !== values.positionId;
  const managerChanged = values.employee.managerEmployeeId !== values.managerEmployeeId;
  const typeChanged = values.employee.employmentType !== values.employmentType;
  const statusChanged = values.employee.employmentStatus !== values.employmentStatus;
  const workModeChanged = values.employee.workMode !== values.workMode;
  if ([`transfer`, `promotion`, `reassignment`].includes(values.movementType)) return positionChanged;
  if (values.movementType === `manager_change`) return managerChanged;
  if (values.movementType === `employment_change`) return typeChanged;
  if (values.movementType === `status_change`) return statusChanged;
  if (values.movementType === `work_mode_change`) return workModeChanged;
  return false;
};

const validateMovementForm = () => {
  setError(elements.movementFormError);
  const employee = employeeById(elements.movementEmployeeId.value);
  const movementType = elements.movementType.value;
  const effectiveDate = elements.movementEffectiveDate.value;
  const positionId = elements.movementPositionId.value;
  const managerEmployeeId = elements.movementManagerEmployeeId.value;
  const employmentType = elements.movementEmploymentType.value;
  const employmentStatus = elements.movementEmploymentStatus.value;
  const workMode = elements.movementWorkMode.value;
  const reason = safeTrim(elements.movementReason.value);
  const position = positionById(positionId);
  const manager = managerEmployeeId ? employeeById(managerEmployeeId) : null;

  if (
    !employee
    || !movementTypes.has(movementType)
    || !effectiveDate
    || !reason
    || !employmentTypes.has(employmentType)
    || !employmentStatuses.has(employmentStatus)
    || !workModes.has(workMode)
  ) {
    setError(elements.movementFormError, translate(`requiredFields`));
    return null;
  }
  if (effectiveDate > todayInput()) {
    setError(elements.movementFormError, translate(`futureMovementNotAllowed`));
    elements.movementEffectiveDate.focus();
    return null;
  }
  if (!position || position.status !== `active`) {
    setError(elements.movementFormError, translate(`invalidPosition`));
    elements.movementPositionId.focus();
    return null;
  }
  if (managerEmployeeId && (!manager || !isEmployeeActive(manager) || managerEmployeeId === employee.id)) {
    setError(elements.movementFormError, translate(`invalidManager`));
    elements.movementManagerEmployeeId.focus();
    return null;
  }
  if (
    activeEmploymentStatuses.has(employmentStatus)
    && positionFilledCount(positionId, employee.id) >= Number(position.headcount || 0)
  ) {
    setError(elements.movementFormError, translate(`positionFull`));
    elements.movementPositionId.focus();
    return null;
  }

  const changed = (
    employee.positionId !== positionId
    || employee.managerEmployeeId !== managerEmployeeId
    || employee.employmentType !== employmentType
    || employee.employmentStatus !== employmentStatus
    || employee.workMode !== workMode
  );
  if (!changed) {
    setError(elements.movementFormError, translate(`movementRequired`));
    return null;
  }

  const values = {
    employee,
    movementType,
    effectiveDate,
    position,
    positionId,
    managerEmployeeId,
    employmentType,
    employmentStatus,
    workMode,
    reason
  };
  if (!movementTypeMatches(values)) {
    setError(elements.movementFormError, translate(`movementTypeMismatch`));
    elements.movementType.focus();
    return null;
  }

  const candidateEmployees = state.employees.map(record => (
    record.id === employee.id
      ? { ...record, managerEmployeeId, employmentStatus }
      : record
  ));
  if (reportingGraphHasCycle(candidateEmployees)) {
    setError(elements.movementFormError, translate(`managerCycle`));
    elements.movementManagerEmployeeId.focus();
    return null;
  }
  if (
    employmentStatus === `suspended`
    && state.employees.some(record => (
      record.managerEmployeeId === employee.id
      && record.id !== employee.id
      && isEmployeeActive(record)
    ))
  ) {
    setError(elements.movementFormError, translate(`managerHasReports`));
    elements.movementEmploymentStatus.focus();
    return null;
  }
  if (employmentStatus === `suspended` && employee.authUid === state.company.ownerId) {
    setError(elements.movementFormError, translate(`ownerCannotSuspend`));
    elements.movementEmploymentStatus.focus();
    return null;
  }
  if (employmentStatus === `suspended` && employee.authUid === state.user.uid) {
    setError(elements.movementFormError, translate(`cannotSuspendSelf`));
    elements.movementEmploymentStatus.focus();
    return null;
  }
  return values;
};

const managerCapabilityAfterMovement = (managerId, candidateEmployees) => candidateEmployees.some(employee => (
  employee.managerEmployeeId === managerId
  && isEmployeeActive(employee)
));

const handleMovementSubmit = async event => {
  event.preventDefault();
  if (!isAdmin()) {
    showToast(`permissionDenied`, `error`);
    return;
  }
  const values = validateMovementForm();
  if (!values) return;
  setButtonLoading(elements.applyMovementButton, true, `applying`);

  try {
    const id = crypto.randomUUID();
    const accessStatus = values.employmentStatus === `suspended` ? `disabled` : `active`;
    const candidateEmployees = state.employees.map(record => (
      record.id === values.employee.id
        ? {
            ...record,
            positionId: values.positionId,
            managerEmployeeId: values.managerEmployeeId,
            employmentType: values.employmentType,
            employmentStatus: values.employmentStatus,
            workMode: values.workMode
          }
        : record
    ));
    const batch = writeBatch(db);
    batch.update(companyDoc(`employees`, values.employee.id), {
      accessStatus,
      positionId: values.positionId,
      jobTitleId: values.position.jobTitleId,
      branchId: values.position.branchId,
      locationId: values.position.locationId || ``,
      departmentId: values.position.departmentId,
      teamId: values.position.teamId || ``,
      managerEmployeeId: values.managerEmployeeId,
      employmentType: values.employmentType,
      employmentStatus: values.employmentStatus,
      workMode: values.workMode,
      lastMovementId: id,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });

    const memberPatches = new Map();
    memberPatches.set(values.employee.authUid, {
      status: accessStatus,
      updatedAt: serverTimestamp()
    });
    const affectedEmployeeIds = new Set([
      values.employee.id,
      values.employee.managerEmployeeId,
      values.managerEmployeeId
    ]);
    affectedEmployeeIds.delete(``);
    affectedEmployeeIds.forEach(employeeId => {
      const employee = employeeById(employeeId);
      if (!employee?.authUid) return;
      const existingPatch = memberPatches.get(employee.authUid) || { updatedAt: serverTimestamp() };
      existingPatch.isManager = managerCapabilityAfterMovement(employeeId, candidateEmployees);
      memberPatches.set(employee.authUid, existingPatch);
    });
    memberPatches.forEach((patch, authUid) => {
      batch.update(companyDoc(`members`, authUid), patch);
    });
    batch.update(doc(db, `nasna_users`, values.employee.authUid), {
      status: accessStatus,
      updatedAt: serverTimestamp()
    });

    batch.set(companyDoc(`employeeMovements`, id), {
      id,
      companyId: state.companyId,
      employeeId: values.employee.id,
      employeeAuthUid: values.employee.authUid,
      movementType: values.movementType,
      effectiveDate: timestampFromInput(values.effectiveDate),
      reason: values.reason,
      previousPositionId: values.employee.positionId,
      newPositionId: values.positionId,
      previousManagerEmployeeId: values.employee.managerEmployeeId || ``,
      newManagerEmployeeId: values.managerEmployeeId,
      previousEmploymentType: values.employee.employmentType,
      newEmploymentType: values.employmentType,
      previousEmploymentStatus: values.employee.employmentStatus,
      newEmploymentStatus: values.employmentStatus,
      previousWorkMode: values.employee.workMode,
      newWorkMode: values.workMode,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
    batch.set(auditRef(), auditRecord(`employee_movement.applied`, id, {
      employeeId: values.employee.id,
      movementType: values.movementType,
      effectiveDate: values.effectiveDate
    }));
    await batch.commit();
    await loadReferenceData();
    await loadMovements();
    populateFilters();
    closeMovementModal();
    renderMovements();
    showToast(`movementApplied`);
  } catch (error) {
    console.error(`NASNA movement save error.`, error);
    setError(elements.movementFormError, translate(firebaseErrorKey(error)));
  } finally {
    setButtonLoading(elements.applyMovementButton, false, `applying`);
  }
};

const bindSharedEvents = () => {
  elements.languageButton.addEventListener(`click`, () => {
    setLanguage(state.language === `en` ? `ar` : `en`);
  });
  elements.signOutButton.addEventListener(`click`, async () => {
    elements.signOutButton.disabled = true;
    try {
      await signOut(auth);
      window.location.replace(`./?v=${release}`);
    } catch (error) {
      console.error(`NASNA sign-out error.`, error);
      elements.signOutButton.disabled = false;
      showToast(`signOutError`, `error`);
    }
  });
};

const bindDocumentEvents = () => {
  elements.openDocumentButton.addEventListener(`click`, () => openDocumentModal());
  elements.closeDocumentModal.addEventListener(`click`, closeDocumentModal);
  elements.cancelDocumentButton.addEventListener(`click`, closeDocumentModal);
  elements.documentForm.addEventListener(`submit`, handleDocumentSubmit);
  elements.documentSearch.addEventListener(`input`, renderDocuments);
  elements.documentEmployeeFilter.addEventListener(`change`, renderDocuments);
  elements.documentTypeFilter.addEventListener(`change`, renderDocuments);
  elements.documentStateFilter.addEventListener(`change`, renderDocuments);
  elements.documentsGrid.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-action="edit-document"]`);
    const card = button?.closest(`[data-document-id]`);
    if (card?.dataset.documentId) openDocumentModal(card.dataset.documentId);
  });
  elements.documentModal.addEventListener(`click`, event => {
    if (event.target === elements.documentModal) closeDocumentModal();
  });
};

const bindLifecycleEvents = () => {
  elements.openMovementButton.addEventListener(`click`, openMovementModal);
  elements.closeMovementModal.addEventListener(`click`, closeMovementModal);
  elements.cancelMovementButton.addEventListener(`click`, closeMovementModal);
  elements.movementForm.addEventListener(`submit`, handleMovementSubmit);
  elements.movementEmployeeId.addEventListener(`change`, fillMovementFromEmployee);
  elements.movementSearch.addEventListener(`input`, renderMovements);
  elements.movementEmployeeFilter.addEventListener(`change`, renderMovements);
  elements.movementTypeFilter.addEventListener(`change`, renderMovements);
  elements.movementModal.addEventListener(`click`, event => {
    if (event.target === elements.movementModal) closeMovementModal();
  });
};

const revealApp = () => {
  elements.authLoader.hidden = true;
  elements.recordsApp.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const initializePage = async user => {
  try {
    const loaded = await loadSession(user);
    if (!loaded) return;
    populateFilters();
    renderSharedHeader();
    if (pageType === `documents`) renderDocuments();
    if (pageType === `lifecycle`) renderMovements();
    revealApp();
  } catch (error) {
    console.error(`NASNA Core HR page load error.`, error);
    await signOut(auth).catch(() => undefined);
    window.location.replace(`./?error=access-disabled&v=${release}`);
  }
};

bindSharedEvents();
if (pageType === `documents`) bindDocumentEvents();
if (pageType === `lifecycle`) bindLifecycleEvents();
setLanguage(state.language);

const sessionFallback = window.setTimeout(() => {
  if (auth.currentUser) {
    initializePage(auth.currentUser);
    return;
  }
  window.location.replace(`./?v=${release}`);
}, 9000);

onAuthStateChanged(auth, user => {
  window.clearTimeout(sessionFallback);
  if (!user) {
    window.location.replace(`./?v=${release}`);
    return;
  }
  initializePage(user);
});
