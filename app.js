import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260724.4";

const translations = {
  en: {
    pageTitle: `Sign in | NASNA`,
    brandName: `NASNA`,
    platform: `People Management Platform`,
    brandHeading: `Your people.<br>One connected platform.`,
    brandCopy: `Bring employee records, time, performance, and insights together in one clear workspace.`,
    peopleOverview: `People overview`,
    live: `Live`,
    activePeople: `Active people`,
    teamConnected: `Team connected`,
    poweredBy: `Powered by X Academy`,
    welcomeBack: `Welcome back`,
    signInTitle: `Sign in to NASNA`,
    signInCopy: `Access your people workspace securely.`,
    workEmail: `Work email`,
    password: `Password`,
    forgotPassword: `Forgot password?`,
    rememberEmail: `Remember my email`,
    signIn: `Sign in`,
    installApp: `Install NASNA on this device`,
    secureNote: `Protected access for authorized company users`,
    language: `العربية`,
    languageAria: `Switch to Arabic`,
    showPassword: `Show password`,
    hidePassword: `Hide password`,
    emailRequired: `Enter your work email.`,
    emailInvalid: `Enter a valid email address.`,
    passwordRequired: `Enter your password.`,
    passwordShort: `Password must contain at least 8 characters.`,
    signingIn: `Signing in…`,
    signInSuccess: `Signed in successfully. Opening your workspace…`,
    resetEmailSent: `Password reset instructions were sent to your email.`,
    enterEmailFirst: `Enter your work email first.`,
    invalidCredentials: `The email or password is incorrect.`,
    accountDisabled: `This account has been disabled. Contact your company administrator.`,
    tooManyRequests: `Too many attempts. Wait a few minutes and try again.`,
    networkError: `Could not connect to Firebase. Check your internet connection.`,
    authNotEnabled: `Email and password sign-in is not enabled in Firebase.`,
    unauthorizedDomain: `This website domain is not authorized in Firebase Authentication.`,
    genericAuthError: `Sign-in could not be completed. Try again.`,
    resetUserNotFound: `No active account was found for this email.`,
    installUnavailable: `Use your browser menu and choose “Install app” or “Add to Home screen”.`,
    installed: `NASNA has been installed on this device.`,
    installDismissed: `Installation was not completed. You can install NASNA later.`
  },
  ar: {
    pageTitle: `تسجيل الدخول | ناسنا`,
    brandName: `ناسنا`,
    platform: `منصة إدارة الأفراد`,
    brandHeading: `ناسك.<br>كلهم بمنصة واحدة.`,
    brandCopy: `اجمع بيانات الموظفين والدوام والأداء والتحليلات في مساحة عمل واضحة ومتكاملة.`,
    peopleOverview: `نظرة عامة على الموظفين`,
    live: `مباشر`,
    activePeople: `موظف فعّال`,
    teamConnected: `الفريق متصل`,
    poweredBy: `بدعم من X Academy`,
    welcomeBack: `أهلًا بعودتك`,
    signInTitle: `سجّل دخولك إلى ناسنا`,
    signInCopy: `ادخل إلى مساحة إدارة الأفراد بأمان.`,
    workEmail: `البريد الإلكتروني للعمل`,
    password: `كلمة المرور`,
    forgotPassword: `نسيت كلمة المرور؟`,
    rememberEmail: `تذكّر بريدي الإلكتروني`,
    signIn: `تسجيل الدخول`,
    installApp: `ثبّت ناسنا على هذا الجهاز`,
    secureNote: `دخول محمي لمستخدمي الشركة المصرّح لهم`,
    language: `English`,
    languageAria: `Switch to English`,
    showPassword: `إظهار كلمة المرور`,
    hidePassword: `إخفاء كلمة المرور`,
    emailRequired: `أدخل بريد العمل الإلكتروني.`,
    emailInvalid: `أدخل بريدًا إلكترونيًا صحيحًا.`,
    passwordRequired: `أدخل كلمة المرور.`,
    passwordShort: `يجب ألا تقل كلمة المرور عن 8 أحرف.`,
    signingIn: `جارٍ تسجيل الدخول…`,
    signInSuccess: `تم تسجيل الدخول. جارٍ فتح مساحة العمل…`,
    resetEmailSent: `تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك.`,
    enterEmailFirst: `أدخل بريد العمل الإلكتروني أولًا.`,
    invalidCredentials: `البريد الإلكتروني أو كلمة المرور غير صحيحة.`,
    accountDisabled: `تم تعطيل هذا الحساب. تواصل مع مسؤول الشركة.`,
    tooManyRequests: `محاولات كثيرة. انتظر بضع دقائق ثم حاول مجددًا.`,
    networkError: `تعذر الاتصال بـFirebase. تحقق من اتصال الإنترنت.`,
    authNotEnabled: `تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase.`,
    unauthorizedDomain: `نطاق الموقع غير مصرح به في Firebase Authentication.`,
    genericAuthError: `تعذر إكمال تسجيل الدخول. حاول مرة أخرى.`,
    resetUserNotFound: `لم يتم العثور على حساب فعّال لهذا البريد.`,
    installUnavailable: `افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».`,
    installed: `تم تثبيت ناسنا على هذا الجهاز.`,
    installDismissed: `لم يكتمل التثبيت. يمكنك تثبيت ناسنا لاحقًا.`
  }
};

const elements = {
  documentElement: document.documentElement,
  languageButton: document.querySelector(`#languageButton`),
  mobileLanguageButton: document.querySelector(`#mobileLanguageButton`),
  languageLabel: document.querySelector(`#languageLabel`),
  mobileLanguageLabel: document.querySelector(`#mobileLanguageLabel`),
  loginForm: document.querySelector(`#loginForm`),
  email: document.querySelector(`#email`),
  password: document.querySelector(`#password`),
  emailError: document.querySelector(`#emailError`),
  passwordError: document.querySelector(`#passwordError`),
  rememberEmail: document.querySelector(`#rememberEmail`),
  passwordToggle: document.querySelector(`#passwordToggle`),
  forgotPasswordButton: document.querySelector(`#forgotPasswordButton`),
  signInButton: document.querySelector(`#signInButton`),
  signInButtonLabel: document.querySelector(`#signInButton .button-label`),
  installButton: document.querySelector(`#installButton`),
  toast: document.querySelector(`#toast`),
  toastMessage: document.querySelector(`#toastMessage`),
  currentYear: document.querySelector(`#currentYear`)
};

const storageKeys = {
  language: `nasna-language`,
  rememberedEmail: `nasna-remembered-email`
};

const storage = {
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
  },
  remove: key => {
    try {
      localStorage.removeItem(key);
    } catch {
      return false;
    }
    return true;
  }
};

let currentLanguage = storage.get(storageKeys.language) || (navigator.language.startsWith(`ar`) ? `ar` : `en`);
let deferredInstallPrompt = null;
let toastTimer = null;

const translate = key => translations[currentLanguage][key] || key;

const authErrorKey = error => {
  const code = error?.code || ``;
  const errorMap = {
    [`auth/invalid-credential`]: `invalidCredentials`,
    [`auth/wrong-password`]: `invalidCredentials`,
    [`auth/user-not-found`]: `invalidCredentials`,
    [`auth/invalid-email`]: `emailInvalid`,
    [`auth/user-disabled`]: `accountDisabled`,
    [`auth/too-many-requests`]: `tooManyRequests`,
    [`auth/network-request-failed`]: `networkError`,
    [`auth/operation-not-allowed`]: `authNotEnabled`,
    [`auth/unauthorized-domain`]: `unauthorizedDomain`
  };

  return errorMap[code] || `genericAuthError`;
};

const setLanguage = language => {
  currentLanguage = language;
  storage.set(storageKeys.language, language);
  auth.languageCode = language;

  const isArabic = language === `ar`;
  elements.documentElement.lang = language;
  elements.documentElement.dir = isArabic ? `rtl` : `ltr`;
  document.title = translate(`pageTitle`);

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    const key = element.dataset.i18n;
    element.innerHTML = translate(key);
  });

  elements.languageLabel.textContent = translate(`language`);
  elements.mobileLanguageLabel.textContent = translate(`language`);
  elements.languageButton.setAttribute(`aria-label`, translate(`languageAria`));
  elements.mobileLanguageButton.setAttribute(`aria-label`, translate(`languageAria`));

  const passwordIsVisible = elements.password.type === `text`;
  elements.passwordToggle.setAttribute(
    `aria-label`,
    translate(passwordIsVisible ? `hidePassword` : `showPassword`)
  );

  validateField(elements.email, false);
  validateField(elements.password, false);
};

const toggleLanguage = () => {
  setLanguage(currentLanguage === `en` ? `ar` : `en`);
};

const showToast = (messageKey, type = `info`) => {
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = translate(messageKey);
  elements.toast.classList.remove(`is-error`, `is-success`);
  if (type === `error`) elements.toast.classList.add(`is-error`);
  if (type === `success`) elements.toast.classList.add(`is-success`);
  elements.toast.classList.add(`is-visible`);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove(`is-visible`);
  }, 4800);
};

const setFieldError = (field, errorElement, message) => {
  const inputWrap = field.closest(`.input-wrap`);
  inputWrap.classList.toggle(`is-invalid`, Boolean(message));
  field.setAttribute(`aria-invalid`, message ? `true` : `false`);
  errorElement.textContent = message;
};

const validateField = (field, announce = true) => {
  let message = ``;

  if (field === elements.email) {
    const value = field.value.trim();
    if (!value) {
      message = translate(`emailRequired`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = translate(`emailInvalid`);
    }
    setFieldError(field, elements.emailError, announce || value ? message : ``);
  }

  if (field === elements.password) {
    const value = field.value;
    if (!value) {
      message = translate(`passwordRequired`);
    } else if (value.length < 8) {
      message = translate(`passwordShort`);
    }
    setFieldError(field, elements.passwordError, announce || value ? message : ``);
  }

  return !message;
};

const setSubmitting = isSubmitting => {
  elements.signInButton.disabled = isSubmitting;
  elements.signInButton.classList.toggle(`is-loading`, isSubmitting);
  elements.signInButton.setAttribute(`aria-busy`, String(isSubmitting));
  elements.signInButtonLabel.textContent = translate(isSubmitting ? `signingIn` : `signIn`);
};

const handleSubmit = async event => {
  event.preventDefault();

  const emailIsValid = validateField(elements.email);
  const passwordIsValid = validateField(elements.password);

  if (!emailIsValid || !passwordIsValid) {
    const firstInvalidField = !emailIsValid ? elements.email : elements.password;
    firstInvalidField.focus();
    return;
  }

  if (elements.rememberEmail.checked) {
    storage.set(storageKeys.rememberedEmail, elements.email.value.trim());
  } else {
    storage.remove(storageKeys.rememberedEmail);
  }

  setSubmitting(true);

  try {
    const persistence = elements.rememberEmail.checked
      ? browserLocalPersistence
      : browserSessionPersistence;

    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(
      auth,
      elements.email.value.trim(),
      elements.password.value
    );

    showToast(`signInSuccess`, `success`);
    window.setTimeout(() => {
      window.location.replace(`dashboard.html?v=20260724.4`);
    }, 500);
  } catch (error) {
    console.error(`NASNA authentication error.`, error);
    showToast(authErrorKey(error), `error`);
    setSubmitting(false);
  }
};

const togglePasswordVisibility = () => {
  const shouldShow = elements.password.type === `password`;
  elements.password.type = shouldShow ? `text` : `password`;
  elements.passwordToggle.classList.toggle(`is-visible`, shouldShow);
  elements.passwordToggle.setAttribute(
    `aria-label`,
    translate(shouldShow ? `hidePassword` : `showPassword`)
  );
  elements.password.focus();
};

const restorePreferences = () => {
  const rememberedEmail = storage.get(storageKeys.rememberedEmail);
  if (rememberedEmail) {
    elements.email.value = rememberedEmail;
    elements.rememberEmail.checked = true;
  }
};

const handleInstall = async () => {
  if (!deferredInstallPrompt) {
    showToast(`installUnavailable`);
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  showToast(choice.outcome === `accepted` ? `installed` : `installDismissed`);
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
};

const registerServiceWorker = async () => {
  if (!(`serviceWorker` in navigator)) return;

  try {
    await navigator.serviceWorker.register(`./sw.js`, {
      scope: `./`,
      updateViaCache: `none`
    });
  } catch (error) {
    console.warn(`NASNA service worker registration failed.`, error);
  }
};

const handlePasswordReset = async () => {
  const emailIsValid = validateField(elements.email);
  if (!emailIsValid) {
    elements.email.focus();
    showToast(`enterEmailFirst`, `error`);
    return;
  }

  elements.forgotPasswordButton.disabled = true;

  try {
    auth.languageCode = currentLanguage;
    await sendPasswordResetEmail(auth, elements.email.value.trim());
    showToast(`resetEmailSent`, `success`);
  } catch (error) {
    const key = error?.code === `auth/user-not-found`
      ? `resetUserNotFound`
      : authErrorKey(error);
    console.error(`NASNA password reset error.`, error);
    showToast(key, `error`);
  } finally {
    elements.forgotPasswordButton.disabled = false;
  }
};

elements.currentYear.textContent = String(new Date().getFullYear());
elements.languageButton.addEventListener(`click`, toggleLanguage);
elements.mobileLanguageButton.addEventListener(`click`, toggleLanguage);
elements.passwordToggle.addEventListener(`click`, togglePasswordVisibility);
elements.forgotPasswordButton.addEventListener(`click`, handlePasswordReset);
elements.loginForm.addEventListener(`submit`, handleSubmit);
elements.email.addEventListener(`blur`, () => validateField(elements.email));
elements.password.addEventListener(`blur`, () => validateField(elements.password));
elements.email.addEventListener(`input`, () => validateField(elements.email, false));
elements.password.addEventListener(`input`, () => validateField(elements.password, false));
elements.installButton.addEventListener(`click`, handleInstall);

window.addEventListener(`beforeinstallprompt`, event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installButton.hidden = false;
});

window.addEventListener(`appinstalled`, () => {
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
});

restorePreferences();
setLanguage(currentLanguage);

const pageError = new URLSearchParams(window.location.search).get(`error`);
if (pageError === `access-disabled`) {
  showToast(`accountDisabled`, `error`);
}

const isStandalone = window.matchMedia(`(display-mode: standalone)`).matches || window.navigator.standalone === true;
const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
if (isMobileDevice && !isStandalone) {
  elements.installButton.hidden = false;
}

registerServiceWorker();

onAuthStateChanged(auth, user => {
  if (user) {
    window.location.replace(`dashboard.html?v=20260724.4`);
  }
});
