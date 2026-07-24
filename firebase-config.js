import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: `AIzaSyDP6FlbjAeUqut_79qW0T3rPSvfsjPdHfA`,
  authDomain: `gen-lang-client-0023266031.firebaseapp.com`,
  projectId: `gen-lang-client-0023266031`,
  storageBucket: `gen-lang-client-0023266031.firebasestorage.app`,
  messagingSenderId: `1052398695491`,
  appId: `1:1052398695491:web:77fe50eb0d8e3d1ec510f6`
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { auth, firebaseApp };
