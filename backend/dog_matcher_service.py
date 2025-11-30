"""
Backend service for Dog Breed Matcher
Handles breed matching logic, embeddings, and Supabase integration
"""

import os
from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from supabase import create_client, Client
from openai import OpenAI

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# OpenAI client for embeddings
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/dog-matcher", tags=["dog-matcher"])

# ============================================================================
# MODELS
# ============================================================================

class QuizAnswers(BaseModel):
    living_situation: str  # apartment, house-small-yard, house-large-yard, farm
    activity_level: str  # sedentary, moderate, active, very-active
    experience: str  # first-time, some-experience, experienced
    size_preference: str  # small, medium, large, any
    exercise_commitment: str  # 15min, 30-60min, 60-120min, 2plus-hours
    grooming_tolerance: str  # minimal, moderate, high
    shedding_tolerance: str  # minimal, moderate, heavy
    family_situation: str  # single, couple, kids-young, kids-older, other-pets
    temperament_preference: List[str]  # calm, playful, protective, independent, friendly, energetic
    training_commitment: str  # basic, moderate, extensive

class MatchRequest(BaseModel):
    quiz_answers: QuizAnswers
    top_k: int = 5

class BreedMatch(BaseModel):
    breed_id: str
    name: str
    description: str
    similarity_score: float
    match_reasons: List[str]
    image_url: str
    size_category: str
    breed_group: str
    temperament: List[str]
    energy_level: str

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI"""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

def build_user_profile_text(answers: QuizAnswers) -> str:
    """Convert quiz answers into a searchable text profile"""
    parts = []
    
    # Living situation
    living_map = {
        'apartment': 'Lives in an apartment, needs apartment-friendly breed',
        'house-small-yard': 'Has a house with small yard, moderate space',
        'house-large-yard': 'Has house with large yard, plenty of space',
        'farm': 'Lives on farm or acreage, lots of outdoor space'
    }
    parts.append(living_map.get(answers.living_situation, ''))
    
    # Activity level
    activity_map = {
        'sedentary': 'Low activity lifestyle, prefers calm indoor activities',
        'moderate': 'Moderately active, regular walks and some outdoor time',
        'active': 'Very active lifestyle, enjoys hiking and outdoor activities',
        'very-active': 'Extremely active, runs, hikes frequently'
    }
    parts.append(activity_map.get(answers.activity_level, ''))
    
    # Experience
    exp_map = {
        'first-time': 'First-time dog owner, needs trainable and easy-going breed',
        'some-experience': 'Has some dog experience, comfortable with moderate training',
        'experienced': 'Experienced dog owner, comfortable with challenging breeds'
    }
    parts.append(exp_map.get(answers.experience, ''))
    
    # Size preference
    if answers.size_preference != 'any':
        parts.append(f"Prefers {answers.size_preference} sized dogs")
    
    # Exercise commitment
    exercise_map = {
        '15min': 'Can provide 15 minutes of daily exercise, low exercise needs',
        '30-60min': 'Can provide 30-60 minutes daily exercise, moderate needs',
        '60-120min': 'Can provide 1-2 hours daily exercise, high energy tolerance',
        '2plus-hours': 'Can provide 2+ hours daily exercise, very high energy tolerance'
    }
    parts.append(exercise_map.get(answers.exercise_commitment, ''))
    
    # Grooming tolerance
    groom_map = {
        'minimal': 'Prefers low grooming needs, minimal maintenance',
        'moderate': 'Can handle moderate grooming requirements',
        'high': 'Willing to commit to high grooming needs'
    }
    parts.append(groom_map.get(answers.grooming_tolerance, ''))
    
    # Shedding tolerance
    shed_map = {
        'minimal': 'Needs minimal shedding, hypoallergenic preferred',
        'moderate': 'Can tolerate moderate shedding',
        'heavy': 'Okay with heavy shedding breeds'
    }
    parts.append(shed_map.get(answers.shedding_tolerance, ''))
    
    # Family situation
    family_map = {
        'single': 'Single person household',
        'couple': 'Couple without children',
        'kids-young': 'Family with young children, needs kid-friendly breed',
        'kids-older': 'Family with older children',
        'other-pets': 'Has other pets, needs pet-friendly breed'
    }
    parts.append(family_map.get(answers.family_situation, ''))
    
    # Temperament preferences
    if answers.temperament_preference:
        temps = ', '.join(answers.temperament_preference)
        parts.append(f"Seeking {temps} temperament")
    
    # Training commitment
    train_map = {
        'basic': 'Looking for naturally well-behaved, easy to train',
        'moderate': 'Willing to invest in moderate training',
        'extensive': 'Committed to extensive training, challenging breeds okay'
    }
    parts.append(train_map.get(answers.training_commitment, ''))
    
    return '. '.join(parts) + '.'

def calculate_match_reasons(user_answers: QuizAnswers, breed: Dict[str, Any]) -> List[str]:
    """Generate human-readable match reasons"""
    reasons = []
    
    # Size match
    if user_answers.size_preference != 'any':
        if breed.get('size_category', '').lower() == user_answers.size_preference:
            reasons.append(f"Perfect {user_answers.size_preference} size match")
    
    # Apartment friendly
    if user_answers.living_situation == 'apartment':
        if breed.get('apartment_friendly'):
            reasons.append("Apartment-friendly breed")
    
    # Good with kids
    if 'kids' in user_answers.family_situation:
        if breed.get('good_with_kids'):
            reasons.append("Great with children")
    
    # Good with pets
    if 'other-pets' in user_answers.family_situation:
        if breed.get('good_with_pets'):
            reasons.append("Gets along with other pets")
    
    # Energy match
    energy_fit = {
        'sedentary': ['Low'],
        'moderate': ['Low', 'Medium'],
        'active': ['Medium', 'High'],
        'very-active': ['High', 'Very High']
    }
    breed_energy = breed.get('energy_level', '')
    if breed_energy in energy_fit.get(user_answers.activity_level, []):
        reasons.append(f"{breed_energy} energy matches your lifestyle")
    
    # Shedding tolerance
    shed_match = {
        'minimal': ['Minimal', 'Low'],
        'moderate': ['Minimal', 'Low', 'Moderate'],
        'heavy': ['Minimal', 'Low', 'Moderate', 'Heavy']
    }
    breed_shedding = breed.get('shedding_level', '')
    if breed_shedding in shed_match.get(user_answers.shedding_tolerance, []):
        if breed.get('hypoallergenic') and user_answers.shedding_tolerance == 'minimal':
            reasons.append("Hypoallergenic breed")
        else:
            reasons.append(f"{breed_shedding} shedding fits your tolerance")
    
    # Temperament overlap
    user_temps = set(t.lower() for t in user_answers.temperament_preference)
    breed_temps = set(t.lower() for t in (breed.get('temperament') or []))
    overlap = user_temps & breed_temps
    if overlap:
        reasons.append(f"Matches your desired {', '.join(overlap)} temperament")
    
    # First time owner friendly
    if user_answers.experience == 'first-time':
        if breed.get('trainability') in ['High', 'Very High']:
            reasons.append("Highly trainable, great for first-time owners")
    
    return reasons

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/breeds")
async def get_all_breeds():
    """Get all available dog breeds"""
    try:
        response = supabase.table('dog_breeds').select('*').execute()
        return {
            "breeds": response.data,
            "count": len(response.data)
        }
    except Exception as e:
        return {"error": str(e)}, 500

@router.post("/match")
async def match_user_with_breeds(request: MatchRequest):
    """Match user with dog breeds based on quiz answers"""
    try:
        # Build user profile text
        profile_text = build_user_profile_text(request.quiz_answers)
        
        # Generate embedding
        profile_embedding = generate_embedding(profile_text)
        
        if not profile_embedding:
            return {"error": "Failed to generate embedding"}, 500
        
        # Semantic search
        response = supabase.rpc('match_dog_breeds', {
            'query_embedding': profile_embedding,
            'match_count': request.top_k
        }).execute()
        
        if not response.data:
            return {"matches": [], "message": "No matches found"}
        
        # Build match results with reasons
        matches = []
        for breed in response.data:
            match_reasons = calculate_match_reasons(request.quiz_answers, breed)
            
            # Get first image URL
            image_urls = breed.get('image_urls') or []
            image_url = image_urls[0] if image_urls else ''
            
            matches.append({
                "breed_id": breed['breed_id'],
                "name": breed['name'],
                "description": breed.get('description', ''),
                "similarity_score": round(breed['similarity'] * 100, 1),
                "match_reasons": match_reasons,
                "image_url": image_url,
                "size_category": breed.get('size_category', ''),
                "breed_group": breed.get('breed_group', ''),
                "temperament": breed.get('temperament', []),
                "energy_level": breed.get('energy_level', ''),
                "exercise_needs": breed.get('exercise_needs', ''),
                "grooming_needs": breed.get('grooming_needs', ''),
                "shedding_level": breed.get('shedding_level', ''),
                "apartment_friendly": breed.get('apartment_friendly'),
                "good_with_kids": breed.get('good_with_kids'),
                "good_with_pets": breed.get('good_with_pets'),
                "images": image_urls[:5]  # Top 5 images
            })
        
        # Store match in database for analytics
        try:
            supabase.table('user_matches').insert({
                'user_profile_text': profile_text,
                'user_profile_embedding': profile_embedding,
                'quiz_answers': request.quiz_answers.dict(),
                'top_matches': matches
            }).execute()
        except:
            pass  # Don't fail if analytics insert fails
        
        return {
            "matches": matches,
            "user_profile": profile_text
        }
        
    except Exception as e:
        print(f"Error in match endpoint: {e}")
        return {"error": str(e)}, 500

@router.get("/stats")
async def get_matcher_stats():
    """Get statistics about the dog matcher"""
    try:
        response = supabase.rpc('get_dog_matcher_stats').execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return {"total_breeds": 0, "breeds_with_embeddings": 0, "total_matches_performed": 0}
    except Exception as e:
        return {"error": str(e)}, 500
