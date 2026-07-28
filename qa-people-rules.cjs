const fs = require(`node:fs`);
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require(`@firebase/rules-unit-testing`);
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna-people`;
const companyId = `COMPANY-1`;

const employeeData = ({
  code,
  authUid,
  email,
  positionId,
  managerEmployeeId = ``,
  status = `active`,
  actorId = `admin`
}) => ({
  id: code,
  companyId,
  employeeCode: code,
  authUid,
  accessStatus: status === `suspended` ? `disabled` : `active`,
  fullNameEn: `${code} Employee`,
  fullNameAr: `موظف ${code}`,
  workEmail: email,
  workPhone: `+962790000000`,
  positionId,
  jobTitleId: positionId === `POS-MGR` ? `TITLE-MGR` : `TITLE-EMP`,
  branchId: `MAIN`,
  locationId: `HQ`,
  departmentId: `PEOPLE`,
  teamId: `CORE`,
  managerEmployeeId,
  hireDate: new Date(`2026-07-01T00:00:00Z`),
  employmentType: `permanent`,
  employmentStatus: status,
  workMode: `onsite`,
  createdAt: serverTimestamp(),
  createdBy: actorId,
  updatedAt: serverTimestamp(),
  updatedBy: actorId
});

const privateData = ({ code, authUid, actorId = `admin` }) => ({
  id: code,
  companyId,
  authUid,
  nationalId: `N-${code}`,
  dateOfBirth: new Date(`1990-01-01T00:00:00Z`),
  gender: `not_disclosed`,
  maritalStatus: `not_disclosed`,
  nationality: `Jordanian`,
  personalEmail: `${code.toLowerCase()}@personal.test`,
  personalPhone: `+962791111111`,
  address: `Amman`,
  emergencyContactName: `Emergency contact`,
  emergencyContactPhone: `+962792222222`,
  hrNotes: `Private HR note`,
  createdAt: serverTimestamp(),
  createdBy: actorId,
  updatedAt: serverTimestamp(),
  updatedBy: actorId
});

const auditData = (actorId, action, targetId) => ({
  companyId,
  actorId,
  actorEmail: `${actorId}@nasna.test`,
  action,
  targetId,
  details: {},
  createdAt: serverTimestamp()
});

const memberData = ({ uid, email, role = `employee`, employeeId = null }) => ({
  uid,
  companyId,
  email,
  displayName: uid,
  role,
  isManager: false,
  status: `active`,
  createdBy: `admin`,
  joinedAt: new Date(),
  updatedAt: new Date(),
  ...(employeeId ? { employeeId } : {})
});

const userData = ({ uid, email, employeeId = null }) => ({
  uid,
  email,
  displayName: uid,
  activeCompanyId: companyId,
  status: `active`,
  locale: `en`,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...(employeeId ? { employeeId } : {})
});

const createEmployeeBatch = ({
  database,
  code,
  authUid,
  email,
  positionId,
  managerEmployeeId = ``,
  existingMember = false
}) => {
  const batch = writeBatch(database);
  batch.set(
    doc(database, `nasna_companies`, companyId, `employees`, code),
    employeeData({ code, authUid, email, positionId, managerEmployeeId })
  );
  batch.set(
    doc(database, `nasna_companies`, companyId, `employeePrivate`, code),
    privateData({ code, authUid })
  );
  const memberRef = doc(database, `nasna_companies`, companyId, `members`, authUid);
  const userRef = doc(database, `nasna_users`, authUid);
  if (existingMember) {
    batch.update(memberRef, {
      employeeId: code,
      displayName: `${code} Employee`,
      isManager: false,
      status: `active`,
      updatedAt: serverTimestamp()
    });
    batch.update(userRef, {
      employeeId: code,
      displayName: `${code} Employee`,
      status: `active`,
      updatedAt: serverTimestamp()
    });
  } else {
    batch.set(memberRef, {
      ...memberData({ uid: authUid, email, employeeId: code }),
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.set(userRef, {
      ...userData({ uid: authUid, email, employeeId: code }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  batch.set(
    doc(database, `nasna_companies`, companyId, `auditLogs`, `create-${code}`),
    auditData(`admin`, `employee.created`, code)
  );
  return batch;
};

const run = async () => {
  const environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(`firestore.rules`, `utf8`)
    }
  });

  try {
    await environment.withSecurityRulesDisabled(async context => {
      const database = context.firestore();
      await setDoc(doc(database, `nasna_companies`, companyId), {
        id: companyId,
        ownerId: `admin`,
        nameEn: `Test Company`,
        nameAr: `شركة اختبار`,
        status: `active`
      });
      await setDoc(
        doc(database, `nasna_companies`, companyId, `members`, `admin`),
        memberData({ uid: `admin`, email: `admin@nasna.test`, role: `super_admin` })
      );
      await setDoc(
        doc(database, `nasna_companies`, companyId, `members`, `manager-existing`),
        memberData({ uid: `manager-existing`, email: `manager@nasna.test` })
      );
      await setDoc(
        doc(database, `nasna_users`, `manager-existing`),
        userData({ uid: `manager-existing`, email: `manager@nasna.test` })
      );

      const now = new Date();
      await setDoc(doc(database, `nasna_companies`, companyId, `branches`, `MAIN`), {
        id: `MAIN`, companyId, code: `MAIN`, nameEn: `Main`, nameAr: `الرئيسي`,
        status: `active`, createdAt: now, createdBy: `admin`, updatedAt: now, updatedBy: `admin`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `locations`, `HQ`), {
        id: `HQ`, companyId, code: `HQ`, branchId: `MAIN`, nameEn: `HQ`, nameAr: `المقر`,
        city: `Amman`, address: `Amman`, timezone: `Asia/Amman`, status: `active`,
        createdAt: now, createdBy: `admin`, updatedAt: now, updatedBy: `admin`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `departments`, `PEOPLE`), {
        id: `PEOPLE`, companyId, code: `PEOPLE`, branchId: `MAIN`,
        nameEn: `People`, nameAr: `الموظفون`, status: `active`,
        createdAt: now, createdBy: `admin`, updatedAt: now, updatedBy: `admin`
      });
      await setDoc(doc(database, `nasna_companies`, companyId, `teams`, `CORE`), {
        id: `CORE`, companyId, code: `CORE`, departmentId: `PEOPLE`,
        nameEn: `Core`, nameAr: `الفريق`, status: `active`,
        createdAt: now, createdBy: `admin`, updatedAt: now, updatedBy: `admin`
      });
      for (const [code, name] of [[`TITLE-MGR`, `Manager`], [`TITLE-EMP`, `Employee`]]) {
        await setDoc(doc(database, `nasna_companies`, companyId, `jobTitles`, code), {
          id: code, companyId, code, gradeId: `G1`, nameEn: name, nameAr: `مسمى`,
          descriptionEn: `Description`, descriptionAr: `وصف`, status: `active`,
          createdAt: now, createdBy: `admin`, updatedAt: now, updatedBy: `admin`
        });
      }
      for (const [code, title, headcount] of [
        [`POS-MGR`, `TITLE-MGR`, 1],
        [`POS-EMP`, `TITLE-EMP`, 5]
      ]) {
        await setDoc(doc(database, `nasna_companies`, companyId, `positions`, code), {
          id: code, companyId, code, jobTitleId: title, branchId: `MAIN`,
          locationId: `HQ`, departmentId: `PEOPLE`, teamId: `CORE`,
          headcount, status: `active`, createdAt: now, createdBy: `admin`,
          updatedAt: now, updatedBy: `admin`
        });
      }
    });

    const adminDatabase = environment
      .authenticatedContext(`admin`, { email: `admin@nasna.test` })
      .firestore();

    await assertSucceeds(createEmployeeBatch({
      database: adminDatabase,
      code: `MGR-001`,
      authUid: `manager-existing`,
      email: `manager@nasna.test`,
      positionId: `POS-MGR`,
      existingMember: true
    }).commit());

    await assertSucceeds(createEmployeeBatch({
      database: adminDatabase,
      code: `EMP-001`,
      authUid: `employee-new`,
      email: `employee@nasna.test`,
      positionId: `POS-EMP`,
      managerEmployeeId: `MGR-001`
    }).commit());

    await assertSucceeds(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `members`, `manager-existing`),
      { isManager: true, updatedAt: serverTimestamp() }
    ));

    const managerDatabase = environment
      .authenticatedContext(`manager-existing`, { email: `manager@nasna.test` })
      .firestore();
    const employeeDatabase = environment
      .authenticatedContext(`employee-new`, { email: `employee@nasna.test` })
      .firestore();

    await assertSucceeds(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`)
    ));
    await assertSucceeds(getDocs(
      collection(managerDatabase, `nasna_companies`, companyId, `employees`)
    ));
    await assertSucceeds(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employeePrivate`, `MGR-001`)
    ));
    await assertFails(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employeePrivate`, `EMP-001`)
    ));
    await assertSucceeds(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employeePrivate`, `EMP-001`)
    ));
    await assertFails(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employeePrivate`, `MGR-001`)
    ));
    await assertFails(getDocs(
      collection(employeeDatabase, `nasna_companies`, companyId, `employeePrivate`)
    ));
    await assertSucceeds(getDocs(
      collection(adminDatabase, `nasna_companies`, companyId, `employeePrivate`)
    ));

    await assertFails(updateDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      { workPhone: `tampered` }
    ));
    await assertFails(updateDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      { workPhone: `tampered` }
    ));
    await assertFails(updateDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employeePrivate`, `EMP-001`),
      { nationalId: `tampered` }
    ));

    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        jobTitleId: `TITLE-MGR`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    ));
    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`)
    ));
    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employeePrivate`, `EMP-001`)
    ));

    const suspendBatch = writeBatch(adminDatabase);
    const suspensionMovementId = `MOVE-SUSPEND-001`;
    suspendBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        accessStatus: `disabled`,
        employmentStatus: `suspended`,
        lastMovementId: suspensionMovementId,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    );
    suspendBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `members`, `employee-new`),
      { status: `disabled`, updatedAt: serverTimestamp() }
    );
    suspendBatch.update(
      doc(adminDatabase, `nasna_users`, `employee-new`),
      { status: `disabled`, updatedAt: serverTimestamp() }
    );
    suspendBatch.set(
      doc(
        adminDatabase,
        `nasna_companies`,
        companyId,
        `employeeMovements`,
        suspensionMovementId
      ),
      {
        id: suspensionMovementId,
        companyId,
        employeeId: `EMP-001`,
        employeeAuthUid: `employee-new`,
        movementType: `status_change`,
        effectiveDate: new Date(`2026-07-26T00:00:00Z`),
        reason: `Approved suspension`,
        previousPositionId: `POS-EMP`,
        newPositionId: `POS-EMP`,
        previousManagerEmployeeId: `MGR-001`,
        newManagerEmployeeId: `MGR-001`,
        previousEmploymentType: `permanent`,
        newEmploymentType: `permanent`,
        previousEmploymentStatus: `active`,
        newEmploymentStatus: `suspended`,
        previousWorkMode: `onsite`,
        newWorkMode: `onsite`,
        createdAt: serverTimestamp(),
        createdBy: `admin`
      }
    );
    suspendBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `suspend-EMP-001`),
      auditData(`admin`, `employee_movement.applied`, suspensionMovementId)
    );
    await assertSucceeds(suspendBatch.commit());
    await assertFails(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`)
    ));

    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        accessStatus: `active`,
        employmentStatus: `active`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    ));

    const managerMembership = await assertSucceeds(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `members`, `manager-existing`)
    ));
    if (
      managerMembership.data().role !== `employee`
      || managerMembership.data().isManager !== true
      || managerMembership.data().employeeId !== `MGR-001`
    ) {
      throw new Error(`Manager capability replaced or failed to link the employee identity.`);
    }

    console.log(JSON.stringify({
      rulesCompiled: true,
      existingAdministratorLoginCanBeLinked: true,
      newEmployeeLoginCanBeProvisioned: true,
      managerRemainsEmployee: true,
      managerCanReadSafeTeamData: true,
      managerCannotReadReportPrivateData: true,
      employeeCanReadOwnPrivateDataOnly: true,
      onlyHrCanWriteEmployeeRecords: true,
      positionRelationshipsEnforced: true,
      employeeRecordsCannotBeDeleted: true,
      accessStatusMustStaySynchronized: true
    }, null, 2));
  } finally {
    await environment.cleanup();
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
