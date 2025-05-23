import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDXwRE-7Cxr6YKE6MPKB7m9aC4xbirkRVY",
  authDomain: "thinkr-298dd.firebaseapp.com",
  projectId: "thinkr-298dd",
  storageBucket: "thinkr-298dd.firebasestorage.app",
  messagingSenderId: "1087091426997",
  appId: "1:1087091426997:web:4e080caec0181377aa60fc",
  measurementId: "G-N20TE0F9VT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('signup').onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Signed up!");
      window.location.href = "dashboard.html";  // redirect after signup
    })
    .catch(err => alert(err.message));
};

document.getElementById('login').onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Logged in!");
      window.location.href = "dashboard.html";  // redirect after login
    })
    .catch(err => alert(err.message));
};

document.getElementById('logout').onclick = () => {
  signOut(auth).then(() => alert("Logged out"));
};

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
