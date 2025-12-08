"""
LLM Engine
Shared module for managing model loading and text generation.
Supports both OpenAI API and local Hugging Face models.
"""

import os
import torch
from typing import Dict, Any, Optional, List, Union
from transformers import AutoTokenizer, AutoModelForCausalLM
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Global state for local model
LOCAL_MODEL = None
LOCAL_TOKENIZER = None
LOCAL_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

def initialize_local_model(model_id: str = LOCAL_MODEL_ID) -> Dict[str, Any]:
    """Initialize the local Hugging Face model."""
    global LOCAL_MODEL, LOCAL_TOKENIZER, LOCAL_MODEL_ID
    
    if LOCAL_MODEL is not None and LOCAL_MODEL_ID == model_id:
        return {
            "model": LOCAL_MODEL,
            "tokenizer": LOCAL_TOKENIZER,
            "device": LOCAL_MODEL.device,
            "id": model_id
        }
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    # MPS support for Mac
    if torch.backends.mps.is_available():
        device = "mps"
        
    print(f"🔄 Loading local model {model_id} on {device}...")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device != "cpu" else torch.float32,
            device_map="auto" if device != "cpu" else None
        )
        if device == "cpu":
            model = model.to(device)
            
        model.eval()
        
        LOCAL_MODEL = model
        LOCAL_TOKENIZER = tokenizer
        LOCAL_MODEL_ID = model_id
        
        print(f"✅ Local model loaded successfully")
        return {
            "model": model,
            "tokenizer": tokenizer,
            "device": device,
            "id": model_id
        }
    except Exception as e:
        print(f"❌ Failed to load local model: {e}")
        return None

def get_local_model():
    """Get the currently loaded local model, initializing if needed."""
    if LOCAL_MODEL is None:
        return initialize_local_model()
    return {
        "model": LOCAL_MODEL,
        "tokenizer": LOCAL_TOKENIZER,
        "device": LOCAL_MODEL.device,
        "id": LOCAL_MODEL_ID
    }

def generate_text(
    prompt: str, 
    model: str = "gpt-4", 
    temperature: float = 0.7,
    max_tokens: int = 1000,
    system_prompt: str = "You are a helpful AI assistant."
) -> Dict[str, Any]:
    """
    Generate text using either OpenAI or Local model.
    
    Returns:
        Dict with keys: 'text', 'usage' (dict with token counts)
    """
    
    # === Local Model ===
    if model.startswith("local") or "qwen" in model.lower():
        model_data = get_local_model()
        if not model_data:
            raise ValueError("Local model failed to load")
            
        tokenizer = model_data["tokenizer"]
        hf_model = model_data["model"]
        device = model_data["device"]
        
        # Format prompt for chat model if possible
        if hasattr(tokenizer, "apply_chat_template"):
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            text_input = tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
        else:
            text_input = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"
            
        inputs = tokenizer(text_input, return_tensors="pt").to(device)
        input_length = inputs.input_ids.shape[1]
        
        with torch.no_grad():
            outputs = hf_model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=max(0.01, temperature),
                do_sample=temperature > 0,
                top_p=0.9
            )
            
        output_length = outputs.shape[1]
        new_tokens = output_length - input_length
        
        generated_text = tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
        
        return {
            "text": generated_text,
            "usage": {
                "prompt_tokens": input_length,
                "completion_tokens": new_tokens,
                "total_tokens": output_length
            },
            "model": LOCAL_MODEL_ID
        }
        
    # === OpenAI Model ===
    else:
        # Map friendly names to actual API names if needed
        api_model = model
        if model == "gpt-4o-mini":
            api_model = "gpt-4o-mini"
        elif model == "gpt-4o":
            api_model = "gpt-4o"
            
        try:
            response = client.chat.completions.create(
                model=api_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return {
                "text": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "model": api_model
            }
        except Exception as e:
            print(f"OpenAI API Error: {e}")
            raise e
