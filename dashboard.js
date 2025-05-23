import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db = getFirestore(app);

onAuthStateChanged(auth, user => {
  if (!user) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  } else {
    document.getElementById('output').innerText = user.email;
  }
});

document.getElementById('saveData').onclick = async () => {
  const user = auth.currentUser;
  const data = document.getElementById('userData').value;
  await setDoc(doc(db, "users", user.uid), { data });
  alert("Data saved to Firestore!");
};

document.getElementById('logout').onclick = () => {
  signOut(auth).then(() => {
    alert("Logged out");
    window.location.href = "auth.html";
  });
};
