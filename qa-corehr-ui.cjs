const fs = require(`node:fs`);
const http = require(`node:http`);
const path = require(`node:path`);
const puppeteer = require(`puppeteer-core`);
const chromium = require(`@sparticuz/chromium`).default;

const root = __dirname;
const release = `20260726.1`;

const authModule = `
const actor = new URLSearchParams(location.search).get(\`actor\`) || \`admin\`;
const users = {
  admin: { uid: \`u1\`, email: \`basel@nasna.com\` },
  manager: { uid: \`manager-uid\`, email: \`manager@nasna.test\` },
  employee: { uid: \`employee-uid\`, email: \`employee@nasna.test\` }
};
const currentUser = users[actor];
export const onAuthStateChanged = (_auth, callback) => {
  queueMicrotask(() => callback(currentUser));
  return () => undefined;
};
export const signOut = async () => undefined;
`;

const firebaseConfigModule = `
const actor = new URLSearchParams(location.search).get(\`actor\`) || \`admin\`;
const users = {
  admin: { uid: \`u1\`, email: \`basel@nasna.com\` },
  manager: { uid: \`manager-uid\`, email: \`manager@nasna.test\` },
  employee: { uid: \`employee-uid\`, email: \`employee@nasna.test\` }
};
export const auth = {
  currentUser: users[actor],
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
const base = (id, extra = {}) => ({
  id,
  companyId: \`company-1\`,
  code: id,
  status: \`active\`,
  createdAt: timestamp(\`2026-01-01T00:00:00Z\`),
  createdBy: \`u1\`,
  updatedAt: timestamp(\`2026-01-01T00:00:00Z\`),
  updatedBy: \`u1\`,
  ...extra
});
const employee = (id, extra) => ({
  id,
  companyId: \`company-1\`,
  employeeCode: id,
  authUid: extra.authUid,
  accessStatus: \`active\`,
  fullNameEn: extra.fullNameEn,
  fullNameAr: extra.fullNameAr,
  workEmail: extra.workEmail,
  workPhone: \`+962790000000\`,
  positionId: extra.positionId,
  jobTitleId: extra.jobTitleId,
  branchId: \`MAIN\`,
  locationId: \`HQ\`,
  departmentId: \`PEOPLE\`,
  teamId: \`CORE\`,
  managerEmployeeId: extra.managerEmployeeId || \`\`,
  hireDate: timestamp(\`2026-01-01T00:00:00Z\`),
  employmentType: \`permanent\`,
  employmentStatus: \`active\`,
  workMode: extra.workMode || \`onsite\`,
  createdAt: timestamp(\`2026-01-01T00:00:00Z\`),
  createdBy: \`u1\`,
  updatedAt: timestamp(\`2026-01-01T00:00:00Z\`),
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
  employees: {
    [\`MGR-001\`]: employee(\`MGR-001\`, {
      authUid: \`manager-uid\`,
      fullNameEn: \`Mona Manager\`,
      fullNameAr: \`منى المديرة\`,
      workEmail: \`manager@nasna.test\`,
      positionId: \`POS-MGR\`,
      jobTitleId: \`TITLE-MGR\`
    }),
    [\`EMP-001\`]: employee(\`EMP-001\`, {
      authUid: \`employee-uid\`,
      fullNameEn: \`Omar Employee\`,
      fullNameAr: \`عمر الموظف\`,
      workEmail: \`employee@nasna.test\`,
      positionId: \`POS-EMP\`,
      jobTitleId: \`TITLE-EMP\`,
      managerEmployeeId: \`MGR-001\`,
      workMode: \`hybrid\`
    })
  },
  positions: {
    [\`POS-MGR\`]: base(\`POS-MGR\`, {
      jobTitleId: \`TITLE-MGR\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 1
    }),
    [\`POS-EMP\`]: base(\`POS-EMP\`, {
      jobTitleId: \`TITLE-EMP\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 5
    }),
    [\`POS-SR\`]: base(\`POS-SR\`, {
      jobTitleId: \`TITLE-SR\`, branchId: \`MAIN\`, locationId: \`HQ\`,
      departmentId: \`PEOPLE\`, teamId: \`CORE\`, headcount: 2
    })
  },
  jobTitles: {
    [\`TITLE-MGR\`]: base(\`TITLE-MGR\`, {
      gradeId: \`G1\`, nameEn: \`Team Lead\`, nameAr: \`قائد فريق\`
    }),
    [\`TITLE-EMP\`]: base(\`TITLE-EMP\`, {
      gradeId: \`G1\`, nameEn: \`People Specialist\`, nameAr: \`أخصائي موظفين\`
    }),
    [\`TITLE-SR\`]: base(\`TITLE-SR\`, {
      gradeId: \`G2\`, nameEn: \`Senior People Specialist\`, nameAr: \`أخصائي موظفين أول\`
    })
  },
  employeeDocuments: {
    [\`DOC-SHARED\`]: {
      id: \`DOC-SHARED\`, companyId: \`company-1\`, employeeId: \`EMP-001\`,
      employeeAuthUid: \`employee-uid\`, type: \`contract\`,
      title: \`Employment contract\`, documentNumber: \`CON-001\`,
      issueDate: timestamp(\`2026-01-01T00:00:00Z\`),
      expiryDate: timestamp(\`2027-01-01T00:00:00Z\`),
      linkUrl: \`https://files.example.test/contract\`, visibility: \`employee\`,
      status: \`active\`, createdAt: timestamp(\`2026-01-01T00:00:00Z\`),
      createdBy: \`u1\`, updatedAt: timestamp(\`2026-01-01T00:00:00Z\`), updatedBy: \`u1\`
    },
    [\`DOC-HR\`]: {
      id: \`DOC-HR\`, companyId: \`company-1\`, employeeId: \`EMP-001\`,
      employeeAuthUid: \`employee-uid\`, type: \`national_id\`,
      title: \`Identity record\`, documentNumber: \`ID-001\`,
      issueDate: timestamp(\`2026-01-01T00:00:00Z\`), expiryDate: null,
      linkUrl: \`\`, visibility: \`hr_only\`, status: \`active\`,
      createdAt: timestamp(\`2026-01-01T00:00:00Z\`), createdBy: \`u1\`,
      updatedAt: timestamp(\`2026-01-01T00:00:00Z\`), updatedBy: \`u1\`
    }
  },
  employeeMovements: {
    [\`MOVE-OWN\`]: {
      id: \`MOVE-OWN\`, companyId: \`company-1\`, employeeId: \`EMP-001\`,
      employeeAuthUid: \`employee-uid\`, movementType: \`work_mode_change\`,
      effectiveDate: timestamp(\`2026-07-01T00:00:00Z\`),
      reason: \`Approved hybrid work arrangement\`,
      previousPositionId: \`POS-EMP\`, newPositionId: \`POS-EMP\`,
      previousManagerEmployeeId: \`MGR-001\`, newManagerEmployeeId: \`MGR-001\`,
      previousEmploymentType: \`permanent\`, newEmploymentType: \`permanent\`,
      previousEmploymentStatus: \`active\`, newEmploymentStatus: \`active\`,
      previousWorkMode: \`onsite\`, newWorkMode: \`hybrid\`,
      createdAt: timestamp(\`2026-07-01T00:00:00Z\`), createdBy: \`u1\`
    }
  },
  auditLogs: {}
};

let autoId = 0;
const clone = value => {
  if (Array.isArray(value)) return value.map(clone);
  if (value instanceof Timestamp) return new Timestamp(new Date(value.date));
  if (value && typeof value === \`object\`) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
};
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

export const collection = (_db, ...segments) => ({
  path: segments.join(\`/\`),
  type: \`collection\`,
  filters: []
});
export const doc = (first, ...segments) => {
  if (first?.type === \`collection\`) {
    autoId += 1;
    return { path: \`\${first.path}/auto-\${autoId}\`, type: \`document\` };
  }
  return { path: segments.join(\`/\`), type: \`document\` };
};
export const where = (field, operator, value) => ({ field, operator, value });
export const query = (reference, ...filters) => ({ ...reference, filters });
export const serverTimestamp = () => timestamp(new Date().toISOString());

export const getDoc = async reference => {
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
  const filters = reference.filters || [];
  const entries = Object.entries(store[collectionName] || {}).filter(([, data]) => (
    filters.every(filter => filter.operator === \`==\` && data[filter.field] === filter.value)
  ));
  return {
    docs: entries.map(([id, data]) => ({ id, data: () => clone(data) }))
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
        store[record.collectionName][record.id] = operation.type === \`set\`
          ? clone(operation.data)
          : { ...store[record.collectionName][record.id], ...clone(operation.data) };
      }
    }
  };
};
`;

const contentType = filePath => ({
  ".html": `text/html; charset=utf-8`,
  ".js": `application/javascript; charset=utf-8`,
  ".css": `text/css; charset=utf-8`,
  ".svg": `image/svg+xml`,
  ".png": `image/png`,
  ".ttf": `font/ttf`
})[path.extname(filePath)] || `application/octet-stream`;

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://127.0.0.1`).pathname);
  const requestedFile = requestPath === `/` ? `index.html` : requestPath.replace(/^\//, ``);
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
  const errors = [];
  page.on(`pageerror`, error => errors.push(error.message));
  page.on(`requestfailed`, request => {
    errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText || ``}`);
  });
  page.on(`console`, message => {
    if (message.type() === `error`) errors.push(message.text());
  });
  await page.setRequestInterception(true);
  page.on(`request`, request => {
    const url = request.url();
    if (process.env.NASNA_QA_DEBUG === `1`) console.error(`request`, url);
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js`) {
      request.respond({ contentType: `application/javascript`, body: authModule });
      return;
    }
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js`) {
      request.respond({ contentType: `application/javascript`, body: firestoreModule });
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
  return errors;
};

const openPage = async (browser, pageName, actor, language, viewport) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = await installMocks(page, language);
  const session = await page.createCDPSession();
  await session.send(`Page.navigate`, {
    url: `http://127.0.0.1:4174/${pageName}.html?actor=${actor}&v=${release}`
  });
  try {
    await page.waitForSelector(`#recordsApp:not([hidden])`, { timeout: 15000 });
  } catch (error) {
    console.error(JSON.stringify({
      pageName,
      actor,
      url: page.url(),
      errors,
      readyState: await page.evaluate(() => document.readyState),
      body: (await page.$eval(`body`, element => element.innerText)).slice(0, 800)
    }, null, 2));
    throw error;
  }
  return { page, errors };
};

const noOverflow = page => page.evaluate(() => (
  document.documentElement.scrollWidth <= document.documentElement.clientWidth
));

const run = async () => {
  chromium.setGraphicsMode = false;
  const executablePath = fs.existsSync(`/tmp/chromium`)
    ? `/tmp/chromium`
    : await chromium.executablePath();
  await new Promise(resolve => server.listen(4174, `127.0.0.1`, resolve));
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true
  });
  const checks = {};

  try {
    const adminDocuments = await openPage(
      browser,
      `documents`,
      `admin`,
      `en`,
      { width: 1440, height: 1000, deviceScaleFactor: 1 }
    );
    checks.hrCanManageDocuments = await adminDocuments.page.$eval(
      `#openDocumentButton`,
      button => !button.hidden && !button.disabled
    );
    await adminDocuments.page.click(`#openDocumentButton`);
    await adminDocuments.page.select(`#documentEmployeeId`, `EMP-001`);
    await adminDocuments.page.type(`#documentTitle`, `Professional certificate`);
    await adminDocuments.page.type(`#documentNumber`, `CERT-001`);
    await adminDocuments.page.type(`#documentIssueDate`, `2026-07-01`);
    await adminDocuments.page.type(`#documentExpiryDate`, `2027-07-01`);
    await adminDocuments.page.type(`#documentLinkUrl`, `http://unsafe.example.test/file`);
    await adminDocuments.page.$eval(`#documentForm`, form => form.requestSubmit());
    checks.insecureReferenceBlocked = await adminDocuments.page.$eval(
      `#documentFormError`,
      element => !element.hidden && element.textContent.includes(`HTTPS`)
    );
    await adminDocuments.page.$eval(`#documentLinkUrl`, element => { element.value = ``; });
    await adminDocuments.page.type(`#documentLinkUrl`, `https://files.example.test/certificate`);
    await adminDocuments.page.$eval(`#documentForm`, form => form.requestSubmit());
    await adminDocuments.page.waitForFunction(() => document.querySelector(`#documentModal`).hidden);
    checks.documentAndAuditSavedAtomically = await adminDocuments.page.evaluate(() => (
      Object.keys(globalThis.__nasnaMockStore.employeeDocuments).length === 3
      && Object.keys(globalThis.__nasnaMockStore.auditLogs).length === 1
    ));
    checks.documentsDesktopNoOverflow = await noOverflow(adminDocuments.page);
    checks.documentsDesktopRuntimeClean = adminDocuments.errors.length === 0;
    await adminDocuments.page.screenshot({
      path: path.join(root, `qa-corehr-documents-desktop.png`),
      fullPage: true
    });

    const employeeDocuments = await openPage(
      browser,
      `documents`,
      `employee`,
      `ar`,
      { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    );
    checks.employeeSeesOnlyOwnSharedDocuments = await employeeDocuments.page.evaluate(() => (
      document.documentElement.dir === `rtl`
      && document.querySelector(`#openDocumentButton`).hidden
      && document.querySelectorAll(`.document-card`).length === 1
      && !document.querySelector(`[data-action="edit-document"]`)
      && document.querySelector(`#documentsGrid`).textContent.includes(`Employment contract`)
      && !document.querySelector(`#documentsGrid`).textContent.includes(`Identity record`)
    ));
    checks.documentsMobileNoOverflow = await noOverflow(employeeDocuments.page);
    checks.documentsMobileRuntimeClean = employeeDocuments.errors.length === 0;
    await employeeDocuments.page.screenshot({
      path: path.join(root, `qa-corehr-documents-mobile.png`),
      fullPage: true
    });

    const managerDocuments = await openPage(
      browser,
      `documents`,
      `manager`,
      `en`,
      { width: 1100, height: 800, deviceScaleFactor: 1 }
    );
    checks.managerHasNoHrDocumentControls = await managerDocuments.page.evaluate(() => (
      document.querySelector(`#openDocumentButton`).hidden
      && document.querySelectorAll(`.document-card`).length === 0
    ));
    checks.managerDocumentsRuntimeClean = managerDocuments.errors.length === 0;

    const adminLifecycle = await openPage(
      browser,
      `lifecycle`,
      `admin`,
      `en`,
      { width: 1440, height: 1000, deviceScaleFactor: 1 }
    );
    checks.hrCanApplyMovement = await adminLifecycle.page.$eval(
      `#openMovementButton`,
      button => !button.hidden && !button.disabled
    );
    await adminLifecycle.page.click(`#openMovementButton`);
    await adminLifecycle.page.select(`#movementEmployeeId`, `EMP-001`);
    await adminLifecycle.page.select(`#movementType`, `promotion`);
    await adminLifecycle.page.select(`#movementPositionId`, `POS-SR`);
    await adminLifecycle.page.type(`#movementReason`, `Promotion after approved review`);
    await adminLifecycle.page.$eval(`#movementForm`, form => form.requestSubmit());
    await adminLifecycle.page.waitForFunction(() => document.querySelector(`#movementModal`).hidden);
    checks.movementUpdatesEmployeeAndWritesHistory = await adminLifecycle.page.evaluate(() => {
      const store = globalThis.__nasnaMockStore;
      const employeeRecord = store.employees[`EMP-001`];
      const movement = Object.values(store.employeeMovements).find(record => (
        record.id !== `MOVE-OWN`
      ));
      return employeeRecord.positionId === `POS-SR`
        && employeeRecord.jobTitleId === `TITLE-SR`
        && employeeRecord.lastMovementId === movement?.id
        && movement?.previousPositionId === `POS-EMP`
        && movement?.newPositionId === `POS-SR`
        && Object.keys(store.auditLogs).length === 1;
    });
    checks.lifecycleDesktopNoOverflow = await noOverflow(adminLifecycle.page);
    checks.lifecycleDesktopRuntimeClean = adminLifecycle.errors.length === 0;
    await adminLifecycle.page.screenshot({
      path: path.join(root, `qa-corehr-lifecycle-desktop.png`),
      fullPage: true
    });

    const employeeLifecycle = await openPage(
      browser,
      `lifecycle`,
      `employee`,
      `ar`,
      { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    );
    checks.employeeSeesOnlyOwnImmutableHistory = await employeeLifecycle.page.evaluate(() => (
      document.documentElement.dir === `rtl`
      && document.querySelector(`#openMovementButton`).hidden
      && document.querySelectorAll(`.movement-card`).length === 1
      && document.querySelector(`#movementsList`).textContent.includes(`Approved hybrid work arrangement`)
    ));
    checks.lifecycleMobileNoOverflow = await noOverflow(employeeLifecycle.page);
    checks.lifecycleMobileRuntimeClean = employeeLifecycle.errors.length === 0;
    await employeeLifecycle.page.screenshot({
      path: path.join(root, `qa-corehr-lifecycle-mobile.png`),
      fullPage: true
    });

    const managerLifecycle = await openPage(
      browser,
      `lifecycle`,
      `manager`,
      `en`,
      { width: 1100, height: 800, deviceScaleFactor: 1 }
    );
    checks.managerCannotManageTeamLifecycle = await managerLifecycle.page.evaluate(() => (
      document.querySelector(`#openMovementButton`).hidden
      && document.querySelectorAll(`.movement-card`).length === 0
    ));
    checks.managerLifecycleRuntimeClean = managerLifecycle.errors.length === 0;

    if (Object.values(checks).some(value => value !== true)) {
      throw new Error(`One or more Stage 08/09 UI checks failed: ${JSON.stringify(checks)}`);
    }
    console.log(JSON.stringify(checks, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
