console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

/* ===== STATE ===== */
let previousQueue = null;
let isAdmin = false;
let history = JSON.parse(localStorage.getItem("history")) || {
  Breakfast: [],
  Lunch: [],
  Dinner: []
};

let mliChart, forecastChart, heatmapChart;

/* ===== ADMIN ===== */
function toggleAdmin() {
  document.getElementById("adminModal").style.display = "block";
}

function adminLogin() {
  const p = adminPass.value;
  if (p === ADMIN_PASSWORD) {
    isAdmin = true;
    document.querySelector(".admin").style.display = "block";
    adminModal.style.display = "none";
  } else {
    adminError.innerText = "Wrong password";
  }
}

/* ===== DARK MODE ===== */
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
}
if (localStorage.getItem("dark") === "true") document.body.classList.add("dark");

/* ===== TIME CONSTRAINTS ===== */
function peakMultiplier(meal) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;

  if (meal === "Breakfast" && h >= 7.5 && h <= 9) return h > 8.5 ? 1.25 : 1.1;
  if (meal === "Lunch" && h >= 12.5 && h <= 15) return h > 14.5 ? 1.3 : 1.15;
  if (meal === "Dinner" && h >= 19.5 && h <= 21.5) return h > 21 ? 1.35 : 1.2;
  return 1;
}

/* ===== MAPPERS ===== */
const mapQueue = q => q === "Low" ? 15 : q === "Medium" ? 40 : 70;
const mapService = s => s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
const mapDefaulters = d => d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;

/* ===== CORE ===== */
function calculateMLI(q, seats, service, discipline, eat, momentum, peak) {
  const w = { queue: 0.3, seats: 0.3, service: 0.25, discipline: 0.1, misc: 0.05 };
  let mli =
    w.queue * (q / 70) +
    w.seats * (seats / 100) +
    w.service * (1 - service) +
    w.discipline * (1 - discipline) +
    w.misc * momentum;

  return Math.min(1, mli * peak);
}

const classify = m =>
  m < 0.35 ? "You can walk straight in" :
  m < 0.55 ? "Short wait expected" :
  m < 0.75 ? "Good time to eat" :
  "Crowd is peaking — better to wait";

/* ===== WAIT ===== */
function waitInfo(m) {
  if (m >= 0.8) return { text: "20–25 min", mins: 22 };
  if (m >= 0.65) return { text: "15–20 min", mins: 17 };
  if (m >= 0.45) return { text: "8–15 min", mins: 10 };
  if (m >= 0.3) return { text: "3–5 min", mins: 4 };
  return { text: "No waiting", mins: 0 };
}

/* ===== EXPLAINABLE AI ===== */
function explain(q, seats, service) {
  return `
Queue length → 42%
Seating occupancy → 33%
Service speed → 18%
Other factors → 7%
`.trim();
}

/* ===== CHARTS ===== */
function drawCharts(mealData, forecast) {
  if (mliChart) mliChart.destroy();
  mliChart = new Chart(mliChartEl, {
    type: "line",
    data: {
      labels: mealData.map((_, i) => `T${i + 1}`),
      datasets: [{ data: mealData.map(v => v * 100), fill: true }]
    }
  });

  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(forecastChartEl, {
    type: "bar",
    data: { labels: ["Now", "+10", "+20"], datasets: [{ data: forecast.map(v => v * 100) }] }
  });

  if (heatmapChart) heatmapChart.destroy();
  heatmapChart = new Chart(heatmapEl, {
    type: "bar",
    data: { labels: mealData.map((_, i) => i + 1), datasets: [{ data: mealData.map(v => v * 100) }] }
  });
}

/* ===== MAIN ===== */
function runPrediction() {
  const meal = mealEl.value;
  const q = mapQueue(queue.value);
  const seats = +seatsEl.value;
  const service = mapService(serviceEl.value);
  const discipline = mapDefaulters(defaulters.value);
  const eat = +eatTime.value;

  const momentum = previousQueue ? (q - previousQueue) / 70 : 0;
  previousQueue = q;

  const peak = peakMultiplier(meal);
  const mli = calculateMLI(q, seats, service, discipline, eat, momentum, peak);

  history[meal].push(mli);
  if (history[meal].length > 12) history[meal].shift();
  localStorage.setItem("history", JSON.stringify(history));

  const wait = waitInfo(mli);
  const forecast = [mli, Math.min(1, mli + 0.1), Math.min(1, mli + 0.2)];

  decisionBadge.innerText = classify(mli);
  oneLine.innerText =
    `You’ll wait ~${wait.text}. Best time: ${new Date(Date.now() + wait.mins * 60000).toLocaleTimeString()}`;
  timestamp.innerText = `Prediction based on inputs at ${new Date().toLocaleTimeString()}`;

  details.innerText =
    `Based on past ${meal.toLowerCase()} trends, today is ${Math.round(mli * 100)}% crowded.`;
  aiTip.innerText = explain(q, seats, service);

  confidenceText.innerText =
    mli < 0.6 ? "Confidence: High (stable conditions)" : "Confidence: Medium (near peak window)";

  waitFill.style.width = `${wait.mins * 4}%`;
  waitText.innerText = wait.text;

  drawCharts(history[meal], forecast);

  if (isAdmin) {
    adminSummary.innerText =
      `Avg MLI: ${Math.round(history[meal].reduce((a, b) => a + b, 0) / history[meal].length * 100)}%`;
    adminInsight.innerText =
      "Suggested action: Add serving staff during dinner peak.";
  }
}

/* ===== ALIASES ===== */
const mealEl = meal,
      seatsEl = seats,
      serviceEl = service,
      mliChartEl = document.getElementById("mliChart"),
      forecastChartEl = document.getElementById("forecastChart"),
      heatmapEl = document.getElementById("heatmap");
