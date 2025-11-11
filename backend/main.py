from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tiktoken
from typing import List, Dict

app = FastAPI(title="Tokenizer API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://ai-portfolio-in418kblp-miami-sol-devs-projects.vercel.app"
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

@app.get("/")
async def root():
    return {"message": "Tokenizer API is running"}

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


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)