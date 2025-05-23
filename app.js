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

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXwRE-7Cxr6YKE6MPKB7m9aC4xbirkRVY",
    authDomain: "thinkr-298dd.firebaseapp.com",
    projectId: "thinkr-298dd",
    storageBucket: "thinkr-298dd.appspot.com",
    messagingSenderId: "1087091426997",
    appId: "1:1087091426997:web:4e080caec0181377aa60fc",
    measurementId: "G-N20TE0F9VT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Authentication Functions
function setupAuthHandlers() {
    document.getElementById('signup')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            alert("Signed up successfully!");
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('login')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            alert("Logged in successfully!");
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            alert("Logged out successfully");
            window.currentUser = null;
        } catch (err) {
            alert(err.message);
        }
    });
}

// Study Plan Functions
async function handleStudyPlanForm() {
    const form = document.getElementById('studyPlanForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            class: form.class.value,
            subject: form.subject.value,
            lesson: form.lesson.value,
            days: parseInt(form.days.value),
            hoursPerDay: form.hoursPerDay.value ? parseInt(form.hoursPerDay.value) : null
        };
        
        try {
            const generatedHTML = await generateStudyPlanHTML(formData);
            document.getElementById('generatedPlan').innerHTML = generatedHTML;
            
            if (window.currentUser) {
                await saveStudyPlan(window.currentUser.uid, formData, generatedHTML);
                await loadPreviousPlans(window.currentUser.uid);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        }
    });
}

async function saveStudyPlan(userId, formData, generatedHTML) {
    try {
        await addDoc(collection(db, "studyPlans"), {
            userId,
            ...formData,
            generatedHTML,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error saving plan:", e);
        throw e;
    }
}

async function loadPreviousPlans(userId) {
    try {
        const plansList = document.getElementById('plansList');
        if (!plansList) return;
        
        plansList.innerHTML = '';
        
        const q = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const plan = doc.data();
            const planItem = document.createElement('div');
            planItem.className = 'plan-item';
            planItem.innerHTML = `
                <h3>${plan.subject} - ${plan.lesson}</h3>
                <p>Created: ${plan.createdAt.toDate().toLocaleDateString()}</p>
            `;
            planItem.addEventListener('click', () => {
                document.getElementById('generatedPlan').innerHTML = plan.generatedHTML;
            });
            plansList.appendChild(planItem);
        });
    } catch (error) {
        console.error("Error loading plans:", error);
    }
}

// OpenAI Integration
async function generateStudyPlanHTML(formData) {
    const OPENAI_API_KEY = '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'; // Replace with your actual key
    const hoursText = formData.hoursPerDay ? `for ${formData.hoursPerDay} hour(s) per day` : '';
    
    const prompt = `Create a detailed study plan for:
    - Class: ${formData.class}
    - Subject: ${formData.subject}
    - Lesson: ${formData.lesson}
    - Duration: ${formData.days} days ${hoursText}
    
    Include daily tasks, resources, and practice exercises in HTML format.`;
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API error');
        
        const content = data.choices[0]?.message?.content || '';
        
        return `
            <div class="study-plan">
                <h2>Study Plan for ${formData.subject} - ${formData.lesson}</h2>
                <p><strong>Class:</strong> ${formData.class}</p>
                <p><strong>Duration:</strong> ${formData.days} days ${hoursText}</p>
                ${content}
                <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
            </div>
        `;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return simpleFallbackPlan(formData);
    }
}

function simpleFallbackPlan(formData) {
    let planHTML = `
        <div class="study-plan">
            <h2>Study Plan for ${formData.subject}</h2>
            <p>Duration: ${formData.days} days</p>
            <ul>
    `;
    
    for (let day = 1; day <= formData.days; day++) {
        planHTML += `<li><strong>Day ${day}:</strong> Study ${formData.lesson}</li>`;
    }
    
    planHTML += `</ul></div>`;
    return planHTML;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Auth State Listener
    onAuthStateChanged(auth, (user) => {
        window.currentUser = user || null;
    });

    setupAuthHandlers();
    handleStudyPlanForm();
});
