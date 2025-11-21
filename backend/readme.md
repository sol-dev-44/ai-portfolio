# 🔌 AI Portfolio Backend

**FastAPI-powered backend for AI/ML operations.**

This service handles the heavy lifting for the AI Portfolio, including tokenization, model inference, and streaming text generation.

## ✨ Features

- **FastAPI**: High-performance, async Python web framework.
- **PyTorch Integration**: Runs local models (GPT-2) for inference.
- **Streaming Support**: Server-Sent Events (SSE) for real-time text generation.
- **TikToken**: Efficient tokenization using OpenAI's libraries.
- **Type Safety**: Pydantic models for request/response validation.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Virtual environment tool (venv)

### Setup

1.  **Create Virtual Environment**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run Server**
    ```bash
    python main.py
    ```
    Server runs on `http://localhost:8080`.

## 📚 API Reference

### Tokenization

#### `GET /api/tokenizers`
List available tokenizers.

#### `POST /api/tokenize`
Tokenize text with specific tokenizers.
```json
{
  "text": "Hello world",
  "tokenizers": ["gpt2", "cl100k_base"]
}
```

### Generation

#### `POST /api/llm/generate_stream`
Stream text generation (SSE).
```json
{
  "prompt": "Once upon a time",
  "model_id": "gpt2",
  "max_new_tokens": 50,
  "temperature": 0.7
}
```

#### `POST /api/generation/probabilities`
Get next-token probabilities for visualization.
```json
{
  "prompt": "The future is",
  "top_k": 10
}
```

## 🏗️ Architecture

```
FastAPI App
├── Middleware (CORS)
├── Global State (Loaded Models)
│   ├── TikToken Encoders
│   └── GPT-2 Model (PyTorch)
└── Routes
    ├── /api/tokenizers
    ├── /api/tokenize
    ├── /api/llm/generate_stream
    └── /api/generation/probabilities
```

## 🔧 Development

- **Hot Reload**: Not enabled by default in `main.py` (uses `uvicorn.run`). For hot reload, run with `uvicorn main:app --reload`.
- **Model Loading**: Models are loaded on startup. GPT-2 is downloaded automatically if not present.
