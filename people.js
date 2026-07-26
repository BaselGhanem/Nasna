import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  deleteApp,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { auth, firebaseConfig } from "./firebase-config.js?v=20260726.3";
import { db } from "./firestore-config.js?v=20260726.3";

const release = `20260726.3`;
const pageType = document.body.dataset.page || `records`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const activeEmploymentStatuses = new Set([`active`, `probation`, `leave`]);
const employeeCodePattern = /^[A-Z0-9][A-Z0-9-]{1,19}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const employmentTypes = new Set([`permanent`, `fixed_term`, `part_time`, `intern`, `consultant`]);
const employmentStatuses = new Set([`active`, `probation`, `leave`, `suspended`]);
const workModes = new Set([`onsite`, `hybrid`, `remote`]);
const genderValues = new Set([`not_disclosed`, `male`, `female`]);
const maritalValues = new Set([`not_disclosed`, `single`, `married`, `divorced`, `widowed`]);

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your access…`,
    dashboard: `Dashboard`,
    myProfile: `My profile`,
    myTeam: `My team`,
    employeeRecords: `Employee records`,
    signOut: `Sign out`,
    stageLabel: `Stage 07 · People Core`,
    recordsTitle: `Employee records`,
    recordsCopy: `Create the trusted employee file, login account, reporting line, and job assignment in one controlled flow.`,
    signedInAs: `Signed in as`,
    activeWorkspace: `Active workspace`,
    yourRole: `Your role`,
    totalEmployees: `Total employees`,
    registeredFiles: `Registered employee files`,
    activeEmployees: `Active employees`,
    enabledAccess: `Enabled access`,
    peopleManagers: `People managers`,
    managerFiles: `Employees with direct reports`,
    availablePositions: `Open capacity`,
    approvedVacancies: `Approved unfilled positions`,
    peopleDirectory: `People directory`,
    employeeFiles: `Employee files`,
    employeeFilesCopy: `Only HR Admin and Super Admin can create or change employee records.`,
    downloadTemplate: `Download template`,
    importEmployees: `Import employees`,
    addEmployee: `Add employee`,
    searchEmployees: `Search by name, code, or email`,
    department: `Department`,
    allDepartments: `All departments`,
    status: `Status`,
    allStatuses: `All statuses`,
    active: `Active`,
    probation: `Probation`,
    leave: `On leave`,
    suspended: `Suspended`,
    employee: `Employee`,
    jobAssignment: `Job assignment`,
    reportingTo: `Reporting to`,
    access: `Access`,
    actions: `Actions`,
    noEmployees: `No employee files yet`,
    noEmployeesCopy: `Add the first employee manually or import the completed NASNA template.`,
    employeeFile: `Employee file`,
    createEmployee: `Create employee`,
    updateEmployee: `Update employee`,
    identityAndAccess: `Identity & access`,
    identityAndAccessCopy: `The work email becomes the employee’s NASNA login.`,
    employeeCode: `Employee code`,
    codeHelp: `2–20 uppercase letters, numbers, or hyphens.`,
    fullNameEn: `Full name in English`,
    fullNameAr: `Full name in Arabic`,
    workEmail: `Work email`,
    temporaryPassword: `Temporary password`,
    passwordHelp: `At least 8 characters. It is never stored in Firestore.`,
    existingAccountFound: `Existing NASNA account found`,
    existingAccountHelp: `This employee file will be linked to the existing administrator login. No new password is needed.`,
    workPhone: `Work phone`,
    jobAndReporting: `Job & reporting line`,
    jobAndReportingCopy: `The selected position supplies the approved branch, department, team, location, and job title.`,
    position: `Position`,
    manager: `Direct manager`,
    noManager: `No direct manager`,
    employmentDetails: `Employment details`,
    employmentDetailsCopy: `Core dates and working arrangement used by future attendance and leave modules.`,
    hireDate: `Hire date`,
    employmentType: `Employment type`,
    permanent: `Permanent`,
    fixedTerm: `Fixed term`,
    partTime: `Part time`,
    intern: `Intern`,
    consultant: `Consultant`,
    employmentStatus: `Employment status`,
    workMode: `Work mode`,
    onsite: `On-site`,
    hybrid: `Hybrid`,
    remote: `Remote`,
    personalDetails: `Personal & emergency details`,
    personalDetailsCopy: `Private fields visible only to the employee and HR.`,
    nationalId: `National ID`,
    dateOfBirth: `Date of birth`,
    gender: `Gender`,
    notDisclosed: `Not disclosed`,
    male: `Male`,
    female: `Female`,
    maritalStatus: `Marital status`,
    single: `Single`,
    married: `Married`,
    divorced: `Divorced`,
    widowed: `Widowed`,
    nationality: `Nationality`,
    personalEmail: `Personal email`,
    personalPhone: `Personal phone`,
    address: `Address`,
    emergencyContactName: `Emergency contact`,
    emergencyContactPhone: `Emergency phone`,
    hrNotes: `HR notes`,
    cancel: `Cancel`,
    bulkOnboarding: `Bulk onboarding`,
    templateStepCopy: `Use the official workbook without renaming columns or the Employees sheet.`,
    download: `Download`,
    uploadCompletedFile: `Upload completed file`,
    uploadStepCopy: `NASNA checks required fields, structure codes, capacity, duplicates, and reporting loops before import.`,
    chooseFile: `Choose file`,
    fileName: `File`,
    validRows: `Valid rows`,
    rowsWithErrors: `Rows with errors`,
    row: `Row`,
    validation: `Validation`,
    creatingAccounts: `Creating employee files and login accounts…`,
    importCompleted: `Import completed`,
    downloadCredentials: `Download one-time login credentials`,
    confirmImport: `Import validated employees`,
    edit: `Edit`,
    enabled: `Enabled`,
    disabled: `Disabled`,
    super_admin: `Super Admin`,
    hr_admin: `HR Admin`,
    manager_role: `Manager`,
    employee_role: `Employee`,
    branch: `Branch`,
    location: `Location`,
    team: `Team`,
    jobTitle: `Job title`,
    jobGrade: `Job grade`,
    currentPosition: `Current position`,
    positionCode: `Position code`,
    employeeWorkspace: `Employee workspace`,
    myEmployeeFile: `My employee file`,
    myEmployeeFileCopy: `Your trusted employment, organizational, and personal information in NASNA.`,
    profileNotLinked: `Your login is not linked to an employee file`,
    profileNotLinkedCopy: `Ask HR to create or link your employee record. Login access alone is not an employee file.`,
    backToDashboard: `Back to dashboard`,
    employmentProfile: `Employment profile`,
    jobAndOrganization: `Job & organization`,
    datesAndArrangement: `Dates & arrangement`,
    contact: `Contact`,
    workContact: `Work contact`,
    privateInformation: `Private information`,
    personalAndEmergency: `Personal & emergency details`,
    privateInformationCopy: `Visible only to you and authorized HR administrators.`,
    managerWorkspace: `Manager workspace`,
    myTeamCopy: `A focused view of employees who report directly to you. HR remains the only function allowed to change employee records.`,
    noTeamAccess: `No manager workspace is assigned`,
    noTeamAccessCopy: `This screen appears automatically when at least one active employee reports to your employee file.`,
    openMyProfile: `Open my profile`,
    youAreManagingAs: `You are managing as`,
    viewOnlyTeamData: `View-only team data`,
    hrOwnsEmployeeChanges: `HR owns all employee changes`,
    directReports: `Direct reports`,
    employeesReportingToYou: `Employees reporting to you`,
    availableNow: `Available now`,
    activeOrProbation: `Active or probation`,
    onLeave: `On leave`,
    currentlyOnLeave: `Currently marked on leave`,
    teamMembers: `Team members`,
    searchTeam: `Search team`,
    selectTeamMember: `Select a team member`,
    selectTeamMemberCopy: `Choose an employee to view their approved job and contact information.`,
    managerPrivacyNote: `Personal identifiers, private contact information, and HR notes are not available in the manager workspace.`,
    requiredFields: `Complete all required fields.`,
    invalidEmployeeCode: `Use a valid uppercase employee code.`,
    duplicateEmployeeCode: `This employee code already exists.`,
    invalidWorkEmail: `Enter a valid work email.`,
    duplicateWorkEmail: `This work email is already linked to another employee.`,
    passwordTooShort: `The temporary password must contain at least 8 characters.`,
    positionRequired: `Select an active approved position.`,
    positionFull: `The selected position has reached its approved headcount.`,
    invalidManager: `Select a valid active manager.`,
    managerCycle: `This reporting line creates a management loop.`,
    managerHasReports: `Reassign this manager’s active direct reports before suspending the employee.`,
    ownerCannotSuspend: `The workspace owner must remain active.`,
    personalEmailInvalid: `Enter a valid personal email or leave it blank.`,
    employeeCreated: `Employee file and login account created successfully.`,
    employeeLinked: `Employee file linked to the existing login successfully.`,
    employeeUpdated: `Employee file updated successfully.`,
    noPermission: `Only HR Admin and Super Admin can manage employee records.`,
    permissionDenied: `Access denied. Publish the latest Firestore rules and verify your active company membership.`,
    userAlreadyExists: `A Firebase login already exists for this work email.`,
    networkError: `The operation could not reach Firebase. Check the connection and try again.`,
    genericError: `The operation could not be completed.`,
    signOutError: `Sign-out could not be completed.`,
    importLibraryMissing: `The Excel reader did not load. Refresh once while connected to the internet.`,
    invalidWorkbook: `Use the official NASNA workbook and keep the Employees sheet name unchanged.`,
    emptyWorkbook: `The Employees sheet does not contain data rows.`,
    importHasErrors: `Correct every highlighted row before importing.`,
    importSuccessSummary: `{count} employee files and login accounts were created. Download the one-time credentials now; passwords are not stored in Firestore.`,
    importPartialSummary: `{success} employees were created and {failed} rows failed. Download successful credentials and correct only the failed rows.`,
    noCredentials: `No login credentials are available for download.`,
    credentialsDownloaded: `The one-time credentials file was downloaded.`,
    documents: `Documents`,
    employmentHistory: `History`,
    requests: `Requests`,
    managedByLifecycle: `Managed through employment movements`,
    managedByLifecycleCopy: `Position, manager, employment type, status, and work mode are locked here after creation. Use Employment History to apply an auditable HR movement.`,
    importRowFailed: `This row could not be created.`,
    rowValid: `Ready`,
    missingHeader: `Missing required column: {field}`,
    missingValue: `{field} is required.`,
    valueTooLong: `{field} exceeds the supported maximum length.`,
    invalidDate: `{field} must be a valid date in YYYY-MM-DD format.`,
    unknownPosition: `Position code does not exist or is inactive.`,
    unknownManager: `Manager employee code does not exist.`,
    duplicateInFile: `Duplicate employee code or work email in the file.`,
    invalidEmploymentType: `Employment Type is not supported.`,
    invalidEmploymentStatus: `Employment Status is not supported.`,
    invalidWorkMode: `Work Mode is not supported.`,
    positionCapacityExceeded: `Approved headcount is exceeded by this file.`,
    managerSelfReference: `An employee cannot report to their own code.`,
    importManagerCycle: `The file contains a circular reporting line.`,
    loading: `Loading…`,
    notAvailable: `Not available`,
    privateRecordUnavailable: `Private information could not be loaded.`,
    noMatchingEmployees: `No employee matches the current filters.`,
    employeeCodeLocked: `Employee code is permanent after creation.`,
    emailLocked: `Work email is tied to the Firebase login and cannot be changed here.`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من الصلاحيات…`,
    dashboard: `لوحة التحكم`,
    myProfile: `ملفي`,
    myTeam: `فريقي`,
    employeeRecords: `ملفات الموظفين`,
    signOut: `تسجيل الخروج`,
    stageLabel: `المرحلة 07 · نواة الموظفين`,
    recordsTitle: `ملفات الموظفين`,
    recordsCopy: `أنشئ ملف الموظف الموثوق وحساب الدخول والتبعية الإدارية والتعيين الوظيفي ضمن مسار واحد مضبوط.`,
    signedInAs: `مسجل الدخول باسم`,
    activeWorkspace: `مساحة العمل الحالية`,
    yourRole: `صلاحيتك`,
    totalEmployees: `إجمالي الموظفين`,
    registeredFiles: `ملفات الموظفين المسجلة`,
    activeEmployees: `الموظفون الفعالون`,
    enabledAccess: `حسابات الدخول المفعلة`,
    peopleManagers: `مديرو الفرق`,
    managerFiles: `موظفون لديهم مرؤوسون مباشرون`,
    availablePositions: `الشواغر المتاحة`,
    approvedVacancies: `سعة وظيفية معتمدة وغير مشغولة`,
    peopleDirectory: `دليل الموظفين`,
    employeeFiles: `ملفات الموظفين`,
    employeeFilesCopy: `مدير الموارد البشرية والمسؤول الكامل فقط يمكنهما إنشاء أو تعديل ملفات الموظفين.`,
    downloadTemplate: `تنزيل القالب`,
    importEmployees: `استيراد الموظفين`,
    addEmployee: `إضافة موظف`,
    searchEmployees: `ابحث بالاسم أو الرقم أو البريد`,
    department: `القسم`,
    allDepartments: `كل الأقسام`,
    status: `الحالة`,
    allStatuses: `كل الحالات`,
    active: `فعال`,
    probation: `تحت التجربة`,
    leave: `في إجازة`,
    suspended: `موقوف`,
    employee: `الموظف`,
    jobAssignment: `التعيين الوظيفي`,
    reportingTo: `المدير المباشر`,
    access: `الدخول`,
    actions: `الإجراءات`,
    noEmployees: `لا توجد ملفات موظفين بعد`,
    noEmployeesCopy: `أضف أول موظف يدويًا أو ارفع قالب ناسنا المكتمل.`,
    employeeFile: `ملف الموظف`,
    createEmployee: `إنشاء الموظف`,
    updateEmployee: `تحديث الموظف`,
    identityAndAccess: `الهوية والدخول`,
    identityAndAccessCopy: `بريد العمل يصبح اسم دخول الموظف إلى ناسنا.`,
    employeeCode: `رقم الموظف`,
    codeHelp: `من 2 إلى 20 حرفًا إنجليزيًا كبيرًا أو رقمًا أو شرطة.`,
    fullNameEn: `الاسم الكامل بالإنجليزية`,
    fullNameAr: `الاسم الكامل بالعربية`,
    workEmail: `بريد العمل`,
    temporaryPassword: `كلمة مرور مؤقتة`,
    passwordHelp: `8 خانات على الأقل، ولا يتم تخزينها في Firestore.`,
    existingAccountFound: `تم العثور على حساب ناسنا موجود`,
    existingAccountHelp: `سيتم ربط ملف الموظف بحساب المدير الموجود، ولا حاجة لإنشاء كلمة مرور جديدة.`,
    workPhone: `هاتف العمل`,
    jobAndReporting: `الوظيفة والتبعية الإدارية`,
    jobAndReportingCopy: `المنصب المختار يحدد الفرع والقسم والفريق والموقع والمسمى الوظيفي المعتمد.`,
    position: `المنصب`,
    manager: `المدير المباشر`,
    noManager: `بدون مدير مباشر`,
    employmentDetails: `تفاصيل العمل`,
    employmentDetailsCopy: `تواريخ ونظام العمل التي ستعتمد عليها وحدات الحضور والإجازات لاحقًا.`,
    hireDate: `تاريخ التعيين`,
    employmentType: `نوع التوظيف`,
    permanent: `دائم`,
    fixedTerm: `محدد المدة`,
    partTime: `دوام جزئي`,
    intern: `متدرب`,
    consultant: `مستشار`,
    employmentStatus: `الحالة الوظيفية`,
    workMode: `نظام العمل`,
    onsite: `من موقع العمل`,
    hybrid: `هجين`,
    remote: `عن بُعد`,
    personalDetails: `البيانات الشخصية والطوارئ`,
    personalDetailsCopy: `حقول خاصة يراها الموظف والموارد البشرية فقط.`,
    nationalId: `الرقم الوطني`,
    dateOfBirth: `تاريخ الميلاد`,
    gender: `الجنس`,
    notDisclosed: `غير مفصح`,
    male: `ذكر`,
    female: `أنثى`,
    maritalStatus: `الحالة الاجتماعية`,
    single: `أعزب`,
    married: `متزوج`,
    divorced: `مطلق`,
    widowed: `أرمل`,
    nationality: `الجنسية`,
    personalEmail: `البريد الشخصي`,
    personalPhone: `الهاتف الشخصي`,
    address: `العنوان`,
    emergencyContactName: `اسم شخص الطوارئ`,
    emergencyContactPhone: `هاتف الطوارئ`,
    hrNotes: `ملاحظات الموارد البشرية`,
    cancel: `إلغاء`,
    bulkOnboarding: `الإدخال الجماعي`,
    templateStepCopy: `استخدم ملف ناسنا الرسمي دون تغيير أسماء الأعمدة أو ورقة Employees.`,
    download: `تنزيل`,
    uploadCompletedFile: `رفع الملف المكتمل`,
    uploadStepCopy: `يفحص ناسنا الحقول والرموز والسعة والتكرار ودوران التبعية قبل الاستيراد.`,
    chooseFile: `اختيار الملف`,
    fileName: `الملف`,
    validRows: `صفوف سليمة`,
    rowsWithErrors: `صفوف فيها أخطاء`,
    row: `السطر`,
    validation: `التحقق`,
    creatingAccounts: `جارٍ إنشاء ملفات الموظفين وحسابات الدخول…`,
    importCompleted: `اكتمل الاستيراد`,
    downloadCredentials: `تنزيل بيانات الدخول لمرة واحدة`,
    confirmImport: `استيراد الموظفين السليمين`,
    edit: `تعديل`,
    enabled: `مفعل`,
    disabled: `معطل`,
    super_admin: `مسؤول كامل`,
    hr_admin: `مسؤول الموارد البشرية`,
    manager_role: `مدير`,
    employee_role: `موظف`,
    branch: `الفرع`,
    location: `موقع العمل`,
    team: `الفريق`,
    jobTitle: `المسمى الوظيفي`,
    jobGrade: `الدرجة الوظيفية`,
    currentPosition: `المنصب الحالي`,
    positionCode: `رمز المنصب`,
    employeeWorkspace: `مساحة الموظف`,
    myEmployeeFile: `ملفي الوظيفي`,
    myEmployeeFileCopy: `بياناتك الوظيفية والتنظيمية والشخصية الموثوقة داخل ناسنا.`,
    profileNotLinked: `حساب الدخول غير مربوط بملف موظف`,
    profileNotLinkedCopy: `اطلب من الموارد البشرية إنشاء ملفك أو ربطه. حساب الدخول وحده ليس ملف موظف.`,
    backToDashboard: `العودة للوحة التحكم`,
    employmentProfile: `الملف الوظيفي`,
    jobAndOrganization: `الوظيفة والهيكل`,
    datesAndArrangement: `التواريخ ونظام العمل`,
    contact: `التواصل`,
    workContact: `معلومات العمل`,
    privateInformation: `معلومات خاصة`,
    personalAndEmergency: `البيانات الشخصية والطوارئ`,
    privateInformationCopy: `تظهر لك ولمسؤولي الموارد البشرية المخولين فقط.`,
    managerWorkspace: `مساحة المدير`,
    myTeamCopy: `عرض مخصص للموظفين المرتبطين بك مباشرة. تبقى الموارد البشرية وحدها صاحبة صلاحية تعديل ملفاتهم.`,
    noTeamAccess: `لا توجد مساحة مدير مرتبطة بحسابك`,
    noTeamAccessCopy: `تظهر هذه الشاشة تلقائيًا عند ربط موظف فعال واحد على الأقل بملفك كمدير مباشر.`,
    openMyProfile: `فتح ملفي`,
    youAreManagingAs: `تدير الفريق بصفتك`,
    viewOnlyTeamData: `بيانات الفريق للعرض فقط`,
    hrOwnsEmployeeChanges: `تعديلات الموظفين لدى الموارد البشرية`,
    directReports: `المرؤوسون المباشرون`,
    employeesReportingToYou: `موظفون يتبعون لك مباشرة`,
    availableNow: `متاحون الآن`,
    activeOrProbation: `فعالون أو تحت التجربة`,
    onLeave: `في إجازة`,
    currentlyOnLeave: `مسجلون حاليًا في إجازة`,
    teamMembers: `أعضاء الفريق`,
    searchTeam: `ابحث في الفريق`,
    selectTeamMember: `اختر موظفًا من الفريق`,
    selectTeamMemberCopy: `اختر موظفًا لعرض معلومات العمل والتواصل المعتمدة.`,
    managerPrivacyNote: `لا تظهر الأرقام الشخصية ومعلومات الاتصال الخاصة وملاحظات الموارد البشرية في مساحة المدير.`,
    requiredFields: `أكمل جميع الحقول المطلوبة.`,
    invalidEmployeeCode: `استخدم رقم موظف صحيحًا بالأحرف الإنجليزية الكبيرة.`,
    duplicateEmployeeCode: `رقم الموظف مستخدم مسبقًا.`,
    invalidWorkEmail: `أدخل بريد عمل صحيحًا.`,
    duplicateWorkEmail: `بريد العمل مربوط بموظف آخر.`,
    passwordTooShort: `كلمة المرور المؤقتة يجب ألا تقل عن 8 خانات.`,
    positionRequired: `اختر منصبًا معتمدًا وفعالًا.`,
    positionFull: `وصل المنصب إلى العدد المعتمد.`,
    invalidManager: `اختر مديرًا فعالًا وصحيحًا.`,
    managerCycle: `هذه التبعية تنشئ حلقة إدارية غير صحيحة.`,
    managerHasReports: `أعد توزيع المرؤوسين الفعالين قبل إيقاف هذا المدير.`,
    ownerCannotSuspend: `يجب أن يبقى مالك مساحة العمل فعالًا.`,
    personalEmailInvalid: `أدخل بريدًا شخصيًا صحيحًا أو اتركه فارغًا.`,
    employeeCreated: `تم إنشاء ملف الموظف وحساب الدخول بنجاح.`,
    employeeLinked: `تم ربط ملف الموظف بحساب الدخول الموجود بنجاح.`,
    employeeUpdated: `تم تحديث ملف الموظف بنجاح.`,
    noPermission: `مسؤول الموارد البشرية والمسؤول الكامل فقط يمكنهما إدارة الموظفين.`,
    permissionDenied: `تم رفض الوصول. انشر أحدث قواعد Firestore وتحقق من عضوية الشركة الفعالة.`,
    userAlreadyExists: `يوجد حساب Firebase مسبق لبريد العمل هذا.`,
    networkError: `تعذر الاتصال بـ Firebase. تحقق من الإنترنت وحاول مجددًا.`,
    genericError: `تعذر إكمال العملية.`,
    signOutError: `تعذر تسجيل الخروج.`,
    importLibraryMissing: `لم يتم تحميل قارئ Excel. حدّث الصفحة مرة واحدة أثناء الاتصال بالإنترنت.`,
    invalidWorkbook: `استخدم ملف ناسنا الرسمي وأبقِ اسم الورقة Employees دون تغيير.`,
    emptyWorkbook: `لا تحتوي ورقة Employees على صفوف بيانات.`,
    importHasErrors: `صحح جميع الصفوف المحددة قبل الاستيراد.`,
    importSuccessSummary: `تم إنشاء {count} ملف موظف وحساب دخول. نزّل بيانات الدخول الآن لأنها لا تُخزن في Firestore.`,
    importPartialSummary: `تم إنشاء {success} موظف وفشل {failed} صف. نزّل بيانات الناجحين وصحح الصفوف الفاشلة فقط.`,
    noCredentials: `لا توجد بيانات دخول متاحة للتنزيل.`,
    credentialsDownloaded: `تم تنزيل ملف بيانات الدخول لمرة واحدة.`,
    documents: `الوثائق`,
    employmentHistory: `السجل الوظيفي`,
    requests: `الطلبات`,
    managedByLifecycle: `تُدار من خلال الحركات الوظيفية`,
    managedByLifecycleCopy: `المنصب والمدير ونوع التوظيف والحالة ونظام العمل مقفلة هنا بعد الإنشاء. استخدم السجل الوظيفي لتنفيذ حركة HR موثقة.`,
    importRowFailed: `تعذر إنشاء هذا الصف.`,
    rowValid: `جاهز`,
    missingHeader: `العمود المطلوب غير موجود: {field}`,
    missingValue: `الحقل {field} مطلوب.`,
    valueTooLong: `يتجاوز الحقل {field} الحد الأقصى المدعوم.`,
    invalidDate: `الحقل {field} يجب أن يكون تاريخًا صحيحًا بصيغة YYYY-MM-DD.`,
    unknownPosition: `رمز المنصب غير موجود أو غير فعال.`,
    unknownManager: `رقم المدير غير موجود.`,
    duplicateInFile: `يوجد تكرار في رقم الموظف أو بريد العمل داخل الملف.`,
    invalidEmploymentType: `نوع التوظيف غير مدعوم.`,
    invalidEmploymentStatus: `الحالة الوظيفية غير مدعومة.`,
    invalidWorkMode: `نظام العمل غير مدعوم.`,
    positionCapacityExceeded: `الملف يتجاوز العدد المعتمد للمنصب.`,
    managerSelfReference: `لا يمكن للموظف أن يتبع لرقمه نفسه.`,
    importManagerCycle: `يحتوي الملف على حلقة في التبعية الإدارية.`,
    loading: `جارٍ التحميل…`,
    notAvailable: `غير متوفر`,
    privateRecordUnavailable: `تعذر تحميل المعلومات الخاصة.`,
    noMatchingEmployees: `لا يوجد موظف مطابق للفلاتر الحالية.`,
    employeeCodeLocked: `رقم الموظف ثابت بعد الإنشاء.`,
    emailLocked: `بريد العمل مربوط بحساب Firebase ولا يمكن تغييره من هنا.`
  }
};

const elements = Object.fromEntries(
  Array.from(document.querySelectorAll(`[id]`)).map(element => [element.id, element])
);

const state = {
  language: localStorage.getItem(`nasna-language`) || (navigator.language.startsWith(`ar`) ? `ar` : `en`),
  user: null,
  userProfile: null,
  companyId: null,
  company: null,
  membership: null,
  ownEmployee: null,
  ownPrivate: null,
  employees: [],
  members: [],
  branches: [],
  locations: [],
  departments: [],
  teams: [],
  grades: [],
  titles: [],
  positions: [],
  importRows: [],
  importCredentials: [],
  importFileName: ``,
  editingEmployeeId: null,
  selectedTeamEmployeeId: null,
  toastTimer: null
};

const collectionNames = [
  `branches`,
  `locations`,
  `departments`,
  `teams`,
  `jobGrades`,
  `jobTitles`,
  `positions`,
  `employees`,
  `members`
];

const headerNames = {
  employeeCode: `Employee Code`,
  fullNameEn: `Full Name English`,
  fullNameAr: `Full Name Arabic`,
  workEmail: `Work Email`,
  positionCode: `Position Code`,
  managerEmployeeCode: `Manager Employee Code`,
  hireDate: `Hire Date`,
  employmentType: `Employment Type`,
  employmentStatus: `Employment Status`,
  workMode: `Work Mode`,
  workPhone: `Work Phone`,
  nationalId: `National ID`,
  dateOfBirth: `Date of Birth`,
  gender: `Gender`,
  maritalStatus: `Marital Status`,
  nationality: `Nationality`,
  personalEmail: `Personal Email`,
  personalPhone: `Personal Phone`,
  address: `Address`,
  emergencyContactName: `Emergency Contact Name`,
  emergencyContactPhone: `Emergency Contact Phone`,
  hrNotes: `HR Notes`,
  temporaryPassword: `Temporary Password`
};

const requiredHeaders = [
  headerNames.employeeCode,
  headerNames.fullNameEn,
  headerNames.fullNameAr,
  headerNames.workEmail,
  headerNames.positionCode,
  headerNames.hireDate,
  headerNames.employmentType,
  headerNames.employmentStatus,
  headerNames.workMode
];

const escapeHtml = value => String(value ?? ``)
  .replaceAll(`&`, `&amp;`)
  .replaceAll(`<`, `&lt;`)
  .replaceAll(`>`, `&gt;`)
  .replaceAll(`"`, `&quot;`)
  .replaceAll(`'`, `&#039;`);

const translate = (key, values = {}) => {
  let text = translations[state.language]?.[key] || translations.en[key] || key;
  Object.entries(values).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
};

const safeTrim = value => String(value ?? ``).trim();
const normalizeCode = value => safeTrim(value).toUpperCase();
const normalizeEmail = value => safeTrim(value).toLowerCase();
const isAdmin = () => adminRoles.has(state.membership?.role);
const isEmployeeActive = employee => activeEmploymentStatuses.has(employee?.employmentStatus);
const displayValue = value => safeTrim(value) || translate(`notAvailable`);
const initialFor = value => safeTrim(value || `E`).charAt(0).toUpperCase() || `E`;

const getById = (items, id) => items.find(item => item.id === id || item.code === id) || null;
const employeeById = id => state.employees.find(employee => employee.id === id) || null;
const unlinkedMemberForEmail = email => state.members.find(member => (
  normalizeEmail(member.email) === normalizeEmail(email)
  && !safeTrim(member.employeeId)
)) || null;

const localizedName = record => {
  if (!record) return ``;
  const primary = state.language === `ar`
    ? record.nameAr || record.fullNameAr
    : record.nameEn || record.fullNameEn;
  const secondary = state.language === `ar`
    ? record.nameEn || record.fullNameEn
    : record.nameAr || record.fullNameAr;
  return safeTrim(primary || secondary || record.code || record.id);
};

const roleLabel = role => {
  if (role === `manager`) return translate(`manager_role`);
  if (role === `employee`) return translate(`employee_role`);
  return translate(role || `employee_role`);
};

const employmentTypeLabel = value => {
  const keys = {
    permanent: `permanent`,
    fixed_term: `fixedTerm`,
    part_time: `partTime`,
    intern: `intern`,
    consultant: `consultant`
  };
  return translate(keys[value] || value);
};

const employmentStatusLabel = value => {
  const keys = {
    active: `active`,
    probation: `probation`,
    leave: `leave`,
    suspended: `suspended`
  };
  return translate(keys[value] || value);
};

const workModeLabel = value => {
  const keys = {
    onsite: `onsite`,
    hybrid: `hybrid`,
    remote: `remote`
  };
  return translate(keys[value] || value);
};

const genderLabel = value => {
  const keys = {
    not_disclosed: `notDisclosed`,
    male: `male`,
    female: `female`
  };
  return translate(keys[value] || `notDisclosed`);
};

const maritalLabel = value => {
  const keys = {
    not_disclosed: `notDisclosed`,
    single: `single`,
    married: `married`,
    divorced: `divorced`,
    widowed: `widowed`
  };
  return translate(keys[value] || `notDisclosed`);
};

const formatDate = value => {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  if (!date || Number.isNaN(date.getTime())) return translate(`notAvailable`);
  return new Intl.DateTimeFormat(state.language === `ar` ? `ar-JO` : `en-GB`, {
    day: `2-digit`,
    month: `short`,
    year: `numeric`
  }).format(date);
};

const inputDate = value => {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  if (!date || Number.isNaN(date.getTime())) return ``;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, `0`);
  const day = String(date.getDate()).padStart(2, `0`);
  return `${year}-${month}-${day}`;
};

const dateToTimestamp = value => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
};

const showToast = (key, type = `success`, values = {}) => {
  if (!elements.toast || !elements.toastMessage) return;
  window.clearTimeout(state.toastTimer);
  elements.toastMessage.textContent = translate(key, values);
  elements.toast.classList.toggle(`is-error`, type === `error`);
  elements.toast.classList.add(`is-visible`);
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4600);
};

const setError = (element, message = ``) => {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
};

const setButtonLoading = (button, loading, loadingKey = `loading`) => {
  if (!button) return;
  button.disabled = loading;
  button.setAttribute(`aria-busy`, String(loading));
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
  const code = error?.code || ``;
  if (code === `permission-denied` || code === `firestore/permission-denied`) return `permissionDenied`;
  if (code === `auth/email-already-in-use`) return `userAlreadyExists`;
  if (code === `auth/network-request-failed` || code === `unavailable`) return `networkError`;
  return `genericError`;
};

const setLanguage = language => {
  state.language = language === `ar` ? `ar` : `en`;
  localStorage.setItem(`nasna-language`, state.language);
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === `ar` ? `rtl` : `ltr`;
  auth.languageCode = state.language;

  if (elements.languageLabel) {
    elements.languageLabel.textContent = state.language === `ar` ? `English` : `العربية`;
  }

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll(`[data-i18n-placeholder]`).forEach(element => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });

  document.title = pageType === `records`
    ? state.language === `ar` ? `ملفات الموظفين | ناسنا` : `Employee Records | NASNA`
    : pageType === `team`
      ? state.language === `ar` ? `فريقي | ناسنا` : `My Team | NASNA`
      : state.language === `ar` ? `ملفي | ناسنا` : `My Profile | NASNA`;

  if (state.company) {
    renderSharedHeader();
    if (pageType === `records`) renderRecordsPage();
    if (pageType === `profile`) renderProfilePage();
    if (pageType === `team`) renderTeamPage();
  }
};

const companyCollection = name => collection(db, `nasna_companies`, state.companyId, name);
const companyDoc = (name, id) => doc(db, `nasna_companies`, state.companyId, name, id);

const auditRecord = (action, targetId, details = {}) => ({
  companyId: state.companyId,
  actorId: state.user.uid,
  actorEmail: state.user.email || ``,
  action,
  targetId,
  details,
  createdAt: serverTimestamp()
});

const auditRef = () => doc(companyCollection(`auditLogs`));

const loadSession = async user => {
  state.user = user;
  const profileSnapshot = await getDoc(doc(db, `nasna_users`, user.uid));

  if (!profileSnapshot.exists()) {
    throw Object.assign(new Error(`Missing NASNA user profile.`), { code: `permission-denied` });
  }

  state.userProfile = profileSnapshot.data();
  state.companyId = state.userProfile.activeCompanyId;

  if (!state.companyId) {
    throw Object.assign(new Error(`Missing active company.`), { code: `permission-denied` });
  }

  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(doc(db, `nasna_companies`, state.companyId)),
    getDoc(companyDoc(`members`, user.uid))
  ]);

  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw Object.assign(new Error(`Missing active company membership.`), { code: `permission-denied` });
  }

  state.company = companySnapshot.data();
  state.membership = membershipSnapshot.data();

  if (state.membership.status !== `active`) {
    throw Object.assign(new Error(`Inactive company membership.`), { code: `access-disabled` });
  }

  if (pageType === `records` && !isAdmin()) {
    const destination = state.membership.employeeId
      ? `employee.html?v=${release}`
      : `dashboard.html?v=${release}`;
    window.location.replace(destination);
    return false;
  }

  await loadReferenceData();
  state.ownEmployee = state.employees.find(employee => (
    employee.authUid === user.uid
    || employee.id === state.membership.employeeId
  )) || null;

  if (pageType === `profile` && state.ownEmployee) {
    const privateSnapshot = await getDoc(companyDoc(`employeePrivate`, state.ownEmployee.id));
    state.ownPrivate = privateSnapshot.exists() ? privateSnapshot.data() : null;
  }

  return true;
};

const loadReferenceData = async () => {
  const snapshots = await Promise.all(
    collectionNames.map(name => getDocs(companyCollection(name)))
  );

  const values = Object.fromEntries(
    collectionNames.map((name, index) => [
      name,
      snapshots[index].docs.map(record => record.data())
    ])
  );

  state.branches = values.branches;
  state.locations = values.locations;
  state.departments = values.departments;
  state.teams = values.teams;
  state.grades = values.jobGrades;
  state.titles = values.jobTitles;
  state.positions = values.positions;
  state.employees = values.employees.sort((a, b) => (
    localizedName(a).localeCompare(localizedName(b), state.language)
  ));
  state.members = values.members;
  if (state.user) {
    state.ownEmployee = state.employees.find(employee => (
      employee.authUid === state.user.uid
      || employee.id === state.membership?.employeeId
    )) || null;
  }
};

const revealApp = () => {
  if (elements.authLoader) elements.authLoader.hidden = true;
  if (elements.peopleApp) elements.peopleApp.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const renderSharedHeader = () => {
  const email = state.user?.email || state.user?.uid || ``;
  const companyName = localizedName(state.company) || `NASNA`;

  if (elements.signedInEmail) elements.signedInEmail.textContent = email;
  if (elements.signedInAvatar) elements.signedInAvatar.textContent = initialFor(email);
  if (elements.companyName) elements.companyName.textContent = companyName;
  if (elements.companyMonogram) elements.companyMonogram.textContent = initialFor(companyName);
  if (elements.companyRegion) {
    elements.companyRegion.textContent = [
      state.company?.country || `JO`,
      state.company?.currency || `JOD`,
      state.company?.timezone || `Asia/Amman`
    ].join(` · `);
  }
  if (elements.currentRole) elements.currentRole.textContent = roleLabel(state.membership?.role);

  const hasManagerWorkspace = Boolean(
    state.membership?.isManager
    || state.membership?.role === `manager`
    || (
      state.ownEmployee
      && state.employees.some(employee => (
        employee.managerEmployeeId === state.ownEmployee.id
        && isEmployeeActive(employee)
      ))
    )
  );

  if (elements.myProfileNav) elements.myProfileNav.hidden = !state.ownEmployee;
  if (elements.myTeamNav) elements.myTeamNav.hidden = !hasManagerWorkspace;
  if (elements.peopleAdminNav) elements.peopleAdminNav.hidden = !isAdmin();
};

const assignmentDetails = employee => {
  const position = getById(state.positions, employee?.positionId);
  const title = getById(state.titles, employee?.jobTitleId || position?.jobTitleId);
  const grade = getById(state.grades, title?.gradeId);
  const branch = getById(state.branches, employee?.branchId || position?.branchId);
  const location = getById(state.locations, employee?.locationId || position?.locationId);
  const department = getById(state.departments, employee?.departmentId || position?.departmentId);
  const team = getById(state.teams, employee?.teamId || position?.teamId);
  return { position, title, grade, branch, location, department, team };
};

const filledCountForPosition = (positionId, exceptEmployeeId = ``) => state.employees.filter(employee => (
  employee.id !== exceptEmployeeId
  && employee.positionId === positionId
  && isEmployeeActive(employee)
)).length;

const openCapacity = () => state.positions
  .filter(position => position.status === `active`)
  .reduce((total, position) => (
    total + Math.max(0, Number(position.headcount || 0) - filledCountForPosition(position.id))
  ), 0);

const managerIds = () => new Set(
  state.employees
    .filter(isEmployeeActive)
    .map(employee => employee.managerEmployeeId)
    .filter(Boolean)
);

const renderRecordsPage = () => {
  if (!elements.employeeTableBody) return;

  const activeEmployees = state.employees.filter(isEmployeeActive);
  const managers = managerIds();
  elements.totalEmployees.textContent = String(state.employees.length);
  elements.activeEmployees.textContent = String(activeEmployees.length);
  elements.peopleManagers.textContent = String(managers.size);
  elements.availablePositions.textContent = String(openCapacity());

  const selectedDepartment = elements.departmentFilter?.value || ``;
  const selectedStatus = elements.statusFilter?.value || ``;
  const search = normalizeEmail(elements.employeeSearch?.value);

  const filteredEmployees = state.employees.filter(employee => {
    const searchable = [
      employee.id,
      employee.fullNameEn,
      employee.fullNameAr,
      employee.workEmail
    ].join(` `).toLowerCase();
    const departmentMatches = !selectedDepartment || employee.departmentId === selectedDepartment;
    const statusMatches = !selectedStatus || employee.employmentStatus === selectedStatus;
    return (!search || searchable.includes(search)) && departmentMatches && statusMatches;
  });

  elements.employeeTableBody.innerHTML = filteredEmployees.map(employee => {
    const details = assignmentDetails(employee);
    const manager = employeeById(employee.managerEmployeeId);
    const accessActive = employee.accessStatus === `active`;
    return `
      <tr data-employee-id="${escapeHtml(employee.id)}">
        <td>
          <div class="employee-cell">
            <span class="avatar">${escapeHtml(initialFor(localizedName(employee)))}</span>
            <span>
              <strong dir="auto">${escapeHtml(localizedName(employee))}</strong>
              <small>${escapeHtml(employee.id)} · ${escapeHtml(employee.workEmail)}</small>
            </span>
          </div>
        </td>
        <td>
          <div class="assignment-cell">
            <strong dir="auto">${escapeHtml(localizedName(details.title) || translate(`notAvailable`))}</strong>
            <small dir="auto">${escapeHtml(localizedName(details.department) || translate(`notAvailable`))} · ${escapeHtml(details.position?.code || employee.positionId)}</small>
          </div>
        </td>
        <td>
          <div class="manager-cell">
            <strong dir="auto">${escapeHtml(manager ? localizedName(manager) : translate(`noManager`))}</strong>
            <small>${escapeHtml(manager?.id || `—`)}</small>
          </div>
        </td>
        <td>
          <span class="access-badge access-badge--${accessActive ? `active` : `disabled`}">
            ${escapeHtml(translate(accessActive ? `enabled` : `disabled`))}
          </span>
        </td>
        <td>
          <span class="status-badge status-badge--${escapeHtml(employee.employmentStatus)}">
            ${escapeHtml(employmentStatusLabel(employee.employmentStatus))}
          </span>
        </td>
        <td>
          <button class="row-action" type="button" data-action="edit" aria-label="${escapeHtml(translate(`edit`))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join(``);

  const noData = filteredEmployees.length === 0;
  elements.employeesEmpty.hidden = !noData;
  if (noData) {
    const emptyTitle = state.employees.length ? `noMatchingEmployees` : `noEmployees`;
    elements.employeesEmpty.querySelector(`h3`).textContent = translate(emptyTitle);
  }

  renderDepartmentFilter();
};

const renderDepartmentFilter = () => {
  if (!elements.departmentFilter) return;
  const selected = elements.departmentFilter.value;
  const options = state.departments
    .filter(department => department.status === `active`)
    .sort((a, b) => localizedName(a).localeCompare(localizedName(b), state.language))
    .map(department => `<option value="${escapeHtml(department.id)}">${escapeHtml(localizedName(department))}</option>`)
    .join(``);
  elements.departmentFilter.innerHTML = `<option value="">${escapeHtml(translate(`allDepartments`))}</option>${options}`;
  elements.departmentFilter.value = selected;
};

const activePositions = () => state.positions
  .filter(position => position.status === `active`)
  .sort((a, b) => a.code.localeCompare(b.code));

const renderPositionOptions = selectedId => {
  if (!elements.positionId) return;
  const options = activePositions().map(position => {
    const details = assignmentDetails({ positionId: position.id });
    const filled = filledCountForPosition(position.id, state.editingEmployeeId || ``);
    const capacity = Number(position.headcount || 0);
    const label = [
      position.code,
      localizedName(details.title),
      localizedName(details.department),
      `${filled}/${capacity}`
    ].filter(Boolean).join(` · `);
    return `<option value="${escapeHtml(position.id)}">${escapeHtml(label)}</option>`;
  }).join(``);
  elements.positionId.innerHTML = `<option value="">${escapeHtml(translate(`positionRequired`))}</option>${options}`;
  elements.positionId.value = selectedId || ``;
};

const renderManagerOptions = (selectedId = ``, currentEmployeeId = ``) => {
  if (!elements.managerEmployeeId) return;
  const options = state.employees
    .filter(employee => employee.id !== currentEmployeeId && isEmployeeActive(employee))
    .sort((a, b) => localizedName(a).localeCompare(localizedName(b), state.language))
    .map(employee => {
      const details = assignmentDetails(employee);
      const label = [
        localizedName(employee),
        employee.id,
        localizedName(details.title)
      ].filter(Boolean).join(` · `);
      return `<option value="${escapeHtml(employee.id)}">${escapeHtml(label)}</option>`;
    }).join(``);
  elements.managerEmployeeId.innerHTML = `<option value="">${escapeHtml(translate(`noManager`))}</option>${options}`;
  elements.managerEmployeeId.value = selectedId || ``;
};

const renderAssignmentPreview = () => {
  if (!elements.assignmentPreview || !elements.positionId) return;
  const position = getById(state.positions, elements.positionId.value);
  if (!position) {
    elements.assignmentPreview.innerHTML = ``;
    return;
  }
  const details = assignmentDetails({ positionId: position.id });
  const items = [
    [`jobTitle`, localizedName(details.title)],
    [`branch`, localizedName(details.branch)],
    [`location`, localizedName(details.location)],
    [`department`, localizedName(details.department)],
    [`team`, localizedName(details.team)]
  ];
  elements.assignmentPreview.innerHTML = items.map(([key, value]) => `
    <span>
      <small>${escapeHtml(translate(key))}</small>
      <strong dir="auto">${escapeHtml(value || translate(`notAvailable`))}</strong>
    </span>
  `).join(``);
};

const clearFormValidation = () => {
  elements.employeeForm?.querySelectorAll(`.is-invalid`).forEach(field => field.classList.remove(`is-invalid`));
  setError(elements.employeeFormError);
};

const renderAccountProvisioningMode = () => {
  if (!elements.passwordField || !elements.accountLinkNotice) return;
  const isEdit = elements.employeeMode.value === `edit`;
  const existingMember = !isEdit
    ? unlinkedMemberForEmail(elements.workEmail.value)
    : null;
  elements.passwordField.hidden = isEdit || Boolean(existingMember);
  elements.accountLinkNotice.hidden = isEdit || !existingMember;
  elements.temporaryPassword.required = !isEdit && !existingMember;
};

const openEmployeeModal = async employeeId => {
  if (!isAdmin()) {
    showToast(`noPermission`, `error`);
    return;
  }

  const employee = employeeId ? employeeById(employeeId) : null;
  state.editingEmployeeId = employee?.id || null;
  elements.employeeForm.reset();
  clearFormValidation();

  const isEdit = Boolean(employee);
  elements.employeeMode.value = isEdit ? `edit` : `create`;
  elements.employeeModalTitle.textContent = translate(isEdit ? `updateEmployee` : `createEmployee`);
  elements.saveEmployeeButton.querySelector(`span`).textContent = translate(isEdit ? `updateEmployee` : `createEmployee`);
  elements.employeeCode.readOnly = isEdit;
  elements.workEmail.readOnly = isEdit;
  elements.employeeCode.title = isEdit ? translate(`employeeCodeLocked`) : ``;
  elements.workEmail.title = isEdit ? translate(`emailLocked`) : ``;
  [
    elements.positionId,
    elements.managerEmployeeId,
    elements.employmentType,
    elements.employmentStatus,
    elements.workMode
  ].forEach(field => {
    field.disabled = isEdit;
  });
  if (elements.movementManagedNotice) elements.movementManagedNotice.hidden = !isEdit;

  renderPositionOptions(employee?.positionId || ``);
  renderManagerOptions(employee?.managerEmployeeId || ``, employee?.id || ``);

  if (employee) {
    const privateSnapshot = await getDoc(companyDoc(`employeePrivate`, employee.id));
    const privateData = privateSnapshot.exists() ? privateSnapshot.data() : {};
    elements.employeeCode.value = employee.id;
    elements.fullNameEn.value = employee.fullNameEn || ``;
    elements.fullNameAr.value = employee.fullNameAr || ``;
    elements.workEmail.value = employee.workEmail || ``;
    elements.workPhone.value = employee.workPhone || ``;
    elements.positionId.value = employee.positionId || ``;
    elements.managerEmployeeId.value = employee.managerEmployeeId || ``;
    elements.hireDate.value = inputDate(employee.hireDate);
    elements.employmentType.value = employee.employmentType || `permanent`;
    elements.employmentStatus.value = employee.employmentStatus || `active`;
    elements.workMode.value = employee.workMode || `onsite`;
    elements.nationalId.value = privateData.nationalId || ``;
    elements.dateOfBirth.value = inputDate(privateData.dateOfBirth);
    elements.gender.value = privateData.gender || `not_disclosed`;
    elements.maritalStatus.value = privateData.maritalStatus || `not_disclosed`;
    elements.nationality.value = privateData.nationality || ``;
    elements.personalEmail.value = privateData.personalEmail || ``;
    elements.personalPhone.value = privateData.personalPhone || ``;
    elements.address.value = privateData.address || ``;
    elements.emergencyContactName.value = privateData.emergencyContactName || ``;
    elements.emergencyContactPhone.value = privateData.emergencyContactPhone || ``;
    elements.hrNotes.value = privateData.hrNotes || ``;
  } else {
    elements.hireDate.value = new Date().toISOString().slice(0, 10);
    elements.employmentType.value = `permanent`;
    elements.employmentStatus.value = `active`;
    elements.workMode.value = `onsite`;
    elements.gender.value = `not_disclosed`;
    elements.maritalStatus.value = `not_disclosed`;
  }

  renderAccountProvisioningMode();
  renderAssignmentPreview();
  elements.employeeModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => elements.employeeCode.focus(), 0);
};

const closeEmployeeModal = () => {
  elements.employeeModal.hidden = true;
  document.body.style.overflow = ``;
  state.editingEmployeeId = null;
};

const fieldValue = id => safeTrim(elements[id]?.value);

const reportingGraphHasCycle = employees => {
  const managerByEmployee = new Map(
    employees.map(employee => [employee.id, employee.managerEmployeeId || ``])
  );

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

const validateEmployeeForm = () => {
  clearFormValidation();
  const isEdit = elements.employeeMode.value === `edit`;
  const employeeCode = normalizeCode(fieldValue(`employeeCode`));
  const fullNameEn = fieldValue(`fullNameEn`);
  const fullNameAr = fieldValue(`fullNameAr`);
  const workEmail = normalizeEmail(fieldValue(`workEmail`));
  const temporaryPassword = elements.temporaryPassword.value;
  const workPhone = fieldValue(`workPhone`);
  const positionId = fieldValue(`positionId`);
  const managerEmployeeId = fieldValue(`managerEmployeeId`);
  const hireDate = fieldValue(`hireDate`);
  const employmentType = fieldValue(`employmentType`);
  const employmentStatus = fieldValue(`employmentStatus`);
  const workMode = fieldValue(`workMode`);
  const personalEmail = normalizeEmail(fieldValue(`personalEmail`));
  const currentEmployee = isEdit ? employeeById(state.editingEmployeeId) : null;
  const existingMember = !isEdit ? unlinkedMemberForEmail(workEmail) : null;
  let errorKey = ``;
  let invalidField = null;

  if (!employeeCodePattern.test(employeeCode)) {
    errorKey = `invalidEmployeeCode`;
    invalidField = elements.employeeCode;
  } else if (!isEdit && employeeById(employeeCode)) {
    errorKey = `duplicateEmployeeCode`;
    invalidField = elements.employeeCode;
  } else if (!fullNameEn || !fullNameAr || !hireDate) {
    errorKey = `requiredFields`;
    invalidField = !fullNameEn ? elements.fullNameEn : !fullNameAr ? elements.fullNameAr : elements.hireDate;
  } else if (!emailPattern.test(workEmail)) {
    errorKey = `invalidWorkEmail`;
    invalidField = elements.workEmail;
  } else if (!isEdit && state.employees.some(employee => normalizeEmail(employee.workEmail) === workEmail)) {
    errorKey = `duplicateWorkEmail`;
    invalidField = elements.workEmail;
  } else if (!isEdit && !existingMember && temporaryPassword.length < 8) {
    errorKey = `passwordTooShort`;
    invalidField = elements.temporaryPassword;
  } else if (personalEmail && !emailPattern.test(personalEmail)) {
    errorKey = `personalEmailInvalid`;
    invalidField = elements.personalEmail;
  }

  const position = getById(state.positions, positionId);
  if (!errorKey && (!position || position.status !== `active`)) {
    errorKey = `positionRequired`;
    invalidField = elements.positionId;
  }

  if (!errorKey && activeEmploymentStatuses.has(employmentStatus)) {
    const filled = filledCountForPosition(positionId, currentEmployee?.id || ``);
    if (filled >= Number(position?.headcount || 0)) {
      errorKey = `positionFull`;
      invalidField = elements.positionId;
    }
  }

  const manager = managerEmployeeId ? employeeById(managerEmployeeId) : null;
  if (!errorKey && managerEmployeeId && (!manager || !isEmployeeActive(manager))) {
    errorKey = `invalidManager`;
    invalidField = elements.managerEmployeeId;
  }

  if (!errorKey && currentEmployee && managerEmployeeId === currentEmployee.id) {
    errorKey = `managerCycle`;
    invalidField = elements.managerEmployeeId;
  }

  const candidateEmployees = state.employees
    .filter(employee => employee.id !== employeeCode)
    .concat([{
      ...(currentEmployee || {}),
      id: employeeCode,
      managerEmployeeId
    }]);

  if (!errorKey && reportingGraphHasCycle(candidateEmployees)) {
    errorKey = `managerCycle`;
    invalidField = elements.managerEmployeeId;
  }

  if (
    !errorKey
    && currentEmployee
    && employmentStatus === `suspended`
    && state.employees.some(employee => (
      employee.managerEmployeeId === currentEmployee.id
      && isEmployeeActive(employee)
    ))
  ) {
    errorKey = `managerHasReports`;
    invalidField = elements.employmentStatus;
  }

  const linkedAuthUid = currentEmployee?.authUid || existingMember?.uid;
  if (
    !errorKey
    && employmentStatus === `suspended`
    && linkedAuthUid === state.company?.ownerId
  ) {
    errorKey = `ownerCannotSuspend`;
    invalidField = elements.employmentStatus;
  }

  if (!employmentTypes.has(employmentType) || !employmentStatuses.has(employmentStatus) || !workModes.has(workMode)) {
    errorKey ||= `requiredFields`;
  }

  if (errorKey) {
    invalidField?.classList.add(`is-invalid`);
    invalidField?.focus();
    setError(elements.employeeFormError, translate(errorKey));
    return null;
  }

  const positionDetails = assignmentDetails({ positionId });
  return {
    employeeCode,
    fullNameEn,
    fullNameAr,
    workEmail,
    temporaryPassword,
    workPhone,
    positionId,
    managerEmployeeId,
    hireDate,
    employmentType,
    employmentStatus,
    workMode,
    existingMember,
    positionDetails,
    privateData: {
      nationalId: fieldValue(`nationalId`),
      dateOfBirth: fieldValue(`dateOfBirth`),
      gender: fieldValue(`gender`) || `not_disclosed`,
      maritalStatus: fieldValue(`maritalStatus`) || `not_disclosed`,
      nationality: fieldValue(`nationality`),
      personalEmail,
      personalPhone: fieldValue(`personalPhone`),
      address: fieldValue(`address`),
      emergencyContactName: fieldValue(`emergencyContactName`),
      emergencyContactPhone: fieldValue(`emergencyContactPhone`),
      hrNotes: fieldValue(`hrNotes`)
    }
  };
};

const safeEmployeeRecord = (values, authUid, existing = null) => ({
  id: values.employeeCode,
  companyId: state.companyId,
  employeeCode: values.employeeCode,
  authUid,
  accessStatus: values.employmentStatus === `suspended` ? `disabled` : `active`,
  fullNameEn: values.fullNameEn,
  fullNameAr: values.fullNameAr,
  workEmail: values.workEmail,
  workPhone: values.workPhone,
  positionId: values.positionId,
  jobTitleId: values.positionDetails.position?.jobTitleId || ``,
  branchId: values.positionDetails.position?.branchId || ``,
  locationId: values.positionDetails.position?.locationId || ``,
  departmentId: values.positionDetails.position?.departmentId || ``,
  teamId: values.positionDetails.position?.teamId || ``,
  managerEmployeeId: values.managerEmployeeId,
  hireDate: dateToTimestamp(values.hireDate),
  employmentType: values.employmentType,
  employmentStatus: values.employmentStatus,
  workMode: values.workMode,
  ...(existing?.lastMovementId ? { lastMovementId: existing.lastMovementId } : {}),
  createdAt: existing?.createdAt || serverTimestamp(),
  createdBy: existing?.createdBy || state.user.uid,
  updatedAt: serverTimestamp(),
  updatedBy: state.user.uid
});

const privateEmployeeRecord = (values, authUid, existing = null) => ({
  id: values.employeeCode,
  companyId: state.companyId,
  authUid,
  nationalId: values.privateData.nationalId,
  dateOfBirth: dateToTimestamp(values.privateData.dateOfBirth),
  gender: genderValues.has(values.privateData.gender) ? values.privateData.gender : `not_disclosed`,
  maritalStatus: maritalValues.has(values.privateData.maritalStatus) ? values.privateData.maritalStatus : `not_disclosed`,
  nationality: values.privateData.nationality,
  personalEmail: values.privateData.personalEmail,
  personalPhone: values.privateData.personalPhone,
  address: values.privateData.address,
  emergencyContactName: values.privateData.emergencyContactName,
  emergencyContactPhone: values.privateData.emergencyContactPhone,
  hrNotes: values.privateData.hrNotes,
  createdAt: existing?.createdAt || serverTimestamp(),
  createdBy: existing?.createdBy || state.user.uid,
  updatedAt: serverTimestamp(),
  updatedBy: state.user.uid
});

const provisionFirebaseUser = async (secondaryAuth, values) => {
  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    values.workEmail,
    values.temporaryPassword
  );
  return credential;
};

const createEmployee = async values => {
  const existingMember = values.existingMember || unlinkedMemberForEmail(values.workEmail);
  const secondaryApp = existingMember
    ? null
    : initializeApp(firebaseConfig, `nasna-employee-${Date.now()}-${crypto.randomUUID()}`);
  const secondaryAuth = secondaryApp ? getAuth(secondaryApp) : null;
  let credential = null;

  try {
    if (secondaryAuth) {
      await setPersistence(secondaryAuth, inMemoryPersistence);
      credential = await provisionFirebaseUser(secondaryAuth, values);
    }
    const authUid = existingMember?.uid || credential.user.uid;
    const accessStatus = values.employmentStatus === `suspended` ? `disabled` : `active`;
    const batch = writeBatch(db);

    batch.set(companyDoc(`employees`, values.employeeCode), safeEmployeeRecord(values, authUid));
    batch.set(companyDoc(`employeePrivate`, values.employeeCode), privateEmployeeRecord(values, authUid));
    if (existingMember) {
      batch.update(companyDoc(`members`, authUid), {
        employeeId: values.employeeCode,
        displayName: values.fullNameEn,
        isManager: false,
        status: accessStatus,
        updatedAt: serverTimestamp()
      });
      batch.update(doc(db, `nasna_users`, authUid), {
        employeeId: values.employeeCode,
        displayName: values.fullNameEn,
        status: accessStatus,
        updatedAt: serverTimestamp()
      });
    } else {
      batch.set(companyDoc(`members`, authUid), {
        uid: authUid,
        companyId: state.companyId,
        employeeId: values.employeeCode,
        email: values.workEmail,
        displayName: values.fullNameEn,
        role: `employee`,
        isManager: false,
        status: accessStatus,
        createdBy: state.user.uid,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      batch.set(doc(db, `nasna_users`, authUid), {
        uid: authUid,
        employeeId: values.employeeCode,
        email: values.workEmail,
        displayName: values.fullNameEn,
        activeCompanyId: state.companyId,
        status: accessStatus,
        locale: `en`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    batch.set(auditRef(), auditRecord(`employee.created`, values.employeeCode, {
      workEmail: values.workEmail,
      positionId: values.positionId,
      managerEmployeeId: values.managerEmployeeId,
      accessStatus,
      linkedExistingLogin: Boolean(existingMember)
    }));
    await batch.commit();

    if (!existingMember) {
      auth.languageCode = state.language;
      await sendPasswordResetEmail(auth, values.workEmail).catch(error => {
        console.warn(`NASNA employee reset email could not be sent.`, error);
      });
    }
    return { linkedExistingLogin: Boolean(existingMember) };
  } catch (error) {
    if (credential?.user) {
      await deleteUser(credential.user).catch(cleanupError => {
        console.error(`NASNA employee Auth rollback failed.`, cleanupError);
      });
    }
    throw error;
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => undefined);
    }
  }
};

const updateEmployee = async values => {
  const existing = employeeById(state.editingEmployeeId);
  if (!existing) throw new Error(`Missing employee.`);
  const privateSnapshot = await getDoc(companyDoc(`employeePrivate`, existing.id));
  const existingPrivate = privateSnapshot.exists() ? privateSnapshot.data() : null;
  const accessStatus = values.employmentStatus === `suspended` ? `disabled` : `active`;
  const batch = writeBatch(db);

  batch.set(
    companyDoc(`employees`, existing.id),
    safeEmployeeRecord(values, existing.authUid, existing)
  );
  batch.set(
    companyDoc(`employeePrivate`, existing.id),
    privateEmployeeRecord(values, existing.authUid, existingPrivate)
  );
  batch.update(companyDoc(`members`, existing.authUid), {
    employeeId: existing.id,
    displayName: values.fullNameEn,
    status: accessStatus,
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, `nasna_users`, existing.authUid), {
    employeeId: existing.id,
    displayName: values.fullNameEn,
    status: accessStatus,
    updatedAt: serverTimestamp()
  });
  batch.set(auditRef(), auditRecord(`employee.updated`, existing.id, {
    positionId: values.positionId,
    previousPositionId: existing.positionId,
    managerEmployeeId: values.managerEmployeeId,
    previousManagerEmployeeId: existing.managerEmployeeId,
    employmentStatus: values.employmentStatus,
    previousEmploymentStatus: existing.employmentStatus
  }));
  await batch.commit();
};

const syncManagerFlags = async () => {
  if (!isAdmin()) return;
  const activeManagerIds = managerIds();
  const eligibleEmployees = state.employees.filter(employee => employee.authUid);
  const chunkSize = 350;

  for (let index = 0; index < eligibleEmployees.length; index += chunkSize) {
    const batch = writeBatch(db);
    eligibleEmployees.slice(index, index + chunkSize).forEach(employee => {
      batch.update(companyDoc(`members`, employee.authUid), {
        employeeId: employee.id,
        isManager: activeManagerIds.has(employee.id),
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }
};

const handleEmployeeSubmit = async event => {
  event.preventDefault();
  if (!isAdmin()) {
    showToast(`noPermission`, `error`);
    return;
  }

  const values = validateEmployeeForm();
  if (!values) return;
  const isEdit = elements.employeeMode.value === `edit`;
  setButtonLoading(elements.saveEmployeeButton, true);

  try {
    let createResult = null;
    if (isEdit) {
      await updateEmployee(values);
    } else {
      createResult = await createEmployee(values);
    }
    await loadReferenceData();
    await syncManagerFlags();
    closeEmployeeModal();
    renderSharedHeader();
    renderRecordsPage();
    showToast(
      isEdit
        ? `employeeUpdated`
        : createResult?.linkedExistingLogin
          ? `employeeLinked`
          : `employeeCreated`
    );
  } catch (error) {
    console.error(`NASNA employee save error.`, error);
    setError(elements.employeeFormError, translate(firebaseErrorKey(error)));
  } finally {
    setButtonLoading(elements.saveEmployeeButton, false);
  }
};

const openImportModal = () => {
  if (!isAdmin()) {
    showToast(`noPermission`, `error`);
    return;
  }
  resetImport();
  elements.importModal.hidden = false;
  document.body.style.overflow = `hidden`;
};

const closeImportModal = () => {
  elements.importModal.hidden = true;
  document.body.style.overflow = ``;
  resetImport();
};

const resetImport = () => {
  state.importRows = [];
  state.importCredentials = [];
  state.importFileName = ``;
  if (elements.importFile) elements.importFile.value = ``;
  if (elements.importSummary) elements.importSummary.hidden = true;
  if (elements.importPreview) elements.importPreview.hidden = true;
  if (elements.importProgress) elements.importProgress.hidden = true;
  if (elements.importSuccess) elements.importSuccess.hidden = true;
  if (elements.downloadCredentialsButton) elements.downloadCredentialsButton.hidden = false;
  if (elements.confirmImportButton) elements.confirmImportButton.disabled = true;
  setError(elements.importError);
};

const parseExcelDate = value => {
  if (!value) return ``;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === `number` && window.XLSX?.SSF?.parse_date_code) {
    const parsed = window.XLSX.SSF.parse_date_code(value);
    if (!parsed) return ``;
    return `${String(parsed.y).padStart(4, `0`)}-${String(parsed.m).padStart(2, `0`)}-${String(parsed.d).padStart(2, `0`)}`;
  }
  const text = safeTrim(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return ``;
  return parsed.toISOString().slice(0, 10);
};

const generateTemporaryPassword = () => {
  const alphabet = `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#`;
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  const random = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join(``);
  return `N7a!${random}`;
};

const rowValue = (row, header) => safeTrim(row[header]);
const hasExcelValue = value => (
  value instanceof Date
  || (typeof value === `number` && Number.isFinite(value))
  || safeTrim(value) !== ``
);

const normalizeImportRow = (row, rowNumber) => {
  const employeeCode = normalizeCode(rowValue(row, headerNames.employeeCode));
  const workEmail = normalizeEmail(rowValue(row, headerNames.workEmail));
  const positionCode = normalizeCode(rowValue(row, headerNames.positionCode));
  const managerEmployeeId = normalizeCode(rowValue(row, headerNames.managerEmployeeCode));
  const employmentType = rowValue(row, headerNames.employmentType).toLowerCase();
  const employmentStatus = rowValue(row, headerNames.employmentStatus).toLowerCase();
  const workMode = rowValue(row, headerNames.workMode).toLowerCase();
  const temporaryPassword = rowValue(row, headerNames.temporaryPassword) || generateTemporaryPassword();
  const rawHireDate = row[headerNames.hireDate];
  const rawDateOfBirth = row[headerNames.dateOfBirth];
  return {
    rowNumber,
    employeeCode,
    fullNameEn: rowValue(row, headerNames.fullNameEn),
    fullNameAr: rowValue(row, headerNames.fullNameAr),
    workEmail,
    positionCode,
    positionId: positionCode,
    managerEmployeeId,
    hireDate: parseExcelDate(rawHireDate),
    rawHireDate,
    employmentType,
    employmentStatus,
    workMode,
    workPhone: rowValue(row, headerNames.workPhone),
    temporaryPassword,
    privateData: {
      nationalId: rowValue(row, headerNames.nationalId),
      dateOfBirth: parseExcelDate(rawDateOfBirth),
      rawDateOfBirth,
      gender: rowValue(row, headerNames.gender).toLowerCase() || `not_disclosed`,
      maritalStatus: rowValue(row, headerNames.maritalStatus).toLowerCase() || `not_disclosed`,
      nationality: rowValue(row, headerNames.nationality),
      personalEmail: normalizeEmail(rowValue(row, headerNames.personalEmail)),
      personalPhone: rowValue(row, headerNames.personalPhone),
      address: rowValue(row, headerNames.address),
      emergencyContactName: rowValue(row, headerNames.emergencyContactName),
      emergencyContactPhone: rowValue(row, headerNames.emergencyContactPhone),
      hrNotes: rowValue(row, headerNames.hrNotes)
    },
    errors: []
  };
};

const validateImportRows = rows => {
  const existingCodes = new Set(state.employees.map(employee => employee.id));
  const existingEmails = new Set(state.employees.map(employee => normalizeEmail(employee.workEmail)));
  const fileCodeCounts = new Map();
  const fileEmailCounts = new Map();
  const currentPositionCounts = new Map();

  state.positions.forEach(position => {
    currentPositionCounts.set(position.id, filledCountForPosition(position.id));
  });

  rows.forEach(row => {
    if (row.employeeCode) {
      fileCodeCounts.set(row.employeeCode, (fileCodeCounts.get(row.employeeCode) || 0) + 1);
    }
    if (row.workEmail) {
      fileEmailCounts.set(row.workEmail, (fileEmailCounts.get(row.workEmail) || 0) + 1);
    }
  });

  rows.forEach(row => {
    const errors = [];
    row.existingMember = unlinkedMemberForEmail(row.workEmail);
    const requiredValues = [
      [headerNames.employeeCode, row.employeeCode],
      [headerNames.fullNameEn, row.fullNameEn],
      [headerNames.fullNameAr, row.fullNameAr],
      [headerNames.workEmail, row.workEmail],
      [headerNames.positionCode, row.positionCode],
      [headerNames.hireDate, row.hireDate],
      [headerNames.employmentType, row.employmentType],
      [headerNames.employmentStatus, row.employmentStatus],
      [headerNames.workMode, row.workMode]
    ];
    requiredValues.forEach(([field, value]) => {
      if (!value) errors.push(translate(`missingValue`, { field }));
    });
    [
      [headerNames.fullNameEn, row.fullNameEn, 100],
      [headerNames.fullNameAr, row.fullNameAr, 100],
      [headerNames.workEmail, row.workEmail, 160],
      [headerNames.workPhone, row.workPhone, 30],
      [headerNames.nationalId, row.privateData.nationalId, 40],
      [headerNames.nationality, row.privateData.nationality, 80],
      [headerNames.personalEmail, row.privateData.personalEmail, 160],
      [headerNames.personalPhone, row.privateData.personalPhone, 30],
      [headerNames.address, row.privateData.address, 240],
      [headerNames.emergencyContactName, row.privateData.emergencyContactName, 120],
      [headerNames.emergencyContactPhone, row.privateData.emergencyContactPhone, 30],
      [headerNames.hrNotes, row.privateData.hrNotes, 2000]
    ].forEach(([field, value, maximum]) => {
      if (safeTrim(value).length > maximum) {
        errors.push(translate(`valueTooLong`, { field }));
      }
    });

    if (row.employeeCode && !employeeCodePattern.test(row.employeeCode)) {
      errors.push(translate(`invalidEmployeeCode`));
    }
    if (existingCodes.has(row.employeeCode)) {
      errors.push(translate(`duplicateEmployeeCode`));
    }
    if (!emailPattern.test(row.workEmail)) {
      errors.push(translate(`invalidWorkEmail`));
    }
    if (existingEmails.has(row.workEmail)) {
      errors.push(translate(`duplicateWorkEmail`));
    }
    if ((fileCodeCounts.get(row.employeeCode) || 0) > 1 || (fileEmailCounts.get(row.workEmail) || 0) > 1) {
      errors.push(translate(`duplicateInFile`));
    }
    if (hasExcelValue(row.rawHireDate) && !row.hireDate) {
      errors.push(translate(`invalidDate`, { field: headerNames.hireDate }));
    }
    if (hasExcelValue(row.privateData.rawDateOfBirth) && !row.privateData.dateOfBirth) {
      errors.push(translate(`invalidDate`, { field: headerNames.dateOfBirth }));
    }
    if (!employmentTypes.has(row.employmentType)) {
      errors.push(translate(`invalidEmploymentType`));
    }
    if (!employmentStatuses.has(row.employmentStatus)) {
      errors.push(translate(`invalidEmploymentStatus`));
    }
    if (
      row.employmentStatus === `suspended`
      && row.existingMember?.uid === state.company?.ownerId
    ) {
      errors.push(translate(`ownerCannotSuspend`));
    }
    if (!workModes.has(row.workMode)) {
      errors.push(translate(`invalidWorkMode`));
    }
    if (row.privateData.personalEmail && !emailPattern.test(row.privateData.personalEmail)) {
      errors.push(translate(`personalEmailInvalid`));
    }
    if (!genderValues.has(row.privateData.gender)) {
      row.privateData.gender = `not_disclosed`;
    }
    if (!maritalValues.has(row.privateData.maritalStatus)) {
      row.privateData.maritalStatus = `not_disclosed`;
    }
    if (!row.existingMember && row.temporaryPassword.length < 8) {
      errors.push(translate(`passwordTooShort`));
    }

    const position = getById(state.positions, row.positionCode);
    if (!position || position.status !== `active`) {
      errors.push(translate(`unknownPosition`));
    } else {
      row.positionId = position.id;
      row.positionDetails = assignmentDetails({ positionId: position.id });
    }

    if (row.managerEmployeeId === row.employeeCode && row.managerEmployeeId) {
      errors.push(translate(`managerSelfReference`));
    }

    row.errors = Array.from(new Set(errors));
  });

  const importedByCode = new Map(rows
    .filter(row => row.employeeCode && (fileCodeCounts.get(row.employeeCode) || 0) === 1)
    .map(row => [row.employeeCode, row]));

  rows.forEach(row => {
    if (!row.managerEmployeeId || row.managerEmployeeId === row.employeeCode) return;
    const existingManager = employeeById(row.managerEmployeeId);
    const importedManager = importedByCode.get(row.managerEmployeeId);
    const validExistingManager = existingManager && isEmployeeActive(existingManager);
    const validImportedManager = importedManager
      && importedManager.errors.length === 0
      && activeEmploymentStatuses.has(importedManager.employmentStatus);
    if (!validExistingManager && !validImportedManager) {
      row.errors.push(translate(`unknownManager`));
    }
  });

  const managerByEmployee = new Map(
    state.employees.map(employee => [employee.id, employee.managerEmployeeId || ``])
  );
  rows
    .filter(row => row.errors.length === 0)
    .forEach(row => managerByEmployee.set(row.employeeCode, row.managerEmployeeId || ``));

  const cycleIds = new Set();
  managerByEmployee.forEach((unusedManager, employeeId) => {
    const path = [];
    const indexById = new Map();
    let currentId = employeeId;
    while (currentId && managerByEmployee.has(currentId)) {
      if (indexById.has(currentId)) {
        path.slice(indexById.get(currentId)).forEach(id => cycleIds.add(id));
        break;
      }
      indexById.set(currentId, path.length);
      path.push(currentId);
      currentId = managerByEmployee.get(currentId) || ``;
    }
  });
  rows.forEach(row => {
    if (cycleIds.has(row.employeeCode)) {
      row.errors.push(translate(`importManagerCycle`));
    }
  });

  const incomingCapacity = new Map();
  sortedImportRows(rows).forEach(row => {
    if (row.errors.length) return;
    const importedManager = importedByCode.get(row.managerEmployeeId);
    if (importedManager?.errors.length) {
      row.errors.push(translate(`unknownManager`));
      return;
    }
    if (!activeEmploymentStatuses.has(row.employmentStatus)) return;
    const position = getById(state.positions, row.positionId);
    const used = incomingCapacity.get(row.positionId) || 0;
    const current = currentPositionCounts.get(row.positionId) || 0;
    if (current + used + 1 > Number(position?.headcount || 0)) {
      row.errors.push(translate(`positionCapacityExceeded`));
      return;
    }
    incomingCapacity.set(row.positionId, used + 1);
  });

  rows.forEach(row => {
    row.errors = Array.from(new Set(row.errors));
  });

  return rows;
};

const renderImportPreview = () => {
  const validRows = state.importRows.filter(row => row.errors.length === 0);
  const invalidRows = state.importRows.length - validRows.length;
  elements.importSummary.hidden = false;
  elements.importPreview.hidden = false;
  elements.importFileName.textContent = state.importFileName;
  elements.validRowCount.textContent = String(validRows.length);
  elements.invalidRowCount.textContent = String(invalidRows);
  elements.confirmImportButton.disabled = invalidRows > 0 || validRows.length === 0;

  elements.importPreviewBody.innerHTML = state.importRows.map(row => `
    <tr>
      <td>${row.rowNumber}</td>
      <td>
        <strong dir="auto">${escapeHtml(row.fullNameEn || row.fullNameAr || row.employeeCode)}</strong>
        <br><small>${escapeHtml(row.employeeCode)} · ${escapeHtml(row.workEmail)}</small>
      </td>
      <td>${escapeHtml(row.positionCode || `—`)}</td>
      <td>${escapeHtml(row.managerEmployeeId || translate(`noManager`))}</td>
      <td>
        ${row.errors.length
          ? `<div class="row-errors">${row.errors.map(error => `<span>• ${escapeHtml(error)}</span>`).join(``)}</div>`
          : `<span class="validation-badge validation-badge--valid">${escapeHtml(translate(`rowValid`))}</span>`
        }
      </td>
    </tr>
  `).join(``);
};

const handleImportFile = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  setError(elements.importError);

  if (!window.XLSX) {
    setError(elements.importError, translate(`importLibraryMissing`));
    return;
  }

  try {
    const workbook = window.XLSX.read(await file.arrayBuffer(), {
      type: `array`,
      cellDates: true
    });
    const worksheet = workbook.Sheets.Employees;
    if (!worksheet) throw Object.assign(new Error(`Missing Employees sheet.`), { code: `invalid-workbook` });

    const headerRows = window.XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: ``
    });
    const headers = (headerRows[0] || []).map(safeTrim);
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length) {
      const message = missingHeaders.map(field => translate(`missingHeader`, { field })).join(` `);
      throw Object.assign(new Error(message), { code: `missing-headers` });
    }

    const rawRows = window.XLSX.utils.sheet_to_json(worksheet, {
      defval: ``,
      raw: true,
      blankrows: false
    });
    if (!rawRows.length) throw Object.assign(new Error(`Empty Employees sheet.`), { code: `empty-workbook` });

    state.importRows = validateImportRows(
      rawRows.map((row, index) => normalizeImportRow(row, index + 2))
    );
    state.importFileName = file.name;
    renderImportPreview();
  } catch (error) {
    console.error(`NASNA import parsing error.`, error);
    const message = error.code === `missing-headers`
      ? error.message
      : error.code === `empty-workbook`
        ? translate(`emptyWorkbook`)
        : translate(`invalidWorkbook`);
    setError(elements.importError, message);
  }
};

const importDepth = (row, byId, cache = new Map(), path = new Set()) => {
  if (cache.has(row.employeeCode)) return cache.get(row.employeeCode);
  if (!row.managerEmployeeId || !byId.has(row.managerEmployeeId)) {
    cache.set(row.employeeCode, 0);
    return 0;
  }
  if (path.has(row.employeeCode)) return 999;
  path.add(row.employeeCode);
  const depth = 1 + importDepth(byId.get(row.managerEmployeeId), byId, cache, path);
  path.delete(row.employeeCode);
  cache.set(row.employeeCode, depth);
  return depth;
};

const sortedImportRows = rows => {
  const byId = new Map(rows.map(row => [row.employeeCode, row]));
  const cache = new Map();
  return [...rows].sort((a, b) => (
    importDepth(a, byId, cache) - importDepth(b, byId, cache)
    || a.rowNumber - b.rowNumber
  ));
};

const provisionImportedEmployee = async (secondaryAuth, row) => {
  const existingMember = row.existingMember || unlinkedMemberForEmail(row.workEmail);
  let credential = null;
  try {
    if (!existingMember) {
      credential = await provisionFirebaseUser(secondaryAuth, row);
    }
    const authUid = existingMember?.uid || credential.user.uid;
    const accessStatus = row.employmentStatus === `suspended` ? `disabled` : `active`;
    const batch = writeBatch(db);
    batch.set(companyDoc(`employees`, row.employeeCode), safeEmployeeRecord(row, authUid));
    batch.set(companyDoc(`employeePrivate`, row.employeeCode), privateEmployeeRecord(row, authUid));
    if (existingMember) {
      batch.update(companyDoc(`members`, authUid), {
        employeeId: row.employeeCode,
        displayName: row.fullNameEn,
        isManager: false,
        status: accessStatus,
        updatedAt: serverTimestamp()
      });
      batch.update(doc(db, `nasna_users`, authUid), {
        employeeId: row.employeeCode,
        displayName: row.fullNameEn,
        status: accessStatus,
        updatedAt: serverTimestamp()
      });
    } else {
      batch.set(companyDoc(`members`, authUid), {
        uid: authUid,
        companyId: state.companyId,
        employeeId: row.employeeCode,
        email: row.workEmail,
        displayName: row.fullNameEn,
        role: `employee`,
        isManager: false,
        status: accessStatus,
        createdBy: state.user.uid,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      batch.set(doc(db, `nasna_users`, authUid), {
        uid: authUid,
        employeeId: row.employeeCode,
        email: row.workEmail,
        displayName: row.fullNameEn,
        activeCompanyId: state.companyId,
        status: accessStatus,
        locale: `en`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    batch.set(auditRef(), auditRecord(`employee.imported`, row.employeeCode, {
      workEmail: row.workEmail,
      positionId: row.positionId,
      managerEmployeeId: row.managerEmployeeId,
      sourceRow: row.rowNumber,
      linkedExistingLogin: Boolean(existingMember)
    }));
    await batch.commit();
    return {
      linkedExistingLogin: Boolean(existingMember),
      credentials: existingMember ? null : {
        employeeCode: row.employeeCode,
        fullNameEn: row.fullNameEn,
        fullNameAr: row.fullNameAr,
        workEmail: row.workEmail,
        temporaryPassword: row.temporaryPassword
      }
    };
  } catch (error) {
    if (credential?.user) {
      await deleteUser(credential.user).catch(cleanupError => {
        console.error(`NASNA imported Auth rollback failed.`, cleanupError);
      });
    }
    throw error;
  }
};

const handleConfirmImport = async () => {
  const validRows = state.importRows.filter(row => row.errors.length === 0);
  if (!validRows.length || state.importRows.some(row => row.errors.length)) {
    setError(elements.importError, translate(`importHasErrors`));
    return;
  }

  const rows = sortedImportRows(validRows);
  state.importCredentials = [];
  elements.importProgress.hidden = false;
  elements.importSuccess.hidden = true;
  elements.importProgressBar.max = rows.length;
  elements.importProgressBar.value = 0;
  elements.importProgressLabel.textContent = `0 / ${rows.length}`;
  setButtonLoading(elements.confirmImportButton, true);
  elements.cancelImportButton.disabled = true;
  elements.closeImportModal.disabled = true;
  setError(elements.importError);

  const secondaryApp = initializeApp(firebaseConfig, `nasna-import-${Date.now()}-${crypto.randomUUID()}`);
  const secondaryAuth = getAuth(secondaryApp);
  const failed = [];

  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const result = await provisionImportedEmployee(secondaryAuth, row);
        if (result.credentials) {
          state.importCredentials.push(result.credentials);
        }
      } catch (error) {
        console.error(`NASNA import row ${row.rowNumber} failed.`, error);
        failed.push({
          row,
          message: translate(firebaseErrorKey(error))
        });
      }
      elements.importProgressBar.value = index + 1;
      elements.importProgressLabel.textContent = `${index + 1} / ${rows.length}`;
    }

    await loadReferenceData();
    await syncManagerFlags();
    renderSharedHeader();
    renderRecordsPage();
    elements.importSuccess.hidden = false;
    elements.downloadCredentialsButton.hidden = state.importCredentials.length === 0;
    const successCount = rows.length - failed.length;
    elements.importSuccessCopy.textContent = failed.length
      ? translate(`importPartialSummary`, {
          success: successCount,
          failed: failed.length
        })
      : translate(`importSuccessSummary`, {
          count: successCount
        });

    if (failed.length) {
      failed.forEach(item => {
        item.row.errors.push(`${translate(`importRowFailed`)} ${item.message}`);
      });
      renderImportPreview();
    }
  } catch (error) {
    console.error(`NASNA bulk import error.`, error);
    setError(elements.importError, translate(firebaseErrorKey(error)));
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
    elements.cancelImportButton.disabled = false;
    elements.closeImportModal.disabled = false;
    setButtonLoading(elements.confirmImportButton, false);
    elements.confirmImportButton.disabled = true;
  }
};

const csvCell = value => `"${String(value ?? ``).replaceAll(`"`, `""`)}"`;

const downloadCredentials = () => {
  if (!state.importCredentials.length) {
    showToast(`noCredentials`, `error`);
    return;
  }

  const headers = [
    `Employee Code`,
    `Full Name English`,
    `Full Name Arabic`,
    `Work Email`,
    `Temporary Password`
  ];
  const lines = [
    headers.map(csvCell).join(`,`),
    ...state.importCredentials.map(row => [
      row.employeeCode,
      row.fullNameEn,
      row.fullNameAr,
      row.workEmail,
      row.temporaryPassword
    ].map(csvCell).join(`,`))
  ];
  const blob = new Blob([`\uFEFF${lines.join(`\r\n`)}`], {
    type: `text/csv;charset=utf-8`
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement(`a`);
  link.href = url;
  link.download = `NASNA_Employee_Login_Credentials_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`credentialsDownloaded`);
};

const setText = (id, value) => {
  if (elements[id]) elements[id].textContent = displayValue(value);
};

const renderProfilePage = () => {
  if (!elements.profileMissing) return;
  if (!state.ownEmployee) {
    elements.profileMissing.hidden = false;
    elements.profileContent.hidden = true;
    return;
  }

  const employee = state.ownEmployee;
  const privateData = state.ownPrivate || {};
  const details = assignmentDetails(employee);
  const manager = employeeById(employee.managerEmployeeId);
  elements.profileMissing.hidden = true;
  elements.profileContent.hidden = false;
  setText(`profileAvatar`, initialFor(localizedName(employee)));
  setText(`profileCode`, employee.id);
  setText(`profileName`, localizedName(employee));
  setText(`profileSecondaryName`, state.language === `ar` ? employee.fullNameEn : employee.fullNameAr);
  setText(`profileStatus`, employmentStatusLabel(employee.employmentStatus));
  setText(`profileAccess`, translate(employee.accessStatus === `active` ? `enabled` : `disabled`));
  setText(`profileJobTitle`, localizedName(details.title));
  setText(`profileDepartment`, localizedName(details.department));
  setText(`detailJobTitle`, localizedName(details.title));
  setText(`detailJobGrade`, localizedName(details.grade));
  setText(`detailBranch`, localizedName(details.branch));
  setText(`detailLocation`, localizedName(details.location));
  setText(`detailDepartment`, localizedName(details.department));
  setText(`detailTeam`, localizedName(details.team));
  setText(`detailManager`, manager ? localizedName(manager) : translate(`noManager`));
  setText(`detailPosition`, details.position?.code || employee.positionId);
  setText(`detailHireDate`, formatDate(employee.hireDate));
  setText(`detailEmploymentType`, employmentTypeLabel(employee.employmentType));
  setText(`detailEmploymentStatus`, employmentStatusLabel(employee.employmentStatus));
  setText(`detailWorkMode`, workModeLabel(employee.workMode));
  setText(`detailWorkEmail`, employee.workEmail);
  setText(`detailWorkPhone`, employee.workPhone);
  setText(`detailNationalId`, privateData.nationalId);
  setText(`detailDateOfBirth`, formatDate(privateData.dateOfBirth));
  setText(`detailGender`, genderLabel(privateData.gender));
  setText(`detailMaritalStatus`, maritalLabel(privateData.maritalStatus));
  setText(`detailNationality`, privateData.nationality);
  setText(`detailPersonalEmail`, privateData.personalEmail);
  setText(`detailPersonalPhone`, privateData.personalPhone);
  setText(`detailAddress`, privateData.address);
  setText(`detailEmergencyName`, privateData.emergencyContactName);
  setText(`detailEmergencyPhone`, privateData.emergencyContactPhone);
};

const directReports = () => {
  if (!state.ownEmployee) return [];
  return state.employees
    .filter(employee => (
      employee.managerEmployeeId === state.ownEmployee.id
      && isEmployeeActive(employee)
    ))
    .sort((a, b) => localizedName(a).localeCompare(localizedName(b), state.language));
};

const renderTeamPage = () => {
  if (!elements.teamAccessMissing) return;
  const reports = directReports();
  const hasAccess = Boolean(state.ownEmployee && (
    reports.length
    || state.membership?.isManager
    || state.membership?.role === `manager`
  ));

  elements.teamAccessMissing.hidden = hasAccess;
  elements.teamContent.hidden = !hasAccess;
  if (!hasAccess) return;

  const managerDetails = assignmentDetails(state.ownEmployee);
  setText(`managerAvatar`, initialFor(localizedName(state.ownEmployee)));
  setText(`managerName`, localizedName(state.ownEmployee));
  setText(`managerPosition`, localizedName(managerDetails.title));
  elements.directReports.textContent = String(reports.length);
  elements.availableNow.textContent = String(reports.filter(employee => (
    employee.employmentStatus === `active`
    || employee.employmentStatus === `probation`
  )).length);
  elements.teamOnLeave.textContent = String(reports.filter(employee => employee.employmentStatus === `leave`).length);

  const search = normalizeEmail(elements.teamSearch?.value);
  const filtered = reports.filter(employee => {
    const details = assignmentDetails(employee);
    return !search || [
      employee.id,
      employee.fullNameEn,
      employee.fullNameAr,
      employee.workEmail,
      localizedName(details.title)
    ].join(` `).toLowerCase().includes(search);
  });

  elements.teamList.innerHTML = filtered.length
    ? filtered.map(employee => {
        const details = assignmentDetails(employee);
        return `
          <button class="team-member-button${state.selectedTeamEmployeeId === employee.id ? ` is-selected` : ``}" type="button" data-employee-id="${escapeHtml(employee.id)}">
            <span class="avatar">${escapeHtml(initialFor(localizedName(employee)))}</span>
            <span>
              <strong dir="auto">${escapeHtml(localizedName(employee))}</strong>
              <small dir="auto">${escapeHtml(localizedName(details.title) || translate(`notAvailable`))}</small>
            </span>
            <small dir="auto">${escapeHtml(localizedName(details.department) || translate(`notAvailable`))}</small>
            <span class="status-badge status-badge--${escapeHtml(employee.employmentStatus)}">${escapeHtml(employmentStatusLabel(employee.employmentStatus))}</span>
          </button>
        `;
      }).join(``)
    : `<div class="empty-state"><p>${escapeHtml(translate(`noMatchingEmployees`))}</p></div>`;

  if (state.selectedTeamEmployeeId && !reports.some(employee => employee.id === state.selectedTeamEmployeeId)) {
    state.selectedTeamEmployeeId = null;
  }
  renderTeamDetail();
};

const renderTeamDetail = () => {
  if (!elements.teamDetailEmpty) return;
  const employee = employeeById(state.selectedTeamEmployeeId);
  if (!employee || employee.managerEmployeeId !== state.ownEmployee?.id) {
    elements.teamDetailEmpty.hidden = false;
    elements.teamDetailContent.hidden = true;
    return;
  }

  const details = assignmentDetails(employee);
  elements.teamDetailEmpty.hidden = true;
  elements.teamDetailContent.hidden = false;
  setText(`teamMemberAvatar`, initialFor(localizedName(employee)));
  setText(`teamMemberCode`, employee.id);
  setText(`teamMemberName`, localizedName(employee));
  setText(`teamMemberTitle`, localizedName(details.title));
  setText(`teamMemberStatus`, employmentStatusLabel(employee.employmentStatus));
  setText(`teamMemberDepartment`, localizedName(details.department));
  setText(`teamMemberTeam`, localizedName(details.team));
  setText(`teamMemberLocation`, localizedName(details.location));
  setText(`teamMemberHireDate`, formatDate(employee.hireDate));
  setText(`teamMemberEmail`, employee.workEmail);
  setText(`teamMemberPhone`, employee.workPhone);
};

const handleSignOut = async () => {
  elements.signOutButton.disabled = true;
  try {
    await signOut(auth);
    window.location.replace(`./?v=${release}`);
  } catch (error) {
    console.error(`NASNA sign-out error.`, error);
    showToast(`signOutError`, `error`);
    elements.signOutButton.disabled = false;
  }
};

const bindSharedEvents = () => {
  elements.languageButton?.addEventListener(`click`, () => {
    setLanguage(state.language === `en` ? `ar` : `en`);
  });
  elements.signOutButton?.addEventListener(`click`, handleSignOut);
};

const bindRecordsEvents = () => {
  elements.openEmployeeButton.addEventListener(`click`, () => openEmployeeModal());
  elements.closeEmployeeModal.addEventListener(`click`, closeEmployeeModal);
  elements.cancelEmployeeButton.addEventListener(`click`, closeEmployeeModal);
  elements.employeeForm.addEventListener(`submit`, handleEmployeeSubmit);
  elements.positionId.addEventListener(`change`, renderAssignmentPreview);
  elements.employeeCode.addEventListener(`input`, event => {
    if (!event.target.readOnly) event.target.value = normalizeCode(event.target.value);
  });
  elements.workEmail.addEventListener(`input`, renderAccountProvisioningMode);
  elements.workEmail.addEventListener(`change`, renderAccountProvisioningMode);
  elements.employeeSearch.addEventListener(`input`, renderRecordsPage);
  elements.departmentFilter.addEventListener(`change`, renderRecordsPage);
  elements.statusFilter.addEventListener(`change`, renderRecordsPage);
  elements.employeeTableBody.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-action="edit"]`);
    const row = button?.closest(`[data-employee-id]`);
    if (row?.dataset.employeeId) openEmployeeModal(row.dataset.employeeId);
  });
  elements.employeeModal.addEventListener(`click`, event => {
    if (event.target === elements.employeeModal) closeEmployeeModal();
  });

  elements.openImportButton.addEventListener(`click`, openImportModal);
  elements.closeImportModal.addEventListener(`click`, closeImportModal);
  elements.cancelImportButton.addEventListener(`click`, closeImportModal);
  elements.importModal.addEventListener(`click`, event => {
    if (event.target === elements.importModal) closeImportModal();
  });
  elements.importFile.addEventListener(`change`, handleImportFile);
  elements.confirmImportButton.addEventListener(`click`, handleConfirmImport);
  elements.downloadCredentialsButton.addEventListener(`click`, downloadCredentials);
};

const bindTeamEvents = () => {
  elements.teamSearch?.addEventListener(`input`, renderTeamPage);
  elements.teamList?.addEventListener(`click`, event => {
    const button = event.target.closest(`[data-employee-id]`);
    if (!button) return;
    state.selectedTeamEmployeeId = button.dataset.employeeId;
    renderTeamPage();
  });
};

const initializePage = async user => {
  try {
    const loaded = await loadSession(user);
    if (!loaded) return;
    renderSharedHeader();
    if (pageType === `records`) renderRecordsPage();
    if (pageType === `profile`) renderProfilePage();
    if (pageType === `team`) renderTeamPage();
    revealApp();
  } catch (error) {
    console.error(`NASNA people workspace load error.`, error);
    if (error?.code === `access-disabled`) {
      await signOut(auth).catch(() => undefined);
      window.location.replace(`./?error=access-disabled&v=${release}`);
      return;
    }
    await signOut(auth).catch(() => undefined);
    window.location.replace(`./?error=access-disabled&v=${release}`);
  }
};

bindSharedEvents();
if (pageType === `records`) bindRecordsEvents();
if (pageType === `team`) bindTeamEvents();
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
