const fs = require(`node:fs`);
const http = require(`node:http`);
const path = require(`node:path`);
const puppeteer = require(`puppeteer-core`);
const chromium = require(`@sparticuz/chromium`).default;

const root = __dirname;
const release = `20260726.4`;
const mockCore = fs.readFileSync(
  path.join(root, `qa-stage10-workflow-core.js`),
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
  if (requestPath === `/qa-stage10-blank.html`) {
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

const installMocks = async (page, language) => {
  const errors = [];
  page.on(`dialog`, dialog => dialog.accept());
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
    if (url.pathname.endsWith(`/workflow-core.js`)) {
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
  return errors;
};

const openPage = async (
  browser,
  pageName,
  actor,
  language,
  viewport
) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = await installMocks(page, language);
  const session = await page.createCDPSession();
  await session.send(`Runtime.enable`);
  session.on(`Runtime.exceptionThrown`, event => {
    const details = event.exceptionDetails;
    errors.push(
      `${details.url || `unknown`}:${Number(details.lineNumber) + 1}:`
      + `${Number(details.columnNumber) + 1} `
      + `${details.exception?.description || details.text}`
    );
  });
  await page.goto(
    `http://127.0.0.1:4175/${pageName}.html?actor=${actor}&v=${release}`,
    { waitUntil: `networkidle0`, timeout: 15000 }
  );
  try {
    await page.waitForSelector(`#workflowApp:not([hidden])`, { timeout: 15000 });
  } catch (error) {
    console.error(JSON.stringify({
      pageName,
      actor,
      errors,
      readyState: await page.evaluate(() => document.readyState),
      body: (await page.$eval(`body`, element => element.innerText)).slice(0, 1000)
    }, null, 2));
    throw error;
  }
  return { page, errors };
};

const noOverflow = page => page.evaluate(() => (
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
          export const startAfter = () => ({});
          export const updateDoc = async () => undefined;
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
  await page.goto(`http://127.0.0.1:4175/qa-stage10-blank.html`);
  const importedRelease = await page.evaluate(async version => {
    const module = await import(`./workflow-core.js?v=${version}&parse=1`);
    return module.release;
  }, release);
  await page.close();
  return importedRelease === release && errors.length === 0;
};

const run = async () => {
  chromium.setGraphicsMode = false;
  const executablePath = fs.existsSync(`/tmp/chromium`)
    ? `/tmp/chromium`
    : await chromium.executablePath();
  await new Promise(resolve => server.listen(4175, `127.0.0.1`, resolve));
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true
  });
  const checks = {};

  try {
    checks.productionCoreImportsInBrowser = await verifyProductionCoreImport(browser);
    const employee = await openPage(
      browser,
      `requests`,
      `employee`,
      `en`,
      { width: 1440, height: 1000, deviceScaleFactor: 1 }
    );
    checks.employeeCatalogIsStage10Only = await employee.page.evaluate(() => {
      const cards = [
        ...document.querySelectorAll(`#catalogGrid [data-type-id]`)
      ];
      return cards.length === 2
        && cards.some(card => card.dataset.typeId === `general_hr__v1`)
        && cards.some(card => card.dataset.typeId === `confidential_request__v1`)
        && !cards.some(card => card.dataset.typeId === `team_movement__v1`);
    });
    await employee.page.click(
      `#catalogGrid [data-type-id="general_hr__v1"]`
    );
    await employee.page.type(`#field-details`, `A new tracked HR request`);
    await employee.page.$eval(`#requestForm`, form => form.requestSubmit());
    await employee.page.waitForFunction(() => (
      document.querySelector(`#requestModal`).hidden
      && document.querySelector(`#totalRequests`).textContent === `3`
    ));
    checks.employeeCanSubmitTrackedRequest = await employee.page.evaluate(() => (
      document.querySelector(`#requestList`).textContent.includes(
        `A new tracked HR request`
      ) === false
      && document.querySelectorAll(`#requestList .request-row`).length === 3
    ));
    await employee.page.click(
      `#requestList [data-request-id="OWN-INFO"]`
    );
    await employee.page.waitForSelector(`#detailModal:not([hidden])`);
    checks.employeeCanAnswerInformation = await employee.page.evaluate(() => (
      !document.querySelector(`#informationForm`).hidden
      && document.querySelectorAll(`#detailTimeline .timeline-item`).length === 1
      && document.querySelector(`#detailActions`).textContent.includes(`Withdraw`)
    ));
    await employee.page.click(`#closeDetailModal`);
    checks.employeeDesktopNoOverflow = await noOverflow(employee.page);
    checks.employeeDesktopRuntimeClean = employee.errors.length === 0;
    await employee.page.screenshot({
      path: path.join(root, `qa-stage10-employee-desktop.png`),
      fullPage: true
    });

    const manager = await openPage(
      browser,
      `approvals`,
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
    checks.managerHasSeparateRtlWorkspace = await manager.page.evaluate(() => (
      document.documentElement.dir === `rtl`
      && document.querySelector(`#assignedCount`).textContent === `1`
      && document.body.textContent.includes(`لا موافقة ذاتية`)
      && !document.querySelector(`#hrOperationsNav`)
        ?.matches(`:not([hidden])`)
    ));
    await manager.page.click(
      `#requestList [data-request-id="MGR-PENDING"]`
    );
    await manager.page.waitForSelector(`#detailModal:not([hidden])`);
    checks.managerCanDecideAssignedRequest = await manager.page.evaluate(() => (
      !document.querySelector(`#decisionForm`).hidden
      && Boolean(document.querySelector(`[data-decision="approve"]`))
      && Boolean(document.querySelector(`[data-decision="needs_information"]`))
      && Boolean(document.querySelector(`[data-decision="reject"]`))
    ));
    await manager.page.click(`#closeDetailModal`);
    await manager.page.click(`#requestList [data-request-id="MGR-OWN"]`);
    await manager.page.waitForSelector(`#detailModal:not([hidden])`);
    checks.managerCannotApproveOwnRequest = await manager.page.evaluate(() => (
      document.querySelector(`#detailActionSection`).hidden
      || document.querySelector(`#decisionForm`).hidden
    ));
    await manager.page.click(`#closeDetailModal`);
    await manager.page.click(`#openDelegationButton`);
    await manager.page.waitForSelector(`#delegationModal:not([hidden])`);
    checks.delegationStartsNowAndIsBounded = await manager.page.evaluate(() => {
      const start = document.querySelector(`#delegationStart`);
      const end = document.querySelector(`#delegationEnd`);
      return start.value === start.min
        && start.value === start.max
        && end.min > start.value
        && document.querySelectorAll(`#delegateUid option`).length === 1;
    });
    await manager.page.$eval(`#delegationForm`, form => form.requestSubmit());
    await manager.page.waitForFunction(() => (
      document.querySelector(`#delegationModal`).hidden
      && document.querySelectorAll(`#delegationList .delegation-item`).length === 1
    ));
    checks.managerDelegationRecorded = true;
    checks.managerMobileNoOverflow = await noOverflow(manager.page);
    checks.managerMobileRuntimeClean = manager.errors.length === 0;
    await manager.page.screenshot({
      path: path.join(root, `qa-stage10-manager-mobile.png`),
      fullPage: true
    });

    const hr = await openPage(
      browser,
      `hr-operations`,
      `admin`,
      `en`,
      { width: 1440, height: 1000, deviceScaleFactor: 1 }
    );
    checks.hrSeesOperationalQueue = await hr.page.evaluate(() => (
      document.querySelector(`#hrAssignedCount`).textContent === `2`
      && document.querySelectorAll(`#requestList .request-row`).length === 3
    ));
    await hr.page.click(`#requestList [data-request-id="HR-FUTURE"]`);
    await hr.page.waitForSelector(`#detailModal:not([hidden])`);
    checks.futureMovementNeverAutoApplied = await hr.page.evaluate(() => (
      !document.querySelector(`#futureMovementNotice`).hidden
      && document.querySelector(`[data-decision="fulfill"]`).disabled
    ));
    await hr.page.click(`#closeDetailModal`);
    await hr.page.click(`#requestList [data-request-id="HR-PENDING"]`);
    await hr.page.waitForSelector(`#detailModal:not([hidden])`);
    await hr.page.type(`#decisionNote`, `Validated and completed`);
    await hr.page.type(`#fulfillmentReference`, `HR-REF-100`);
    await hr.page.click(`[data-decision="fulfill"]`);
    await hr.page.waitForFunction(() => (
      document.querySelector(`#detailModal`).hidden
      && document.querySelector(`#hrCompletedCount`).textContent === `2`
    ));
    checks.hrCanCompleteAndApply = true;
    await hr.page.click(`[data-tab="configuration"]`);
    checks.versionedConfigurationVisible = await hr.page.evaluate(() => (
      !document.querySelector(`#configurationTab`).hidden
      && document.querySelector(`#configurationCount`).textContent === `3`
      && document.querySelectorAll(`#configurationList .config-item`).length === 3
      && document.querySelector(`#configurationDraftCount`).textContent === `1`
      && document.querySelectorAll(`#configurationDraftList .config-item`).length === 1
    ));
    await hr.page.click(`[data-edit-workflow-draft="DRAFT-EMPLOYMENT-LETTER"]`);
    await hr.page.waitForSelector(`#configurationModal:not([hidden])`);
    checks.configurationDesignerPreviewsDraft = await hr.page.evaluate(() => (
      document.querySelector(`#configurationCode`).value === `employment_letter`
      && document.querySelector(`#configurationPreview`).textContent.includes(
        `Employment letter`
      )
      && document.querySelectorAll(`[data-configuration-field]`).length === 1
    ));
    await hr.page.click(`#closeConfigurationModal`);
    await hr.page.click(`[data-publish-workflow-draft="DRAFT-EMPLOYMENT-LETTER"]`);
    await hr.page.waitForFunction(() => (
      document.querySelector(`#configurationDraftCount`).textContent === `0`
      && document.querySelector(`#configurationCount`).textContent === `4`
    ));
    checks.configurationDraftPublishesImmutableVersion = await hr.page.evaluate(() => (
      document.querySelector(`#configurationDraftEmpty`).hidden === false
      && [...document.querySelectorAll(`#configurationList .config-item`)]
        .some(item => item.textContent.includes(`employment_letter`))
    ));
    await hr.page.click(`[data-tab="reporting"]`);
    checks.reportingVisible = await hr.page.evaluate(() => (
      !document.querySelector(`#reportingTab`).hidden
      && document.querySelector(`#reportVolume`).textContent === `3`
      && document.querySelector(`#reportSla`).textContent.endsWith(`%`)
    ));
    checks.hrDesktopNoOverflow = await noOverflow(hr.page);
    checks.hrDesktopRuntimeClean = hr.errors.length === 0;
    await hr.page.screenshot({
      path: path.join(root, `qa-stage10-hr-desktop.png`),
      fullPage: true
    });

    if (Object.values(checks).some(value => value !== true)) {
      throw new Error(
        `One or more Stage 10 UI checks failed: ${JSON.stringify(checks)}`
      );
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
