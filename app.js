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
    authPending: `The secure sign-in interface is ready. Firebase will be connected in the next stage.`,
    recoveryPending: `Password recovery will be activated with Firebase Authentication.`,
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
    authPending: `واجهة الدخول الآمنة جاهزة. سيتم ربط Firebase في المرحلة التالية.`,
    recoveryPending: `سيتم تفعيل استعادة كلمة المرور مع Firebase Authentication.`,
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

const setLanguage = language => {
  currentLanguage = language;
  storage.set(storageKeys.language, language);

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

const showToast = messageKey => {
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = translate(messageKey);
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

const handleSubmit = event => {
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

  showToast(`authPending`);
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
    await navigator.serviceWorker.register(`./sw.js`, { scope: `./` });
  } catch (error) {
    console.warn(`NASNA service worker registration failed.`, error);
  }
};

elements.currentYear.textContent = String(new Date().getFullYear());
elements.languageButton.addEventListener(`click`, toggleLanguage);
elements.mobileLanguageButton.addEventListener(`click`, toggleLanguage);
elements.passwordToggle.addEventListener(`click`, togglePasswordVisibility);
elements.forgotPasswordButton.addEventListener(`click`, () => showToast(`recoveryPending`));
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

const isStandalone = window.matchMedia(`(display-mode: standalone)`).matches || window.navigator.standalone === true;
const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
if (isMobileDevice && !isStandalone) {
  elements.installButton.hidden = false;
}

registerServiceWorker();
