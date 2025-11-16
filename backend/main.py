from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tiktoken
from typing import List, Dict
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
    tokenizers: List[str] = Field(..., min_items=1)

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

# ===== GPT-2 INITIALIZATION FOR PROBABILITY EXTRACTION =====
def initialize_gpt2():
    """Initialize GPT-2 model for probability extraction."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    try:
        print("🔄 Loading GPT-2 for probability extraction...")
        tokenizer = AutoTokenizer.from_pretrained("gpt2")
        model = AutoModelForCausalLM.from_pretrained("gpt2").to(device)
        model.eval()
        
        print(f"✅ GPT-2 loaded on {device}")
        return {
            "tokenizer": tokenizer,
            "model": model,
            "device": device
        }
    except Exception as e:
        print(f"❌ Could not load GPT-2: {e}")
        return None

GPT2_MODEL = initialize_gpt2()

# ===== BASIC ROUTES =====
@app.get("/")
async def root():
    return {
        "message": "AI Portfolio API",
        "gpt2_loaded": GPT2_MODEL is not None
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gpt2_loaded": GPT2_MODEL is not None
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


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        timeout_keep_alive=75,
        limit_concurrency=10
    )