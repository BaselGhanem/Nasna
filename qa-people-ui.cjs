const fs = require(`node:fs`);
const http = require(`node:http`);
const path = require(`node:path`);
const puppeteer = require(`puppeteer-core`);
const chromium = require(`@sparticuz/chromium`).default;
const ExcelJS = require(`exceljs`);

const root = __dirname;
const release = `20260725.9`;
const qaDirectory = `/tmp/nasna-stage7-template`;

process.env.FONTCONFIG_FILE = path.join(root, `fontconfig.xml`);
process.env.FONTCONFIG_PATH = root;

const headers = [
  `Employee Code`,
  `Full Name English`,
  `Full Name Arabic`,
  `Work Email`,
  `Position Code`,
  `Manager Employee Code`,
  `Hire Date`,
  `Employment Type`,
  `Employment Status`,
  `Work Mode`,
  `Work Phone`,
  `National ID`,
  `Date of Birth`,
  `Gender`,
  `Marital Status`,
  `Nationality`,
  `Personal Email`,
  `Personal Phone`,
  `Address`,
  `Emergency Contact Name`,
  `Emergency Contact Phone`,
  `HR Notes`,
  `Temporary Password`
];

const buildImportFile = async (filePath, dateOfBirth) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Employees`);
  worksheet.addRows([
    headers,
    [
      `IMP-001`,
      `Imported Employee`,
      `موظف مستورد`,
      `imported@nasna.test`,
      `POS-EMP`,
      `MGR-001`,
      `2026-07-10`,
      `permanent`,
      `active`,
      `onsite`,
      `+962790000003`,
      ``,
      dateOfBirth,
      `not_disclosed`,
      `not_disclosed`,
      `Jordanian`,
      ``,
      ``,
      ``,
      ``,
      ``,
      ``,
      ``
    ]
  ]);
  await workbook.xlsx.writeFile(filePath);
};

const validImportPath = path.join(qaDirectory, `qa-people-valid.xlsx`);
const invalidImportPath = path.join(qaDirectory, `qa-people-invalid.xlsx`);
fs.mkdirSync(qaDirectory, { recursive: true });

const authModule = `
const currentUser = () => globalThis.__nasnaMockCurrentUser;
export const inMemoryPersistence = {};
export const onAuthStateChanged = (_auth, callback) => {
  queueMicrotask(() => callback(currentUser()));
  return () => undefined;
};
export const getAuth = () => ({ languageCode: \`en\` });
export const setPersistence = async () => undefined;
export const createUserWithEmailAndPassword = async (_auth, email) => {
  const uid = \`new-auth-\${globalThis.__nasnaCreatedAuthEmails.length + 1}\`;
  globalThis.__nasnaCreatedAuthEmails.push(email);
  return { user: { uid, email } };
};
export const deleteUser = async () => undefined;
export const sendPasswordResetEmail = async (_auth, email) => {
  globalThis.__nasnaResetEmails.push(email);
};
export const signOut = async () => undefined;
`;

const appModule = `
export const initializeApp = (_config, name) => ({ name });
export const deleteApp = async () => undefined;
`;

const firebaseConfigModule = `
const actor = new URLSearchParams(location.search).get(\`actor\`) || \`admin\`;
const users = {
  admin: { uid: \`u1\`, email: \`basel@nasna.com\` },
  manager: { uid: \`manager-uid\`, email: \`manager@nasna.test\` },
  employee: { uid: \`employee-uid\`, email: \`employee@nasna.test\` }
};
globalThis.__nasnaMockCurrentUser = users[actor];
globalThis.__nasnaCreatedAuthEmails = [];
globalThis.__nasnaResetEmails = [];
export const auth = {
  currentUser: globalThis.__nasnaMockCurrentUser,
  languageCode: \`en\`
};
export const firebaseApp = {};
export const firebaseConfig = { projectId: \`mock-nasna\` };
`;

const firestoreConfigModule = `
export const db = {};
export const firestoreDatabaseId = \`mock\`;
`;

const firestoreModule = `
export class Timestamp {
  constructor(date) { this.date = date; }
  static fromDate(date) { return new Timestamp(date); }
  toDate() { return this.date; }
}

const timestamp = value => Timestamp.fromDate(new Date(value));
const base = (code, extra = {}) => ({
  id: code,
  companyId: \`company-1\`,
  code,
  status: \`active\`,
  createdAt: timestamp(\`2026-07-01T00:00:00Z\`),
  createdBy: \`u1\`,
  updatedAt: timestamp(\`2026-07-01T00:00:00Z\`),
  updatedBy: \`u1\`,
  ...extra
});
const employee = (id, extra = {}) => ({
  id,
  companyId: \`company-1\`,
  employeeCode: id,
  authUid: extra.authUid,
  accessStatus: \`active\`,
  fullNameEn: extra.fullNameEn,
  fullNameAr: extra.fullNameAr,
  workEmail: extra.workEmail,
  workPhone: extra.workPhone || \`+962790000000\`,
  positionId: extra.positionId,
  jobTitleId: extra.jobTitleId,
  branchId: \`MAIN\`,
  locationId: \`HQ\`,
  departmentId: \`PEOPLE\`,
  teamId: \`CORE\`,
  managerEmployeeId: extra.managerEmployeeId || \`\`,
  hireDate: timestamp(\`2026-01-01T00:00:00Z\`),
  employmentType: \`permanent\`,
  employmentStatus: extra.employmentStatus || \`active\`,
  workMode: \`onsite\`,
  createdAt: timestamp(\`2026-07-01T00:00:00Z\`),
  createdBy: \`u1\`,
  updatedAt: timestamp(\`2026-07-01T00:00:00Z\`),
  updatedBy: \`u1\`
});
const privateRecord = (id, authUid) => ({
  id,
  companyId: \`company-1\`,
  authUid,
  nationalId: \`N-\${id}\`,
  dateOfBirth: timestamp(\`1990-01-01T00:00:00Z\`),
  gender: \`not_disclosed\`,
  maritalStatus: \`not_disclosed\`,
  nationality: \`Jordanian\`,
  personalEmail: \`\${id.toLowerCase()}@personal.test\`,
  personalPhone: \`+962791111111\`,
  address: \`Amman\`,
  emergencyContactName: \`Emergency\`,
  emergencyContactPhone: \`+962792222222\`,
  hrNotes: \`Private note\`,
  createdAt: timestamp(\`2026-07-01T00:00:00Z\`),
  createdBy: \`u1\`,
  updatedAt: timestamp(\`2026-07-01T00:00:00Z\`),
  updatedBy: \`u1\`
});

const store = globalThis.__nasnaMockStore = {
  nasna_users: {
    u1: {
      uid: \`u1\`, email: \`basel@nasna.com\`, displayName: \`Basel\`,
      activeCompanyId: \`company-1\`, status: \`active\`, locale: \`en\`
    },
    [\`manager-uid\`]: {
      uid: \`manager-uid\`, employeeId: \`MGR-001\`, email: \`manager@nasna.test\`,
      displayName: \`Mona Manager\`, activeCompanyId: \`company-1\`, status: \`active\`, locale: \`en\`
    },
    [\`employee-uid\`]: {
      uid: \`employee-uid\`, employeeId: \`EMP-001\`, email: \`employee@nasna.test\`,
      displayName: \`Omar Employee\`, activeCompanyId: \`company-1\`, status: \`active\`, locale: \`en\`
    }
  },
  members: {
    u1: {
      uid: \`u1\`, companyId: \`company-1\`, email: \`basel@nasna.com\`,
      displayName: \`Basel\`, role: \`hr_admin\`, isManager: false, status: \`active\`
    },
    [\`manager-uid\`]: {
      uid: \`manager-uid\`, companyId: \`company-1\`, employeeId: \`MGR-001\`,
      email: \`manager@nasna.test\`, displayName: \`Mona Manager\`,
      role: \`employee\`, isManager: true, status: \`active\`
    },
    [\`employee-uid\`]: {
      uid: \`employee-uid\`, companyId: \`company-1\`, employeeId: \`EMP-001\`,
      email: \`employee@nasna.test\`, displayName: \`Omar Employee\`,
      role: \`employee\`, isManager: false, status: \`active\`
    }
  },
  branches: {
    MAIN: base(\`MAIN\`, { nameEn: \`Main Branch\`, nameAr: \`الفرع الرئيسي\` })
  },
  locations: {
    HQ: base(\`HQ\`, {
      branchId: \`MAIN\`, nameEn: \`Head Office\`, nameAr: \`المكتب الرئيسي\`,
      city: \`Amman\`, address: \`Amman\`, timezone: \`Asia/Amman\`
    })
  },
  departments: {
    PEOPLE: base(\`PEOPLE\`, {
      branchId: \`MAIN\`, nameEn: \`People\`, nameAr: \`الموظفون\`
    })
  },
  teams: {
    CORE: base(\`CORE\`, {
      departmentId: \`PEOPLE\`, nameEn: \`Core Team\`, nameAr: \`الفريق الأساسي\`
    })
  },
  jobGrades: {
    G1: base(\`G1\`, { nameEn: \`Professional\`, nameAr: \`مهني\`, level: 1 })
  },
  jobTitles: {
    [\`TITLE-HR\`]: base(\`TITLE-HR\`, {
      gradeId: \`G1\`, nameEn: \`HR Officer\`, nameAr: \`مسؤول موارد بشرية\`
    }),
    [\`TITLE-MGR\`]: base(\`TITLE-MGR\`, {
      gradeId: \`G1\`, nameEn: \`Team Lead\`, nameAr: \`قائد فريق\`
    }),
    [\`TITLE-EMP\`]: base(\`TITLE-EMP\`, {
      gradeId: \`G1\`, nameEn: \`People Specialist\`, nameAr: \`أخصائي موظفين\`
    })
  },
  positions: {
    [\`POS-HR\`]: base(\`POS-HR\`, {
      jobTitleId: \`TITLE-HR\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 2
    }),
    [\`POS-MGR\`]: base(\`POS-MGR\`, {
      jobTitleId: \`TITLE-MGR\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 1
    }),
    [\`POS-EMP\`]: base(\`POS-EMP\`, {
      jobTitleId: \`TITLE-EMP\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 5
    })
  },
  employees: {
    [\`MGR-001\`]: employee(\`MGR-001\`, {
      authUid: \`manager-uid\`, fullNameEn: \`Mona Manager\`, fullNameAr: \`منى المديرة\`,
      workEmail: \`manager@nasna.test\`, positionId: \`POS-MGR\`, jobTitleId: \`TITLE-MGR\`
    }),
    [\`EMP-001\`]: employee(\`EMP-001\`, {
      authUid: \`employee-uid\`, fullNameEn: \`Omar Employee\`, fullNameAr: \`عمر الموظف\`,
      workEmail: \`employee@nasna.test\`, positionId: \`POS-EMP\`,
      jobTitleId: \`TITLE-EMP\`, managerEmployeeId: \`MGR-001\`
    })
  },
  employeePrivate: {
    [\`MGR-001\`]: privateRecord(\`MGR-001\`, \`manager-uid\`),
    [\`EMP-001\`]: privateRecord(\`EMP-001\`, \`employee-uid\`)
  },
  auditLogs: {}
};
globalThis.__nasnaPrivateReads = [];

let autoId = 0;
const clone = value => {
  if (Array.isArray(value)) return value.map(clone);
  if (value instanceof Timestamp) return new Timestamp(new Date(value.date));
  if (value && typeof value === \`object\`) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
};

export const collection = (_db, ...segments) => ({ path: segments.join(\`/\`), type: \`collection\` });
export const doc = (first, ...segments) => {
  if (first?.type === \`collection\`) {
    autoId += 1;
    return { path: \`\${first.path}/auto-\${autoId}\`, type: \`document\` };
  }
  return { path: segments.join(\`/\`), type: \`document\` };
};
export const serverTimestamp = () => timestamp(new Date().toISOString());

const snapshot = (id, data) => ({
  id,
  exists: () => Boolean(data),
  data: () => clone(data)
});
const fromPath = reference => {
  const parts = reference.path.split(\`/\`);
  const collectionName = parts.at(-2);
  const id = parts.at(-1);
  return { collectionName, id, data: store[collectionName]?.[id] };
};

export const getDoc = async reference => {
  if (reference.path.startsWith(\`nasna_companies/company-1/employeePrivate/\`)) {
    globalThis.__nasnaPrivateReads.push(reference.path);
  }
  if (reference.path === \`nasna_companies/company-1\`) {
    return snapshot(\`company-1\`, {
      id: \`company-1\`, ownerId: \`u1\`, nameEn: \`Dar Aldawa\`, nameAr: \`دار الدواء\`,
      country: \`JO\`, currency: \`JOD\`, timezone: \`Asia/Amman\`, status: \`active\`
    });
  }
  const record = fromPath(reference);
  return snapshot(record.id, record.data);
};

export const getDocs = async reference => {
  const collectionName = reference.path.split(\`/\`).at(-1);
  return {
    docs: Object.entries(store[collectionName] || {}).map(([id, data]) => ({
      id,
      data: () => clone(data)
    }))
  };
};

export const writeBatch = () => {
  const operations = [];
  return {
    set: (reference, data) => operations.push({ type: \`set\`, reference, data }),
    update: (reference, data) => operations.push({ type: \`update\`, reference, data }),
    commit: async () => {
      for (const operation of operations) {
        const record = fromPath(operation.reference);
        if (!store[record.collectionName]) store[record.collectionName] = {};
        if (operation.type === \`set\`) {
          store[record.collectionName][record.id] = clone(operation.data);
        } else {
          store[record.collectionName][record.id] = {
            ...store[record.collectionName][record.id],
            ...clone(operation.data)
          };
        }
      }
    }
  };
};
`;

const contentType = filePath => {
  const extension = path.extname(filePath);
  return {
    ".html": `text/html; charset=utf-8`,
    ".js": `application/javascript; charset=utf-8`,
    ".css": `text/css; charset=utf-8`,
    ".svg": `image/svg+xml`,
    ".png": `image/png`,
    ".xlsx": `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
    ".ttf": `font/ttf`
  }[extension] || `application/octet-stream`;
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://127.0.0.1`).pathname);
  const requestedFile = requestPath === `/`
    ? `index.html`
    : requestPath.replace(/^\//, ``);
  const filePath = path.resolve(root, requestedFile);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end(`Not found`);
    return;
  }
  response.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(response);
});

const installMocks = async (page, language = `en`) => {
  const pageErrors = [];
  page.on(`pageerror`, error => pageErrors.push(error.message));
  page.on(`requestfailed`, request => {
    pageErrors.push(`Request failed: ${request.url()} ${request.failure()?.errorText || ``}`);
  });
  page.on(`console`, message => {
    if (message.type() === `error`) pageErrors.push(message.text());
  });
  await page.setRequestInterception(true);
  page.on(`request`, request => {
    const url = request.url();
    if (process.env.NASNA_QA_DEBUG === `1`) {
      console.error(`request`, url);
    }
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js`) {
      request.respond({ contentType: `application/javascript`, body: authModule });
      return;
    }
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js`) {
      request.respond({ contentType: `application/javascript`, body: firestoreModule });
      return;
    }
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js`) {
      request.respond({ contentType: `application/javascript`, body: appModule });
      return;
    }
    if (url.includes(`/firebase-config.js`)) {
      request.respond({ contentType: `application/javascript`, body: firebaseConfigModule });
      return;
    }
    if (url.includes(`/firestore-config.js`)) {
      request.respond({ contentType: `application/javascript`, body: firestoreConfigModule });
      return;
    }
    if (url.startsWith(`https://fonts.googleapis.com`)) {
      request.respond({ contentType: `text/css`, body: `` });
      return;
    }
    if (url.startsWith(`https://fonts.gstatic.com`)) {
      request.respond({ contentType: `application/octet-stream`, body: `` });
      return;
    }
    request.continue();
  });
  await page.evaluateOnNewDocument(selectedLanguage => {
    localStorage.setItem(`nasna-language`, selectedLanguage);
  }, language);
  return pageErrors;
};

const fillEmployeeForm = async (page, values) => {
  await page.waitForFunction(() => {
    const modal = document.querySelector(`#employeeModal`);
    const employeeCode = document.querySelector(`#employeeCode`);
    return modal && !modal.hidden && employeeCode && !employeeCode.readOnly;
  });
  await page.evaluate(formValues => {
    const fields = {
      employeeCode: formValues.employeeCode,
      fullNameEn: formValues.fullNameEn,
      fullNameAr: formValues.fullNameAr,
      workEmail: formValues.workEmail,
      temporaryPassword: formValues.password || ``
    };
    Object.entries(fields).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (!field) return;
      field.value = value;
      field.dispatchEvent(new Event(`input`, { bubbles: true }));
      field.dispatchEvent(new Event(`change`, { bubbles: true }));
    });
  }, values);
  await page.select(`#positionId`, values.positionId);
  if (values.managerEmployeeId) {
    await page.select(`#managerEmployeeId`, values.managerEmployeeId);
  }
  await page.$eval(`#employeeForm`, form => form.requestSubmit());
  try {
    await page.waitForFunction(() => document.querySelector(`#employeeModal`).hidden);
  } catch (error) {
    console.error(JSON.stringify(await page.evaluate(() => ({
      formError: document.querySelector(`#employeeFormError`)?.textContent,
      formErrorHidden: document.querySelector(`#employeeFormError`)?.hidden,
      submitDisabled: document.querySelector(`#saveEmployeeButton`)?.disabled,
      modalHidden: document.querySelector(`#employeeModal`)?.hidden
    })), null, 2));
    throw error;
  }
};

const navigateWithoutLifecycleWait = async (page, url) => {
  const session = await page.createCDPSession();
  await session.send(`Page.navigate`, { url });
};

const run = async () => {
  await Promise.all([
    buildImportFile(validImportPath, `1995-05-12`),
    buildImportFile(invalidImportPath, `not-a-date`)
  ]);
  chromium.setGraphicsMode = false;
  const executablePath = fs.existsSync(`/tmp/chromium`)
    ? `/tmp/chromium`
    : await chromium.executablePath();
  await new Promise(resolve => server.listen(4173, `127.0.0.1`, resolve));
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true
  });
  const checks = {};

  try {
    const records = await browser.newPage();
    await records.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
    const recordErrors = await installMocks(records, `en`);
    await navigateWithoutLifecycleWait(
      records,
      `http://127.0.0.1:4173/people.html?v=${release}`
    );
    try {
      await records.waitForSelector(`#peopleApp:not([hidden])`, { timeout: 15000 });
    } catch (error) {
      console.error(JSON.stringify({
        url: records.url(),
        title: await records.title(),
        errors: recordErrors,
        readyState: await records.evaluate(() => document.readyState),
        body: (await records.$eval(`body`, body => body.innerText)).slice(0, 500)
      }, null, 2));
      throw error;
    }
    checks.hrCanOpenEmployeeRecords = await records.$eval(
      `#openEmployeeButton`,
      button => !button.hidden && !button.disabled
    );

    await records.click(`#openEmployeeButton`);
    await records.type(`#workEmail`, `basel@nasna.com`);
    checks.existingAccountDetected = await records.$eval(
      `#accountLinkNotice`,
      notice => !notice.hidden
    );
    await records.click(`#closeEmployeeModal`);
    await records.click(`#openEmployeeButton`);
    await fillEmployeeForm(records, {
      employeeCode: `HR-001`,
      fullNameEn: `Basel HR`,
      fullNameAr: `باسل الموارد البشرية`,
      workEmail: `basel@nasna.com`,
      positionId: `POS-HR`
    });
    checks.existingAdminLinkedWithoutNewAuth = await records.evaluate(() => (
      window.__nasnaCreatedAuthEmails.length === 0
      && window.__nasnaMockStore.employees[`HR-001`]?.authUid === `u1`
      && window.__nasnaMockStore.members.u1.employeeId === `HR-001`
    ));

    await records.click(`#openEmployeeButton`);
    await fillEmployeeForm(records, {
      employeeCode: `NEW-001`,
      fullNameEn: `New Employee`,
      fullNameAr: `موظف جديد`,
      workEmail: `new.employee@nasna.test`,
      password: `Nasna!23456`,
      positionId: `POS-EMP`,
      managerEmployeeId: `MGR-001`
    });
    checks.ordinaryEmployeeGetsLogin = await records.evaluate(() => (
      window.__nasnaCreatedAuthEmails.includes(`new.employee@nasna.test`)
      && window.__nasnaMockStore.employees[`NEW-001`]?.authUid === `new-auth-1`
      && window.__nasnaMockStore.members[`new-auth-1`]?.role === `employee`
      && window.__nasnaResetEmails.includes(`new.employee@nasna.test`)
    ));

    await records.click(`#openImportButton`);
    let fileInput = await records.$(`#importFile`);
    await fileInput.uploadFile(invalidImportPath);
    await records.waitForFunction(() => document.querySelector(`#invalidRowCount`).textContent === `1`);
    checks.invalidImportDateBlocked = await records.$eval(
      `#confirmImportButton`,
      button => button.disabled
    );
    await records.click(`#cancelImportButton`);
    await records.click(`#openImportButton`);
    fileInput = await records.$(`#importFile`);
    await fileInput.uploadFile(validImportPath);
    await records.waitForFunction(() => document.querySelector(`#validRowCount`).textContent === `1`);
    checks.validImportPreviewReady = await records.$eval(
      `#confirmImportButton`,
      button => !button.disabled
    );
    await records.click(`#cancelImportButton`);

    await records.screenshot({
      path: path.join(root, `qa-people-desktop.png`),
      fullPage: true
    });
    checks.recordsNoHorizontalOverflow = await records.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ));
    checks.recordsRuntimeClean = recordErrors.length === 0;
    if (recordErrors.length) {
      throw new Error(`Records page errors: ${recordErrors.join(` | `)}`);
    }

    const profile = await browser.newPage();
    await profile.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const profileErrors = await installMocks(profile, `en`);
    await navigateWithoutLifecycleWait(
      profile,
      `http://127.0.0.1:4173/employee.html?actor=manager&v=${release}`
    );
    await profile.waitForSelector(`#peopleApp:not([hidden])`, { timeout: 15000 });
    checks.managerHasEmployeeProfile = await profile.evaluate(() => (
      document.querySelector(`#profileName`).textContent === `Mona Manager`
      && !document.querySelector(`#myTeamNav`).hidden
      && window.__nasnaPrivateReads.every(path => !path.endsWith(`/EMP-001`))
    ));
    checks.profileRuntimeClean = profileErrors.length === 0;
    if (profileErrors.length) {
      throw new Error(`Profile page errors: ${profileErrors.join(` | `)}`);
    }

    const team = await browser.newPage();
    await team.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    const teamErrors = await installMocks(team, `ar`);
    await navigateWithoutLifecycleWait(
      team,
      `http://127.0.0.1:4173/team.html?actor=manager&v=${release}`
    );
    await team.waitForSelector(`#peopleApp:not([hidden])`, { timeout: 15000 });
    checks.separateManagerWorkspace = await team.evaluate(() => (
      document.documentElement.dir === `rtl`
      && document.querySelector(`#managerName`).textContent === `منى المديرة`
      && document.querySelectorAll(`.team-member-button`).length === 1
      && window.__nasnaPrivateReads.length === 0
    ));
    await team.click(`.team-member-button`);
    checks.managerSeesSafeReportDetails = await team.evaluate(() => (
      !document.querySelector(`#teamDetailContent`).hidden
      && document.querySelector(`#teamMemberName`).textContent === `عمر الموظف`
      && window.__nasnaPrivateReads.length === 0
    ));
    checks.teamNoHorizontalOverflow = await team.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ));
    await team.screenshot({
      path: path.join(root, `qa-team-mobile.png`),
      fullPage: true
    });
    checks.teamRuntimeClean = teamErrors.length === 0;
    if (teamErrors.length) {
      throw new Error(`Team page errors: ${teamErrors.join(` | `)}`);
    }

    console.log(JSON.stringify(checks, null, 2));
    if (Object.values(checks).some(value => value !== true)) {
      throw new Error(`One or more Stage 07 UI checks failed.`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
