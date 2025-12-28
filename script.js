console.log("Smart Mess Predictor Loaded");

// ================== GLOBAL STATE ==================
let previousQueue = null;
let mliHistory = [];
let mliChart, forecastChart, heatmapChart;
let isAdmin = false;

// ================== DOM ELEMENTS ==================
const mealEl       = document.getElementById("meal");
const queueEl      = document.getElementById("queue");
const seatsEl      = document.getElementById("seats");
const serviceEl    = document.getElementById("service");
const defaultersEl = document.getElementById("defaulters");
const eatTimeEl    = document.getElementById("eatTime");

const levelEl      = document.getElementById("level");
const detailsEl    = document.getElementById("details");
const forecastEl   = document.getElementById("forecast");

const waitFill     = document.getElementById("waitFill");
const waitText     = document.getElementById("waitText");

const adminSummary = document.getElementById("adminSummary");

// ================== ADMIN TOGGLE ==================
function toggleAdmin() {
  isAdmin = !isAdmin;
  document.querySelector(".admin").style.display = isAdmin ? "block" : "none";
  alert(isAdmin ? "Admin mode enabled" : "Admin mode disabled");
}

// ================== AUTO TIME CONTEXT ==================
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

// ================== CLASSIFY ==================
const classify = m => m >= 0.75 ? "High" : m >= 0.4 ? "Medium" : "Low";

// ================== WAIT LOGIC ==================
function recommendedWait(mli) {
  if (mli >= 0.8)  return { text: "20–25 min", mins: 22 };
  if (mli >= 0.65) return { text: "15–20 min", mins: 17 };
  if (mli >= 0.45) return { text: "8–15 min",  mins: 10 };
  if (mli >= 0.3)  return { text: "3–5 min",   mins: 4 };
  return { text: "No waiting recommended", mins: 0 };
}

// ================== SMOOTH ==================
function smoothMLI(v) {
  mliHistory.push(v);
  if (mliHistory.length > 12) mliHistory.shift();
  return mliHistory.reduce((a,b)=>a+b,0) / mliHistory.length;
}

// ================== FORECAST ==================
const futureMLI = m => [m, Math.min(1,m+0.1), Math.min(1,m+0.2)];

// ================== CHARTS ==================
function drawMLIChart(history) {
  if (!history.length) return;
  if (mliChart) mliChart.destroy();

  mliChart = new Chart(document.getElementById("mliChart"), {
    type:"line",
    data:{
      labels:history.map((_,i)=>`Prediction ${i+1}`),
      datasets:[
        {
          label:"MLI %",
          data:history.map(v=>Math.round(v*100)),
          borderColor:"#e63946",
          fill:true,
          backgroundColor:"rgba(230,57,70,0.15)"
        },
        {
          label:"Capacity Limit",
          data:Array(history.length).fill(80),
          borderDash:[5,5],
          borderColor:"#000"
        }
      ]
    },
    options:{ scales:{ y:{min:0,max:100} } }
  });
}

function drawForecastChart(f) {
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(document.getElementById("forecastChart"),{
    type:"bar",
    data:{
      labels:["Now","+10","+20"],
      datasets:[{
        data:f.map(v=>Math.round(v*100)),
        backgroundColor:["#2a9d8f","#f4a261","#e63946"]
      }]
    },
    options:{ scales:{ y:{min:0,max:100} } }
  });
}

function drawHeatmap() {
  if (heatmapChart) heatmapChart.destroy();
  heatmapChart = new Chart(document.getElementById("heatmap"),{
    type:"bar",
    data:{
      labels:mliHistory.map((_,i)=>`T${i+1}`),
      datasets:[{
        data:mliHistory.map(v=>Math.round(v*100)),
        backgroundColor:mliHistory.map(v =>
          v < 0.4 ? "#2a9d8f" : v < 0.7 ? "#f4a261" : "#e63946"
        )
      }]
    },
    options:{ scales:{ y:{min:0,max:100} } }
  });
}

// ================== MAIN ==================
function runPrediction(){
  const auto = autoTimeContext();
  if(auto.meal) mealEl.value = auto.meal;

  const queue = mapQueue(queueEl.value);
  const seats = +seatsEl.value;
  const service = mapService(serviceEl.value);
  const integrity = mapDefaulters(defaultersEl.value);
  const eat = +eatTimeEl.value;

  let momentum = previousQueue !== null ? (queue - previousQueue)/70 : 0;
  previousQueue = queue;

  const mli = smoothMLI(
    calculateMLI(queue, seats, service, integrity, eat, momentum, auto.peak)
  );

  const future = futureMLI(mli);
  const wait = recommendedWait(mli);

  levelEl.innerText = `${classify(mli)} Crowd (MLI: ${Math.round(mli*100)})`;
  detailsEl.innerText =
    `Best time to visit at ${new Date(Date.now() + wait.mins*60000).toLocaleTimeString()}`;
  forecastEl.innerText = `Recommended wait: ${wait.text}`;

  waitFill.style.width = `${Math.min(100, wait.mins*4)}%`;
  waitText.innerText = wait.text;

  drawMLIChart(mliHistory);
  drawForecastChart(future);
  drawHeatmap();

  if(isAdmin){
    adminSummary.innerText =
      `Average: ${Math.round(mliHistory.reduce((a,b)=>a+b,0)/mliHistory.length*100)}%\n` +
      `Peak: ${Math.round(Math.max(...mliHistory)*100)}%`;
  }
}
