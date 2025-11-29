import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from pydantic import BaseModel
import httpx

from contract_logic import build_analysis_prompt, build_rewrite_prompt
from contract_rag_utils import contract_rag, contract_cache, ContractCacheManager

# =============================================================================
# CONFIGURATION
# =============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

router = APIRouter(prefix="/contract", tags=["contract"])

# =============================================================================
# MODELS
# =============================================================================

class AnalyzeContractRequest(BaseModel):
    text: str
    use_cache: bool = True
    use_rag: bool = True

class RewriteRequest(BaseModel):
    clause_text: str
    risk_type: str
    context: str = ""

class FeedbackRequest(BaseModel):
    contract_text: str
    analysis: Dict[str, Any]
    user_feedback: str

# =============================================================================
# LLM HELPERS
# =============================================================================

async def call_claude_sync(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4000,
    temperature: float = 0.3
) -> Dict[str, Any]:
    """Non-streaming Claude call."""
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
                return {"error": f"API error: {response.status_code} - {response.text}"}
            
            data = response.json()
            content = data.get("content", [])
            text = "".join(block.get("text", "") for block in content if block.get("type") == "text")
            return {"text": text, "usage": data.get("usage", {})}
            
        except Exception as e:
            return {"error": str(e)}

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze")
async def analyze_contract(request: AnalyzeContractRequest, background_tasks: BackgroundTasks):
    """Analyze a contract text for risks."""
    cache_key = ContractCacheManager.get_cache_key(request.text)
    
    # Check cache
    if request.use_cache:
        cached = contract_cache.load_from_cache(cache_key)
        if cached:
            return {
                "analysis": cached,
                "from_cache": True
            }
    
    # Build RAG context
    rag_context = ""
    if request.use_rag:
        rag_context = contract_rag.get_context_for_analysis(request.text)
    
    # Build prompts
    system_prompt, user_prompt = build_analysis_prompt(request.text, rag_context)
    
    # Call LLM
    result = await call_claude_sync(system_prompt, user_prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Parse JSON
    try:
        analysis = json.loads(result["text"])
    except json.JSONDecodeError:
        # Try to extract JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', result["text"])
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            # Return raw text if parsing fails, but mark as error
            return {
                "analysis": {"raw_response": result["text"], "parse_error": True},
                "from_cache": False
            }
    
    # Save to cache
    contract_cache.save_to_cache(cache_key, analysis)
    
    # Auto-train: Add to RAG index immediately (as requested by user)
    # In a real scenario, we might want to wait for user validation, 
    # but the user asked for "automatically trains RAG every time".
    # We'll treat the initial analysis as a "draft" example.
    background_tasks.add_task(contract_rag.add_example, request.text, analysis)
    
    return {
        "analysis": analysis,
        "from_cache": False
    }

@router.post("/rewrite")
async def rewrite_clause(request: RewriteRequest):
    """Rewrite a specific clause to mitigate risks."""
    system_prompt, user_prompt = build_rewrite_prompt(
        request.clause_text, 
        request.risk_type, 
        request.context
    )
    
    result = await call_claude_sync(system_prompt, user_prompt, temperature=0.5)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {"rewritten_text": result["text"].strip()}

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, background_tasks: BackgroundTasks):
    """Submit user feedback to improve RAG training."""
    # Here we would update the analysis with user feedback and re-index it
    # For now, we'll just re-index the provided analysis which presumably contains the user's corrections
    
    background_tasks.add_task(contract_rag.add_example, request.contract_text, request.analysis)
    
    return {"status": "feedback_received", "message": "RAG index updated"}

@router.get("/stats")
async def get_rag_stats():
    """Get statistics about the RAG knowledge base."""
    return contract_rag.get_stats()
