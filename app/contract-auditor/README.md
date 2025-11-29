# Contract Auditor Feature

## Overview

The **Contract Auditor** is an AI-powered legal document analysis tool that uses **Retrieval-Augmented Generation (RAG)** with **Supabase pgvector** for semantic search. It identifies risks, assigns severity scores, and suggests improvements for contract clauses. The system continuously learns from each analysis, storing embeddings for future similarity matching.

## Key Features

### 🔍 **Intelligent Risk Detection**
- Identifies **28 risk types**: liability, termination, payment, IP rights, confidentiality, indemnification, insurance, scope creep, SLA risks, and more
- Assigns severity scores (1-10) to each identified risk
- Highlights specific clause locations in the contract text
- Provides actionable mitigation strategies for each risk

### 🧠 **Production RAG with Vector Search**
- **Supabase pgvector** for persistent vector storage and similarity search
- **OpenAI text-embedding-3-small** for 1536-dimensional embeddings
- **Cosine similarity** matching finds semantically related content
- Sub-200ms retrieval latency

### 📈 **Continuous Learning**
- Every analyzed contract is automatically embedded and indexed
- Risk patterns are learned and matched across contracts
- System improves accuracy over time with more data
- User feedback integration for refined risk definitions

### ✏️ **AI-Assisted Rewriting**
- Generates improved clause wording to mitigate identified risks
- Provides context-aware suggestions based on legal best practices
- Powered by Claude Sonnet 4

---

## Architecture

### System Flow

```
Contract Upload
       ↓
OpenAI Embeddings (text-embedding-3-small, 1536 dims)
       ↓
Supabase pgvector Similarity Search
       ↓
┌─────────────────────────────────────┐
│  Retrieved Context:                 │
│  • Matching risk definitions        │
│  • Similar past contract analyses   │
│  • Mitigation strategies            │
└─────────────────────────────────────┘
       ↓
Claude Sonnet 4 (RAG-augmented analysis)
       ↓
Risk Assessment + Recommendations
       ↓
Auto-index contract to Supabase (background task)
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Vector Database** | Supabase with pgvector extension |
| **Embeddings** | OpenAI text-embedding-3-small (1536 dimensions) |
| **LLM** | Claude Sonnet 4 via Anthropic API |
| **Backend** | FastAPI (Python) with async background tasks |
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Deployment** | Vercel (frontend) + Railway (backend) |

---

## Database Schema

### `contract_risks` Table
Stores risk definitions with vector embeddings for semantic search.

```sql
CREATE TABLE contract_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  key_indicators TEXT[] NOT NULL,
  mitigation_strategy TEXT[] NOT NULL,
  severity_range TEXT NOT NULL,
  content TEXT NOT NULL,              -- Concatenated searchable text
  embedding VECTOR(1536),             -- OpenAI embedding
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX contract_risks_embedding_idx 
ON contract_risks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### `contract_examples` Table
Stores analyzed contracts for similarity matching.

```sql
CREATE TABLE contract_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_hash TEXT NOT NULL UNIQUE,
  text_preview TEXT NOT NULL,
  risks_found TEXT[] NOT NULL,
  overall_score FLOAT,
  full_analysis JSONB NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX contract_examples_embedding_idx 
ON contract_examples USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### RPC Functions

```sql
-- Semantic search for risk definitions
CREATE FUNCTION match_contract_risks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID, risk_type TEXT, display_name TEXT, 
  description TEXT, content TEXT, similarity FLOAT, metadata JSONB
);

-- Find similar past contracts
CREATE FUNCTION match_contract_examples(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 3
) RETURNS TABLE (
  id UUID, text_preview TEXT, risks_found TEXT[], 
  overall_score FLOAT, full_analysis JSONB, similarity FLOAT
);

-- Get RAG statistics
CREATE FUNCTION get_contract_rag_stats()
RETURNS TABLE (
  risk_definitions BIGINT,
  analyzed_contracts BIGINT,
  total_documents BIGINT
);
```

---

## Backend Components

```
backend/
├── contract_service.py      # FastAPI routes for analysis, rewriting, feedback
├── contract_logic.py        # Risk definitions, prompt building
├── contract_rag_utils.py    # Supabase RAG system (embeddings, search, indexing)
└── main.py                  # Mounts contract router at /api/contract

scripts/
├── migrate-contract-rag.ts  # Migrate risk definitions to Supabase with embeddings
└── contract-rag-schema.sql  # Database schema for pgvector tables
```

### `contract_rag_utils.py`

The core RAG implementation:

```python
class ContractRAG:
    """RAG system using Supabase for persistent, shared learning."""
    
    def search_risks(self, query: str, top_k: int = 3) -> List[Dict]:
        """Semantic search for relevant risk definitions."""
        # Generate embedding for query
        query_embedding = generate_embedding(query)
        
        # Supabase pgvector similarity search
        response = supabase.rpc('match_contract_risks', {
            'query_embedding': query_embedding,
            'match_threshold': 0.3,
            'match_count': top_k
        }).execute()
        
        return response.data
    
    def add_example(self, contract_text: str, analysis: Dict):
        """Auto-index analyzed contract for future matching."""
        embedding = generate_embedding(contract_text[:500])
        
        supabase.table('contract_examples').upsert({
            'contract_hash': hash(contract_text),
            'text_preview': contract_text[:500],
            'risks_found': [r['type'] for r in analysis['risks']],
            'overall_score': analysis['overall_risk_score'],
            'full_analysis': analysis,
            'embedding': embedding
        }, on_conflict='contract_hash').execute()
```

---

## Frontend Components

```
app/contract-auditor/
└── page.tsx                  # Main page with upload/analysis UI

components/contract/
├── ContractUploader.tsx      # Drag & drop file upload
├── ContractViewer.tsx        # Displays contract with risk highlighting
├── RiskPanel.tsx             # Sidebar showing all identified risks
├── RiskCard.tsx              # Individual risk display with rewrite button
└── RAGStats.tsx              # Educational RAG explanation component
```

### RAGStats Component

Interactive educational UI explaining:
- **Visual Flow Diagram**: 3-step animated process (Retrieval → Augmentation → Generation)
- **Tech Stack**: Supabase, OpenAI, Claude, FastAPI
- **Continuous Learning**: How contracts are auto-indexed
- **Technical Deep Dive**: Vector search pipeline, database schema

---

## API Endpoints

### Analyze Contract
```http
POST /api/contract/analyze
Content-Type: application/json

{
  "text": "CONTRACT TEXT HERE",
  "use_cache": true,
  "use_rag": true
}
```

**Response**:
```json
{
  "analysis": {
    "summary": "Overall risk assessment...",
    "overall_risk_score": 7.2,
    "risks": [
      {
        "type": "liability",
        "severity": 8,
        "location": "Section 5.2",
        "explanation": "Unlimited liability exposure...",
        "suggested_fix": "Add liability cap..."
      }
    ],
    "missing_clauses": ["force_majeure", "dispute_resolution"],
    "key_dates": ["2024-12-31", "2025-06-30"]
  },
  "from_cache": false
}
```

### Rewrite Clause
```http
POST /api/contract/rewrite
Content-Type: application/json

{
  "clause_text": "The Company shall be liable for all damages.",
  "risk_type": "liability",
  "context": "Commercial services agreement"
}
```

### Get RAG Stats
```http
GET /api/contract/stats
```

**Response**:
```json
{
  "risk_definitions": 28,
  "analyzed_contracts": 15,
  "total_documents": 43
}
```

---

## Risk Types (28 Total)

### Core Risks (Original 13)
| Risk Type | Description | Severity |
|-----------|-------------|----------|
| `liability` | Unlimited or excessive liability exposure | 7-9 |
| `termination` | Unfavorable termination conditions | 6-8 |
| `payment` | Unclear or risky payment terms | 5-8 |
| `ip_rights` | Intellectual property ownership issues | 7-9 |
| `confidentiality` | Weak confidentiality protections | 6-8 |
| `indemnification` | Broad indemnification obligations | 7-9 |
| `warranties` | Excessive warranty commitments | 6-8 |
| `force_majeure` | Missing or weak force majeure clause | 5-7 |
| `dispute_resolution` | Unfavorable dispute resolution terms | 5-7 |
| `data_privacy` | Inadequate data protection provisions | 7-9 |
| `non_compete` | Overly restrictive non-compete clauses | 6-8 |
| `assignment` | Unrestricted assignment rights | 5-7 |
| `governing_law` | Unfavorable jurisdiction/governing law | 4-6 |

### Extended Risks (New 15)
| Risk Type | Description | Severity |
|-----------|-------------|----------|
| `insurance` | Inadequate insurance requirements | 5-8 |
| `scope_creep` | Unclear scope or change order provisions | 6-8 |
| `delivery_acceptance` | Vague delivery/acceptance criteria | 5-7 |
| `audit_rights` | Missing or excessive audit rights | 4-6 |
| `subcontracting` | Unrestricted subcontracting rights | 5-7 |
| `exclusivity` | Overly broad exclusivity requirements | 6-8 |
| `price_escalation` | Unlimited price increase provisions | 5-7 |
| `liquidated_damages` | Excessive liquidated damages | 7-9 |
| `service_levels` | Missing or unrealistic SLAs | 5-8 |
| `limitation_of_remedies` | Overly restricted remedies | 6-8 |
| `regulatory_compliance` | Inadequate compliance provisions | 7-9 |
| `survival` | Inadequate survival clauses | 4-6 |
| `notice` | Problematic notice requirements | 3-5 |
| `amendment` | Unilateral amendment rights | 5-7 |
| `entire_agreement` | Missing integration clause | 4-6 |

---

## Environment Variables

### Backend (Railway)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend (Vercel)
```bash
BACKEND_URL=https://your-app.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Setup & Deployment

### 1. Create Supabase Tables
```bash
# Run the schema SQL in Supabase SQL Editor
# Located at: scripts/contract-rag-schema.sql
```

### 2. Migrate Risk Definitions
```bash
npx tsx --env-file=.env.local scripts/migrate-contract-rag.ts
```

### 3. Deploy Backend to Railway
```bash
cd backend
railway up
# Add environment variables in Railway dashboard
```

### 4. Deploy Frontend to Vercel
```bash
vercel --prod
# Set BACKEND_URL to your Railway URL
```

### 5. Verify
```bash
# Check backend health
curl https://your-app.up.railway.app/health

# Check RAG stats
curl https://your-app.up.railway.app/api/contract/stats
```

---

## Cost Analysis

### Per Query Cost
| Component | Cost |
|-----------|------|
| OpenAI Embedding (query) | ~$0.00002 |
| OpenAI Embedding (index) | ~$0.00002 |
| Supabase pgvector search | Free |
| Claude Sonnet 4 analysis | ~$0.003 |
| **Total** | **~$0.003 per query** |

### Monthly Estimates
- 100 contracts: **$0.30**
- 1,000 contracts: **$3.00**
- 10,000 contracts: **$30.00**

---

## Performance

| Metric | Value |
|--------|-------|
| Vector search latency | <200ms |
| Total analysis time | 15-25s (Claude generation) |
| Embedding generation | ~100ms |
| Auto-indexing | Background (non-blocking) |

---

## Interview Talking Points

**"I built a production RAG system for legal contract analysis..."**

✅ **Architecture**: "Uses Supabase pgvector for semantic search with 1536-dimensional OpenAI embeddings and Claude Sonnet 4 for generation."

✅ **Continuous Learning**: "Every analyzed contract is automatically embedded and indexed via FastAPI background tasks, improving future similarity matching."

✅ **Scale**: "28 risk definitions with vector embeddings, sub-200ms retrieval, handles thousands of contracts."

✅ **Production Features**: "Deployed on Railway with proper environment variable management, caching, and error handling."

✅ **Unique Value**: "Demonstrates end-to-end RAG implementation: schema design, embedding pipeline, similarity search, LLM integration, and auto-learning."

---

## License

MIT License - Portfolio demonstration project showcasing RAG implementation for legal document analysis.

## Credits

- **AI Model**: Anthropic Claude Sonnet 4
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector DB**: Supabase pgvector
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion