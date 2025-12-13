# 🤖 AI Portfolio

> A hybrid full-stack AI engineering portfolio demonstrating the convergence of modern web architecture and state-of-the-art machine learning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**[Live Demo](https://ai-portfolio-psi-lyart.vercel.app/)** | **[API Docs](https://ai-portfolio-production-7eb9.up.railway.app/docs)**

---

## 🎯 Project Overview

A hybrid full-stack application built with **Next.js** and **TypeScript**, backed by a **Python FastAPI** service for orchestration and ML compute. The architecture utilizes **Supabase with pgvector** to enable Retrieval-Augmented Generation (RAG) workflows for semantic search and document analysis, while leveraging **LangChain** to manage complex agentic chains across OpenAI, Anthropic, and local HuggingFace models.

---

## ✨ Key Features

### 🛠️ SnapFix AI Diagnostic
An advanced multi-agent system for repair diagnosis.
- **Multimodal Analysis**: Uses GPT-4o Vision to analyze uploaded photos of repair issues.
- **Cyclical RAG Knowledge Base**: Retrieves relevant repair manuals and similar past cases.
- **Web Intelligence**: Performs live searches for parts and pricing.
- **Synthesis**: Claude 3.5 Sonnet synthesizes all data into a comprehensive repair report.

### 🎨 Dashboard Studio
A Generative UI platform that builds React components in real-time.
- **Natural Language to UI**: Describe an interface, and Claude 3.5 Sonnet generates the code.
- **Live Preview**: Secure, sandboxed execution of generated React code.
- **Iterative Refinement**: Chat with the AI to tweak styles or add functionality.

### ⚖️ Contract Auditor
AI-powered legal document analysis tool.
- **RAG & Vector Search**: Uses OpenAI embeddings and Supabase pgvector to compare clauses against a database of standard legal texts.
- **Risk Scoring**: Identifies problematic clauses and assigns severity scores.
- **Interactive Feedback**: Users can accept/reject findings, which feeds back into the system (RLHF-lite).

### 🐕 Dog Breed Matcher
Semantic search engine for finding the perfect pet.
- **Vector Search**: Embeds user preferences into a vector space to find the nearest neighbor dog breeds.
- **Hybrid Filtering**: Combines vector similarity with traditional metadata filters (size, energy level).

### 💬 RAG Chat
Chat with an AI that "knows" about my professional background.
- **Resume RAG**: Queries a vectorized version of my resume and portfolio.
- **Contextual Answers**: Provides cited responses based on retrieved documents.

### 📊 Token Generation Visualizer
An educational tool to demystify LLM decoding strategies.
- **Local Inference**: Runs a quantized **GPT-2** model locally via the Python backend.
- **Real-time Probability Visualization**: Uses D3.js to show the probability distribution of the next token.
- **Interactive Sampling**: Experiment with Greedy, Top-k, and Nucleus (Top-p) sampling strategies.

### 🤖 3D Robot Controller
A voice-activated 3D character.
- **Voice Computing**: Uses Web Speech API for speech-to-text.
- **Intent Parsing**: LLM determines the user's intent ("dance", "wave", etc.).
- **3D Animation**: React Three Fiber renders and animates the 3D model.

*(Note: The `/agent` feature has been sunsetted but code remains for educational reference.)*

---

## 🏗️ Architecture Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit (RTK Query)
- **Styling**: Tailwind CSS + Framer Motion
- **Visualization**: D3.js

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Orchestration**: LangChain
- **ML Models**:
    - Cloud: OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet)
    - Local: HuggingFace Transformers (GPT-2, Qwen)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Server**: Uvicorn (ASGI)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git
- Supabase account (or local instance)
- API Keys: OpenAI, Anthropic, HuggingFace

### Setup & Run
1. **Clone the Repository**
    ```bash
    git clone https://github.com/sol-dev-44/ai-portfolio.git
    cd ai-portfolio
    ```

2. **Backend Config**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3. **Frontend Config**
    ```bash
    # Open new terminal in project root or cd ..
    npm install
    echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api" > .env.local
    ```

4. **Run Everything**
    Launch both the frontend and backend concurrently with a single command:
    ```bash
    npm run dev:all
    ```
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:8080`

---

## 🔧 Development

### Available Scripts

| Command | Description |
| :--- | :--- |
| **`npm run dev:all`** | **Recommended.** Runs specific frontend and backend concurrently. |
| `npm run dev` | Runs only the Next.js frontend. |
| `npm run dev:backend` | Runs only the FastAPI backend (requires virtualenv activation). |
| `npm run build` | Builds the Next.js application for production. |
| `npm run lint` | Runs ESLint checks. |

### Environment Variables
**Backend (.env)**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=...
SUPABASE_KEY=...
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

---

## 🎮 Usage Examples

### Tokenizer Comparison
**Goal: Estimate API Costs**
```text
Input: "Write a comprehensive guide to machine learning"

GPT-2:      15 tokens × $0.0015/1K = $0.0000225
GPT-4:      12 tokens × $0.03/1K  = $0.00036
```

### LLM Playground
**Goal: Creative Story Writing**
```text
Prompt:      "Once upon a time, in a distant galaxy"
Strategy:    Top-P (0.9) (Nucleus Sampling)
Temperature: 0.9
Result:      Creative, flowing narrative that avoids repetition.
```

---

## 📊 API Reference

The backend provides a Swagger UI at `/docs`. Common endpoints:

### Tokenization
`POST /api/tokenize`
```json
{
  "text": "Hello, world!",
  "tokenizers": ["gpt2", "cl100k_base"]
}
```

### LLM Generation
`POST /api/llm/generate`
```json
{
  "prompt": "Once upon a time",
  "model_id": "gpt2",
  "strategy": "top_p",
  "temperature": 0.8
}
```

---

## 🚢 Deployment

### Backend (Railway)
1. Connect your GitHub repo to **Railway**.
2. Select `backend/` as the root directory.
3. Add environment variables (API keys).
4. Railway auto-detects Python and installs `requirements.txt`.

### Frontend (Vercel)
1. Connect your GitHub repo to **Vercel**.
2. Select root directory (or `frontend/` if structured differently).
3. Set `NEXT_PUBLIC_API_BASE_URL` to your Railway URL.
4. Vercel automatically builds and deploys Next.js apps.

---

## 🐛 Troubleshooting

**"Models still loading" in frontend**
- On the first backend startup, local models (GPT-2, Qwen) must be downloaded from HuggingFace. This can take 5-10 minutes depending on your connection. Check the backend terminal logs for progress.

**"ModuleNotFoundError: No module named 'torch'"**
- Ensure you activated your virtual environment (`source venv/bin/activate`) before running `pip install` or `npm run dev:backend`.

**CORS errors**
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local` matches your running backend URL exactly.

---

## 📈 Performance Metrics

### Backend
- **Startup Time**: ~15 seconds (warm), 5-10 mins (cold/first run)
- **Tokenization**: <50ms per request
- **Text Generation**: 2-5 seconds (CPU), <1 second (GPU)

### Frontend
- **First Load**: ~1 second (Static Generation)
- **Page Navigation**: <100ms (Client-side routing)

---

## 📧 Contact

**Alan Campbell**  
Staff Engineer & AI Architect
- Portfolio: [ai-portfolio-psi-lyart.vercel.app](https://ai-portfolio-psi-lyart.vercel.app/)
- LinkedIn: [linkedin.com/in/alan-james-campbell](https://www.linkedin.com/in/alan-james-campbell/)
- Email: alancampbell4444@gmail.com

---

<div align="center">
Built with ❤️ by Alan Campbell
</div>
