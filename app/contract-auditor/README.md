# Contract Auditor Feature

## Overview

The **Contract Auditor** is an AI-powered legal document analysis tool that uses **Retrieval-Augmented Generation (RAG)** to identify risks, assign severity scores, and suggest improvements for contract clauses. The system continuously learns from each analysis and user feedback, improving its accuracy over time.

## Key Features

### 🔍 **Intelligent Risk Detection**
- Identifies multiple risk types: liability, termination, payment, IP rights, confidentiality, indemnification, and more
- Assigns severity scores (1-10) to each identified risk
- Highlights specific clause locations in the contract text

### 🧠 **RAG-Powered Analysis**
- **Retrieval**: Searches knowledge base for relevant risk definitions and similar past contracts
- **Augmentation**: Injects retrieved context into Claude's analysis prompt
- **Generation**: Produces detailed, context-aware risk assessments

### 📈 **Continuous Learning**
- Automatically indexes each analyzed contract
- Integrates user feedback to refine risk definitions
- Improves pattern recognition for future analyses

### ✏️ **AI-Assisted Rewriting**
- Generates improved clause wording to mitigate identified risks
- Provides context-aware suggestions based on legal best practices

## Architecture

### Backend Components

```
backend/
├── contract_service.py      # FastAPI routes for analysis, rewriting, feedback
├── contract_logic.py         # Risk definitions, prompt building
├── contract_rag_utils.py     # RAG system (indexing, retrieval, search)
└── main.py                   # Mounts contract router at /api/contract
```

#### **contract_service.py**
FastAPI router with endpoints:
- `POST /api/contract/analyze` - Analyze contract text
- `POST /api/contract/rewrite` - Rewrite risky clauses
- `POST /api/contract/feedback` - Submit user corrections
- `GET /api/contract/stats` - Get RAG knowledge base statistics

#### **contract_logic.py**
Defines:
- `RiskType` enum (13 risk categories)
- `RiskInfo` dataclass with severity, indicators, and mitigation strategies
- `RISK_DATABASE` - Comprehensive risk pattern definitions
- Prompt building functions for Claude API

#### **contract_rag_utils.py**
Implements:
- `ContractRAG` class for knowledge base management
- `risk_index` - Pre-loaded risk definitions
- `contract_index` - Analyzed contract examples
- `search_risks()` - Keyword-based retrieval (production would use embeddings)
- `add_example()` - Index new analyses
- `get_stats()` - Return knowledge base metrics

### Frontend Components

```
app/contract-auditor/
└── page.tsx                  # Main page with upload/analysis UI

components/contract/
├── ContractUploader.tsx      # Drag & drop file upload
├── ContractViewer.tsx        # Displays contract with risk highlighting
├── RiskPanel.tsx             # Sidebar showing all identified risks
├── RiskCard.tsx              # Individual risk display with rewrite button
├── RewriteModal.tsx          # Shows AI-suggested improvements
└── RAGStats.tsx              # Educational RAG explanation component

store/
├── contractSlice.ts          # Redux state management
└── api/contractApi.ts        # RTK Query API definitions
```

## RAG System Details

### Current Implementation: Keyword Matching

For demo purposes, the system uses simple keyword-based search:

```python
def search_risks(self, query: str, top_k: int = 3):
    query_lower = query.lower()
    scored_results = []
    
    for item in self.risk_index:
        content = item["content"].lower()
        score = sum(1 for word in query_lower.split() if word in content)
        if score > 0:
            scored_results.append((score, item))
    
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [item for score, item in scored_results[:top_k]]
```

**Pros**: Fast, simple, no API costs  
**Cons**: Misses semantic similarity

### Production RAG: Vector Embeddings

Production systems would use:

1. **Text → Vectors**: Convert text to embeddings (e.g., OpenAI's `text-embedding-3`, 1536 dimensions)
2. **Vector Database**: Store in Pinecone, Weaviate, or pgvector
3. **Cosine Similarity**: Find semantically similar documents

**Example**: "liability clause" would match "indemnification provision" semantically

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

**Response**:
```json
{
  "rewritten_text": "The Company's liability shall be limited to..."
}
```

### Submit Feedback
```http
POST /api/contract/feedback
Content-Type: application/json

{
  "contract_text": "...",
  "analysis": {...},
  "user_feedback": "Missed a critical termination clause"
}
```

### Get RAG Stats
```http
GET /api/contract/stats
```

**Response**:
```json
{
  "risk_definitions": 13,
  "analyzed_contracts": 5,
  "total_documents": 18
}
```

## Risk Types

The system identifies 13 risk categories:

| Risk Type | Description | Severity Range |
|-----------|-------------|----------------|
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

## Educational UI

The `RAGStats` component provides an interactive educational experience:

### Visual Flow Diagram
- 3-step animated process (Retrieval → Augmentation → Generation)
- Color-coded cards with staggered entrance animations
- Arrow connectors showing data flow

### Continuous Learning Section
- Explains how the system improves with each contract
- Shows analysis storage, feedback integration, and pattern recognition

### Knowledge Base Dashboard
- Real-time statistics with animated progress bars
- Tracks risk definitions and analyzed contracts
- Visual indicators of system growth

### Technical Deep Dive
- Compares keyword matching vs. vector embeddings
- Explains production RAG architecture
- Shows code examples and semantic search benefits

## Usage Example

```typescript
import { useAnalyzeContractMutation } from '@/store/api/contractApi';

function MyComponent() {
  const [analyzeContract, { isLoading }] = useAnalyzeContractMutation();

  const handleAnalyze = async (contractText: string) => {
    const result = await analyzeContract({
      text: contractText,
      use_cache: true,
      use_rag: true
    }).unwrap();

    console.log('Risks found:', result.analysis.risks);
  };
}
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
PORT=8080  # Backend server port
```

## Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Frontend Setup
```bash
npm install
npm run dev
```

### Test the API
```bash
# Analyze a contract
curl -X POST http://localhost:8080/api/contract/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This agreement...", "use_rag": true}'

# Get stats
curl http://localhost:8080/api/contract/stats
```

## Future Enhancements

### Vector Embeddings
- Replace keyword matching with semantic search
- Integrate OpenAI embeddings or open-source alternatives
- Use Pinecone/Weaviate for vector storage

### Advanced Features
- Multi-document comparison
- Contract template library
- Clause library with best practices
- Export analysis reports (PDF, DOCX)
- Version tracking and change detection

### ML Improvements
- Fine-tune models on legal contract data
- Custom entity recognition for legal terms
- Automated clause extraction and categorization

## License

This is a portfolio demonstration project showcasing RAG implementation for legal document analysis.

## Credits

- **AI Model**: Anthropic Claude Sonnet 4
- **Framework**: FastAPI (backend), Next.js (frontend)
- **State Management**: Redux Toolkit with RTK Query
- **UI**: Tailwind CSS, Framer Motion
