from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tiktoken
from typing import List, Dict, Optional, Literal
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import re

app = FastAPI(title="Tokenizer API")

# CORS middleware for Next.js frontend
# Use regex pattern to match Vercel preview branches
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

# LLM Generation Models
class LLMGenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=2000)
    model_id: Literal["gpt2", "qwen"] = Field(default="gpt2")
    strategy: Literal["greedy", "top_k", "top_p", "beam"] = Field(default="greedy")
    max_new_tokens: int = Field(default=128, ge=1, le=512)
    temperature: float = Field(default=1.0, ge=0.1, le=2.0)
    top_k: Optional[int] = Field(default=50, ge=1, le=100)
    top_p: Optional[float] = Field(default=0.9, ge=0.0, le=1.0)
    num_beams: Optional[int] = Field(default=4, ge=1, le=10)

class LLMGenerateResponse(BaseModel):
    generated_text: str
    model_used: str
    strategy_used: str
    tokens_generated: int

class LLMModelInfo(BaseModel):
    id: str
    name: str
    description: str
    parameters: str

# Dynamically discover all available tokenizers from tiktoken
def initialize_tokenizers():
    """Initialize all available tiktoken encodings dynamically."""
    tokenizers = {}
    metadata = []
    
    # Get all available encoding names from tiktoken
    available_encodings = tiktoken.list_encoding_names()
    
    # Friendly names mapping (optional - for better display)
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

# Initialize tokenizers once at startup
TOKENIZERS, TOKENIZER_METADATA = initialize_tokenizers()

# LLM Models initialization
def initialize_llm_models():
    """Initialize LLM models for text generation."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    models = {}
    model_metadata = []
    
    # GPT-2 (124M parameters) - Fast and efficient
    try:
        print("Loading GPT-2 model...")
        gpt2_tokenizer = AutoTokenizer.from_pretrained("gpt2")
        gpt2_model = AutoModelForCausalLM.from_pretrained("gpt2").to(device)
        gpt2_model.eval()  # Set to evaluation mode
        
        models["gpt2"] = {
            "tokenizer": gpt2_tokenizer,
            "model": gpt2_model,
            "device": device
        }
        
        model_metadata.append(LLMModelInfo(
            id="gpt2",
            name="GPT-2",
            description="OpenAI's GPT-2 completion model",
            parameters="124M"
        ))
        print("✅ GPT-2 loaded successfully")
    except Exception as e:
        print(f"❌ Could not load GPT-2: {e}")
    
    # Qwen 0.5B (instruction-tuned) - DISABLED for Railway free tier performance
    # Uncomment below to enable (requires more RAM and CPU)
    """
    try:
        print("Loading Qwen model...")
        qwen_tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
        qwen_model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct").to(device)
        qwen_model.eval()  # Set to evaluation mode
        
        models["qwen"] = {
            "tokenizer": qwen_tokenizer,
            "model": qwen_model,
            "device": device
        }
        
        model_metadata.append(LLMModelInfo(
            id="qwen",
            name="Qwen 2.5 (0.5B)",
            description="Instruction-tuned chat model",
            parameters="500M"
        ))
        print("✅ Qwen loaded successfully")
    except Exception as e:
        print(f"❌ Could not load Qwen: {e}")
    """
    
    print(f"📊 Loaded {len(models)} model(s) on {device}")
    return models, model_metadata

# Initialize LLMs once at startup
LLM_MODELS, LLM_MODEL_METADATA = initialize_llm_models()

@app.get("/")
async def root():
    return {"message": "Tokenizer API is running", "models_loaded": len(LLM_MODELS)}

@app.get("/health")
async def health():
    """Health check endpoint - returns model status"""
    return {
        "status": "healthy",
        "models_loaded": list(LLM_MODELS.keys()),
        "model_count": len(LLM_MODELS)
    }

@app.get("/api/tokenizers")
async def get_tokenizers() -> List[TokenizerInfo]:
    """
    Get list of available tokenizers with metadata.
    """
    return TOKENIZER_METADATA

@app.post("/api/tokenize")
async def tokenize(request: TokenizeRequest) -> Dict[str, TokenizerResult]:
    """
    Tokenize text using specified tokenizers.
    Returns a dictionary mapping tokenizer names to their results.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    results = {}
    
    for tokenizer_name in request.tokenizers:
        if tokenizer_name not in TOKENIZERS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tokenizer: {tokenizer_name}. Valid options: {list(TOKENIZERS.keys())}"
            )
        
        enc = TOKENIZERS[tokenizer_name]
        
        # Encode the text
        token_ids = enc.encode(request.text)
        
        # Decode each token individually to show the breakdown
        decoded_tokens = [enc.decode([token_id]) for token_id in token_ids]
        
        # Calculate character to token ratio
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


@app.get("/api/llm/models")
async def get_llm_models() -> List[LLMModelInfo]:
    """
    Get list of available LLM models with metadata.
    """
    return LLM_MODEL_METADATA


@app.post("/api/llm/generate")
async def generate_text(request: LLMGenerateRequest) -> LLMGenerateResponse:
    """
    Generate text using specified LLM model and decoding strategy.
    """
    import time
    start_time = time.time()
    
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    if request.model_id not in LLM_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model {request.model_id} not available. Available models: {list(LLM_MODELS.keys())}"
        )
    
    print(f"🚀 Generation request: model={request.model_id}, strategy={request.strategy}, max_tokens={request.max_new_tokens}")
    
    model_info = LLM_MODELS[request.model_id]
    tokenizer = model_info["tokenizer"]
    model = model_info["model"]
    device = model_info["device"]
    
    # Tokenize input
    tokenize_start = time.time()
    inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
    input_length = inputs["input_ids"].shape[1]
    print(f"⏱️  Tokenization: {time.time() - tokenize_start:.2f}s")
    
    # Prepare generation kwargs based on strategy
    gen_kwargs = {
        "max_new_tokens": request.max_new_tokens,
        "temperature": request.temperature,
        "pad_token_id": tokenizer.eos_token_id,
    }
    
    if request.strategy == "greedy":
        gen_kwargs["do_sample"] = False
    elif request.strategy == "top_k":
        gen_kwargs["do_sample"] = True
        gen_kwargs["top_k"] = request.top_k
    elif request.strategy == "top_p":
        gen_kwargs["do_sample"] = True
        gen_kwargs["top_p"] = request.top_p
    elif request.strategy == "beam":
        gen_kwargs["num_beams"] = request.num_beams
        gen_kwargs["do_sample"] = False
    
    # Generate text
    try:
        gen_start = time.time()
        print(f"🔮 Starting generation...")
        with torch.no_grad():
            outputs = model.generate(**inputs, **gen_kwargs)
        gen_time = time.time() - gen_start
        print(f"⏱️  Generation: {gen_time:.2f}s")
        
        # Decode only the new tokens
        decode_start = time.time()
        generated_text = tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
        tokens_generated = outputs.shape[1] - input_length
        print(f"⏱️  Decoding: {time.time() - decode_start:.2f}s")
        
        total_time = time.time() - start_time
        print(f"✅ Total request time: {total_time:.2f}s, Generated {tokens_generated} tokens")
        
        return LLMGenerateResponse(
            generated_text=generated_text,
            model_used=request.model_id,
            strategy_used=request.strategy,
            tokens_generated=tokens_generated
        )
    except Exception as e:
        print(f"❌ Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    # Increase timeout for model inference
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        timeout_keep_alive=75,  # Keep connections alive longer
        limit_concurrency=10     # Limit concurrent requests
    )