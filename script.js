// ================== GLOBAL MEMORY ==================
let previousMLI = null;
let previousQueue = null;
let mliHistory = [];

let mliChart = null;
let forecastChart = null;

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
  if (q === "Low") return 15;
  if (q === "Medium") return 40;
  return 70;
}

function mapService(s) {
  if (s === "Fast") return 0.8;
  if (s === "Moderate") return 0.6;
  return 0.4;
}

function mapDefaulters(d) {
  if (d === "Low") return 0.9;
  if (d === "Medium") return 0.6;
  return 0.3;
}

// ================== CORE LOGIC ==================
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

// ================== HELPERS ==================
function classify(v) {
  if (v >= 0.75) return "High";
  if (v >= 0.4) return "Medium";
  return "Low";
}

function confidence(integrity, service, seats, momentum) {
  let v =
    (1 - integrity) * 0.3 +
    (1 - service) * 0.3 +
    (seats > 85 ? 0.2 : 0) +
    Math.abs(momentum) * 0.2;
  return Math.max(30, Math.round((1 - v) * 100));
}

function smoothMLI(v) {
  mliHistory.push(v);
  if (mliHistory.length > 8) mliHistory.shift();
  return mliHistory.reduce((a, b) => a + b, 0) / mliHistory.length;
}

function trend(curr) {
  if (previousMLI === null) return "Stable";
  if (curr - previousMLI > 0.05) return "Increasing";
  if (previousMLI - curr > 0.05) return "Decreasing";
  return "Stable";
}

function futureMLI(m, t) {
  if (t === "Increasing") return [m, m + 0.1, m + 0.2].map(v => Math.min(1, v));
  if (t === "Decreasing") return [m, m - 0.1, m - 0.2].map(v => Math.max(0, v));
  return [m, m, m];
}

function recommendedWait(level) {
  if (level === "High") return 20;
  if (level === "Medium") return 8;
  return 0;
}

// ================== CHARTS ==================
function drawMLIChart(history, conf) {
  if (history.length < 2) return;

  const ctx = document.getElementById("mliChart").getContext("2d");
  if (mliChart) mliChart.destroy();

  const values = history.map(v => v * 100);
  const band = (100 - conf) * 0.4;

  mliChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: values.map((_, i) => `T${i + 1}`),
      datasets: [
        {
          label: "MLI %",
          data: values,
          borderColor: "#e63946",
          tension: 0.3
        },
        {
          label: "Capacity Limit",
          data: Array(values.length).fill(80),
          borderColor: "#000",
          borderDash: [5, 5]
        },
        {
          label: "Confidence Band",
          data: values.map(v => Math.min(100, v + band)),
          backgroundColor: "rgba(230,57,70,0.15)",
          fill: "+1"
        },
        {
          data: values.map(v => Math.max(0, v - band)),
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100 } }
    }
  });
}

function drawForecastChart(f) {
  const ctx = document.getElementById("forecastChart").getContext("2d");
  if (forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Now", "+10 min", "+20 min"],
      datasets: [{
        data: f.map(v => v * 100),
        backgroundColor: ["#2a9d8f", "#f4a261", "#e63946"]
      }]
    },
    options: { scales: { y: { min: 0, max: 100 } } }
  });
}

// ================== MAIN ==================
function runPrediction() {
  // ---- ELEMENTS (FIXED) ----
  const mealEl = document.getElementById("meal");
  const queueEl = document.getElementById("queue");
  const seatsEl = document.getElementById("seats");
  const serviceEl = document.getElementById("service");
  const defaultersEl = document.getElementById("defaulters");
  const eatTimeEl = document.getElementById("eatTime");

  const levelEl = document.getElementById("level");
  const detailsEl = document.getElementById("details");
  const forecastEl = document.getElementById("forecast");
  const waitFill = document.getElementById("waitFill");
  const waitText = document.getElementById("waitText");

  // ---- AUTO TIME ----
  const auto = autoTimeContext();
  if (auto.meal) mealEl.value = auto.meal;

  // ---- INPUTS ----
  const queue = mapQueue(queueEl.value);
  const seats = +seatsEl.value;
  const service = mapService(serviceEl.value);
  const integrity = mapDefaulters(defaultersEl.value);
  const eatTime = +eatTimeEl.value;

  let momentum = previousQueue !== null ? (queue - previousQueue) / 70 : 0;
  previousQueue = queue;

  // ---- CALC ----
  const raw = calculateMLI(queue, seats, service, integrity, eatTime, momentum, auto.peak);
  const mli = smoothMLI(raw);

  const lvl = classify(mli);
  const tr = trend(mli);
  const fut = futureMLI(mli, tr);
  const conf = confidence(integrity, service, seats, momentum);
  const wait = recommendedWait(lvl);

  previousMLI = mli;

  // ---- OUTPUT ----
  levelEl.innerText = `${lvl} Crowd (MLI: ${Math.round(mli * 100)})`;
  detailsEl.innerText = `Confidence: ${conf}% | Trend: ${tr}`;
  forecastEl.innerText =
    `Forecast → ${classify(fut[0])}, ${classify(fut[1])}, ${classify(fut[2])}`;

  // ---- VISUALS ----
  drawMLIChart(mliHistory, conf);
  drawForecastChart(fut);

  waitFill.style.width = `${Math.min(100, wait * 5)}%`;
  waitText.innerText =
    wait === 0 ? "No waiting recommended" : `Recommended wait: ~${wait} minutes`;
}
