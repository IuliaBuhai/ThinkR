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

// Track current user
let currentUser = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setupAuthHandlers();
    setupStudyPlanForm();
    
    // Auth state listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            loadPreviousPlans(user.uid);
        }
    });
});

// Authentication Functions
function setupAuthHandlers() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

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
            currentUser = null;
            document.getElementById('plansList').innerHTML = '';
        } catch (err) {
            alert(err.message);
        }
    });
}

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
                alert("You must be logged in to save plans");
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

// OpenAI Integration (replace with your actual implementation)
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
    return `
        <div class="study-plan">
            <h2>Test Plan for ${formData.subject}</h2>
            <p>This is a test plan. Implement OpenAI API for real plans.</p>
        </div>
    `;
}
