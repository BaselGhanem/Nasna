import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { auth } from "./firebase-config.js?v=20260726.4";
import { db } from "./firestore-config.js?v=20260726.4";

const release = `20260726.4`;
const adminRoles = new Set([`super_admin`, `hr_admin`]);
const terminalStatuses = new Set([
  `COMPLETED`,
  `REJECTED`,
  `WITHDRAWN`,
  `CANCELLED`
]);

const state = {
  user: null,
  profile: null,
  companyId: ``,
  company: null,
  membership: null,
  ownEmployee: null,
  employees: [],
  members: [],
  configurationTypes: [],
  workflowDrafts: [],
  requestTypes: [],
  workflows: []
};

const field = (key, type, labelEn, labelAr, options = {}) => ({
  key,
  type,
  labelEn,
  labelAr,
  required: Boolean(options.required),
  sensitive: Boolean(options.sensitive),
  placeholderEn: options.placeholderEn || ``,
  placeholderAr: options.placeholderAr || ``,
  choices: options.choices || []
});

const choice = (value, labelEn, labelAr) => ({ value, labelEn, labelAr });

const defaultDefinitions = [
  {
    code: `general_hr`,
    pilotDefault: true,
    nameEn: `General HR request`,
    nameAr: `طلب عام للموارد البشرية`,
    descriptionEn: `Ask HR for support through a tracked, auditable request.`,
    descriptionAr: `اطلب مساعدة الموارد البشرية ضمن طلب واضح وقابل للتتبع.`,
    category: `general`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    slaHours: 72,
    fields: [
      field(`subject`, `text`, `Request subject`, `موضوع الطلب`, { required: true }),
      field(`details`, `textarea`, `Details`, `التفاصيل`, { required: true })
    ],
    steps: [
      { type: `approval`, resolver: `direct_manager`, mode: `sequential`, slaHours: 24, nameEn: `Manager approval`, nameAr: `موافقة المدير` },
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 48, nameEn: `HR fulfillment`, nameAr: `تنفيذ الموارد البشرية` }
    ]
  },
  {
    code: `contact_update`,
    nameEn: `Update contact details`,
    nameAr: `تحديث بيانات الاتصال`,
    descriptionEn: `Request an audited update to work or personal contact information.`,
    descriptionAr: `اطلب تحديث بيانات الاتصال الوظيفية أو الشخصية بسجل تدقيق.`,
    category: `personal_data`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `hr`,
    slaHours: 24,
    fields: [
      field(`workPhone`, `tel`, `Work phone`, `هاتف العمل`),
      field(`personalEmail`, `email`, `Personal email`, `البريد الشخصي`, { sensitive: true }),
      field(`personalPhone`, `tel`, `Personal phone`, `الهاتف الشخصي`, { sensitive: true }),
      field(`address`, `textarea`, `Address`, `العنوان`, { sensitive: true })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 24, nameEn: `HR verification & update`, nameAr: `تحقق وتحديث الموارد البشرية` }
    ]
  },
  {
    code: `sensitive_data_update`,
    nameEn: `Update sensitive information`,
    nameAr: `تحديث بيانات حساسة`,
    descriptionEn: `Send protected identity or emergency-data changes directly to HR.`,
    descriptionAr: `أرسل تعديلات الهوية أو بيانات الطوارئ المحمية مباشرة إلى الموارد البشرية.`,
    category: `personal_data`,
    confidentiality: `restricted`,
    subjectMode: `self`,
    initialResolver: `hr`,
    slaHours: 48,
    fields: [
      field(`nationalId`, `text`, `National ID`, `الرقم الوطني`, { sensitive: true }),
      field(`dateOfBirth`, `date`, `Date of birth`, `تاريخ الميلاد`, { sensitive: true }),
      field(`nationality`, `text`, `Nationality`, `الجنسية`, { sensitive: true }),
      field(`emergencyContactName`, `text`, `Emergency contact`, `اسم جهة اتصال الطوارئ`, { sensitive: true }),
      field(`emergencyContactPhone`, `tel`, `Emergency phone`, `هاتف الطوارئ`, { sensitive: true }),
      field(`reason`, `textarea`, `Reason for change`, `سبب التعديل`, { required: true, sensitive: true })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 48, nameEn: `Restricted HR review`, nameAr: `مراجعة موارد بشرية مقيّدة` }
    ]
  },
  {
    code: `document_renewal`,
    nameEn: `Renew an employee document`,
    nameAr: `تجديد وثيقة موظف`,
    descriptionEn: `Submit replacement document details for HR verification and versioning.`,
    descriptionAr: `أرسل بيانات الوثيقة البديلة ليتحقق منها HR ويحفظها كنسخة جديدة.`,
    category: `documents`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `hr`,
    slaHours: 72,
    fields: [
      field(`documentType`, `select`, `Document type`, `نوع الوثيقة`, {
        required: true,
        choices: [
          choice(`national_id`, `National ID`, `هوية شخصية`),
          choice(`passport`, `Passport`, `جواز سفر`),
          choice(`work_permit`, `Work permit`, `تصريح عمل`),
          choice(`insurance`, `Insurance`, `تأمين`),
          choice(`certificate`, `Certificate`, `شهادة`),
          choice(`other`, `Other`, `أخرى`)
        ]
      }),
      field(`title`, `text`, `Document title`, `اسم الوثيقة`, { required: true }),
      field(`documentNumber`, `text`, `Document number`, `رقم الوثيقة`),
      field(`issueDate`, `date`, `Issue date`, `تاريخ الإصدار`),
      field(`expiryDate`, `date`, `Expiry date`, `تاريخ الانتهاء`),
      field(`linkUrl`, `url`, `Secure document link`, `رابط الوثيقة الآمن`, { required: true }),
      field(`previousDocumentId`, `text`, `Previous document ID`, `معرّف الوثيقة السابقة`),
      field(`visibility`, `select`, `Visibility`, `الظهور`, {
        required: true,
        choices: [
          choice(`employee`, `Employee & HR`, `الموظف وHR`),
          choice(`hr_only`, `HR only`, `HR فقط`)
        ]
      })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 72, nameEn: `Document verification`, nameAr: `التحقق من الوثيقة` }
    ]
  },
  {
    code: `letter_certificate`,
    nameEn: `Letter or certificate`,
    nameAr: `كتاب أو شهادة`,
    descriptionEn: `Request an employment letter, salary certificate, or custom HR letter.`,
    descriptionAr: `اطلب كتاب عمل أو شهادة راتب أو كتاب موارد بشرية مخصص.`,
    category: `documents`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    slaHours: 72,
    fields: [
      field(`letterType`, `select`, `Letter type`, `نوع الكتاب`, {
        required: true,
        choices: [
          choice(`employment`, `Employment letter`, `كتاب عمل`),
          choice(`salary`, `Salary certificate`, `شهادة راتب`),
          choice(`experience`, `Experience certificate`, `شهادة خبرة`),
          choice(`custom`, `Custom letter`, `كتاب مخصص`)
        ]
      }),
      field(`language`, `select`, `Language`, `اللغة`, {
        required: true,
        choices: [
          choice(`ar`, `Arabic`, `العربية`),
          choice(`en`, `English`, `الإنجليزية`),
          choice(`both`, `Arabic & English`, `العربية والإنجليزية`)
        ]
      }),
      field(`recipient`, `text`, `Addressed to`, `الجهة الموجّه إليها`),
      field(`notes`, `textarea`, `Notes`, `ملاحظات`)
    ],
    steps: [
      { type: `approval`, resolver: `direct_manager`, mode: `sequential`, slaHours: 24, nameEn: `Manager approval`, nameAr: `موافقة المدير` },
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 48, nameEn: `HR issuance`, nameAr: `إصدار HR` }
    ]
  },
  {
    code: `confidential_request`,
    nameEn: `Confidential HR request`,
    nameAr: `طلب سري للموارد البشرية`,
    descriptionEn: `A restricted channel visible only to you and authorized HR staff.`,
    descriptionAr: `قناة مقيّدة لا يراها إلا أنت وموظفو HR المخولون.`,
    category: `confidential`,
    confidentiality: `restricted`,
    subjectMode: `self`,
    initialResolver: `hr`,
    slaHours: 24,
    fields: [
      field(`subject`, `text`, `Confidential subject`, `موضوع الطلب السري`, { required: true, sensitive: true }),
      field(`details`, `textarea`, `Confidential details`, `التفاصيل السرية`, { required: true, sensitive: true })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 24, nameEn: `Restricted HR handling`, nameAr: `معالجة HR المقيّدة` }
    ]
  },
  {
    code: `team_movement`,
    nameEn: `Team movement request`,
    nameAr: `طلب حركة لأحد أفراد الفريق`,
    descriptionEn: `Managers propose a change for a direct report; HR alone applies it.`,
    descriptionAr: `يقترح المدير تغييرًا لموظف يتبع له، وHR وحده ينفّذه.`,
    category: `team`,
    confidentiality: `normal`,
    subjectMode: `direct_report`,
    initialResolver: `hr`,
    slaHours: 72,
    fields: [
      field(`movementType`, `select`, `Movement type`, `نوع الحركة`, {
        required: true,
        choices: [
          choice(`transfer`, `Transfer`, `نقل`),
          choice(`promotion`, `Promotion`, `ترقية`),
          choice(`reassignment`, `Reassignment`, `إعادة تعيين`),
          choice(`manager_change`, `Manager change`, `تغيير المدير`),
          choice(`employment_change`, `Employment type change`, `تغيير نوع التوظيف`),
          choice(`status_change`, `Status change`, `تغيير الحالة`),
          choice(`work_mode_change`, `Work-mode change`, `تغيير نمط العمل`)
        ]
      }),
      field(`effectiveDate`, `date`, `Effective date`, `تاريخ السريان`, { required: true }),
      field(`newPositionId`, `text`, `New position code`, `رمز المنصب الجديد`),
      field(`newManagerEmployeeId`, `text`, `New manager employee code`, `رمز المدير الجديد`),
      field(`newEmploymentType`, `select`, `New employment type`, `نوع التوظيف الجديد`, {
        choices: [
          choice(`permanent`, `Permanent`, `دائم`),
          choice(`fixed_term`, `Fixed term`, `محدد المدة`),
          choice(`part_time`, `Part time`, `دوام جزئي`),
          choice(`intern`, `Intern`, `متدرب`),
          choice(`consultant`, `Consultant`, `مستشار`)
        ]
      }),
      field(`newEmploymentStatus`, `select`, `New employment status`, `حالة العمل الجديدة`, {
        choices: [
          choice(`active`, `Active`, `فعال`),
          choice(`probation`, `Probation`, `تجربة`),
          choice(`leave`, `On leave`, `في إجازة`),
          choice(`suspended`, `Suspended`, `موقوف`)
        ]
      }),
      field(`newWorkMode`, `select`, `New work mode`, `نمط العمل الجديد`, {
        choices: [
          choice(`onsite`, `On-site`, `من الموقع`),
          choice(`hybrid`, `Hybrid`, `هجين`),
          choice(`remote`, `Remote`, `عن بُعد`)
        ]
      }),
      field(`reason`, `textarea`, `Business reason`, `سبب الحركة`, { required: true })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 72, nameEn: `HR review & effective action`, nameAr: `مراجعة HR والتنفيذ بتاريخ السريان` }
    ]
  },
  {
    code: `transaction_correction`,
    nameEn: `Correct an HR transaction`,
    nameAr: `تصحيح معاملة موارد بشرية`,
    descriptionEn: `Request a traceable correction to an existing HR transaction.`,
    descriptionAr: `اطلب تصحيحًا موثقًا لمعاملة موارد بشرية قائمة.`,
    category: `correction`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `hr`,
    slaHours: 48,
    fields: [
      field(`reference`, `text`, `Transaction reference`, `مرجع المعاملة`, { required: true }),
      field(`currentValue`, `textarea`, `Current information`, `المعلومات الحالية`, { required: true }),
      field(`requestedCorrection`, `textarea`, `Requested correction`, `التصحيح المطلوب`, { required: true })
    ],
    steps: [
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 48, nameEn: `HR correction review`, nameAr: `مراجعة التصحيح لدى HR` }
    ]
  },
  {
    code: `custom_company_request`,
    nameEn: `Company custom request`,
    nameAr: `طلب مخصص للشركة`,
    descriptionEn: `A flexible, versioned request for company-specific HR services.`,
    descriptionAr: `طلب مرن ومؤرشف لخدمات HR الخاصة بالشركة.`,
    category: `custom`,
    confidentiality: `normal`,
    subjectMode: `self`,
    initialResolver: `direct_manager`,
    slaHours: 96,
    fields: [
      field(`subject`, `text`, `Request subject`, `موضوع الطلب`, { required: true }),
      field(`details`, `textarea`, `Details`, `التفاصيل`, { required: true }),
      field(`referenceUrl`, `url`, `Reference link`, `رابط مرجعي`)
    ],
    steps: [
      { type: `approval`, resolver: `direct_manager`, mode: `sequential`, slaHours: 24, nameEn: `Manager approval`, nameAr: `موافقة المدير` },
      { type: `fulfillment`, resolver: `hr`, mode: `parallel_any`, slaHours: 72, nameEn: `HR fulfillment`, nameAr: `تنفيذ HR` }
    ]
  }
];

const companyCollection = name => collection(
  db,
  `nasna_companies`,
  state.companyId,
  name
);

const companyDoc = (name, id) => doc(
  db,
  `nasna_companies`,
  state.companyId,
  name,
  id
);

const requestChildDoc = (requestId, name, id) => doc(
  db,
  `nasna_companies`,
  state.companyId,
  `requests`,
  requestId,
  name,
  id
);

const snapshotRows = snapshot => snapshot.docs.map(item => ({
  id: item.id,
  ...item.data()
}));

const toDate = value => {
  if (!value) return null;
  if (typeof value.toDate === `function`) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timestampFromInput = value => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
};

const dateInputValue = value => {
  const date = toDate(value);
  if (!date) return ``;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, `0`);
  const day = String(date.getDate()).padStart(2, `0`);
  return `${year}-${month}-${day}`;
};

const roleLabel = role => ({
  super_admin: `Super Admin`,
  hr_admin: `HR Admin`,
  manager: `Manager`,
  employee: `Employee`
}[role] || role || `Employee`);

const isAdmin = () => adminRoles.has(state.membership?.role);
const isManager = () => Boolean(
  state.membership?.role === `manager`
  || state.membership?.isManager
  || state.employees.some(employee => (
    employee.managerEmployeeId === state.ownEmployee?.id
    && employee.employmentStatus !== `suspended`
  ))
);

const loadSession = async user => {
  const profileSnapshot = await getDoc(doc(db, `nasna_users`, user.uid));
  if (!profileSnapshot.exists()) throw new Error(`profile-missing`);
  const profile = profileSnapshot.data();
  if (profile.status !== `active` || !profile.activeCompanyId) {
    throw new Error(`access-disabled`);
  }

  const companyId = profile.activeCompanyId;
  const [companySnapshot, membershipSnapshot] = await Promise.all([
    getDoc(doc(db, `nasna_companies`, companyId)),
    getDoc(doc(db, `nasna_companies`, companyId, `members`, user.uid))
  ]);
  if (!companySnapshot.exists() || !membershipSnapshot.exists()) {
    throw new Error(`membership-missing`);
  }
  const membership = membershipSnapshot.data();
  if (membership.status !== `active`) throw new Error(`access-disabled`);

  state.user = user;
  state.profile = profile;
  state.companyId = companyId;
  state.company = companySnapshot.data();
  state.membership = membership;

  const [employeesSnapshot, membersSnapshot] = await Promise.all([
    getDocs(collection(db, `nasna_companies`, companyId, `employees`)),
    getDocs(collection(db, `nasna_companies`, companyId, `members`))
  ]);
  state.employees = snapshotRows(employeesSnapshot);
  state.members = snapshotRows(membersSnapshot).filter(member => member.status === `active`);
  state.ownEmployee = state.employees.find(employee => (
    employee.authUid === user.uid
    || employee.id === membership.employeeId
  )) || null;

  return state;
};

const ensureDefaultConfiguration = async () => {
  if (!isAdmin()) return false;
  const [existingTypesSnapshot, existingWorkflowsSnapshot] = await Promise.all([
    getDocs(companyCollection(`requestTypes`)),
    getDocs(companyCollection(`workflowDefinitions`))
  ]);
  const existingTypeIds = new Set(existingTypesSnapshot.docs.map(item => item.id));
  const existingWorkflowIds = new Set(existingWorkflowsSnapshot.docs.map(item => item.id));

  const batch = writeBatch(db);
  let pendingWrites = 0;
  defaultDefinitions
    .filter(definition => definition.pilotDefault === true)
    .forEach(definition => {
    const typeId = `${definition.code}__v1`;
    const workflowId = `${definition.code}__workflow_v1`;
    const steps = definition.steps.map((step, index) => ({
      ...step,
      index
    }));
    if (!existingWorkflowIds.has(workflowId)) {
      batch.set(companyDoc(`workflowDefinitions`, workflowId), {
        id: workflowId,
        companyId: state.companyId,
        requestTypeCode: definition.code,
        version: 1,
        steps,
        slaHours: definition.slaHours,
        status: `published`,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
      pendingWrites += 1;
    }
    if (!existingTypeIds.has(typeId)) {
      batch.set(companyDoc(`requestTypes`, typeId), {
        id: typeId,
        companyId: state.companyId,
        code: definition.code,
        version: 1,
        nameEn: definition.nameEn,
        nameAr: definition.nameAr,
        descriptionEn: definition.descriptionEn,
        descriptionAr: definition.descriptionAr,
        category: definition.category,
        confidentiality: definition.confidentiality,
        subjectMode: definition.subjectMode,
        initialResolver: definition.initialResolver,
        formSchema: definition.fields,
        workflowId,
        status: `published`,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
      pendingWrites += 1;
    }
  });
  if (!pendingWrites) return false;
  await batch.commit();
  return true;
};

const loadConfiguration = async () => {
  const typesSource = isAdmin()
    ? query(companyCollection(`requestTypes`), limit(200))
    : query(
        companyCollection(`requestTypes`),
        where(`status`, `==`, `published`),
        limit(200)
      );
  const configurationPromises = [
    getDocs(typesSource),
    getDocs(query(companyCollection(`workflowDefinitions`), limit(200)))
  ];
  if (isAdmin()) {
    configurationPromises.push(
      getDocs(query(companyCollection(`workflowDrafts`), limit(100)))
    );
  }
  const [
    typesSnapshot,
    workflowsSnapshot,
    draftsSnapshot
  ] = await Promise.all(configurationPromises);
  state.configurationTypes = snapshotRows(typesSnapshot)
    .sort((left, right) => (
      left.code.localeCompare(right.code)
      || Number(right.version || 0) - Number(left.version || 0)
    ));
  state.requestTypes = state.configurationTypes
    .filter(type => type.status === `published`)
    .sort((a, b) => a.code.localeCompare(b.code));
  state.workflows = snapshotRows(workflowsSnapshot)
    .filter(workflow => workflow.status === `published`);
  state.workflowDrafts = draftsSnapshot
    ? snapshotRows(draftsSnapshot).sort((left, right) => (
        (toDate(right.updatedAt)?.getTime() || 0)
        - (toDate(left.updatedAt)?.getTime() || 0)
      ))
    : [];
  return {
    requestTypes: state.requestTypes,
    workflows: state.workflows,
    configurationTypes: state.configurationTypes,
    workflowDrafts: state.workflowDrafts
  };
};

const configurationFieldTypes = new Set([
  `text`,
  `textarea`,
  `date`,
  `email`,
  `tel`,
  `url`
]);

const normalizeConfiguration = input => {
  const code = String(input.code || ``)
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, `_`)
    .replaceAll(/_+/g, `_`)
    .replaceAll(/^_+|_+$/g, ``);
  const nameEn = String(input.nameEn || ``).trim();
  const nameAr = String(input.nameAr || ``).trim();
  const descriptionEn = String(input.descriptionEn || ``).trim();
  const descriptionAr = String(input.descriptionAr || ``).trim();
  const category = String(input.category || `custom`);
  const confidentiality = input.confidentiality === `restricted`
    ? `restricted`
    : `normal`;
  const subjectMode = input.subjectMode === `direct_report`
    ? `direct_report`
    : `self`;
  const initialResolver = confidentiality === `restricted`
    ? `hr`
    : input.initialResolver === `hr`
      ? `hr`
      : `direct_manager`;
  const slaHours = Math.round(Number(input.slaHours || 24));
  const formSchema = (Array.isArray(input.formSchema) ? input.formSchema : [])
    .map(schemaField => ({
      key: String(schemaField.key || ``)
        .trim()
        .replaceAll(/[^a-zA-Z0-9_]/g, ``)
        .slice(0, 40),
      type: configurationFieldTypes.has(schemaField.type)
        ? schemaField.type
        : `text`,
      labelEn: String(schemaField.labelEn || ``).trim().slice(0, 120),
      labelAr: String(schemaField.labelAr || ``).trim().slice(0, 120),
      required: Boolean(schemaField.required),
      sensitive: confidentiality === `restricted`,
      placeholderEn: ``,
      placeholderAr: ``,
      choices: []
    }))
    .filter(schemaField => schemaField.key || schemaField.labelEn || schemaField.labelAr);

  if (!code.match(/^[a-z][a-z0-9_]{2,39}$/)) {
    throw new Error(`configuration-code-invalid`);
  }
  if (!nameEn || !nameAr || nameEn.length > 120 || nameAr.length > 120) {
    throw new Error(`configuration-name-required`);
  }
  if (descriptionEn.length > 500 || descriptionAr.length > 500) {
    throw new Error(`configuration-description-too-long`);
  }
  if (![
    `general`,
    `personal_data`,
    `documents`,
    `confidential`,
    `team`,
    `correction`,
    `custom`
  ].includes(category)) {
    throw new Error(`configuration-category-invalid`);
  }
  if (
    slaHours < 1
    || slaHours > 8760
    || (initialResolver === `direct_manager` && slaHours < 2)
  ) {
    throw new Error(`configuration-sla-invalid`);
  }
  if (!formSchema.length || formSchema.length > 30) {
    throw new Error(`configuration-field-required`);
  }
  const keys = formSchema.map(schemaField => schemaField.key);
  if (
    formSchema.some(schemaField => (
      !schemaField.key.match(/^[a-zA-Z][a-zA-Z0-9_]{1,39}$/)
      || !schemaField.labelEn
      || !schemaField.labelAr
    ))
    || new Set(keys).size !== keys.length
  ) {
    throw new Error(`configuration-field-invalid`);
  }

  return {
    code,
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    category,
    confidentiality,
    subjectMode,
    initialResolver,
    slaHours,
    formSchema
  };
};

const saveWorkflowDraft = async (input, draftId = ``) => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const configuration = normalizeConfiguration(input);
  const existingDraft = draftId
    ? state.workflowDrafts.find(draft => draft.id === draftId)
    : null;
  const id = existingDraft?.id || crypto.randomUUID();
  const reference = companyDoc(`workflowDrafts`, id);
  const common = {
    ...configuration,
    id,
    companyId: state.companyId,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  };
  if (existingDraft) {
    await updateDoc(reference, common);
  } else {
    const batch = writeBatch(db);
    batch.set(reference, {
      ...common,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
    await batch.commit();
  }
  return id;
};

const publishWorkflowDraft = async draftId => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const draftReference = companyDoc(`workflowDrafts`, draftId);
  const versionCounterReference = companyDoc(
    `requestCounters`,
    `workflow_${draftId}`
  );
  return runTransaction(db, async transaction => {
    const [draftSnapshot, counterSnapshot] = await Promise.all([
      transaction.get(draftReference),
      transaction.get(versionCounterReference)
    ]);
    if (!draftSnapshot.exists()) throw new Error(`configuration-draft-missing`);
    const draft = normalizeConfiguration(draftSnapshot.data());
    const knownVersion = state.configurationTypes
      .filter(type => type.code === draft.code)
      .reduce((maximum, type) => Math.max(maximum, Number(type.version || 0)), 0);
    const counterVersion = counterSnapshot.exists()
      ? Number(counterSnapshot.data().value || 0)
      : 0;
    const version = Math.max(knownVersion, counterVersion) + 1;
    const typeId = `${draft.code}__v${version}`;
    const workflowId = `${draft.code}__workflow_v${version}`;
    const typeReference = companyDoc(`requestTypes`, typeId);
    const workflowReference = companyDoc(`workflowDefinitions`, workflowId);
    const [typeSnapshot, workflowSnapshot] = await Promise.all([
      transaction.get(typeReference),
      transaction.get(workflowReference)
    ]);
    if (typeSnapshot.exists() || workflowSnapshot.exists()) {
      throw new Error(`configuration-version-conflict`);
    }

    const managerHours = Math.max(
      1,
      Math.min(draft.slaHours - 1, Math.round(draft.slaHours * 0.4))
    );
    const hrHours = draft.initialResolver === `direct_manager`
      ? Math.max(1, draft.slaHours - managerHours)
      : draft.slaHours;
    const steps = draft.initialResolver === `direct_manager`
      ? [
          {
            index: 0,
            type: `approval`,
            resolver: `direct_manager`,
            mode: `sequential`,
            slaHours: managerHours,
            nameEn: `Manager approval`,
            nameAr: `موافقة المدير`
          },
          {
            index: 1,
            type: `fulfillment`,
            resolver: `hr`,
            mode: `parallel_any`,
            slaHours: hrHours,
            nameEn: `HR fulfillment`,
            nameAr: `تنفيذ الموارد البشرية`
          }
        ]
      : [
          {
            index: 0,
            type: `fulfillment`,
            resolver: `hr`,
            mode: `parallel_any`,
            slaHours: hrHours,
            nameEn: `HR fulfillment`,
            nameAr: `تنفيذ الموارد البشرية`
          }
        ];

    transaction.set(workflowReference, {
      id: workflowId,
      companyId: state.companyId,
      requestTypeCode: draft.code,
      version,
      steps,
      slaHours: draft.slaHours,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
    transaction.set(typeReference, {
      id: typeId,
      companyId: state.companyId,
      code: draft.code,
      version,
      nameEn: draft.nameEn,
      nameAr: draft.nameAr,
      descriptionEn: draft.descriptionEn,
      descriptionAr: draft.descriptionAr,
      category: draft.category,
      confidentiality: draft.confidentiality,
      subjectMode: draft.subjectMode,
      initialResolver: draft.initialResolver,
      formSchema: draft.formSchema,
      workflowId,
      status: `published`,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
    state.configurationTypes
      .filter(type => type.code === draft.code && type.status === `published`)
      .forEach(type => {
        transaction.update(companyDoc(`requestTypes`, type.id), {
          status: `retired`,
          retiredAt: serverTimestamp(),
          retiredBy: state.user.uid
        });
      });
    transaction.set(versionCounterReference, {
      companyId: state.companyId,
      value: version,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    transaction.delete(draftReference);
    return typeId;
  });
};

const deleteWorkflowDraft = async draftId => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const batch = writeBatch(db);
  batch.delete(companyDoc(`workflowDrafts`, draftId));
  await batch.commit();
};

const retireRequestType = async typeId => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  await updateDoc(companyDoc(`requestTypes`, typeId), {
    status: `retired`,
    retiredAt: serverTimestamp(),
    retiredBy: state.user.uid
  });
};

const requestTypeById = id => (
  state.requestTypes.find(type => type.id === id)
  || state.configurationTypes.find(type => type.id === id)
  || null
);
const workflowById = id => state.workflows.find(workflow => workflow.id === id) || null;
const employeeById = id => state.employees.find(employee => employee.id === id) || null;
const memberByUid = uid => state.members.find(member => member.uid === uid) || null;

const activeHrMembers = excludedUid => state.members
  .filter(member => (
    adminRoles.has(member.role)
    && member.uid !== excludedUid
    && member.status === `active`
  ))
  .sort((left, right) => {
    const leftRank = left.role === `super_admin` ? 0 : 1;
    const rightRank = right.role === `super_admin` ? 0 : 1;
    return leftRank - rightRank || left.uid.localeCompare(right.uid);
  })
  .slice(0, 5);

const dueTimestamp = hours => Timestamp.fromDate(
  new Date(Date.now() + Number(hours || 24) * 60 * 60 * 1000)
);

const stepForResolver = (workflow, resolver, fallbackIndex = 0) => {
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  return steps.find(step => step.resolver === resolver)
    || steps[fallbackIndex]
    || {
      index: 0,
      type: resolver === `direct_manager` ? `approval` : `fulfillment`,
      resolver,
      mode: `sequential`,
      slaHours: Number(workflow?.slaHours || 24)
    };
};

const activeDelegationRoute = (managerMember, excludedUid) => {
  if (
    !managerMember?.activeDelegationId
    || !managerMember.activeDelegateUid
  ) {
    return null;
  }
  const startAt = toDate(managerMember.activeDelegationStartAt);
  const endAt = toDate(managerMember.activeDelegationEndAt);
  const now = Date.now();
  const delegate = memberByUid(managerMember.activeDelegateUid);
  if (
    !startAt
    || !endAt
    || startAt.getTime() > now
    || endAt.getTime() <= now
    || delegate?.status !== `active`
    || delegate.uid === excludedUid
  ) {
    return null;
  }
  return {
    id: managerMember.activeDelegationId,
    delegateUid: delegate.uid
  };
};

const resolveRoute = (requestType, requesterEmployee, workflow, excludedUid) => {
  if (!requesterEmployee) throw new Error(`employee-file-required`);
  const managerEmployee = requesterEmployee.managerEmployeeId
    ? employeeById(requesterEmployee.managerEmployeeId)
    : null;
  const managerMember = managerEmployee?.authUid
    ? memberByUid(managerEmployee.authUid)
    : null;
  if (
    requestType.initialResolver === `direct_manager`
    && managerEmployee?.authUid
    && managerEmployee.authUid !== excludedUid
    && employeeIsActive(managerEmployee)
    && managerMember?.status === `active`
  ) {
    const step = stepForResolver(workflow, `direct_manager`, 0);
    const delegation = activeDelegationRoute(managerMember, excludedUid);
    return {
      kind: `manager`,
      status: `PENDING_APPROVAL`,
      step,
      assignees: [
        delegation?.delegateUid || managerEmployee.authUid
      ],
      delegationId: delegation?.id || ``,
      originalAssignees: delegation
        ? [managerEmployee.authUid]
        : []
    };
  }

  const hrMembers = activeHrMembers(excludedUid);
  if (!hrMembers.length) throw new Error(`independent-hr-required`);
  const step = stepForResolver(workflow, `hr`, 0);
  return {
    kind: `hr`,
    status: `PENDING_FULFILLMENT`,
    step,
    assignees: step.mode === `parallel_any`
      ? hrMembers.map(member => member.uid)
      : [hrMembers[0].uid],
    delegationId: ``,
    originalAssignees: []
  };
};

const directReports = () => state.ownEmployee
  ? state.employees.filter(employee => (
      employee.managerEmployeeId === state.ownEmployee.id
      && employee.employmentStatus !== `suspended`
    ))
  : [];

const normalizePayload = (requestType, values) => {
  const payload = {};
  requestType.formSchema.forEach(schemaField => {
    const rawValue = values[schemaField.key];
    payload[schemaField.key] = typeof rawValue === `string`
      ? rawValue.trim()
      : rawValue ?? ``;
  });
  return payload;
};

const validatePayload = (requestType, payload) => {
  const missing = requestType.formSchema.find(schemaField => (
    schemaField.required
    && String(payload[schemaField.key] ?? ``).trim() === ``
  ));
  if (missing) {
    const error = new Error(`required-field`);
    error.fieldKey = missing.key;
    throw error;
  }
  if (
    requestType.code === `contact_update`
    && ![`workPhone`, `personalEmail`, `personalPhone`, `address`]
      .some(key => String(payload[key] || ``).trim())
  ) {
    throw new Error(`one-contact-field-required`);
  }
  if (
    requestType.code === `document_renewal`
    && payload.issueDate
    && payload.expiryDate
    && payload.expiryDate < payload.issueDate
  ) {
    throw new Error(`expiry-before-issue`);
  }
  return payload;
};

const requestNumberFor = (typeCode, year, sequence) => (
  `REQ-${String(typeCode || `HR`)
    .replaceAll(/[^a-z0-9]/gi, ``)
    .slice(0, 8)
    .toUpperCase()}-${year}-${String(sequence).padStart(6, `0`)}`
);

const eventRecord = (requestId, eventId, type, message, payload = {}) => ({
  id: eventId,
  companyId: state.companyId,
  requestId,
  actorUid: state.user.uid,
  actorName: state.ownEmployee?.fullNameEn || state.membership.displayName || state.user.email,
  actorRole: state.membership.role,
  type,
  message,
  payload,
  createdAt: serverTimestamp()
});

const taskRecord = (requestId, taskId, step, assigneeUid) => ({
  id: taskId,
  companyId: state.companyId,
  requestId,
  stepIndex: Number(step.index || 0),
  stepType: step.type,
  mode: step.mode || `sequential`,
  assigneeUid,
  assigneeRole: memberByUid(assigneeUid)?.role || `employee`,
  status: `PENDING`,
  decision: ``,
  note: ``,
  dueAt: dueTimestamp(step.slaHours),
  actedAt: null,
  createdAt: serverTimestamp(),
  createdBy: state.user.uid,
  updatedAt: serverTimestamp(),
  updatedBy: state.user.uid
});

const notificationRecord = ({
  id,
  requestId,
  recipientUid,
  kind,
  titleEn,
  titleAr,
  bodyEn,
  bodyAr,
  workspace = `requests`
}) => ({
  id,
  companyId: state.companyId,
  requestId,
  recipientUid,
  titleEn,
  titleAr,
  bodyEn,
  bodyAr,
  kind,
  href: `${workspace}.html?v=${release}&request=${encodeURIComponent(requestId)}`,
  readAt: null,
  createdAt: serverTimestamp(),
  createdBy: state.user.uid
});

const writeNotificationOnce = async record => {
  const batch = writeBatch(db);
  batch.set(companyDoc(`notifications`, record.id), record);
  try {
    await batch.commit();
    return 1;
  } catch (error) {
    if (
      error?.code === `permission-denied`
      || String(error?.message || ``).includes(`permission`)
    ) {
      return 0;
    }
    throw error;
  }
};

const setAssigneeArtifacts = (
  writer,
  requestId,
  requestNumber,
  route,
  type,
  cycleId = ``,
  includeNotifications = false
) => {
  route.assignees.forEach(assigneeUid => {
    const taskId = [
      `step`,
      route.step.index,
      assigneeUid,
      cycleId
    ].filter(Boolean).join(`-`);
    writer.set(
      requestChildDoc(requestId, `tasks`, taskId),
      taskRecord(requestId, taskId, route.step, assigneeUid)
    );
    if (!includeNotifications) return;
    const notificationId = crypto.randomUUID();
    writer.set(
      companyDoc(`notifications`, notificationId),
      notificationRecord({
        id: notificationId,
        requestId,
        recipientUid: assigneeUid,
        kind: `assignment`,
        titleEn: `New request assigned`,
        titleAr: `تم تعيين طلب جديد`,
        bodyEn: `${requestNumber} · ${type?.nameEn || `Employee request`}`,
        bodyAr: `${requestNumber} · ${type?.nameAr || `طلب موظف`}`,
        workspace: route.kind === `hr` ? `hr-operations` : `approvals`
      })
    );
  });
};

const ensureAssignmentNotifications = async (
  requestId,
  requestNumber,
  route,
  type,
  cycleId = ``
) => {
  const candidates = route.assignees.map(assigneeUid => ({
    assigneeUid,
    id: [
      `assignment`,
      requestId,
      route.step.index,
      assigneeUid,
      cycleId
    ].filter(Boolean).join(`-`)
      .replaceAll(/[^a-zA-Z0-9_-]/g, ``)
      .slice(0, 180)
  }));
  const results = await Promise.all(candidates.map(({ assigneeUid, id }) => (
    writeNotificationOnce(
      notificationRecord({
        id,
        requestId,
        recipientUid: assigneeUid,
        kind: `assignment`,
        titleEn: `New request assigned`,
        titleAr: `تم تعيين طلب جديد`,
        bodyEn: `${requestNumber} · ${type?.nameEn || `Employee request`}`,
        bodyAr: `${requestNumber} · ${type?.nameAr || `طلب موظف`}`,
        workspace: route.kind === `hr` ? `hr-operations` : `approvals`
      })
    )
  )));
  return results.reduce((total, value) => total + value, 0);
};

const createRequest = async ({
  typeId,
  values,
  subjectEmployeeId,
  priority = `normal`,
  submit = true,
  idempotencyKey = ``
}) => {
  const requestType = requestTypeById(typeId);
  if (!requestType) throw new Error(`request-type-missing`);
  const workflow = workflowById(requestType.workflowId);
  if (!workflow) throw new Error(`workflow-missing`);
  if (!state.ownEmployee) throw new Error(`employee-file-required`);

  const subjectEmployee = requestType.subjectMode === `direct_report`
    ? employeeById(subjectEmployeeId)
    : state.ownEmployee;
  if (!subjectEmployee) throw new Error(`subject-required`);
  if (
    requestType.subjectMode === `direct_report`
    && subjectEmployee.managerEmployeeId !== state.ownEmployee.id
  ) {
    throw new Error(`direct-report-only`);
  }

  const payload = validatePayload(
    requestType,
    normalizePayload(requestType, values)
  );
  const route = submit
    ? resolveRoute(requestType, state.ownEmployee, workflow, state.user.uid)
    : null;
  const requestId = idempotencyKey || crypto.randomUUID();
  const counterReference = companyDoc(`requestCounters`, `requests`);
  const requestReference = companyDoc(`requests`, requestId);
  const year = new Date().getFullYear();

  await runTransaction(db, async transaction => {
    const [counterSnapshot, existingRequestSnapshot] = await Promise.all([
      transaction.get(counterReference),
      transaction.get(requestReference)
    ]);
    if (existingRequestSnapshot.exists()) {
      if (existingRequestSnapshot.data().requesterUid !== state.user.uid) {
        throw new Error(`idempotency-conflict`);
      }
      return;
    }
    const nextValue = counterSnapshot.exists()
      ? Number(counterSnapshot.data().value || 0) + 1
      : 1;
    const requestNumber = requestNumberFor(requestType.code, year, nextValue);
    const eventId = crypto.randomUUID();
    transaction.set(counterReference, {
      companyId: state.companyId,
      value: nextValue,
      lastRequestId: requestId,
      lastRequestNumber: requestNumber,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });

    transaction.set(requestReference, {
      id: requestId,
      companyId: state.companyId,
      requestNumber,
      sequence: nextValue,
      typeId: requestType.id,
      typeCode: requestType.code,
      typeVersion: requestType.version,
      workflowId: requestType.workflowId,
      requesterUid: state.user.uid,
      requesterEmployeeId: state.ownEmployee.id,
      requesterName: state.ownEmployee.fullNameEn,
      subjectEmployeeId: subjectEmployee.id,
      subjectName: subjectEmployee.fullNameEn,
      managerEmployeeId: state.ownEmployee.managerEmployeeId || ``,
      status: submit ? route.status : `DRAFT`,
      previousStatus: ``,
      currentStep: submit ? Number(route.step.index || 0) : 0,
      currentStepType: submit ? route.step.type : ``,
      currentAssigneeIds: submit ? route.assignees : [],
      previousAssigneeIds: [],
      slaRemainingHours: 0,
      delegationId: submit ? route.delegationId : ``,
      originalAssigneeIds: submit ? route.originalAssignees : [],
      routeKind: submit ? route.kind : ``,
      payload,
      confidentiality: requestType.confidentiality,
      priority,
      dueAt: submit ? dueTimestamp(route.step.slaHours) : null,
      submittedAt: submit ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: 0,
      lastEventId: eventId,
      outcome: {},
      fulfillmentRef: {},
      completedAt: null,
      withdrawnAt: null
    });

    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(
        requestId,
        eventId,
        submit ? `SUBMITTED` : `CREATED`,
        submit ? `Request submitted` : `Draft created`,
        { status: submit ? route.status : `DRAFT` }
      )
    );
    if (submit) {
      setAssigneeArtifacts(
        transaction,
        requestId,
        requestNumber,
        route,
        requestType
      );
    }
  });
  if (submit) {
    const createdSnapshot = await getDoc(requestReference);
    const createdRecord = createdSnapshot.data();
    await ensureAssignmentNotifications(
      requestId,
      createdRecord?.requestNumber || requestNumberFor(requestType.code, year, 0),
      route,
      requestType
    );
  }
  return requestId;
};

const submitDraft = async requestId => {
  const requestReference = companyDoc(`requests`, requestId);
  let assignment = null;
  await runTransaction(db, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    if (!requestSnapshot.exists()) throw new Error(`request-missing`);
    const record = requestSnapshot.data();
    if (record.requesterUid !== state.user.uid || record.status !== `DRAFT`) {
      throw new Error(`invalid-transition`);
    }
    const type = requestTypeById(record.typeId);
    const workflow = workflowById(record.workflowId);
    const route = resolveRoute(type, state.ownEmployee, workflow, state.user.uid);
    const eventId = crypto.randomUUID();
    transaction.update(requestReference, {
      status: route.status,
      currentStepType: route.step.type,
      currentAssigneeIds: route.assignees,
      delegationId: route.delegationId,
      originalAssigneeIds: route.originalAssignees,
      routeKind: route.kind,
      dueAt: dueTimestamp(route.step.slaHours),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(requestId, eventId, `SUBMITTED`, `Request submitted`, {
        status: route.status
      })
    );
    setAssigneeArtifacts(
      transaction,
      requestId,
      record.requestNumber,
      route,
      type
    );
    assignment = {
      requestNumber: record.requestNumber,
      route,
      type
    };
  });
  if (assignment) {
    await ensureAssignmentNotifications(
      requestId,
      assignment.requestNumber,
      assignment.route,
      assignment.type
    );
  }
};

const loadTasksForRequest = async requestId => {
  const snapshot = await getDocs(query(
    collection(
      db,
      `nasna_companies`,
      state.companyId,
      `requests`,
      requestId,
      `tasks`
    ),
    limit(100)
  ));
  return snapshotRows(snapshot);
};

const pendingTasksForRequest = async requestId => (
  (await loadTasksForRequest(requestId))
    .filter(task => task.status === `PENDING`)
);

const withdrawRequest = async requestId => {
  const pendingTasks = await pendingTasksForRequest(requestId);
  const requestReference = companyDoc(`requests`, requestId);
  await runTransaction(db, async transaction => {
    const taskReferences = pendingTasks.map(task => (
      requestChildDoc(requestId, `tasks`, task.id)
    ));
    const [requestSnapshot, ...taskSnapshots] = await Promise.all([
      transaction.get(requestReference),
      ...taskReferences.map(reference => transaction.get(reference))
    ]);
    if (!requestSnapshot.exists()) throw new Error(`request-missing`);
    const record = requestSnapshot.data();
    if (
      record.requesterUid !== state.user.uid
      || terminalStatuses.has(record.status)
      || record.status === `DRAFT`
    ) {
      throw new Error(`invalid-transition`);
    }
    const eventId = crypto.randomUUID();
    transaction.update(requestReference, {
      status: `WITHDRAWN`,
      currentAssigneeIds: [],
      outcome: { code: `withdrawn_by_requester`, note: `` },
      withdrawnAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    taskSnapshots.forEach((taskSnapshot, index) => {
      if (!taskSnapshot.exists() || taskSnapshot.data().status !== `PENDING`) return;
      transaction.update(taskReferences[index], {
        status: `CANCELLED`,
        decision: `cancel`,
        note: `Request withdrawn`,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(requestId, eventId, `WITHDRAWN`, `Request withdrawn`)
    );
  });
};

const respondToInformation = async (requestId, responseText) => {
  const normalizedResponse = String(responseText || ``).trim();
  if (!normalizedResponse) throw new Error(`information-response-required`);
  const requestReference = companyDoc(`requests`, requestId);
  let assignment = null;
  await runTransaction(db, async transaction => {
    const requestSnapshot = await transaction.get(requestReference);
    if (!requestSnapshot.exists()) throw new Error(`request-missing`);
    const record = requestSnapshot.data();
    if (record.requesterUid !== state.user.uid || record.status !== `NEEDS_INFORMATION`) {
      throw new Error(`invalid-transition`);
    }
    const eventId = crypto.randomUUID();
    transaction.update(requestReference, {
      status: record.previousStatus,
      previousStatus: ``,
      currentAssigneeIds: record.previousAssigneeIds,
      previousAssigneeIds: [],
      payload: {
        ...record.payload,
        informationResponse: normalizedResponse
      },
      dueAt: dueTimestamp(Math.max(Number(record.slaRemainingHours || 24), 0.25)),
      slaRemainingHours: 0,
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(
        requestId,
        eventId,
        `INFORMATION_PROVIDED`,
        `Additional information provided`
      )
    );
    const cycleId = `resume-${eventId}`;
    const route = {
      kind: record.routeKind,
      status: record.previousStatus,
      step: {
        index: record.currentStep,
        type: record.currentStepType,
        mode: record.previousAssigneeIds.length > 1
          ? `parallel_any`
          : `sequential`,
        slaHours: 24
      },
      assignees: record.previousAssigneeIds
    };
    const type = requestTypeById(record.typeId);
    setAssigneeArtifacts(
      transaction,
      requestId,
      record.requestNumber,
      route,
      type,
      cycleId
    );
    assignment = {
      requestNumber: record.requestNumber,
      route,
      type,
      cycleId
    };
  });
  if (assignment) {
    await ensureAssignmentNotifications(
      requestId,
      assignment.requestNumber,
      assignment.route,
      assignment.type,
      assignment.cycleId
    );
  }
};

const pendingTaskFor = async (requestId, uid = state.user.uid) => {
  const row = (await pendingTasksForRequest(requestId))
    .find(item => item.assigneeUid === uid);
  return row || null;
};

const notifyRequester = (transaction, record, kind, titleEn, titleAr, bodyEn, bodyAr) => {
  const id = crypto.randomUUID();
  transaction.set(
    companyDoc(`notifications`, id),
    notificationRecord({
      id,
      requestId: record.id,
      recipientUid: record.requesterUid,
      kind,
      titleEn,
      titleAr,
      bodyEn,
      bodyAr
    })
  );
};

const decideRequest = async (requestId, decision, note = ``) => {
  const pendingTasks = await pendingTasksForRequest(requestId);
  const task = pendingTasks.find(item => item.assigneeUid === state.user.uid);
  if (!task) throw new Error(`task-missing`);
  const requestReference = companyDoc(`requests`, requestId);
  const taskReferences = pendingTasks.map(item => (
    requestChildDoc(requestId, `tasks`, item.id)
  ));
  const selectedTaskIndex = pendingTasks.findIndex(item => item.id === task.id);
  const taskReference = taskReferences[selectedTaskIndex];
  let assignment = null;

  await runTransaction(db, async transaction => {
    const [requestSnapshot, ...taskSnapshots] = await Promise.all([
      transaction.get(requestReference),
      ...taskReferences.map(reference => transaction.get(reference))
    ]);
    const taskSnapshot = taskSnapshots[selectedTaskIndex];
    if (!requestSnapshot.exists() || !taskSnapshot.exists()) {
      throw new Error(`request-missing`);
    }
    const record = requestSnapshot.data();
    const liveTask = taskSnapshot.data();
    if (
      liveTask.status !== `PENDING`
      || liveTask.assigneeUid !== state.user.uid
      || record.requesterUid === state.user.uid
      || !record.currentAssigneeIds.includes(state.user.uid)
    ) {
      throw new Error(`invalid-transition`);
    }

    const normalizedNote = String(note || ``).trim();
    if (
      [`needs_information`, `reject`].includes(decision)
      && !normalizedNote
    ) {
      throw new Error(`decision-note-required`);
    }
    const eventId = crypto.randomUUID();
    const cancelSiblingTasks = reason => {
      taskSnapshots.forEach((siblingSnapshot, index) => {
        if (
          index === selectedTaskIndex
          || !siblingSnapshot.exists()
          || siblingSnapshot.data().status !== `PENDING`
        ) {
          return;
        }
        transaction.update(taskReferences[index], {
          status: `CANCELLED`,
          decision: `cancel`,
          note: reason,
          actedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: state.user.uid
        });
      });
    };
    if (decision === `needs_information`) {
      transaction.update(taskReference, {
        status: `NEEDS_INFORMATION`,
        decision,
        note: normalizedNote,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      cancelSiblingTasks(`Paused while awaiting information`);
      transaction.update(requestReference, {
        status: `NEEDS_INFORMATION`,
        previousStatus: record.status,
        currentAssigneeIds: [],
        previousAssigneeIds: record.currentAssigneeIds,
        slaRemainingHours: Math.max(
          ((toDate(record.dueAt)?.getTime() || Date.now()) - Date.now()) / 3600000,
          0.25
        ),
        outcome: { code: `needs_information`, note: normalizedNote },
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid,
        revision: Number(record.revision || 0) + 1,
        lastEventId: eventId
      });
      transaction.set(
        requestChildDoc(requestId, `events`, eventId),
        eventRecord(
          requestId,
          eventId,
          `INFORMATION_REQUESTED`,
          normalizedNote || `Additional information requested`
        )
      );
      notifyRequester(
        transaction,
        record,
        `information`,
        `More information is required`,
        `مطلوب معلومات إضافية`,
        `${record.requestNumber} needs your response.`,
        `${record.requestNumber} يحتاج إلى ردك.`
      );
      return;
    }

    if (decision === `reject`) {
      transaction.update(taskReference, {
        status: `REJECTED`,
        decision,
        note: normalizedNote,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      cancelSiblingTasks(`Request rejected by another assignee`);
      transaction.update(requestReference, {
        status: `REJECTED`,
        currentAssigneeIds: [],
        outcome: { code: `rejected`, note: normalizedNote },
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid,
        revision: Number(record.revision || 0) + 1,
        lastEventId: eventId
      });
      transaction.set(
        requestChildDoc(requestId, `events`, eventId),
        eventRecord(requestId, eventId, `REJECTED`, normalizedNote || `Request rejected`)
      );
      notifyRequester(
        transaction,
        record,
        `status`,
        `Request rejected`,
        `تم رفض الطلب`,
        `${record.requestNumber} was rejected.`,
        `تم رفض ${record.requestNumber}.`
      );
      return;
    }

    if (decision !== `approve` || record.status !== `PENDING_APPROVAL`) {
      throw new Error(`invalid-transition`);
    }

    const workflow = workflowById(record.workflowId);
    const nextStep = (workflow?.steps || []).find(step => (
      Number(step.index) > Number(record.currentStep)
      && step.resolver === `hr`
    ));
    if (!nextStep) throw new Error(`workflow-step-missing`);
    const hrMembers = activeHrMembers(record.requesterUid);
    if (!hrMembers.length) throw new Error(`independent-hr-required`);
    const assignees = nextStep.mode === `parallel_any`
      ? hrMembers.map(member => member.uid)
      : [hrMembers[0].uid];
    const route = {
      kind: `hr`,
      status: `PENDING_FULFILLMENT`,
      step: nextStep,
      assignees
    };

    transaction.update(taskReference, {
      status: `APPROVED`,
      decision,
      note: normalizedNote,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    cancelSiblingTasks(`Parallel approval completed`);
    transaction.update(requestReference, {
      status: `PENDING_FULFILLMENT`,
      currentStep: Number(nextStep.index),
      currentStepType: `fulfillment`,
      currentAssigneeIds: assignees,
      routeKind: `hr`,
      dueAt: dueTimestamp(nextStep.slaHours),
      outcome: { code: `manager_approved`, note: normalizedNote },
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(requestId, eventId, `APPROVED`, normalizedNote || `Manager approved`)
    );
    setAssigneeArtifacts(
      transaction,
      requestId,
      record.requestNumber,
      route,
      requestTypeById(record.typeId)
    );
    assignment = {
      requestNumber: record.requestNumber,
      route,
      type: requestTypeById(record.typeId)
    };
    notifyRequester(
      transaction,
      record,
      `status`,
      `Manager approval completed`,
      `اكتملت موافقة المدير`,
      `${record.requestNumber} moved to HR fulfillment.`,
      `انتقل ${record.requestNumber} إلى تنفيذ HR.`
    );
  });
  if (assignment) {
    await ensureAssignmentNotifications(
      requestId,
      assignment.requestNumber,
      assignment.route,
      assignment.type
    );
  }
};

const movementPayload = (record, employee, position) => ({
  id: `MOV-${record.id}`,
  companyId: state.companyId,
  employeeId: employee.id,
  employeeAuthUid: employee.authUid,
  movementType: record.payload.movementType,
  effectiveDate: timestampFromInput(record.payload.effectiveDate),
  reason: String(record.payload.reason || ``).trim(),
  previousPositionId: employee.positionId,
  newPositionId: position?.id || employee.positionId,
  previousManagerEmployeeId: employee.managerEmployeeId || ``,
  newManagerEmployeeId: record.payload.newManagerEmployeeId || employee.managerEmployeeId || ``,
  previousEmploymentType: employee.employmentType,
  newEmploymentType: record.payload.newEmploymentType || employee.employmentType,
  previousEmploymentStatus: employee.employmentStatus,
  newEmploymentStatus: record.payload.newEmploymentStatus || employee.employmentStatus,
  previousWorkMode: employee.workMode,
  newWorkMode: record.payload.newWorkMode || employee.workMode,
  sourceRequestId: record.id,
  createdAt: serverTimestamp(),
  createdBy: state.user.uid
});

const movementTypeMatches = movement => ({
  transfer: movement.previousPositionId !== movement.newPositionId,
  promotion: movement.previousPositionId !== movement.newPositionId,
  reassignment: movement.previousPositionId !== movement.newPositionId,
  manager_change: movement.previousManagerEmployeeId !== movement.newManagerEmployeeId,
  employment_change: movement.previousEmploymentType !== movement.newEmploymentType,
  status_change: movement.previousEmploymentStatus !== movement.newEmploymentStatus,
  work_mode_change: movement.previousWorkMode !== movement.newWorkMode
}[movement.movementType] === true);

const activeEmploymentStatuses = new Set([
  `active`,
  `probation`,
  `leave`
]);

const employeeIsActive = employee => (
  Boolean(employee)
  && activeEmploymentStatuses.has(employee.employmentStatus)
);

const reportingGraphHasCycle = employees => {
  const managerByEmployee = new Map(
    employees.map(employee => [employee.id, employee.managerEmployeeId || ``])
  );
  for (const employee of employees) {
    const visited = new Set();
    let currentId = employee.id;
    while (currentId) {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      currentId = managerByEmployee.get(currentId) || ``;
    }
  }
  return false;
};

const managerCapability = (managerId, employees) => employees.some(employee => (
  employee.managerEmployeeId === managerId
  && employeeIsActive(employee)
));

const fulfillRequest = async (requestId, { note = ``, reference = `` } = {}) => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const normalizedNote = String(note || ``).trim();
  const normalizedReference = String(reference || ``).trim();
  const pendingTasks = await pendingTasksForRequest(requestId);
  const task = pendingTasks.find(item => item.assigneeUid === state.user.uid);
  if (!task) throw new Error(`task-missing`);
  const requestReference = companyDoc(`requests`, requestId);
  const taskReferences = pendingTasks.map(item => (
    requestChildDoc(requestId, `tasks`, item.id)
  ));
  const selectedTaskIndex = pendingTasks.findIndex(item => item.id === task.id);
  const taskReference = taskReferences[selectedTaskIndex];

  await runTransaction(db, async transaction => {
    const [requestSnapshot, ...taskSnapshots] = await Promise.all([
      transaction.get(requestReference),
      ...taskReferences.map(reference => transaction.get(reference))
    ]);
    const taskSnapshot = taskSnapshots[selectedTaskIndex];
    if (!requestSnapshot.exists() || !taskSnapshot.exists()) {
      throw new Error(`request-missing`);
    }
    const record = requestSnapshot.data();
    if (
      ![
        `contact_update`,
        `sensitive_data_update`,
        `document_renewal`,
        `team_movement`
      ].includes(record.typeCode)
      && !normalizedNote
      && !normalizedReference
    ) {
      throw new Error(`fulfillment-evidence-required`);
    }
    if (
      record.status !== `PENDING_FULFILLMENT`
      || !record.currentAssigneeIds.includes(state.user.uid)
      || record.requesterUid === state.user.uid
      || taskSnapshot.data().status !== `PENDING`
    ) {
      throw new Error(`invalid-transition`);
    }

    const employeeReference = companyDoc(`employees`, record.subjectEmployeeId);
    const privateReference = companyDoc(`employeePrivate`, record.subjectEmployeeId);
    let employeeSnapshot = null;
    let privateSnapshot = null;
    let positionSnapshot = null;
    let previousDocumentSnapshot = null;

    if ([
      `contact_update`,
      `sensitive_data_update`,
      `document_renewal`,
      `team_movement`
    ].includes(record.typeCode)) {
      employeeSnapshot = await transaction.get(employeeReference);
      if (!employeeSnapshot.exists()) throw new Error(`employee-missing`);
    }
    if ([`contact_update`, `sensitive_data_update`].includes(record.typeCode)) {
      privateSnapshot = await transaction.get(privateReference);
      if (!privateSnapshot.exists()) throw new Error(`private-record-missing`);
    }
    if (record.typeCode === `team_movement`) {
      const positionId = record.payload.newPositionId || employeeSnapshot.data().positionId;
      positionSnapshot = await transaction.get(companyDoc(`positions`, positionId));
      if (!positionSnapshot.exists()) throw new Error(`position-missing`);
    }
    if (
      record.typeCode === `document_renewal`
      && record.payload.previousDocumentId
    ) {
      previousDocumentSnapshot = await transaction.get(
        companyDoc(`employeeDocuments`, record.payload.previousDocumentId)
      );
    }

    let fulfillmentRef = {
      kind: `request`,
      id: record.id,
      reference: normalizedReference
    };

    if (record.typeCode === `contact_update`) {
      const employee = employeeSnapshot.data();
      const privateRecord = privateSnapshot.data();
      const publicPatch = {
        lastRequestId: record.id,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      if (record.payload.workPhone) publicPatch.workPhone = record.payload.workPhone;
      const privatePatch = {
        lastRequestId: record.id,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      [`personalEmail`, `personalPhone`, `address`].forEach(key => {
        if (record.payload[key] !== ``) privatePatch[key] = record.payload[key];
      });
      transaction.update(employeeReference, publicPatch);
      transaction.update(privateReference, privatePatch);
      fulfillmentRef = { kind: `employee_contact`, id: employee.id, requestId: record.id };
    }

    if (record.typeCode === `sensitive_data_update`) {
      const patch = {
        lastRequestId: record.id,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      [
        `nationalId`,
        `nationality`,
        `emergencyContactName`,
        `emergencyContactPhone`
      ].forEach(key => {
        if (record.payload[key] !== ``) patch[key] = record.payload[key];
      });
      if (record.payload.dateOfBirth) {
        patch.dateOfBirth = timestampFromInput(record.payload.dateOfBirth);
      }
      transaction.update(privateReference, patch);
      fulfillmentRef = { kind: `employee_private`, id: record.subjectEmployeeId, requestId: record.id };
    }

    if (record.typeCode === `document_renewal`) {
      const employee = employeeSnapshot.data();
      const documentId = `DOC-${record.id}`;
      const previousVersion = Number(previousDocumentSnapshot?.data()?.version || 0);
      transaction.set(companyDoc(`employeeDocuments`, documentId), {
        id: documentId,
        companyId: state.companyId,
        employeeId: employee.id,
        employeeAuthUid: employee.authUid,
        type: record.payload.documentType,
        title: record.payload.title,
        documentNumber: record.payload.documentNumber || ``,
        issueDate: timestampFromInput(record.payload.issueDate),
        expiryDate: timestampFromInput(record.payload.expiryDate),
        linkUrl: record.payload.linkUrl,
        visibility: record.payload.visibility || `employee`,
        status: `active`,
        sourceRequestId: record.id,
        previousDocumentId: record.payload.previousDocumentId || ``,
        version: previousVersion + 1,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      if (previousDocumentSnapshot?.exists()) {
        transaction.update(previousDocumentSnapshot.ref, {
          status: `revoked`,
          updatedAt: serverTimestamp(),
          updatedBy: state.user.uid
        });
      }
      fulfillmentRef = { kind: `employee_document`, id: documentId, requestId: record.id };
    }

    if (record.typeCode === `team_movement`) {
      const employee = employeeSnapshot.data();
      const position = positionSnapshot.data();
      const movement = movementPayload(record, employee, position);
      const effectiveDate = toDate(movement.effectiveDate);
      if (!effectiveDate || effectiveDate.getTime() > Date.now()) {
        throw new Error(`movement-not-effective-yet`);
      }
      if (position.status !== `active`) throw new Error(`position-inactive`);
      const manager = movement.newManagerEmployeeId
        ? employeeById(movement.newManagerEmployeeId)
        : null;
      if (
        movement.newManagerEmployeeId
        && (
          !manager
          || !employeeIsActive(manager)
          || manager.id === employee.id
        )
      ) {
        throw new Error(`invalid-manager`);
      }
      const candidateEmployees = state.employees.map(candidate => (
        candidate.id === employee.id
          ? {
              ...candidate,
              positionId: movement.newPositionId,
              managerEmployeeId: movement.newManagerEmployeeId,
              employmentType: movement.newEmploymentType,
              employmentStatus: movement.newEmploymentStatus,
              workMode: movement.newWorkMode
            }
          : candidate
      ));
      if (reportingGraphHasCycle(candidateEmployees)) {
        throw new Error(`manager-cycle`);
      }
      const filledPositionCount = candidateEmployees.filter(candidate => (
        candidate.id !== employee.id
        && candidate.positionId === movement.newPositionId
        && employeeIsActive(candidate)
      )).length;
      if (
        activeEmploymentStatuses.has(movement.newEmploymentStatus)
        && filledPositionCount >= Number(position.headcount || 0)
      ) {
        throw new Error(`position-full`);
      }
      if (
        movement.newEmploymentStatus === `suspended`
        && candidateEmployees.some(candidate => (
          candidate.managerEmployeeId === employee.id
          && employeeIsActive(candidate)
        ))
      ) {
        throw new Error(`manager-has-reports`);
      }
      if (!movementTypeMatches(movement)) throw new Error(`movement-type-mismatch`);
      const accessStatus = movement.newEmploymentStatus === `suspended`
        ? `disabled`
        : `active`;
      transaction.set(companyDoc(`employeeMovements`, movement.id), movement);
      transaction.update(employeeReference, {
        accessStatus,
        positionId: movement.newPositionId,
        jobTitleId: position.jobTitleId,
        branchId: position.branchId,
        locationId: position.locationId || ``,
        departmentId: position.departmentId,
        teamId: position.teamId || ``,
        managerEmployeeId: movement.newManagerEmployeeId,
        employmentType: movement.newEmploymentType,
        employmentStatus: movement.newEmploymentStatus,
        workMode: movement.newWorkMode,
        lastMovementId: movement.id,
        lastRequestId: record.id,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      const memberPatches = new Map();
      memberPatches.set(employee.authUid, {
        status: accessStatus,
        isManager: managerCapability(employee.id, candidateEmployees),
        updatedAt: serverTimestamp()
      });
      [
        movement.previousManagerEmployeeId,
        movement.newManagerEmployeeId
      ].filter(Boolean).forEach(managerId => {
        const affectedManager = employeeById(managerId);
        if (!affectedManager?.authUid) return;
        const patch = memberPatches.get(affectedManager.authUid)
          || { updatedAt: serverTimestamp() };
        patch.isManager = managerCapability(managerId, candidateEmployees);
        memberPatches.set(affectedManager.authUid, patch);
      });
      memberPatches.forEach((patch, authUid) => {
        transaction.update(companyDoc(`members`, authUid), patch);
      });
      transaction.update(doc(db, `nasna_users`, employee.authUid), {
        status: accessStatus,
        updatedAt: serverTimestamp()
      });
      fulfillmentRef = { kind: `employee_movement`, id: movement.id, requestId: record.id };
    }

    const eventId = crypto.randomUUID();
    transaction.update(taskReference, {
      status: `APPROVED`,
      decision: `approve`,
      note: normalizedNote,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    taskSnapshots.forEach((siblingSnapshot, index) => {
      if (
        index === selectedTaskIndex
        || !siblingSnapshot.exists()
        || siblingSnapshot.data().status !== `PENDING`
      ) {
        return;
      }
      transaction.update(taskReferences[index], {
        status: `CANCELLED`,
        decision: `cancel`,
        note: `Parallel fulfillment completed`,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    transaction.update(requestReference, {
      status: `COMPLETED`,
      currentAssigneeIds: [],
      outcome: {
        code: `fulfilled`,
        note: normalizedNote
      },
      fulfillmentRef,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(requestId, eventId, `FULFILLED`, normalizedNote || `Request completed`, {
        fulfillmentRef
      })
    );
    notifyRequester(
      transaction,
      record,
      `status`,
      `Request completed`,
      `اكتمل الطلب`,
      `${record.requestNumber} has been completed.`,
      `اكتمل ${record.requestNumber}.`
    );
  });
};

const cancelRequest = async (requestId, note = ``) => {
  if (!isAdmin()) throw new Error(`permission-denied`);
  const normalizedNote = String(note || ``).trim();
  if (!normalizedNote) throw new Error(`decision-note-required`);
  const pendingTasks = await pendingTasksForRequest(requestId);
  const task = pendingTasks.find(item => item.assigneeUid === state.user.uid);
  if (!task) throw new Error(`task-missing`);
  const requestReference = companyDoc(`requests`, requestId);
  const taskReferences = pendingTasks.map(item => (
    requestChildDoc(requestId, `tasks`, item.id)
  ));
  const selectedTaskIndex = pendingTasks.findIndex(item => item.id === task.id);
  const taskReference = taskReferences[selectedTaskIndex];
  await runTransaction(db, async transaction => {
    const [requestSnapshot, ...taskSnapshots] = await Promise.all([
      transaction.get(requestReference),
      ...taskReferences.map(reference => transaction.get(reference))
    ]);
    const taskSnapshot = taskSnapshots[selectedTaskIndex];
    if (!requestSnapshot.exists() || taskSnapshot.data().status !== `PENDING`) {
      throw new Error(`invalid-transition`);
    }
    const record = requestSnapshot.data();
    const eventId = crypto.randomUUID();
    transaction.update(taskReference, {
      status: `CANCELLED`,
      decision: `cancel`,
      note: normalizedNote,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    taskSnapshots.forEach((siblingSnapshot, index) => {
      if (
        index === selectedTaskIndex
        || !siblingSnapshot.exists()
        || siblingSnapshot.data().status !== `PENDING`
      ) {
        return;
      }
      transaction.update(taskReferences[index], {
        status: `CANCELLED`,
        decision: `cancel`,
        note: `Request cancelled by HR`,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    });
    transaction.update(requestReference, {
      status: `CANCELLED`,
      currentAssigneeIds: [],
      outcome: { code: `cancelled_by_hr`, note: normalizedNote },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    transaction.set(
      requestChildDoc(requestId, `events`, eventId),
      eventRecord(requestId, eventId, `CANCELLED`, normalizedNote)
    );
    notifyRequester(
      transaction,
      record,
      `status`,
      `Request cancelled`,
      `تم إلغاء الطلب`,
      `${record.requestNumber} was cancelled by HR.`,
      `تم إلغاء ${record.requestNumber} من قبل HR.`
    );
  });
};

const pagedResult = (snapshot, pageSize) => ({
  records: snapshotRows(snapshot),
  cursor: snapshot.docs.at(-1) || null,
  hasMore: snapshot.size === pageSize
});

const loadOwnRequests = async options => {
  const pageSize = Number(options?.pageSize || 200);
  const constraints = [
    where(`requesterUid`, `==`, state.user.uid),
    orderBy(`createdAt`, `desc`)
  ];
  if (options?.cursor) constraints.push(startAfter(options.cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(
    companyCollection(`requests`),
    ...constraints
  ));
  const result = pagedResult(snapshot, pageSize);
  return options ? result : result.records;
};

const loadManagerRequests = async options => {
  if (!state.ownEmployee) {
    return options
      ? {
          records: [],
          cursor: {
            assigned: null,
            team: null,
            assignedDone: true,
            teamDone: true
          },
          hasMore: false
        }
      : [];
  }
  const pageSize = Number(options?.pageSize || 200);
  const assignedDone = Boolean(options?.cursor?.assignedDone);
  const teamDone = Boolean(options?.cursor?.teamDone);
  const assignedConstraints = [
    where(`currentAssigneeIds`, `array-contains`, state.user.uid),
    orderBy(`createdAt`, `desc`)
  ];
  const teamConstraints = [
    where(`managerEmployeeId`, `==`, state.ownEmployee.id),
    where(`confidentiality`, `==`, `normal`),
    orderBy(`createdAt`, `desc`)
  ];
  if (options?.cursor?.assigned) {
    assignedConstraints.push(startAfter(options.cursor.assigned));
  }
  if (options?.cursor?.team) {
    teamConstraints.push(startAfter(options.cursor.team));
  }
  assignedConstraints.push(limit(pageSize));
  teamConstraints.push(limit(pageSize));
  const [assignedSnapshot, teamSnapshot] = await Promise.all([
    assignedDone
      ? Promise.resolve(null)
      : getDocs(query(
          companyCollection(`requests`),
          ...assignedConstraints
        )),
    teamDone
      ? Promise.resolve(null)
      : getDocs(query(
          companyCollection(`requests`),
          ...teamConstraints
        ))
  ]);
  const rows = new Map();
  [
    ...(assignedSnapshot ? snapshotRows(assignedSnapshot) : []),
    ...(teamSnapshot ? snapshotRows(teamSnapshot) : [])
  ].forEach(row => {
    if (row.confidentiality === `normal` || row.currentAssigneeIds.includes(state.user.uid)) {
      rows.set(row.id, row);
    }
  });
  const records = [...rows.values()].sort((a, b) => (
    (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)
  ));
  if (!options) return records;
  const nextAssignedDone = assignedDone
    || !assignedSnapshot
    || assignedSnapshot.size < pageSize;
  const nextTeamDone = teamDone
    || !teamSnapshot
    || teamSnapshot.size < pageSize;
  return {
    records,
    cursor: {
      assigned: assignedSnapshot?.docs.at(-1)
        || options?.cursor?.assigned
        || null,
      team: teamSnapshot?.docs.at(-1)
        || options?.cursor?.team
        || null,
      assignedDone: nextAssignedDone,
      teamDone: nextTeamDone
    },
    hasMore: !nextAssignedDone || !nextTeamDone
  };
};

const loadHrRequests = async options => {
  if (!isAdmin()) {
    return options
      ? { records: [], cursor: null, hasMore: false }
      : [];
  }
  const pageSize = Number(options?.pageSize || 250);
  const constraints = [orderBy(`createdAt`, `desc`)];
  if (options?.cursor) constraints.push(startAfter(options.cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(
    companyCollection(`requests`),
    ...constraints
  ));
  const result = pagedResult(snapshot, pageSize);
  return options ? result : result.records;
};

const loadRequestById = async requestId => {
  const snapshot = await getDoc(companyDoc(`requests`, requestId));
  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
};

const loadRequestTypeVersions = async records => {
  const missingIds = [...new Set(records
    .map(record => record.typeId)
    .filter(typeId => typeId && !requestTypeById(typeId))
  )].slice(0, 50);
  if (!missingIds.length) return [];
  const snapshots = await Promise.all(missingIds.map(typeId => (
    getDoc(companyDoc(`requestTypes`, typeId))
  )));
  const loaded = snapshots
    .filter(snapshot => snapshot.exists())
    .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
  state.configurationTypes = [
    ...state.configurationTypes,
    ...loaded.filter(type => !state.configurationTypes.some(existing => (
      existing.id === type.id
    )))
  ];
  return loaded;
};

const loadRequestEvents = async requestId => {
  const snapshot = await getDocs(query(
    collection(
      db,
      `nasna_companies`,
      state.companyId,
      `requests`,
      requestId,
      `events`
    ),
    limit(250)
  ));
  return snapshotRows(snapshot).sort((a, b) => (
    (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0)
  ));
};

const loadRequestComments = async requestId => {
  const commentsCollection = collection(
    db,
    `nasna_companies`,
    state.companyId,
    `requests`,
    requestId,
    `comments`
  );
  const snapshot = await getDocs(isAdmin()
    ? query(commentsCollection, limit(200))
    : query(
        commentsCollection,
        where(`visibility`, `==`, `participants`),
        limit(200)
      ));
  return snapshotRows(snapshot)
    .filter(comment => comment.visibility !== `hr_only` || isAdmin())
    .sort((a, b) => (
      (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0)
    ));
};

const addComment = async (requestId, body, visibility = `participants`) => {
  const value = String(body || ``).trim();
  if (!value) throw new Error(`comment-required`);
  const commentId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const batch = writeBatch(db);
  batch.set(requestChildDoc(requestId, `comments`, commentId), {
    id: commentId,
    companyId: state.companyId,
    requestId,
    authorUid: state.user.uid,
    authorName: state.ownEmployee?.fullNameEn || state.membership.displayName || state.user.email,
    authorRole: state.membership.role,
    body: value,
    visibility,
    createdAt: serverTimestamp()
  });
  batch.set(
    requestChildDoc(requestId, `events`, eventId),
    eventRecord(requestId, eventId, `COMMENTED`, `Comment added`, {
      visibility
    })
  );
  await batch.commit();
};

const loadNotifications = async () => {
  const snapshot = await getDocs(query(
    companyCollection(`notifications`),
    where(`recipientUid`, `==`, state.user.uid),
    limit(100)
  ));
  return snapshotRows(snapshot).sort((a, b) => (
    (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)
  ));
};

const ensureSlaNotifications = async records => {
  const overdueAssignments = records
    .filter(record => (
      overdue(record)
      && Array.isArray(record.currentAssigneeIds)
      && record.currentAssigneeIds.includes(state.user.uid)
      && record.requesterUid !== state.user.uid
    ))
    .slice(0, 20);
  if (!overdueAssignments.length) return 0;

  const candidates = overdueAssignments.map(record => ({
    record,
    id: [
      `sla`,
      record.id,
      record.currentStep,
      state.user.uid
    ].join(`-`).replaceAll(/[^a-zA-Z0-9_-]/g, ``).slice(0, 180)
  }));
  const results = await Promise.all(candidates.map(({ record, id }) => (
    writeNotificationOnce(
      notificationRecord({
        id,
        requestId: record.id,
        recipientUid: state.user.uid,
        kind: `sla`,
        titleEn: `Request SLA is overdue`,
        titleAr: `تجاوز الطلب مدة الخدمة`,
        bodyEn: `${record.requestNumber} requires attention. No automatic decision was applied.`,
        bodyAr: `${record.requestNumber} يحتاج إلى متابعة، ولم يُتخذ أي قرار تلقائي.`,
        workspace: record.routeKind === `hr` ? `hr-operations` : `approvals`
      })
    )
  )));
  return results.reduce((total, value) => total + value, 0);
};

const markNotificationRead = id => updateDoc(companyDoc(`notifications`, id), {
  readAt: serverTimestamp()
});

const loadDelegations = async () => {
  if (!isManager() && !isAdmin()) return [];
  const snapshot = isAdmin()
    ? await getDocs(query(companyCollection(`delegations`), limit(200)))
    : await getDocs(query(
        companyCollection(`delegations`),
        where(`delegatorUid`, `==`, state.user.uid),
        limit(100)
      ));
  return snapshotRows(snapshot).sort((a, b) => (
    (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)
  ));
};

const createDelegation = async (delegateUid, startDate, endDate) => {
  const delegate = memberByUid(delegateUid);
  if (
    !delegate
    || !(
      adminRoles.has(delegate.role)
      || delegate.role === `manager`
      || delegate.isManager
    )
  ) {
    throw new Error(`delegate-missing`);
  }
  const startAt = timestampFromInput(startDate);
  const endAt = timestampFromInput(endDate);
  const now = Date.now();
  const startTime = startAt?.toDate().getTime() || 0;
  const endTime = endAt?.toDate().getTime() || 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (
    !startAt
    || !endAt
    || startTime < todayStart.getTime()
    || startTime > now
    || endTime <= now
    || endTime <= startTime
  ) {
    throw new Error(`invalid-delegation-dates`);
  }
  const id = crypto.randomUUID();
  const openRequests = (await loadManagerRequests()).filter(record => (
    record.status === `PENDING_APPROVAL`
    && record.currentAssigneeIds.includes(state.user.uid)
    && record.requesterUid !== delegateUid
  ));
  if (openRequests.length > 80) {
    throw new Error(`delegation-batch-limit`);
  }
  const taskPairs = await Promise.all(openRequests.map(async record => ({
    record,
    task: await pendingTaskFor(record.id)
  })));
  const batch = writeBatch(db);
  batch.set(companyDoc(`delegations`, id), {
    id,
    companyId: state.companyId,
    delegatorUid: state.user.uid,
    delegateUid,
    startAt,
    endAt,
    status: `active`,
    createdAt: serverTimestamp(),
    createdBy: state.user.uid,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  batch.update(companyDoc(`members`, state.user.uid), {
    activeDelegationId: id,
    activeDelegateUid: delegateUid,
    activeDelegationStartAt: startAt,
    activeDelegationEndAt: endAt,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  taskPairs.forEach(({ record, task }) => {
    if (!task) return;
    const eventId = crypto.randomUUID();
    batch.update(companyDoc(`requests`, record.id), {
      currentAssigneeIds: [delegateUid],
      delegationId: id,
      originalAssigneeIds: record.currentAssigneeIds,
      dueAt: dueTimestamp(24),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    batch.update(requestChildDoc(record.id, `tasks`, task.id), {
      status: `CANCELLED`,
      decision: `cancel`,
      note: `Delegated`,
      actedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid
    });
    const delegatedTaskId = `step-${record.currentStep}-${delegateUid}-${id}`;
    batch.set(
      requestChildDoc(record.id, `tasks`, delegatedTaskId),
      taskRecord(
        record.id,
        delegatedTaskId,
        {
          index: record.currentStep,
          type: `approval`,
          mode: `sequential`,
          slaHours: 24
        },
        delegateUid
      )
    );
    batch.set(
      requestChildDoc(record.id, `events`, eventId),
      eventRecord(record.id, eventId, `DELEGATED`, `Approval delegated`, {
        delegationId: id,
        delegateUid,
        startDate,
        endDate
      })
    );
    const notificationId = crypto.randomUUID();
    batch.set(
      companyDoc(`notifications`, notificationId),
      notificationRecord({
        id: notificationId,
        requestId: record.id,
        recipientUid: delegateUid,
        kind: `assignment`,
        titleEn: `Delegated approval`,
        titleAr: `موافقة مفوّضة`,
        bodyEn: `${record.requestNumber} was delegated to you.`,
        bodyAr: `تم تفويض ${record.requestNumber} إليك.`,
        workspace: `approvals`
      })
    );
  });
  await batch.commit();
  return id;
};

const cancelDelegation = async id => {
  const delegationReference = companyDoc(`delegations`, id);
  const delegationSnapshot = await getDoc(delegationReference);
  if (!delegationSnapshot.exists()) throw new Error(`delegation-missing`);
  const delegation = delegationSnapshot.data();
  const delegatedRequestsSnapshot = await getDocs(query(
    companyCollection(`requests`),
    where(`delegationId`, `==`, id),
    limit(200)
  ));
  const delegatedRequests = snapshotRows(delegatedRequestsSnapshot).filter(record => (
    record.status === `PENDING_APPROVAL`
    && record.delegationId === id
  ));
  if (delegatedRequests.length > 80) {
    throw new Error(`delegation-batch-limit`);
  }
  const taskPairs = await Promise.all(delegatedRequests.map(async record => ({
    record,
    task: await pendingTaskFor(record.id, delegation.delegateUid)
  })));
  const batch = writeBatch(db);
  batch.update(delegationReference, {
    status: `cancelled`,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  batch.update(companyDoc(`members`, delegation.delegatorUid), {
    activeDelegationId: ``,
    activeDelegateUid: ``,
    activeDelegationStartAt: null,
    activeDelegationEndAt: null,
    updatedAt: serverTimestamp(),
    updatedBy: state.user.uid
  });
  taskPairs.forEach(({ record, task }) => {
    const assignees = Array.isArray(record.originalAssigneeIds)
      ? record.originalAssigneeIds
      : [state.user.uid];
    const eventId = crypto.randomUUID();
    batch.update(companyDoc(`requests`, record.id), {
      currentAssigneeIds: assignees,
      delegationId: ``,
      originalAssigneeIds: [],
      dueAt: dueTimestamp(24),
      updatedAt: serverTimestamp(),
      updatedBy: state.user.uid,
      revision: Number(record.revision || 0) + 1,
      lastEventId: eventId
    });
    if (task) {
      batch.update(requestChildDoc(record.id, `tasks`, task.id), {
        status: `CANCELLED`,
        decision: `cancel`,
        note: `Delegation cancelled`,
        actedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
    }
    assignees.forEach(assigneeUid => {
      const restoredTaskId = `step-${record.currentStep}-${assigneeUid}-restored-${id}`;
      batch.set(
        requestChildDoc(record.id, `tasks`, restoredTaskId),
        taskRecord(
          record.id,
          restoredTaskId,
          {
            index: record.currentStep,
            type: `approval`,
            mode: `sequential`,
            slaHours: 24
          },
          assigneeUid
        )
      );
      const notificationId = crypto.randomUUID();
      batch.set(
        companyDoc(`notifications`, notificationId),
        notificationRecord({
          id: notificationId,
          requestId: record.id,
          recipientUid: assigneeUid,
          kind: `assignment`,
          titleEn: `Approval returned to you`,
          titleAr: `أُعيدت الموافقة إليك`,
          bodyEn: `${record.requestNumber} returned after delegation ended.`,
          bodyAr: `أُعيد ${record.requestNumber} بعد انتهاء التفويض.`,
          workspace: `approvals`
        })
      );
    });
    batch.set(
      requestChildDoc(record.id, `events`, eventId),
      eventRecord(record.id, eventId, `DELEGATED`, `Approval delegation cancelled`, {
        delegationId: id
      })
    );
  });
  await batch.commit();
};

const reconcileExpiredDelegations = async records => {
  const expired = records.filter(record => (
    record.status === `active`
    && record.delegatorUid === state.user.uid
    && (toDate(record.endAt)?.getTime() || 0) <= Date.now()
  ));
  for (const record of expired) {
    await cancelDelegation(record.id);
  }
  return expired.length;
};

const overdue = record => {
  const due = toDate(record.dueAt);
  return Boolean(
    due
    && due.getTime() < Date.now()
    && !terminalStatuses.has(record.status)
  );
};

const durationHours = record => {
  const start = toDate(record.submittedAt || record.createdAt);
  const end = toDate(record.completedAt || record.withdrawnAt) || new Date();
  if (!start) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
};

export {
  Timestamp,
  addComment,
  adminRoles,
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
  loadRequestTypeVersions,
  loadRequestComments,
  loadRequestEvents,
  loadSession,
  markNotificationRead,
  memberByUid,
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
};
