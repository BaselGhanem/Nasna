import { initializeFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseApp } from "./firebase-config.js?v=20260726.3";

const firestoreDatabaseId = `ai-studio-2f881b3f-5867-4dfd-b360-c85f26c6ded4`;
const db = initializeFirestore(
  firebaseApp,
  {
    experimentalForceLongPolling: true
  },
  firestoreDatabaseId
);

export { db, firestoreDatabaseId };
