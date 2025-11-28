# lsat_service.py - Comprehensive LSAT Service with Caching & RAG
# Run with: uvicorn lsat_service:app --reload --port 8001

import os
import json
import hashlib
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import httpx

# Optional imports - will gracefully degrade
try:
    from datasets import load_dataset
    HAS_DATASETS = True
except ImportError:
    HAS_DATASETS = False
    print("⚠️ datasets not installed. Install with: pip install datasets")

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

# =============================================================================
# CONFIGURATION
# =============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CACHE_DIR = Path("./lsat_cache")
PATTERN_CACHE_DIR = CACHE_DIR / "patterns"
QUESTION_CACHE_DIR = CACHE_DIR / "questions"
RAG_INDEX_DIR = CACHE_DIR / "rag_index"

# Ensure cache directories exist
CACHE_DIR.mkdir(exist_ok=True)
PATTERN_CACHE_DIR.mkdir(exist_ok=True)
QUESTION_CACHE_DIR.mkdir(exist_ok=True)
RAG_INDEX_DIR.mkdir(exist_ok=True)

# =============================================================================
# PATTERN TAXONOMY
# =============================================================================

class PatternType(str, Enum):
    # Analytical Reasoning (Logic Games)
    SEQUENCING = "sequencing"
    GROUPING = "grouping"
    MATCHING = "matching"
    HYBRID = "hybrid"
    
    # Logical Reasoning
    STRENGTHEN = "strengthen"
    WEAKEN = "weaken"
    ASSUMPTION = "assumption"
    INFERENCE = "inference"
    FLAW = "flaw"
    PARALLEL = "parallel"
    PRINCIPLE = "principle"
    RESOLVE = "resolve"
    EVALUATE = "evaluate"
    
    # Reading Comprehension
    MAIN_IDEA = "main_idea"
    DETAIL = "detail"
    INFERENCE_RC = "inference_rc"
    STRUCTURE = "structure"
    ATTITUDE = "attitude"

@dataclass
class PatternInfo:
    """Metadata about a logical pattern type."""
    type: PatternType
    display_name: str
    description: str
    key_indicators: List[str]
    common_traps: List[str]
    solving_strategy: List[str]
    difficulty_factors: List[str]

# Comprehensive pattern database
PATTERN_DATABASE: Dict[PatternType, PatternInfo] = {
    PatternType.SEQUENCING: PatternInfo(
        type=PatternType.SEQUENCING,
        display_name="Sequencing",
        description="Arranging elements in order (linear, circular, or branched)",
        key_indicators=[
            "before/after relationships",
            "first/last constraints",
            "adjacent/not adjacent rules",
            "numbered positions"
        ],
        common_traps=[
            "Confusing 'immediately before' with 'somewhere before'",
            "Missing transitive relationships",
            "Forgetting bidirectional constraints"
        ],
        solving_strategy=[
            "Create a number line or slots",
            "Place elements with most constraints first",
            "Use deductions to eliminate possibilities",
            "Check each answer against ALL rules"
        ],
        difficulty_factors=[
            "Number of elements",
            "Conditional rules (if X then Y)",
            "Negative constraints"
        ]
    ),
    PatternType.GROUPING: PatternInfo(
        type=PatternType.GROUPING,
        display_name="Grouping",
        description="Distributing elements into categories or teams",
        key_indicators=[
            "selecting from a larger pool",
            "dividing into groups/teams",
            "in/out scenarios",
            "category assignments"
        ],
        common_traps=[
            "Not tracking group size limits",
            "Missing contrapositive of conditional rules",
            "Overlooking mutual exclusivity"
        ],
        solving_strategy=[
            "Draw group containers",
            "Track 'must be in' and 'cannot be in'",
            "Apply contrapositives immediately",
            "Look for numerical deductions"
        ],
        difficulty_factors=[
            "Variable group sizes",
            "Multiple selection rounds",
            "Nested conditions"
        ]
    ),
    PatternType.ASSUMPTION: PatternInfo(
        type=PatternType.ASSUMPTION,
        display_name="Necessary Assumption",
        description="Finding the unstated premise required for the argument to hold",
        key_indicators=[
            "assumes which of the following",
            "depends on assuming",
            "relies on the assumption"
        ],
        common_traps=[
            "Confusing necessary vs sufficient assumptions",
            "Picking answers that strengthen but aren't required",
            "Overlooking scope shifts between premise and conclusion"
        ],
        solving_strategy=[
            "Identify conclusion and premises",
            "Find the logical gap",
            "Use negation test: if negating breaks argument, it's necessary",
            "Check if answer is REQUIRED, not just helpful"
        ],
        difficulty_factors=[
            "Abstract language",
            "Multiple gaps in reasoning",
            "Subtle scope changes"
        ]
    ),
    PatternType.STRENGTHEN: PatternInfo(
        type=PatternType.STRENGTHEN,
        display_name="Strengthen",
        description="Finding information that supports or bolsters the argument",
        key_indicators=[
            "most strengthens",
            "provides support for",
            "adds credibility to"
        ],
        common_traps=[
            "Picking answers that merely repeat the conclusion",
            "Confusing relevant background with actual support",
            "Ignoring the specific conclusion"
        ],
        solving_strategy=[
            "Identify the exact conclusion",
            "Find the evidence-to-conclusion gap",
            "Look for answer that bridges this gap",
            "Eliminate answers that are irrelevant or weakening"
        ],
        difficulty_factors=[
            "Causal arguments",
            "Statistical reasoning",
            "Analogical arguments"
        ]
    ),
    PatternType.WEAKEN: PatternInfo(
        type=PatternType.WEAKEN,
        display_name="Weaken",
        description="Finding information that undermines or casts doubt on the argument",
        key_indicators=[
            "most weakens",
            "calls into question",
            "undermines",
            "casts doubt on"
        ],
        common_traps=[
            "Attacking premises instead of argument structure",
            "Picking extreme answers that go too far",
            "Missing the specific claim being weakened"
        ],
        solving_strategy=[
            "Identify the conclusion precisely",
            "Find the reasoning link to attack",
            "Look for alternative explanations or counterexamples",
            "Answer should make conclusion less likely, not impossible"
        ],
        difficulty_factors=[
            "Causal claims",
            "Correlation vs causation",
            "Representative samples"
        ]
    ),
    PatternType.INFERENCE: PatternInfo(
        type=PatternType.INFERENCE,
        display_name="Inference",
        description="Drawing a conclusion that must be true based on the given information",
        key_indicators=[
            "must be true",
            "can be properly inferred",
            "follows logically",
            "supported by the passage"
        ],
        common_traps=[
            "Going beyond what's stated",
            "Confusing 'could be true' with 'must be true'",
            "Making unwarranted assumptions"
        ],
        solving_strategy=[
            "Treat stimulus as 100% true",
            "Look for answer provable from given info alone",
            "Eliminate answers with unsupported claims",
            "Correct answer is often modest/narrow"
        ],
        difficulty_factors=[
            "Multiple premises to combine",
            "Conditional logic chains",
            "Quantifier precision"
        ]
    ),
    PatternType.FLAW: PatternInfo(
        type=PatternType.FLAW,
        display_name="Flaw",
        description="Identifying the reasoning error in an argument",
        key_indicators=[
            "vulnerable to criticism",
            "flaw in reasoning",
            "questionable because",
            "error in the argument"
        ],
        common_traps=[
            "Picking a general flaw that doesn't match this specific argument",
            "Confusing the conclusion with the flaw",
            "Overlooking subtle logical leaps"
        ],
        solving_strategy=[
            "Identify conclusion and premises",
            "Find the gap or jump in logic",
            "Match to common flaw types",
            "Answer should describe THIS argument's specific error"
        ],
        difficulty_factors=[
            "Abstract flaw descriptions",
            "Multiple potential flaws",
            "Disguised premises"
        ]
    ),
    PatternType.PARALLEL: PatternInfo(
        type=PatternType.PARALLEL,
        display_name="Parallel Reasoning",
        description="Finding an argument with the same logical structure",
        key_indicators=[
            "parallel to",
            "similar pattern of reasoning",
            "analogous to"
        ],
        common_traps=[
            "Matching topic instead of structure",
            "Missing subtle structural differences",
            "Confusing similar conclusions with similar reasoning"
        ],
        solving_strategy=[
            "Abstract the original argument to its logical form",
            "Count premises, identify conclusion type",
            "Match structure, not content",
            "Check validity: if original is flawed, match must be flawed same way"
        ],
        difficulty_factors=[
            "Complex argument structures",
            "Multiple conditional statements",
            "Distracting content"
        ]
    ),
}

# =============================================================================
# CACHE SYSTEM
# =============================================================================

class CacheManager:
    """Handles caching of questions, analyses, and patterns."""
    
    @staticmethod
    def get_cache_key(data: Dict[str, Any]) -> str:
        """Generate a unique cache key from data."""
        serialized = json.dumps(data, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()[:16]
    
    @staticmethod
    def save_to_cache(cache_dir: Path, key: str, data: Dict[str, Any]) -> None:
        """Save data to cache."""
        cache_file = cache_dir / f"{key}.json"
        with open(cache_file, 'w') as f:
            json.dump({
                "cached_at": datetime.now().isoformat(),
                "data": data
            }, f, indent=2)
    
    @staticmethod
    def load_from_cache(cache_dir: Path, key: str) -> Optional[Dict[str, Any]]:
        """Load data from cache if exists."""
        cache_file = cache_dir / f"{key}.json"
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                cached = json.load(f)
                return cached.get("data")
        return None
    
    @staticmethod
    def list_cached_items(cache_dir: Path) -> List[Dict[str, Any]]:
        """List all cached items with metadata."""
        items = []
        for cache_file in cache_dir.glob("*.json"):
            with open(cache_file, 'r') as f:
                cached = json.load(f)
                items.append({
                    "key": cache_file.stem,
                    "cached_at": cached.get("cached_at"),
                    "preview": str(cached.get("data", {}))[:100]
                })
        return items

cache = CacheManager()

# =============================================================================
# RAG SYSTEM
# =============================================================================

class PatternRAG:
    """RAG system for retrieving relevant patterns and examples."""
    
    def __init__(self):
        self.pattern_index: List[Dict[str, Any]] = []
        self.example_index: List[Dict[str, Any]] = []
        self._load_indices()
    
    def _load_indices(self):
        """Load existing indices from disk."""
        pattern_index_file = RAG_INDEX_DIR / "patterns.json"
        example_index_file = RAG_INDEX_DIR / "examples.json"
        
        if pattern_index_file.exists():
            with open(pattern_index_file, 'r') as f:
                self.pattern_index = json.load(f)
        else:
            # Initialize with pattern database
            self._build_pattern_index()
        
        if example_index_file.exists():
            with open(example_index_file, 'r') as f:
                self.example_index = json.load(f)
    
    def _build_pattern_index(self):
        """Build initial pattern index from pattern database."""
        for pattern_type, info in PATTERN_DATABASE.items():
            self.pattern_index.append({
                "id": pattern_type.value,
                "type": "pattern_definition",
                "content": f"{info.display_name}: {info.description}. " +
                          f"Key indicators: {', '.join(info.key_indicators)}. " +
                          f"Strategy: {' '.join(info.solving_strategy)}",
                "metadata": asdict(info)
            })
        self._save_indices()
    
    def _save_indices(self):
        """Save indices to disk."""
        with open(RAG_INDEX_DIR / "patterns.json", 'w') as f:
            json.dump(self.pattern_index, f, indent=2)
        with open(RAG_INDEX_DIR / "examples.json", 'w') as f:
            json.dump(self.example_index, f, indent=2)
    
    def add_example(self, question: Dict[str, Any], analysis: Dict[str, Any]):
        """Add a analyzed question to the example index."""
        example_entry = {
            "id": cache.get_cache_key(question),
            "type": "analyzed_example",
            "question_text": question.get("question", ""),
            "context_preview": question.get("context", "")[:200],
            "pattern_type": analysis.get("pattern_type", "unknown"),
            "breakdown_preview": analysis.get("breakdown", "")[:300],
            "full_analysis": analysis,
            "question_data": question
        }
        
        # Avoid duplicates
        existing_ids = {e["id"] for e in self.example_index}
        if example_entry["id"] not in existing_ids:
            self.example_index.append(example_entry)
            self._save_indices()
    
    def search_patterns(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant patterns based on query keywords."""
        query_lower = query.lower()
        scored_results = []
        
        for item in self.pattern_index:
            content = item["content"].lower()
            # Simple keyword matching (replace with embeddings for production)
            score = sum(1 for word in query_lower.split() if word in content)
            if score > 0:
                scored_results.append((score, item))
        
        # Sort by score and return top_k
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored_results[:top_k]]
    
    def search_examples(self, pattern_type: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Find similar examples by pattern type."""
        matching = [
            e for e in self.example_index 
            if e.get("pattern_type", "").lower() == pattern_type.lower()
        ]
        return matching[:top_k]
    
    def get_context_for_analysis(self, question: Dict[str, Any]) -> str:
        """Build RAG context for analyzing a question."""
        question_text = question.get("question", "") + " " + question.get("context", "")
        
        # Find relevant patterns
        relevant_patterns = self.search_patterns(question_text, top_k=3)
        
        context_parts = ["## Relevant Pattern Information\n"]
        
        for pattern in relevant_patterns:
            metadata = pattern.get("metadata", {})
            context_parts.append(f"### {metadata.get('display_name', 'Pattern')}")
            context_parts.append(f"**Description:** {metadata.get('description', '')}")
            context_parts.append(f"**Key Indicators:** {', '.join(metadata.get('key_indicators', []))}")
            context_parts.append(f"**Solving Strategy:**")
            for step in metadata.get('solving_strategy', []):
                context_parts.append(f"  - {step}")
            context_parts.append(f"**Common Traps:** {', '.join(metadata.get('common_traps', []))}")
            context_parts.append("")
        
        return "\n".join(context_parts)

# Initialize RAG
rag = PatternRAG()

# =============================================================================
# LLM INTEGRATION
# =============================================================================

async def call_claude_streaming(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 2000,
    temperature: float = 0.3
):
    """Stream responses from Claude API."""
    if not ANTHROPIC_API_KEY:
        yield json.dumps({"type": "error", "content": "ANTHROPIC_API_KEY not configured"}) + "\n"
        return
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                    "stream": True
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_text = response.text
                yield json.dumps({"type": "error", "content": f"API error: {response.status_code}"}) + "\n"
                return
            
            # Stream SSE response
            full_text = ""
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        if data.get("type") == "content_block_delta":
                            delta = data.get("delta", {})
                            if delta.get("type") == "text_delta":
                                text = delta.get("text", "")
                                full_text += text
                                yield json.dumps({"type": "text", "content": text}) + "\n"
                    except json.JSONDecodeError:
                        continue
            
            yield json.dumps({"type": "complete", "full_text": full_text}) + "\n"
            
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

async def call_claude_sync(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 2000,
    temperature: float = 0.3
) -> Dict[str, Any]:
    """Non-streaming Claude call for caching."""
    if not ANTHROPIC_API_KEY:
        return {"error": "ANTHROPIC_API_KEY not configured"}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}]
                }
            )
            
            if response.status_code != 200:
                return {"error": f"API error: {response.status_code}"}
            
            data = response.json()
            content = data.get("content", [])
            text = "".join(block.get("text", "") for block in content if block.get("type") == "text")
            return {"text": text, "usage": data.get("usage", {})}
            
        except Exception as e:
            return {"error": str(e)}

# =============================================================================
# ANALYSIS ENGINE
# =============================================================================

def build_analysis_prompt(question: Dict[str, Any], rag_context: str) -> tuple[str, str]:
    """Build system and user prompts for analysis."""
    
    system_prompt = """You are an expert LSAT tutor and logical reasoning specialist. Your role is to:
1. Identify the exact logical pattern in each question
2. Provide clear, structured breakdowns
3. Explain the correct answer AND why other options fail
4. Help students recognize similar patterns in the future

You have access to a knowledge base of LSAT patterns and strategies. Use this context to inform your analysis.

Always respond with valid JSON in this exact format:
{
    "pattern_type": "string - one of: sequencing, grouping, matching, hybrid, strengthen, weaken, assumption, inference, flaw, parallel, principle, resolve, evaluate, main_idea, detail, inference_rc, structure, attitude",
    "confidence": "float between 0.0 and 1.0",
    "breakdown": {
        "setup": "string - what the stimulus establishes",
        "question_stem": "string - what exactly is being asked",
        "key_constraints": ["list of important rules or facts"],
        "logical_chain": ["step by step reasoning"]
    },
    "correct_answer": {
        "letter": "A/B/C/D/E",
        "explanation": "string - why this is correct",
        "key_insight": "string - the crucial realization"
    },
    "incorrect_answers": [
        {"letter": "A/B/C/D/E", "reason": "why wrong"}
    ],
    "pattern_recognition_tips": ["tips for spotting similar questions"],
    "difficulty": "easy/medium/hard",
    "time_estimate_seconds": "integer"
}"""

    user_prompt = f"""Analyze this LSAT question using the pattern knowledge provided.

{rag_context}

---

## QUESTION TO ANALYZE

**Context/Stimulus:**
{question.get('context', 'N/A')}

**Question:**
{question.get('question', 'N/A')}

**Options:**
{json.dumps(question.get('options', []), indent=2)}

**Correct Answer (for your analysis only):**
{question.get('answer', 'N/A')}

---

Provide your complete analysis in the JSON format specified."""

    return system_prompt, user_prompt

# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="LSAT Analysis Service",
    description="Dedicated LSAT question analysis with caching and RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class FetchQuestionsRequest(BaseModel):
    dataset: str = "tasksource/lsat-ar"
    split: str = "train"
    count: int = Field(default=5, ge=1, le=20)

class AnalyzeRequest(BaseModel):
    question: Dict[str, Any]
    use_cache: bool = True
    use_rag: bool = True
    stream: bool = True

class BatchAnalyzeRequest(BaseModel):
    questions: List[Dict[str, Any]]
    use_cache: bool = True

class SearchPatternsRequest(BaseModel):
    query: str
    top_k: int = 5

# Dataset cache
_dataset_cache: Dict[str, Any] = {}

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    return {
        "service": "LSAT Analysis Service",
        "version": "1.0.0",
        "endpoints": {
            "/questions": "Fetch LSAT questions",
            "/analyze": "Analyze a single question",
            "/analyze/stream": "Stream analysis",
            "/analyze/batch": "Batch analysis",
            "/patterns": "Get pattern information",
            "/patterns/search": "Search patterns by query",
            "/cache/stats": "Cache statistics",
            "/rag/examples": "Get similar examples"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "anthropic_configured": bool(ANTHROPIC_API_KEY),
        "datasets_available": HAS_DATASETS,
        "cache_dir": str(CACHE_DIR),
        "patterns_indexed": len(rag.pattern_index),
        "examples_indexed": len(rag.example_index)
    }

# --- Question Fetching ---

@app.post("/questions")
async def fetch_questions(request: FetchQuestionsRequest):
    """Fetch LSAT questions from HuggingFace dataset."""
    if not HAS_DATASETS:
        raise HTTPException(
            status_code=503,
            detail="datasets library not installed. Run: pip install datasets"
        )
    
    cache_key = f"{request.dataset}_{request.split}"
    
    # Load or use cached dataset
    if cache_key not in _dataset_cache:
        try:
            _dataset_cache[cache_key] = load_dataset(request.dataset, split=request.split)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load dataset: {e}")
    
    dataset = _dataset_cache[cache_key]
    total_rows = len(dataset)
    
    # Random sampling
    import random
    indices = random.sample(range(total_rows), min(request.count, total_rows))
    
    questions = []
    for idx in indices:
        item = dataset[idx]
        normalized = {
            "id": f"{request.dataset}-{idx}",
            "context": item.get("context", "") or item.get("passage", ""),
            "question": item.get("question", ""),
            "options": item.get("options") or item.get("choices") or [],
            "answer": item.get("answer") if item.get("answer") is not None else item.get("label"),
            "dataset": request.dataset,
            "index": idx
        }
        questions.append(normalized)
    
    return {"questions": questions, "total_available": total_rows}

# --- Analysis ---

@app.post("/analyze")
async def analyze_question(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Analyze a single LSAT question (non-streaming)."""
    question = request.question
    cache_key = cache.get_cache_key(question)
    
    # Check cache first
    if request.use_cache:
        cached = cache.load_from_cache(PATTERN_CACHE_DIR, cache_key)
        if cached:
            return {
                "analysis": cached,
                "from_cache": True,
                "cache_key": cache_key
            }
    
    # Build RAG context
    rag_context = ""
    if request.use_rag:
        rag_context = rag.get_context_for_analysis(question)
    
    # Build prompts and call Claude
    system_prompt, user_prompt = build_analysis_prompt(question, rag_context)
    result = await call_claude_sync(system_prompt, user_prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Parse JSON from response
    try:
        analysis = json.loads(result["text"])
    except json.JSONDecodeError:
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', result["text"])
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            analysis = {"raw_response": result["text"], "parse_error": True}
    
    # Cache the result
    cache.save_to_cache(PATTERN_CACHE_DIR, cache_key, analysis)
    
    # Add to RAG index in background
    background_tasks.add_task(rag.add_example, question, analysis)
    
    return {
        "analysis": analysis,
        "from_cache": False,
        "cache_key": cache_key,
        "usage": result.get("usage", {})
    }

@app.post("/analyze/stream")
async def analyze_question_stream(request: AnalyzeRequest):
    """Stream analysis of a single LSAT question."""
    question = request.question
    cache_key = cache.get_cache_key(question)
    
    # Check cache first
    if request.use_cache:
        cached = cache.load_from_cache(PATTERN_CACHE_DIR, cache_key)
        if cached:
            async def cached_stream():
                yield json.dumps({
                    "type": "cached",
                    "analysis": cached,
                    "cache_key": cache_key
                }) + "\n"
            return StreamingResponse(
                cached_stream(),
                media_type="application/x-ndjson"
            )
    
    # Build RAG context
    rag_context = ""
    if request.use_rag:
        rag_context = rag.get_context_for_analysis(question)
    
    # Build prompts
    system_prompt, user_prompt = build_analysis_prompt(question, rag_context)
    
    async def analysis_stream():
        full_text = ""
        async for chunk in call_claude_streaming(system_prompt, user_prompt):
            data = json.loads(chunk)
            if data.get("type") == "text":
                full_text += data.get("content", "")
            yield chunk
        
        # After streaming complete, try to parse and cache
        if full_text:
            try:
                analysis = json.loads(full_text)
                cache.save_to_cache(PATTERN_CACHE_DIR, cache_key, analysis)
                rag.add_example(question, analysis)
            except json.JSONDecodeError:
                pass
    
    return StreamingResponse(
        analysis_stream(),
        media_type="application/x-ndjson"
    )

@app.post("/analyze/batch")
async def batch_analyze(request: BatchAnalyzeRequest, background_tasks: BackgroundTasks):
    """Analyze multiple questions, using cache where available."""
    results = []
    cache_hits = 0
    
    for question in request.questions:
        cache_key = cache.get_cache_key(question)
        
        # Check cache
        if request.use_cache:
            cached = cache.load_from_cache(PATTERN_CACHE_DIR, cache_key)
            if cached:
                results.append({
                    "question_id": question.get("id", cache_key),
                    "analysis": cached,
                    "from_cache": True
                })
                cache_hits += 1
                continue
        
        # Analyze with Claude
        rag_context = rag.get_context_for_analysis(question)
        system_prompt, user_prompt = build_analysis_prompt(question, rag_context)
        result = await call_claude_sync(system_prompt, user_prompt)
        
        if "error" in result:
            results.append({
                "question_id": question.get("id", cache_key),
                "error": result["error"]
            })
            continue
        
        try:
            analysis = json.loads(result["text"])
        except json.JSONDecodeError:
            analysis = {"raw_response": result["text"]}
        
        cache.save_to_cache(PATTERN_CACHE_DIR, cache_key, analysis)
        background_tasks.add_task(rag.add_example, question, analysis)
        
        results.append({
            "question_id": question.get("id", cache_key),
            "analysis": analysis,
            "from_cache": False
        })
    
    return {
        "results": results,
        "total": len(request.questions),
        "cache_hits": cache_hits,
        "api_calls": len(request.questions) - cache_hits
    }

# --- Pattern Information ---

@app.get("/patterns")
async def get_patterns():
    """Get all pattern types and their information."""
    return {
        "patterns": {
            pt.value: asdict(info) 
            for pt, info in PATTERN_DATABASE.items()
        }
    }

@app.get("/patterns/{pattern_type}")
async def get_pattern_info(pattern_type: str):
    """Get detailed information about a specific pattern."""
    try:
        pt = PatternType(pattern_type)
        if pt in PATTERN_DATABASE:
            return asdict(PATTERN_DATABASE[pt])
    except ValueError:
        pass
    
    raise HTTPException(status_code=404, detail=f"Pattern type '{pattern_type}' not found")

@app.post("/patterns/search")
async def search_patterns(request: SearchPatternsRequest):
    """Search patterns by query."""
    results = rag.search_patterns(request.query, request.top_k)
    return {"results": results}

# --- RAG & Cache ---

@app.get("/rag/examples")
async def get_examples(pattern_type: str = None, limit: int = 10):
    """Get analyzed examples, optionally filtered by pattern type."""
    if pattern_type:
        examples = rag.search_examples(pattern_type, limit)
    else:
        examples = rag.example_index[:limit]
    
    return {"examples": examples, "total": len(rag.example_index)}

@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics."""
    pattern_cache_items = list(PATTERN_CACHE_DIR.glob("*.json"))
    question_cache_items = list(QUESTION_CACHE_DIR.glob("*.json"))
    
    return {
        "pattern_analyses_cached": len(pattern_cache_items),
        "questions_cached": len(question_cache_items),
        "rag_patterns_indexed": len(rag.pattern_index),
        "rag_examples_indexed": len(rag.example_index),
        "cache_directory": str(CACHE_DIR)
    }

@app.delete("/cache/clear")
async def clear_cache(patterns: bool = False, examples: bool = False):
    """Clear cache directories."""
    cleared = []
    
    if patterns:
        for f in PATTERN_CACHE_DIR.glob("*.json"):
            f.unlink()
        cleared.append("pattern_cache")
    
    if examples:
        rag.example_index = []
        rag._save_indices()
        cleared.append("example_index")
    
    return {"cleared": cleared}

# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
async def startup():
    """Initialize on startup."""
    print("🚀 LSAT Analysis Service Starting...")
    print(f"   Cache Dir: {CACHE_DIR}")
    print(f"   Anthropic API: {'✅ Configured' if ANTHROPIC_API_KEY else '❌ Not set'}")
    print(f"   HuggingFace Datasets: {'✅ Available' if HAS_DATASETS else '❌ Not installed'}")
    print(f"   Patterns Indexed: {len(rag.pattern_index)}")
    print(f"   Examples Indexed: {len(rag.example_index)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)