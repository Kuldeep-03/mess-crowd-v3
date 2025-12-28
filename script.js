let previousMLI = null;

// ---------- Mapping Functions ----------
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
  if (d === "Low") return 0.9;     // high queue integrity
  if (d === "Medium") return 0.6;
  return 0.3;                     // poor queue integrity
}

// ---------- Core MLI Logic ----------
function calculateMLI(meal, queue, seats, serviceRate, queueIntegrity, eatTime) {

  const totalSeats = 100;

  // Seat turnover model
  const seatReleaseRate = totalSeats / eatTime; // seats freed per minute

  // Pressures
  let arrivalPressure = queue / 70;
  let servicePressure = 1 - serviceRate;

  // Meal-aware weights
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
    wTurnover * Math.min(1, 1 / seatReleaseRate);

  // Normalize between 0 and 1
  return Math.min(1, Math.max(0, MLI));
}

// ---------- Crowd Classification ----------
function classify(mli) {
  if (mli >= 0.75) return "High";
  if (mli >= 0.4) return "Medium";
  return "Low";
}

// ---------- Confidence Estimation ----------
function confidence(queueIntegrity, serviceRate, seats) {
  let variance =
    (1 - queueIntegrity) * 0.4 +
    (1 - serviceRate) * 0.3 +
    (seats > 85 ? 0.3 : 0);

  return Math.max(30, Math.round((1 - variance) * 100));
}

// ---------- Trend Detection ----------
function trend(curr) {
  if (previousMLI === null) return "Stable";
  if (curr - previousMLI > 0.07) return "Increasing";
  if (previousMLI - curr > 0.07) return "Decreasing";
  return "Stable";
}

// ---------- Short-Term Forecast ----------
function futureMLI(current, tr) {
  if (tr === "Increasing")
    return [current, Math.min(1, current + 0.1), Math.min(1, current + 0.2)];
  if (tr === "Decreasing")
    return [current, Math.max(0, current - 0.1), Math.max(0, current - 0.2)];
  return [current, current, current];
}

// ---------- Explanation Generator ----------
function explanation(seats, serviceRate, queueIntegrity) {
  if (seats > 85) return "High congestion due to seat saturation.";
  if (serviceRate < 0.5) return "Slow service due to batch food preparation.";
  if (queueIntegrity < 0.5) return "Queue discipline issues affecting flow.";
  return "Normal operating conditions.";
}

// ---------- Main Prediction ----------
function runPrediction() {
  const meal = document.getElementById("meal").value;
  const q = mapQueue(document.getElementById("queue").value);
  const seats = parseInt(document.getElementById("seats").value);
  const serviceRate = mapService(document.getElementById("service").value);
  const queueIntegrity = mapDefaulters(document.getElementById("defaulters").value);
  const eatTime = parseInt(document.getElementById("eatTime").value);

  const mli = calculateMLI(meal, q, seats, serviceRate, queueIntegrity, eatTime);
  const lvl = classify(mli);
  const conf = confidence(queueIntegrity, serviceRate, seats);
  const tr = trend(mli);
  const future = futureMLI(mli, tr);

  previousMLI = mli;

  document.getElementById("level").innerText =
    `${lvl} Crowd (MLI: ${Math.round(mli * 100)})`;

  document.getElementById("details").innerText =
    `Confidence: ${conf}% | Trend: ${tr}\n` +
    explanation(seats, serviceRate, queueIntegrity);

  document.getElementById("forecast").innerText =
    `Forecast → Now: ${classify(future[0])}, +10 min: ${classify(future[1])}, +20 min: ${classify(future[2])}`;
}
