import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDXwRE-7Cxr6YKE6MPKB7m9aC4xbirkRVY",
    authDomain: "thinkr-298dd.firebaseapp.com",
    projectId: "thinkr-298dd",
    storageBucket: "thinkr-298dd.appspot.com",
    messagingSenderId: "1087091426997",
    appId: "1:1087091426997:web:4e080caec0181377aa60fc",
    measurementId: "G-N20TE0F9VT"
};

let app;
try {
    app = initializeApp(firebaseConfig);
} catch (err) {
    if (err.code === 'app/duplicate-app') {
        app = getApp();
    } else {
        console.error("Firebase initialization error", err);
        throw err;
    }
}
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
window.authFunctions = {
    signUp: (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    },
    logIn: (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    },
    logOut: () => {
        return signOut(auth);
    }
};

// Firestore functions
window.firestoreFunctions = {
    saveStudyPlan: async (userId, formData, generatedHTML) => {
        try {
            const docRef = await addDoc(collection(db, "studyPlans"), {
                userId: userId,
                class: formData.class,
                subject: formData.subject,
                lesson: formData.lesson,
                days: formData.days,
                hoursPerDay: formData.hoursPerDay || null,
                generatedHTML: generatedHTML,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },
    loadPreviousPlans: async (userId) => {
        const q = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Auth state listener
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in - redirect handled by your auth.html page
        return;
    }
    // User is logged in, you can load their data here if needed
    window.currentUser = user;
});
