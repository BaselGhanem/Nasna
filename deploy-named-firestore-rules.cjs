const fs = require(`node:fs`);
const path = require(`node:path`);

const auth = require(`firebase-tools/lib/auth`);
const { Client } = require(`firebase-tools/lib/apiv2`);
const { rulesOrigin } = require(`firebase-tools/lib/api`);
const rulesApi = require(`firebase-tools/lib/gcp/rules`);

const root = process.cwd();
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(root, `firebase.json`), `utf8`)
);
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(root, `.firebaserc`), `utf8`)
);
const firestoreConfig = Array.isArray(firebaseConfig.firestore)
  ? firebaseConfig.firestore[0]
  : firebaseConfig.firestore;
const projectId = projectConfig.projects?.default;
const databaseId = firestoreConfig?.database;
const rulesFile = firestoreConfig?.rules;

if (!projectId || !databaseId || !rulesFile) {
  throw new Error(`firebase-config-invalid`);
}

const account = auth.getProjectDefaultAccount(root)
  || auth.getGlobalDefaultAccount();
if (!account) {
  throw new Error(`firebase-login-required`);
}

auth.setActiveAccount({}, account);

const source = fs.readFileSync(path.join(root, rulesFile), `utf8`);
const files = [{ name: rulesFile, content: source }];
const releaseId = `cloud.firestore/${databaseId}`;
const releaseName = `projects/${projectId}/releases/${releaseId}`;

const failOnCompilationErrors = response => {
  const issues = response?.body?.issues || [];
  const errors = issues.filter(issue => issue.severity === `ERROR`);
  if (errors.length) {
    const details = errors.map(issue => (
      `${issue.sourcePosition?.line || 0}:`
      + `${issue.sourcePosition?.column || 0} ${issue.description}`
    )).join(`\n`);
    throw new Error(`Rules compilation failed:\n${details}`);
  }
};

const run = async () => {
  console.log(`Checking ${rulesFile}...`);
  const compilation = await rulesApi.testRuleset(projectId, files);
  failOnCompilationErrors(compilation);

  console.log(`Creating immutable ruleset...`);
  const rulesetName = await rulesApi.createRuleset(projectId, files);

  console.log(`Updating named-database release...`);
  const client = new Client({
    urlPrefix: rulesOrigin(),
    apiVersion: `v1`
  });
  await client.patch(
    `/projects/${projectId}/releases/${releaseId}`,
    {
      release: {
        name: releaseName,
        rulesetName
      },
      updateMask: `rulesetName`
    }
  );

  const verification = await client.get(
    `/projects/${projectId}/releases/${releaseId}`
  );
  if (verification.body?.rulesetName !== rulesetName) {
    throw new Error(`ruleset-release-verification-failed`);
  }

  console.log(`Rules published successfully.`);
  console.log(`Database: ${databaseId}`);
  console.log(`Ruleset: ${rulesetName}`);
};

run().catch(error => {
  console.error(`Rules deployment failed.`);
  console.error(error.message || error);
  process.exitCode = 1;
});
