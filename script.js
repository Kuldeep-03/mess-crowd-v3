console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

let previousMLI = null;
let previousQueue = null;
let isAdmin = false;

let history = JSON.parse(localStorage.getItem("history")) || {
  Breakfast: [], Lunch: [], Dinner: []
};

let mliChart, forecastChart, heatmapChart;

/* ---------- ADMIN ---------- */
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

/* ---------- DARK MODE ---------- */
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
}
if (localStorage.getItem("dark") === "true") document.body.classList.add("dark");

/* ---------- MAPPERS ---------- */
const mapQueue = q => q === "Low" ? 15 : q === "Medium" ? 40 : 70;
const mapService = s => s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
const mapDefaulters = d => d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;

/* ---------- CORE ---------- */
function calculateMLI(q, seats, service, discipline, momentum) {
  return (
    0.3 * (q / 70) +
    0.3 * (seats / 100) +
    0.25 * (1 - service) +
    0.1 * (1 - discipline) +
    0.05 * momentum
  );
}

/* ---------- SMOOTH NUMBER ---------- */
function animateNumber(el, to) {
  let start = 0;
  const step = () => {
    start += Math.ceil((to - start) / 8);
    el.innerText = start;
    if (start < to) requestAnimationFrame(step);
  };
  step();
}

/* ---------- TOAST ---------- */
function showToast(msg) {
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

/* ---------- MAIN ---------- */
function runPrediction() {

  skeleton.classList.remove("hidden");
  result.classList.add("hidden");

  const meal = meal.value;
  const q = mapQueue(queue.value);
  const seatsVal = +seats.value;
  const serviceVal = mapService(service.value);
  const discipline = mapDefaulters(defaulters.value);

  const momentum = previousQueue ? (q - previousQueue) / 70 : 0;
  previousQueue = q;

  const mli = Math.min(1, calculateMLI(q, seatsVal, serviceVal, discipline, momentum));
  history[meal].push(mli);
  if (history[meal].length > 12) history[meal].shift();
  localStorage.setItem("history", JSON.stringify(history));

  const waitMins = mli > 0.6 ? 15 : mli > 0.4 ? 8 : 0;

  setTimeout(() => {
    skeleton.classList.add("hidden");
    result.classList.remove("hidden");

    animateNumber(mliValue, Math.round(mli * 100));

    trendArrow.innerText =
      previousMLI && mli > previousMLI ? " ↑" :
      previousMLI && mli < previousMLI ? " ↓" : "";

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

    if (previousMLI && mli < previousMLI)
      showToast("Crowd easing in ~10 mins");

    previousMLI = mli;
  }, 500);
}

/* ---------- QR ---------- */
window.onload = () =>
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
