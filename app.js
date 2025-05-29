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
    serverTimestamp,
    orderBy,
    limit,
    Timestamp
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

// Global Variables
let timerInterval = null;
let startTime = null;
let currentSubject = null;
let currentUser = null;

// DOM Elements
const elements = {
    loginForm: document.getElementById('formularLogin'),
    signupForm: document.getElementById('formularSignup'),
    logoutBtn: document.getElementById('logout'),
    startStudyBtn: document.getElementById('startStudy'),
    stopStudyBtn: document.getElementById('stopStudy'),
    subjectSelect: document.getElementById('studySubject'),
    timerDisplay: document.getElementById('studyTimer'),
    studyHistory: document.getElementById('studyHistory'),
    planForm: document.getElementById('studyPlanForm'),
    generatedPlan: document.getElementById('generatedPlan'),
    plansList: document.getElementById('plansList'),
    totalHours: document.getElementById('totalHours'),
    subjectsCount: document.getElementById('subjectsCount'),
    completedPlans: document.getElementById('completedPlans')
};

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
    setupAuthHandlers();
    setupStudyPlanForm();
    setupStudyTracker();
    
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            if (window.location.pathname.includes('auth.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
            loadUserStats(user.uid);
            loadStudyHistory(user.uid);
            loadPreviousPlans(user.uid);
        } else {
            if (!window.location.pathname.includes('auth.html') && window.location.pathname !== '/') {
                window.location.href = 'auth.html';
            }
        }
    });
});

// Authentication Functions
function setupAuthHandlers() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailAutentificare').value;
            const password = document.getElementById('parolaAutentificare').value;
            const errorElement = document.getElementById('loginError');
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                errorElement.textContent = getRomanianErrorMessage(err.code);
                console.error("Login error:", err);
            }
        });
    }

    // Signup form
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('numeInregistrare').value;
            const email = document.getElementById('emailInregistrare').value;
            const password = document.getElementById('parolaInregistrare').value;
            const confirmPassword = document.getElementById('confirmaParola').value;
            const errorElement = document.getElementById('signupError');
            
            if (password !== confirmPassword) {
                errorElement.textContent = "Parolele nu coincid!";
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (err) {
                errorElement.textContent = getRomanianErrorMessage(err.code);
                console.error("Signup error:", err);
            }
        });
    }

    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
            } catch (err) {
                console.error("Logout error:", err);
            }
        });
    }
}

function getRomanianErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Acest email este deja înregistrat.',
        'auth/invalid-email': 'Adresa de email este invalidă.',
        'auth/operation-not-allowed': 'Operația nu este permisă.',
        'auth/weak-password': 'Parola este prea slabă (minim 8 caractere).',
        'auth/user-disabled': 'Contul a fost dezactivat.',
        'auth/user-not-found': 'Nu există un cont asociat acestui email.',
        'auth/wrong-password': 'Parolă incorectă.',
        'auth/too-many-requests': 'Prea multe încercări. Încearcă mai târziu.'
    };
    return messages[errorCode] || 'A apărut o eroare. Te rugăm să încerci din nou.';
}

// Study Tracker Functions
function setupStudyTracker() {
    if (!elements.startStudyBtn || !elements.stopStudyBtn || !elements.subjectSelect || !elements.timerDisplay) return;

    // Romanian school subjects
    const romanianSubjects = [
        "Matematică",
        "Limba Română",
        "Limba Engleză",
        "Limba Franceză",
        "Fizică",
        "Chimie",
        "Biologie",
        "Istorie",
        "Geografie",
        "Informatică",
        "Educație Fizică",
        "Educație Civică",
        "Filozofie",
        "Logica",
        "Economie",
        "Psihologie",
        "Sociologie",
        "Religie",
        "Alte Materii"
    ];

    // Clear existing options except the first one
    while (elements.subjectSelect.options.length > 1) {
        elements.subjectSelect.remove(1);
    }

    // Populate subject dropdown
    romanianSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        elements.subjectSelect.appendChild(option);
    });

    elements.startStudyBtn.addEventListener('click', () => {
        currentSubject = elements.subjectSelect.value;
        if (!currentSubject) {
            alert('Selectează o materie înainte de a începe!');
            return;
        }

        startTime = new Date();
        elements.startStudyBtn.disabled = true;
        elements.stopStudyBtn.disabled = false;
        elements.subjectSelect.disabled = true;

        timerInterval = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now - startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            elements.timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    });

    elements.stopStudyBtn.addEventListener('click', async () => {
        if (!timerInterval) return;
        
        clearInterval(timerInterval);
        timerInterval = null;
        
        const endTime = new Date();
        const durationInSeconds = Math.floor((endTime - startTime) / 1000);
        
        elements.startStudyBtn.disabled = false;
        elements.stopStudyBtn.disabled = true;
        elements.subjectSelect.disabled = false;
        
        if (currentUser) {
            try {
                await saveStudySession(
                    currentUser.uid,
                    currentSubject,
                    startTime,
                    endTime,
                    durationInSeconds
                );
                alert(`Sesiunea de studiu pentru ${currentSubject} a fost salvată!`);
                loadStudyHistory(currentUser.uid);
                loadUserStats(currentUser.uid);
            } catch (error) {
                console.error("Error saving study session:", error);
                alert("Eroare la salvarea sesiunii. Vezi consola pentru detalii.");
            }
        } else {
            alert("Trebuie să fii autentificat pentru a salva sesiunile de studiu!");
        }
        
        elements.timerDisplay.textContent = "00:00:00";
    });
}

async function saveStudySession(userId, subject, startTime, endTime, durationInSeconds) {
    try {
        await addDoc(collection(db, "studySessions"), {
            userId,
            subject,
            startTime: Timestamp.fromDate(startTime),
            endTime: Timestamp.fromDate(endTime),
            durationInSeconds,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving study session:", error);
        throw error;
    }
}

// Data Loading Functions
async function loadUserStats(userId) {
    try {
        // Get total study hours
        const sessionsQuery = query(collection(db, "studySessions"), where("userId", "==", userId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        
        let totalHours = 0;
        let subjects = new Set();
        
        sessionsSnapshot.forEach((doc) => {
            const session = doc.data();
            totalHours += session.durationInSeconds / 3600;
            subjects.add(session.subject);
        });
        
        if (elements.totalHours) elements.totalHours.textContent = Math.round(totalHours);
        if (elements.subjectsCount) elements.subjectsCount.textContent = subjects.size;
        
        // Get completed plans count
        const plansQuery = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const plansSnapshot = await getDocs(plansQuery);
        if (elements.completedPlans) elements.completedPlans.textContent = plansSnapshot.size;
        
    } catch (error) {
        console.error("Error loading user stats:", error);
    }
}

async function loadStudyHistory(userId) {
    if (!elements.studyHistory) {
        console.error("Study history element not found");
        return;
    }
    
    try {
        console.log("Loading study history for user:", userId);
        elements.studyHistory.innerHTML = '<div class="loading">Se încarcă istoricul...</div>';
        
        const q = query(
            collection(db, "studySessions"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        
        console.log("Executing query...");
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} documents`);
        
        if (querySnapshot.empty) {
            console.log("No sessions found for user");
            elements.studyHistory.innerHTML = '<div class="error-message">Nu ai nicio sesiune înregistrată</div>';
            return;
        }
        
        let historyHTML = '';
        querySnapshot.forEach(doc => {
            const session = doc.data();
            console.log("Processing session:", session);
            
            // Convert Firestore timestamp to Date
            const startDate = session.startTime.toDate();
            
            // Calculate duration
            const durationHours = Math.floor(session.durationInSeconds / 3600);
            const durationMinutes = Math.floor((session.durationInSeconds % 3600) / 60);
            
            historyHTML += `
                <div class="session-item">
                    <div class="session-info">
                        <div class="session-subject">${session.subject || 'Nespecificat'}</div>
                        <div class="session-date">${startDate.toLocaleDateString('ro-RO')} - ${startDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div class="session-duration">
                        ${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}
                    </div>
                </div>
            `;
        });
        
        elements.studyHistory.innerHTML = historyHTML;
    } catch (error) {
        console.error("Error loading study history:", error);
        elements.studyHistory.innerHTML = `
            <div class="error-message">
                Eroare la încărcarea istoricului. 
                <button onclick="loadStudyHistory('${userId}')">Încearcă din nou</button>
                <p>Detalii eroare: ${error.message}</p>
            </div>
        `;
    }
}
// Study Plan Functions
function setupStudyPlanForm() {
    if (!elements.planForm) return;

    elements.planForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            class: document.getElementById('class').value,
            subject: document.getElementById('subject').value,
            lesson: document.getElementById('lesson').value,
            days: document.getElementById('days').value,
            hoursPerDay: document.getElementById('hoursPerDay').value
        };

        try {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading';
            loadingElement.textContent = 'Se generează planul de studiu...';
            elements.generatedPlan.innerHTML = '';
            elements.generatedPlan.appendChild(loadingElement);
            
            const generatedHTML = await generateStudyPlanHTML(formData);
            elements.generatedPlan.innerHTML = generatedHTML;
            
            if (currentUser) {
                await saveStudyPlan(currentUser.uid, formData, generatedHTML);
                await loadPreviousPlans(currentUser.uid);
            }
        } catch (error) {
            console.error("Error generating study plan:", error);
            elements.generatedPlan.innerHTML = simpleFallbackPlan(formData);
        }
    });
}

async function saveStudyPlan(userId, formData, generatedHTML) {
    try {
        const docRef = await addDoc(collection(db, "studyPlans"), {
            userId,
            class: formData.class,
            subject: formData.subject,
            lesson: formData.lesson,
            days: formData.days,
            hoursPerDay: formData.hoursPerDay,
            generatedHTML,
            createdAt: serverTimestamp()
        });
        console.log("Plan saved with ID: ", docRef.id);
        return true;
    } catch (e) {
        console.error("Error saving plan: ", e);
        throw e;
    }
}

async function loadPreviousPlans(userId) {
    if (!elements.plansList) return;
    
    try {
        elements.plansList.innerHTML = '<p>Se încarcă planurile tale...</p>';
        
        const q = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            elements.plansList.innerHTML = '<p>Nu ai planuri salvate</p>';
            return;
        }
        
        elements.plansList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const plan = doc.data();
            const planItem = document.createElement('div');
            planItem.className = 'plan-item';
            planItem.innerHTML = `
                <h3>${plan.subject} - ${plan.lesson}</h3>
                <p>Creat: ${plan.createdAt?.toDate().toLocaleDateString('ro-RO') || 'Dată necunoscută'}</p>
            `;
            planItem.addEventListener('click', () => {
                elements.generatedPlan.innerHTML = plan.generatedHTML;
            });
            elements.plansList.appendChild(planItem);
        });
    } catch (error) {
        console.error("Error loading plans:", error);
        elements.plansList.innerHTML = '<p>Eroare la încărcarea planurilor</p>';
    }
}

// OpenAI Integration
async function generateStudyPlanHTML(formData) {
    const OPENAI_API_KEY = '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';
    
    const hoursText = formData.hoursPerDay 
        ? `pentru ${formData.hoursPerDay} oră/ore pe zi` 
        : '';
    
    const prompt = `Crează un plan detaliat de studiu pentru:
    - Clasa: ${formData.class}
    - Materia: ${formData.subject}
    - Lecția: ${formData.lesson}
    - Durată: ${formData.days} zile ${hoursText}
    
    Planul trebuie să includă:
    1. Detalierea zilnică a subiectelor de abordat
    2. Tehnici de studiu sugerate
    3. Resurse recomandate
    4. Exerciții practice
    
    Formatați răspunsul în HTML cu titluri și liste adecvate.`;
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate plan');
        }
        
        const generatedContent = data.choices[0]?.message?.content;
        
        return `
            <div class="study-plan">
                <h2>Plan de studiu pentru ${formData.subject} - ${formData.lesson}</h2>
                <p><strong>Clasa:</strong> ${formData.class}</p>
                <p><strong>Durata:</strong> ${formData.days} zile ${hoursText}</p>
                ${generatedContent}
                <p><em>Plan generat la data de ${new Date().toLocaleDateString('ro-RO')}</em></p>
            </div>
        `;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return simpleFallbackPlan(formData);
    }
}

function simpleFallbackPlan(formData) {
    return `
        <div class="study-plan">
            <h2>Plan de studiu pentru ${formData.subject}</h2>
            <p>Ne pare rău, generarea planului a eșuat. Te rugăm să încerci din nou.</p>
        </div>
    `;
}

// Utility Functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Export functions for debugging
if (window) {
    window.app = {
        auth,
        db,
        currentUser,
        saveStudySession,
        loadStudyHistory,
        generateStudyPlanHTML
    };
}
