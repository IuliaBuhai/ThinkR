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
        elements.studyHistory.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Se încarcă istoricul...</p>
            </div>
        `;
        
        const q = query(
            collection(db, "studySessions"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            elements.studyHistory.innerHTML = `
                <div class="empty-state">
                    <i class="icon-book"></i>
                    <p>Nu ai nicio sesiune înregistrată</p>
                    <small>Începe să studiezi pentru a vedea istoricul aici</small>
                </div>
            `;
            return;
        }
        
        let historyHTML = '';
        querySnapshot.forEach(doc => {
            const session = doc.data();
            const startDate = session.startTime.toDate();
            
            // Calculate all time components
            const durationHours = Math.floor(session.durationInSeconds / 3600);
            const remainingSeconds = session.durationInSeconds % 3600;
            const durationMinutes = Math.floor(remainingSeconds / 60);
            const durationSeconds = remainingSeconds % 60;
            
            // Format date and time beautifully
            const formattedDate = startDate.toLocaleDateString('ro-RO', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const formattedTime = startDate.toLocaleTimeString('ro-RO', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format duration with conditional display
            let durationDisplay = '';
            if (durationHours > 0) {
                durationDisplay += `${durationHours}h `;
            }
            if (durationMinutes > 0 || durationHours > 0) {
                durationDisplay += `${durationMinutes}m `;
            }
            durationDisplay += `${durationSeconds}s`;
            
            historyHTML += `
                <div class="session-card">
                    <div class="session-header">
                        <span class="subject-badge">${session.subject || 'Nespecificat'}</span>
                        <span class="date-badge">${formattedDate}</span>
                    </div>
                    <div class="session-body">
                        <div class="time-info">
                            <span class="time-icon">🕒</span>
                            <span>${formattedTime}</span>
                        </div>
                        <div class="duration-info">
                            <span class="duration-icon">⏱️</span>
                            <span>${durationDisplay}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        elements.studyHistory.innerHTML = `
            <div class="study-history-container">
                <h3 class="history-title">Ultimele sesiuni de studiu</h3>
                <div class="sessions-list">${historyHTML}</div>
            </div>
        `;
    } catch (error) {
        console.error("Error loading study history:", error);
        elements.studyHistory.innerHTML = `
            <div class="error-state">
                <i class="icon-warning"></i>
                <p>Eroare la încărcarea istoricului</p>
                <small>${error.message}</small>
                <button class="retry-button" onclick="loadStudyHistory('${userId}')">
                    Încearcă din nou
                </button>
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
  try {
    const response = await fetch(
      "/.netlify/functions/generate-plan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const { html } = await response.json();
    return html;

  } catch (error) {
    console.error("Fetch error:", error);
    return `
      <div class="error-message">
        <h3>Eroare la generarea planului</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Încearcă din nou</button>
      </div>
    `;
  }
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
