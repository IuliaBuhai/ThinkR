import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please log in to access this page.");
    window.location.href = "auth.html";  // Redirect if not logged in
    return;
  }

  // User is logged in! Now fetch their Firestore data
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      // Example: show the user email on the page
      const emailElem = document.getElementById("userEmail");
      if (emailElem) {
        emailElem.textContent = userData.email || user.email;
      }
      
      // You can now use userData anywhere in this script
      console.log("User data:", userData);
    } else {
      console.log("No user data found in Firestore for this user.");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
});
