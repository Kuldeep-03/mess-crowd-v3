# 🍽️ Smart Mess Crowd Management System

A predictive, explainable system to estimate mess crowd congestion and recommend the **best time to eat**, reducing wait time and overcrowding in college messes.

---

## 🚩 Problem Statement

College messes face unpredictable crowd surges during peak hours, leading to:
- Long queues and waiting times
- Poor dining experience
- Inefficient use of seating and staff

Students lack real-time guidance, and mess managers lack analytical decision-support tools.

---

## 💡 Our Solution

The **Smart Mess Crowd Management System** predicts mess congestion using real-time inputs and behavioral factors, and provides:
- Crowd level prediction (Low / Medium / High)
- Recommended waiting time
- Best future time to visit
- Explainable AI-based insights
- Visual analytics for both students and administrators

---

## 🧠 Core Concept: Mess Load Index (MLI)

The system computes a **Mess Load Index (MLI)** in the range **[0, 1]**, representing congestion severity.

### Inputs Used
- Queue length
- Seats occupied (%)
- Service speed
- Queue discipline
- Average eating time
- Arrival momentum (change in queue size)
- Time-of-day peak amplification

### Crowd Classification
| MLI Range | Crowd Level |
|---------|------------|
| < 0.40  | Low        |
| 0.40 – 0.74 | Medium |
| ≥ 0.75  | High       |

---

## 🔄 PROCESS FLOW (INSIDE CODE)

User Inputs  
↓  
Input Validation  
↓  
Auto Time Detection  
↓  
Meal Context Adjustment  
↓  
MLI Calculation  
↓  
Historical Smoothing  
↓  
Crowd Classification  
↓  
Wait-Time Estimation  
↓  
Best-Time Recommendation  
↓  
Explainable AI Insight  
↓  
Charts, Heatmaps & Dashboard Output  

---

## 🏗️ SYSTEM ARCHITECTURE FLOW (INSIDE CODE)

```
┌────────────────────────────┐
│ Student / Admin Web UI     │
│ (HTML + CSS + JS)          │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Input Mapping Layer        │
│ Queue, Seats, Service      │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Context Engine             │
│ Time-of-day + Meal Peaks   │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Mess Load Index (MLI)      │
│ Weighted Prediction Model  │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Historical Smoothing       │
│ (LocalStorage Persistence) │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Decision Engine            │
│ Wait / Go / Avoid Logic    │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Explainable AI Layer       │
│ “Why this prediction?”     │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ Visualization Layer        │
│ Charts, Heatmaps           │
└───────────────┬────────────┘
                ↓
┌────────────────────────────┐
│ User Guidance & Admin      │
│ Analytics Dashboard        │
└────────────────────────────┘
```

---

## 📊 CHARTS & VISUALIZATIONS (INSIDE CODE)

- Line Chart → Congestion trend with capacity threshold
- Bar Chart → Short-term forecast (Now, +10 min, +20 min)
- Heatmap → Time-based congestion intensity
- Wait Bar → Visual waiting time indicator

All charts are **mobile-friendly and touch-optimized**.

---

## 📁 PROJECT STRUCTURE (INSIDE CODE)

```
mess-crowd-v3/
│
├── index.html
│   ├─ Student input interface
│   ├─ Prediction output section
│   ├─ Charts & heatmap containers
│   ├─ Admin dashboard section
│   └─ Admin password modal
│
├── style.css
│   ├─ Light & dark mode themes
│   ├─ Mobile-first responsive layout
│   ├─ Modal & admin styling
│   ├─ Chart & wait-bar styling
│   └─ Touch-friendly UI elements
│
├── script.js
│   ├─ MLI prediction logic
│   ├─ Explainable AI reasoning
│   ├─ Chart.js visualizations
│   ├─ LocalStorage persistence
│   ├─ Admin authentication logic
│   └─ CSV export utilities
│
├── README.md
│   └─ Project documentation
│
└── assets/ (optional)
    └─ Screenshots / demo media
```

---

## 👤 STUDENT FEATURES

- Live crowd prediction
- Recommended waiting time
- Best time to visit (clock-based)
- Trend and forecast charts
- Dark mode toggle
- QR code for sharing live status

---

## 🛠️ ADMIN FEATURES

- Password-protected admin dashboard
- Average and peak congestion statistics
- Historical congestion trends
- CSV export for daily analysis

---

## 🧪 DATA PERSISTENCE

- Browser LocalStorage
- Predictions persist across reloads
- Enables lightweight historical learning without backend

---

## 🧩 TECH STACK

- HTML, CSS, JavaScript
- Chart.js
- Browser LocalStorage
- GitHub Pages

---

## 🌐 LIVE DEMO

https://Kuldeep-03.github.io/mess-crowd-v3/

---

## ✅ PROJECT STATUS

- MVP completed
- Fully deployed
- Explainable & demo-ready
- Suitable for hackathons and evaluations

---

## 📝 FINAL NOTE

This project transforms everyday mess data into **clear, actionable intelligence**, improving student dining experience and enabling smarter administrative decisions.
