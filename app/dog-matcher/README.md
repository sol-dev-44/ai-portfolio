# 🐕 Dog Breed Matcher

An AI-powered dog breed recommendation system using RAG (Retrieval-Augmented Generation) with embeddings and semantic search.

## Overview

This feature helps users find their perfect dog breed match by:
1. **Taking an interactive quiz** about lifestyle, preferences, and living situation
2. **Converting answers to embeddings** using OpenAI's text-embedding-3-small model
3. **Semantic search** across 300+ dog breeds using Supabase pgvector
4. **Personalized matching** with detailed reasoning for each match

## Architecture

### Data Pipeline
```
dogapi.dog → Scraper → Attribute Inference → Supabase
dog.ceo    →         → Breed Profiles     → Embeddings (1536d)
```

### Matching Pipeline
```
Quiz Answers → Profile Text → Embedding → Semantic Search → Top 5 Matches
                                                          → Match Reasoning
```

## Tech Stack

**Backend:**
- FastAPI endpoints (`dog_matcher_service.py`)
- OpenAI embeddings API
- Supabase + pgvector for vector storage
- Async data scraping (aiohttp)

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Framer Motion for animations
- Tailwind CSS for styling

**Database:**
- Supabase (PostgreSQL with pgvector extension)
- Tables: `dog_breeds`, `user_matches`
- RPC functions: `match_dog_breeds()`, `get_dog_matcher_stats()`

## Setup

### 1. Run Supabase Schema

```bash
# In Supabase SQL Editor, run:
cat supabase/dog-matcher-schema.sql
```

### 2. Scrape Breed Data

```bash
cd backend
./venv/bin/python ../scripts/scrape-dog-data.py
```

This will:
- Fetch 300+ breeds from dogapi.dog
- Get images from dog.ceo
- Infer behavioral attributes from descriptions
- Generate embeddings
- Upload to Supabase

### 3. Start Backend

```bash
cd backend
./venv/bin/python main.py
```

The `/api/dog-matcher` endpoints will be available.

### 4. Start Frontend

```bash
npm run dev
```

Visit `http://localhost:3000/dog-matcher`

## API Endpoints

### GET `/api/dog-matcher/breeds`
Returns all available breeds with attributes.

### POST `/api/dog-matcher/match`
```json
{
  "quiz_answers": {
    "living_situation": "apartment",
    "activity_level": "moderate",
    "experience": "first-time",
    "size_preference": "small",
    "exercise_commitment": "30-60min",
    "grooming_tolerance": "moderate",
    "shedding_tolerance": "minimal",
    "family_situation": "couple",
    "temperament_preference": ["calm", "friendly"],
    "training_commitment": "moderate"
  },
  "top_k": 5
}
```

Returns top matches with similarity scores and reasoning.

### GET `/api/dog-matcher/stats`
Returns matcher statistics (total breeds, matches performed, etc.)

## Features

### Quiz Component (`Quiz.tsx`)
- 10 progressive questions with emoji-rich UI
- Multi-step form with progress tracking
- Smooth framer-motion transitions
- Support for multi-select (temperament)
- Previous/Next navigation

### Match Results (`MatchResults.tsx`)
- Animated breed cards with images
- Match score badges
- Detailed match reasoning
- Quick stats (energy, grooming, shedding, etc.)
- Temperament tags

### Attribute Inference
The scraper intelligently infers attributes from breed descriptions:
- **Energy Level**: Keywords like "energetic", "calm", "active"
- **Temperament**: "intelligent", "loyal", "friendly", "protective"
- **Exercise Needs**: "high exercise", "low exercise"
- **Living Requirements**: "apartment", "space", "family"

### Match Reasoning
Generates human-readable reasons for each match:
- Size preferences
- Apartment compatibility
- Family situation (kids, pets)
- Energy level alignment
- Grooming/shedding tolerance
- Temperament overlap
- First-time owner friendliness

## Database Schema

### `dog_breeds` Table
- Physical attributes (size, weight, lifespan)
- Behavioral traits (energy, exercise, trainability)
- Living requirements (apartment, kids, pets)
- Grooming info (needs, shedding, hypoallergenic)
- Images array
- Profile text + embedding (1536 dimensions)

### `user_matches` Table
- Session tracking
- Quiz answers (JSONB)
- User profile embedding
- Top matches results
- Analytics

## Example Matches

### First-Time Owner in Apartment
**Input:**
- Apartment living
- Moderate activity
- First-time owner
- Small dog preferred

**Top Match:** Cavalier King Charles Spaniel
- Calm temperament
- Apartment-friendly
- Highly trainable
- Minimal shedding

### Active Family with Kids
**Input:**
- House with yard
- Very active lifestyle
- Young children
- Large dog OK

**Top Match:** Golden Retriever
- High energy matches lifestyle
- Great with kids
- Friendly temperament
- Moderate grooming needs

## Performance

- **Scraping**: ~5-10 minutes for 300+ breeds
- **Embedding Generation**: ~2-3 minutes total
- **Match Query**: <200ms (pgvector similarity search)
- **Frontend Load**: Optimized with Next.js static optimization

## Future Enhancements

- [ ] Breed detail modal with full info
- [ ] AI-generated personalized explanations (Claude)
- [ ] Image carousel for each breed
- [ ] Comparison view (side-by-side matches)
- [ ] "Why not?" explanations for lower matches
- [ ] Save results / email results
- [ ] Social sharing
- [ ] Admin dashboard for breed data management

## Credits

**Data Sources:**
- [dogapi.dog](https://dogapi.dog) - Comprehensive breed data
- [dog.ceo](https://dog.ceo) - Breed images

**Technologies:**
- OpenAI Embeddings
- Supabase pgvector
- Framer Motion
- Next.js & FastAPI
