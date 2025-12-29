console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

/* ===== STATE ===== */
let previousMLI = null;
let previousQueue = null;
let isAdmin = false;

let history = JSON.parse(localStorage.getItem("history")) || {
  Breakfast: [], Lunch: [], Dinner: []
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

/* ===== MAPPERS ===== */
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

/* ===== SMOOTH NUMBER ===== */
function animateNumber(el, to) {
  let start = 0;
  const step = () => {
    start += Math.ceil((to - start) / 8);
    el.innerText = start;
    if (start < to) requestAnimationFrame(step);
  };
  step();
}

/* ===== TOAST ===== */
function showToast(msg) {
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

/* ===== PEAK END CHECK ===== */
function peakEndingSoon(meal) {
  const t = new Date().getHours() + new Date().getMinutes() / 60;
  if (meal === "Breakfast" && t > 8.5 && t < 9) return true;
  if (meal === "Lunch" && t > 14.5 && t < 15) return true;
  if (meal === "Dinner" && t > 21 && t < 21.5) return true;
  return false;
}

/* ===== CHARTS (ANIMATED) ===== */
function updateCharts(data, forecast) {
  const options = {
    animation: { duration: 900, easing: "easeOutQuart" },
    scales: { y: { min: 0, max: 100 } }
  };

  if (!mliChart) {
    mliChart = new Chart(mliChartEl, {
      type: "line",
      data: { labels: data.map((_, i) => `T${i+1}`), datasets: [{ data: data.map(v=>v*100), fill:true }] },
      options
    });
  } else {
    mliChart.data.datasets[0].data = data.map(v=>v*100);
    mliChart.update();
  }

  if (!forecastChart) {
    forecastChart = new Chart(forecastChartEl, {
      type: "bar",
      data: { labels:["Now","+10","+20"], datasets:[{ data: forecast.map(v=>v*100) }] },
      options
    });
  } else {
    forecastChart.data.datasets[0].data = forecast.map(v=>v*100);
    forecastChart.update();
  }

  if (!heatmapChart) {
    heatmapChart = new Chart(heatmapEl, {
      type: "bar",
      data: { labels:data.map((_,i)=>i+1), datasets:[{ data:data.map(v=>v*100) }] },
      options
    });
  } else {
    heatmapChart.data.datasets[0].data = data.map(v=>v*100);
    heatmapChart.update();
  }
}

/* ===== MAIN ===== */
function runPrediction(auto=false) {

  if (!auto) {
    skeleton.classList.remove("hidden");
    result.classList.add("hidden");
  }

  const meal = mealEl.value;
  const q = mapQueue(queue.value);
  const seatsVal = +seats.value;
  const serviceVal = mapService(service.value);
  const discipline = mapDefaulters(defaulters.value);

  const momentum = previousQueue ? (q - previousQueue)/70 : 0;
  previousQueue = q;

  const mli = calculateMLI(q,seatsVal,serviceVal,discipline,momentum);
  history[meal].push(mli);
  if (history[meal].length > 12) history[meal].shift();
  localStorage.setItem("history", JSON.stringify(history));

  const wait = mli > 0.6 ? 15 : mli > 0.4 ? 8 : 0;
  const forecast = [mli, Math.min(1,mli+0.1), Math.min(1,mli+0.2)];

  setTimeout(() => {
    skeleton.classList.add("hidden");
    result.classList.remove("hidden");

    animateNumber(mliValue, Math.round(mli*100));

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
      `You’ll wait ~${wait} mins. Best time: ${new Date(Date.now()+wait*60000).toLocaleTimeString()}`;

    confidenceText.innerText =
      mli < 0.6 ? "Confidence: High (stable conditions)" :
      "Confidence: Medium (near peak)";

    aiTip.innerText =
      "Queue → 42%\nSeating → 33%\nService → 18%\nOther → 7%";

    timestamp.innerText =
      `Prediction based on inputs at ${new Date().toLocaleTimeString()}`;

    waitFill.style.width = `${wait*4}%`;
    waitText.innerText = wait ? `${wait} mins` : "No waiting";

    if (previousMLI && mli < previousMLI)
      showToast("Crowd easing in ~10 mins");

    peakBanner.classList.toggle("hidden", !peakEndingSoon(meal));

    updateCharts(history[meal], forecast);

    previousMLI = mli;
  }, auto ? 0 : 500);
}

/* ===== AUTO REFRESH ===== */
setInterval(() => runPrediction(true), 60000);

/* ===== QR ===== */
window.onload = () =>
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;

/* ===== ALIASES ===== */
const mealEl = meal;
const mliChartEl = document.getElementById("mliChart");
const forecastChartEl = document.getElementById("forecastChart");
const heatmapEl = document.getElementById("heatmap");
