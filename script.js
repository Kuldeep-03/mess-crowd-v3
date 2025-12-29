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
  adminModal.style.display = "block";
}

function adminLogin() {
  if (adminPass.value === ADMIN_PASSWORD) {
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

/* ===== TIME PEAKS ===== */
function peakMultiplier(meal) {
  const t = new Date().getHours() + new Date().getMinutes() / 60;
  if (meal === "Breakfast" && t >= 7.5 && t <= 9) return t > 8.5 ? 1.25 : 1.1;
  if (meal === "Lunch" && t >= 12.5 && t <= 15) return t > 14.5 ? 1.3 : 1.15;
  if (meal === "Dinner" && t >= 19.5 && t <= 21.5) return t > 21 ? 1.35 : 1.2;
  return 1;
}

/* ===== MAPPERS ===== */
const mapQueue = q => q === "Low" ? 15 : q === "Medium" ? 40 : 70;
const mapService = s => s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
const mapDefaulters = d => d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;

/* ===== CORE ===== */
function calculateMLI(q, seats, service, discipline, momentum, peak) {
  return Math.min(1,
    (0.3 * q / 70 +
     0.3 * seats / 100 +
     0.25 * (1 - service) +
     0.1 * (1 - discipline) +
     0.05 * momentum) * peak
  );
}

/* ===== DECISIONS ===== */
function decisionText(m) {
  if (m < 0.35) return "You can walk straight in";
  if (m < 0.55) return "Short wait expected";
  if (m < 0.75) return "Good time to eat";
  return "Crowd is peaking — better to wait";
}

function waitInfo(m) {
  if (m >= 0.8) return { t: "20–25 min", m: 22 };
  if (m >= 0.65) return { t: "15–20 min", m: 17 };
  if (m >= 0.45) return { t: "8–15 min", m: 10 };
  if (m >= 0.3) return { t: "3–5 min", m: 4 };
  return { t: "No waiting", m: 0 };
}

function explain() {
  return `Queue → 42%
Seating → 33%
Service → 18%
Other → 7%`;
}

/* ===== CHARTS ===== */
function drawCharts(data, forecast) {
  if (mliChart) mliChart.destroy();
  mliChart = new Chart(mliChartEl, {
    type: "line",
    data: {
      labels: data.map((_, i) => `T${i + 1}`),
      datasets: [{ data: data.map(v => v * 100), fill: true }]
    },
    options: {
      interaction: { mode: "nearest", intersect: false },
      animation: { duration: 800 }
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
    data: { labels: data.map((_, i) => i + 1), datasets: [{ data: data.map(v => v * 100) }] }
  });
}

/* ===== MAIN ===== */
function runPrediction() {
  skeleton.classList.remove("hidden");
  result.classList.add("hidden");

  setTimeout(() => {
    skeleton.classList.add("hidden");
    result.classList.remove("hidden");

    const meal = mealEl.value;
    const q = mapQueue(queue.value);
    const seats = +seatsEl.value;
    const service = mapService(serviceEl.value);
    const discipline = mapDefaulters(defaulters.value);
    const momentum = previousQueue ? (q - previousQueue) / 70 : 0;
    previousQueue = q;

    const peak = peakMultiplier(meal);
    const mli = calculateMLI(q, seats, service, discipline, momentum, peak);

    history[meal].push(mli);
    if (history[meal].length > 12) history[meal].shift();
    localStorage.setItem("history", JSON.stringify(history));

    const wait = waitInfo(mli);
    const forecast = [mli, Math.min(1, mli + 0.1), Math.min(1, mli + 0.2)];

    decisionBadge.innerText = decisionText(mli);
    decisionBadge.className = "decision-badge " +
      (mli < 0.55 ? "decision-green" : mli < 0.75 ? "decision-orange" : "decision-red");

    oneLine.innerText =
      `You’ll wait ~${wait.t}. If you leave now, you’ll reach at ${new Date(Date.now() + wait.m * 60000).toLocaleTimeString()}`;

    level.innerText = `Crowd status updated`;
    details.innerText = `Based on past ${meal.toLowerCase()} trends.`;
    forecast.innerText = `Recommended wait: ${wait.t}`;
    confidenceText.innerText = peak > 1.2 ? "Confidence: Medium (near peak)" : "Confidence: High";

    aiTip.innerText = explain();
    timestamp.innerText = `Last updated at ${new Date().toLocaleTimeString()}`;

    waitFill.style.width = `${wait.m * 4}%`;
    waitText.innerText = wait.t;

    drawCharts(history[meal], forecast);

    if (isAdmin) {
      adminSummary.innerText =
        `Avg congestion: ${Math.round(history[meal].reduce((a,b)=>a+b,0)/history[meal].length*100)}%`;
      adminInsight.innerText = "Suggestion: Add serving staff during peak.";
    }
  }, 600);
}

/* ===== QR ===== */
window.onload = () =>
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;

/* ===== ALIASES ===== */
const mealEl = meal,
      seatsEl = seats,
      serviceEl = service,
      mliChartEl = document.getElementById("mliChart"),
      forecastChartEl = document.getElementById("forecastChart"),
      heatmapEl = document.getElementById("heatmap");
