import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

document.getElementById('signup').onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Signed up!"))
    .catch(err => alert(err.message));
};

document.getElementById('login').onclick = () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert("Logged in!"))
    .catch(err => alert(err.message));
};

document.getElementById('logout').onclick = () => {
  signOut(auth).then(() => alert("Logged out"));
};


document.addEventListener('DOMContentLoaded', () => {
    // Study Plan Form Handling
    const form = document.getElementById('studyPlanForm');
    
    if (form) {
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
                // Generate the study plan
                const generatedHTML = await generateStudyPlanHTML(formData);
                
                // Display the generated plan
                const generatedPlan = document.getElementById('generatedPlan');
                generatedPlan.innerHTML = generatedHTML;
                
                // Save to Firebase if user is logged in
                if (window.currentUser) {
                    await firestoreFunctions.saveStudyPlan(window.currentUser.uid, formData, generatedHTML);
                    await loadPreviousPlans();
                }
            } catch (error) {
                console.error("Error generating or saving plan:", error);
                alert("An error occurred. Please try again.");
            }
        });
    }

    // Load previous plans if user is logged in
    if (window.currentUser) {
        loadPreviousPlans();
    }
});

async function loadPreviousPlans() {
    try {
        const plansList = document.getElementById('plansList');
        if (!plansList) return;
        
        plansList.innerHTML = '';
        
        const plans = await firestoreFunctions.loadPreviousPlans(window.currentUser.uid);
        
        plans.forEach(plan => {
            const planItem = document.createElement('div');
            planItem.className = 'plan-item';
            planItem.innerHTML = `
                <h3>${plan.subject} - ${plan.lesson}</h3>
                <p>Created on ${plan.createdAt.toDate().toLocaleDateString()}</p>
            `;
            planItem.addEventListener('click', () => {
                document.getElementById('generatedPlan').innerHTML = plan.generatedHTML;
            });
            plansList.appendChild(planItem);
        });
    } catch (error) {
        console.error("Error loading previous plans:", error);
    }
}

async function generateStudyPlanHTML(formData) {
    // This is where you would call your API to generate the actual plan
    // For now, we'll use a simple template
    
    const hoursText = formData.hoursPerDay 
        ? `for ${formData.hoursPerDay} hour(s) per day` 
        : '';
    
    let planHTML = `
        <div class="study-plan">
            <h2>Study Plan for ${formData.subject} - ${formData.lesson}</h2>
            <p><strong>Class:</strong> ${formData.class}</p>
            <p><strong>Duration:</strong> ${formData.days} days ${hoursText}</p>
            
            <h3>Daily Study Schedule:</h3>
            <ul>
    `;
    
    // Generate daily tasks - replace with your actual plan generation
    for (let day = 1; day <= formData.days; day++) {
        let dayContent = '';
        
        if (day === 1) {
            dayContent = `Introduction to ${formData.lesson} and key concepts`;
        } else if (day === formData.days) {
            dayContent = `Review and practice test for ${formData.lesson}`;
        } else {
            dayContent = `Deep study of ${formData.lesson} topics and exercises`;
        }
        
        planHTML += `
            <li>
                <strong>Day ${day}:</strong> ${dayContent}
            </li>
        `;
    }
    
    planHTML += `
            </ul>
            <p><em>Plan generated on ${new Date().toLocaleDateString()}</em></p>
        </div>
    `;
    
    return planHTML;
}

// If you need to keep some of your old auth-related code in this file:
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');

if (signupBtn) {
    signupBtn.onclick = () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        authFunctions.signUp(email, password)
            .then(() => alert("Signed up successfully!"))
            .catch(err => alert(err.message));
    };
}

if (loginBtn) {
    loginBtn.onclick = () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        authFunctions.logIn(email, password)
            .then(() => alert("Logged in successfully!"))
            .catch(err => alert(err.message));
    };
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        authFunctions.logOut()
            .then(() => {
                alert("Logged out successfully");
                window.currentUser = null;
            })
            .catch(err => alert(err.message));
    };
}
