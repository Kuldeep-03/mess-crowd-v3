console.log("Smart Mess Predictor Loaded");

// ================== CONFIG ==================
const ADMIN_PASSWORD = "messadmin";

// ================== GLOBAL STATE ==================
let previousQueue = null;
let mliHistory = JSON.parse(localStorage.getItem("mliHistory")) || [];
let isAdmin = false;

let mliChart = null;
let forecastChart = null;
let heatmapChart = null;

// ================== ADMIN ==================
function toggleAdmin() {
  document.getElementById("adminModal").style.display = "block";
}

function adminLogin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.querySelector(".admin").style.display = "block";
    document.getElementById("adminModal").style.display = "none";
  } else {
    document.getElementById("adminError").innerText = "Wrong password";
  }
}

// ================== DARK MODE ==================
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// ================== TIME CONTEXT ==================
function autoTimeContext() {
  const h = new Date().getHours();
  if (h >= 7 && h <= 9) return { meal: "Breakfast", peak: 1.15 };
  if (h >= 12 && h <= 14) return { meal: "Lunch", peak: 1.2 };
  if (h >= 19 && h <= 21) return { meal: "Dinner", peak: 1.25 };
  return { meal: null, peak: 1.0 };
}

// ================== MAPPERS ==================
const mapQueue = q => q === "Low" ? 15 : q === "Medium" ? 40 : 70;
const mapService = s => s === "Fast" ? 0.8 : s === "Moderate" ? 0.6 : 0.4;
const mapDefaulters = d => d === "Low" ? 0.9 : d === "Medium" ? 0.6 : 0.3;

// ================== CORE ==================
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

const classify = m => m >= 0.75 ? "High" : m >= 0.4 ? "Medium" : "Low";

// ================== WAIT ==================
function recommendedWait(mli) {
  if (mli >= 0.8) return { text: "20–25 min", mins: 22 };
  if (mli >= 0.65) return { text: "15–20 min", mins: 17 };
  if (mli >= 0.45) return { text: "8–15 min", mins: 10 };
  if (mli >= 0.3) return { text: "3–5 min", mins: 4 };
  return { text: "No waiting recommended", mins: 0 };
}

// ================== AI EXPLAIN ==================
function aiExplain(queue, seats, service) {
  if (queue > 40 && seats > 70)
    return "High queue and seat occupancy caused congestion.";
  if (service < 0.6)
    return "Slow service increased waiting time.";
  return "Balanced conditions with smooth flow.";
}

// ================== SMOOTH ==================
function smoothMLI(v) {
  mliHistory.push(v);
  if (mliHistory.length > 12) mliHistory.shift();
  localStorage.setItem("mliHistory", JSON.stringify(mliHistory));
  return mliHistory.reduce((a,b)=>a+b,0)/mliHistory.length;
}

const futureMLI = m => [m, Math.min(1,m+0.1), Math.min(1,m+0.2)];

// ================== CHARTS ==================
function drawMLIChart(history) {
  const ctx = document.getElementById("mliChart");
  if (mliChart) mliChart.destroy();

  mliChart = new Chart(ctx, {
    type:"line",
    data:{
      labels:history.map((_,i)=>`Prediction ${i+1}`),
      datasets:[
        {
          label:"MLI %",
          data:history.map(v=>v*100),
          borderColor:"#e63946",
          backgroundColor:"rgba(230,57,70,0.15)",
          fill:true
        },
        {
          label:"Capacity Limit",
          data:Array(history.length).fill(80),
          borderDash:[5,5],
          borderColor:"#000"
        }
      ]
    },
    options:{
      interaction:{mode:"nearest",intersect:false},
      scales:{y:{min:0,max:100}}
    }
  });
}

function drawForecastChart(f) {
  const ctx = document.getElementById("forecastChart");
  if (forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:["Now","+10","+20"],
      datasets:[{data:f.map(v=>v*100),
        backgroundColor:["#2a9d8f","#f4a261","#e63946"]}]
    },
    options:{scales:{y:{min:0,max:100}}}
  });
}

// ================== HEATMAP ==================
function drawHeatmap() {
  const ctx = document.getElementById("heatmap");
  if (heatmapChart) heatmapChart.destroy();

  heatmapChart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:mliHistory.map((_,i)=>`T${i+1}`),
      datasets:[{
        data:mliHistory.map(v=>v*100),
        backgroundColor:mliHistory.map(v=>v<0.4?"#2a9d8f":v<0.7?"#f4a261":"#e63946")
      }]
    },
    options:{scales:{y:{min:0,max:100}}}
  });
}

// ================== MAIN ==================
function runPrediction() {
  const meal = document.getElementById("meal");
  const queueEl = document.getElementById("queue");
  const seats = +document.getElementById("seats").value;
  const service = mapService(document.getElementById("service").value);
  const integrity = mapDefaulters(document.getElementById("defaulters").value);
  const eat = +document.getElementById("eatTime").value;

  const auto = autoTimeContext();
  if (auto.meal) meal.value = auto.meal;

  const queue = mapQueue(queueEl.value);
  const momentum = previousQueue ? (queue-previousQueue)/70 : 0;
  previousQueue = queue;

  const mli = smoothMLI(calculateMLI(queue,seats,service,integrity,eat,momentum,auto.peak));
  const wait = recommendedWait(mli);
  const future = futureMLI(mli);

  document.getElementById("level").innerText =
    `${classify(mli)} Crowd (MLI: ${Math.round(mli*100)})`;

  document.getElementById("details").innerText =
    `Best time to visit: ${new Date(Date.now()+wait.mins*60000).toLocaleTimeString()}\n` +
    `AI Insight: ${aiExplain(queue,seats,service)}`;

  document.getElementById("forecast").innerText = `Recommended wait: ${wait.text}`;
  document.getElementById("waitFill").style.width = `${wait.mins*4}%`;
  document.getElementById("waitText").innerText = wait.text;

  drawMLIChart(mliHistory);
  drawForecastChart(future);
  drawHeatmap();
}

// ================== QR ==================
window.onload = () => {
  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
};
