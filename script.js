// ================== GLOBAL MEMORY ==================
let previousMLI = null;
let previousQueue = null;
let mliHistory = [];

let mliChart = null;
let forecastChart = null;

// ================== MAPPING FUNCTIONS ==================
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

// ================== CORE MLI LOGIC ==================
function calculateMLI(
  meal,
  queue,
  seats,
  serviceRate,
  queueIntegrity,
  eatTime,
  arrivalMomentum,
  timeSlotFactor
) {
  const totalSeats = 100;
  const seatReleaseRate = totalSeats / eatTime;

  let arrivalPressure = queue / 70;
  let servicePressure = 1 - serviceRate;

  let wQueue = meal === "Breakfast" ? 0.25 : 0.3;
  let wSeats = meal === "Dinner" ? 0.35 : 0.3;
  let wService = 0.25;
  let wBehavior = 0.1;
  let wTurnover = 0.1;

  let MLI =
    wQueue * arrivalPressure +
    wSeats * (seats / 100) +
    wService * servicePressure +
    wBehavior * (1 - queueIntegrity) +
    wTurnover * Math.min(1, 1 / seatReleaseRate) +
    0.1 * arrivalMomentum;

  MLI *= timeSlotFactor;

  return Math.min(1, Math.max(0, MLI));
}

// ================== CLASSIFICATION ==================
function classify(mli) {
  if (mli >= 0.75) return "High";
  if (mli >= 0.4) return "Medium";
  return "Low";
}

// ================== CONFIDENCE ==================
function confidence(queueIntegrity, serviceRate, seats, arrivalMomentum) {
  let variance =
    (1 - queueIntegrity) * 0.3 +
    (1 - serviceRate) * 0.3 +
    (seats > 85 ? 0.2 : 0) +
    Math.abs(arrivalMomentum) * 0.2;

  return Math.max(30, Math.round((1 - variance) * 100));
}

// ================== SMOOTHING ==================
function smoothMLI(curr) {
  mliHistory.push(curr);
  if (mliHistory.length > 5) mliHistory.shift();

  let sum = mliHistory.reduce((a, b) => a + b, 0);
  return sum / mliHistory.length;
}

// ================== TREND ==================
function trend(curr) {
  if (previousMLI === null) return "Stable";
  if (curr - previousMLI > 0.05) return "Increasing";
  if (previousMLI - curr > 0.05) return "Decreasing";
  return "Stable";
}

// ================== FORECAST ==================
function futureMLI(current, tr) {
  if (tr === "Increasing")
    return [current, Math.min(1, current + 0.1), Math.min(1, current + 0.2)];
  if (tr === "Decreasing")
    return [current, Math.max(0, current - 0.1), Math.max(0, current - 0.2)];
  return [current, current, current];
}

// ================== BOTTLENECK ==================
function detectBottleneck(seats, serviceRate, queueIntegrity) {
  if (seats > 85) return "Seating capacity";
  if (serviceRate < 0.5) return "Food service rate";
  if (queueIntegrity < 0.5) return "Queue discipline";
  return "No dominant bottleneck";
}

// ================== RECOVERY ==================
function estimateRecovery(queue, eatTime) {
  const seats = 100;
  const seatReleaseRate = seats / eatTime;
  return Math.max(0, Math.round(queue / seatReleaseRate));
}

// ================== DECISION ENGINE ==================
function decisionAdvice(level, trend, recovery) {
  if (level === "High" && trend === "Increasing")
    return "❌ Avoid now. Try again after 20 minutes.";
  if (level === "High")
    return "⏳ High congestion. Expect long waiting time.";
  if (level === "Medium" && recovery > 10)
    return "⏳ Moderate crowd. Short wait expected.";
  return "✅ Good time to visit the mess.";
}

// ================== GRAPH FUNCTIONS ==================
function drawMLIChart(history) {
  const ctx = document.getElementById("mliChart").getContext("2d");
  if (mliChart) mliChart.destroy();

  mliChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((_, i) => `T${i + 1}`),
      datasets: [{
        label: "Mess Load Index",
        data: history.map(v => Math.round(v * 100)),
        borderColor: "#e63946",
        backgroundColor: "rgba(230,57,70,0.15)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 100 }
      }
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
        label: "Predicted Congestion",
        data: future.map(v => Math.round(v * 100)),
        backgroundColor: ["#2a9d8f", "#f4a261", "#e63946"]
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}

// ================== MAIN ==================
function runPrediction() {
  const meal = document.getElementById("meal").value;
  const queueRaw = mapQueue(document.getElementById("queue").value);
  const seats = parseInt(document.getElementById("seats").value);
  const serviceRate = mapService(document.getElementById("service").value);
  const queueIntegrity = mapDefaulters(document.getElementById("defaulters").value);
  const eatTime = parseInt(document.getElementById("eatTime").value);

  let arrivalMomentum = 0;
  if (previousQueue !== null) {
    arrivalMomentum = (queueRaw - previousQueue) / 70;
  }
  previousQueue = queueRaw;

  let timeSlotFactor = 1.0;
  if (seats > 70 && queueRaw > 40) timeSlotFactor = 1.15;

  let rawMLI = calculateMLI(
    meal,
    queueRaw,
    seats,
    serviceRate,
    queueIntegrity,
    eatTime,
    arrivalMomentum,
    timeSlotFactor
  );

  let mli = smoothMLI(rawMLI);
  const lvl = classify(mli);
  const tr = trend(mli);
  const future = futureMLI(mli, tr);
  const conf = confidence(queueIntegrity, serviceRate, seats, arrivalMomentum);

  const bottleneck = detectBottleneck(seats, serviceRate, queueIntegrity);
  const recovery = estimateRecovery(queueRaw, eatTime);
  const advice = decisionAdvice(lvl, tr, recovery);

  previousMLI = mli;

  document.getElementById("level").innerText =
    `${lvl} Crowd (MLI: ${Math.round(mli * 100)})`;

  document.getElementById("details").innerText =
    `Confidence: ${conf}% | Trend: ${tr}\n` +
    `Primary bottleneck: ${bottleneck}\n` +
    `Expected recovery: ~${recovery} min\n` +
    `Advice: ${advice}`;

  document.getElementById("forecast").innerText =
    `Forecast → Now: ${classify(future[0])}, +10 min: ${classify(future[1])}, +20 min: ${classify(future[2])}`;

  // DRAW GRAPHS
  drawMLIChart(mliHistory);
  drawForecastChart(future);
}
