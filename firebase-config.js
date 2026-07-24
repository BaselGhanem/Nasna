import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = Object.freeze({
  apiKey: `AIzaSyDP6FlbjAeUqut_79qW0T3rPSvfsjPdHfA`,
  authDomain: `gen-lang-client-0023266031.firebaseapp.com`,
  projectId: `gen-lang-client-0023266031`,
  storageBucket: `gen-lang-client-0023266031.firebasestorage.app`,
  messagingSenderId: `1052398695491`,
  appId: `1:1052398695491:web:77fe50eb0d8e3d1ec510f6`
});

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestoreDatabaseId = `ai-studio-2f881b3f-5867-4dfd-b360-c85f26c6ded4`;
const db = initializeFirestore(
  firebaseApp,
  {
    experimentalForceLongPolling: true
  },
  firestoreDatabaseId
);

export { auth, db, firebaseApp, firebaseConfig, firestoreDatabaseId };
