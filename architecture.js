import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260726.4";
import { db } from "./firestore-config.js?v=20260726.4";

const version = `20260726.4`;
const languageKey = `nasna-language`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const validStatuses = new Set([`active`, `inactive`]);
const codePattern = /^[A-Z0-9][A-Z0-9-]{1,19}$/;

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your access…`,
    dashboard: `Dashboard`,
    sites: `Sites`,
    signOut: `Sign out`,
    stageLabel: `Stages 05 & 06 · NASNA Core`,
    pageTitle: `Organization & job architecture`,
    pageDescription: `Connect departments and teams to a controlled catalog of grades, job titles, and positions.`,
    signedInAs: `Signed in as`,
    activeWorkspace: `Active workspace`,
    yourRole: `Your role`,
    activeDepartments: `Active departments`,
    departmentCountCopy: `Operational departments`,
    activeTeams: `Active teams`,
    teamCountCopy: `Department teams`,
    activeJobTitles: `Active job titles`,
    titleCountCopy: `Approved job catalog`,
    activePositions: `Active positions`,
    positionCountCopy: `Organizational posts`,
    readOnlyTitle: `View-only access`,
    readOnlyCopy: `Only Super Admin and HR Admin can change organization and job architecture.`,
    organizationTab: `Departments & teams`,
    jobsTab: `Grades, titles & positions`,
    organizationStructure: `Organization structure`,
    departments: `Departments`,
    addDepartment: `Add department`,
    departmentsDescription: `Business functions linked to one active company branch.`,
    noDepartmentsTitle: `No departments yet`,
    noDepartmentsCopy: `Create the first department under an active branch.`,
    deliveryUnits: `Delivery units`,
    teams: `Teams`,
    addTeam: `Add team`,
    teamsDescription: `Working groups linked to one active department.`,
    noTeamsTitle: `No teams yet`,
    noTeamsCopy: `Teams become available after the first department is created.`,
    liveHierarchy: `Live hierarchy`,
    orgChart: `Organization chart`,
    orgChartDescription: `A branch-to-department-to-team view generated from current records.`,
    orgChartEmptyTitle: `The chart is waiting for departments`,
    orgChartEmptyCopy: `Branches already exist; add a department to start the hierarchy.`,
    managerAssignmentNote: `Manager relationships are assigned from Employee Records using real employee files, not login accounts.`,
    jobFramework: `Job framework`,
    grades: `Job grades`,
    addGrade: `Add grade`,
    gradesDescription: `Ordered levels used to classify job titles consistently.`,
    noGradesTitle: `No job grades yet`,
    noGradesCopy: `Create a grade before adding job titles.`,
    jobCatalog: `Job catalog`,
    jobTitles: `Job titles`,
    addTitle: `Add title`,
    titlesDescription: `Bilingual titles with a grade and controlled job description.`,
    noTitlesTitle: `No job titles yet`,
    noTitlesCopy: `Job titles become available after the first grade is created.`,
    approvedPosts: `Approved posts`,
    positions: `Positions`,
    addPosition: `Add position`,
    positionsDescription: `Actual organizational posts that connect a title to a branch, department, team, and optional work location.`,
    noPositionsTitle: `No positions yet`,
    noPositionsCopy: `Create the organization structure and a job title before adding a position.`,
    departmentCode: `Department code`,
    teamCode: `Team code`,
    gradeCode: `Grade code`,
    titleCode: `Job title code`,
    positionCode: `Position code`,
    codeHelp: `2–20 English letters, numbers, or hyphens. The code cannot be changed later.`,
    parentBranch: `Parent branch`,
    parentDepartment: `Parent department`,
    department: `Department`,
    selectBranch: `Select a branch`,
    selectDepartment: `Select a department`,
    selectGrade: `Select a job grade`,
    selectTitle: `Select a job title`,
    selectTeam: `No team`,
    selectLocation: `No fixed location`,
    nameEn: `Name in English`,
    nameAr: `Name in Arabic`,
    titleEn: `Title in English`,
    titleAr: `Title in Arabic`,
    gradeLevel: `Grade level`,
    gradeLevelHelp: `Use 1 for the first level, then increase upward consistently.`,
    jobGrade: `Job grade`,
    descriptionEn: `Description in English (optional)`,
    descriptionAr: `Description in Arabic (optional)`,
    jobTitle: `Job title`,
    teamOptional: `Team (optional)`,
    locationOptional: `Work location (optional)`,
    headcount: `Approved headcount`,
    cancel: `Cancel`,
    saveDepartment: `Save department`,
    saveTeam: `Save team`,
    saveGrade: `Save grade`,
    saveTitle: `Save title`,
    savePosition: `Save position`,
    createDepartment: `Create department`,
    editDepartment: `Edit department`,
    createTeam: `Create team`,
    editTeam: `Edit team`,
    createGrade: `Create job grade`,
    editGrade: `Edit job grade`,
    createTitle: `Create job title`,
    editTitle: `Edit job title`,
    createPosition: `Create position`,
    editPosition: `Edit position`,
    active: `Active`,
    inactive: `Inactive`,
    edit: `Edit`,
    levelLabel: `Level {level}`,
    teamsCount: `Teams: {count}`,
    titlesCount: `Titles: {count}`,
    positionsCount: `Positions: {count}`,
    headcountLabel: `Headcount: {count}`,
    noTeamsInDepartment: `No teams`,
    requiredField: `This field is required.`,
    invalidCode: `Use 2–20 English letters, numbers, or hyphens.`,
    invalidLevel: `Enter a whole level from 1 to 100.`,
    invalidHeadcount: `Enter a whole headcount from 1 to 10,000.`,
    duplicateRecord: `This code is already in use.`,
    activeBranchRequired: `Select an active branch.`,
    activeDepartmentRequired: `Select an active department.`,
    activeGradeRequired: `Select an active job grade.`,
    activeTitleRequired: `Select an active job title.`,
    matchingDepartmentRequired: `The department must belong to the selected branch.`,
    matchingTeamRequired: `The team must belong to the selected department.`,
    matchingLocationRequired: `The work location must belong to the selected branch.`,
    createBranchFirst: `Create an active branch before adding a department.`,
    createDepartmentFirst: `Create an active department before adding a team.`,
    createGradeFirst: `Create an active job grade before adding a job title.`,
    createPositionDependencies: `An active branch, department, job grade, and job title are required before adding a position.`,
    recordCreated: `{type} was created successfully.`,
    recordUpdated: `{type} was updated successfully.`,
    statusUpdated: `{type} status was updated and active dependent records were disabled when required.`,
    confirmDisable: `Disable this {type}? Active dependent records will also be disabled.`,
    confirmEnable: `Enable this {type}? Dependent records will remain unchanged.`,
    tooManyDependents: `There are too many dependent records for one safe update. No changes were made.`,
    cannotActivate: `This record cannot be activated until all parent records are active and correctly linked.`,
    departmentType: `department`,
    teamType: `team`,
    gradeType: `job grade`,
    titleType: `job title`,
    positionType: `position`,
    permissionTitle: `Access denied`,
    permissionCopy: `Your account does not have an active membership in this company, or the required Firestore rules are not active.`,
    databaseTitle: `Firestore is unavailable`,
    databaseCopy: `The configured Firestore database could not be reached. Check the database and published rules.`,
    genericTitle: `Organization data could not be loaded`,
    genericCopy: `No changes were made. Check your connection and try again.`,
    genericError: `The operation could not be completed. No changes were made.`,
    networkError: `Could not connect to Firebase. Check your internet connection.`,
    retry: `Try again`,
    signOutError: `Sign-out could not be completed.`,
    super_admin: `Super Admin`,
    hr_admin: `HR Admin`,
    manager: `Manager`,
    employee: `Employee`,
    language: `العربية`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من صلاحياتك…`,
    dashboard: `لوحة التحكم`,
    sites: `الفروع`,
    signOut: `تسجيل الخروج`,
    stageLabel: `المرحلتان 05 و06 · ناسنا Core`,
    pageTitle: `الهيكل التنظيمي والوظيفي`,
    pageDescription: `اربط الأقسام والفرق بدليل منضبط للدرجات والمسميات والمناصب الوظيفية.`,
    signedInAs: `تم الدخول بواسطة`,
    activeWorkspace: `مساحة العمل الحالية`,
    yourRole: `صلاحيتك`,
    activeDepartments: `الأقسام الفعّالة`,
    departmentCountCopy: `أقسام تشغيلية`,
    activeTeams: `الفرق الفعّالة`,
    teamCountCopy: `فرق تابعة للأقسام`,
    activeJobTitles: `المسميات الفعّالة`,
    titleCountCopy: `الدليل الوظيفي المعتمد`,
    activePositions: `المناصب الفعّالة`,
    positionCountCopy: `شواغر الهيكل التنظيمي`,
    readOnlyTitle: `صلاحية عرض فقط`,
    readOnlyCopy: `يمكن لـSuper Admin وHR Admin فقط تعديل الهيكل التنظيمي والوظيفي.`,
    organizationTab: `الأقسام والفرق`,
    jobsTab: `الدرجات والمسميات والمناصب`,
    organizationStructure: `الهيكل التنظيمي`,
    departments: `الأقسام`,
    addDepartment: `إضافة قسم`,
    departmentsDescription: `وظائف العمل الرئيسية المرتبطة بأحد فروع الشركة الفعّالة.`,
    noDepartmentsTitle: `لا توجد أقسام`,
    noDepartmentsCopy: `أنشئ أول قسم تحت فرع فعّال.`,
    deliveryUnits: `وحدات التنفيذ`,
    teams: `الفرق`,
    addTeam: `إضافة فريق`,
    teamsDescription: `مجموعات العمل المرتبطة بقسم فعّال واحد.`,
    noTeamsTitle: `لا توجد فرق`,
    noTeamsCopy: `يمكن إنشاء الفرق بعد إنشاء أول قسم.`,
    liveHierarchy: `الهيكل المباشر`,
    orgChart: `المخطط التنظيمي`,
    orgChartDescription: `عرض يتولد من السجلات الحالية ويربط الفرع بالقسم ثم الفريق.`,
    orgChartEmptyTitle: `المخطط بانتظار الأقسام`,
    orgChartEmptyCopy: `الفروع موجودة؛ أضف قسمًا لبدء بناء الهيكل.`,
    managerAssignmentNote: `تُدار علاقات المدير المباشر من ملفات الموظفين، ويرتبط المدير بموظف فعلي لا بحساب دخول.`,
    jobFramework: `الإطار الوظيفي`,
    grades: `الدرجات الوظيفية`,
    addGrade: `إضافة درجة`,
    gradesDescription: `مستويات مرتبة لتصنيف المسميات الوظيفية بشكل موحد.`,
    noGradesTitle: `لا توجد درجات وظيفية`,
    noGradesCopy: `أنشئ درجة قبل إضافة المسميات الوظيفية.`,
    jobCatalog: `الدليل الوظيفي`,
    jobTitles: `المسميات الوظيفية`,
    addTitle: `إضافة مسمى`,
    titlesDescription: `مسميات ثنائية اللغة مرتبطة بدرجة ووصف وظيفي منضبط.`,
    noTitlesTitle: `لا توجد مسميات وظيفية`,
    noTitlesCopy: `يمكن إنشاء المسميات بعد إضافة أول درجة.`,
    approvedPosts: `المناصب المعتمدة`,
    positions: `المناصب`,
    addPosition: `إضافة منصب`,
    positionsDescription: `مناصب فعلية تربط المسمى بالفرع والقسم والفريق وموقع العمل الاختياري.`,
    noPositionsTitle: `لا توجد مناصب`,
    noPositionsCopy: `أنشئ الهيكل التنظيمي والمسمى الوظيفي قبل إضافة منصب.`,
    departmentCode: `رمز القسم`,
    teamCode: `رمز الفريق`,
    gradeCode: `رمز الدرجة`,
    titleCode: `رمز المسمى الوظيفي`,
    positionCode: `رمز المنصب`,
    codeHelp: `من 2 إلى 20 حرفًا إنجليزيًا أو رقمًا أو شرطة. لا يمكن تغيير الرمز لاحقًا.`,
    parentBranch: `الفرع التابع له`,
    parentDepartment: `القسم التابع له`,
    department: `القسم`,
    selectBranch: `اختر الفرع`,
    selectDepartment: `اختر القسم`,
    selectGrade: `اختر الدرجة الوظيفية`,
    selectTitle: `اختر المسمى الوظيفي`,
    selectTeam: `بدون فريق`,
    selectLocation: `بدون موقع ثابت`,
    nameEn: `الاسم بالإنجليزية`,
    nameAr: `الاسم بالعربية`,
    titleEn: `المسمى بالإنجليزية`,
    titleAr: `المسمى بالعربية`,
    gradeLevel: `مستوى الدرجة`,
    gradeLevelHelp: `استخدم 1 للمستوى الأول ثم زد الرقم تصاعديًا بشكل ثابت.`,
    jobGrade: `الدرجة الوظيفية`,
    descriptionEn: `الوصف بالإنجليزية (اختياري)`,
    descriptionAr: `الوصف بالعربية (اختياري)`,
    jobTitle: `المسمى الوظيفي`,
    teamOptional: `الفريق (اختياري)`,
    locationOptional: `موقع العمل (اختياري)`,
    headcount: `العدد المعتمد`,
    cancel: `إلغاء`,
    saveDepartment: `حفظ القسم`,
    saveTeam: `حفظ الفريق`,
    saveGrade: `حفظ الدرجة`,
    saveTitle: `حفظ المسمى`,
    savePosition: `حفظ المنصب`,
    createDepartment: `إنشاء قسم`,
    editDepartment: `تعديل القسم`,
    createTeam: `إنشاء فريق`,
    editTeam: `تعديل الفريق`,
    createGrade: `إنشاء درجة وظيفية`,
    editGrade: `تعديل الدرجة الوظيفية`,
    createTitle: `إنشاء مسمى وظيفي`,
    editTitle: `تعديل المسمى الوظيفي`,
    createPosition: `إنشاء منصب`,
    editPosition: `تعديل المنصب`,
    active: `فعّال`,
    inactive: `غير فعّال`,
    edit: `تعديل`,
    levelLabel: `المستوى {level}`,
    teamsCount: `الفرق: {count}`,
    titlesCount: `المسميات: {count}`,
    positionsCount: `المناصب: {count}`,
    headcountLabel: `العدد المعتمد: {count}`,
    noTeamsInDepartment: `بدون فرق`,
    requiredField: `هذا الحقل مطلوب.`,
    invalidCode: `استخدم من 2 إلى 20 حرفًا إنجليزيًا أو رقمًا أو شرطة.`,
    invalidLevel: `أدخل مستوى صحيحًا من 1 إلى 100.`,
    invalidHeadcount: `أدخل عددًا صحيحًا من 1 إلى 10,000.`,
    duplicateRecord: `هذا الرمز مستخدم مسبقًا.`,
    activeBranchRequired: `اختر فرعًا فعّالًا.`,
    activeDepartmentRequired: `اختر قسمًا فعّالًا.`,
    activeGradeRequired: `اختر درجة وظيفية فعّالة.`,
    activeTitleRequired: `اختر مسمى وظيفيًا فعّالًا.`,
    matchingDepartmentRequired: `يجب أن يتبع القسم للفرع المحدد.`,
    matchingTeamRequired: `يجب أن يتبع الفريق للقسم المحدد.`,
    matchingLocationRequired: `يجب أن يتبع موقع العمل للفرع المحدد.`,
    createBranchFirst: `أنشئ فرعًا فعّالًا قبل إضافة قسم.`,
    createDepartmentFirst: `أنشئ قسمًا فعّالًا قبل إضافة فريق.`,
    createGradeFirst: `أنشئ درجة وظيفية فعّالة قبل إضافة مسمى.`,
    createPositionDependencies: `يجب توفر فرع وقسم ودرجة ومسمى وظيفي فعّال قبل إضافة منصب.`,
    recordCreated: `تم إنشاء {type} بنجاح.`,
    recordUpdated: `تم تحديث {type} بنجاح.`,
    statusUpdated: `تم تحديث حالة {type} وتعطيل السجلات التابعة الفعّالة عند الحاجة.`,
    confirmDisable: `هل تريد تعطيل {type}؟ سيتم أيضًا تعطيل السجلات التابعة الفعّالة.`,
    confirmEnable: `هل تريد تفعيل {type}؟ ستبقى السجلات التابعة كما هي.`,
    tooManyDependents: `يوجد عدد كبير من السجلات التابعة لتحديثها بعملية آمنة واحدة. لم يتم إجراء أي تغيير.`,
    cannotActivate: `لا يمكن تفعيل السجل قبل تفعيل جميع السجلات الأعلى وربطها بشكل صحيح.`,
    departmentType: `القسم`,
    teamType: `الفريق`,
    gradeType: `الدرجة الوظيفية`,
    titleType: `المسمى الوظيفي`,
    positionType: `المنصب`,
    permissionTitle: `الدخول غير مسموح`,
    permissionCopy: `لا يملك حسابك عضوية فعّالة في هذه الشركة، أو أن قواعد Firestore المطلوبة غير منشورة.`,
    databaseTitle: `Firestore غير متاح`,
    databaseCopy: `تعذر الوصول إلى قاعدة Firestore المحددة. تحقق من القاعدة والقواعد المنشورة.`,
    genericTitle: `تعذر تحميل بيانات الهيكل`,
    genericCopy: `لم يتم إجراء أي تغيير. تحقق من الاتصال وحاول مرة أخرى.`,
    genericError: `تعذر إكمال العملية، ولم يتم إجراء أي تغيير.`,
    networkError: `تعذر الاتصال بـFirebase. تحقق من اتصال الإنترنت.`,
    retry: `إعادة المحاولة`,
    signOutError: `تعذر تسجيل الخروج.`,
    super_admin: `مسؤول كامل`,
    hr_admin: `مسؤول موارد بشرية`,
    manager: `مدير`,
    employee: `موظف`,
    language: `English`
  }
};

const elements = {
  documentElement: document.documentElement,
  pageLoader: document.querySelector(`#pageLoader`),
  appShell: document.querySelector(`#appShell`),
  languageButton: document.querySelector(`#languageButton`),
  languageLabel: document.querySelector(`#languageLabel`),
  logoutButton: document.querySelector(`#logoutButton`),
  accountAvatar: document.querySelector(`#accountAvatar`),
  accountEmail: document.querySelector(`#accountEmail`),
  systemState: document.querySelector(`#systemState`),
  systemStateTitle: document.querySelector(`#systemStateTitle`),
  systemStateCopy: document.querySelector(`#systemStateCopy`),
  retryButton: document.querySelector(`#retryButton`),
  architectureWorkspace: document.querySelector(`#architectureWorkspace`),
  companyMonogram: document.querySelector(`#companyMonogram`),
  companyName: document.querySelector(`#companyName`),
  companyRegion: document.querySelector(`#companyRegion`),
  currentRole: document.querySelector(`#currentRole`),
  activeDepartments: document.querySelector(`#activeDepartments`),
  activeTeams: document.querySelector(`#activeTeams`),
  activeJobTitles: document.querySelector(`#activeJobTitles`),
  activePositions: document.querySelector(`#activePositions`),
  readOnlyBanner: document.querySelector(`#readOnlyBanner`),
  organizationTab: document.querySelector(`#organizationTab`),
  jobsTab: document.querySelector(`#jobsTab`),
  organizationPanel: document.querySelector(`#organizationPanel`),
  jobsPanel: document.querySelector(`#jobsPanel`),
  addDepartmentButton: document.querySelector(`#addDepartmentButton`),
  addTeamButton: document.querySelector(`#addTeamButton`),
  addGradeButton: document.querySelector(`#addGradeButton`),
  addTitleButton: document.querySelector(`#addTitleButton`),
  addPositionButton: document.querySelector(`#addPositionButton`),
  departmentsList: document.querySelector(`#departmentsList`),
  departmentsEmpty: document.querySelector(`#departmentsEmpty`),
  teamsList: document.querySelector(`#teamsList`),
  teamsEmpty: document.querySelector(`#teamsEmpty`),
  gradesList: document.querySelector(`#gradesList`),
  gradesEmpty: document.querySelector(`#gradesEmpty`),
  titlesList: document.querySelector(`#titlesList`),
  titlesEmpty: document.querySelector(`#titlesEmpty`),
  positionsList: document.querySelector(`#positionsList`),
  positionsEmpty: document.querySelector(`#positionsEmpty`),
  orgChart: document.querySelector(`#orgChart`),
  orgChartEmpty: document.querySelector(`#orgChartEmpty`),
  departmentModal: document.querySelector(`#departmentModal`),
  departmentModalTitle: document.querySelector(`#departmentModalTitle`),
  departmentForm: document.querySelector(`#departmentForm`),
  departmentCode: document.querySelector(`#departmentCode`),
  departmentBranch: document.querySelector(`#departmentBranch`),
  departmentNameEn: document.querySelector(`#departmentNameEn`),
  departmentNameAr: document.querySelector(`#departmentNameAr`),
  saveDepartmentButton: document.querySelector(`#saveDepartmentButton`),
  teamModal: document.querySelector(`#teamModal`),
  teamModalTitle: document.querySelector(`#teamModalTitle`),
  teamForm: document.querySelector(`#teamForm`),
  teamCode: document.querySelector(`#teamCode`),
  teamDepartment: document.querySelector(`#teamDepartment`),
  teamNameEn: document.querySelector(`#teamNameEn`),
  teamNameAr: document.querySelector(`#teamNameAr`),
  saveTeamButton: document.querySelector(`#saveTeamButton`),
  gradeModal: document.querySelector(`#gradeModal`),
  gradeModalTitle: document.querySelector(`#gradeModalTitle`),
  gradeForm: document.querySelector(`#gradeForm`),
  gradeCode: document.querySelector(`#gradeCode`),
  gradeLevel: document.querySelector(`#gradeLevel`),
  gradeNameEn: document.querySelector(`#gradeNameEn`),
  gradeNameAr: document.querySelector(`#gradeNameAr`),
  saveGradeButton: document.querySelector(`#saveGradeButton`),
  titleModal: document.querySelector(`#titleModal`),
  titleModalTitle: document.querySelector(`#titleModalTitle`),
  titleForm: document.querySelector(`#titleForm`),
  titleCode: document.querySelector(`#titleCode`),
  titleGrade: document.querySelector(`#titleGrade`),
  titleNameEn: document.querySelector(`#titleNameEn`),
  titleNameAr: document.querySelector(`#titleNameAr`),
  titleDescriptionEn: document.querySelector(`#titleDescriptionEn`),
  titleDescriptionAr: document.querySelector(`#titleDescriptionAr`),
  saveTitleButton: document.querySelector(`#saveTitleButton`),
  positionModal: document.querySelector(`#positionModal`),
  positionModalTitle: document.querySelector(`#positionModalTitle`),
  positionForm: document.querySelector(`#positionForm`),
  positionCode: document.querySelector(`#positionCode`),
  positionTitle: document.querySelector(`#positionTitle`),
  positionBranch: document.querySelector(`#positionBranch`),
  positionDepartment: document.querySelector(`#positionDepartment`),
  positionTeam: document.querySelector(`#positionTeam`),
  positionLocation: document.querySelector(`#positionLocation`),
  positionHeadcount: document.querySelector(`#positionHeadcount`),
  savePositionButton: document.querySelector(`#savePositionButton`),
  toast: document.querySelector(`#toast`),
  toastMessage: document.querySelector(`#toastMessage`)
};

const state = {
  user: null,
  userProfile: null,
  company: null,
  membership: null,
  companyId: null,
  branches: [],
  locations: [],
  departments: [],
  teams: [],
  grades: [],
  titles: [],
  positions: [],
  currentLanguage: null,
  currentPanel: `organization`,
  editing: {
    department: null,
    team: null,
    grade: null,
    title: null,
    position: null
  },
  toastTimer: null,
  bootstrapped: false,
  mutating: false
};

const typeConfig = {
  department: {
    records: `departments`,
    collectionName: `departments`,
    form: `departmentForm`,
    modal: `departmentModal`,
    modalTitle: `departmentModalTitle`,
    code: `departmentCode`,
    saveButton: `saveDepartmentButton`,
    createTitle: `createDepartment`,
    editTitle: `editDepartment`,
    typeLabel: `departmentType`
  },
  team: {
    records: `teams`,
    collectionName: `teams`,
    form: `teamForm`,
    modal: `teamModal`,
    modalTitle: `teamModalTitle`,
    code: `teamCode`,
    saveButton: `saveTeamButton`,
    createTitle: `createTeam`,
    editTitle: `editTeam`,
    typeLabel: `teamType`
  },
  grade: {
    records: `grades`,
    collectionName: `jobGrades`,
    form: `gradeForm`,
    modal: `gradeModal`,
    modalTitle: `gradeModalTitle`,
    code: `gradeCode`,
    saveButton: `saveGradeButton`,
    createTitle: `createGrade`,
    editTitle: `editGrade`,
    typeLabel: `gradeType`
  },
  title: {
    records: `titles`,
    collectionName: `jobTitles`,
    form: `titleForm`,
    modal: `titleModal`,
    modalTitle: `titleModalTitle`,
    code: `titleCode`,
    saveButton: `saveTitleButton`,
    createTitle: `createTitle`,
    editTitle: `editTitle`,
    typeLabel: `titleType`
  },
  position: {
    records: `positions`,
    collectionName: `positions`,
    form: `positionForm`,
    modal: `positionModal`,
    modalTitle: `positionModalTitle`,
    code: `positionCode`,
    saveButton: `savePositionButton`,
    createTitle: `createPosition`,
    editTitle: `editPosition`,
    typeLabel: `positionType`
  }
};

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

const translate = (key, variables = {}) => {
  let value = translations[state.currentLanguage]?.[key] || key;
  Object.entries(variables).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, String(replacement));
  });
  return value;
};

const escapeHtml = value => String(value ?? ``).replace(/[&<>"']/g, character => ({
  [`&`]: `&amp;`,
  [`<`]: `&lt;`,
  [`>`]: `&gt;`,
  [`"`]: `&quot;`,
  [`'`]: `&#039;`
})[character]);

const normalizeCode = value => String(value || ``)
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9-]/g, ``)
  .slice(0, 20);

const isAdmin = () => adminRoles.has(state.membership?.role);

const localizedName = record => {
  if (!record) return ``;
  const primary = state.currentLanguage === `ar` ? record.nameAr : record.nameEn;
  const secondary = state.currentLanguage === `ar` ? record.nameEn : record.nameAr;
  return primary || secondary || record.code || record.id || ``;
};

const localizedDescription = record => (
  state.currentLanguage === `ar`
    ? record?.descriptionAr || record?.descriptionEn || ``
    : record?.descriptionEn || record?.descriptionAr || ``
);

const roleName = role => translate(role || `employee`);

const sortLocalized = records => [...records].sort((first, second) => (
  localizedName(first).localeCompare(
    localizedName(second),
    state.currentLanguage === `ar` ? `ar` : `en`,
    { sensitivity: `base` }
  )
));

const setButtonLoading = (button, loading) => {
  button.disabled = loading;
  button.classList.toggle(`is-loading`, loading);
  button.setAttribute(`aria-busy`, String(loading));
};

const setMutationLock = locked => {
  state.mutating = locked;
  document.querySelectorAll(`[data-action]`).forEach(button => {
    button.disabled = locked;
  });
};

const showToast = (messageKey, type = `info`, variables = {}) => {
  window.clearTimeout(state.toastTimer);
  elements.toastMessage.textContent = translate(messageKey, variables);
  elements.toast.classList.remove(`is-error`, `is-success`);
  if (type === `error`) elements.toast.classList.add(`is-error`);
  if (type === `success`) elements.toast.classList.add(`is-success`);
  elements.toast.classList.add(`is-visible`);
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 5200);
};

const clearFormErrors = form => {
  form.querySelectorAll(`.is-invalid`).forEach(field => {
    field.classList.remove(`is-invalid`);
    field.setAttribute(`aria-invalid`, `false`);
  });
  form.querySelectorAll(`.field-error`).forEach(error => {
    error.textContent = ``;
  });
};

const fieldError = (field, messageKey = ``) => {
  const error = document.querySelector(`[data-error-for="${field.id}"]`);
  field.classList.toggle(`is-invalid`, Boolean(messageKey));
  field.setAttribute(`aria-invalid`, messageKey ? `true` : `false`);
  if (error) error.textContent = messageKey ? translate(messageKey) : ``;
};

const requiredValue = field => {
  const value = field.value.trim();
  fieldError(field, value ? `` : `requiredField`);
  return value;
};

const validCodeValue = field => {
  const value = normalizeCode(field.value);
  field.value = value;
  fieldError(field, codePattern.test(value) ? `` : `invalidCode`);
  return codePattern.test(value) ? value : ``;
};

const integerValue = (field, minimum, maximum, errorKey) => {
  const value = Number(field.value);
  const valid = Number.isInteger(value) && value >= minimum && value <= maximum;
  fieldError(field, valid ? `` : errorKey);
  return valid ? value : null;
};

const firebaseMessageKey = error => {
  const code = error?.code || ``;
  if (code === `permission-denied`) return `permissionCopy`;
  if (code === `unavailable` || code === `auth/network-request-failed`) return `networkError`;
  return `genericError`;
};

const auditRecord = (action, targetId, details = {}) => ({
  companyId: state.companyId,
  actorId: state.user.uid,
  actorEmail: state.user.email || ``,
  action,
  targetId,
  details,
  createdAt: serverTimestamp()
});

const recordPath = (collectionName, recordId) => doc(
  db,
  `nasna_companies`,
  state.companyId,
  collectionName,
  recordId
);

const auditPath = () => doc(collection(
  db,
  `nasna_companies`,
  state.companyId,
  `auditLogs`
));

const findById = (records, id) => records.find(record => record.id === id);

const actionMarkup = (type, record) => {
  if (!isAdmin()) return ``;
  const inactive = record.status === `inactive`;
  return `
    <div class="row-actions">
      <button class="row-action" data-action="edit-${escapeHtml(type)}" data-id="${escapeHtml(record.id)}" type="button" title="${escapeHtml(translate(`edit`))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"/><path d="m14 7.5 2.5 2.5"/></svg>
      </button>
      <button class="row-action row-action--status${inactive ? ` is-inactive` : ``}" data-action="toggle-${escapeHtml(type)}" data-id="${escapeHtml(record.id)}" type="button">
        ${escapeHtml(translate(inactive ? `inactive` : `active`))}
      </button>
    </div>
  `;
};

const rowMarkup = ({ type, record, icon, badges = [], metadata = ``, description = `` }) => {
  const inactive = record.status === `inactive`;
  const secondaryName = state.currentLanguage === `ar` ? record.nameEn : record.nameAr;
  return `
    <article class="structure-row${inactive ? ` is-inactive` : ``}">
      <div class="row-main">
        <span class="row-icon">${icon}</span>
        <div class="row-copy">
          <span class="code-chip">${escapeHtml(record.code)}</span>
          <strong>${escapeHtml(localizedName(record))}</strong>
          ${secondaryName ? `<small dir="auto">${escapeHtml(secondaryName)}</small>` : ``}
          ${badges.length ? `<div class="row-badges">${badges.map(badge => `<span class="meta-chip${badge.accent ? ` meta-chip--accent` : ``}">${escapeHtml(badge.text)}</span>`).join(``)}</div>` : ``}
          ${metadata ? `<small dir="auto">${escapeHtml(metadata)}</small>` : ``}
          ${description ? `<small class="description-preview" dir="auto">${escapeHtml(description)}</small>` : ``}
        </div>
      </div>
      ${actionMarkup(type, record)}
    </article>
  `;
};

const icons = {
  department: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h16v14M8 10h8M8 14h8M3 20h18"/></svg>`,
  team: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20v-2a5 5 0 0 1 10 0v2M14 20v-1.5a4 4 0 0 1 7 0V20"/></svg>`,
  grade: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.4 4.8 5.3.8-3.9 3.8.9 5.3-4.7-2.5-4.7 2.5.9-5.3-3.9-3.8 5.3-.8L12 3Z"/></svg>`,
  title: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>`,
  position: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2"/></svg>`
};

const renderCompanyContext = () => {
  const name = localizedName(state.company) || `NASNA`;
  elements.companyName.textContent = name;
  elements.companyMonogram.textContent = String(name).trim().charAt(0).toUpperCase() || `N`;
  elements.companyRegion.textContent = [
    state.company?.country || `JO`,
    state.company?.currency || `JOD`,
    state.company?.timezone || `Asia/Amman`
  ].join(` · `);
  elements.currentRole.textContent = roleName(state.membership?.role);
};

const renderStatistics = () => {
  elements.activeDepartments.textContent = String(
    state.departments.filter(record => record.status === `active`).length
  );
  elements.activeTeams.textContent = String(
    state.teams.filter(record => record.status === `active`).length
  );
  elements.activeJobTitles.textContent = String(
    state.titles.filter(record => record.status === `active`).length
  );
  elements.activePositions.textContent = String(
    state.positions.filter(record => record.status === `active`).length
  );
};

const renderDepartments = () => {
  const records = sortLocalized(state.departments);
  elements.departmentsEmpty.hidden = records.length > 0;
  elements.departmentsList.innerHTML = records.map(record => {
    const branch = findById(state.branches, record.branchId);
    const teamCount = state.teams.filter(team => team.departmentId === record.id).length;
    return rowMarkup({
      type: `department`,
      record,
      icon: icons.department,
      badges: [
        { text: branch ? localizedName(branch) : record.branchId, accent: true },
        { text: translate(`teamsCount`, { count: teamCount }) }
      ]
    });
  }).join(``);
};

const renderTeams = () => {
  const records = sortLocalized(state.teams);
  elements.teamsEmpty.hidden = records.length > 0;
  elements.teamsList.innerHTML = records.map(record => {
    const department = findById(state.departments, record.departmentId);
    const branch = findById(state.branches, department?.branchId);
    return rowMarkup({
      type: `team`,
      record,
      icon: icons.team,
      badges: [
        { text: department ? localizedName(department) : record.departmentId, accent: true },
        ...(branch ? [{ text: localizedName(branch) }] : [])
      ]
    });
  }).join(``);
};

const renderGrades = () => {
  const records = [...state.grades].sort((first, second) => (
    first.level - second.level || localizedName(first).localeCompare(localizedName(second))
  ));
  elements.gradesEmpty.hidden = records.length > 0;
  elements.gradesList.innerHTML = records.map(record => {
    const titleCount = state.titles.filter(title => title.gradeId === record.id).length;
    return rowMarkup({
      type: `grade`,
      record,
      icon: icons.grade,
      badges: [
        { text: translate(`levelLabel`, { level: record.level }), accent: true },
        { text: translate(`titlesCount`, { count: titleCount }) }
      ]
    });
  }).join(``);
};

const renderTitles = () => {
  const records = sortLocalized(state.titles);
  elements.titlesEmpty.hidden = records.length > 0;
  elements.titlesList.innerHTML = records.map(record => {
    const grade = findById(state.grades, record.gradeId);
    const positionCount = state.positions.filter(position => position.jobTitleId === record.id).length;
    return rowMarkup({
      type: `title`,
      record,
      icon: icons.title,
      badges: [
        { text: grade ? `${grade.code} · ${localizedName(grade)}` : record.gradeId, accent: true },
        { text: translate(`positionsCount`, { count: positionCount }) }
      ],
      description: localizedDescription(record)
    });
  }).join(``);
};

const renderPositions = () => {
  const records = [...state.positions].sort((first, second) => {
    const firstTitle = localizedName(findById(state.titles, first.jobTitleId));
    const secondTitle = localizedName(findById(state.titles, second.jobTitleId));
    return firstTitle.localeCompare(secondTitle, state.currentLanguage === `ar` ? `ar` : `en`);
  });
  elements.positionsEmpty.hidden = records.length > 0;
  elements.positionsList.innerHTML = records.map(record => {
    const title = findById(state.titles, record.jobTitleId);
    const branch = findById(state.branches, record.branchId);
    const department = findById(state.departments, record.departmentId);
    const team = findById(state.teams, record.teamId);
    const location = findById(state.locations, record.locationId);
    const displayRecord = {
      ...record,
      nameEn: title?.nameEn || record.code,
      nameAr: title?.nameAr || record.code
    };
    const pathParts = [branch, department, team].filter(Boolean).map(localizedName);
    return rowMarkup({
      type: `position`,
      record: displayRecord,
      icon: icons.position,
      badges: [
        { text: translate(`headcountLabel`, { count: record.headcount }), accent: true },
        ...(location ? [{ text: localizedName(location) }] : [])
      ],
      metadata: pathParts.join(` › `)
    });
  }).join(``);
};

const renderOrgChart = () => {
  const branches = sortLocalized(state.branches);
  const hasDepartments = state.departments.length > 0;
  elements.orgChartEmpty.hidden = hasDepartments;
  elements.orgChart.hidden = !hasDepartments;

  elements.orgChart.innerHTML = branches.map(branch => {
    const departments = sortLocalized(
      state.departments.filter(department => department.branchId === branch.id)
    );
    if (!departments.length) return ``;
    return `
      <article class="org-branch${branch.status === `inactive` ? ` is-inactive` : ``}">
        <div class="org-branch__heading">
          <span class="org-branch__icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12M8 11h2m4 0h2M8 15h2m4 0h2M3 20h18"/></svg>
          </span>
          <div>
            <strong>${escapeHtml(localizedName(branch))}</strong>
            <small>${escapeHtml(branch.code)}</small>
          </div>
        </div>
        <div class="org-departments">
          ${departments.map(department => {
            const teams = sortLocalized(
              state.teams.filter(team => team.departmentId === department.id)
            );
            return `
              <div class="org-department${department.status === `inactive` ? ` is-inactive` : ``}">
                <strong>${escapeHtml(localizedName(department))}</strong>
                <span class="code-chip">${escapeHtml(department.code)}</span>
                <div class="org-team-list">
                  ${teams.length
                    ? teams.map(team => `<span class="org-team${team.status === `inactive` ? ` is-inactive` : ``}">${escapeHtml(localizedName(team))}</span>`).join(``)
                    : `<span class="org-empty">${escapeHtml(translate(`noTeamsInDepartment`))}</span>`}
                </div>
              </div>
            `;
          }).join(``)}
        </div>
      </article>
    `;
  }).join(``);
};

const renderPermissions = () => {
  const editable = isAdmin();
  [
    elements.addDepartmentButton,
    elements.addTeamButton,
    elements.addGradeButton,
    elements.addTitleButton,
    elements.addPositionButton
  ].forEach(button => {
    button.hidden = !editable;
  });
  elements.readOnlyBanner.hidden = editable;
};

const renderAll = () => {
  renderCompanyContext();
  renderStatistics();
  renderPermissions();
  renderDepartments();
  renderTeams();
  renderGrades();
  renderTitles();
  renderPositions();
  renderOrgChart();
};

const selectPanel = (panel, updateHash = true) => {
  state.currentPanel = panel === `jobs` ? `jobs` : `organization`;
  const jobsSelected = state.currentPanel === `jobs`;
  elements.organizationPanel.hidden = jobsSelected;
  elements.jobsPanel.hidden = !jobsSelected;
  elements.organizationTab.classList.toggle(`is-active`, !jobsSelected);
  elements.jobsTab.classList.toggle(`is-active`, jobsSelected);
  elements.organizationTab.setAttribute(`aria-selected`, String(!jobsSelected));
  elements.jobsTab.setAttribute(`aria-selected`, String(jobsSelected));
  if (updateHash) {
    history.replaceState(null, ``, jobsSelected ? `#jobs` : `#organization`);
  }
};

const setLanguage = language => {
  state.currentLanguage = language;
  safeStorage.set(languageKey, language);
  auth.languageCode = language;
  elements.documentElement.lang = language;
  elements.documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  document.title = language === `ar`
    ? `الهيكل التنظيمي والوظيفي | ناسنا`
    : `Organization & Jobs | NASNA`;

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  elements.languageLabel.textContent = translate(`language`);

  if (state.company) renderAll();
  refreshOpenModal();
};

const revealApplication = () => {
  elements.accountEmail.textContent = state.user.email || state.user.uid;
  elements.accountAvatar.textContent = String(state.user.email || `U`).charAt(0).toUpperCase();
  elements.pageLoader.hidden = true;
  elements.appShell.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const showSystemState = error => {
  const code = error?.code || ``;
  let titleKey = `genericTitle`;
  let copyKey = `genericCopy`;

  if (code === `permission-denied`) {
    titleKey = `permissionTitle`;
    copyKey = `permissionCopy`;
  } else if (code === `failed-precondition` || code === `not-found`) {
    titleKey = `databaseTitle`;
    copyKey = `databaseCopy`;
  }

  elements.systemStateTitle.textContent = translate(titleKey);
  elements.systemStateCopy.textContent = translate(copyKey);
  elements.systemState.hidden = false;
  elements.architectureWorkspace.hidden = true;
  revealApplication();
};

const snapshotRecords = snapshot => snapshot.docs.map(item => ({
  id: item.id,
  ...item.data()
}));

const loadArchitectureData = async () => {
  const collectionNames = [
    `branches`,
    `locations`,
    `departments`,
    `teams`,
    `jobGrades`,
    `jobTitles`,
    `positions`
  ];
  const snapshots = await Promise.all(collectionNames.map(collectionName => (
    getDocs(collection(db, `nasna_companies`, state.companyId, collectionName))
  )));

  state.branches = snapshotRecords(snapshots[0]);
  state.locations = snapshotRecords(snapshots[1]);
  state.departments = snapshotRecords(snapshots[2]);
  state.teams = snapshotRecords(snapshots[3]);
  state.grades = snapshotRecords(snapshots[4]);
  state.titles = snapshotRecords(snapshots[5]);
  state.positions = snapshotRecords(snapshots[6]);
};

const loadWorkspace = async () => {
  const userSnapshot = await getDoc(doc(db, `nasna_users`, state.user.uid));
  if (!userSnapshot.exists() || !userSnapshot.data().activeCompanyId) {
    window.location.replace(`organization.html?v=${version}`);
    return;
  }

  state.userProfile = userSnapshot.data();
  state.companyId = state.userProfile.activeCompanyId;

  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(doc(db, `nasna_companies`, state.companyId)),
    getDoc(doc(db, `nasna_companies`, state.companyId, `members`, state.user.uid))
  ]);

  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw Object.assign(new Error(`Missing active company membership.`), {
      code: `permission-denied`
    });
  }

  state.company = companySnapshot.data();
  state.membership = membershipSnapshot.data();
  if (state.membership.status !== `active`) {
    throw Object.assign(new Error(`Inactive company membership.`), {
      code: `permission-denied`
    });
  }

  await loadArchitectureData();
  elements.systemState.hidden = true;
  elements.architectureWorkspace.hidden = false;
  renderAll();
  selectPanel(location.hash === `#jobs` ? `jobs` : `organization`, false);
  revealApplication();
};

const bootstrap = async user => {
  if (state.bootstrapped) return;
  state.bootstrapped = true;
  state.user = user;
  try {
    await loadWorkspace();
  } catch (error) {
    console.error(`NASNA architecture loading error.`, error);
    showSystemState(error);
  }
};

const configFor = type => typeConfig[type];

const recordFor = (type, id = state.editing[type]) => {
  const config = configFor(type);
  return id ? findById(state[config.records], id) : null;
};

const setSelectOptions = (select, records, selectedId, placeholderKey, labelBuilder = null) => {
  const options = records.map(record => {
    const selected = record.id === selectedId ? ` selected` : ``;
    const label = labelBuilder
      ? labelBuilder(record)
      : `${record.code} — ${localizedName(record)}`;
    return `<option value="${escapeHtml(record.id)}"${selected}>${escapeHtml(label)}</option>`;
  }).join(``);
  select.innerHTML = `
    <option value="">${escapeHtml(translate(placeholderKey))}</option>
    ${options}
  `;
  select.value = selectedId || ``;
};

const availableRecords = (records, selectedId) => sortLocalized(records).filter(record => (
  record.status === `active` || record.id === selectedId
));

const renderDepartmentOptions = selectedId => {
  const current = recordFor(`department`);
  const selected = selectedId ?? current?.branchId ?? ``;
  setSelectOptions(
    elements.departmentBranch,
    availableRecords(state.branches, selected),
    selected,
    `selectBranch`
  );
};

const renderTeamOptions = selectedId => {
  const current = recordFor(`team`);
  const selected = selectedId ?? current?.departmentId ?? ``;
  setSelectOptions(
    elements.teamDepartment,
    availableRecords(state.departments, selected),
    selected,
    `selectDepartment`
  );
};

const renderTitleOptions = selectedId => {
  const current = recordFor(`title`);
  const selected = selectedId ?? current?.gradeId ?? ``;
  const grades = [...state.grades]
    .filter(record => record.status === `active` || record.id === selected)
    .sort((first, second) => first.level - second.level);
  setSelectOptions(
    elements.titleGrade,
    grades,
    selected,
    `selectGrade`,
    record => `${record.code} · ${translate(`levelLabel`, { level: record.level })} — ${localizedName(record)}`
  );
};

const renderPositionTitleOptions = selectedId => {
  const current = recordFor(`position`);
  const selected = selectedId ?? current?.jobTitleId ?? ``;
  setSelectOptions(
    elements.positionTitle,
    availableRecords(state.titles, selected),
    selected,
    `selectTitle`
  );
};

const renderPositionBranchOptions = selectedId => {
  const current = recordFor(`position`);
  const selected = selectedId ?? current?.branchId ?? ``;
  setSelectOptions(
    elements.positionBranch,
    availableRecords(state.branches, selected),
    selected,
    `selectBranch`
  );
};

const renderPositionDepartmentOptions = selectedId => {
  const current = recordFor(`position`);
  const selected = selectedId ?? current?.departmentId ?? ``;
  const branchId = elements.positionBranch.value || current?.branchId || ``;
  const records = sortLocalized(state.departments).filter(record => (
    record.branchId === branchId
    && (record.status === `active` || record.id === selected)
  ));
  setSelectOptions(
    elements.positionDepartment,
    records,
    records.some(record => record.id === selected) ? selected : ``,
    `selectDepartment`
  );
};

const renderPositionTeamOptions = selectedId => {
  const current = recordFor(`position`);
  const selected = selectedId ?? current?.teamId ?? ``;
  const departmentId = elements.positionDepartment.value || current?.departmentId || ``;
  const records = sortLocalized(state.teams).filter(record => (
    record.departmentId === departmentId
    && (record.status === `active` || record.id === selected)
  ));
  setSelectOptions(
    elements.positionTeam,
    records,
    records.some(record => record.id === selected) ? selected : ``,
    `selectTeam`
  );
};

const renderPositionLocationOptions = selectedId => {
  const current = recordFor(`position`);
  const selected = selectedId ?? current?.locationId ?? ``;
  const branchId = elements.positionBranch.value || current?.branchId || ``;
  const records = sortLocalized(state.locations).filter(record => (
    record.branchId === branchId
    && (record.status === `active` || record.id === selected)
  ));
  setSelectOptions(
    elements.positionLocation,
    records,
    records.some(record => record.id === selected) ? selected : ``,
    `selectLocation`
  );
};

const renderPositionOptions = current => {
  renderPositionTitleOptions(current?.jobTitleId || ``);
  renderPositionBranchOptions(current?.branchId || ``);
  renderPositionDepartmentOptions(current?.departmentId || ``);
  renderPositionTeamOptions(current?.teamId || ``);
  renderPositionLocationOptions(current?.locationId || ``);
};

const closeModal = type => {
  const config = configFor(type);
  if (!config) return;
  elements[config.modal].hidden = true;
  document.body.style.overflow = ``;
};

const modalDependencyError = type => {
  if (type === `department` && !state.branches.some(record => record.status === `active`)) {
    return `createBranchFirst`;
  }
  if (type === `team` && !state.departments.some(record => record.status === `active`)) {
    return `createDepartmentFirst`;
  }
  if (type === `title` && !state.grades.some(record => record.status === `active`)) {
    return `createGradeFirst`;
  }
  if (type === `position`) {
    const ready = state.branches.some(record => record.status === `active`)
      && state.departments.some(record => record.status === `active`)
      && state.grades.some(record => record.status === `active`)
      && state.titles.some(record => record.status === `active`);
    if (!ready) return `createPositionDependencies`;
  }
  return ``;
};

const openModal = (type, recordId = null) => {
  if (!isAdmin()) return;
  const config = configFor(type);
  if (!config) return;
  const current = recordId ? recordFor(type, recordId) : null;
  if (recordId && !current) return;

  const dependencyError = current ? `` : modalDependencyError(type);
  if (dependencyError) {
    showToast(dependencyError, `error`);
    return;
  }

  state.editing[type] = current?.id || null;
  const form = elements[config.form];
  const codeField = elements[config.code];
  form.reset();
  clearFormErrors(form);
  codeField.disabled = Boolean(current);
  codeField.value = current?.code || ``;
  elements[config.modalTitle].textContent = translate(
    current ? config.editTitle : config.createTitle
  );

  if (type === `department`) {
    renderDepartmentOptions(current?.branchId || ``);
    elements.departmentNameEn.value = current?.nameEn || ``;
    elements.departmentNameAr.value = current?.nameAr || ``;
  }
  if (type === `team`) {
    renderTeamOptions(current?.departmentId || ``);
    elements.teamNameEn.value = current?.nameEn || ``;
    elements.teamNameAr.value = current?.nameAr || ``;
  }
  if (type === `grade`) {
    elements.gradeLevel.value = current?.level || ``;
    elements.gradeNameEn.value = current?.nameEn || ``;
    elements.gradeNameAr.value = current?.nameAr || ``;
  }
  if (type === `title`) {
    renderTitleOptions(current?.gradeId || ``);
    elements.titleNameEn.value = current?.nameEn || ``;
    elements.titleNameAr.value = current?.nameAr || ``;
    elements.titleDescriptionEn.value = current?.descriptionEn || ``;
    elements.titleDescriptionAr.value = current?.descriptionAr || ``;
  }
  if (type === `position`) {
    renderPositionOptions(current);
    elements.positionHeadcount.value = current?.headcount || 1;
  }

  elements[config.modal].hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => {
    (current ? form.querySelector(`input:not(:disabled), select`) : codeField).focus();
  }, 0);
};

function refreshOpenModal() {
  Object.keys(typeConfig).forEach(type => {
    const config = configFor(type);
    if (elements[config.modal].hidden) return;
    const current = recordFor(type);
    elements[config.modalTitle].textContent = translate(
      current ? config.editTitle : config.createTitle
    );
    if (type === `department`) renderDepartmentOptions(elements.departmentBranch.value);
    if (type === `team`) renderTeamOptions(elements.teamDepartment.value);
    if (type === `title`) renderTitleOptions(elements.titleGrade.value);
    if (type === `position`) {
      renderPositionTitleOptions(elements.positionTitle.value);
      renderPositionBranchOptions(elements.positionBranch.value);
      renderPositionDepartmentOptions(elements.positionDepartment.value);
      renderPositionTeamOptions(elements.positionTeam.value);
      renderPositionLocationOptions(elements.positionLocation.value);
    }
  });
}

const currentRecordIsInactive = type => recordFor(type)?.status === `inactive`;

const validateExistingParent = (field, record, activeErrorKey, allowInactive) => {
  const valid = Boolean(record) && (allowInactive || record.status === `active`);
  fieldError(field, valid ? `` : activeErrorKey);
  return valid;
};

const formValues = {
  department: () => {
    const code = state.editing.department || validCodeValue(elements.departmentCode);
    const branchId = requiredValue(elements.departmentBranch);
    const nameEn = requiredValue(elements.departmentNameEn);
    const nameAr = requiredValue(elements.departmentNameAr);
    const branch = findById(state.branches, branchId);
    const validParent = branchId
      ? validateExistingParent(
        elements.departmentBranch,
        branch,
        `activeBranchRequired`,
        currentRecordIsInactive(`department`)
      )
      : false;
    return code && branchId && nameEn && nameAr && validParent
      ? { code, branchId, nameEn, nameAr }
      : null;
  },
  team: () => {
    const code = state.editing.team || validCodeValue(elements.teamCode);
    const departmentId = requiredValue(elements.teamDepartment);
    const nameEn = requiredValue(elements.teamNameEn);
    const nameAr = requiredValue(elements.teamNameAr);
    const department = findById(state.departments, departmentId);
    const validParent = departmentId
      ? validateExistingParent(
        elements.teamDepartment,
        department,
        `activeDepartmentRequired`,
        currentRecordIsInactive(`team`)
      )
      : false;
    return code && departmentId && nameEn && nameAr && validParent
      ? { code, departmentId, nameEn, nameAr }
      : null;
  },
  grade: () => {
    const code = state.editing.grade || validCodeValue(elements.gradeCode);
    const level = integerValue(elements.gradeLevel, 1, 100, `invalidLevel`);
    const nameEn = requiredValue(elements.gradeNameEn);
    const nameAr = requiredValue(elements.gradeNameAr);
    return code && level && nameEn && nameAr ? { code, level, nameEn, nameAr } : null;
  },
  title: () => {
    const code = state.editing.title || validCodeValue(elements.titleCode);
    const gradeId = requiredValue(elements.titleGrade);
    const nameEn = requiredValue(elements.titleNameEn);
    const nameAr = requiredValue(elements.titleNameAr);
    const grade = findById(state.grades, gradeId);
    const validParent = gradeId
      ? validateExistingParent(
        elements.titleGrade,
        grade,
        `activeGradeRequired`,
        currentRecordIsInactive(`title`)
      )
      : false;
    return code && gradeId && nameEn && nameAr && validParent
      ? {
        code,
        gradeId,
        nameEn,
        nameAr,
        descriptionEn: elements.titleDescriptionEn.value.trim(),
        descriptionAr: elements.titleDescriptionAr.value.trim()
      }
      : null;
  },
  position: () => {
    const code = state.editing.position || validCodeValue(elements.positionCode);
    const jobTitleId = requiredValue(elements.positionTitle);
    const branchId = requiredValue(elements.positionBranch);
    const departmentId = requiredValue(elements.positionDepartment);
    const teamId = elements.positionTeam.value;
    const locationId = elements.positionLocation.value;
    const headcount = integerValue(elements.positionHeadcount, 1, 10000, `invalidHeadcount`);
    const title = findById(state.titles, jobTitleId);
    const grade = findById(state.grades, title?.gradeId);
    const branch = findById(state.branches, branchId);
    const department = findById(state.departments, departmentId);
    const team = teamId ? findById(state.teams, teamId) : null;
    const locationRecord = locationId ? findById(state.locations, locationId) : null;
    const allowInactive = currentRecordIsInactive(`position`);
    let validTitle = jobTitleId
      ? validateExistingParent(elements.positionTitle, title, `activeTitleRequired`, allowInactive)
      : false;
    if (validTitle && !allowInactive && grade?.status !== `active`) {
      fieldError(elements.positionTitle, `activeTitleRequired`);
      validTitle = false;
    }
    const validBranch = branchId
      ? validateExistingParent(elements.positionBranch, branch, `activeBranchRequired`, allowInactive)
      : false;
    let validDepartment = departmentId
      ? validateExistingParent(
        elements.positionDepartment,
        department,
        `activeDepartmentRequired`,
        allowInactive
      )
      : false;
    if (validDepartment && department.branchId !== branchId) {
      fieldError(elements.positionDepartment, `matchingDepartmentRequired`);
      validDepartment = false;
    }
    let validTeam = true;
    if (teamId && (!team || team.departmentId !== departmentId || (!allowInactive && team.status !== `active`))) {
      fieldError(elements.positionTeam, `matchingTeamRequired`);
      validTeam = false;
    } else {
      fieldError(elements.positionTeam);
    }
    let validLocation = true;
    if (locationId && (
      !locationRecord
      || locationRecord.branchId !== branchId
      || (!allowInactive && locationRecord.status !== `active`)
    )) {
      fieldError(elements.positionLocation, `matchingLocationRequired`);
      validLocation = false;
    } else {
      fieldError(elements.positionLocation);
    }
    return code
      && jobTitleId
      && branchId
      && departmentId
      && headcount
      && validTitle
      && validBranch
      && validDepartment
      && validTeam
      && validLocation
      ? {
        code,
        jobTitleId,
        branchId,
        locationId,
        departmentId,
        teamId,
        headcount
      }
      : null;
  }
};

const handleSubmit = async (type, event) => {
  event.preventDefault();
  if (!isAdmin() || state.mutating) return;
  const config = configFor(type);
  const values = formValues[type]();
  if (!values) return;

  const button = elements[config.saveButton];
  setButtonLoading(button, true);
  state.mutating = true;

  try {
    const editing = Boolean(state.editing[type]);
    const reference = recordPath(config.collectionName, values.code);
    if (!editing) {
      const existing = await getDoc(reference);
      if (existing.exists()) {
        fieldError(elements[config.code], `duplicateRecord`);
        return;
      }
    }

    const batch = writeBatch(db);
    const updateValues = {
      ...values,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    };
    if (editing) {
      const { code: immutableCode, ...mutableValues } = updateValues;
      batch.update(reference, mutableValues);
    } else {
      batch.set(reference, {
        id: values.code,
        companyId: state.companyId,
        ...updateValues,
        status: `active`,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
    }
    batch.set(auditPath(), auditRecord(
      `${type}.${editing ? `updated` : `created`}`,
      values.code,
      Object.fromEntries(
        Object.entries(values).filter(([key]) => ![`descriptionEn`, `descriptionAr`].includes(key))
      )
    ));

    await batch.commit();
    await loadArchitectureData();
    renderAll();
    closeModal(type);
    showToast(
      editing ? `recordUpdated` : `recordCreated`,
      `success`,
      { type: translate(config.typeLabel) }
    );
  } catch (error) {
    console.error(`NASNA ${type} save error.`, error);
    showToast(firebaseMessageKey(error), `error`);
  } finally {
    state.mutating = false;
    setButtonLoading(button, false);
  }
};

const positionRelationsAreActive = position => {
  const title = findById(state.titles, position.jobTitleId);
  const grade = findById(state.grades, title?.gradeId);
  const branch = findById(state.branches, position.branchId);
  const department = findById(state.departments, position.departmentId);
  const team = position.teamId ? findById(state.teams, position.teamId) : null;
  const locationRecord = position.locationId
    ? findById(state.locations, position.locationId)
    : null;
  return title?.status === `active`
    && grade?.status === `active`
    && branch?.status === `active`
    && department?.status === `active`
    && department.branchId === position.branchId
    && (!position.teamId || (
      team?.status === `active`
      && team.departmentId === position.departmentId
    ))
    && (!position.locationId || (
      locationRecord?.status === `active`
      && locationRecord.branchId === position.branchId
    ));
};

const canActivate = (type, record) => {
  if (type === `department`) {
    return findById(state.branches, record.branchId)?.status === `active`;
  }
  if (type === `team`) {
    return findById(state.departments, record.departmentId)?.status === `active`;
  }
  if (type === `grade`) return true;
  if (type === `title`) {
    return findById(state.grades, record.gradeId)?.status === `active`;
  }
  if (type === `position`) return positionRelationsAreActive(record);
  return false;
};

const dependentUpdates = (type, record) => {
  const updates = new Map();
  const add = (collectionName, item) => {
    if (item.status === `active`) {
      updates.set(`${collectionName}/${item.id}`, { collectionName, item });
    }
  };

  if (type === `department`) {
    state.teams
      .filter(item => item.departmentId === record.id)
      .forEach(item => add(`teams`, item));
    state.positions
      .filter(item => item.departmentId === record.id)
      .forEach(item => add(`positions`, item));
  }
  if (type === `team`) {
    state.positions
      .filter(item => item.teamId === record.id)
      .forEach(item => add(`positions`, item));
  }
  if (type === `grade`) {
    const titleIds = new Set(
      state.titles.filter(item => item.gradeId === record.id).map(item => item.id)
    );
    state.titles
      .filter(item => item.gradeId === record.id)
      .forEach(item => add(`jobTitles`, item));
    state.positions
      .filter(item => titleIds.has(item.jobTitleId))
      .forEach(item => add(`positions`, item));
  }
  if (type === `title`) {
    state.positions
      .filter(item => item.jobTitleId === record.id)
      .forEach(item => add(`positions`, item));
  }
  return [...updates.values()];
};

const toggleStatus = async (type, recordId) => {
  if (!isAdmin() || state.mutating) return;
  const config = configFor(type);
  const record = recordFor(type, recordId);
  if (!record || !validStatuses.has(record.status)) return;

  const targetStatus = record.status === `active` ? `inactive` : `active`;
  if (targetStatus === `active` && !canActivate(type, record)) {
    showToast(`cannotActivate`, `error`);
    return;
  }

  const confirmed = window.confirm(translate(
    targetStatus === `inactive` ? `confirmDisable` : `confirmEnable`,
    { type: translate(config.typeLabel) }
  ));
  if (!confirmed) return;

  const dependents = targetStatus === `inactive`
    ? dependentUpdates(type, record)
    : [];
  if (dependents.length > 447) {
    showToast(`tooManyDependents`, `error`);
    return;
  }

  setMutationLock(true);
  try {
    const batch = writeBatch(db);
    batch.update(recordPath(config.collectionName, record.id), {
      status: targetStatus,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    dependents.forEach(({ collectionName, item }) => {
      batch.update(recordPath(collectionName, item.id), {
        status: `inactive`,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    batch.set(auditPath(), auditRecord(`${type}.status_changed`, record.id, {
      from: record.status,
      to: targetStatus,
      disabledDependents: dependents.length
    }));

    await batch.commit();
    await loadArchitectureData();
    renderAll();
    showToast(`statusUpdated`, `success`, { type: translate(config.typeLabel) });
  } catch (error) {
    console.error(`NASNA ${type} status error.`, error);
    showToast(firebaseMessageKey(error), `error`);
    renderAll();
  } finally {
    setMutationLock(false);
  }
};

const handleListAction = event => {
  const button = event.target.closest(`[data-action][data-id]`);
  if (!button || state.mutating) return;
  const { action, id } = button.dataset;
  const [verb, type] = action.split(`-`);
  if (!typeConfig[type]) return;
  if (verb === `edit`) openModal(type, id);
  if (verb === `toggle`) toggleStatus(type, id);
};

const handleLogout = async () => {
  elements.logoutButton.disabled = true;
  try {
    await signOut(auth);
    window.location.replace(`./?v=${version}`);
  } catch (error) {
    console.error(`NASNA sign-out error.`, error);
    showToast(`signOutError`, `error`);
    elements.logoutButton.disabled = false;
  }
};

state.currentLanguage = safeStorage.get(languageKey)
  || (navigator.language.startsWith(`ar`) ? `ar` : `en`);
setLanguage(state.currentLanguage);
selectPanel(location.hash === `#jobs` ? `jobs` : `organization`, false);

elements.languageButton.addEventListener(`click`, () => {
  setLanguage(state.currentLanguage === `en` ? `ar` : `en`);
});
elements.logoutButton.addEventListener(`click`, handleLogout);
elements.retryButton.addEventListener(`click`, () => window.location.reload());
elements.organizationTab.addEventListener(`click`, () => selectPanel(`organization`));
elements.jobsTab.addEventListener(`click`, () => selectPanel(`jobs`));
elements.addDepartmentButton.addEventListener(`click`, () => openModal(`department`));
elements.addTeamButton.addEventListener(`click`, () => openModal(`team`));
elements.addGradeButton.addEventListener(`click`, () => openModal(`grade`));
elements.addTitleButton.addEventListener(`click`, () => openModal(`title`));
elements.addPositionButton.addEventListener(`click`, () => openModal(`position`));
elements.departmentForm.addEventListener(`submit`, event => handleSubmit(`department`, event));
elements.teamForm.addEventListener(`submit`, event => handleSubmit(`team`, event));
elements.gradeForm.addEventListener(`submit`, event => handleSubmit(`grade`, event));
elements.titleForm.addEventListener(`submit`, event => handleSubmit(`title`, event));
elements.positionForm.addEventListener(`submit`, event => handleSubmit(`position`, event));

[
  elements.departmentsList,
  elements.teamsList,
  elements.gradesList,
  elements.titlesList,
  elements.positionsList
].forEach(list => list.addEventListener(`click`, handleListAction));

document.querySelectorAll(`[data-close-modal]`).forEach(button => {
  button.addEventListener(`click`, () => closeModal(button.dataset.closeModal));
});

[
  elements.departmentCode,
  elements.teamCode,
  elements.gradeCode,
  elements.titleCode,
  elements.positionCode
].forEach(field => {
  field.addEventListener(`input`, () => {
    field.value = normalizeCode(field.value);
    if (field.classList.contains(`is-invalid`)) validCodeValue(field);
  });
});

elements.positionBranch.addEventListener(`change`, () => {
  renderPositionDepartmentOptions(``);
  renderPositionTeamOptions(``);
  renderPositionLocationOptions(``);
});
elements.positionDepartment.addEventListener(`change`, () => {
  renderPositionTeamOptions(``);
});

window.addEventListener(`hashchange`, () => {
  selectPanel(location.hash === `#jobs` ? `jobs` : `organization`, false);
});

document.addEventListener(`keydown`, event => {
  if (event.key !== `Escape`) return;
  const openType = Object.keys(typeConfig).find(type => (
    !elements[typeConfig[type].modal].hidden
  ));
  if (openType) closeModal(openType);
});

const authFallbackTimer = window.setTimeout(() => {
  if (auth.currentUser) {
    bootstrap(auth.currentUser);
    return;
  }
  window.location.replace(`./?v=${version}`);
}, 8000);

onAuthStateChanged(auth, user => {
  window.clearTimeout(authFallbackTimer);
  if (!user) {
    window.location.replace(`./?v=${version}`);
    return;
  }
  bootstrap(user);
});
