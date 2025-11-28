# lsat_logic.py - Enhanced LSAT Service with Multiple Datasets
# Supports: HuggingFace datasets, local JSON, parsed PDFs

import os
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional, AsyncGenerator
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import random

# Optional imports
try:
    from datasets import load_dataset
    HAS_DATASETS = True
except ImportError:
    HAS_DATASETS = False
    print("⚠️ datasets not installed - HuggingFace datasets won't load")

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    print("⚠️ httpx not installed - streaming analysis won't work")

# =============================================================================
# CONFIGURATION
# =============================================================================

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
CACHE_DIR = Path("./lsat_cache")
PATTERN_CACHE_DIR = CACHE_DIR / "patterns"
RAG_INDEX_DIR = CACHE_DIR / "rag_index"
LOCAL_QUESTIONS_DIR = CACHE_DIR / "questions"

# Ensure cache directories exist
CACHE_DIR.mkdir(exist_ok=True)
PATTERN_CACHE_DIR.mkdir(exist_ok=True)
RAG_INDEX_DIR.mkdir(exist_ok=True)
LOCAL_QUESTIONS_DIR.mkdir(exist_ok=True)

# =============================================================================
# AVAILABLE DATASETS
# =============================================================================

DATASETS = {
    # HuggingFace datasets
    "lsat-ar": {
        "source": "huggingface",
        "name": "tasksource/lsat-ar",
        "description": "LSAT Analytical Reasoning (Logic Games)",
        "type": "analytical_reasoning",
        "split": "train"
    },
    "lsat-logic-games": {
        "source": "huggingface",
        "name": "saumyamalik/lsat_logic_games-analytical_reasoning",
        "description": "LSAT Logic Games with difficulty metadata",
        "type": "analytical_reasoning", 
        "split": "train"
    },
    "logiqa": {
        "source": "huggingface",
        "name": "lucasmccabe/logiqa",
        "description": "LogiQA - Logical reasoning (Chinese civil exam style)",
        "type": "logical_reasoning",
        "split": "train"
    },
    # Local JSON files (parsed from PDFs)
    "local": {
        "source": "local",
        "path": str(LOCAL_QUESTIONS_DIR / "parsed_questions.json"),
        "description": "Locally parsed LSAT questions from PDFs",
        "type": "mixed"
    },
}

# =============================================================================
# PATTERN TAXONOMY
# =============================================================================

class PatternType(str, Enum):
    SEQUENCING = "sequencing"
    GROUPING = "grouping"
    MATCHING = "matching"
    HYBRID = "hybrid"
    STRENGTHEN = "strengthen"
    WEAKEN = "weaken"
    ASSUMPTION = "assumption"
    INFERENCE = "inference"
    FLAW = "flaw"
    PARALLEL = "parallel"
    PRINCIPLE = "principle"
    RESOLVE = "resolve"
    EVALUATE = "evaluate"

@dataclass
class PatternInfo:
    type: PatternType
    display_name: str
    description: str
    key_indicators: List[str]
    common_traps: List[str]
    solving_strategy: List[str]

PATTERN_DATABASE: Dict[PatternType, PatternInfo] = {
    PatternType.SEQUENCING: PatternInfo(
        type=PatternType.SEQUENCING,
        display_name="Sequencing",
        description="Arranging elements in order (linear, circular, or branched)",
        key_indicators=["before/after", "first/last", "adjacent", "positions", "order"],
        common_traps=["Confusing 'immediately before' with 'somewhere before'", "Missing transitive relationships"],
        solving_strategy=["Create a number line or slots", "Place most constrained elements first", "Use deductions to eliminate"]
    ),
    PatternType.GROUPING: PatternInfo(
        type=PatternType.GROUPING,
        display_name="Grouping",
        description="Distributing elements into categories or teams",
        key_indicators=["selecting from pool", "dividing into groups", "in/out", "teams", "categories"],
        common_traps=["Not tracking group size limits", "Missing contrapositive"],
        solving_strategy=["Draw group containers", "Track must-be-in and cannot-be-in", "Apply contrapositives"]
    ),
    PatternType.ASSUMPTION: PatternInfo(
        type=PatternType.ASSUMPTION,
        display_name="Necessary Assumption",
        description="Finding the unstated premise required for the argument",
        key_indicators=["assumes which", "depends on assuming", "relies on the assumption", "required assumption"],
        common_traps=["Confusing necessary vs sufficient", "Picking strengtheners that aren't required"],
        solving_strategy=["Identify conclusion and premises", "Find the logical gap", "Use negation test"]
    ),
    PatternType.STRENGTHEN: PatternInfo(
        type=PatternType.STRENGTHEN,
        display_name="Strengthen",
        description="Finding information that supports the argument",
        key_indicators=["most strengthens", "provides support", "adds credibility"],
        common_traps=["Picking answers that repeat conclusion", "Confusing relevance with support"],
        solving_strategy=["Identify exact conclusion", "Find evidence gap", "Bridge the gap"]
    ),
    PatternType.WEAKEN: PatternInfo(
        type=PatternType.WEAKEN,
        display_name="Weaken",
        description="Finding information that undermines the argument",
        key_indicators=["most weakens", "casts doubt", "undermines", "calls into question"],
        common_traps=["Attacking premises instead of reasoning", "Going too extreme"],
        solving_strategy=["Find the reasoning link to attack", "Look for alternative explanations"]
    ),
    PatternType.INFERENCE: PatternInfo(
        type=PatternType.INFERENCE,
        display_name="Inference",
        description="Drawing a conclusion that must be true",
        key_indicators=["must be true", "can be inferred", "follows logically", "properly concluded"],
        common_traps=["Going beyond what's stated", "Confusing 'could be' with 'must be'"],
        solving_strategy=["Treat stimulus as 100% true", "Look for provable answer", "Eliminate unsupported claims"]
    ),
    PatternType.FLAW: PatternInfo(
        type=PatternType.FLAW,
        display_name="Flaw",
        description="Identifying the reasoning error",
        key_indicators=["vulnerable to criticism", "flaw in reasoning", "questionable because", "error"],
        common_traps=["Picking general flaw that doesn't match", "Confusing conclusion with flaw"],
        solving_strategy=["Find gap in logic", "Match to common flaw types", "Answer must describe THIS error"]
    ),
    PatternType.PARALLEL: PatternInfo(
        type=PatternType.PARALLEL,
        display_name="Parallel Reasoning",
        description="Finding an argument with same logical structure",
        key_indicators=["parallel to", "similar pattern", "analogous reasoning"],
        common_traps=["Matching topic instead of structure", "Missing subtle differences"],
        solving_strategy=["Abstract to logical form", "Count premises", "Match structure not content"]
    ),
}

# =============================================================================
# CACHE SYSTEM
# =============================================================================

class CacheManager:
    @staticmethod
    def get_cache_key(data: Dict[str, Any]) -> str:
        serialized = json.dumps({
            "context": data.get("context", ""),
            "question": data.get("question", ""),
            "options": data.get("options", [])
        }, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()[:16]
    
    @staticmethod
    def save_to_cache(key: str, data: Dict[str, Any]) -> None:
        cache_file = PATTERN_CACHE_DIR / f"{key}.json"
        with open(cache_file, 'w') as f:
            json.dump({"cached_at": datetime.now().isoformat(), "data": data}, f, indent=2)
    
    @staticmethod
    def load_from_cache(key: str) -> Optional[Dict[str, Any]]:
        cache_file = PATTERN_CACHE_DIR / f"{key}.json"
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                return json.load(f).get("data")
        return None
    
    @staticmethod
    def get_cache_stats() -> Dict[str, int]:
        pattern_count = len(list(PATTERN_CACHE_DIR.glob("*.json")))
        rag_examples = RAG_INDEX_DIR / "examples.json"
        local_questions = LOCAL_QUESTIONS_DIR / "parsed_questions.json"
        
        local_count = 0
        if local_questions.exists():
            with open(local_questions, 'r') as f:
                data = json.load(f)
                local_count = len(data.get("questions", data if isinstance(data, list) else []))
        
        return {
            "cached_analyses": pattern_count,
            "rag_patterns": len(PATTERN_DATABASE),
            "rag_examples": len(json.load(open(rag_examples))) if rag_examples.exists() else 0,
            "local_questions": local_count
        }

cache = CacheManager()

# =============================================================================
# RAG SYSTEM
# =============================================================================

class PatternRAG:
    def __init__(self):
        self.example_index: List[Dict[str, Any]] = []
        self._load_examples()
    
    def _load_examples(self):
        example_file = RAG_INDEX_DIR / "examples.json"
        if example_file.exists():
            with open(example_file, 'r') as f:
                self.example_index = json.load(f)
    
    def _save_examples(self):
        with open(RAG_INDEX_DIR / "examples.json", 'w') as f:
            json.dump(self.example_index, f, indent=2)
    
    def add_example(self, question: Dict[str, Any], analysis: Dict[str, Any]):
        entry = {
            "id": cache.get_cache_key(question),
            "pattern_type": analysis.get("pattern_type", "unknown"),
            "question_preview": question.get("question", "")[:100],
            "cached_at": datetime.now().isoformat()
        }
        if entry["id"] not in {e["id"] for e in self.example_index}:
            self.example_index.append(entry)
            self._save_examples()
    
    def get_context_for_analysis(self, question: Dict[str, Any]) -> str:
        text = f"{question.get('question', '')} {question.get('context', '')}".lower()
        
        matches = [info for pt, info in PATTERN_DATABASE.items() 
                   if any(ind.lower() in text for ind in info.key_indicators)]
        
        if not matches:
            matches = [PATTERN_DATABASE[PatternType.INFERENCE], PATTERN_DATABASE[PatternType.ASSUMPTION]]
        
        parts = ["## Relevant Pattern Information\n"]
        for p in matches[:3]:
            parts.append(f"### {p.display_name}\n**Description:** {p.description}")
            parts.append(f"**Key Indicators:** {', '.join(p.key_indicators)}")
            parts.append("**Strategy:** " + "; ".join(p.solving_strategy))
            parts.append(f"**Traps:** {', '.join(p.common_traps)}\n")
        
        return "\n".join(parts)

rag = PatternRAG()

# =============================================================================
# PROMPTS
# =============================================================================

SYSTEM_PROMPT = """You are an expert LSAT tutor. Analyze questions and respond with valid JSON only:
{
    "pattern_type": "sequencing|grouping|matching|hybrid|strengthen|weaken|assumption|inference|flaw|parallel|principle|resolve|evaluate",
    "confidence": 0.0-1.0,
    "breakdown": {
        "setup": "what stimulus establishes",
        "question_stem": "what is asked",
        "key_constraints": ["rules/facts"],
        "logical_chain": ["step-by-step reasoning"]
    },
    "correct_answer": {"letter": "A-E", "explanation": "why correct", "key_insight": "crucial realization"},
    "incorrect_answers": [{"letter": "X", "reason": "why wrong"}],
    "pattern_recognition_tips": ["tips"],
    "difficulty": "easy|medium|hard",
    "time_estimate_seconds": 90
}"""

def build_user_prompt(question: Dict[str, Any], rag_context: str) -> str:
    return f"""{rag_context}

---
**Context:** {question.get('context', 'N/A')}
**Question:** {question.get('question', 'N/A')}
**Options:** {json.dumps(question.get('options', []))}
**Answer:** {question.get('answer', 'N/A')}
---
Analyze this LSAT question. Return ONLY valid JSON."""

# =============================================================================
# NEXT.JS API CALLS
# =============================================================================

async def call_claude_streaming(system_prompt: str, user_prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
    if not HAS_HTTPX:
        yield {"type": "error", "content": "httpx not installed"}
        return
    
    msg = f"{system_prompt}\n\n---\n\n{user_prompt}"
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream("POST", f"{NEXTJS_URL}/api/agent/chat",
                                      headers={"Content-Type": "application/json"},
                                      json={"message": msg}) as response:
                if response.status_code != 200:
                    yield {"type": "error", "content": f"API error: {response.status_code}"}
                    return
                
                full_text = ""
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("type") == "text":
                            full_text += data.get("content", "")
                            yield data
                        elif data.get("type") in ("complete", "error"):
                            yield data
                    except json.JSONDecodeError:
                        continue
                
                if full_text:
                    yield {"type": "complete", "full_text": full_text}
        except Exception as e:
            yield {"type": "error", "content": str(e)}

async def call_claude_sync(system_prompt: str, user_prompt: str) -> Dict[str, Any]:
    if not HAS_HTTPX:
        return {"error": "httpx not installed"}
    
    msg = f"{system_prompt}\n\n---\n\n{user_prompt}"
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            full_text = ""
            async with client.stream("POST", f"{NEXTJS_URL}/api/agent/chat",
                                      headers={"Content-Type": "application/json"},
                                      json={"message": msg}) as response:
                if response.status_code != 200:
                    return {"error": f"API error: {response.status_code}"}
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("type") == "text":
                            full_text += data.get("content", "")
                        elif data.get("type") == "error":
                            return {"error": data.get("content")}
                    except json.JSONDecodeError:
                        continue
            
            return {"text": full_text}
        except Exception as e:
            return {"error": str(e)}

# =============================================================================
# MAIN SERVICE CLASS
# =============================================================================

class LSATService:
    def __init__(self):
        self._dataset_cache: Dict[str, Any] = {}

    def get_available_datasets(self) -> Dict[str, Any]:
        """Return available datasets with status."""
        result = {}
        for key, config in DATASETS.items():
            status = "available"
            if config["source"] == "local" and not Path(config["path"]).exists():
                status = "empty"
            result[key] = {**config, "status": status}
        return result

    def _normalize_question(self, item: Dict[str, Any], dataset_name: str, idx: int) -> Dict[str, Any]:
        """Normalize question format from different sources."""
        context = item.get("context") or item.get("passage") or item.get("stimulus") or item.get("setup") or ""
        question = item.get("question") or item.get("query") or item.get("prompt") or ""
        options = item.get("options") or item.get("choices") or item.get("answers") or []
        
        answer = item.get("answer") or item.get("label") or item.get("correct_option") or item.get("correct_answer")
        if isinstance(answer, int) and 0 <= answer < 5:
            answer = chr(65 + answer)
        
        return {
            "id": f"{dataset_name}-{idx}",
            "context": context,
            "question": question,
            "options": options,
            "answer": answer,
            "dataset": dataset_name,
            "index": idx,
            "difficulty": item.get("difficulty"),
            "game_type": item.get("game_type"),
            "preptest": item.get("preptest"),
            "section": item.get("section"),
        }

    def fetch_questions(self, dataset_name: str = "lsat-ar", split: str = "train", count: int = 5) -> List[Dict[str, Any]]:
        """Fetch random questions from specified dataset."""
        config = DATASETS.get(dataset_name, {"source": "huggingface", "name": dataset_name, "split": split})
        questions = []
        
        if config["source"] == "huggingface":
            if not HAS_DATASETS:
                return [{"error": "datasets library not installed"}]
            
            try:
                hf_name = config["name"]
                hf_split = config.get("split", split)
                cache_key = f"{hf_name}_{hf_split}"
                
                if cache_key not in self._dataset_cache:
                    print(f"📥 Loading {hf_name} ({hf_split})...")
                    self._dataset_cache[cache_key] = load_dataset(hf_name, split=hf_split)
                
                dataset = self._dataset_cache[cache_key]
                indices = random.sample(range(len(dataset)), min(count, len(dataset)))
                
                for idx in indices:
                    questions.append(self._normalize_question(dict(dataset[idx]), dataset_name, idx))
            except Exception as e:
                print(f"❌ Error loading dataset: {e}")
                return [{"error": str(e)}]
        
        elif config["source"] == "local":
            try:
                path = Path(config["path"])
                if not path.exists():
                    return [{"error": f"Local file not found: {path}"}]
                
                with open(path, 'r') as f:
                    data = json.load(f)
                    local_qs = data.get("questions", data if isinstance(data, list) else [])
                
                if not local_qs:
                    return [{"error": "No questions in local file"}]
                
                indices = random.sample(range(len(local_qs)), min(count, len(local_qs)))
                for idx in indices:
                    questions.append(self._normalize_question(local_qs[idx], dataset_name, idx))
            except Exception as e:
                return [{"error": str(e)}]
        
        return questions

    def add_local_questions(self, questions: List[Dict[str, Any]], filename: str = "parsed_questions.json") -> int:
        """Add questions to local storage."""
        filepath = LOCAL_QUESTIONS_DIR / filename
        
        existing = []
        if filepath.exists():
            with open(filepath, 'r') as f:
                data = json.load(f)
                existing = data.get("questions", data if isinstance(data, list) else [])
        
        existing_texts = {q.get("question", "")[:100] for q in existing}
        new_qs = [q for q in questions if q.get("question", "")[:100] not in existing_texts]
        
        all_qs = existing + new_qs
        with open(filepath, 'w') as f:
            json.dump({"questions": all_qs, "updated_at": datetime.now().isoformat()}, f, indent=2)
        
        print(f"✅ Added {len(new_qs)} questions (total: {len(all_qs)})")
        return len(new_qs)

    async def analyze_pattern(self, question_data: Dict[str, Any], model_client=None,
                              use_cache: bool = True, use_rag: bool = True) -> Dict[str, Any]:
        cache_key = cache.get_cache_key(question_data)
        
        if use_cache:
            cached = cache.load_from_cache(cache_key)
            if cached:
                return {"analysis": cached, "from_cache": True, "cache_key": cache_key}
        
        rag_context = rag.get_context_for_analysis(question_data) if use_rag else ""
        result = await call_claude_sync(SYSTEM_PROMPT, build_user_prompt(question_data, rag_context))
        
        if "error" in result:
            return {"error": result["error"]}
        
        try:
            import re
            text = result["text"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            analysis = json.loads(json_match.group() if json_match else text)
        except:
            analysis = {"raw_response": result["text"], "parse_error": True}
        
        cache.save_to_cache(cache_key, analysis)
        rag.add_example(question_data, analysis)
        
        return {"analysis": analysis, "from_cache": False, "cache_key": cache_key}

    async def analyze_pattern_stream(self, question_data: Dict[str, Any],
                                     use_cache: bool = True, use_rag: bool = True) -> AsyncGenerator[str, None]:
        cache_key = cache.get_cache_key(question_data)
        
        if use_cache:
            cached = cache.load_from_cache(cache_key)
            if cached:
                yield json.dumps({"type": "cached", "analysis": cached, "cache_key": cache_key}) + "\n"
                return
        
        rag_context = rag.get_context_for_analysis(question_data) if use_rag else ""
        full_text = ""
        
        async for chunk in call_claude_streaming(SYSTEM_PROMPT, build_user_prompt(question_data, rag_context)):
            if chunk["type"] == "text":
                full_text += chunk.get("content", "")
            yield json.dumps(chunk) + "\n"
        
        if full_text:
            try:
                import re
                json_match = re.search(r'\{[\s\S]*\}', full_text)
                analysis = json.loads(json_match.group() if json_match else full_text)
                cache.save_to_cache(cache_key, analysis)
                rag.add_example(question_data, analysis)
            except:
                pass

    def get_patterns(self) -> Dict[str, Any]:
        return {pt.value: asdict(info) for pt, info in PATTERN_DATABASE.items()}

    def get_cache_stats(self) -> Dict[str, int]:
        return cache.get_cache_stats()

# Global instance
lsat_service = LSATService()