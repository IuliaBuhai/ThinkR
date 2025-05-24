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


let timerInterval = null;
let startTime = null;
let currentSubject = null;


// Track current user
let currentUser = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setupAuthHandlers();
    setupStudyPlanForm();
    
    // Single auth state listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            // Redirect to dashboard if on auth page
            if (window.location.pathname.includes('auth.html') || 
                window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
            loadPreviousPlans(user.uid);
        } else {
            // Redirect to auth if not on auth page
            if (!window.location.pathname.includes('auth.html') && 
                window.location.pathname !== '/') {
                window.location.href = 'auth.html';
            }
        }
    });
});

// Authentication Functions
function setupAuthHandlers() {
    // Login form
    const loginForm = document.getElementById('formularLogin');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
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
    const signupForm = document.getElementById('formularSignup');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('numeInregistrare').value;
            const email = document.getElementById('emailInregistrare').value;
            const password = document.getElementById('parolaInregistrare').value;
            const confirmPassword = document.getElementById('confirmaParola').value;
            const errorElement = document.getElementById('signupError');
            
            // Validate password match
            if (password !== confirmPassword) {
                errorElement.textContent = "Parolele nu coincid!";
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                // You could save the user's name to Firestore here
            } catch (err) {
                errorElement.textContent = getRomanianErrorMessage(err.code);
                console.error("Signup error:", err);
            }
        });
    }

    // Logout button
    document.getElementById('logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            alert("Te-ai deconectat cu succes!");
            currentUser = null;
            document.getElementById('plansList').innerHTML = '';
        } catch (err) {
            alert(err.message);
        }
    });
}

// Helper function to translate Firebase errors to Romanian
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

// [Rest of your study plan functions remain the same...]
// Study Plan Functions
function setupStudyPlanForm() {
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
            // Generate plan
            const generatedHTML = await generateStudyPlanHTML(formData);
            document.getElementById('generatedPlan').innerHTML = generatedHTML;
            
            // Save plan if user is logged in
            if (currentUser) {
                await saveStudyPlan(currentUser.uid, formData, generatedHTML);
                await loadPreviousPlans(currentUser.uid);
            } else {
                alert("Trebuie să fi conectat ca să poți genera planuri");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to generate or save plan. See console for details.");
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
    try {
        const plansList = document.getElementById('plansList');
        if (!plansList) return;
        
        plansList.innerHTML = '<p>Loading your plans...</p>';
        
        const q = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            plansList.innerHTML = '<p>No saved plans found</p>';
            return;
        }
        
        plansList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const plan = doc.data();
            const planItem = document.createElement('div');
            planItem.className = 'plan-item';
            planItem.innerHTML = `
                <h3>${plan.subject} - ${plan.lesson}</h3>
                <p>Created: ${plan.createdAt?.toDate().toLocaleDateString() || 'Unknown date'}</p>
            `;
            planItem.addEventListener('click', () => {
                document.getElementById('generatedPlan').innerHTML = plan.generatedHTML;
            });
            plansList.appendChild(planItem);
        });
    } catch (error) {
        console.error("Error loading plans:", error);
        document.getElementById('plansList').innerHTML = '<p>Error loading plans</p>';
    }
}


// Study Tracker Functions
function setupStudyTracker() {
    const startBtn = document.getElementById('startStudy');
    const stopBtn = document.getElementById('stopStudy');
    const subjectSelect = document.getElementById('studySubject');
    const timerDisplay = document.getElementById('studyTimer');

    if (!startBtn || !stopBtn || !subjectSelect || !timerDisplay) return;

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

    // Populate subject dropdown
    romanianSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });

    startBtn.addEventListener('click', () => {
        currentSubject = subjectSelect.value;
        if (!currentSubject) {
            alert('Selectează o materie înainte de a începe!');
            return;
        }

        startTime = new Date();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        subjectSelect.disabled = true;

        // Update timer every second
        timerInterval = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now - startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    });

    stopBtn.addEventListener('click', async () => {
        if (!timerInterval) return;
        
        clearInterval(timerInterval);
        timerInterval = null;
        
        const endTime = new Date();
        const durationInSeconds = Math.floor((endTime - startTime) / 1000);
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        subjectSelect.disabled = false;
        
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
            } catch (error) {
                console.error("Error saving study session:", error);
                alert("Eroare la salvarea sesiunii. Vezi consola pentru detalii.");
            }
        } else {
            alert("Trebuie să fii autentificat pentru a salva sesiunile de studiu!");
        }
        
        timerDisplay.textContent = "00:00:00";
    });
}

async function saveStudySession(userId, subject, startTime, endTime, durationInSeconds) {
    try {
        await addDoc(collection(db, "studySessions"), {
            userId,
            subject,
            startTime,
            endTime,
            durationInSeconds,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving study session:", error);
        throw error;
    }
}

// Study History Functions
function setupStudyHistory() {
    // You can add any initialization needed for the history section here
}

async function loadStudyHistory(userId) {
    try {
        const historyContainer = document.getElementById('studyHistory');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '<p>Se încarcă istoricul...</p>';
        
        const q = query(
            collection(db, "studySessions"), 
            where("userId", "==", userId),
            orderBy("startTime", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            historyContainer.innerHTML = '<p>Nu ai nicio sesiune de studiu înregistrată.</p>';
            return;
        }
        
        let historyHTML = `
            <table class="study-history-table">
                <thead>
                    <tr>
                        <th>Materie</th>
                        <th>Dată</th>
                        <th>Ora început</th>
                        <th>Ora sfârșit</th>
                        <th>Durată</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        querySnapshot.forEach((doc) => {
            const session = doc.data();
            const startDate = session.startTime.toDate();
            const endDate = session.endTime.toDate();
            
            const durationHours = Math.floor(session.durationInSeconds / 3600);
            const durationMinutes = Math.floor((session.durationInSeconds % 3600) / 60);
            const durationSeconds = session.durationInSeconds % 60;
            
            historyHTML += `
                <tr>
                    <td>${session.subject}</td>
                    <td>${startDate.toLocaleDateString('ro-RO')}</td>
                    <td>${startDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${endDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}</td>
                </tr>
            `;
        });
        
        historyHTML += `
                </tbody>
            </table>
        `;
        
        historyContainer.innerHTML = historyHTML;
    } catch (error) {
        console.error("Error loading study history:", error);
        document.getElementById('studyHistory').innerHTML = '<p>Eroare la încărcarea istoricului.</p>';
    }
}


// OpenAI Integration (replace with your actual implementation)
async function generateStudyPlanHTML(formData) {
    // This is where you'll call the OpenAI API
    const OPENAI_API_KEY = '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'; // Replace with your actual key
    
    const hoursText = formData.hoursPerDay 
        ? `for ${formData.hoursPerDay} hour(s) per day` 
        : '';
    
    // Create the prompt for OpenAI
    const prompt = `Crează un plan detaliat de studiu pentru:
    - Clasa: ${formData.class}
    - Materia: ${formData.subject}
    - Lecția: ${formData.lesson}
    - Durată: ${formData.days} zile ${hoursText}
    
        Planul trebuie să includă:
        1. Detalierea zilnică a subiectelor de abordat
        2. Tehnici de studiu sugerate
        3. Resurse recomandate cu denumiri de cărți școlare sau populare
        4. Exerciții practice - și grele și ușoare 

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
        
        // Get the generated content
        const generatedContent = data.choices[0]?.message?.content;
        
        // Wrap in a div for styling
        return `
            <div class="study-plan">
                <h2>Plan de studiu pentru ${formData.subject} - ${formData.lesson}</h2>
                <p><strong>Clasa:</strong> ${formData.class}</p>
                <p><strong>Durata:</strong> ${formData.days} zile ${hoursText}</p>
                ${generatedContent}
                <p><em>Plan generat la data de ${new Date().toLocaleDateString()}</em></p>
            </div>
        `;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        // Fallback to simple plan if API fails
        return simpleFallbackPlan(formData);
    }
}

function simpleFallbackPlan(formData) {
    return `
        <div class="study-plan">
            <h2>Test Plan for ${formData.subject}</h2>
            <p>This is a test plan. Implement OpenAI API for real plans.</p>
        </div>
    `;
}
