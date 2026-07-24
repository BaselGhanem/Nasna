import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260725.3";

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
    stage: `Stage 04`,
    currentModule: `Current module`,
    companyAccessTitle: `Company & Access`,
    companyAccessDescription: `Company setup, tenant isolation, users, roles, and audit controls.`,
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
    stage: `المرحلة 04`,
    currentModule: `النظام الحالي`,
    companyAccessTitle: `الشركة والصلاحيات`,
    companyAccessDescription: `إعداد الشركة وعزل البيانات والمستخدمون والصلاحيات وسجل العمليات.`,
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

const translate = key => translations[currentLanguage][key] || key;

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

const handleSignOut = async () => {
  elements.logoutButton.disabled = true;

  try {
    await signOut(auth);
    window.location.replace(`./?v=20260725.3`);
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

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace(`./?v=20260725.3`);
    return;
  }

  revealWorkspace(user);
});
