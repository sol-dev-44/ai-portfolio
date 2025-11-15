# 🚀 LLM Playground

An interactive web application for experimenting with language models using different decoding strategies and parameters.

## Features

- **Two Models**: GPT-2 (completion) and Qwen 2.5 (instruction-tuned)
- **Four Strategies**: Greedy, Top-K, Top-P (Nucleus), and Beam Search
- **Real-time Generation**: See model outputs instantly
- **Interactive Controls**: Adjust temperature, max tokens, and strategy-specific parameters
- **Example Prompts**: Quick-start with pre-configured prompts

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
npm run dev
```

Visit: `http://localhost:3000/llm-playground`

## Usage Tips

### GPT-2 (Completion Model)
✅ Best for: Continuing text, stories, code completion  
📝 Example: "Once upon a time, there was a"

### Qwen (Instruction-Tuned)
✅ Best for: Questions, instructions, structured tasks  
📝 Example: "Q: What is the capital of France?\nA:"

### Recommended Settings
- **Creative writing**: Top-P (0.9), Temperature 0.8-1.0
- **Focused output**: Greedy or Top-K (40), Temperature 0.5-0.7
- **Best quality**: Beam Search (4-6 beams), Temperature 0.7

## Tech Stack

**Backend**
- FastAPI
- PyTorch
- Transformers (HuggingFace)
- Python 3.9+

**Frontend**
- Next.js 14
- TypeScript
- Redux Toolkit (RTK Query)
- Framer Motion
- Tailwind CSS

## API Endpoints

### GET `/api/llm/models`
Returns available models with metadata.

### POST `/api/llm/generate`
Generates text with specified parameters.

**Request:**
```json
{
  "prompt": "Once upon a time",
  "model_id": "gpt2",
  "strategy": "top_p",
  "max_new_tokens": 100,
  "temperature": 0.8,
  "top_p": 0.9
}
```

**Response:**
```json
{
  "generated_text": "in a land far away...",
  "model_used": "gpt2",
  "strategy_used": "top_p",
  "tokens_generated": 100
}
```

## Project Structure

```
backend/
├── main.py              # FastAPI server with LLM endpoints
└── requirements.txt     # Python dependencies

frontend/
├── app/llm-playground/
│   └── page.tsx        # Main UI component
└── store/api/
    └── llm.ts          # RTK Query API slice
```

## Performance

- **Model Loading**: ~15 seconds on startup (one-time)
- **Generation Speed**: 
  - CPU: 2-5 seconds for 50 tokens
  - GPU: <1 second for 50 tokens
- **Memory Usage**: ~3GB RAM (both models loaded)

## Deployment

**Backend**: Deploy to Railway or similar container platform  
**Frontend**: Deploy to Vercel or Netlify

Set `NEXT_PUBLIC_API_BASE_URL` environment variable to your backend URL.

## Troubleshooting

**Slow generation?**  
→ Normal on CPU. Reduce `max_tokens` for faster responses.

**Models not loading?**  
→ Check backend logs. First run downloads ~1.5GB of models.

**CORS errors?**  
→ Verify `NEXT_PUBLIC_API_BASE_URL` in frontend env vars.

## What This Demonstrates

- Loading and using real LLM models (GPT-2, Qwen)
- Multiple text generation strategies
- Production-ready API design
- Full-stack AI integration
- Interactive parameter tuning

## Learn More

- [OpenAI Tokenization](https://platform.openai.com/tokenizer)
- [HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [Text Generation Strategies](https://huggingface.co/blog/how-to-generate)

---

Built with ❤️ as part of AI Engineering learning journey