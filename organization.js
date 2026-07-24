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
import {
  auth,
  db,
  firebaseConfig
} from "./firebase-config.js?v=20260724.4";

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your access…`,
    dashboard: `Dashboard`,
    signOut: `Sign out`,
    stageLabel: `Stage 04 · Foundation`,
    pageTitle: `Company & access management`,
    pageDescription: `Set up the company workspace and control who can access it.`,
    signedInAs: `Signed in as`,
    databaseRequiredTitle: `Firestore setup required`,
    databaseRequiredCopy: `The application is ready, but the Firestore database has not been created in this Firebase project yet.`,
    databaseStepOne: `Open Firebase Console → Firestore Database.`,
    databaseStepTwo: `Create the database in Production mode and choose a nearby region.`,
    databaseStepThree: `Publish the firestore.rules file from the GitHub repository.`,
    permissionTitle: `Firestore rules are not active`,
    permissionCopy: `Publish the repository’s firestore.rules file, then reload this page.`,
    firstWorkspace: `First workspace`,
    createCompanyTitle: `Create your company`,
    createCompanyCopy: `This account becomes the company owner and Super Admin. You can add the HR team afterward.`,
    benefitIsolation: `Company data is isolated from every other tenant.`,
    benefitRoles: `Roles are enforced by Firestore Security Rules.`,
    benefitAudit: `Sensitive changes create audit records.`,
    companyIdentity: `Company identity`,
    companyIdentityCopy: `Official names used across employee records and reports.`,
    companyNameEn: `Company name in English`,
    companyNameAr: `Company name in Arabic`,
    taxNumber: `Tax number`,
    ownerName: `Your full name`,
    regionalSettings: `Regional settings`,
    regionalSettingsCopy: `Defaults used by future payroll, attendance, and reporting modules.`,
    country: `Country`,
    currency: `Currency`,
    timezone: `Timezone`,
    ownerNotice: `Your account will be permanently registered as the workspace owner.`,
    createWorkspace: `Create workspace`,
    activeWorkspace: `Active workspace`,
    yourRole: `Your role`,
    totalUsers: `Total users`,
    workspaceMembers: `Workspace members`,
    activeUsers: `Active users`,
    accessEnabled: `Access enabled`,
    admins: `Administrators`,
    adminAccess: `Super & HR admins`,
    accessControl: `Access control`,
    peopleWithAccess: `People with access`,
    addUser: `Add user`,
    noMembers: `No users have been added yet.`,
    securityRules: `Security rules`,
    tenantIsolation: `Tenant isolation active`,
    tenantIsolationCopy: `Users can only read the company where they hold an active membership.`,
    checkCompany: `Company-scoped access`,
    checkRoles: `Server-enforced roles`,
    checkAudit: `Immutable audit logs`,
    addUserTitle: `Create a company user`,
    fullName: `Full name`,
    workEmail: `Work email`,
    role: `Role`,
    employee: `Employee`,
    manager: `Manager`,
    hrAdmin: `HR Admin`,
    superAdmin: `Super Admin`,
    temporaryPassword: `Temporary password`,
    temporaryPasswordHelp: `At least 8 characters. Ask the user to reset it after first sign-in.`,
    cancel: `Cancel`,
    createUser: `Create user`,
    active: `Active`,
    disabled: `Disabled`,
    requiredField: `This field is required.`,
    invalidEmail: `Enter a valid work email.`,
    shortPassword: `The temporary password must contain at least 8 characters.`,
    companyCreated: `The company workspace was created successfully.`,
    userCreated: `The user was created and password-reset instructions were sent.`,
    memberUpdated: `The user’s access was updated.`,
    signOutError: `Sign-out could not be completed.`,
    genericError: `The operation could not be completed. Try again.`,
    emailInUse: `This email already has a Firebase account. Use a different email for this stage.`,
    weakPassword: `Choose a stronger temporary password.`,
    permissionError: `You do not have permission to perform this action.`,
    networkError: `Could not connect to Firebase. Check your internet connection.`,
    ownerLocked: `The workspace owner must remain an active Super Admin.`,
    confirmRole: `Change this user’s role?`,
    confirmStatus: `Change this user’s access status?`,
    super_admin: `Super Admin`,
    hr_admin: `HR Admin`,
    manager_role: `Manager`,
    employee_role: `Employee`,
    language: `العربية`
  },
  ar: {
    brandName: `ناسنا`,
    checkingAccess: `جارٍ التحقق من صلاحياتك…`,
    dashboard: `لوحة التحكم`,
    signOut: `تسجيل الخروج`,
    stageLabel: `المرحلة 04 · الأساس`,
    pageTitle: `إدارة الشركة والصلاحيات`,
    pageDescription: `أنشئ مساحة الشركة وحدد الأشخاص المسموح لهم بالدخول إليها.`,
    signedInAs: `تم الدخول بواسطة`,
    databaseRequiredTitle: `يلزم إعداد Firestore`,
    databaseRequiredCopy: `التطبيق جاهز، لكن قاعدة Firestore لم تُنشأ بعد داخل مشروع Firebase الحالي.`,
    databaseStepOne: `افتح Firebase Console ← Firestore Database.`,
    databaseStepTwo: `أنشئ القاعدة بوضع Production واختر منطقة قريبة.`,
    databaseStepThree: `انشر ملف firestore.rules الموجود في مستودع GitHub.`,
    permissionTitle: `قواعد Firestore غير مفعّلة`,
    permissionCopy: `انشر ملف firestore.rules الموجود في المستودع، ثم أعد تحميل الصفحة.`,
    firstWorkspace: `مساحة العمل الأولى`,
    createCompanyTitle: `أنشئ شركتك`,
    createCompanyCopy: `سيصبح هذا الحساب مالك الشركة وSuper Admin، وبعدها يمكنك إضافة فريق الموارد البشرية.`,
    benefitIsolation: `بيانات الشركة معزولة عن جميع الشركات الأخرى.`,
    benefitRoles: `الصلاحيات مطبقة من خلال Firestore Security Rules.`,
    benefitAudit: `التعديلات الحساسة تُسجل في سجل العمليات.`,
    companyIdentity: `هوية الشركة`,
    companyIdentityCopy: `الأسماء الرسمية المستخدمة في ملفات الموظفين والتقارير.`,
    companyNameEn: `اسم الشركة بالإنجليزية`,
    companyNameAr: `اسم الشركة بالعربية`,
    taxNumber: `الرقم الضريبي`,
    ownerName: `اسمك الكامل`,
    regionalSettings: `الإعدادات الإقليمية`,
    regionalSettingsCopy: `إعدادات افتراضية لأنظمة الرواتب والدوام والتقارير القادمة.`,
    country: `الدولة`,
    currency: `العملة`,
    timezone: `المنطقة الزمنية`,
    ownerNotice: `سيتم تسجيل حسابك بشكل دائم كمالك لمساحة العمل.`,
    createWorkspace: `إنشاء مساحة العمل`,
    activeWorkspace: `مساحة العمل الحالية`,
    yourRole: `صلاحيتك`,
    totalUsers: `إجمالي المستخدمين`,
    workspaceMembers: `مستخدمو مساحة العمل`,
    activeUsers: `المستخدمون الفعّالون`,
    accessEnabled: `الدخول مفعّل`,
    admins: `المسؤولون`,
    adminAccess: `Super Admin وHR Admin`,
    accessControl: `التحكم بالصلاحيات`,
    peopleWithAccess: `الأشخاص المسموح لهم بالدخول`,
    addUser: `إضافة مستخدم`,
    noMembers: `لم تتم إضافة مستخدمين بعد.`,
    securityRules: `قواعد الأمان`,
    tenantIsolation: `عزل الشركات مفعّل`,
    tenantIsolationCopy: `لا يستطيع المستخدم قراءة أي شركة إلا إذا كان لديه اشتراك فعّال فيها.`,
    checkCompany: `وصول مقيّد بالشركة`,
    checkRoles: `صلاحيات مطبقة على الخادم`,
    checkAudit: `سجل عمليات غير قابل للتعديل`,
    addUserTitle: `إنشاء مستخدم للشركة`,
    fullName: `الاسم الكامل`,
    workEmail: `بريد العمل الإلكتروني`,
    role: `الصلاحية`,
    employee: `موظف`,
    manager: `مدير`,
    hrAdmin: `مسؤول موارد بشرية`,
    superAdmin: `مسؤول كامل`,
    temporaryPassword: `كلمة مرور مؤقتة`,
    temporaryPasswordHelp: `8 أحرف على الأقل. اطلب من المستخدم تغييرها بعد أول دخول.`,
    cancel: `إلغاء`,
    createUser: `إنشاء المستخدم`,
    active: `فعّال`,
    disabled: `معطّل`,
    requiredField: `هذا الحقل مطلوب.`,
    invalidEmail: `أدخل بريد عمل إلكتروني صحيحًا.`,
    shortPassword: `يجب ألا تقل كلمة المرور المؤقتة عن 8 أحرف.`,
    companyCreated: `تم إنشاء مساحة الشركة بنجاح.`,
    userCreated: `تم إنشاء المستخدم وإرسال تعليمات تغيير كلمة المرور.`,
    memberUpdated: `تم تحديث صلاحية المستخدم.`,
    signOutError: `تعذر تسجيل الخروج.`,
    genericError: `تعذر إكمال العملية. حاول مرة أخرى.`,
    emailInUse: `هذا البريد لديه حساب Firebase مسبقًا. استخدم بريدًا مختلفًا في هذه المرحلة.`,
    weakPassword: `اختر كلمة مرور مؤقتة أقوى.`,
    permissionError: `لا تملك صلاحية تنفيذ هذه العملية.`,
    networkError: `تعذر الاتصال بـFirebase. تحقق من اتصال الإنترنت.`,
    ownerLocked: `يجب أن يبقى مالك مساحة العمل Super Admin فعّالًا.`,
    confirmRole: `هل تريد تغيير صلاحية هذا المستخدم؟`,
    confirmStatus: `هل تريد تغيير حالة دخول هذا المستخدم؟`,
    super_admin: `مسؤول كامل`,
    hr_admin: `مسؤول موارد بشرية`,
    manager_role: `مدير`,
    employee_role: `موظف`,
    language: `English`
  }
};

const version = `20260724.4`;
const languageKey = `nasna-language`;
const roleValues = [`super_admin`, `hr_admin`, `manager`, `employee`];
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const elements = {
  documentElement: document.documentElement,
  pageLoader: document.querySelector(`#pageLoader`),
  appShell: document.querySelector(`#appShell`),
  languageButton: document.querySelector(`#languageButton`),
  languageLabel: document.querySelector(`#languageLabel`),
  logoutButton: document.querySelector(`#logoutButton`),
  accountEmail: document.querySelector(`#accountEmail`),
  accountAvatar: document.querySelector(`#accountAvatar`),
  databaseRequired: document.querySelector(`#databaseRequired`),
  permissionRequired: document.querySelector(`#permissionRequired`),
  companySetup: document.querySelector(`#companySetup`),
  companyForm: document.querySelector(`#companyForm`),
  createCompanyButton: document.querySelector(`#createCompanyButton`),
  companyWorkspace: document.querySelector(`#companyWorkspace`),
  companyDisplayName: document.querySelector(`#companyDisplayName`),
  companySecondaryName: document.querySelector(`#companySecondaryName`),
  companyRegion: document.querySelector(`#companyRegion`),
  companyMonogram: document.querySelector(`#companyMonogram`),
  currentRole: document.querySelector(`#currentRole`),
  totalUsers: document.querySelector(`#totalUsers`),
  activeUsers: document.querySelector(`#activeUsers`),
  adminUsers: document.querySelector(`#adminUsers`),
  membersList: document.querySelector(`#membersList`),
  membersEmpty: document.querySelector(`#membersEmpty`),
  openAddUserButton: document.querySelector(`#openAddUserButton`),
  addUserModal: document.querySelector(`#addUserModal`),
  modalBackdrop: document.querySelector(`#modalBackdrop`),
  closeAddUserButton: document.querySelector(`#closeAddUserButton`),
  cancelAddUserButton: document.querySelector(`#cancelAddUserButton`),
  addUserForm: document.querySelector(`#addUserForm`),
  createUserButton: document.querySelector(`#createUserButton`),
  toast: document.querySelector(`#toast`),
  toastMessage: document.querySelector(`#toastMessage`)
};

const state = {
  user: null,
  userProfile: null,
  company: null,
  membership: null,
  members: [],
  companyId: null,
  currentLanguage: null,
  toastTimer: null
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

const translate = key => translations[state.currentLanguage]?.[key] || key;

const roleTranslationKey = role => {
  if (role === `manager`) return `manager_role`;
  if (role === `employee`) return `employee_role`;
  return role;
};

const setLanguage = language => {
  state.currentLanguage = language;
  safeStorage.set(languageKey, language);
  auth.languageCode = language;
  elements.documentElement.lang = language;
  elements.documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  document.title = language === `ar`
    ? `إدارة الشركة والصلاحيات | ناسنا`
    : `Company & Access | NASNA`;

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  elements.languageLabel.textContent = translate(`language`);
  if (state.company) renderCompany();
  if (state.members.length) renderMembers();
};

const hideAllStates = () => {
  elements.databaseRequired.hidden = true;
  elements.permissionRequired.hidden = true;
  elements.companySetup.hidden = true;
  elements.companyWorkspace.hidden = true;
};

const showToast = (messageKey, type = `info`) => {
  window.clearTimeout(state.toastTimer);
  elements.toastMessage.textContent = translate(messageKey);
  elements.toast.classList.remove(`is-error`, `is-success`);
  if (type === `error`) elements.toast.classList.add(`is-error`);
  if (type === `success`) elements.toast.classList.add(`is-success`);
  elements.toast.classList.add(`is-visible`);
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 5000);
};

const showApp = user => {
  elements.accountEmail.textContent = user.email || user.uid;
  elements.accountAvatar.textContent = String(user.email || `U`).charAt(0).toUpperCase();
  elements.pageLoader.hidden = true;
  elements.appShell.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const firebaseErrorKey = error => {
  const code = error?.code || ``;
  const message = String(error?.message || ``).toLowerCase();

  if (
    code === `failed-precondition`
    || code === `not-found`
    || message.includes(`database (default) does not exist`)
  ) return `databaseRequiredTitle`;
  if (code === `permission-denied`) return `permissionError`;
  if (code === `auth/email-already-in-use`) return `emailInUse`;
  if (code === `auth/weak-password`) return `weakPassword`;
  if (code === `auth/network-request-failed` || code === `unavailable`) return `networkError`;
  return `genericError`;
};

const isDatabaseMissing = error => {
  const code = error?.code || ``;
  const message = String(error?.message || ``).toLowerCase();
  return code === `failed-precondition`
    || code === `not-found`
    || message.includes(`database (default) does not exist`);
};

const setButtonLoading = (button, isLoading) => {
  button.disabled = isLoading;
  button.classList.toggle(`is-loading`, isLoading);
  button.setAttribute(`aria-busy`, String(isLoading));
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

const companyFormData = () => {
  const companyNameEn = requiredValue(document.querySelector(`#companyNameEn`));
  const companyNameAr = requiredValue(document.querySelector(`#companyNameAr`));
  const ownerName = requiredValue(document.querySelector(`#ownerName`));
  if (!companyNameEn || !companyNameAr || !ownerName) return null;

  return {
    companyNameEn,
    companyNameAr,
    ownerName,
    taxNumber: document.querySelector(`#taxNumber`).value.trim(),
    country: document.querySelector(`#country`).value,
    currency: document.querySelector(`#currency`).value,
    timezone: document.querySelector(`#timezone`).value
  };
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

const handleCreateCompany = async event => {
  event.preventDefault();
  const values = companyFormData();
  if (!values) return;

  setButtonLoading(elements.createCompanyButton, true);

  try {
    const existingUser = await getDoc(doc(db, `users`, state.user.uid));
    if (existingUser.exists() && existingUser.data().activeCompanyId) {
      await loadAccountState();
      return;
    }

    const companyRef = doc(collection(db, `companies`));
    const companyId = companyRef.id;
    const memberRef = doc(db, `companies`, companyId, `members`, state.user.uid);
    const userRef = doc(db, `users`, state.user.uid);
    const auditRef = doc(collection(db, `companies`, companyId, `auditLogs`));
    const batch = writeBatch(db);

    state.companyId = companyId;

    batch.set(companyRef, {
      id: companyId,
      nameEn: values.companyNameEn,
      nameAr: values.companyNameAr,
      taxNumber: values.taxNumber,
      country: values.country,
      currency: values.currency,
      timezone: values.timezone,
      ownerId: state.user.uid,
      status: `active`,
      subscription: {
        plan: `free`,
        status: `active`
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(memberRef, {
      uid: state.user.uid,
      companyId,
      email: state.user.email || ``,
      displayName: values.ownerName,
      role: `super_admin`,
      status: `active`,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(userRef, {
      uid: state.user.uid,
      email: state.user.email || ``,
      displayName: values.ownerName,
      activeCompanyId: companyId,
      status: `active`,
      locale: state.currentLanguage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(auditRef, auditRecord(`company.created`, companyId, {
      nameEn: values.companyNameEn,
      nameAr: values.companyNameAr
    }));

    await batch.commit();
    showToast(`companyCreated`, `success`);
    await loadAccountState();
  } catch (error) {
    console.error(`NASNA company creation error.`, error);
    if (isDatabaseMissing(error)) {
      hideAllStates();
      elements.databaseRequired.hidden = false;
    } else if (error?.code === `permission-denied`) {
      hideAllStates();
      elements.permissionRequired.hidden = false;
    } else {
      showToast(firebaseErrorKey(error), `error`);
    }
  } finally {
    setButtonLoading(elements.createCompanyButton, false);
  }
};

const renderCompany = () => {
  if (!state.company || !state.membership) return;

  const primaryName = state.currentLanguage === `ar`
    ? state.company.nameAr
    : state.company.nameEn;
  const secondaryName = state.currentLanguage === `ar`
    ? state.company.nameEn
    : state.company.nameAr;

  elements.companyDisplayName.textContent = primaryName || secondaryName || `NASNA`;
  elements.companySecondaryName.textContent = secondaryName || ``;
  elements.companyRegion.textContent = `${state.company.country || `JO`} · ${state.company.currency || `JOD`} · ${state.company.timezone || `Asia/Amman`}`;
  elements.companyMonogram.textContent = String(primaryName || `N`).trim().charAt(0).toUpperCase();
  elements.currentRole.textContent = translate(roleTranslationKey(state.membership.role));
  elements.openAddUserButton.hidden = !adminRoles.has(state.membership.role);
};

const roleOptions = selectedRole => roleValues.map(role => {
  if (role === `super_admin` && state.membership?.role !== `super_admin`) return ``;
  const key = roleTranslationKey(role);
  const selected = selectedRole === role ? ` selected` : ``;
  return `<option value="${role}"${selected}>${translate(key)}</option>`;
}).join(``);

const renderMembers = () => {
  const isAdmin = adminRoles.has(state.membership?.role);
  const ownerId = state.company?.ownerId;
  const activeCount = state.members.filter(member => member.status === `active`).length;
  const adminCount = state.members.filter(member => adminRoles.has(member.role)).length;

  elements.totalUsers.textContent = String(state.members.length);
  elements.activeUsers.textContent = String(activeCount);
  elements.adminUsers.textContent = String(adminCount);
  elements.membersEmpty.hidden = state.members.length > 0;
  elements.membersList.innerHTML = state.members.map(member => {
    const isOwner = member.uid === ownerId;
    const canEdit = isAdmin
      && !isOwner
      && (
        state.membership.role === `super_admin`
        || member.role !== `super_admin`
      );
    const initial = String(member.displayName || member.email || `U`).trim().charAt(0).toUpperCase();
    const disabled = canEdit ? `` : ` disabled`;
    const statusClass = member.status === `disabled` ? ` is-disabled` : ``;

    return `
      <article class="member-row" data-member-id="${member.uid}">
        <div class="member-identity">
          <span class="member-avatar">${initial}</span>
          <div>
            <strong>${member.displayName || member.email || member.uid}</strong>
            <small>${member.email || member.uid}</small>
          </div>
        </div>
        <select class="member-role" data-action="role"${disabled} aria-label="${translate(`role`)}">
          ${roleOptions(member.role)}
        </select>
        <button class="status-button${statusClass}" data-action="status" type="button"${disabled}>
          ${translate(member.status === `active` ? `active` : `disabled`)}
        </button>
      </article>
    `;
  }).join(``);
};

const loadMembers = async () => {
  const snapshot = await getDocs(collection(db, `companies`, state.companyId, `members`));
  state.members = snapshot.docs
    .map(memberDoc => memberDoc.data())
    .sort((a, b) => {
      if (a.uid === state.company.ownerId) return -1;
      if (b.uid === state.company.ownerId) return 1;
      return String(a.displayName || a.email).localeCompare(String(b.displayName || b.email));
    });
  renderMembers();
};

const loadCompany = async companyId => {
  const companyRef = doc(db, `companies`, companyId);
  const membershipRef = doc(db, `companies`, companyId, `members`, state.user.uid);
  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(companyRef),
    getDoc(membershipRef)
  ]);

  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw Object.assign(new Error(`Company membership is missing.`), { code: `permission-denied` });
  }

  state.companyId = companyId;
  state.company = companySnapshot.data();
  state.membership = membershipSnapshot.data();

  if (state.membership.status !== `active`) {
    throw Object.assign(new Error(`The membership is disabled.`), { code: `permission-denied` });
  }

  hideAllStates();
  elements.companyWorkspace.hidden = false;
  renderCompany();
  await loadMembers();
};

const loadAccountState = async () => {
  hideAllStates();

  try {
    const profileSnapshot = await getDoc(doc(db, `users`, state.user.uid));

    if (!profileSnapshot.exists() || !profileSnapshot.data().activeCompanyId) {
      state.userProfile = null;
      elements.companySetup.hidden = false;
      document.querySelector(`#ownerName`).value = state.user.displayName || ``;
      return;
    }

    state.userProfile = profileSnapshot.data();
    await loadCompany(state.userProfile.activeCompanyId);
  } catch (error) {
    console.error(`NASNA workspace loading error.`, error);
    hideAllStates();
    if (isDatabaseMissing(error)) {
      elements.databaseRequired.hidden = false;
    } else if (error?.code === `permission-denied`) {
      elements.permissionRequired.hidden = false;
    } else {
      elements.permissionRequired.hidden = false;
      showToast(firebaseErrorKey(error), `error`);
    }
  }
};

const openAddUserModal = () => {
  if (!adminRoles.has(state.membership?.role)) return;
  elements.addUserForm.reset();
  const superAdminOption = document.querySelector(`#newUserRole option[value="super_admin"]`);
  superAdminOption.hidden = state.membership.role !== `super_admin`;
  superAdminOption.disabled = state.membership.role !== `super_admin`;
  elements.addUserModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => document.querySelector(`#newUserName`).focus(), 0);
};

const closeAddUserModal = () => {
  elements.addUserModal.hidden = true;
  document.body.style.overflow = ``;
};

const newUserFormData = () => {
  const nameField = document.querySelector(`#newUserName`);
  const emailField = document.querySelector(`#newUserEmail`);
  const passwordField = document.querySelector(`#newUserPassword`);
  const displayName = requiredValue(nameField);
  const email = requiredValue(emailField).toLowerCase();
  const password = passwordField.value;
  const role = document.querySelector(`#newUserRole`).value;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  fieldError(emailField, !email ? `requiredField` : emailValid ? `` : `invalidEmail`);
  fieldError(passwordField, !password ? `requiredField` : password.length >= 8 ? `` : `shortPassword`);

  if (!displayName || !emailValid || password.length < 8 || !roleValues.includes(role)) return null;
  return { displayName, email, password, role };
};

const handleCreateUser = async event => {
  event.preventDefault();
  const values = newUserFormData();
  if (!values || !state.companyId || !adminRoles.has(state.membership?.role)) return;

  setButtonLoading(elements.createUserButton, true);
  const secondaryApp = initializeApp(firebaseConfig, `nasna-user-provisioning-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  let createdCredential = null;

  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    createdCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      values.email,
      values.password
    );

    const newUid = createdCredential.user.uid;
    const memberRef = doc(db, `companies`, state.companyId, `members`, newUid);
    const userRef = doc(db, `users`, newUid);
    const auditRef = doc(collection(db, `companies`, state.companyId, `auditLogs`));
    const batch = writeBatch(db);

    batch.set(memberRef, {
      uid: newUid,
      companyId: state.companyId,
      email: values.email,
      displayName: values.displayName,
      role: values.role,
      status: `active`,
      createdBy: state.user.uid,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(userRef, {
      uid: newUid,
      email: values.email,
      displayName: values.displayName,
      activeCompanyId: state.companyId,
      status: `active`,
      locale: `en`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(auditRef, auditRecord(`member.created`, newUid, {
      email: values.email,
      role: values.role
    }));

    await batch.commit();
    auth.languageCode = state.currentLanguage;
    await sendPasswordResetEmail(auth, values.email).catch(error => {
      console.warn(`NASNA password reset email could not be sent.`, error);
    });

    closeAddUserModal();
    showToast(`userCreated`, `success`);
    await loadMembers();
  } catch (error) {
    console.error(`NASNA user creation error.`, error);
    if (createdCredential?.user) {
      await deleteUser(createdCredential.user).catch(cleanupError => {
        console.error(`NASNA orphan Auth account cleanup failed.`, cleanupError);
      });
    }
    showToast(firebaseErrorKey(error), `error`);
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
    setButtonLoading(elements.createUserButton, false);
  }
};

const updateMember = async (memberId, updates, action) => {
  const member = state.members.find(item => item.uid === memberId);
  if (!member || !adminRoles.has(state.membership?.role)) return;
  if (memberId === state.company.ownerId) {
    showToast(`ownerLocked`, `error`);
    renderMembers();
    return;
  }

  const memberRef = doc(db, `companies`, state.companyId, `members`, memberId);
  const auditRef = doc(collection(db, `companies`, state.companyId, `auditLogs`));
  const batch = writeBatch(db);

  batch.update(memberRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  batch.set(auditRef, auditRecord(action, memberId, updates));

  try {
    await batch.commit();
    showToast(`memberUpdated`, `success`);
    await loadMembers();
  } catch (error) {
    console.error(`NASNA membership update error.`, error);
    showToast(firebaseErrorKey(error), `error`);
    renderMembers();
  }
};

const handleMembersChange = event => {
  const select = event.target.closest(`[data-action="role"]`);
  if (!select) return;
  const row = select.closest(`[data-member-id]`);
  const memberId = row?.dataset.memberId;
  if (!memberId || !roleValues.includes(select.value)) return;

  if (!window.confirm(translate(`confirmRole`))) {
    renderMembers();
    return;
  }

  updateMember(memberId, { role: select.value }, `member.role_changed`);
};

const handleMembersClick = event => {
  const button = event.target.closest(`[data-action="status"]`);
  if (!button) return;
  const row = button.closest(`[data-member-id]`);
  const memberId = row?.dataset.memberId;
  const member = state.members.find(item => item.uid === memberId);
  if (!member) return;

  if (!window.confirm(translate(`confirmStatus`))) return;
  const status = member.status === `active` ? `disabled` : `active`;
  updateMember(memberId, { status }, `member.status_changed`);
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

elements.languageButton.addEventListener(`click`, () => {
  setLanguage(state.currentLanguage === `en` ? `ar` : `en`);
});
elements.logoutButton.addEventListener(`click`, handleLogout);
elements.companyForm.addEventListener(`submit`, handleCreateCompany);
elements.openAddUserButton.addEventListener(`click`, openAddUserModal);
elements.closeAddUserButton.addEventListener(`click`, closeAddUserModal);
elements.cancelAddUserButton.addEventListener(`click`, closeAddUserModal);
elements.modalBackdrop.addEventListener(`click`, closeAddUserModal);
elements.addUserForm.addEventListener(`submit`, handleCreateUser);
elements.membersList.addEventListener(`change`, handleMembersChange);
elements.membersList.addEventListener(`click`, handleMembersClick);
document.addEventListener(`keydown`, event => {
  if (event.key === `Escape` && !elements.addUserModal.hidden) closeAddUserModal();
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace(`./?v=${version}`);
    return;
  }

  state.user = user;
  showApp(user);
  await loadAccountState();
});
