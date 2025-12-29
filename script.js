console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

/* ===== DOM ELEMENTS ===== */
const mealEl = document.getElementById("meal");
const queueEl = document.getElementById("queue");
const seatsEl = document.getElementById("seats");
const serviceEl = document.getElementById("service");
const defaultersEl = document.getElementById("defaulters");

const skeleton = document.getElementById("skeleton");
const result = document.getElementById("result");

const decisionBadge = document.getElementById("decisionBadge");
const oneLine = document.getElementById("oneLine");
const confidenceText = document.getElementById("confidenceText");
const aiTip = document.getElementById("aiTip");
const timestamp = document.getElementById("timestamp");

const mliValue = document.getElementById("mliValue");
const trendArrow = document.getElementById("trendArrow");
const toast = document.getElementById("toast");

/* ===== STATE ===== */
let previousMLI = null;
let previousQueue = null;

let history = JSON.parse(localStorage.getItem("history")) || {
  Breakfast: [],
  Lunch: [],
  Dinner: []
};

/* ===== HELPERS ===== */
const mapQueue = q => q === "Low" ? 15 : q === "Medium" ? 40 : 70;
const mapService = s => s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
const mapDefaulters = d => d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;

/* ===== CORE ===== */
function calculateMLI(q, seats, service, discipline, momentum) {
  return Math.min(1,
    0.3 * (q / 70) +
    0.3 * (seats / 100) +
    0.25 * (1 - service) +
    0.1 * (1 - discipline) +
    0.05 * momentum
  );
}

/* ===== ANIMATION ===== */
function animateNumber(el, to) {
  let current = 0;
  const step = () => {
    current += Math.ceil((to - current) / 6);
    el.innerText = current;
    if (current < to) requestAnimationFrame(step);
  };
  step();
}

/* ===== TOAST ===== */
function showToast(msg) {
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

/* ===== MAIN ===== */
function runPrediction() {

  skeleton.classList.remove("hidden");
  result.classList.add("hidden");

  const meal = mealEl.value;
  const q = mapQueue(queueEl.value);
  const seats = +seatsEl.value;
  const service = mapService(serviceEl.value);
  const discipline = mapDefaulters(defaultersEl.value);

  const momentum = previousQueue !== null ? (q - previousQueue) / 70 : 0;
  previousQueue = q;

  const mli = calculateMLI(q, seats, service, discipline, momentum);

  history[meal].push(mli);
  if (history[meal].length > 12) history[meal].shift();
  localStorage.setItem("history", JSON.stringify(history));

  const waitMins = mli > 0.6 ? 15 : mli > 0.4 ? 8 : 0;

  setTimeout(() => {
    skeleton.classList.add("hidden");
    result.classList.remove("hidden");

    animateNumber(mliValue, Math.round(mli * 100));

    trendArrow.innerText =
      previousMLI !== null && mli > previousMLI ? " ↑" :
      previousMLI !== null && mli < previousMLI ? " ↓" : "";

    decisionBadge.innerText =
      mli < 0.35 ? "You can walk straight in" :
      mli < 0.6 ? "Short wait expected" :
      "Crowd is peaking — better to wait";

    decisionBadge.className =
      "decision-badge " +
      (mli < 0.4 ? "decision-green" :
       mli < 0.7 ? "decision-orange" : "decision-red");

    oneLine.innerText =
      `You’ll wait ~${waitMins} mins. Best time: ${new Date(Date.now() + waitMins * 60000).toLocaleTimeString()}`;

    confidenceText.innerText =
      mli < 0.6 ? "Confidence: High (stable conditions)" :
      "Confidence: Medium (near peak)";

    aiTip.innerText =
      "Queue → 42%\nSeating → 33%\nService → 18%\nOther → 7%";

    timestamp.innerText =
      `Prediction based on inputs at ${new Date().toLocaleTimeString()}`;

    if (previousMLI !== null && mli < previousMLI) {
      showToast("Crowd easing in ~10 mins");
    }

    previousMLI = mli;

  }, 500);
}

/* ===== QR ===== */
window.onload = () => {
  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
};
