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

// Configurație Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDXwRE-7Cxr6YKE6MPKB7m9aC4xbirkRVY",
    authDomain: "thinkr-298dd.firebaseapp.com",
    projectId: "thinkr-298dd",
    storageBucket: "thinkr-298dd.appspot.com",
    messagingSenderId: "1087091426997",
    appId: "1:1087091426997:web:4e080caec0181377aa60fc",
    measurementId: "G-N20TE0F9VT"
};

// Inițializare Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utilizatorul curent
let currentUser = null;

// La încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    setupAuthHandlers();
    setupStudyPlanForm();

    // Ascultă schimbările de autentificare
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            loadPreviousPlans(user.uid);
        }
    });
});

// Gestionare autentificare
function setupAuthHandlers() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    document.getElementById('signup')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            alert("Cont creat cu succes!");
        } catch (err) {
            alert(`Eroare la înregistrare: ${err.message}`);
        }
    });

    document.getElementById('login')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            window.location.href = 'dashboard.html';
        } catch (err) {
            alert(`Eroare la autentificare: ${err.message}`);
        }
    });

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            if (window.location.pathname.includes('auth.html')) {
                window.location.href = 'dashboard.html';
            }
            loadPreviousPlans(user.uid);
        } else {
            if (!window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
        }
    });

    document.getElementById('logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            alert("Deconectat cu succes");
            currentUser = null;
            document.getElementById('plansList').innerHTML = '';
        } catch (err) {
            alert(`Eroare la deconectare: ${err.message}`);
        }
    });
}

// Formular plan de învățare
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
            const generatedHTML = await generateStudyPlanHTML(formData);
            document.getElementById('generatedPlan').innerHTML = generatedHTML;

            if (currentUser) {
                await saveStudyPlan(currentUser.uid, formData, generatedHTML);
                await loadPreviousPlans(currentUser.uid);
            } else {
                alert("Trebuie să fii autentificat pentru a salva planurile.");
            }
        } catch (error) {
            console.error("Eroare:", error);
            alert("A eșuat generarea sau salvarea planului. Verifică consola pentru detalii.");
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
        console.log("Plan salvat cu ID: ", docRef.id);
        return true;
    } catch (e) {
        console.error("Eroare la salvarea planului: ", e);
        throw e;
    }
}

async function loadPreviousPlans(userId) {
    try {
        const plansList = document.getElementById('plansList');
        if (!plansList) return;

        plansList.innerHTML = '<p>Se încarcă planurile tale...</p>';

        const q = query(collection(db, "studyPlans"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            plansList.innerHTML = '<p>Nu există planuri salvate</p>';
            return;
        }

        plansList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const plan = doc.data();
            const planItem = document.createElement('div');
            planItem.className = 'plan-item';
            planItem.innerHTML = `
                <h3>${plan.subject} - ${plan.lesson}</h3>
                <p>Creat la: ${plan.createdAt?.toDate().toLocaleDateString() || 'dată necunoscută'}</p>
            `;
            planItem.addEventListener('click', () => {
                document.getElementById('generatedPlan').innerHTML = plan.generatedHTML;
            });
            plansList.appendChild(planItem);
        });
    } catch (error) {
        console.error("Eroare la încărcarea planurilor:", error);
        document.getElementById('plansList').innerHTML = '<p>Eroare la încărcarea planurilor</p>';
    }
}

// Integrare OpenAI
async function generateStudyPlanHTML(formData) {
    const OPENAI_API_KEY = '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';

    const hoursText = formData.hoursPerDay
        ? `timp de ${formData.hoursPerDay} ore pe zi`
        : '';

    const prompt = `Creează un plan de învățare detaliat pentru:
- Clasa: ${formData.class}
- Materie: ${formData.subject}
- Lecția: ${formData.lesson}
- Durată: ${formData.days} zile ${hoursText}

Planul trebuie să includă:
1. Împărțirea pe zile a conținutului de studiat
2. Tehnici de învățare recomandate
3. Resurse utile
4. Exerciții de practică

Formatează răspunsul în HTML cu titluri și liste.`

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
            throw new Error(data.error?.message || 'Generarea planului a eșuat.');
        }

        const generatedContent = data.choices[0]?.message?.content;

        return `
            <div class="study-plan">
                <h2>Plan de învățare: ${formData.subject} - ${formData.lesson}</h2>
                <p><strong>Clasa:</strong> ${formData.class}</p>
                <p><strong>Durată:</strong> ${formData.days} zile ${hoursText}</p>
                ${generatedContent}
                <p><em>Plan generat la data de ${new Date().toLocaleDateString()}</em></p>
            </div>
        `;
    } catch (error) {
        console.error("Eroare la apelul OpenAI:", error);
        return simpleFallbackPlan(formData);
    }
}

// Plan de rezervă dacă OpenAI eșuează
function simpleFallbackPlan(formData) {
    return `
        <div class="study-plan">
            <h2>Plan de test pentru ${formData.subject}</h2>
            <p>Acesta este un plan de test. Integrarea cu OpenAI trebuie finalizată pentru planuri reale.</p>
        </div>
    `;
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
