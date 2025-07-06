import { db } from './app.js';  // adjust the path if needed
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// STEP 1: Render charts from Firestore data
export async function renderCharts(userId) {
    const sessionsQuery = query(
        collection(db, "studySessions"),
        where("userId", "==", userId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessionData = [];

    sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        sessionData.push({
            subject: data.subject,
            duration: data.durationInSeconds,
            date: data.startTime.toDate()
        });
    });

    drawWeeklyGoalChart(sessionData);
    drawTimePerSubjectChart(sessionData);
}

// STEP 2: Weekly Goal Chart (Bar)
function drawWeeklyGoalChart(data) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hoursByDay = Array(7).fill(0);

    data.forEach(session => {
        const day = session.date.getDay();
        const index = (day + 6) % 7; // shift Sunday(0) to index 6
        hoursByDay[index] += session.duration / 3600;
    });

    const ctx = document.getElementById("studyTimeChart").getContext("2d");

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Ore Studiate',
                data: hoursByDay.map(h => +h.toFixed(2)),
                backgroundColor: '#4361ee',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { drawBorder: false } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// STEP 3: Subject Distribution (Pie or Doughnut)
function drawTimePerSubjectChart(data) {
    const subjectTotals = {};

    data.forEach(session => {
        if (!subjectTotals[session.subject]) {
            subjectTotals[session.subject] = 0;
        }
        subjectTotals[session.subject] += session.duration / 3600;
    });

    const ctx = document.getElementById("subjectDistributionChart").getContext("2d");

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(subjectTotals),
            datasets: [{
                label: 'Distribuție Materii',
                data: Object.values(subjectTotals).map(v => +v.toFixed(2)),
                backgroundColor: [
                    '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0',
                    '#7209b7', '#b5179e', '#f72585'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
