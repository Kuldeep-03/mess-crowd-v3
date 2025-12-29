console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

let previousQueue = null;
let mliHistory = JSON.parse(localStorage.getItem("mliHistory")) || [];
let isAdmin = false;

let mliChart, forecastChart, heatmapChart;

/* ===== ADMIN ===== */
function toggleAdmin(){
  document.getElementById("adminModal").style.display="block";
}

function adminLogin(){
  const p=document.getElementById("adminPass").value;
  if(p===ADMIN_PASSWORD){
    isAdmin=true;
    document.querySelector(".admin").style.display="block";
    document.getElementById("adminModal").style.display="none";
  } else {
    document.getElementById("adminError").innerText="Wrong password";
  }
}

/* ===== DARK MODE ===== */
function toggleDark(){
  document.body.classList.toggle("dark");
  localStorage.setItem("dark",document.body.classList.contains("dark"));
}
if(localStorage.getItem("dark")==="true") document.body.classList.add("dark");

/* ===== MEAL TIME WINDOWS ===== */
function mealWindow(meal){
  const now=new Date();
  const t=now.getHours()*60+now.getMinutes();
  const w={
    Breakfast:{s:450,e:540},
    Lunch:{s:750,e:900},
    Dinner:{s:1170,e:1410}
  }[meal];
  return {open:t>=w.s&&t<=w.e, left:w.e-t};
}

/* ===== LOGIC ===== */
const mapQueue=q=>q==="Low"?15:q==="Medium"?40:70;
const mapService=s=>s==="Fast"?0.8:s==="Moderate"?0.6:0.4;
const mapDefaulters=d=>d==="Low"?0.9:d==="Medium"?0.6:0.3;

function calculateMLI(q,s,se,qi,e,m){
  const r=100/e;
  return Math.min(1,Math.max(0,
    0.3*(q/70)+0.3*(s/100)+0.25*(1-se)+0.1*(1-qi)+0.05*Math.min(1,1/r)+0.1*m
  ));
}

const classify=m=>m>=0.75?"High":m>=0.4?"Medium":"Low";

function recommendedWait(m){
  if(m>=0.8)return{t:"20–25 min",m:22};
  if(m>=0.65)return{t:"15–20 min",m:17};
  if(m>=0.45)return{t:"8–15 min",m:10};
  if(m>=0.3)return{t:"3–5 min",m:4};
  return{t:"No waiting",m:0};
}

function aiExplain(q,s,sv){
  if(q>40&&s>70)return"High queue and seating both increased congestion.";
  if(sv<0.6)return"Slower service rate increased wait time.";
  return"Balanced conditions with smooth flow.";
}

/* ===== CHARTS ===== */
function drawMLIChart(){
  const ctx=document.getElementById("mliChart");
  if(mliChart)mliChart.destroy();
  mliChart=new Chart(ctx,{
    type:"line",
    data:{
      labels:mliHistory.map((_,i)=>`Prediction ${i+1}`),
      datasets:[
        {data:mliHistory.map(v=>v*100),borderColor:"#e63946",fill:true},
        {data:Array(mliHistory.length).fill(80),borderDash:[5,5],borderColor:"#000"}
      ]
    },
    options:{scales:{y:{min:0,max:100}}}
  });
}

function drawForecastChart(f){
  const ctx=document.getElementById("forecastChart");
  if(forecastChart)forecastChart.destroy();
  forecastChart=new Chart(ctx,{
    type:"bar",
    data:{labels:["Now","+10","+20"],datasets:[{data:f.map(v=>v*100)}]},
    options:{scales:{y:{min:0,max:100}}}
  });
}

function drawHeatmap(){
  const ctx=document.getElementById("heatmap");
  if(heatmapChart)heatmapChart.destroy();
  heatmapChart=new Chart(ctx,{
    type:"bar",
    data:{labels:mliHistory.map((_,i)=>i+1),
    datasets:[{data:mliHistory.map(v=>v*100)}]},
    options:{scales:{y:{min:0,max:100}}}
  });
}

/* ===== MAIN ===== */
function runPrediction(){
  const meal=document.getElementById("meal").value;
  const win=mealWindow(meal);

  if(!win.open){
    level.innerText="Mess Closed";
    details.innerText=`${meal} service is not active right now.`;
    forecast.innerText="Please come during official hours.";
    waitText.innerText="No waiting";
    waitFill.style.width="0%";
    return;
  }

  const q=mapQueue(queue.value);
  const s=+seats.value;
  const sv=mapService(service.value);
  const qi=mapDefaulters(defaulters.value);
  const e=+eatTime.value;

  const m=previousQueue?(q-previousQueue)/70:0;
  previousQueue=q;

  const mli=calculateMLI(q,s,sv,qi,e,m);
  mliHistory.push(mli);
  if(mliHistory.length>12)mliHistory.shift();
  localStorage.setItem("mliHistory",JSON.stringify(mliHistory));

  const w=recommendedWait(mli);
  const f=[mli,Math.min(1,mli+0.1),Math.min(1,mli+0.2)];

  level.innerText=`${classify(mli)} Crowd (${Math.round(mli*100)}%)`;
  details.innerText=`Best time: ${new Date(Date.now()+w.m*60000).toLocaleTimeString()}`;
  forecast.innerText=w.t;
  aiTip.innerText=aiExplain(q,s,sv);

  waitFill.style.width=`${w.m*4}%`;
  waitText.innerText=w.t;

  drawMLIChart();
  drawForecastChart(f);
  drawHeatmap();

  if(isAdmin){
    adminSummary.innerText=`Average load: ${Math.round(mliHistory.reduce((a,b)=>a+b,0)/mliHistory.length*100)}%`;
  }
}

window.onload=()=>qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
