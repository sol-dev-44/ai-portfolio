# 🐕 Pawfect Match

**AI-Powered Dog Breed Discovery** — A production-grade RAG application demonstrating semantic search, vector embeddings, and AI-powered interactions.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-green?logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings-412991?logo=openai)
![Claude](https://img.shields.io/badge/Claude-Sonnet_4-orange?logo=anthropic)

---

## ✨ Features

### 🎯 Find My Match
Take a 10-question quiz about your lifestyle, and our AI matches you with ideal breeds using **semantic search**.

- Converts answers to natural language profile
- Generates 1536-dimensional embedding via OpenAI
- Cosine similarity search against 283+ breed embeddings
- Returns top 5 matches with explainable reasoning

### 🔍 Explore Breeds
Browse and filter the complete breed database with real-time search.

- Filter by size, energy level, kid-friendliness, apartment suitability
- Lazy-loaded images with gradient fallbacks
- Click to add breeds to comparison or start a chat

### 📊 Compare Breeds
Side-by-side comparison with interactive D3.js radar charts.

- Visual trait comparison (energy, grooming, trainability, etc.)
- Up to 4 breeds with color-coded overlays
- Detailed attribute cards

### 💬 Chat with a Breed
Have a conversation with any breed! AI assumes the dog's personality.

- Claude API with breed-specific system prompts
- Personality derived from temperament attributes
- Action parsing for immersive responses (*wags tail*)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAWFECT MATCH                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   Quiz   │───▶│  Profile │───▶│ Embedding│───▶│ pgvector │  │
│  │ Answers  │    │   Text   │    │  (1536d) │    │  Search  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                       │         │
│                                                       ▼         │
│                                              ┌──────────────┐   │
│                                              │  Top 5       │   │
│                                              │  Matches +   │   │
│                                              │  Reasoning   │   │
│                                              └──────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Pipeline

1. **Data Scraping** — Async scraping from dogapi.dog (283 breeds) + dog.ceo (images)
2. **Attribute Inference** — NLP extracts traits: "energetic" → High Energy
3. **Embedding Generation** — Rich breed profiles → 1536-dim vectors via OpenAI
4. **Vector Storage** — Supabase pgvector with IVFFlat index

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Animation** | Framer Motion | Smooth transitions |
| **Charts** | D3.js | Radar chart visualization |
| **Backend** | FastAPI (Python) | API endpoints |
| **Database** | Supabase (PostgreSQL) | Data storage |
| **Vector Search** | pgvector | Similarity search |
| **Embeddings** | OpenAI text-embedding-3-small | 1536-dim vectors |
| **LLM** | Claude Sonnet 4 | Chat conversations |

---

## 📁 Project Structure

```
app/dog-matcher/
├── page.tsx                 # Main page with feature routing
├── layout.tsx               # Metadata and layout wrapper
├── README.md                # This file
├── api/
│   └── breed-chat/
│       └── route.ts         # Claude chat API endpoint
└── components/
    ├── QuizFeature.tsx      # Quiz wrapper with intro
    ├── Quiz.tsx             # 10-question quiz component
    ├── MatchResults.tsx     # Display matched breeds
    ├── BreedExplorer.tsx    # Browse/filter all breeds
    ├── BreedComparison.tsx  # Side-by-side + radar chart
    ├── BreedChat.tsx        # AI chat interface
    └── TechnicalGuide.tsx   # Embedded tech explanation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+ (for backend)
- Supabase account
- OpenAI API key
- Anthropic API key

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Installation

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python main.py
```

### Database Setup

Run the schema in Supabase SQL Editor:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Breeds table
create table dog_breeds (
  breed_id text primary key,
  name text not null,
  description text,
  size_category text,
  breed_group text,
  energy_level text,
  exercise_needs text,
  grooming_needs text,
  shedding_level text,
  trainability text,
  temperament text[],
  apartment_friendly boolean,
  good_with_kids boolean,
  good_with_pets boolean,
  hypoallergenic boolean,
  image_urls text[],
  profile_text text,
  embedding vector(1536)
);

-- Similarity search function
create or replace function match_dog_breeds(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  breed_id text,
  name text,
  description text,
  similarity float,
  -- ... other columns
)
language plpgsql
as $$
begin
  return query
  select
    d.*,
    1 - (d.embedding <=> query_embedding) as similarity
  from dog_breeds d
  where d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## 🎨 Key Implementation Details

### Semantic Matching

Traditional pet matchers use **rule-based filters**. Pawfect Match uses **semantic similarity**:

```python
# Convert quiz answers to natural language
profile = "Lives in apartment, moderately active, first-time owner..."

# Generate embedding
embedding = openai.embeddings.create(
    model="text-embedding-3-small",
    input=profile
)

# Vector similarity search
matches = supabase.rpc('match_dog_breeds', {
    'query_embedding': embedding,
    'match_count': 5
})
```

### Match Reasoning

Each match includes human-readable explanations:

- ✅ "Perfect small size match"
- ✅ "Apartment-friendly breed"
- ✅ "High energy matches your lifestyle"
- ✅ "Great with children"

### Chat Personality

The chat feature generates dynamic system prompts:

```typescript
const systemPrompt = `You are a ${breed.name}! 
Personality: ${breed.temperament.join(', ')}
Energy: ${breed.energy_level}
Express yourself through actions like *wags tail* or *tilts head*`;
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Breed Database | 283 breeds |
| Embedding Dimensions | 1,536 |
| Search Latency | <200ms |
| Quiz Questions | 10 |
| Match Results | Top 5 |

---

## 🎯 Portfolio Highlights

This project demonstrates:

1. **RAG Architecture** — Real production pattern used by Perplexity, ChatGPT
2. **Vector Databases** — pgvector for scalable similarity search
3. **Embedding Generation** — OpenAI's latest embedding model
4. **Full-Stack TypeScript** — Next.js 14 with App Router
5. **Python Backend** — FastAPI for ML/AI operations
6. **Data Visualization** — D3.js radar charts
7. **AI Integration** — Claude API with custom personas
8. **Responsive Design** — Mobile-first Tailwind CSS

---

## 🔮 Future Enhancements

- [ ] Breed detail modal with full information
- [ ] Image carousel for each breed
- [ ] Save/email results
- [ ] Social sharing
- [ ] User accounts & favorites
- [ ] Breeder/shelter integration

---

## 📄 License

MIT License — Feel free to use this for your own portfolio!

---

## 🙏 Credits

**Data Sources:**
- [dogapi.dog](https://dogapi.dog) — Comprehensive breed data
- [dog.ceo](https://dog.ceo) — Breed images

**Technologies:**
- OpenAI Embeddings
- Anthropic Claude
- Supabase pgvector
- Framer Motion
- D3.js