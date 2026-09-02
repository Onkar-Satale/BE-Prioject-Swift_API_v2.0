# ⚡ Swift API v2.0 – History-Grounded RAG & AI Auto-Fix API Platform

[![Live Repo](https://img.shields.io/badge/GitHub-BE--Prioject--Swift__API__v2.0-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Onkar-Satale/BE-Prioject-Swift_API_v2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6F61?style=for-the-badge&logo=databricks&logoColor=white)](https://www.trychroma.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-LPU%20Inference-F05032?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)

**Swift API v2.0** is an intelligent, developer-centric API testing and auto-debugging platform. Moving beyond traditional REST clients, Swift API v2.0 introduces **History-Grounded RAG (Retrieval-Augmented Generation)**, **Persistent ChromaDB Vector Memory**, **Confirmed AI Auto-Fix**, **History Capsule Comparison**, **API Testing Timelines**, and an objective **0–100 API Health Scoring Engine**.

---

## 🌟 What's New in v2.0?

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE v2.0 WORKFLOW                                     │
│                                                                                        │
│   API Request ──► Failure (4xx/5xx) ──► ChromaDB Vector Search (Past Episodes)        │
│          ▲                                             │                               │
│          │                                             ▼                               │
│     Auto-Index ◄── Re-Run (200 OK) ◄── Confirmed Fix ◄── AI Diagnosis & Root Cause     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. 🏛️ **History-Grounded RAG System**:
   - Stores resolution episodes (*Failure ➔ Diagnosis ➔ Applied Fix ➔ Success*) in a persistent **ChromaDB Vector Store** (`genai/chroma_db/`).
   - Generates normalized dense semantic embeddings (`dim=64`) per request in real-time ($< 0.1\text{ ms}$).
   - Retrieves historical precedents with exact match percentages and previous error evidence to eliminate LLM hallucinations.

2. 🤖 **Confirmed AI Auto-Fix**:
   - Detects route typos, missing query params, expired auth tokens, invalid JSON payloads, or wrong HTTP methods.
   - 1-Click **`[ ✅ Apply Fix to Workspace ]`** dynamically corrects your active URL, headers, params, or body.
   - 1-Click **`[ 🚀 Re-run Request Now ]`** re-executes the fixed request instantly.

3. ⚖️ **History Capsule Comparison**:
   - Compare any two historical API attempts side-by-side (e.g. Attempt A `404` vs Attempt B `200`).
   - Differential visual diff highlighting URL, timing differences, headers, and AI progression explanation.

4. 📈 **Interactive API Testing Timeline**:
   - Time-series progression grouped by endpoint path.
   - Tracks response latencies, status transitions, and fix history over time.

5. 🛡️ **0–100 API Health Score Engine**:
   - Grades requests across 5 dimensions: **Security**, **Reliability**, **Performance**, **Spec Compliance**, and **Error Handling**.
   - Identifies actionable vulnerabilities (missing auth, slow TTFB, uncompressed payloads).

6. ⚡ **Ultra-Low Latency Groq LPU**:
   - Powered by Groq's high-speed inference engine (`llama-3.1-8b-instant` / `qwen/qwen3.8-27b`) with native JSON mode.
   - End-to-end failure diagnosis and fix generation delivered in **~180–300 ms**.

7. 🔄 **Automatic Silent Token Refresh**:
   - Intercepts `401 Unauthorized` responses silently.
   - Rotates access tokens via HTTP-only cookies and automatically retries requests without session drops.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   React 18 Frontend SPA       │
                                  │   (History, Timeline, Studio) │
                                  └──────────────┬────────────────┘
                                                 │
                             ┌───────────────────┴───────────────────┐
                             │ HTTP Proxy / Auth (JWT Rotation)     │
                             ▼                                       ▼
             ┌───────────────────────────────┐       ┌───────────────────────────────┐
             │ Express.js Backend (Node.js)  │       │ FastAPI GenAI Microservice    │
             │ - Proxy Gateway               │       │ - RAG Vector Memory Engine    │
             │ - Auth & User Collections     │       │ - Root Cause Predictor        │
             │ - MongoDB Atlas Persistence   │       │ - Diff & Health Score Engine  │
             └───────────────┬───────────────┘       └───────────────┬───────────────┘
                             │                                       │
                             ▼                                       ▼
             ┌───────────────────────────────┐       ┌───────────────────────────────┐
             │ MongoDB Atlas (mydb)          │       │ Persistent ChromaDB           │
             │ - swiftapiv2_users            │       │ (genai/chroma_db/)            │
             │ - Request History & Episodes  │       │ - HNSW Cosine Index           │
             └───────────────────────────────┘       └───────────────┬───────────────┘
                                                                     │
                                                                     ▼
                                                     ┌───────────────────────────────┐
                                                     │ Groq LPU Cloud (LLM Engine)   │
                                                     │ - llama-3.1-8b-instant        │
                                                     │ - qwen/qwen3.8-27b            │
                                                     └───────────────────────────────┘
```

---

## 📂 Repository Structure

```
BE-Prioject-Swift_API_v2.0/
├── backend/                       # Node.js + Express REST API Gateway
│   ├── config/                    # DB connection & environment configuration
│   ├── controllers/               # Request proxy, auth, and AI controllers
│   ├── middlewares/               # JWT auth, rate limiting & error handling
│   ├── models/                    # Mongoose schemas (userModel, historyModel)
│   │                              # Explicit collection: swiftapiv2_users
│   ├── routes/                    # Express routes (authRoute, historyRoute, aiRoute)
│   ├── services/                  # Business logic (authService, historyService, requestService)
│   ├── app.js                     # Express app instance & security middleware
│   └── server.js                  # Backend entry point
├── frontend/                      # React 18 Single Page Application
│   ├── public/
│   ├── src/
│   │   ├── components/            # Studio components, Modals & Sidebars
│   │   │   ├── ApiHealthScoreModal.js    # 0-100 Health Score Modal
│   │   │   ├── HistoryComparisonModal.js # Capsule Comparison Modal
│   │   │   ├── TestingTimelineModal.js   # API Testing Timeline Modal
│   │   │   ├── BotSidebar.js             # RAG Assistant & Auto-Fix Dispatcher
│   │   │   ├── RequestBar.js             # Bidirectional URL & Params bar
│   │   │   └── SwiftAPIClient.js         # Core Workspace Controller
│   │   ├── context/               # SwiftAPI Context & State
│   │   ├── services/              # authService (Silent Refresh), historyService
│   │   └── utils/                 # Toast notifications and formatting
│   └── package.json
└── genai/                         # Python FastAPI GenAI Microservice
    ├── app/
    │   ├── config/                # Settings & Groq API configuration
    │   ├── routes/                # FastAPI routers (/analyze, /failure-assist, /rag)
    │   ├── schemas/               # Pydantic models for validation
    │   └── services/
    │       ├── llm_service.py     # Groq LLM integration & prompt chains
    │       └── rag_service.py     # Persistent ChromaDB & Embedding Engine
    ├── chroma_db/                 # Persistent ChromaDB vector index directory
    ├── rag_episodes.json          # Pre-seeded RAG resolution memory episodes
    ├── requirements.txt           # Python dependencies (fastapi, chromadb, groq)
    └── main.py                    # Uvicorn entry point
```

---

## 🛠️ Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, React-Router v7, Vanilla CSS | Interactive API Client & Diagnostics UI |
| **Backend Gateway** | Node.js, Express.js, Mongoose 9, Winston | Request Proxy, JWT Auth, History Sync |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn | RAG Retrieval, Health Scoring, Diff Engine |
| **Vector Database** | ChromaDB (Persistent Client, HNSW Cosine) | Real-time Embedding Storage & Semantic Search |
| **Database** | MongoDB Atlas (`mydb` ➔ `swiftapiv2_users`) | User Accounts & Execution Logs |
| **LLM Inference** | Groq LPU (`llama-3.1-8b-instant`, `qwen/qwen3.8-27b`) | Sub-second Diagnostic Generation |

---

## ⚙️ Environment Configuration

### 1. Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<USER>:<PASS>@cluster0.pwolfrj.mongodb.net/mydb?retryWrites=true&w=majority
JWT_ACCESS_SECRET=superManKey_swift_v2
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=superSecretRefreshKey_swift_v2
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
GENAI_SERVICE_URL=http://127.0.0.1:8000
GENAI_API_SECRET=my_super_secret_ai_token_123
```

### 2. Frontend (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 3. GenAI Microservice (`genai/.env`)
```env
GROQ_API_KEY=your_groq_api_key_here
GENAI_API_SECRET=my_super_secret_ai_token_123
```

---

## 🚀 Quickstart & Local Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Onkar-Satale/BE-Prioject-Swift_API_v2.0.git
cd BE-Prioject-Swift_API_v2.0
```

### 2️⃣ Start Express Backend
```bash
cd backend
npm install
npm start
```
> *Backend runs at:* `http://localhost:5000`

### 3️⃣ Start FastAPI GenAI Microservice
```bash
cd genai
pip install -r requirements.txt
python main.py
```
> *GenAI service with ChromaDB runs at:* `http://127.0.0.1:8000`

### 4️⃣ Start React Frontend
```bash
cd frontend
npm install
npm start
```
> *Frontend web client runs at:* `http://localhost:3000`

---

## 📡 API Reference Overview

| Endpoint | Method | Service | Description |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | Express | User registration |
| `/api/login` | `POST` | Express | User authentication & JWT issuance |
| `/api/refresh-token` | `POST` | Express | Silent access token refresh via cookie |
| `/api/request` | `POST` | Express | Proxy & execute target API requests |
| `/api/history` | `GET` | Express | Retrieve user request history |
| `/api/ai/failure-assist` | `POST` | GenAI | History-Grounded RAG failure diagnosis & fix |
| `/api/ai/compare` | `POST` | GenAI | Differential comparison between 2 attempts |
| `/api/ai/health-score` | `POST` | GenAI | Compute 0–100 API Health Score |
| `/api/ai/rag/index-episode` | `POST` | GenAI | Index verified resolution episode into ChromaDB |
| `/api/ai/rag/retrieve` | `POST` | GenAI | Top-$k$ vector retrieval from ChromaDB |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 👨‍💻 Author & Maintainer

- **Onkar Satale**
- **GitHub:** [@Onkar-Satale](https://github.com/Onkar-Satale)
- **Repository:** [BE-Prioject-Swift_API_v2.0](https://github.com/Onkar-Satale/BE-Prioject-Swift_API_v2.0)
