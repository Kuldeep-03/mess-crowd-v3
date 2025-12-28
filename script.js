console.log("Smart Mess Predictor Loaded");

// ================== FIREBASE CONFIG ==================
// 🔴 Replace with your Firebase project keys
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================== GLOBAL MEMORY ==================
let previousMLI = null;
let previousQueue = null;

let mliHistory = [];
let mealHistory = {
  Breakfast: [],
  Lunch: [],
  Dinner: []
};

let mliChart = null;
let forecastChart = null;
let heatmapChart = null;

// ================== AUTO TIME CONTEXT ==================
function autoTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9) return { meal: "Breakfast", peak: 1.15 };
  if (hour >= 12 && hour <= 14) return { meal: "Lunch", peak: 1.2 };
  if (hour >= 19 && hour <= 21) return { meal: "Dinner", peak: 1.25 };
  return { meal: null, peak: 1.0 };
}

// ================== MAPPING ==================
function mapQueue(q) {
  return q === "Low" ? 15 : q === "Medium" ? 40 : 70;
}
function mapService(s) {
  return s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
}
function mapDefaulters(d) {
  return d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;
}

// ================== CORE MLI ==================
function calculateMLI(queue, seats, service, integrity, eatTime, momentum, peak) {
  const seatRelease = 100 / eatTime;

  let mli =
    0.3 * (queue / 70) +
    0.3 * (seats / 100) +
    0.25 * (1 - service) +
    0.1 * (1 - integrity) +
    0.05 * Math.min(1, 1 / seatRelease) +
    0.1 * momentum;

  return Math.min(1, Math.max(0, mli * peak));
}

// ================== CLASSIFICATION ==================
function classify(m) {
  if (m >= 0.75) return "High";
  if (m >= 0.4) return "Medium";
  return "Low";
}

// ================== WAIT LOGIC ==================
function recommendedWait(mli) {
  if (mli >= 0.8) return "20–25 min";
  if (mli >= 0.65) return "15–20 min";
  if (mli >= 0.45) return "8–15 min";
  if (mli >= 0.3) return "3–5 min";
  return "No waiting recommended";
}

// ================== SMOOTHING ==================
function smoothMLI(v) {
  mliHistory.push(v);
  if (mliHistory.length > 12) mliHistory.shift();
  return mliHistory.reduce((a, b) => a + b, 0) / mliHistory.length;
}

// ================== FORECAST ==================
function futureMLI(m) {
  return [m, Math.min(1, m + 0.1), Math.min(1, m + 0.2)];
}

// ================== HEATMAP ==================
function drawHeatmap() {
  const ctx = document.getElementById("heatmap").getContext("2d");

  const data = mliHistory.map(v => Math.round(v * 100));

  if (heatmapChart) heatmapChart.destroy();

  heatmapChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((_, i) => `T${i + 1}`),
      datasets: [{
        label: "Congestion Heat",
        data,
        backgroundColor: data.map(v =>
          v < 40 ? "#2a9d8f" : v < 70 ? "#f4a261" : "#e63946"
        )
      }]
    },
    options: { scales: { y: { min: 0, max: 100 } } }
  });
}

// ================== CHARTS ==================
function drawMLIChart(history) {
  const ctx = document.getElementById("mliChart").getContext("2d");
  if (mliChart) mliChart.destroy();

  mliChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((_, i) => `Prediction ${i + 1}`),
      datasets: [{
        label: "MLI %",
        data: history.map(v => Math.round(v * 100)),
        borderColor: "#e63946",
        fill: true,
        backgroundColor: "rgba(230,57,70,0.15)"
      },
      {
        label: "Capacity Limit",
        data: Array(history.length).fill(80),
        borderDash: [5,5],
        borderColor: "#000"
      }]
    }
  });
}

function drawForecastChart(future) {
  const ctx = document.getElementById("forecastChart").getContext("2d");
  if (forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Now", "+10 min", "+20 min"],
      datasets: [{
        data: future.map(v => Math.round(v * 100)),
        backgroundColor: ["#2a9d8f", "#f4a261", "#e63946"]
      }]
    }
  });
}

// ================== ADMIN ==================
function updateAdminDashboard() {
  if (!mliHistory.length) return;

  const avg = Math.round(mliHistory.reduce((a,b)=>a+b,0)/mliHistory.length*100);
  const peak = Math.round(Math.max(...mliHistory)*100);

  document.getElementById("adminSummary").innerText =
    `Average congestion: ${avg}%\nPeak congestion: ${peak}%\nPredictions logged: ${mliHistory.length}`;
}

function exportCSV() {
  let csv = "Time,MLI (%),Level\n";
  mliHistory.forEach((v,i)=>{
    csv += `${i+1},${Math.round(v*100)},${classify(v)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mess_summary.csv";
  a.click();
}

// ================== MAIN ==================
function runPrediction() {
  const auto = autoTimeContext();
  if (auto.meal) document.getElementById("meal").value = auto.meal;

  const queue = mapQueue(queueEl.value);
  const seats = +seatsEl.value;
  const service = mapService(serviceEl.value);
  const integrity = mapDefaulters(defaultersEl.value);
  const eatTime = +eatTimeEl.value;

  let momentum = previousQueue ? (queue - previousQueue) / 70 : 0;
  previousQueue = queue;

  const raw = calculateMLI(queue, seats, service, integrity, eatTime, momentum, auto.peak);
  const mli = smoothMLI(raw);

  const future = futureMLI(mli);
  const wait = recommendedWait(mli);

  previousMLI = mli;

  level.innerText = `${classify(mli)} Crowd (MLI: ${Math.round(mli*100)})`;
  forecast.innerText = `Recommended wait: ${wait}`;

  drawMLIChart(mliHistory);
  drawForecastChart(future);
  drawHeatmap();
  updateAdminDashboard();

  db.ref("liveMLI").push({ value: mli, time: Date.now() });
}
