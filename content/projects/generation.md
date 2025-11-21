# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│                     (Next.js + React)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /generation/page.tsx                                            │
│  ┌────────────────────────────────────────────┐                 │
│  │  1. User types: "The future of AI is"      │                 │
│  │     ↓ (500ms debounce)                     │                 │
│  │  2. useLazyGetProbabilitiesQuery()         │                 │
│  │     ↓                                      │                 │
│  │  3. RTK Query dispatches API call          │                 │
│  │     ↓                                      │                 │
│  │  4. Gets response with probabilities       │                 │
│  │     ↓                                      │                 │
│  │  5. D3.js renders bar chart                │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↕                                       │
│                                                                   │
│  store/api/generation.ts                                         │
│  ┌────────────────────────────────────────────┐                 │
│  │  - TypeScript types                        │                 │
│  │  - RTK Query endpoints                     │                 │
│  │  - Caching (5 min TTL)                     │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↕                                       │
└─────────────────────────────────────────────────────────────────┘
                           ↕
                   HTTP POST Request
                           ↕
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                     (FastAPI + PyTorch)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/generation/probabilities                              │
│  ┌────────────────────────────────────────────┐                 │
│  │  Request:                                  │                 │
│  │  {                                         │                 │
│  │    "prompt": "The future of AI is",       │                 │
│  │    "top_k": 10                             │                 │
│  │  }                                         │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  1. Tokenize prompt                        │                 │
│  │     GPT-2 tokenizer                        │                 │
│  │     "The future of AI is" → [464, 2003,…]  │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  2. Forward pass through GPT-2             │                 │
│  │     model(**inputs) → logits               │                 │
│  │     Shape: [1, seq_len, 50257]             │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  3. Extract next token logits              │                 │
│  │     logits[0, -1, :] (last position)       │                 │
│  │     Shape: [50257] (all vocab)             │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  4. Softmax to get probabilities           │                 │
│  │     probabilities = softmax(logits)        │                 │
│  │     [0.15, 0.12, 0.10, ...]                │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  5. Get top-k tokens                       │                 │
│  │     torch.topk(probabilities, k=10)        │                 │
│  │     Returns indices & probabilities        │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  6. Decode tokens & format response        │                 │
│  │     [6016] → " bright" (15.2%)             │                 │
│  │     [1016] → " going" (12.4%)              │                 │
│  │     ...                                    │                 │
│  └────────────────────────────────────────────┘                 │
│                          ↓                                       │
│  ┌────────────────────────────────────────────┐                 │
│  │  Response:                                 │                 │
│  │  {                                         │                 │
│  │    "prompt": "The future of AI is",       │                 │
│  │    "top_tokens": [                         │                 │
│  │      {"token": " bright", ...},            │                 │
│  │      {"token": " going", ...}              │                 │
│  │    ],                                      │                 │
│  │    "total_tokens_considered": 50257        │                 │
│  │  }                                         │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request Flow
```
User Input
   ↓
Debounce (500ms)
   ↓
RTK Query (POST /api/generation/probabilities)
   ↓
FastAPI Endpoint
   ↓
GPT-2 Model (forward pass)
   ↓
Softmax (probabilities)
   ↓
Top-k Selection
   ↓
JSON Response
   ↓
RTK Query Cache
   ↓
React State Update
   ↓
D3.js Re-render
```

### Data Transformation
```
"The future of AI is"
   ↓ (tokenize)
[464, 2003, 286, 9552, 318]
   ↓ (model forward)
logits: Tensor[50257]
   ↓ (softmax)
probabilities: [0.15, 0.12, 0.10, ...]
   ↓ (top-k)
top_indices: [6016, 1016, 407, ...]
top_probs: [0.15, 0.12, 0.10, ...]
   ↓ (decode + format)
[
  {token: " bright", probability: 0.15},
  {token: " going", probability: 0.12},
  ...
]
```

---

## Component Structure

### Backend (`main.py`)
```
FastAPI App
├── CORS Middleware
├── Tokenizer Initialization (tiktoken)
├── GPT-2 Initialization (PyTorch)
├── Routes
│   ├── GET  /
│   ├── GET  /health
│   ├── GET  /api/tokenizers
│   ├── POST /api/tokenize
│   └── POST /api/generation/probabilities ← NEW
└── Models (Pydantic)
    ├── TokenizeRequest
    ├── TokenizerResult
    ├── ProbabilityRequest ← NEW
    ├── TokenProbability ← NEW
    └── ProbabilityResponse ← NEW
```

### Frontend Store
```
Redux Store
├── tokenizerApi
│   ├── getTokenizers
│   └── tokenize
└── generationApi ← NEW
    └── getProbabilities
```

### Frontend Page (`/generation`)
```
GenerationPage
├── State
│   ├── prompt (input text)
│   └── debouncedPrompt
├── API Hooks
│   └── useLazyGetProbabilitiesQuery
├── Effects
│   ├── Debounce input → debouncedPrompt
│   ├── Trigger API on debounce
│   └── D3.js visualization on data change
└── UI
    ├── Header
    ├── Input (with loading state)
    ├── SVG Chart (D3.js)
    └── Stats Cards
```

---

## Technology Stack

### Backend
- **FastAPI**: Web framework
- **PyTorch**: Deep learning framework
- **Transformers**: Hugging Face library
- **tiktoken**: Tokenization (for tokenizer feature)
- **Pydantic**: Data validation

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **RTK Query**: API state management
- **D3.js**: Data visualization
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling

---

## Performance Characteristics

### Backend
```
Model Loading:     5-10s (one-time on startup)
Memory Usage:      ~500MB (GPT-2)
First Request:     ~500ms (model warming)
Cached Request:    ~50ms
Regular Request:   200-300ms
Concurrent Limit:  10 requests
```

### Frontend
```
Debounce Delay:    500ms
API Call:          200-500ms (backend dependent)
D3 Render:         ~50ms
Cache TTL:         5 minutes
Total UX Latency:  700-1000ms (feels instant)
```

---

## Scaling Considerations

### Current (Railway Free Tier)
- ✅ Single instance
- ✅ CPU inference
- ✅ ~500ms response time
- ✅ Good for demo/portfolio

### Future (If Needed)
- 🚀 GPU instance (10-50x faster)
- 🚀 Model quantization (smaller memory)
- 🚀 Redis caching (faster repeated queries)
- 🚀 Load balancing (multiple instances)

---

## Error Handling

### Backend
```python
try:
    # Get probabilities
except HTTPException:
    # Return 400/503/500 with detail
except Exception:
    # Return 500 with error message
```

### Frontend
```typescript
const { data, error, isFetching } = useQuery();

if (error) return <ErrorMessage />
if (isFetching) return <LoadingSpinner />
if (data) return <Visualization />
```

---

## Security

### CORS
- Configured for localhost:3000
- Regex pattern for Vercel preview branches
- Specific origin for production

### Input Validation
- Max prompt length: 500 chars
- Top-k range: 5-50
- Pydantic validation on all inputs

### Rate Limiting
- Current: None (dev/demo)
- Future: Can add per-IP limits if needed

---

## Deployment

### Local Development
```
Backend:  localhost:8080
Frontend: localhost:3000
```

### Production (Railway + Vercel)
```
Backend:  https://ai-portfolio-production-7eb9.up.railway.app
Frontend: https://ai-portfolio-psi-lyart.vercel.app
```

---

## Next Iteration Hooks

The current architecture makes it easy to add:

1. **Multiple strategies**: Just return selection info for each
2. **Step-by-step generation**: Add state parameter, return sequence
3. **Interactive controls**: Add temperature, top_k, top_p params
4. **Beam search viz**: Return beam tree structure
5. **3D visualization**: Same data, different D3/three.js renderer

All extensions build on the same endpoint pattern!