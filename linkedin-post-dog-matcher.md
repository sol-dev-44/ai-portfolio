🐕 **I built a dog breed matcher using the same tech stack as ChatGPT and Perplexity**

Take a 10-question quiz → Get matched with ideal breeds using semantic search and embeddings.

**The Stack:**
- OpenAI Embeddings (text-embedding-3-small)
- Supabase + pgvector for vector similarity search
- FastAPI backend + Next.js frontend
- 283 breeds scraped and embedded

**The Cool Part:**

Instead of "if age > 5 AND space = large → show Labs", this uses **semantic understanding**.

```
User: "Active couple in apartment, first dog"
Embedding: [0.234, -0.891, 0.445, ...] (1536 dimensions)
Match: Cavalier King Charles Spaniel (92%)
Reason: ✓ Apartment-friendly ✓ Trainable ✓ Moderate energy
```

**3 Technical Wins:**

1️⃣ **Smart Scraping** - Keyword analyzer extracts temperament from descriptions
   - "energetic and playful" → High Energy
   - "great with children" → Good With Kids

2️⃣ **Explainable AI** - Every match has human-readable reasons, not just a score

3️⃣ **Beautiful Fallbacks** - Only 67/283 breeds had photos, so I created color-coded gradient placeholders with breed initials

**Performance:**
- Scraping: 5-10 min for 283 breeds
- Match query: <200ms with pgvector
- Cost: $0.00002 per match

This isn't just about dogs - it's a blueprint for semantic search systems (product recs, content matching, hiring, etc.)

**Try it:** [your-domain.com/dog-matcher]

What would you build with RAG + embeddings? 💭

---

#AI #MachineLearning #RAG #SemanticSearch #WebDev #NextJS #Python #OpenAI #VectorDatabase

