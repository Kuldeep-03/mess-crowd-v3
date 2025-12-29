console.log("Smart Mess Predictor Loaded");

const ADMIN_PASSWORD = "messadmin";

let previousQueue = null;
let mliHistory = JSON.parse(localStorage.getItem("mliHistory")) || [];
let isAdmin = false;

let mliChart, forecastChart, heatmapChart;

/* ---------- ADMIN ---------- */
function toggleAdmin(){
  document.getElementById("adminModal").style.display="block";
}
function adminLogin(){
  if(adminPass.value===ADMIN_PASSWORD){
    isAdmin=true;
    document.querySelector(".admin").style.display="block";
    adminModal.style.display="none";
  } else adminError.innerText="Wrong password";
}

/* ---------- DARK ---------- */
function toggleDark(){
  document.body.classList.toggle("dark");
  localStorage.setItem("dark",document.body.classList.contains("dark"));
}
if(localStorage.getItem("dark")==="true") document.body.classList.add("dark");

/* ---------- LOGIC ---------- */
const mapQueue=q=>q==="Low"?15:q==="Medium"?40:70;
const mapService=s=>s==="Fast"?0.8:s==="Moderate"?0.6:0.4;
const mapDefaulters=d=>d==="Low"?0.9:d==="Medium"?0.6:0.3;

function calculateMLI(q,s,sv,qi,e,m,p){
  return Math.min(1,
    0.3*(q/70)+0.3*(s/100)+0.25*(1-sv)+0.1*(1-qi)+0.1*m
  )*p;
}

const classify=m=>m>=0.75?"Avoid now":m>=0.4?"Short wait expected":"Good time to eat";

/* ---------- WAIT ---------- */
function recommendedWait(m){
  if(m>=0.8)return{t:"20–25 min",m:22};
  if(m>=0.65)return{t:"15–20 min",m:17};
  if(m>=0.45)return{t:"8–15 min",m:10};
  if(m>=0.3)return{t:"3–5 min",m:4};
  return{t:"No waiting",m:0};
}

/* ---------- AI EXPLAIN ---------- */
function aiExplain(q,s,sv){
  return `Queue ${(q/70*42).toFixed(0)}%, Seating ${(s/100*33).toFixed(0)}%, Service ${(1-sv)*18}% impact`;
}

/* ---------- ANIMATED COUNTER ---------- */
function animateMLI(val){
  let i=0;
  const el=document.getElementById("mliValue");
  const step=setInterval(()=>{
    el.innerText=i;
    if(i>=val)clearInterval(step);
    i++;
  },10);
}

/* ---------- PEAK WINDOW ---------- */
function peakCheck(){
  const h=new Date().getHours(), m=new Date().getMinutes();
  const nearEnd =
    (h===8&&m>30)||(h===14&&m>30)||(h===21&&m>0);
  peakWarning.classList.toggle("hidden",!nearEnd);
}

/* ---------- MAIN ---------- */
function runPrediction(){
  peakCheck();

  loader.classList.remove("hidden");
  setTimeout(()=>loader.classList.add("hidden"),600);

  const q=mapQueue(queue.value);
  const s=+seats.value;
  const sv=mapService(service.value);
  const qi=mapDefaulters(defaulters.value);
  const e=+eatTime.value;

  const m=previousQueue?(q-previousQueue)/70:0;
  previousQueue=q;

  const mli=calculateMLI(q,s,sv,qi,e,m,1);
  mliHistory.push(mli);
  if(mliHistory.length>12)mliHistory.shift();
  localStorage.setItem("mliHistory",JSON.stringify(mliHistory));

  const w=recommendedWait(mli);

  level.innerText=classify(mli);
  decisionBadge.className="badge "+(mli<0.4?"good":mli<0.75?"wait":"avoid");
  decisionBadge.innerText=classify(mli);

  animateMLI(Math.round(mli*100));

  details.innerText=`You'll wait ~${w.t}. Best time: ${new Date(Date.now()+w.m*60000).toLocaleTimeString()}`;
  forecast.innerText=w.t;
  aiTip.innerText=aiExplain(q,s,sv);

  waitFill.style.width=`${w.m*4}%`;
  waitText.innerText=w.t;
}

/* ---------- QR ---------- */
window.onload=()=>qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
