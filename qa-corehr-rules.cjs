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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} = require(`firebase/firestore`);

const projectId = `demo-nasna-corehr`;
const companyId = `COMPANY-1`;

const memberData = ({ uid, email, role = `employee`, employeeId = null, isManager = false }) => ({
  uid,
  companyId,
  email,
  displayName: uid,
  role,
  isManager,
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

const employeeData = ({
  code,
  authUid,
  email,
  positionId,
  managerEmployeeId = ``,
  titleId = `TITLE-EMP`
}) => ({
  id: code,
  companyId,
  employeeCode: code,
  authUid,
  accessStatus: `active`,
  fullNameEn: `${code} Employee`,
  fullNameAr: `موظف ${code}`,
  workEmail: email,
  workPhone: `+962790000000`,
  positionId,
  jobTitleId: titleId,
  branchId: `MAIN`,
  locationId: `HQ`,
  departmentId: `PEOPLE`,
  teamId: `CORE`,
  managerEmployeeId,
  hireDate: new Date(`2026-01-01T00:00:00Z`),
  employmentType: `permanent`,
  employmentStatus: `active`,
  workMode: `onsite`,
  createdAt: new Date(),
  createdBy: `admin`,
  updatedAt: new Date(),
  updatedBy: `admin`
});

const documentData = ({
  id,
  employeeId = `EMP-001`,
  employeeAuthUid = `employee`,
  visibility = `employee`,
  linkUrl = `https://intranet.example.test/document`
}) => ({
  id,
  companyId,
  employeeId,
  employeeAuthUid,
  type: `contract`,
  title: `Employment contract`,
  documentNumber: `CONTRACT-001`,
  issueDate: new Date(`2026-01-01T00:00:00Z`),
  expiryDate: new Date(`2027-01-01T00:00:00Z`),
  linkUrl,
  visibility,
  status: `active`,
  createdAt: serverTimestamp(),
  createdBy: `admin`,
  updatedAt: serverTimestamp(),
  updatedBy: `admin`
});

const auditData = (action, targetId) => ({
  companyId,
  actorId: `admin`,
  actorEmail: `admin@nasna.test`,
  action,
  targetId,
  details: {},
  createdAt: serverTimestamp()
});

const seed = async environment => {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    const now = new Date();
    await setDoc(doc(database, `nasna_companies`, companyId), {
      id: companyId,
      ownerId: `admin`,
      nameEn: `Test Company`,
      nameAr: `شركة اختبار`,
      status: `active`
    });
    for (const member of [
      memberData({ uid: `admin`, email: `admin@nasna.test`, role: `super_admin` }),
      memberData({
        uid: `manager`,
        email: `manager@nasna.test`,
        employeeId: `MGR-001`,
        isManager: true
      }),
      memberData({
        uid: `employee`,
        email: `employee@nasna.test`,
        employeeId: `EMP-001`
      }),
      memberData({
        uid: `employee-two`,
        email: `employee-two@nasna.test`,
        employeeId: `EMP-002`
      })
    ]) {
      await setDoc(doc(database, `nasna_companies`, companyId, `members`, member.uid), member);
      await setDoc(
        doc(database, `nasna_users`, member.uid),
        userData({ uid: member.uid, email: member.email, employeeId: member.employeeId })
      );
    }
    await setDoc(doc(database, `nasna_companies`, companyId, `branches`, `MAIN`), {
      id: `MAIN`,
      companyId,
      code: `MAIN`,
      nameEn: `Main`,
      nameAr: `الرئيسي`,
      status: `active`,
      createdAt: now,
      createdBy: `admin`,
      updatedAt: now,
      updatedBy: `admin`
    });
    await setDoc(doc(database, `nasna_companies`, companyId, `locations`, `HQ`), {
      id: `HQ`,
      companyId,
      code: `HQ`,
      branchId: `MAIN`,
      nameEn: `HQ`,
      nameAr: `المقر`,
      city: `Amman`,
      address: `Amman`,
      timezone: `Asia/Amman`,
      status: `active`,
      createdAt: now,
      createdBy: `admin`,
      updatedAt: now,
      updatedBy: `admin`
    });
    await setDoc(doc(database, `nasna_companies`, companyId, `departments`, `PEOPLE`), {
      id: `PEOPLE`,
      companyId,
      code: `PEOPLE`,
      branchId: `MAIN`,
      nameEn: `People`,
      nameAr: `الموظفون`,
      status: `active`,
      createdAt: now,
      createdBy: `admin`,
      updatedAt: now,
      updatedBy: `admin`
    });
    await setDoc(doc(database, `nasna_companies`, companyId, `teams`, `CORE`), {
      id: `CORE`,
      companyId,
      code: `CORE`,
      departmentId: `PEOPLE`,
      nameEn: `Core`,
      nameAr: `الفريق`,
      status: `active`,
      createdAt: now,
      createdBy: `admin`,
      updatedAt: now,
      updatedBy: `admin`
    });
    await setDoc(doc(database, `nasna_companies`, companyId, `jobGrades`, `G1`), {
      id: `G1`,
      companyId,
      code: `G1`,
      nameEn: `Grade 1`,
      nameAr: `الدرجة 1`,
      level: 1,
      status: `active`,
      createdAt: now,
      createdBy: `admin`,
      updatedAt: now,
      updatedBy: `admin`
    });
    for (const [code, name] of [
      [`TITLE-MGR`, `Manager`],
      [`TITLE-EMP`, `Employee`],
      [`TITLE-SR`, `Senior Employee`]
    ]) {
      await setDoc(doc(database, `nasna_companies`, companyId, `jobTitles`, code), {
        id: code,
        companyId,
        code,
        gradeId: `G1`,
        nameEn: name,
        nameAr: `مسمى`,
        descriptionEn: `Description`,
        descriptionAr: `وصف`,
        status: `active`,
        createdAt: now,
        createdBy: `admin`,
        updatedAt: now,
        updatedBy: `admin`
      });
    }
    for (const [code, title, headcount] of [
      [`POS-MGR`, `TITLE-MGR`, 1],
      [`POS-EMP`, `TITLE-EMP`, 5],
      [`POS-SR`, `TITLE-SR`, 2]
    ]) {
      await setDoc(doc(database, `nasna_companies`, companyId, `positions`, code), {
        id: code,
        companyId,
        code,
        jobTitleId: title,
        branchId: `MAIN`,
        locationId: `HQ`,
        departmentId: `PEOPLE`,
        teamId: `CORE`,
        headcount,
        status: `active`,
        createdAt: now,
        createdBy: `admin`,
        updatedAt: now,
        updatedBy: `admin`
      });
    }
    await setDoc(
      doc(database, `nasna_companies`, companyId, `employees`, `MGR-001`),
      employeeData({
        code: `MGR-001`,
        authUid: `manager`,
        email: `manager@nasna.test`,
        positionId: `POS-MGR`,
        titleId: `TITLE-MGR`
      })
    );
    await setDoc(
      doc(database, `nasna_companies`, companyId, `employees`, `EMP-001`),
      employeeData({
        code: `EMP-001`,
        authUid: `employee`,
        email: `employee@nasna.test`,
        positionId: `POS-EMP`,
        managerEmployeeId: `MGR-001`
      })
    );
    await setDoc(
      doc(database, `nasna_companies`, companyId, `employees`, `EMP-002`),
      employeeData({
        code: `EMP-002`,
        authUid: `employee-two`,
        email: `employee-two@nasna.test`,
        positionId: `POS-EMP`,
        managerEmployeeId: `MGR-001`
      })
    );
  });
};

const run = async () => {
  const environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(`firestore.rules`, `utf8`)
    }
  });

  try {
    await seed(environment);
    const adminDatabase = environment
      .authenticatedContext(`admin`, { email: `admin@nasna.test` })
      .firestore();
    const managerDatabase = environment
      .authenticatedContext(`manager`, { email: `manager@nasna.test` })
      .firestore();
    const employeeDatabase = environment
      .authenticatedContext(`employee`, { email: `employee@nasna.test` })
      .firestore();

    const sharedDocumentBatch = writeBatch(adminDatabase);
    sharedDocumentBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-SHARED`),
      documentData({ id: `DOC-SHARED` })
    );
    sharedDocumentBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `AUDIT-DOC-SHARED`),
      auditData(`employee_document.created`, `DOC-SHARED`)
    );
    await assertSucceeds(sharedDocumentBatch.commit());

    const privateDocumentBatch = writeBatch(adminDatabase);
    privateDocumentBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-HR`),
      documentData({ id: `DOC-HR`, visibility: `hr_only` })
    );
    privateDocumentBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `AUDIT-DOC-HR`),
      auditData(`employee_document.created`, `DOC-HR`)
    );
    await assertSucceeds(privateDocumentBatch.commit());

    const employeeDocumentQuery = query(
      collection(employeeDatabase, `nasna_companies`, companyId, `employeeDocuments`),
      where(`employeeAuthUid`, `==`, `employee`),
      where(`visibility`, `==`, `employee`)
    );
    const employeeDocuments = await assertSucceeds(getDocs(employeeDocumentQuery));
    if (employeeDocuments.size !== 1) {
      throw new Error(`Employee did not receive exactly the shared document.`);
    }
    await assertFails(getDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-HR`)
    ));
    await assertFails(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-SHARED`)
    ));
    await assertFails(setDoc(
      doc(employeeDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-FAKE`),
      documentData({ id: `DOC-FAKE` })
    ));
    await assertFails(setDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-HTTP`),
      documentData({ id: `DOC-HTTP`, linkUrl: `http://unsafe.test/document` })
    ));
    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeDocuments`, `DOC-SHARED`)
    ));

    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        positionId: `POS-SR`,
        jobTitleId: `TITLE-SR`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    ));

    const mismatchedMovementBatch = writeBatch(adminDatabase);
    mismatchedMovementBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        positionId: `POS-SR`,
        jobTitleId: `TITLE-SR`,
        branchId: `MAIN`,
        locationId: `HQ`,
        departmentId: `PEOPLE`,
        teamId: `CORE`,
        lastMovementId: `MOVE-MISMATCH`,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    );
    mismatchedMovementBatch.set(
      doc(
        adminDatabase,
        `nasna_companies`,
        companyId,
        `employeeMovements`,
        `MOVE-MISMATCH`
      ),
      {
        id: `MOVE-MISMATCH`,
        companyId,
        employeeId: `EMP-001`,
        employeeAuthUid: `employee`,
        movementType: `manager_change`,
        effectiveDate: new Date(`2026-07-26T00:00:00Z`),
        reason: `Mismatched movement label`,
        previousPositionId: `POS-EMP`,
        newPositionId: `POS-SR`,
        previousManagerEmployeeId: `MGR-001`,
        newManagerEmployeeId: `MGR-001`,
        previousEmploymentType: `permanent`,
        newEmploymentType: `permanent`,
        previousEmploymentStatus: `active`,
        newEmploymentStatus: `active`,
        previousWorkMode: `onsite`,
        newWorkMode: `onsite`,
        createdAt: serverTimestamp(),
        createdBy: `admin`
      }
    );
    await assertFails(mismatchedMovementBatch.commit());

    const movementId = `MOVE-001`;
    const movementBatch = writeBatch(adminDatabase);
    movementBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `employees`, `EMP-001`),
      {
        positionId: `POS-SR`,
        jobTitleId: `TITLE-SR`,
        branchId: `MAIN`,
        locationId: `HQ`,
        departmentId: `PEOPLE`,
        teamId: `CORE`,
        managerEmployeeId: `MGR-001`,
        employmentType: `permanent`,
        employmentStatus: `active`,
        workMode: `hybrid`,
        accessStatus: `active`,
        lastMovementId: movementId,
        updatedAt: serverTimestamp(),
        updatedBy: `admin`
      }
    );
    movementBatch.update(
      doc(adminDatabase, `nasna_companies`, companyId, `members`, `employee`),
      {
        status: `active`,
        updatedAt: serverTimestamp()
      }
    );
    movementBatch.update(
      doc(adminDatabase, `nasna_users`, `employee`),
      {
        status: `active`,
        updatedAt: serverTimestamp()
      }
    );
    movementBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeMovements`, movementId),
      {
        id: movementId,
        companyId,
        employeeId: `EMP-001`,
        employeeAuthUid: `employee`,
        movementType: `promotion`,
        effectiveDate: new Date(`2026-07-26T00:00:00Z`),
        reason: `Promotion after approved review`,
        previousPositionId: `POS-EMP`,
        newPositionId: `POS-SR`,
        previousManagerEmployeeId: `MGR-001`,
        newManagerEmployeeId: `MGR-001`,
        previousEmploymentType: `permanent`,
        newEmploymentType: `permanent`,
        previousEmploymentStatus: `active`,
        newEmploymentStatus: `active`,
        previousWorkMode: `onsite`,
        newWorkMode: `hybrid`,
        createdAt: serverTimestamp(),
        createdBy: `admin`
      }
    );
    movementBatch.set(
      doc(adminDatabase, `nasna_companies`, companyId, `auditLogs`, `AUDIT-MOVE-001`),
      auditData(`employee_movement.applied`, movementId)
    );
    await assertSucceeds(movementBatch.commit());

    const ownMovementQuery = query(
      collection(employeeDatabase, `nasna_companies`, companyId, `employeeMovements`),
      where(`employeeAuthUid`, `==`, `employee`)
    );
    const ownMovements = await assertSucceeds(getDocs(ownMovementQuery));
    if (ownMovements.size !== 1) {
      throw new Error(`Employee movement history was not readable by its owner.`);
    }
    await assertFails(getDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employeeMovements`, movementId)
    ));
    await assertFails(updateDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeMovements`, movementId),
      { reason: `Changed reason` }
    ));
    await assertFails(deleteDoc(
      doc(adminDatabase, `nasna_companies`, companyId, `employeeMovements`, movementId)
    ));
    await assertFails(setDoc(
      doc(managerDatabase, `nasna_companies`, companyId, `employeeMovements`, `MOVE-FAKE`),
      {
        id: `MOVE-FAKE`,
        companyId,
        employeeId: `EMP-002`,
        employeeAuthUid: `employee-two`,
        movementType: `manager_change`,
        effectiveDate: new Date(),
        reason: `Unauthorized`,
        previousPositionId: `POS-EMP`,
        newPositionId: `POS-EMP`,
        previousManagerEmployeeId: `MGR-001`,
        newManagerEmployeeId: ``,
        previousEmploymentType: `permanent`,
        newEmploymentType: `permanent`,
        previousEmploymentStatus: `active`,
        newEmploymentStatus: `active`,
        previousWorkMode: `onsite`,
        newWorkMode: `onsite`,
        createdAt: serverTimestamp(),
        createdBy: `manager`
      }
    ));

    console.log(JSON.stringify({
      rulesCompiled: true,
      hrCanCreateDocumentMetadata: true,
      employeeReadsOnlySharedOwnDocuments: true,
      managerCannotReadReportDocuments: true,
      employeesCannotWriteDocuments: true,
      insecureDocumentLinksBlocked: true,
      documentsCannotBeDeleted: true,
      directAssignmentEditsBlocked: true,
      mismatchedMovementTypesBlocked: true,
      movementAtomicallyUpdatesEmployee: true,
      employeeReadsOnlyOwnMovementHistory: true,
      managerCannotReadReportMovementHistory: true,
      movementsAreImmutable: true,
      onlyHrCanCreateMovements: true
    }, null, 2));
  } finally {
    await environment.cleanup();
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
