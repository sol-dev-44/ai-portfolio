# 🤖 AI Portfolio

> Interactive web applications for exploring AI/ML concepts through hands-on experimentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

A full-stack AI engineering portfolio featuring two interactive tools for understanding language models: a tokenizer comparison tool and an LLM playground. Built to demonstrate practical AI/ML integration with modern web technologies.

**[Live Demo](https://your-portfolio.vercel.app)** | **[API Docs](https://your-backend.railway.app/docs)**

---

## ✨ Features

### 🔤 Tokenizer Comparison
Compare how different OpenAI tokenizers (GPT-2, GPT-3.5, GPT-4, GPT-4o) split text into tokens.
- **Real-time tokenization** with visual feedback
- **Efficiency metrics** to compare token count and chars/token ratio
- **Interactive examples** for emoji, code, multilingual text
- **Cost estimation** for API usage optimization

### 🚀 LLM Playground
Experiment with language models using different generation strategies.
- **Two models**: GPT-2 (completion) and Qwen 2.5 (instruction-tuned)
- **Four strategies**: Greedy, Top-K, Top-P (Nucleus), Beam Search
- **Interactive controls** for temperature, max tokens, and more
- **Real-time generation** with helpful tooltips and examples

---

## 🎯 Why This Project?

This portfolio demonstrates:
- ✅ **Production-ready AI integration** - Real models running in production
- ✅ **Full-stack architecture** - Modern React frontend + FastAPI backend
- ✅ **Type-safe development** - TypeScript + Pydantic validation
- ✅ **Performance optimization** - Model caching, efficient tokenization
- ✅ **User experience** - Smooth animations, tooltips, responsive design

Perfect for understanding LLM fundamentals while building real-world applications.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit (RTK Query)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **AI/ML**: PyTorch, Transformers (HuggingFace)
- **Tokenization**: TikToken
- **Server**: Uvicorn (ASGI)
- **Deployment**: Railway

### DevOps
- **Version Control**: Git
- **CI/CD**: Vercel + Railway auto-deploy
- **Environment Management**: Conda (Python), npm (Node.js)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-portfolio.git
cd ai-portfolio
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

Backend runs on `http://localhost:8080`

### 3. Frontend Setup
```bash
cd frontend  # or cd .. if you're in backend/

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api" > .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Visit the App
- **Homepage**: http://localhost:3000
- **Tokenizer**: http://localhost:3000/tokenizer
- **LLM Playground**: http://localhost:3000/llm-playground
- **API Docs**: http://localhost:8080/docs

---

## 📁 Project Structure

```
ai-portfolio/
├── backend/                    # FastAPI backend
│   ├── main.py                # API server with all endpoints
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # Virtual environment (local)
│
├── frontend/                   # Next.js frontend (or src/ depending on structure)
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx          # Homepage
│   │   ├── tokenizer/        # Tokenizer feature
│   │   └── llm-playground/   # LLM Playground feature
│   ├── components/           # Reusable UI components
│   ├── store/                # Redux store + RTK Query
│   └── package.json          # Node dependencies
│
├── docs/                      # Documentation (optional)
│   ├── TOKENIZER.md
│   ├── LLM_PLAYGROUND.md
│   └── BACKEND.md
│
└── README.md                  # This file
```

---

## 🎮 Usage Examples

### Tokenizer Comparison

**Use Case 1: Estimate API Costs**
```
Input: "Write a comprehensive guide to machine learning"

GPT-2:      15 tokens × $0.0015/1K = $0.0000225
GPT-4:      12 tokens × $0.03/1K  = $0.00036

💡 GPT-4's tokenizer is 25% more efficient!
```

**Use Case 2: Debug Token Limits**
```
Context Limit: 8,192 tokens
Your Prompt:   8,500 tokens ❌

Use tokenizer to see exactly where to trim!
```

### LLM Playground

**Use Case 1: Story Writing (GPT-2)**
```
Prompt:      "Once upon a time, in a distant galaxy"
Strategy:    Top-P (0.9)
Temperature: 0.9
Result:      Creative, flowing narrative
```

**Use Case 2: Question Answering (Qwen)**
```
Prompt:      "Q: What are three benefits of exercise?\nA:"
Strategy:    Top-K (40)
Temperature: 0.7
Result:      Structured, focused response
```

---

## 📊 API Reference

### Tokenization

**List Available Tokenizers**
```bash
GET /api/tokenizers
```

**Tokenize Text**
```bash
POST /api/tokenize
Content-Type: application/json

{
  "text": "Hello, world!",
  "tokenizers": ["gpt2", "cl100k_base"]
}
```

### LLM Generation

**List Available Models**
```bash
GET /api/llm/models
```

**Generate Text**
```bash
POST /api/llm/generate
Content-Type: application/json

{
  "prompt": "Once upon a time",
  "model_id": "gpt2",
  "strategy": "top_p",
  "max_new_tokens": 100,
  "temperature": 0.8,
  "top_p": 0.9
}
```

**Full API Documentation**: Visit `/docs` endpoint when backend is running.

---

## 🚢 Deployment

### Backend (Railway)

1. **Connect Repository**
   - Sign up at [Railway](https://railway.app/)
   - Connect your GitHub repository
   - Select `backend/` as root directory

2. **Configure**
   ```bash
   # Railway auto-detects Python and installs dependencies
   # Set PORT environment variable (optional, defaults to 8080)
   ```

3. **Deploy**
   - Push to main branch
   - Railway auto-deploys
   - First deploy takes 10-15 min (model download)

### Frontend (Vercel)

1. **Connect Repository**
   - Sign up at [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Select `frontend/` as root directory (or project root)

2. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app/api
   ```

3. **Deploy**
   - Push to main branch
   - Vercel auto-deploys
   - Deploy time: ~2-3 minutes

### Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Update CORS settings in `backend/main.py` to include your domain

---

## 🔧 Development

### Running Both Servers Concurrently

```bash
# Install concurrently (if not already installed)
npm install -g concurrently

# Run both frontend and backend
npm run dev:all
```

This starts:
- Backend on `localhost:8080`
- Frontend on `localhost:3000`

### Environment Variables

**Backend** (optional):
```bash
PORT=8080
```

**Frontend** (required):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api  # Local
# or
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app/api  # Production
```

### Adding New Features

1. **Backend**: Add endpoint in `backend/main.py`
2. **Frontend**: Create RTK Query slice in `store/api/`
3. **UI**: Build component in `app/your-feature/`
4. **Navigation**: Update `components/Navbar.tsx`

---

## 🧪 Testing

### Backend
```bash
cd backend

# Test tokenization endpoint
curl http://localhost:8080/api/tokenizers

# Test generation endpoint
curl -X POST http://localhost:8080/api/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "model_id": "gpt2",
    "strategy": "greedy",
    "max_new_tokens": 20,
    "temperature": 1.0
  }'
```

### Frontend
```bash
# Run dev server and manually test features
npm run dev

# Visit each page:
# - http://localhost:3000
# - http://localhost:3000/tokenizer
# - http://localhost:3000/llm-playground
```

---

## 🐛 Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'torch'"**
```bash
# Activate virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

**"Models still loading" in frontend**
```bash
# Wait 15-30 seconds on first backend startup
# Models download: GPT-2 (~500MB) + Qwen (~1GB)
# Check backend logs for progress
```

**CORS errors**
```bash
# Verify NEXT_PUBLIC_API_BASE_URL in .env.local
# Ensure URL matches your backend URL exactly
```

### Frontend Issues

**"API connection failed"**
```bash
# Check backend is running: curl http://localhost:8080
# Verify .env.local has correct API URL
# Check browser console for exact error
```

**Emojis showing as weird symbols**
```bash
# Ensure files are saved with UTF-8 encoding
# Check your editor's encoding settings
```

### Performance Issues

**Slow text generation**
```bash
# Normal on CPU: 2-5 seconds for 50 tokens
# Solutions:
# - Reduce max_tokens
# - Use Greedy strategy (fastest)
# - Deploy to GPU instance (Railway Pro)
```

---

## 📈 Performance Metrics

### Backend
- **Startup Time**: 15 seconds (with cached models)
- **Tokenization**: <50ms per request
- **Text Generation**: 2-5 seconds (CPU), <1 second (GPU)
- **Memory Usage**: ~3GB RAM (both models loaded)

### Frontend
- **First Load**: ~1 second
- **Page Navigation**: <100ms
- **API Calls**: Depends on backend response time
- **Build Size**: ~500KB (gzipped)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow existing code style
   - Add comments where necessary
   - Test your changes locally
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Style
- **Frontend**: Follow existing TypeScript/React patterns
- **Backend**: Follow PEP 8 for Python code
- **Components**: Use functional components with hooks
- **API**: Include Pydantic models for validation

---

## 🎓 Learning Resources

### Tokenization
- [OpenAI Tokenizer Tool](https://platform.openai.com/tokenizer)
- [TikToken Documentation](https://github.com/openai/tiktoken)
- [Understanding Tokenization](https://huggingface.co/learn/nlp-course/chapter2/4)

### Text Generation
- [HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [Text Generation Strategies](https://huggingface.co/blog/how-to-generate)
- [Temperature and Sampling](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277)

### Full-Stack Development
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for TikToken library
- **HuggingFace** for Transformers library
- **Anthropic** for Claude (assisted with development)
- **Byte Byte AI** for AI Engineering course inspiration

---

## 📧 Contact

**Alan Campbell**
- Portfolio: [your-portfolio.com](https://your-portfolio.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🚀 What's Next?

Future enhancements planned:
- [ ] Add more LLM models (Llama, Mistral)
- [ ] Streaming text generation (SSE)
- [ ] Conversation history and context
- [ ] Fine-tuning interface
- [ ] Token usage analytics dashboard
- [ ] Model comparison side-by-side
- [ ] Export/share generated content
- [ ] API rate limiting and authentication
- [ ] Performance monitoring dashboard

---

<div align="center">

**Built with ❤️ by Alan Campbell**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/yourusername/ai-portfolio/issues) · [Request Feature](https://github.com/yourusername/ai-portfolio/issues)

</div>