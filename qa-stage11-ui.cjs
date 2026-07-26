const fs = require(`node:fs`);
const http = require(`node:http`);
const path = require(`node:path`);
const puppeteer = require(`puppeteer-core`);
const chromium = require(`@sparticuz/chromium`).default;

const root = __dirname;
const release = `20260727.1`;
const mockCore = fs.readFileSync(
  path.join(root, `qa-stage11-time-core.js`),
  `utf8`
);

const contentType = filePath => ({
  ".html": `text/html; charset=utf-8`,
  ".js": `application/javascript; charset=utf-8`,
  ".css": `text/css; charset=utf-8`,
  ".svg": `image/svg+xml`,
  ".png": `image/png`,
  ".ttf": `font/ttf`,
  ".webmanifest": `application/manifest+json`
})[path.extname(filePath)] || `application/octet-stream`;

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(
    new URL(request.url, `http://127.0.0.1`).pathname
  );
  if (requestPath === `/qa-stage11-blank.html`) {
    response.writeHead(200, { "Content-Type": `text/html; charset=utf-8` });
    response.end(`<!doctype html><html><body></body></html>`);
    return;
  }
  const requestedFile = requestPath === `/`
    ? `index.html`
    : requestPath.replace(/^\//, ``);
  const filePath = path.resolve(root, requestedFile);
  if (
    !filePath.startsWith(root)
    || !fs.existsSync(filePath)
    || fs.statSync(filePath).isDirectory()
  ) {
    response.writeHead(404);
    response.end(`Not found`);
    return;
  }
  response.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(response);
});

const openPage = async (
  browser,
  pageName,
  actor,
  language,
  viewport,
  extraQuery = ``
) => {
  const page = await browser.newPage();
  const errors = [];
  await page.setViewport(viewport);
  page.on(`pageerror`, error => errors.push(error.stack || error.message));
  page.on(`requestfailed`, request => {
    errors.push(
      `Request failed: ${request.url()} ${request.failure()?.errorText || ``}`
    );
  });
  page.on(`console`, message => {
    if (message.type() === `error`) errors.push(message.text());
  });
  await page.setRequestInterception(true);
  page.on(`request`, request => {
    const url = new URL(request.url());
    if (url.pathname.endsWith(`/time-core.js`)) {
      request.respond({
        contentType: `application/javascript`,
        body: mockCore
      });
      return;
    }
    if (url.hostname === `fonts.googleapis.com`) {
      request.respond({ contentType: `text/css`, body: `` });
      return;
    }
    if (url.hostname === `fonts.gstatic.com`) {
      request.respond({ contentType: `application/octet-stream`, body: `` });
      return;
    }
    request.continue();
  });
  await page.evaluateOnNewDocument(selectedLanguage => {
    localStorage.setItem(`nasna-language`, selectedLanguage);
  }, language);
  await page.goto(
    `http://127.0.0.1:4176/${pageName}.html?actor=${actor}&v=${release}${extraQuery ? `&${extraQuery}` : ``}`,
    { waitUntil: `networkidle0`, timeout: 15000 }
  );
  await page.waitForSelector(`#timeApp:not([hidden])`, { timeout: 15000 });
  return { page, errors };
};

const noPageOverflow = page => page.evaluate(() => (
  document.documentElement.scrollWidth
    <= document.documentElement.clientWidth
));

const verifyProductionCoreImport = async browser => {
  const page = await browser.newPage();
  const errors = [];
  page.on(`pageerror`, error => errors.push(error.stack || error.message));
  await page.setRequestInterception(true);
  page.on(`request`, request => {
    const url = request.url();
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js`) {
      request.respond({
        contentType: `application/javascript`,
        body: `
          export const onAuthStateChanged = () => () => undefined;
          export const signOut = async () => undefined;
        `
      });
      return;
    }
    if (url === `https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js`) {
      request.respond({
        contentType: `application/javascript`,
        body: `
          export class Timestamp {
            static fromDate(value) { return { toDate: () => value }; }
          }
          export const collection = () => ({});
          export const doc = () => ({});
          export const getDoc = async () => ({ exists: () => false });
          export const getDocs = async () => ({ docs: [], empty: true });
          export const limit = () => ({});
          export const orderBy = () => ({});
          export const query = value => value;
          export const runTransaction = async () => undefined;
          export const serverTimestamp = () => new Date();
          export const where = () => ({});
          export const writeBatch = () => ({});
        `
      });
      return;
    }
    if (url.includes(`/firebase-config.js`)) {
      request.respond({
        contentType: `application/javascript`,
        body: `export const auth = { languageCode: \`en\` };`
      });
      return;
    }
    if (url.includes(`/firestore-config.js`)) {
      request.respond({
        contentType: `application/javascript`,
        body: `export const db = {};`
      });
      return;
    }
    request.continue();
  });
  await page.goto(`http://127.0.0.1:4176/qa-stage11-blank.html`);
  const productionCore = await page.evaluate(async version => {
    const module = await import(`./time-core.js?v=${version}&parse=1`);
    module.state.policy = {
      weekStartsOn: 1,
      maxDailyMinutes: 720,
      maxWeeklyMinutes: 2880,
      minRestMinutes: 660,
      conflictMode: `block`,
      holidayWorkMode: `warn`
    };
    module.state.holidays = [];
    const assignment = (id, workDate, startAt, endAt) => ({
      id,
      employeeId: `EMP-QA`,
      branchId: `MAIN`,
      workDate,
      status: `draft`,
      totalMinutes: 480,
      segments: [{
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        breakMinutes: 0
      }]
    });
    const ordinaryWeek = [
      [`2026-07-27`, `2026-07-27T06:00:00Z`, `2026-07-27T14:00:00Z`],
      [`2026-07-28`, `2026-07-28T06:00:00Z`, `2026-07-28T14:00:00Z`],
      [`2026-07-29`, `2026-07-29T06:00:00Z`, `2026-07-29T14:00:00Z`],
      [`2026-07-30`, `2026-07-30T06:00:00Z`, `2026-07-30T14:00:00Z`],
      [`2026-07-31`, `2026-07-31T06:00:00Z`, `2026-07-31T14:00:00Z`]
    ].map((row, index) => assignment(`WEEK-${index}`, ...row));
    const ordinaryConflicts = module.evaluateRosterConflicts(
      ordinaryWeek,
      []
    );
    const shortRestConflicts = module.evaluateRosterConflicts([
      assignment(
        `REST-1`,
        `2026-07-27`,
        `2026-07-27T14:00:00Z`,
        `2026-07-27T22:00:00Z`
      ),
      assignment(
        `REST-2`,
        `2026-07-28`,
        `2026-07-28T06:00:00Z`,
        `2026-07-28T14:00:00Z`
      )
    ], []);
    return {
      release: module.release,
      ordinaryWeekAccepted: !ordinaryConflicts.some(
        conflict => conflict.code === `weekly_limit`
      ),
      draftToDraftRestDetected: shortRestConflicts.some(
        conflict => conflict.code === `minimum_rest`
      )
    };
  }, release);
  await page.close();
  return {
    imports: productionCore.release === release && errors.length === 0,
    ordinaryWeekAccepted: productionCore.ordinaryWeekAccepted,
    draftToDraftRestDetected: productionCore.draftToDraftRestDetected
  };
};

const run = async () => {
  chromium.setGraphicsMode = false;
  const executablePath = fs.existsSync(`/tmp/chromium`)
    ? `/tmp/chromium`
    : await chromium.executablePath();
  await new Promise(resolve => server.listen(4176, `127.0.0.1`, resolve));
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true
  });
  const checks = {};

  try {
    const productionCore = await verifyProductionCoreImport(browser);
    checks.productionTimeCoreImportsInBrowser = productionCore.imports;
    checks.ordinaryWeekDoesNotDoubleCountDraftMinutes =
      productionCore.ordinaryWeekAccepted;
    checks.minimumRestChecksAdjacentDraftShifts =
      productionCore.draftToDraftRestDetected;
    const employee = await openPage(
      browser,
      `schedule`,
      `employee`,
      `en`,
      { width: 1440, height: 1000, deviceScaleFactor: 1 }
    );
    checks.employeeOnlySeesOwnPublishedSchedule = await employee.page.evaluate(() => (
      document.querySelector(`#scheduledDays`).textContent === `2`
      && document.querySelector(`#splitShiftCount`).textContent === `1`
      && document.querySelector(`#holidayCount`).textContent === `1`
      && document.querySelectorAll(`.schedule-day .shift-actions`).length === 2
      && document.querySelector(`#teamScheduleNav`).hidden
    ));
    checks.employeeRequestLinksCarryAssignmentContext = await employee.page.evaluate(() => (
      [...document.querySelectorAll(`.shift-action-link`)].every(link => (
        link.href.includes(`assignmentId=`)
        && link.href.includes(`workDate=`)
      ))
    ));
    checks.employeeDesktopNoOverflow = await noPageOverflow(employee.page);
    checks.employeeRuntimeClean = employee.errors.length === 0;
    await employee.page.screenshot({
      path: path.join(root, `qa-stage11-employee-desktop.png`),
      fullPage: true
    });
    await employee.page.close();

    const manager = await openPage(
      browser,
      `team-schedule`,
      `manager`,
      `ar`,
      {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      }
    );
    checks.managerHasSeparateEmployeeAndTeamScreens = await manager.page.evaluate(() => (
      document.documentElement.dir === `rtl`
      && document.body.textContent.includes(`تبقى موظفًا`)
      && document.querySelector(`a[href^="schedule.html"]`)
      && document.querySelectorAll(`.employee-cell`).length === 2
      && document.querySelector(`#timeAdminNav`).hidden
    ));
    checks.managerCannotSeeOtherManagerScopeSelector = await manager.page.evaluate(() => (
      document.querySelector(`#plannerScope`).hidden
    ));
    await manager.page.click(`#saveRosterButton`);
    await manager.page.waitForFunction(() => (
      document.querySelector(`#publishRosterButton`).disabled === false
    ));
    await manager.page.click(`#publishRosterButton`);
    await manager.page.waitForFunction(() => (
      document.querySelector(`#toast`).classList.contains(`is-visible`)
    ));
    checks.managerCanSaveAndPublishRoster = await manager.page.evaluate(() => (
      document.querySelector(`#rosterMeta`).textContent.length > 0
    ));
    checks.managerMobileNoPageOverflow = await noPageOverflow(manager.page);
    checks.managerRuntimeClean = manager.errors.length === 0;
    await manager.page.screenshot({
      path: path.join(root, `qa-stage11-manager-mobile.png`),
      fullPage: true
    });
    await manager.page.close();

    const resumableManager = await openPage(
      browser,
      `team-schedule`,
      `manager`,
      `en`,
      { width: 1000, height: 900, deviceScaleFactor: 1 },
      `interruptPublish=1`
    );
    await resumableManager.page.click(`#saveRosterButton`);
    await resumableManager.page.waitForFunction(() => (
      document.querySelector(`#publishRosterButton`).disabled === false
    ));
    await resumableManager.page.click(`#publishRosterButton`);
    await resumableManager.page.waitForFunction(() => (
      document.querySelector(`#rosterStatus`).textContent === `Publishing`
      && document.querySelector(`#publishRosterButton`).textContent
        === `Resume publishing`
      && document.querySelector(`#saveRosterButton`).disabled
    ));
    checks.interruptedPublishShowsResumableProgress =
      await resumableManager.page.evaluate(() => (
        document.querySelector(`#rosterMeta`).textContent.includes(`/`)
        && !document.querySelector(`#publishRosterButton`).disabled
      ));
    await resumableManager.page.click(`#publishRosterButton`);
    await resumableManager.page.waitForFunction(() => (
      document.querySelector(`#rosterStatus`).textContent === `Published`
    ));
    checks.resumedPublishCompletesWithoutDuplicateUiState =
      await resumableManager.page.evaluate(() => (
        document.querySelector(`#publishRosterButton`).disabled
        && !document.querySelector(`#saveRosterButton`).disabled
      ));
    checks.resumableManagerRuntimeClean =
      resumableManager.errors.every(error => (
        error.includes(`NASNA roster publish error.`)
        && error.includes(`roster-publish-incomplete`)
      ));
    await resumableManager.page.close();

    const admin = await openPage(
      browser,
      `time-admin`,
      `admin`,
      `en`,
      { width: 1440, height: 1100, deviceScaleFactor: 1 }
    );
    checks.hrOwnsCalendarAndShiftConfiguration = await admin.page.evaluate(() => (
      document.querySelector(`#policyVersion`).textContent === `v1`
      && document.querySelector(`#activeTemplateCount`).textContent === `2`
      && document.querySelector(`#templateList`).children.length === 2
      && document.querySelector(`#requestServiceStatus`).textContent === `Active`
      && document.querySelector(`#activateRequestsButton`).disabled
    ));
    checks.hrHasSeparateScheduleAndAdminNavigation = await admin.page.evaluate(() => (
      Boolean(document.querySelector(`a[href^="schedule.html"]`))
      && Boolean(document.querySelector(`a[href^="team-schedule.html"]`))
      && Boolean(document.querySelector(`a[href^="time-admin.html"]`))
    ));
    checks.adminDesktopNoOverflow = await noPageOverflow(admin.page);
    checks.adminRuntimeClean = admin.errors.length === 0;
    await admin.page.screenshot({
      path: path.join(root, `qa-stage11-admin-desktop.png`),
      fullPage: true
    });
    await admin.page.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  console.log(JSON.stringify(checks, null, 2));
  if (failed.length) {
    throw new Error(`Stage 11 UI QA failed: ${failed.join(`, `)}`);
  }
  console.log(`Stage 11 responsive UI QA passed.`);
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
