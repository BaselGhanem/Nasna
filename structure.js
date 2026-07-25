import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260725.7";
import { db } from "./firestore-config.js?v=20260725.7";

const version = `20260725.7`;
const languageKey = `nasna-language`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const validStatuses = new Set([`active`, `inactive`]);
const codePattern = /^[A-Z0-9][A-Z0-9-]{1,19}$/;

const translations = {
  en: {
    brandName: `NASNA`,
    checkingAccess: `Checking your access…`,
    dashboard: `Dashboard`,
    access: `Access`,
    signOut: `Sign out`,
    stageLabel: `Stage 05.1 · NASNA Core`,
    pageTitle: `Branches & work locations`,
    pageDescription: `Build the company structure that future departments, jobs, employees, and attendance will use.`,
    signedInAs: `Signed in as`,
    activeWorkspace: `Active workspace`,
    yourRole: `Your role`,
    totalBranches: `Total branches`,
    registeredBranches: `Registered company branches`,
    activeBranches: `Active branches`,
    availableForAssignment: `Available for assignment`,
    activeLocations: `Active locations`,
    workplaces: `Employee workplaces`,
    readOnlyTitle: `View-only access`,
    readOnlyCopy: `Only Super Admin and HR Admin can change the company structure.`,
    companyStructure: `Company structure`,
    branches: `Branches`,
    addBranch: `Add branch`,
    branchesDescription: `Legal or operational company units used to organize employees and reporting.`,
    workplacesLabel: `Physical workplaces`,
    locations: `Work locations`,
    addLocation: `Add location`,
    locationsDescription: `Offices, warehouses, stores, or sites linked to a company branch.`,
    noBranchesTitle: `No branches yet`,
    noBranchesCopy: `Create the first branch before adding work locations.`,
    noLocationsTitle: `No work locations yet`,
    noLocationsCopy: `Locations become available after the first branch is created.`,
    createBranch: `Create branch`,
    editBranch: `Edit branch`,
    branchCode: `Branch code`,
    codeHelp: `2–20 English letters, numbers, or hyphens. The code cannot be changed later.`,
    nameEn: `Name in English`,
    nameAr: `Name in Arabic`,
    cancel: `Cancel`,
    saveBranch: `Save branch`,
    createLocation: `Create work location`,
    editLocation: `Edit work location`,
    locationCode: `Location code`,
    parentBranch: `Parent branch`,
    selectBranch: `Select a branch`,
    city: `City`,
    address: `Address`,
    saveLocation: `Save location`,
    active: `Active`,
    inactive: `Inactive`,
    edit: `Edit`,
    locationsCount: `Work locations: {count}`,
    requiredField: `This field is required.`,
    invalidCode: `Use 2–20 English letters, numbers, or hyphens.`,
    duplicateBranch: `A branch with this code already exists.`,
    duplicateLocation: `A location with this code already exists.`,
    createBranchFirst: `Create an active branch before adding a work location.`,
    activeBranchRequired: `Select an active branch for this location.`,
    branchCreated: `The branch was created successfully.`,
    branchUpdated: `The branch was updated successfully.`,
    locationCreated: `The work location was created successfully.`,
    locationUpdated: `The work location was updated successfully.`,
    branchStatusUpdated: `The branch status was updated. Its active locations were disabled when required.`,
    locationStatusUpdated: `The work location status was updated.`,
    confirmDisableBranch: `Disable this branch? All active locations linked to it will also be disabled.`,
    confirmEnableBranch: `Enable this branch? Its locations will remain unchanged.`,
    confirmDisableLocation: `Disable this work location?`,
    confirmEnableLocation: `Enable this work location?`,
    tooManyLocations: `This branch has too many active locations for one safe update. No changes were made.`,
    permissionTitle: `Access denied`,
    permissionCopy: `Your account does not have an active membership in this company, or the required Firestore rules are not active.`,
    databaseTitle: `Firestore is unavailable`,
    databaseCopy: `The configured Firestore database could not be reached. Check the database and published rules.`,
    genericTitle: `The structure could not be loaded`,
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
    access: `الصلاحيات`,
    signOut: `تسجيل الخروج`,
    stageLabel: `المرحلة 05.1 · ناسنا Core`,
    pageTitle: `الفروع ومواقع العمل`,
    pageDescription: `أنشئ هيكل الشركة الذي ستعتمد عليه الأقسام والوظائف والموظفون والحضور لاحقًا.`,
    signedInAs: `تم الدخول بواسطة`,
    activeWorkspace: `مساحة العمل الحالية`,
    yourRole: `صلاحيتك`,
    totalBranches: `إجمالي الفروع`,
    registeredBranches: `فروع الشركة المسجلة`,
    activeBranches: `الفروع الفعّالة`,
    availableForAssignment: `متاحة لربط الموظفين`,
    activeLocations: `المواقع الفعّالة`,
    workplaces: `أماكن عمل الموظفين`,
    readOnlyTitle: `صلاحية عرض فقط`,
    readOnlyCopy: `يمكن لـSuper Admin وHR Admin فقط تعديل هيكل الشركة.`,
    companyStructure: `هيكل الشركة`,
    branches: `الفروع`,
    addBranch: `إضافة فرع`,
    branchesDescription: `وحدات الشركة القانونية أو التشغيلية المستخدمة لتنظيم الموظفين والتقارير.`,
    workplacesLabel: `أماكن العمل الفعلية`,
    locations: `مواقع العمل`,
    addLocation: `إضافة موقع`,
    locationsDescription: `المكاتب أو المستودعات أو المتاجر أو المواقع المرتبطة بأحد فروع الشركة.`,
    noBranchesTitle: `لا توجد فروع`,
    noBranchesCopy: `أنشئ الفرع الأول قبل إضافة مواقع العمل.`,
    noLocationsTitle: `لا توجد مواقع عمل`,
    noLocationsCopy: `يمكن إضافة المواقع بعد إنشاء أول فرع.`,
    createBranch: `إنشاء فرع`,
    editBranch: `تعديل الفرع`,
    branchCode: `رمز الفرع`,
    codeHelp: `من 2 إلى 20 حرفًا إنجليزيًا أو رقمًا أو شرطة. لا يمكن تغيير الرمز لاحقًا.`,
    nameEn: `الاسم بالإنجليزية`,
    nameAr: `الاسم بالعربية`,
    cancel: `إلغاء`,
    saveBranch: `حفظ الفرع`,
    createLocation: `إنشاء موقع عمل`,
    editLocation: `تعديل موقع العمل`,
    locationCode: `رمز الموقع`,
    parentBranch: `الفرع التابع له`,
    selectBranch: `اختر الفرع`,
    city: `المدينة`,
    address: `العنوان`,
    saveLocation: `حفظ الموقع`,
    active: `فعّال`,
    inactive: `غير فعّال`,
    edit: `تعديل`,
    locationsCount: `مواقع العمل: {count}`,
    requiredField: `هذا الحقل مطلوب.`,
    invalidCode: `استخدم من 2 إلى 20 حرفًا إنجليزيًا أو رقمًا أو شرطة.`,
    duplicateBranch: `يوجد فرع مسجل بهذا الرمز.`,
    duplicateLocation: `يوجد موقع عمل مسجل بهذا الرمز.`,
    createBranchFirst: `أنشئ فرعًا فعّالًا قبل إضافة موقع عمل.`,
    activeBranchRequired: `اختر فرعًا فعّالًا لهذا الموقع.`,
    branchCreated: `تم إنشاء الفرع بنجاح.`,
    branchUpdated: `تم تحديث الفرع بنجاح.`,
    locationCreated: `تم إنشاء موقع العمل بنجاح.`,
    locationUpdated: `تم تحديث موقع العمل بنجاح.`,
    branchStatusUpdated: `تم تحديث حالة الفرع وتعطيل مواقعه الفعّالة عند الحاجة.`,
    locationStatusUpdated: `تم تحديث حالة موقع العمل.`,
    confirmDisableBranch: `هل تريد تعطيل هذا الفرع؟ سيتم أيضًا تعطيل جميع مواقعه الفعّالة.`,
    confirmEnableBranch: `هل تريد تفعيل هذا الفرع؟ ستبقى حالات مواقعه كما هي.`,
    confirmDisableLocation: `هل تريد تعطيل موقع العمل هذا؟`,
    confirmEnableLocation: `هل تريد تفعيل موقع العمل هذا؟`,
    tooManyLocations: `يحتوي الفرع على عدد كبير من المواقع لتحديثها بعملية آمنة واحدة. لم يتم إجراء أي تغيير.`,
    permissionTitle: `الدخول غير مسموح`,
    permissionCopy: `لا يملك حسابك عضوية فعّالة في هذه الشركة، أو أن قواعد Firestore المطلوبة غير منشورة.`,
    databaseTitle: `Firestore غير متاح`,
    databaseCopy: `تعذر الوصول إلى قاعدة Firestore المحددة. تحقق من القاعدة والقواعد المنشورة.`,
    genericTitle: `تعذر تحميل الهيكل`,
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
  structureWorkspace: document.querySelector(`#structureWorkspace`),
  companyMonogram: document.querySelector(`#companyMonogram`),
  companyName: document.querySelector(`#companyName`),
  companyRegion: document.querySelector(`#companyRegion`),
  currentRole: document.querySelector(`#currentRole`),
  totalBranches: document.querySelector(`#totalBranches`),
  activeBranches: document.querySelector(`#activeBranches`),
  activeLocations: document.querySelector(`#activeLocations`),
  readOnlyBanner: document.querySelector(`#readOnlyBanner`),
  addBranchButton: document.querySelector(`#addBranchButton`),
  addLocationButton: document.querySelector(`#addLocationButton`),
  branchesList: document.querySelector(`#branchesList`),
  branchesEmpty: document.querySelector(`#branchesEmpty`),
  locationsList: document.querySelector(`#locationsList`),
  locationsEmpty: document.querySelector(`#locationsEmpty`),
  branchModal: document.querySelector(`#branchModal`),
  branchModalTitle: document.querySelector(`#branchModalTitle`),
  branchForm: document.querySelector(`#branchForm`),
  branchCode: document.querySelector(`#branchCode`),
  branchNameEn: document.querySelector(`#branchNameEn`),
  branchNameAr: document.querySelector(`#branchNameAr`),
  saveBranchButton: document.querySelector(`#saveBranchButton`),
  locationModal: document.querySelector(`#locationModal`),
  locationModalTitle: document.querySelector(`#locationModalTitle`),
  locationForm: document.querySelector(`#locationForm`),
  locationCode: document.querySelector(`#locationCode`),
  locationBranch: document.querySelector(`#locationBranch`),
  locationNameEn: document.querySelector(`#locationNameEn`),
  locationNameAr: document.querySelector(`#locationNameAr`),
  locationCity: document.querySelector(`#locationCity`),
  locationAddress: document.querySelector(`#locationAddress`),
  saveLocationButton: document.querySelector(`#saveLocationButton`),
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
  currentLanguage: null,
  editingBranchId: null,
  editingLocationId: null,
  toastTimer: null,
  bootstrapped: false,
  mutating: false
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

const branchPath = branchId => doc(
  db,
  `nasna_companies`,
  state.companyId,
  `branches`,
  branchId
);

const locationPath = locationId => doc(
  db,
  `nasna_companies`,
  state.companyId,
  `locations`,
  locationId
);

const auditPath = () => doc(collection(
  db,
  `nasna_companies`,
  state.companyId,
  `auditLogs`
));

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

const branchLocationCount = branchId => (
  state.locations.filter(location => location.branchId === branchId).length
);

const branchActions = branch => {
  if (!isAdmin()) return ``;
  const inactive = branch.status === `inactive`;
  return `
    <div class="row-actions">
      <button class="row-action" data-action="edit-branch" data-id="${escapeHtml(branch.id)}" type="button" title="${escapeHtml(translate(`edit`))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"/><path d="m14 7.5 2.5 2.5"/></svg>
      </button>
      <button class="row-action row-action--status${inactive ? ` is-inactive` : ``}" data-action="toggle-branch" data-id="${escapeHtml(branch.id)}" type="button">
        ${escapeHtml(translate(inactive ? `inactive` : `active`))}
      </button>
    </div>
  `;
};

const locationActions = location => {
  if (!isAdmin()) return ``;
  const inactive = location.status === `inactive`;
  return `
    <div class="row-actions">
      <button class="row-action" data-action="edit-location" data-id="${escapeHtml(location.id)}" type="button" title="${escapeHtml(translate(`edit`))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"/><path d="m14 7.5 2.5 2.5"/></svg>
      </button>
      <button class="row-action row-action--status${inactive ? ` is-inactive` : ``}" data-action="toggle-location" data-id="${escapeHtml(location.id)}" type="button">
        ${escapeHtml(translate(inactive ? `inactive` : `active`))}
      </button>
    </div>
  `;
};

const renderBranches = () => {
  const branches = sortLocalized(state.branches);
  elements.branchesEmpty.hidden = branches.length > 0;
  elements.branchesList.innerHTML = branches.map(branch => {
    const inactive = branch.status === `inactive`;
    const secondaryName = state.currentLanguage === `ar` ? branch.nameEn : branch.nameAr;
    return `
      <article class="structure-row${inactive ? ` is-inactive` : ``}">
        <div class="row-main">
          <span class="row-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12M8 11h2m4 0h2M8 15h2m4 0h2M3 20h18"/></svg>
          </span>
          <div class="row-copy">
            <span class="code-chip">${escapeHtml(branch.code)}</span>
            <strong>${escapeHtml(localizedName(branch))}</strong>
            ${secondaryName ? `<small dir="auto">${escapeHtml(secondaryName)}</small>` : ``}
            <small>${escapeHtml(translate(`locationsCount`, { count: branchLocationCount(branch.id) }))}</small>
          </div>
        </div>
        ${branchActions(branch)}
      </article>
    `;
  }).join(``);
};

const renderLocations = () => {
  const locations = sortLocalized(state.locations);
  const branchesById = new Map(state.branches.map(branch => [branch.id, branch]));
  elements.locationsEmpty.hidden = locations.length > 0;
  elements.locationsList.innerHTML = locations.map(location => {
    const inactive = location.status === `inactive`;
    const branch = branchesById.get(location.branchId);
    const address = [location.city, location.address].filter(Boolean).join(` · `);
    return `
      <article class="structure-row${inactive ? ` is-inactive` : ``}">
        <div class="row-main">
          <span class="row-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          </span>
          <div class="row-copy">
            <span class="code-chip">${escapeHtml(location.code)}</span>
            <strong>${escapeHtml(localizedName(location))}</strong>
            <div class="row-location-meta">
              <span dir="auto">${escapeHtml(localizedName(branch) || location.branchId)}</span>
              ${address ? `<span dir="auto">${escapeHtml(address)}</span>` : ``}
            </div>
          </div>
        </div>
        ${locationActions(location)}
      </article>
    `;
  }).join(``);
};

const renderStatistics = () => {
  elements.totalBranches.textContent = String(state.branches.length);
  elements.activeBranches.textContent = String(
    state.branches.filter(branch => branch.status === `active`).length
  );
  elements.activeLocations.textContent = String(
    state.locations.filter(location => location.status === `active`).length
  );
};

const renderPermissions = () => {
  const editable = isAdmin();
  elements.addBranchButton.hidden = !editable;
  elements.addLocationButton.hidden = !editable;
  elements.readOnlyBanner.hidden = editable;
};

const renderAll = () => {
  renderCompanyContext();
  renderStatistics();
  renderPermissions();
  renderBranches();
  renderLocations();
};

const setLanguage = language => {
  state.currentLanguage = language;
  safeStorage.set(languageKey, language);
  auth.languageCode = language;
  elements.documentElement.lang = language;
  elements.documentElement.dir = language === `ar` ? `rtl` : `ltr`;
  document.title = language === `ar`
    ? `الفروع ومواقع العمل | ناسنا`
    : `Branches & Locations | NASNA`;

  document.querySelectorAll(`[data-i18n]`).forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  elements.languageLabel.textContent = translate(`language`);

  if (state.company) renderAll();
  if (!elements.branchModal.hidden) {
    elements.branchModalTitle.textContent = translate(
      state.editingBranchId ? `editBranch` : `createBranch`
    );
  }
  if (!elements.locationModal.hidden) {
    elements.locationModalTitle.textContent = translate(
      state.editingLocationId ? `editLocation` : `createLocation`
    );
    renderBranchOptions(elements.locationBranch.value);
  }
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
  elements.structureWorkspace.hidden = true;
  revealApplication();
};

const loadStructureData = async () => {
  const [branchesSnapshot, locationsSnapshot] = await Promise.all([
    getDocs(collection(db, `nasna_companies`, state.companyId, `branches`)),
    getDocs(collection(db, `nasna_companies`, state.companyId, `locations`))
  ]);

  state.branches = branchesSnapshot.docs.map(snapshot => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
  state.locations = locationsSnapshot.docs.map(snapshot => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
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

  await loadStructureData();
  elements.systemState.hidden = true;
  elements.structureWorkspace.hidden = false;
  renderAll();
  revealApplication();
};

const bootstrap = async user => {
  if (state.bootstrapped) return;
  state.bootstrapped = true;
  state.user = user;

  try {
    await loadWorkspace();
  } catch (error) {
    console.error(`NASNA structure loading error.`, error);
    showSystemState(error);
  }
};

const closeModal = modalName => {
  const modal = modalName === `branch` ? elements.branchModal : elements.locationModal;
  modal.hidden = true;
  document.body.style.overflow = ``;
};

const openBranchModal = (branchId = null) => {
  if (!isAdmin()) return;
  const branch = branchId
    ? state.branches.find(item => item.id === branchId)
    : null;
  if (branchId && !branch) return;

  state.editingBranchId = branch?.id || null;
  elements.branchForm.reset();
  clearFormErrors(elements.branchForm);
  elements.branchCode.disabled = Boolean(branch);
  elements.branchCode.value = branch?.code || ``;
  elements.branchNameEn.value = branch?.nameEn || ``;
  elements.branchNameAr.value = branch?.nameAr || ``;
  elements.branchModalTitle.textContent = translate(branch ? `editBranch` : `createBranch`);
  elements.branchModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => {
    (branch ? elements.branchNameEn : elements.branchCode).focus();
  }, 0);
};

const renderBranchOptions = selectedBranchId => {
  const selected = selectedBranchId || ``;
  const options = sortLocalized(state.branches)
    .filter(branch => branch.status === `active` || branch.id === selected)
    .map(branch => {
      const isSelected = branch.id === selected ? ` selected` : ``;
      const isDisabled = branch.status !== `active` && branch.id !== selected ? ` disabled` : ``;
      return `<option value="${escapeHtml(branch.id)}"${isSelected}${isDisabled}>${escapeHtml(branch.code)} — ${escapeHtml(localizedName(branch))}</option>`;
    })
    .join(``);

  elements.locationBranch.innerHTML = `
    <option value="">${escapeHtml(translate(`selectBranch`))}</option>
    ${options}
  `;
};

const openLocationModal = (locationId = null) => {
  if (!isAdmin()) return;
  const activeBranches = state.branches.filter(branch => branch.status === `active`);
  const location = locationId
    ? state.locations.find(item => item.id === locationId)
    : null;

  if (!location && activeBranches.length === 0) {
    showToast(`createBranchFirst`, `error`);
    return;
  }
  if (locationId && !location) return;

  state.editingLocationId = location?.id || null;
  elements.locationForm.reset();
  clearFormErrors(elements.locationForm);
  elements.locationCode.disabled = Boolean(location);
  elements.locationCode.value = location?.code || ``;
  renderBranchOptions(location?.branchId || ``);
  elements.locationBranch.value = location?.branchId || ``;
  elements.locationNameEn.value = location?.nameEn || ``;
  elements.locationNameAr.value = location?.nameAr || ``;
  elements.locationCity.value = location?.city || ``;
  elements.locationAddress.value = location?.address || ``;
  elements.locationModalTitle.textContent = translate(location ? `editLocation` : `createLocation`);
  elements.locationModal.hidden = false;
  document.body.style.overflow = `hidden`;
  window.setTimeout(() => {
    (location ? elements.locationNameEn : elements.locationCode).focus();
  }, 0);
};

const branchFormValues = () => {
  const code = state.editingBranchId
    ? state.editingBranchId
    : validCodeValue(elements.branchCode);
  const nameEn = requiredValue(elements.branchNameEn);
  const nameAr = requiredValue(elements.branchNameAr);
  if (!code || !nameEn || !nameAr) return null;
  return { code, nameEn, nameAr };
};

const locationFormValues = () => {
  const code = state.editingLocationId
    ? state.editingLocationId
    : validCodeValue(elements.locationCode);
  const branchId = requiredValue(elements.locationBranch);
  const nameEn = requiredValue(elements.locationNameEn);
  const nameAr = requiredValue(elements.locationNameAr);
  const city = requiredValue(elements.locationCity);
  const address = elements.locationAddress.value.trim();
  const branch = state.branches.find(item => item.id === branchId);

  if (branchId && (!branch || branch.status !== `active`)) {
    fieldError(elements.locationBranch, `activeBranchRequired`);
  }

  if (!code || !branchId || !nameEn || !nameAr || !city || !branch || branch.status !== `active`) {
    return null;
  }

  return { code, branchId, nameEn, nameAr, city, address };
};

const handleBranchSubmit = async event => {
  event.preventDefault();
  if (!isAdmin() || state.mutating) return;
  const values = branchFormValues();
  if (!values) return;

  setButtonLoading(elements.saveBranchButton, true);
  state.mutating = true;

  try {
    const editing = Boolean(state.editingBranchId);
    const reference = branchPath(values.code);

    if (!editing) {
      const existing = await getDoc(reference);
      if (existing.exists()) {
        fieldError(elements.branchCode, `duplicateBranch`);
        return;
      }
    }

    const batch = writeBatch(db);
    if (editing) {
      batch.update(reference, {
        nameEn: values.nameEn,
        nameAr: values.nameAr,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    } else {
      batch.set(reference, {
        id: values.code,
        companyId: state.companyId,
        code: values.code,
        nameEn: values.nameEn,
        nameAr: values.nameAr,
        status: `active`,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    }
    batch.set(auditPath(), auditRecord(
      editing ? `branch.updated` : `branch.created`,
      values.code,
      { code: values.code, nameEn: values.nameEn, nameAr: values.nameAr }
    ));

    await batch.commit();
    await loadStructureData();
    renderAll();
    closeModal(`branch`);
    showToast(editing ? `branchUpdated` : `branchCreated`, `success`);
  } catch (error) {
    console.error(`NASNA branch save error.`, error);
    showToast(firebaseMessageKey(error), `error`);
  } finally {
    state.mutating = false;
    setButtonLoading(elements.saveBranchButton, false);
  }
};

const handleLocationSubmit = async event => {
  event.preventDefault();
  if (!isAdmin() || state.mutating) return;
  const values = locationFormValues();
  if (!values) return;

  setButtonLoading(elements.saveLocationButton, true);
  state.mutating = true;

  try {
    const editing = Boolean(state.editingLocationId);
    const reference = locationPath(values.code);

    if (!editing) {
      const existing = await getDoc(reference);
      if (existing.exists()) {
        fieldError(elements.locationCode, `duplicateLocation`);
        return;
      }
    }

    const batch = writeBatch(db);
    const sharedValues = {
      branchId: values.branchId,
      nameEn: values.nameEn,
      nameAr: values.nameAr,
      city: values.city,
      address: values.address,
      timezone: state.company?.timezone || `Asia/Amman`,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    };

    if (editing) {
      batch.update(reference, sharedValues);
    } else {
      batch.set(reference, {
        id: values.code,
        companyId: state.companyId,
        code: values.code,
        ...sharedValues,
        status: `active`,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
    }
    batch.set(auditPath(), auditRecord(
      editing ? `location.updated` : `location.created`,
      values.code,
      {
        code: values.code,
        branchId: values.branchId,
        nameEn: values.nameEn,
        nameAr: values.nameAr
      }
    ));

    await batch.commit();
    await loadStructureData();
    renderAll();
    closeModal(`location`);
    showToast(editing ? `locationUpdated` : `locationCreated`, `success`);
  } catch (error) {
    console.error(`NASNA location save error.`, error);
    showToast(firebaseMessageKey(error), `error`);
  } finally {
    state.mutating = false;
    setButtonLoading(elements.saveLocationButton, false);
  }
};

const toggleBranchStatus = async branchId => {
  if (!isAdmin() || state.mutating) return;
  const branch = state.branches.find(item => item.id === branchId);
  if (!branch || !validStatuses.has(branch.status)) return;

  const targetStatus = branch.status === `active` ? `inactive` : `active`;
  const confirmationKey = targetStatus === `inactive`
    ? `confirmDisableBranch`
    : `confirmEnableBranch`;
  if (!window.confirm(translate(confirmationKey))) return;

  const affectedLocations = targetStatus === `inactive`
    ? state.locations.filter(location => (
      location.branchId === branchId && location.status === `active`
    ))
    : [];

  if (affectedLocations.length > 450) {
    showToast(`tooManyLocations`, `error`);
    return;
  }

  setMutationLock(true);

  try {
    const batch = writeBatch(db);
    batch.update(branchPath(branchId), {
      status: targetStatus,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    affectedLocations.forEach(location => {
      batch.update(locationPath(location.id), {
        status: `inactive`,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    batch.set(auditPath(), auditRecord(`branch.status_changed`, branchId, {
      from: branch.status,
      to: targetStatus,
      disabledLocations: affectedLocations.length
    }));

    await batch.commit();
    await loadStructureData();
    renderAll();
    showToast(`branchStatusUpdated`, `success`);
  } catch (error) {
    console.error(`NASNA branch status error.`, error);
    showToast(firebaseMessageKey(error), `error`);
    renderAll();
  } finally {
    setMutationLock(false);
  }
};

const toggleLocationStatus = async locationId => {
  if (!isAdmin() || state.mutating) return;
  const location = state.locations.find(item => item.id === locationId);
  if (!location || !validStatuses.has(location.status)) return;

  const targetStatus = location.status === `active` ? `inactive` : `active`;
  const branch = state.branches.find(item => item.id === location.branchId);
  if (targetStatus === `active` && branch?.status !== `active`) {
    showToast(`activeBranchRequired`, `error`);
    return;
  }

  const confirmationKey = targetStatus === `inactive`
    ? `confirmDisableLocation`
    : `confirmEnableLocation`;
  if (!window.confirm(translate(confirmationKey))) return;

  setMutationLock(true);

  try {
    const batch = writeBatch(db);
    batch.update(locationPath(locationId), {
      status: targetStatus,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    batch.set(auditPath(), auditRecord(`location.status_changed`, locationId, {
      from: location.status,
      to: targetStatus,
      branchId: location.branchId
    }));

    await batch.commit();
    await loadStructureData();
    renderAll();
    showToast(`locationStatusUpdated`, `success`);
  } catch (error) {
    console.error(`NASNA location status error.`, error);
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

  if (action === `edit-branch`) openBranchModal(id);
  if (action === `toggle-branch`) toggleBranchStatus(id);
  if (action === `edit-location`) openLocationModal(id);
  if (action === `toggle-location`) toggleLocationStatus(id);
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
elements.retryButton.addEventListener(`click`, () => window.location.reload());
elements.addBranchButton.addEventListener(`click`, () => openBranchModal());
elements.addLocationButton.addEventListener(`click`, () => openLocationModal());
elements.branchForm.addEventListener(`submit`, handleBranchSubmit);
elements.locationForm.addEventListener(`submit`, handleLocationSubmit);
elements.branchesList.addEventListener(`click`, handleListAction);
elements.locationsList.addEventListener(`click`, handleListAction);

document.querySelectorAll(`[data-close-modal]`).forEach(button => {
  button.addEventListener(`click`, () => closeModal(button.dataset.closeModal));
});

[elements.branchCode, elements.locationCode].forEach(field => {
  field.addEventListener(`input`, () => {
    field.value = normalizeCode(field.value);
    if (field.classList.contains(`is-invalid`)) validCodeValue(field);
  });
});

document.addEventListener(`keydown`, event => {
  if (event.key !== `Escape`) return;
  if (!elements.locationModal.hidden) {
    closeModal(`location`);
  } else if (!elements.branchModal.hidden) {
    closeModal(`branch`);
  }
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
