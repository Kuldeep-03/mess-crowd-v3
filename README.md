# Smart Mess Crowd Management System
### Prototype V3 — Adaptive, Meal-Aware & Uncertainty-Driven

---

## Overview
Campus mess facilities frequently experience severe congestion during peak hours. This congestion is not caused only by the number of students, but by a combination of fixed seating capacity, batch food preparation, service bottlenecks, and human behavior.

This project proposes a realistic, systems-engineering–driven solution that predicts mess congestion and provides actionable guidance to students under uncertainty — without increasing mess staff workload.

---

## 📸 Prototype Screenshots

### High Congestion Scenario
![High Crowd](screenshots/high_crowd.png)

### Medium Congestion Scenario
![Medium Crowd](screenshots/medium_crowd.png)

### Low Congestion Scenario
![Low Crowd](screenshots/low_crowd.png)

---

## Problem Statement
- Fixed seating capacity (~100 seats) limits throughput
- Single serving counter with parallel queues
- Batch cooking (parathas / rotis) causes service variability
- Queue defaulters disrupt flow
- Peak demand is concentrated in short time windows
- Existing crowd handling is manual and reactive

---

## Objectives
- Predict congestion realistically, not optimistically
- Model real mess constraints instead of ideal assumptions
- Provide short-term forecasts and confidence levels
- Enable students to decide when to visit the mess
- Avoid continuous human supervision

---

## System Evolution
- V1 — Time-based crowd indicator
- V2 — Meal-aware, capacity-aware congestion model
- V3 (Current) — Adaptive, uncertainty-aware decision support system

---

## System Architecture (V3)

Meal Context  
↓  
Automatic System Signals  
↓  
Mess Load Index (MLI)  
↓  
Crowd Level + Confidence  
↓  
Short-Term Forecast & Recommendation  

---

## System Flow Map (End-to-End)

User opens app  
↓  
Meal type identified (Breakfast / Lunch / Dinner)  
↓  
Automatic system signals activated  
(Time, seating, service speed, disruptions)  
↓  
Mess Load Index (MLI) computation  
↓  
Crowd classification (Low / Medium / High)  
↓  
Confidence estimation  
↓  
Short-term forecast (+10 / +20 minutes)  
↓  
Scenario risk analysis (best / worst case)  
↓  
Actionable recommendation displayed  

---

## Mess Load Index (MLI)
Crowd pressure is modeled using a composite index ranging from 0 to 100 instead of binary states.

### Inputs Modeled
- Queue length
- Seating occupancy
- Service speed (batch cooking / food availability)
- Human disruptions (queue defaulters)

---

## Meal-Aware Congestion Modeling

### Breakfast
- Batch-driven (paratha preparation)
- Service speed is the dominant bottleneck
- Rice/roti distinction disabled

### Lunch & Dinner
- Mixed service (rice + roti)
- Service heterogeneity enabled
- Seating saturation has higher impact at dinner

The system automatically switches congestion models based on meal type.

---

## Advanced Features in Prototype V3

### Short-Term Time Horizon Forecasting
The system estimates congestion for:
- Current time
- +10 minutes
- +20 minutes

---

### Scenario-Based Risk Analysis
- Best-case scenario
- Average-case scenario
- Worst-case scenario

---

### Minimal Admin Intervention
Predictions run automatically.
Manual override only during abnormal events.

---

## Why Machine Learning Is Not Used (Yet)
ML is deferred due to cold-start risk, high noise, and need for explainability.
The system is ML-ready by design.

---

## Technology Stack
- HTML, CSS, JavaScript
- Google Cloud (planned)
- Firebase / Firestore (planned)

---

## Ethics & Privacy
- No individual tracking
- Aggregated inputs only
- Transparent behavior

---

## Expected Impact
- Reduced congestion
- Improved student experience
- Safer mess operations

---

## Author Contribution
- Systems modeling
- Architecture design
- Prototype logic

---

## Project Structure

```
mess-crowd-v3/
├── index.html        # Main UI
├── style.css         # Styling
├── script.js         # Core logic
├── README.md         # Documentation
├── LICENSE           # MIT License
└── screenshots/
    ├── high_crowd.png
    ├── medium_crowd.png
    ├── low_crowd.png
    └── forecast.png
```

---

## Prototype Status
- Core engine implemented
- Meal-aware switching active
- Forecasting enabled
