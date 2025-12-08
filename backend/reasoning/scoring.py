"""
Scoring and Reward Model Simulation

Uses multiple LLM critics with temperature to score reasoning traces.
This ensures score variance (not all 10/10).
"""

import os
import re
import statistics
import sys
import os

# Add parent directory to path to allow importing llm_engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from llm_engine import generate_text


def score_trace(
    question: str,
    reasoning_text: str,
    ground_truth: str = None,
    model: str = "gpt-4"
) -> float:
    """
    Score using MULTIPLE critics with temperature for variance.
    Returns average of 3 critics to ensure scores vary (not all 10/10).
    """
    critics = [
        {
            "name": "Clarity Critic",
            "prompt": f"You are a harsh critic. Rate this reasoning's CLARITY (1-10). Penalize verbose, unclear, or convoluted explanations. Be strict.\n\nQuestion: {question}\n\nReasoning:\n{reasoning_text}\n\nScore (just the number):"
        },
        {
            "name": "Logic Critic", 
            "prompt": f"You are a harsh critic. Rate this reasoning's LOGICAL CORRECTNESS (1-10). Penalize logical errors, missing steps, or invalid inferences. If the answer is wrong, score < 3.\n\nQuestion: {question}\n\nReasoning:\n{reasoning_text}\n\nCorrect answer: {ground_truth or 'unknown'}\n\nScore (just the number):"
        },
        {
            "name": "Efficiency Critic",
            "prompt": f"You are a harsh critic. Rate this reasoning's EFFICIENCY (1-10). Penalize unnecessary steps, redundancy, or poor structure. Be strict.\n\nQuestion: {question}\n\nReasoning:\n{reasoning_text}\n\nScore (just the number):"
        }
    ]
    
    scores = []
    for critic in critics:
        try:
            result = generate_text(
                prompt=critic["prompt"],
                model=model,
                temperature=0.3,
                max_tokens=10
            )
            score_text = result['text'].strip()
            score = parse_score(score_text)
            scores.append(score)
        except Exception as e:
            print(f"  ⚠️ {critic['name']} failed: {e}")
            scores.append(7.0)  # Default fallback
    
    # Average of critics, with slight randomization
    avg_score = statistics.mean(scores)
    
    # Add small variance (+/- 0.5) to prevent identical scores
    import random
    variance = random.uniform(-0.3, 0.3)
    final_score = max(1.0, min(10.0, avg_score + variance))
    
    return round(final_score, 1)


def parse_score(text: str) -> float:
    """Extract numeric score from LLM response."""
    # Try to find a number between 1-10
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    if match:
        score = float(match.group(1))
        return min(max(score, 1.0), 10.0)  # Clamp to 1-10
    return 5.0  # Default middle score if parsing fails


def score_outcome(
    question: str,
    final_answer: str,
    ground_truth: str,
    model: str = "gpt-4"
) -> float:
    """
    Outcome Reward Model: Score based on final answer only.
    
    Args:
        question: Original problem
        final_answer: The final answer given
        ground_truth: Correct answer
        model: OpenAI model to use
    
    Returns:
        Score from 1.0 to 10.0
    """
    prompt = f"""Compare the given answer to the correct answer for this question.

Question: {question}
Given Answer: {final_answer}
Correct Answer: {ground_truth}

Rate the correctness from 1 to 10.
1 = Completely wrong
5 = Partially correct
10 = Perfectly correct

Score (just the number):"""

    try:
        result = generate_text(
            prompt=prompt,
            model=model,
            temperature=0.0,
            max_tokens=10
        )
        return parse_score(result['text'])
    except Exception as e:
        print(f"  ⚠️ Outcome scoring failed: {e}")
        return 5.0
