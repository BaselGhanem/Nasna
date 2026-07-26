const fs = require(`node:fs`);
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require(`@firebase/rules-unit-testing`);
const {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna`;
const companyId = `COMPANY-1`;

const branchData = (code, actorId, status = `active`) => ({
  id: code,
  companyId,
  code,
  nameEn: `${code} Branch`,
  nameAr: `فرع ${code}`,
  status,
  createdAt: serverTimestamp(),
  createdBy: actorId,
  updatedAt: serverTimestamp(),
  updatedBy: actorId
});

const locationData = (code, branchId, actorId, status = `active`) => ({
  id: code,
  companyId,
  code,
  branchId,
  nameEn: `${code} Location`,
  nameAr: `موقع ${code}`,
  city: `Amman`,
  address: `Test address`,
  timezone: `Asia/Amman`,
  status,
  createdAt: serverTimestamp(),
  createdBy: actorId,
  updatedAt: serverTimestamp(),
  updatedBy: actorId
});

const auditData = (actorId, action, targetId, details = {}) => ({
  companyId,
  actorId,
  actorEmail: `${actorId}@nasna.com`,
  action,
  targetId,
  details,
  createdAt: serverTimestamp()
});

const run = async () => {
  const testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(`firestore.rules`, `utf8`)
    }
  });

  try {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      const database = context.firestore();
      await setDoc(doc(database, `nasna_companies`, companyId), {
        id: companyId,
        ownerId: `owner`,
        status: `active`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `members`, `admin`), {
        uid: `admin`,
        companyId,
        role: `hr_admin`,
        status: `active`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `members`, `employee`), {
        uid: `employee`,
        companyId,
        role: `employee`,
        status: `active`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `branches`, `MAIN`), {
        ...branchData(`MAIN`, `admin`),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `branches`, `CLOSED`), {
        ...branchData(`CLOSED`, `admin`, `inactive`),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    const adminDatabase = testEnvironment
      .authenticatedContext(`admin`, { email: `admin@nasna.com` })
      .firestore();
    const employeeDatabase = testEnvironment
      .authenticatedContext(`employee`, { email: `employee@nasna.com` })
      .firestore();

    await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `branches`, `MAIN`)
    ));

    await assertFails(setDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `branches`, `EMPLOYEE-BRANCH`),
      branchData(`EMPLOYEE-BRANCH`, `employee`)
    ));

    const createBranchBatch = writeBatch(adminDatabase);
    createBranchBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `branches`, `IRBID`),
      branchData(`IRBID`, `admin`)
    );
    createBranchBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-branch-create`),
      auditData(`admin`, `branch.created`, `IRBID`, { code: `IRBID` })
    );
    await assertSucceeds(createBranchBatch.commit());

    const createLocationBatch = writeBatch(adminDatabase);
    createLocationBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `locations`, `IRBID-HQ`),
      locationData(`IRBID-HQ`, `IRBID`, `admin`)
    );
    createLocationBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-location-create`),
      auditData(`admin`, `location.created`, `IRBID-HQ`, { branchId: `IRBID` })
    );
    await assertSucceeds(createLocationBatch.commit());

    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `locations`, `CLOSED-HQ`),
      locationData(`CLOSED-HQ`, `CLOSED`, `admin`)
    ));

    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `branches`, `IRBID`)
    ));

    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-branch-create`),
      { action: `tampered` }
    ));

    const disableBranchBatch = writeBatch(adminDatabase);
    disableBranchBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `branches`, `IRBID`),
      {
        status: `inactive`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    );
    disableBranchBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `locations`, `IRBID-HQ`),
      {
        status: `inactive`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    );
    disableBranchBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-branch-disable`),
      auditData(`admin`, `branch.status_changed`, `IRBID`, {
        from: `active`,
        to: `inactive`,
        disabledLocations: 1
      })
    );
    await assertSucceeds(disableBranchBatch.commit());

    const disabledLocation = await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `locations`, `IRBID-HQ`)
    ));
    if (disabledLocation.data().status !== `inactive`) {
      throw new Error(`Branch deactivation did not disable its location.`);
    }

    console.log(JSON.stringify({
      rulesCompiled: true,
      employeeCanRead: true,
      employeeCannotWrite: true,
      adminCanCreateBranch: true,
      adminCanCreateLocation: true,
      inactiveBranchRejectsActiveLocation: true,
      recordsCannotBeDeleted: true,
      auditLogsAreImmutable: true,
      branchDeactivationDisablesLocations: true
    }, null, 2));
  } finally {
    await testEnvironment.cleanup();
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
