"""
STaR (Self-Taught Reasoner) Simulator

Simulates the Self-Taught Reasoner training loop:
1. Generate reasoning traces
2. Score each trace
3. Select "golden" traces
4. Use golden traces as few-shot examples for next round
"""

import time
from typing import List, Dict, Tuple
from .strategies import zero_shot_cot, few_shot_cot
from .scoring import score_trace


def run_star_round(
    question: str,
    round_number: int,
    num_traces: int = 10,
    golden_examples: List[Tuple[str, str]] = None,
    ground_truth: str = None,
    model: str = "gpt-4",
    temperature: float = 0.7
) -> Dict:
    """
    Run a single STaR round: generate traces, score, select golden.
    
    Args:
        question: Problem to solve
        round_number: Which round (1, 2, 3...)
        num_traces: Number of parallel reasoning chains
        golden_examples: From previous round (for few-shot)
        ground_truth: Correct answer for scoring
        model: OpenAI model
        temperature: Sampling temperature
    
    Returns:
        Dictionary with traces, scores, and golden selections
    """
    traces = []
    start_time = time.time()
    
    print(f"\n🔄 STaR Round {round_number}: Generating {num_traces} traces...")
    
    # Generate reasoning traces
    for i in range(num_traces):
        if golden_examples and round_number > 1:
            # Use few-shot with golden examples
            reasoning_text, final_answer, tokens = few_shot_cot(
                question, golden_examples, model, temperature
            )
        else:
            # First round: zero-shot
            reasoning_text, final_answer, tokens = zero_shot_cot(
                question, model, temperature
            )
        
        traces.append({
            'trace_index': i,
            'reasoning_text': reasoning_text,
            'final_answer': final_answer,
            'tokens_used': tokens,
            'score': None,  # Will be filled in next step
            'is_golden': False
        })
        
        print(f"  ✓ Trace {i+1}/{num_traces} generated")
    
    # Score all traces
    print(f"📊 Scoring {num_traces} traces...")
    for i, trace in enumerate(traces):
        score = score_trace(
            question,
            trace['reasoning_text'],
            ground_truth,
            model
        )
        trace['score'] = score
        print(f"  Trace {i+1}: Score = {score:.1f}/10")
    
    # Calculate average score
    avg_score = sum(t['score'] for t in traces) / len(traces)
    
    # Select golden traces: top performers above threshold
    # Strategy: Select top 50% OR top 2 (whichever is smaller), but only if score >= 6.0
    score_threshold = 6.0
    sorted_traces = sorted(traces, key=lambda t: t['score'], reverse=True)
    
    # Determine how many to select
    max_golden = max(1, min(2, num_traces // 2))  # Top 50% or 2, whichever is smaller
    
    # Mark as golden if above threshold
    golden_count = 0
    for i in range(min(max_golden, len(sorted_traces))):
        if sorted_traces[i]['score'] >= score_threshold:
            sorted_traces[i]['is_golden'] = True
            golden_count += 1
    
    # If no traces meet threshold, select the best one anyway
    if golden_count == 0 and len(sorted_traces) > 0:
        sorted_traces[0]['is_golden'] = True
        golden_count = 1
    
    elapsed_time = time.time() - start_time
    
    print(f"✨ Round {round_number} complete: Avg score = {avg_score:.2f}, Golden = {golden_count}")
    
    return {
        'round_number': round_number,
        'traces': traces,
        'avg_score': avg_score,
        'num_golden': golden_count,
        'elapsed_time': elapsed_time
    }


def star_simulation(
    question: str,
    num_rounds: int = 3,
    traces_per_round: int = 10,
    ground_truth: str = None,
    model: str = "gpt-4"
) -> List[Dict]:
    """
    Run full STaR simulation: multiple rounds of reasoning improvement.
    
    Args:
        question: Problem to solve
        num_rounds: Number of STaR iterations
        traces_per_round: How many chains per round
        ground_truth: Correct answer for scoring
        model: OpenAI model to use
    
    Returns:
        List of round results
    """
    print(f"\n🚀 Starting STaR Simulation")
    print(f"   Problem: {question[:80]}...")
    print(f"   Rounds: {num_rounds}")
    print(f"   Traces per round: {traces_per_round}")
    
    all_rounds = []
    golden_examples = None
    
    for round_num in range(1, num_rounds + 1):
        round_result = run_star_round(
            question=question,
            round_number=round_num,
            num_traces=traces_per_round,
            golden_examples=golden_examples,
            ground_truth=ground_truth,
            model=model,
            temperature=0.7
        )
        
        all_rounds.append(round_result)
        
        # Extract golden traces for next round
        golden_traces = [
            t for t in round_result['traces'] if t['is_golden']
        ]
        golden_examples = [
            (question, t['reasoning_text']) 
            for t in golden_traces
        ]
        
        # Calculate improvement
        if round_num > 1:
            prev_avg = all_rounds[round_num - 2]['avg_score']
            curr_avg = round_result['avg_score']
            improvement = ((curr_avg - prev_avg) / prev_avg) * 100
            print(f"   📈 Improvement vs Round {round_num-1}: {improvement:+.1f}%")
    
    # Summary
    print(f"\n✅ STaR Simulation Complete!")
    print(f"   Round 1 avg: {all_rounds[0]['avg_score']:.2f}")
    print(f"   Round {num_rounds} avg: {all_rounds[-1]['avg_score']:.2f}")
    total_improvement = ((all_rounds[-1]['avg_score'] - all_rounds[0]['avg_score']) / all_rounds[0]['avg_score']) * 100
    print(f"   Total improvement: {total_improvement:+.1f}%")
    
    return all_rounds
