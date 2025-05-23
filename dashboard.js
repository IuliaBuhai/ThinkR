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
    document.getElementById('output').innerText = "Welcome, " + user.email;
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

async function showUserData() {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("output").textContent = "You need to be logged in to see data.";
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } else {
    document.getElementById("output").textContent = "No data found for this user.";
  }
}

// Call this function after user is logged in and auth is ready
onAuthStateChanged(auth, user => {
  if (user) {
    showUserData();
  } else {
    document.getElementById("output").textContent = "Please log in to view your data.";
  }
});
