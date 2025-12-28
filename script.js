let previousMLI = null;

function mapQueue(q) {
  if (q === "Low") return 15;
  if (q === "Medium") return 40;
  return 70;
}

function mapService(s) {
  if (s === "Fast") return 20;
  if (s === "Moderate") return 60;
  return 100;
}

function mapDefaulters(d) {
  if (d === "Low") return 5;
  if (d === "Medium") return 10;
  return 20;
}

function calculateMLI(meal, queue, seats, service, defaulters) {
  let base;
  if (meal === "Breakfast") {
    base = 0.3 * queue + 0.3 * seats + 0.3 * service + 0.1 * defaulters;
  } else {
    base = 0.35 * queue + 0.3 * seats + 0.2 * service + 0.15 * defaulters;
  }
  let noise = Math.random() * 10 - 5;
  return Math.min(100, Math.max(0, base + noise));
}

function classify(mli) {
  if (mli >= 75) return "High";
  if (mli >= 40) return "Medium";
  return "Low";
}

function confidence(defaulters, service) {
  return Math.max(40, Math.round(100 - defaulters - service * 0.15));
}

function trend(curr) {
  if (previousMLI === null) return "Stable";
  if (curr - previousMLI > 5) return "Increasing";
  if (previousMLI - curr > 5) return "Decreasing";
  return "Stable";
}

function futureMLI(current, tr) {
  if (tr === "Increasing")
    return [current, Math.min(100, current + 8), Math.min(100, current + 15)];
  if (tr === "Decreasing")
    return [current, Math.max(0, current - 8), Math.max(0, current - 15)];
  return [current, current, current];
}

function scenarioAnalysis(mli) {
  return {
    best: Math.max(0, mli - 10),
    worst: Math.min(100, mli + 15)
  };
}

function recommendation(level, tr, risk) {
  if (level === "High" && tr === "Increasing")
    return "Heavy congestion building. Visit after 15–20 minutes." + risk;
  if (level === "High")
    return "High congestion. Expect long waiting time." + risk;
  if (level === "Medium")
    return "Moderate crowd. Short wait expected.";
  return "Low crowd. Good time to visit.";
}

function runPrediction() {
  const meal = document.getElementById("meal").value;
  const q = mapQueue(document.getElementById("queue").value);
  const seats = parseInt(document.getElementById("seats").value);
  const service = mapService(document.getElementById("service").value);
  const def = mapDefaulters(document.getElementById("defaulters").value);

  const mli = calculateMLI(meal, q, seats, service, def);
  const lvl = classify(mli);
  const conf = confidence(def, service);
  const tr = trend(mli);
  const future = futureMLI(mli, tr);
  const scenarios = scenarioAnalysis(mli);

  previousMLI = mli;

  let riskNote = scenarios.worst >= 80 ? " (Worst-case congestion possible)" : "";

  document.getElementById("level").innerText =
    `${lvl} Crowd (MLI: ${Math.round(mli)})`;

  document.getElementById("details").innerText =
    `Confidence: ${conf}% | Trend: ${tr}\n` +
    recommendation(lvl, tr, riskNote);

  document.getElementById("forecast").innerText =
    `Forecast → Now: ${classify(future[0])}, +10 min: ${classify(future[1])}, +20 min: ${classify(future[2])}`;
}
