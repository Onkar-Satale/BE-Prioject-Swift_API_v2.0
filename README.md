# ⚡ Swift API – Smart Full-Stack API Testing & AI Debugging Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://swift-api-iota.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-AI%20LLM-F05032?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)

**Swift API** is a modern, full-stack API client and developer productivity platform. Built as a lightweight, intelligent alternative to Postman, Swift API provides seamless HTTP request testing, workflow organization, authentication management, and an **intelligent AI-powered debugging assistant** driven by Groq LLM to instantly explain API failures and recommend actionable fixes.

---

## 🌐 Live Demos

| Service | Host Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://swift-api-iota.vercel.app/](https://swift-api-iota.vercel.app/) |
| **Express Backend API** | Render | [https://swift-api-lz1n.onrender.com/](https://swift-api-lz1n.onrender.com/) |
| **GenAI FastAPI Microservice** | Render | [https://swift-api-genai.onrender.com/](https://swift-api-genai.onrender.com/) |

---

## ✨ Key Features

- 📨 **Multi-Method Request Engine:** Send `GET`, `POST`, `PUT`, `DELETE`, `PATCH` requests with custom headers, query params, and JSON/Form payload support.
- 🤖 **AI-Powered Error Debugger:** One-click AI diagnosis on HTTP error responses (`4xx`, `5xx`) powered by Groq LLM and FastAPI microservice.
- 📚 **Persistent Request History:** Automatically records request history in MongoDB for instant recall and re-testing.
- 🗂️ **Collections & Workflows:** Organize requests into structured collections for grouped testing workflows.
- 🔒 **Secure Authentication:** JWT-based user authentication featuring access/refresh token rotation and HTTP-only cookies.
- 👁️ **JSON Formatter & Syntax Highlighting:** Integrated code view with formatted JSON response structures and Ace editor capabilities.
- ⚡ **Rate Limiting & Security:** Express rate limiters, Helmet HTTP headers, CORS protection, and secure inter-service API keys.
- 📱 **Modern Developer Interface:** Dark/light responsive UI built with React.

---

## 🧠 System Architecture & Design

Swift API uses a decoupled microservices architecture designed for high throughput, security, and real-time AI diagnostic capabilities. 

<div align="center">

![Swift API System Architecture](assets/Architecture.png?v=5&raw=true)

*Comprehensive System Design Architecture Diagram illustrating Frontend SPA, API Gateway Proxy, Python GenAI Microservice, Groq LLM Cloud Engine, and MongoDB Atlas Persistence.*

</div>

---

## 📂 Repository Structure

```
Swift_API/
├── assets/                     # Application screenshots & architecture diagrams
│   ├── Architecture.png
│   ├── Login.png
│   ├── Signup.png
│   ├── Headers.png
│   ├── Testing.png
│   ├── Account.png
│   └── Genai.png
├── backend/                    # Node.js + Express REST API Server
│   ├── config/                 # DB & environment configuration
│   ├── controllers/            # Request processing & auth handlers
│   ├── middlewares/            # JWT auth, rate limiting, error handling
│   ├── models/                 # Mongoose schemas User, History, Collection
│   ├── routes/                 # Express API endpoints
│   ├── services/               # GenAI integration service
│   ├── app.js                  # Express app initialization
│   ├── server.js               # Server entry point
│   └── package.json
├── frontend/                   # React.js Single Page Application
│   ├── public/
│   ├── src/                    # Components, pages, context, and styles
│   └── package.json
└── genai/                      # Python FastAPI GenAI Microservice
    ├── app/                    # FastAPI routes, schemas, and LLM prompt logic
    ├── main.py                 # Uvicorn entry point
    ├── requirements.txt        # Python dependencies
    └── Dockerfile              # Container deployment file
```

---

## 🛠️ Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router v7, Ace Editor, CSS Modules | Interactive UI & Request Client |
| **Primary Backend** | Node.js, Express.js, Mongoose, Winston | Core API, Proxy Gateway, Auth, History |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn, Groq SDK | GenAI Error Diagnostics Engine |
| **Database** | MongoDB / MongoDB Atlas | Persistent storage for users & history |
| **Security** | JWT, bcryptjs, Helmet, Express Rate Limit | Token Auth, Encryption, Security Headers |
| **Hosting & DevOps** | Vercel, Render, Docker | Continuous Deployment & Hosting |

---

## ⚙️ Environment Configuration

Before running the application locally, set up the `.env` configuration files for each component service.

### 1. Backend Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/swift_api
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
GENAI_SERVICE_URL=http://127.0.0.1:8000
GENAI_API_SECRET=your_shared_inter_service_secret
```

### 2. Frontend Configuration (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_WEB3FORMS_KEY=your_web3forms_key_optional
```

### 3. AI Service Configuration (`genai/.env`)
```env
GROQ_API_KEY=your_groq_api_key
GENAI_API_SECRET=your_shared_inter_service_secret
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10 or higher
- **MongoDB**: Local instance running on port `27017` or MongoDB Atlas URI
- **Groq API Key**: Obtainable from [Groq Console](https://console.groq.com/)

---

### Step-by-Step Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Onkar-Satale/Swift_API_mern-.git
cd Swift_API_mern-
```

#### 2️⃣ Setup & Start Express Backend
```bash
cd backend
npm install
npm run dev
```
> *Backend server runs at:* `http://localhost:5000`

#### 3️⃣ Setup & Start FastAPI GenAI Microservice
Open a new terminal window:
```bash
cd genai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell / CMD):
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies and start server
pip install -r requirements.txt
python main.py
```
> *GenAI service runs at:* `http://127.0.0.1:8000`

#### 4️⃣ Setup & Start React Frontend
Open a third terminal window:
```bash
cd frontend
npm install
npm start
```
> *Frontend web app runs at:* `http://localhost:3000`

---

## 📡 API Reference Overview

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | No | Register a new developer account |
| `/api/login` | `POST` | No | Authenticate user and issue JWT cookies |
| `/api/logout` | `POST` | Yes | Revoke tokens and clear cookies |
| `/api/refresh-token` | `GET` | No | Obtain a new access token via refresh cookie |
| `/api/request` | `POST` | Yes | Proxy & execute target HTTP API requests |
| `/api/history` | `GET` | Yes | Fetch authenticated user's request history |
| `/api/history` | `POST` | Yes | Save a request configuration to history |
| `/api/history` | `DELETE` | Yes | Clear saved request history |
| `/api/ai/explain` | `POST` | Yes | Send error response payload to GenAI for diagnosis |

---

## 📸 Screenshots & Visual Walkthrough

<div align="center">

### 👁️ API Request & Response Client
![Testing Interface](assets/Testing.png?raw=true)
*Send HTTP requests with custom headers, body payloads, and inspect formatted JSON responses.*

### 🤖 AI-Powered Error Debugger
![AI Debugger](assets/Genai.png?raw=true)
*Receive instant AI-generated root cause analysis and actionable fix recommendations for API errors.*

### 🔑 Authentication & Security
| Login Interface | Registration |
| :---: | :---: |
| ![Login Page](assets/Login.png?raw=true) | ![Signup Page](assets/Signup.png?raw=true) |
| *Secure user authentication with JWT.* | *User onboarding and validation.* |

### 🧾 Headers Configuration & User Account
| Request Headers | Account Overview |
| :---: | :---: |
| ![Headers Page](assets/Headers.png?raw=true) | ![Account Page](assets/Account.png?raw=true) |
| *Flexible key-value header customization.* | *Manage user profiles and settings.* |

</div>

---

## 🤝 Contributing

Contributions are greatly appreciated! To contribute:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Maintainer

- **Onkar Satale**
- **GitHub:** [@Onkar-Satale](https://github.com/Onkar-Satale)
- **Project Repo:** [Swift API MERN Repository](https://github.com/Onkar-Satale/Swift_API_mern-)
