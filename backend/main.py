from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tiktoken
from typing import List, Dict, Any
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch.nn.functional as F

app = FastAPI(title="AI Portfolio API")

# CORS middleware for Next.js frontend
origins_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-portfolio-psi-lyart.vercel.app",
        "https://ai-portfolio-production-7eb9.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== TOKENIZER MODELS =====
class TokenizeRequest(BaseModel):
    text: str = Field(..., max_length=10000)
    tokenizers: List[str] = Field(..., min_length=1)

class TokenizerResult(BaseModel):
    tokens: List[int]
    decoded_tokens: List[str]
    count: int
    char_to_token_ratio: float

class TokenizerInfo(BaseModel):
    id: str
    name: str
    description: str

# ===== GENERATION VISUALIZATION MODELS =====
class ProbabilityRequest(BaseModel):
    prompt: str = Field(..., max_length=500, description="Text prompt to analyze")
    top_k: int = Field(default=10, ge=5, le=50, description="Number of top tokens to return")

class TokenProbability(BaseModel):
    token: str
    token_id: int
    probability: float
    log_probability: float

class ProbabilityResponse(BaseModel):
    prompt: str
    top_tokens: List[TokenProbability]
    total_tokens_considered: int

# ===== TOKENIZER INITIALIZATION =====
def initialize_tokenizers():
    """Initialize all available tiktoken encodings dynamically."""
    tokenizers = {}
    metadata = []
    
    available_encodings = tiktoken.list_encoding_names()
    
    friendly_names = {
        "gpt2": "GPT-2",
        "r50k_base": "GPT-3 (Davinci)",
        "p50k_base": "GPT-3 (Codex)",
        "p50k_edit": "GPT-3 (Edit)",
        "cl100k_base": "GPT-4 / GPT-3.5",
        "o200k_base": "GPT-4o",
    }
    
    for encoding_name in available_encodings:
        enc = tiktoken.get_encoding(encoding_name)
        tokenizers[encoding_name] = enc
        
        metadata.append(TokenizerInfo(
            id=encoding_name,
            name=friendly_names.get(encoding_name, encoding_name.upper()),
            description=f"Tokenizer: {encoding_name} ({enc.n_vocab:,} vocab)"
        ))
    
    return tokenizers, metadata

TOKENIZERS, TOKENIZER_METADATA = initialize_tokenizers()

# ===== MODEL INITIALIZATION =====
def initialize_model(model_id="gpt2"):
    """Initialize a model for generation."""
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    
    try:
        print(f"🔄 Loading {model_id}...")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForCausalLM.from_pretrained(model_id).to(device)
        model.eval()
        
        print(f"✅ {model_id} loaded on {device}")
        return {
            "tokenizer": tokenizer,
            "model": model,
            "device": device,
            "id": model_id
        }
    except Exception as e:
        print(f"❌ Could not load {model_id}: {e}")
        return None

# Initialize models
GPT2_MODEL = initialize_model("gpt2")

# Use a capable instruction-tuned model for the agent
# Qwen2.5-1.5B-Instruct is good for CPU, but consider these alternatives:
# - For better tool-calling: "microsoft/Phi-3-mini-4k-instruct" (3.8B params, better instruction following)
# - For speed: "TinyLlama/TinyLlama-1.1B-Chat-v1.0" (faster but less capable)
# - If you have GPU: "mistralai/Mistral-7B-Instruct-v0.2" (excellent tool-calling)
AGENT_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
AGENT_MODEL = initialize_model(AGENT_MODEL_ID)

# ===== BASIC ROUTES =====
@app.get("/")
async def root():
    return {
        "message": "AI Portfolio API",
        "gpt2_loaded": GPT2_MODEL is not None,
        "agent_model_loaded": AGENT_MODEL is not None,
        "agent_model_id": AGENT_MODEL_ID if AGENT_MODEL else None
    }

@app.get("/health")
async def health():
    # Check Ollama status for LangChain agent
    from agent_langchain import check_ollama_status
    ollama_status = check_ollama_status()
    
    return {
        "status": "healthy",
        "gpt2_loaded": GPT2_MODEL is not None,
        "agent_model_loaded": AGENT_MODEL is not None,
        "agent_model_id": AGENT_MODEL_ID if AGENT_MODEL else None,
        "ollama_available": ollama_status["available"],
        "ollama_message": ollama_status.get("message", "")
    }

# ===== TOKENIZER ENDPOINTS =====
@app.get("/api/tokenizers")
async def get_tokenizers() -> List[TokenizerInfo]:
    """Get list of available tokenizers with metadata."""
    return TOKENIZER_METADATA

@app.post("/api/tokenize")
async def tokenize(request: TokenizeRequest) -> Dict[str, TokenizerResult]:
    """Tokenize text using specified tokenizers."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    results = {}
    
    for tokenizer_name in request.tokenizers:
        if tokenizer_name not in TOKENIZERS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tokenizer: {tokenizer_name}"
            )
        
        enc = TOKENIZERS[tokenizer_name]
        token_ids = enc.encode(request.text)
        decoded_tokens = [enc.decode([token_id]) for token_id in token_ids]
        
        char_count = len(request.text)
        token_count = len(token_ids)
        ratio = char_count / token_count if token_count > 0 else 0.0
        
        results[tokenizer_name] = TokenizerResult(
            tokens=token_ids,
            decoded_tokens=decoded_tokens,
            count=token_count,
            char_to_token_ratio=round(ratio, 2)
        )
    
    return results

# ===== GENERATION VISUALIZATION ENDPOINTS =====
@app.post("/api/generation/probabilities")
async def get_token_probabilities(request: ProbabilityRequest) -> ProbabilityResponse:
    """
    Get token probability distribution for the next token.
    This is used to visualize how different generation strategies work.
    """
    if not GPT2_MODEL:
        raise HTTPException(
            status_code=503,
            detail="GPT-2 model not available"
        )
    
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    try:
        tokenizer = GPT2_MODEL["tokenizer"]
        model = GPT2_MODEL["model"]
        device = GPT2_MODEL["device"]
        
        # Tokenize input
        inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
        
        # Get model predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # Get logits for the next token (last position)
        next_token_logits = logits[0, -1, :]
        
        # Convert to probabilities
        probabilities = F.softmax(next_token_logits, dim=-1)
        log_probabilities = F.log_softmax(next_token_logits, dim=-1)
        
        # Get top-k tokens
        top_probs, top_indices = torch.topk(probabilities, k=request.top_k)
        
        # Build response
        top_tokens = []
        for prob, idx in zip(top_probs.cpu().tolist(), top_indices.cpu().tolist()):
            token = tokenizer.decode([idx])
            top_tokens.append(TokenProbability(
                token=token,
                token_id=idx,
                probability=round(prob, 6),
                log_probability=round(log_probabilities[idx].item(), 4)
            ))
        
        return ProbabilityResponse(
            prompt=request.prompt,
            top_tokens=top_tokens,
            total_tokens_considered=len(probabilities)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Probability extraction failed: {str(e)}")

# ===== STREAMING GENERATION ENDPOINTS =====
from fastapi.responses import StreamingResponse
import json
import asyncio

class GenerationRequest(BaseModel):
    prompt: str = Field(..., max_length=10000)
    model_id: str = "gpt2"
    max_new_tokens: int = Field(default=50, le=2000)
    temperature: float = Field(default=0.7, ge=0.1, le=2.0)
    top_k: int = Field(default=50, ge=0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    strategy: str = "top_k"  # greedy, top_k, top_p, beam

async def stream_generator(request: GenerationRequest):
    """Yields tokens one by one for SSE."""
    if not GPT2_MODEL:
        yield json.dumps({"error": "Model not loaded"}) + "\n"
        return

    tokenizer = GPT2_MODEL["tokenizer"]
    model = GPT2_MODEL["model"]
    device = GPT2_MODEL["device"]
    
    inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
    input_ids = inputs.input_ids
    
    curr_input_ids = input_ids
    
    for _ in range(request.max_new_tokens):
        with torch.no_grad():
            outputs = model(curr_input_ids)
            next_token_logits = outputs.logits[:, -1, :]
            
            # Apply temperature
            next_token_logits = next_token_logits / request.temperature
            
            # Apply strategy
            if request.strategy == "greedy":
                next_token = torch.argmax(next_token_logits, dim=-1).unsqueeze(-1)
            elif request.strategy == "top_k":
                top_k = min(request.top_k, next_token_logits.size(-1))
                indices_to_remove = next_token_logits < torch.topk(next_token_logits, top_k)[0][..., -1, None]
                next_token_logits[indices_to_remove] = -float('Inf')
                probs = F.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
            elif request.strategy == "top_p":
                sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > request.top_p
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                next_token_logits[indices_to_remove] = -float('Inf')
                probs = F.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
            else:
                next_token = torch.argmax(next_token_logits, dim=-1).unsqueeze(-1)
        
        # Decode token
        new_token_str = tokenizer.decode(next_token[0])
        
        # Yield result in SSE format
        response_data = {
            "token": new_token_str,
            "finished": False
        }
        yield f"data: {json.dumps(response_data)}\n\n"
        
        # Update input for next iteration
        curr_input_ids = torch.cat([curr_input_ids, next_token], dim=-1)
        
        # Stop if EOS token
        if next_token.item() == tokenizer.eos_token_id:
            break
        
        # Minimal yield for async
        await asyncio.sleep(0)

    yield f"data: {json.dumps({'token': '', 'finished': True})}\n\n"

@app.post("/api/llm/generate_stream")
async def generate_stream(request: GenerationRequest):
    return StreamingResponse(
        stream_generator(request),
        media_type="text/event-stream"
    )


# ===== AGENT ENDPOINTS =====
# NOTE: The Claude-powered agent now runs through Next.js API routes (/api/agent/chat)
# These endpoints are kept for reference but not used by the frontend
# from agent import get_tool_schemas, TOOLS, TOOL_METADATA, execute_tool, parse_tool_call, build_system_prompt

class AgentChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="User message")
    max_tokens: int = Field(default=150, le=500)
# =====LANGCHAIN AGENT ENDPOINT =====
@app.post("/api/agent/langchain")
async def langchain_agent_chat(request: AgentChatRequest):
    """Stream agent chat using LangChain + Ollama (local Llama3)."""
    from agent_langchain import stream_langchain_response, check_ollama_status
    
    # Check if Ollama is available
    status = check_ollama_status()
    if not status["available"]:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "error": "Ollama not available",
                "message": status["message"],
                "setup_instructions": "Install Ollama: `brew install ollama` then start: `ollama serve` and pull model: `ollama pull llama3`"
            }
        )
    
    if not status.get("has_llama3"):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "error": "Llama3 model not found",
                "message": "Run: `ollama pull llama3`"
            }
        )
    
    return StreamingResponse(
        stream_langchain_response(request.message),
        media_type="application/x-ndjson"
    )


@app.get("/api/agent/status")
async def agent_status():
    """Get status of all available agent backends."""
    from agent_langchain import check_ollama_status
    
    ollama_status = check_ollama_status()
    
    return {
        "claude": {
            "available": True,  # Assumes ANTHROPIC_API_KEY is set in Next.js env
            "type": "cloud",
            "model": "Claude Sonnet 4",
            "cost_per_query": "$0.003",
            "speed": "Fast",
            "privacy": "Data sent to Anthropic"
        },
        "langchain": {
            "available": ollama_status["available"],
            "type": "local",
            "model": "Llama 3 (via Ollama)",
            "cost_per_query": "$0 (free)",
            "speed": "Slower (local inference)",
            "privacy": "100% private (runs locally)",
            "message": ollama_status.get("message", ""),
            "setup_required": not ollama_status["available"]
        }
    }


# ===== ENHANCED LSAT ENDPOINTS =====
# Add these to main.py after the existing LSAT section (around line 407)
# Replace the existing LSAT section

from fastapi.responses import StreamingResponse
from lsat_logic import lsat_service

class LSATQuestionRequest(BaseModel):
    dataset: str = "lsat-ar"  # Options: lsat-ar, lsat-logic-games, logiqa, local
    split: str = "train"
    count: int = Field(default=5, ge=1, le=20)

class LSATAnalyzeRequest(BaseModel):
    question_data: Dict[str, Any]
    use_cache: bool = True
    use_rag: bool = True
    stream: bool = False

class LSATAddQuestionsRequest(BaseModel):
    questions: List[Dict[str, Any]]
    filename: str = "parsed_questions.json"

@app.get("/api/lsat/datasets")
async def get_available_datasets():
    """Get list of available LSAT datasets."""
    return {"datasets": lsat_service.get_available_datasets()}

@app.post("/api/lsat/questions")
async def get_lsat_questions(request: LSATQuestionRequest):
    """Fetch random LSAT questions from specified dataset."""
    questions = lsat_service.fetch_questions(
        dataset_name=request.dataset,
        split=request.split,
        count=request.count
    )
    return {"questions": questions, "dataset": request.dataset}

@app.post("/api/lsat/questions/add")
async def add_lsat_questions(request: LSATAddQuestionsRequest):
    """Add questions to local storage (from parsed PDFs, etc.)."""
    count = lsat_service.add_local_questions(request.questions, request.filename)
    return {"added": count, "filename": request.filename}

@app.post("/api/lsat/analyze")
async def analyze_lsat_question(request: LSATAnalyzeRequest):
    """Analyze an LSAT question with caching and RAG."""
    if request.stream:
        return StreamingResponse(
            lsat_service.analyze_pattern_stream(
                request.question_data,
                use_cache=request.use_cache,
                use_rag=request.use_rag
            ),
            media_type="application/x-ndjson"
        )
    else:
        result = await lsat_service.analyze_pattern(
            request.question_data,
            use_cache=request.use_cache,
            use_rag=request.use_rag
        )
        return result

@app.get("/api/lsat/patterns")
async def get_lsat_patterns():
    """Get all LSAT pattern types and their information."""
    return {"patterns": lsat_service.get_patterns()}

@app.get("/api/lsat/patterns/{pattern_type}")
async def get_lsat_pattern_info(pattern_type: str):
    """Get information about a specific pattern type."""
    patterns = lsat_service.get_patterns()
    if pattern_type in patterns:
        return patterns[pattern_type]
    raise HTTPException(status_code=404, detail=f"Pattern '{pattern_type}' not found")

@app.get("/api/lsat/cache/stats")
async def get_lsat_cache_stats():
    """Get LSAT cache statistics."""
    return lsat_service.get_cache_stats()