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

const projectId = `demo-nasna-architecture`;
const companyId = `COMPANY-1`;

const baseRecord = (code, actorId, status = `active`) => ({
  id: code,
  companyId,
  code,
  status,
  createdAt: serverTimestamp(),
  createdBy: actorId,
  updatedAt: serverTimestamp(),
  updatedBy: actorId
});

const branchData = (code, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  nameEn: `${code} Branch`,
  nameAr: `فرع ${code}`
});

const locationData = (code, branchId, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  branchId,
  nameEn: `${code} Location`,
  nameAr: `موقع ${code}`,
  city: `Amman`,
  address: `Test address`,
  timezone: `Asia/Amman`
});

const departmentData = (code, branchId, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  branchId,
  nameEn: `${code} Department`,
  nameAr: `قسم ${code}`
});

const teamData = (code, departmentId, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  departmentId,
  nameEn: `${code} Team`,
  nameAr: `فريق ${code}`
});

const gradeData = (code, level, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  nameEn: `${code} Grade`,
  nameAr: `درجة ${code}`,
  level
});

const titleData = (code, gradeId, actorId, status = `active`) => ({
  ...baseRecord(code, actorId, status),
  gradeId,
  nameEn: `${code} Title`,
  nameAr: `مسمى ${code}`,
  descriptionEn: `Test description`,
  descriptionAr: `وصف تجريبي`
});

const positionData = (
  code,
  jobTitleId,
  branchId,
  departmentId,
  actorId,
  overrides = {}
) => ({
  ...baseRecord(code, actorId),
  jobTitleId,
  branchId,
  locationId: ``,
  departmentId,
  teamId: ``,
  headcount: 1,
  ...overrides
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
      await setDoc(
        doc(database, `nasna_companies`, companyId, `branches`, `MAIN`),
        { ...branchData(`MAIN`, `admin`), createdAt: new Date(), updatedAt: new Date() }
      );
      await setDoc(
        doc(database, `nasna_companies`, companyId, `branches`, `NORTH`),
        { ...branchData(`NORTH`, `admin`), createdAt: new Date(), updatedAt: new Date() }
      );
      await setDoc(
        doc(database, `nasna_companies`, companyId, `branches`, `CLOSED`),
        { ...branchData(`CLOSED`, `admin`, `inactive`), createdAt: new Date(), updatedAt: new Date() }
      );
      await setDoc(
        doc(database, `nasna_companies`, companyId, `locations`, `MAIN-HQ`),
        {
          ...locationData(`MAIN-HQ`, `MAIN`, `admin`),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    });

    const adminDatabase = testEnvironment
      .authenticatedContext(`admin`, { email: `admin@nasna.com` })
      .firestore();
    const employeeDatabase = testEnvironment
      .authenticatedContext(`employee`, { email: `employee@nasna.com` })
      .firestore();

    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `departments`, `HR`),
      departmentData(`HR`, `MAIN`, `admin`)
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `departments`, `CLOSED-HR`),
      departmentData(`CLOSED-HR`, `CLOSED`, `admin`)
    ));
    await assertFails(setDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `departments`, `EMP-HR`),
      departmentData(`EMP-HR`, `MAIN`, `employee`)
    ));
    await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `departments`, `HR`)
    ));

    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `teams`, `PEOPLE`),
      teamData(`PEOPLE`, `HR`, `admin`)
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `teams`, `MISSING-TEAM`),
      teamData(`MISSING-TEAM`, `MISSING`, `admin`)
    ));

    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `jobGrades`, `G1`),
      gradeData(`G1`, 1, `admin`)
    ));
    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `jobGrades`, `G2`),
      gradeData(`G2`, 2, `admin`, `inactive`)
    ));
    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `jobTitles`, `HR-OFFICER`),
      titleData(`HR-OFFICER`, `G1`, `admin`)
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `jobTitles`, `BLOCKED-TITLE`),
      titleData(`BLOCKED-TITLE`, `G2`, `admin`)
    ));

    await assertSucceeds(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `positions`, `HR-001`),
      positionData(
        `HR-001`,
        `HR-OFFICER`,
        `MAIN`,
        `HR`,
        `admin`,
        { teamId: `PEOPLE`, locationId: `MAIN-HQ`, headcount: 2 }
      )
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `positions`, `HR-WRONG-BRANCH`),
      positionData(`HR-WRONG-BRANCH`, `HR-OFFICER`, `NORTH`, `HR`, `admin`)
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `positions`, `HR-WRONG-LOCATION`),
      positionData(
        `HR-WRONG-LOCATION`,
        `HR-OFFICER`,
        `NORTH`,
        `HR`,
        `admin`,
        { locationId: `MAIN-HQ` }
      )
    ));

    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `jobTitles`, `HR-OFFICER`)
    ));

    const stressTeamIds = Array.from({ length: 24 }, (_, index) => (
      `STRESS-${String(index + 1).padStart(2, `0`)}`
    ));
    await testEnvironment.withSecurityRulesDisabled(async context => {
      const database = context.firestore();
      await Promise.all(stressTeamIds.map(teamId => setDoc(
        doc(database, `nasna_companies`, companyId, `teams`, teamId),
        {
          ...teamData(teamId, `HR`, `admin`),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      )));
    });

    const disableDepartmentBatch = writeBatch(adminDatabase);
    disableDepartmentBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `departments`, `HR`),
      { status: `inactive`, updatedAt: serverTimestamp(), updatedBy: `admin` }
    );
    disableDepartmentBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `teams`, `PEOPLE`),
      { status: `inactive`, updatedAt: serverTimestamp(), updatedBy: `admin` }
    );
    disableDepartmentBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `positions`, `HR-001`),
      { status: `inactive`, updatedAt: serverTimestamp(), updatedBy: `admin` }
    );
    stressTeamIds.forEach(teamId => {
      disableDepartmentBatch.update(
        doc(adminDatabase, `nasna_companies`, companyId, `teams`, teamId),
        { status: `inactive`, updatedAt: serverTimestamp(), updatedBy: `admin` }
      );
    });
    disableDepartmentBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-disable-hr`),
      auditData(`admin`, `department.status_changed`, `HR`, {
        from: `active`,
        to: `inactive`,
        disabledDependents: 26
      })
    );
    await assertSucceeds(disableDepartmentBatch.commit());

    const teamSnapshot = await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `teams`, `PEOPLE`)
    ));
    const positionSnapshot = await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `positions`, `HR-001`)
    ));
    if (teamSnapshot.data().status !== `inactive` || positionSnapshot.data().status !== `inactive`) {
      throw new Error(`Department cascade did not disable team and position.`);
    }

    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `audit-disable-hr`),
      { action: `tampered` }
    ));

    console.log(JSON.stringify({
      rulesCompiled: true,
      activeMemberCanReadArchitecture: true,
      employeeCannotWriteArchitecture: true,
      activeBranchRequiredForDepartment: true,
      activeDepartmentRequiredForTeam: true,
      activeGradeRequiredForTitle: true,
      positionRelationshipsEnforced: true,
      architectureRecordsCannotBeDeleted: true,
      departmentCascadeBatchAllowed: true,
      cascadeStressRecords: stressTeamIds.length + 2,
      auditLogsRemainImmutable: true
    }, null, 2));
  } finally {
    await testEnvironment.cleanup();
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
