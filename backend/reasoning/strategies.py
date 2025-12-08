"""
Reasoning Strategies Implementation

This module implements various inference-time reasoning methods.
"""

import os
import re
from typing import List, Dict, Tuple
from typing import List, Dict, Tuple
from collections import Counter
import sys
import os

# Add parent directory to path to allow importing llm_engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from llm_engine import generate_text


def parse_final_answer(text: str) -> str:
    """
    Extract the final answer from reasoning text.
    Looks for patterns like "Answer: X" or "The answer is X"
    """
    # Try to find explicit answer markers
    patterns = [
        r"[Aa]nswer[:\s]+(.+?)(?:\n|$)",
        r"[Tt]he answer is[:\s]+(.+?)(?:\n|$)",
        r"[Ff]inal answer[:\s]+(.+?)(?:\n|$)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    # Fallback: return last non-empty line
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return lines[-1] if lines else text[:100]


def zero_shot_cot(
    question: str,
    model: str = "gpt-4",
    temperature: float = 0.0
) -> Tuple[str, str, int]:
    """
    Zero-shot Chain-of-Thought prompting.
    
    Args:
        question: The problem to solve
        model: OpenAI model to use
        temperature: Sampling temperature
    
    Returns:
        Tuple of (reasoning_text, final_answer, tokens_used_dict)
    """
    prompt = f"""Question: {question}

Let's think step by step to solve this problem."""
    
    result = generate_text(
        prompt=prompt,
        model=model,
        temperature=temperature
    )
    
    reasoning_text = result['text']
    final_answer = parse_final_answer(reasoning_text)
    tokens_used = result['usage']
    
    return reasoning_text, final_answer, tokens_used


def self_consistency(
    question: str,
    n: int = 5,
    model: str = "gpt-4",
    temperature: float = 0.7
) -> List[Dict]:
    """
    Self-consistency: Generate multiple reasoning chains and vote.
    
    Args:
        question: The problem to solve
        n: Number of parallel reasoning chains
        model: OpenAI model to use
        temperature: Sampling temperature (should be > 0 for diversity)
    
    Returns:
        List of trace dictionaries with reasoning, answer, votes
    """
    traces = []
    
    # Generate n independent reasoning chains
    for i in range(n):
        reasoning_text, final_answer, tokens_used = zero_shot_cot(
            question, model, temperature
        )
        traces.append({
            'trace_index': i,
            'reasoning_text': reasoning_text,
            'final_answer': final_answer,
            'tokens_used': tokens_used
        })
    
    # Count votes for each answer (normalized)
    answers = [t['final_answer'].lower().strip() for t in traces]
    vote_counts = Counter(answers)
    winning_answer = vote_counts.most_common(1)[0][0]
    
    # Add vote information to each trace
    for trace in traces:
        normalized_answer = trace['final_answer'].lower().strip()
        trace['votes'] = vote_counts[normalized_answer]
        trace['is_winner'] = (normalized_answer == winning_answer)
    
    return traces


def few_shot_cot(
    question: str,
    examples: List[Tuple[str, str]],
    model: str = "gpt-4",
    temperature: float = 0.0
) -> Tuple[str, str, int]:
    """
    Few-shot Chain-of-Thought with example reasoning chains.
    
    Args:
        question: The problem to solve
        examples: List of (question, reasoning_chain) tuples
        model: OpenAI model to use
        temperature: Sampling temperature
    
    Returns:
        Tuple of (reasoning_text, final_answer, tokens_used_dict)
    """
    # Build few-shot prompt
    few_shot_examples = "\n\n".join([
        f"Question: {q}\n{reasoning}" 
        for q, reasoning in examples
    ])
    
    prompt = f"""{few_shot_examples}

Question: {question}

Let's think step by step:"""
    
    result = generate_text(
        prompt=prompt,
        model=model,
        temperature=temperature
    )
    
    reasoning_text = result['text']
    final_answer = parse_final_answer(reasoning_text)
    tokens_used = result['usage']
    
    return reasoning_text, final_answer, tokens_used
