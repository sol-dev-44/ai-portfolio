# SnapFix Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI - Vision analysis, embeddings, estimation
OPENAI_API_KEY=sk-...

# Anthropic - Claude synthesis
ANTHROPIC_API_KEY=sk-ant-...

# You.com - Web search
YOU_API_KEY=...

# Supabase - RAG knowledge base (existing)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Running SnapFix

```bash
# Start both frontend and backend
npm run dev:all

# Then navigate to: http://localhost:3000/snapfix
```

## API Keys You Need

1. **OpenAI**: Used for 3 things
   - GPT-4o vision analysis
   - text-embedding-3-small for RAG
   - GPT-4o-mini for cost estimation

2. **Anthropic**: Claude Sonnet 4 for synthesis

3. **You.com**: Web search for current repair info

All APIs have graceful fallbacks if keys are missing (except vision analysis which is required).
