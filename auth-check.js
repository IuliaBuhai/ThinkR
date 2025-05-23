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

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized services
export { auth, db, app };

// Export auth functions
export const authFunctions = {
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    logIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logOut: () => signOut(auth)
};

// Export firestore functions
export const firestoreFunctions = {
    saveStudyPlan: async (userId, formData, generatedHTML) => {
        try {
            const docRef = await addDoc(collection(db, "studyPlans"), {
                userId,
                ...formData,
                generatedHTML,
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
onAuthStateChanged(auth, (user) => {
    window.currentUser = user || null;
});
