"""
FastAPI Routes for Deep Reasoner Lab

Endpoints for running reasoning strategies and retrieving results.
"""

import time
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import os

from .strategies import zero_shot_cot, self_consistency
from .star_simulator import star_simulation
from .scoring import score_trace

# Lazy Supabase client initialization
_supabase_client = None

def get_supabase() -> Client:
    """Get Supabase client, initializing if needed."""
    global _supabase_client
    if _supabase_client is None:
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=503,
                detail="Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
            )
        
        _supabase_client = create_client(supabase_url, supabase_key)
    
    return _supabase_client

router = APIRouter(prefix="/reasoning", tags=["reasoning"])


# ===== Request/Response Models =====

class RunReasoningRequest(BaseModel):
    problem_id: Optional[str] = None
    custom_question: Optional[str] = None
    strategy: str  # 'zero_shot_cot', 'self_consistency'
    model: str = "gpt-4"
    n_traces: int = 5  # for self-consistency


class RunSTaRRequest(BaseModel):
    problem_id: Optional[str] = None
    custom_question: Optional[str] = None
    num_rounds: int = 3
    traces_per_round: int = 10
    model: str = "gpt-4"


class ReasoningResponse(BaseModel):
    session_id: str
    strategy: str
    status: str
    traces: List[dict]
    problem_text: str
    total_cost: float
    total_tokens: int


class STaRResponse(BaseModel):
    session_id: str
    rounds: List[dict]
    total_improvement_pct: float
    problem_text: str
    total_cost: float
    total_tokens: int


# ===== Helper Functions =====

def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculate cost in USD based on model and token usage.
    Default to GPT-4 pricing if unknown.
    """
    # Pricing per 1k tokens (as of Dec 2024)
    pricing = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    }
    
    # Normalize model name
    model_key = "gpt-4"
    for key in pricing:
        if key in model:
            model_key = key
            break
            
    rates = pricing[model_key]
    cost = (prompt_tokens / 1000 * rates["input"]) + (completion_tokens / 1000 * rates["output"])
    return round(cost, 4)

def get_problem_text(problem_id: str = None, custom_question: str = None) -> tuple:
    """Get problem text and ground truth from DB or custom input."""
    if problem_id:
        result = get_supabase().table('reasoning_problems').select('*').eq('id', problem_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Problem not found")
        problem = result.data[0]
        return problem['problem_text'], problem.get('ground_truth_answer')
    elif custom_question:
        return custom_question, None
    else:
        raise HTTPException(status_code=400, detail="Must provide problem_id or custom_question")


# ===== Endpoints =====

@router.post("/run", response_model=ReasoningResponse)
async def run_reasoning(request: RunReasoningRequest):
    """
    Run a reasoning strategy (zero-shot CoT or self-consistency).
    """
    question, ground_truth = get_problem_text(request.problem_id, request.custom_question)
    
    # Create session
    session_data = {
        'id': str(uuid.uuid4()),
        'problem_id': request.problem_id,
        'user_query': request.custom_question,
        'strategy': request.strategy,
        'status': 'running'
    }
    get_supabase().table('reasoning_sessions').insert(session_data).execute()
    session_id = session_data['id']
    
    try:
        traces_data = []
        
        if request.strategy == 'zero_shot_cot':
            # Single trace
            start = time.time()
            reasoning_text, final_answer, tokens = zero_shot_cot(question, request.model)
            latency = int((time.time() - start) * 1000)
            
            # Score it
            score = score_trace(question, reasoning_text, ground_truth, request.model)
            
            trace = {
                'session_id': session_id,
                'trace_index': 0,
                'reasoning_text': reasoning_text,
                'final_answer': final_answer,
                'score': score,
                'model_used': request.model,
                'tokens_used': tokens,
                'latency_ms': latency
            }
            
            # Prepare DB record (tokens_used must be int)
            trace_db = trace.copy()
            if isinstance(trace['tokens_used'], dict):
                trace_db['tokens_used'] = trace['tokens_used'].get('total_tokens', 0)
                
            get_supabase().table('reasoning_traces').insert(trace_db).execute()
            traces_data.append(trace)
            
        elif request.strategy == 'self_consistency':
            # Multiple traces with voting
            traces = self_consistency(question, request.n_traces, request.model)
            
            for trace in traces:
                # Score each
                score = score_trace(question, trace['reasoning_text'], ground_truth, request.model)
                
                trace_db = {
                    'session_id': session_id,
                    'trace_index': trace['trace_index'],
                    'reasoning_text': trace['reasoning_text'],
                    'final_answer': trace['final_answer'],
                    'score': score,
                    'model_used': request.model,
                    'model_used': request.model,
                    'tokens_used': trace['tokens_used'],
                    'is_golden': trace['is_winner']
                }
                
                # Handle tokens_used dict for DB
                if isinstance(trace_db['tokens_used'], dict):
                    trace_db['tokens_used'] = trace_db['tokens_used'].get('total_tokens', 0)
                    
                get_supabase().table('reasoning_traces').insert(trace_db).execute()
                traces_data.append({**trace_db, 'votes': trace['votes'], 'tokens_used': trace['tokens_used']})
        
        # Mark session complete
        get_supabase().table('reasoning_sessions').update({
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat()
        }).eq('id', session_id).execute()
        
        # Calculate total stats
        total_prompt_tokens = sum(t.get('tokens_used', {}).get('prompt_tokens', 0) for t in traces_data)
        total_completion_tokens = sum(t.get('tokens_used', {}).get('completion_tokens', 0) for t in traces_data)
        total_tokens = total_prompt_tokens + total_completion_tokens
        total_cost = calculate_cost(request.model, total_prompt_tokens, total_completion_tokens)

        return ReasoningResponse(
            session_id=session_id,
            strategy=request.strategy,
            status='completed',
            traces=traces_data,
            problem_text=question,
            total_cost=total_cost,
            total_tokens=total_tokens
        )
        
    except Exception as e:
        # Mark session failed
        get_supabase().table('reasoning_sessions').update({
            'status': 'failed'
        }).eq('id', session_id).execute()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/star", response_model=STaRResponse)
async def run_star(request: RunSTaRRequest):
    """
    Run full STaR simulation with multiple rounds.
    """
    question, ground_truth = get_problem_text(request.problem_id, request.custom_question)
    
    # Create session
    session_data = {
        'id': str(uuid.uuid4()),
        'problem_id': request.problem_id,
        'user_query': request.custom_question,
        'strategy': 'star',
        'status': 'running'
    }
    get_supabase().table('reasoning_sessions').insert(session_data).execute()
    session_id = session_data['id']
    
    try:
        # Run STaR simulation
        rounds_result = star_simulation(
            question=question,
            num_rounds=request.num_rounds,
            traces_per_round=request.traces_per_round,
            ground_truth=ground_truth,
            model=request.model
        )
        
        # Store all traces and round metrics
        rounds_summary = []
        
        for round_data in rounds_result:
            round_num = round_data['round_number']
            golden_trace_ids = []
            
            # Store traces
            for trace in round_data['traces']:
                trace_db = {
                    'session_id': session_id,
                    'round_number': round_num,
                    'trace_index': trace['trace_index'],
                    'reasoning_text': trace['reasoning_text'],
                    'final_answer': trace['final_answer'],
                    'score': trace['score'],
                    'is_golden': trace['is_golden'],
                    'model_used': request.model,
                    'model_used': request.model,
                    'tokens_used': trace['tokens_used']
                }
                
                # Handle tokens_used dict for DB
                if isinstance(trace_db['tokens_used'], dict):
                    trace_db['tokens_used'] = trace_db['tokens_used'].get('total_tokens', 0)
                    
                result = get_supabase().table('reasoning_traces').insert(trace_db).execute()
                
                if trace['is_golden']:
                    golden_trace_ids.append(result.data[0]['id'])
            
            # Calculate improvement
            improvement_pct = None
            if round_num > 1:
                prev_avg = rounds_result[round_num - 2]['avg_score']
                improvement_pct = ((round_data['avg_score'] - prev_avg) / prev_avg) * 100
            
            # Store round metrics
            round_metrics = {
                'session_id': session_id,
                'round_number': round_num,
                'num_traces': len(round_data['traces']),
                'avg_score': round_data['avg_score'],
                'improvement_pct': improvement_pct,
                'golden_trace_ids': golden_trace_ids
            }
            get_supabase().table('star_rounds').insert(round_metrics).execute()
            
            rounds_summary.append({
                **round_metrics,
                'traces': round_data['traces']
            })
        
        # Calculate total improvement
        total_improvement = ((rounds_result[-1]['avg_score'] - rounds_result[0]['avg_score']) / rounds_result[0]['avg_score']) * 100
        
        # Mark session complete
        get_supabase().table('reasoning_sessions').update({
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat()
        }).eq('id', session_id).execute()
        
        # Calculate total stats from all rounds
        total_prompt_tokens = 0
        total_completion_tokens = 0
        
        for round_data in rounds_summary:
            for trace in round_data['traces']:
                tokens = trace.get('tokens_used', {})
                total_prompt_tokens += tokens.get('prompt_tokens', 0)
                total_completion_tokens += tokens.get('completion_tokens', 0)
                
        total_tokens = total_prompt_tokens + total_completion_tokens
        total_cost = calculate_cost(request.model, total_prompt_tokens, total_completion_tokens)
        
        return STaRResponse(
            session_id=session_id,
            rounds=rounds_summary,
            total_improvement_pct=total_improvement,
            problem_text=question,
            total_cost=total_cost,
            total_tokens=total_tokens
        )
        
    except Exception as e:
        get_supabase().table('reasoning_sessions').update({
            'status': 'failed'
        }).eq('id', session_id).execute()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Retrieve a reasoning session with all traces.
    """
    # Get session
    session = get_supabase().table('reasoning_sessions').select('*').eq('id', session_id).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get traces
    traces = get_supabase().table('reasoning_traces').select('*').eq('session_id', session_id).order('round_number', desc=False).order('trace_index', desc=False).execute()
   
    # If STaR, get round metrics
    rounds = None
    if session.data[0]['strategy'] == 'star':
        rounds = get_supabase().table('star_rounds').select('*').eq('session_id', session_id).order('round_number', desc=False).execute()
    
    return {
        'session': session.data[0],
        'traces': traces.data,
        'rounds': rounds.data if rounds else None
    }


@router.get("/problems")
async def list_problems():
    """
    List all available problems from the library.
    """
    result = get_supabase().table('reasoning_problems').select('id, title, problem_text, category, difficulty').execute()
    return {'problems': result.data}
