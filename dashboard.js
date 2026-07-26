import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260726.1";
import { db } from "./firestore-config.js?v=20260726.1";

const release = `20260726.1`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);

const translations = {
  en: {
    brandName: `NASNA`,
    checkingSession: `Checking your secure session…`,
    signedInUser: `Signed-in user`,
    signOut: `Sign out`,
    secureWorkspace: `Secure workspace`,
    welcomeTitle: `Welcome to NASNA`,
    welcomeCopy: `Your account is connected and Firebase Authentication is active.`,
    accountActive: `Account active`,
    platformRoadmap: `Platform roadmap`,
    modulesHeading: `NASNA modules`,
    stage: `Stage 09`,
    currentModule: `Current module`,
    completed: `Completed`,
    companyAccessTitle: `Company & Access`,
    companyAccessDescription: `Company setup, tenant isolation, users, roles, and audit controls.`,
    structureTitle: `Branches & Locations`,
    structureDescription: `Company branches and physical workplaces for future people records.`,
    organizationTitle: `Departments & Teams`,
    organizationDescription: `Departments, teams, and a live branch-based organization chart.`,
    jobsTitle: `Job Architecture`,
    jobsDescription: `Job grades, bilingual titles, descriptions, and approved positions.`,
    peopleTitle: `Employee Records`,
    peopleDescription: `Employee files, login accounts, reporting lines, self-service, and manager workspaces.`,
    myProfileTitle: `My employee file`,
    myProfileDescription: `View your job assignment, reporting line, work details, and private employee information.`,
    managerProfileTitle: `My profile & team`,
    managerProfileDescription: `Open your employee file, then switch to the separate manager workspace for your direct reports.`,
    documentsTitle: `Documents & Contracts`,
    documentsDescription: `Employee document register, expiry monitoring, visibility controls, and secure references.`,
    lifecycleTitle: `Employment Lifecycle`,
    lifecycleDescription: `Immutable transfers, promotions, reporting changes, and employment history.`,
    planned: `Planned`,
    coreDescription: `People records, organizational structure, roles, and documents.`,
    timeDescription: `Attendance, shifts, leave, and working-time controls.`,
    insightsDescription: `People analytics, workforce indicators, and executive dashboards.`,
    securityTitle: `Authentication protected`,
    securityCopy: `This page is only available while a valid Firebase session is active.`,
    language: `العربية`,
    signOutError: `Sign-out could not be completed. Try again.`
  },
  ar: {
    brandName: `ناسنا`,
    checkingSession: `جارٍ التحقق من الجلسة الآمنة…`,
    signedInUser: `المستخدم الحالي`,
    signOut: `تسجيل الخروج`,
    secureWorkspace: `مساحة عمل آمنة`,
    welcomeTitle: `أهلًا بك في ناسنا`,
    welcomeCopy: `حسابك متصل وتم تفعيل Firebase Authentication بنجاح.`,
    accountActive: `الحساب فعّال`,
    platformRoadmap: `خارطة طريق المنصة`,
    modulesHeading: `أنظمة ناسنا`,
    stage: `المرحلة 09`,
    currentModule: `النظام الحالي`,
    completed: `مكتمل`,
    companyAccessTitle: `الشركة والصلاحيات`,
    companyAccessDescription: `إعداد الشركة وعزل البيانات والمستخدمون والصلاحيات وسجل العمليات.`,
    structureTitle: `الفروع ومواقع العمل`,
    structureDescription: `فروع الشركة وأماكن العمل التي ستعتمد عليها ملفات الموظفين لاحقًا.`,
    organizationTitle: `الأقسام والفرق`,
    organizationDescription: `الأقسام والفرق ومخطط تنظيمي مباشر مبني على الفروع.`,
    jobsTitle: `الهيكل الوظيفي`,
    jobsDescription: `الدرجات والمسميات ثنائية اللغة والأوصاف والمناصب المعتمدة.`,
    peopleTitle: `ملفات الموظفين`,
    peopleDescription: `ملفات الموظفين وحسابات الدخول والتبعية الإدارية ومساحتا الموظف والمدير.`,
    myProfileTitle: `ملفي الوظيفي`,
    myProfileDescription: `اعرض تعيينك الوظيفي ومديرك المباشر وتفاصيل العمل والمعلومات الخاصة.`,
    managerProfileTitle: `ملفي وفريقي`,
    managerProfileDescription: `افتح ملفك كموظف، ثم انتقل إلى مساحة المدير المنفصلة لمتابعة مرؤوسيك المباشرين.`,
    documentsTitle: `الوثائق والعقود`,
    documentsDescription: `سجل وثائق الموظفين ومتابعة الانتهاء وضبط الظهور والمراجع الآمنة.`,
    lifecycleTitle: `دورة حياة الموظف`,
    lifecycleDescription: `سجل غير قابل للتعديل للنقل والترقيات وتغيير التبعية والحركات الوظيفية.`,
    planned: `مخطط`,
    coreDescription: `بيانات الموظفين والهيكل التنظيمي والصلاحيات والمستندات.`,
    timeDescription: `الحضور والمناوبات والإجازات وضوابط وقت العمل.`,
    insightsDescription: `تحليلات الموظفين ومؤشرات القوى العاملة ولوحات الإدارة.`,
    securityTitle: `محمية بالمصادقة`,
    securityCopy: `لا يمكن الوصول إلى هذه الصفحة دون جلسة Firebase صالحة.`,
    language: `English`,
    signOutError: `تعذر تسجيل الخروج. حاول مرة أخرى.`
  }
};

const storageKey = `nasna-language`;
const elements = {
  documentElement: document.documentElement,
  authLoader: document.querySelector(`#authLoader`),
  workspace: document.querySelector(`#workspace`),
  languageButton: document.querySelector(`#dashboardLanguageButton`),
  languageLabel: document.querySelector(`#dashboardLanguageLabel`),
  userEmail: document.querySelector(`#userEmail`),
  userAvatar: document.querySelector(`#userAvatar`),
  logoutButton: document.querySelector(`#logoutButton`),
  peopleModuleLink: document.querySelector(`#peopleModuleLink`),
  peopleModuleTitle: document.querySelector(`#peopleModuleTitle`),
  peopleModuleDescription: document.querySelector(`#peopleModuleDescription`),
  toast: document.querySelector(`#dashboardToast`),
  toastMessage: document.querySelector(`#dashboardToastMessage`)
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
    } catch {
      return false;
    }
    return true;
  }
};

let currentLanguage = safeStorage.get(storageKey) || (navigator.language.startsWith(`ar`) ? `ar` : `en`);
let toastTimer = null;
let sessionContext = null;

const translate = key => translations[currentLanguage][key] || key;

const renderPeopleModule = () => {
  if (!elements.peopleModuleLink || !sessionContext) return;
  const { membership } = sessionContext;
  const isAdmin = adminRoles.has(membership.role);
  const hasEmployeeFile = Boolean(membership.employeeId);
  const isManager = Boolean(membership.isManager || membership.role === `manager`);

  elements.peopleModuleLink.href = isAdmin
    ? `people.html?v=${release}`
    : hasEmployeeFile
      ? `employee.html?v=${release}`
      : `organization.html?v=${release}`;

  const titleKey = isAdmin
    ? `peopleTitle`
    : isManager
      ? `managerProfileTitle`
      : `myProfileTitle`;
  const descriptionKey = isAdmin
    ? `peopleDescription`
    : isManager
      ? `managerProfileDescription`
      : `myProfileDescription`;
  elements.peopleModuleTitle.textContent = translate(titleKey);
  elements.peopleModuleDescription.textContent = translate(descriptionKey);
};

const setLanguage = language => {
  currentLanguage = language;
  safeStorage.set(storageKey, language);
  elements.documentElement.lang = language;
  elements.documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  auth.languageCode = language;
  document.title = language === `ar` ? `مساحة العمل | ناسنا` : `Workspace | NASNA`;

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });

  elements.languageLabel.textContent = translate(`language`);
  renderPeopleModule();
};

const showToast = messageKey => {
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = translate(messageKey);
  elements.toast.classList.add(`is-visible`);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4200);
};

const userInitial = email => {
  const value = String(email || `U`).trim();
  return value.charAt(0).toUpperCase() || `U`;
};

const revealWorkspace = user => {
  elements.userEmail.textContent = user.email || user.uid;
  elements.userAvatar.textContent = userInitial(user.email);
  elements.authLoader.hidden = true;
  elements.workspace.hidden = false;
  document.body.classList.remove(`is-checking-auth`);
};

const loadSessionContext = async user => {
  const profileSnapshot = await getDoc(doc(db, `nasna_users`, user.uid));
  if (!profileSnapshot.exists()) {
    throw new Error(`NASNA user profile is missing.`);
  }
  const userProfile = profileSnapshot.data();
  if (userProfile.status !== `active` || !userProfile.activeCompanyId) {
    throw new Error(`NASNA user access is disabled.`);
  }
  const membershipSnapshot = await getDoc(doc(
    db,
    `nasna_companies`,
    userProfile.activeCompanyId,
    `members`,
    user.uid
  ));
  if (!membershipSnapshot.exists() || membershipSnapshot.data().status !== `active`) {
    throw new Error(`NASNA company membership is disabled.`);
  }
  sessionContext = {
    userProfile,
    membership: membershipSnapshot.data()
  };
  renderPeopleModule();
};

const handleSignOut = async () => {
  elements.logoutButton.disabled = true;

  try {
    await signOut(auth);
    window.location.replace(`./?v=${release}`);
  } catch (error) {
    console.error(`NASNA sign-out error.`, error);
    showToast(`signOutError`);
    elements.logoutButton.disabled = false;
  }
};

elements.languageButton.addEventListener(`click`, () => {
  setLanguage(currentLanguage === `en` ? `ar` : `en`);
});
elements.logoutButton.addEventListener(`click`, handleSignOut);

setLanguage(currentLanguage);

const sessionFallbackTimer = window.setTimeout(() => {
  window.location.replace(`./?v=${release}`);
}, 8000);

onAuthStateChanged(auth, async user => {
  window.clearTimeout(sessionFallbackTimer);

  if (!user) {
    window.location.replace(`./?v=${release}`);
    return;
  }

  try {
    await loadSessionContext(user);
    revealWorkspace(user);
  } catch (error) {
    console.error(`NASNA dashboard access error.`, error);
    await signOut(auth).catch(() => undefined);
    window.location.replace(`./?error=access-disabled&v=${release}`);
  }
});
