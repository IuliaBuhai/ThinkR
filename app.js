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

let app;
try {
    app = initializeApp(firebaseConfig);
} catch (err) {
    if (err.code === 'app/duplicate-app') {
        app = getApp();
    } else {
        throw err;
    }
}

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
    // This is where you'll call the OpenAI API
    const OPENAI_API_KEY = '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'; // Replace with your actual key
    
    const hoursText = formData.hoursPerDay 
        ? `for ${formData.hoursPerDay} hour(s) per day` 
        : '';
    
    // Create the prompt for OpenAI
    const prompt = `Create a detailed study plan for:
    - Class: ${formData.class}
    - Subject: ${formData.subject}
    - Lesson: ${formData.lesson}
    - Duration: ${formData.days} days ${hoursText}
    
    The plan should include:
    1. Daily breakdown of topics to cover
    2. Suggested study techniques
    3. Recommended resources
    4. Practice exercises
    
    Format the response in HTML with proper headings and lists.`;
    
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
                <h2>Study Plan for ${formData.subject} - ${formData.lesson}</h2>
                <p><strong>Class:</strong> ${formData.class}</p>
                <p><strong>Duration:</strong> ${formData.days} days ${hoursText}</p>
                ${generatedContent}
                <p><em>Plan generated on ${new Date().toLocaleDateString()}</em></p>
            </div>
        `;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        // Fallback to simple plan if API fails
        return simpleFallbackPlan(formData);
    }
}

function simpleFallbackPlan(formData) {
    // Simple fallback plan if API fails
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
    
    for (let day = 1; day <= formData.days; day++) {
        planHTML += `
            <li>
                <strong>Day ${day}:</strong> Study ${formData.lesson} topics
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
