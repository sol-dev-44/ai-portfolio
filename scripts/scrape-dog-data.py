#!/usr/bin/env python3
"""
Dog Breed Data Scraper
Fetches breed data from dogapi.dog and images from dog.ceo
Creates comprehensive breed profiles and generates embeddings
"""

import asyncio
import aiohttp
import json
import os
import sys
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env.local')

# Configuration
DOGAPI_BASE = "https://dogapi.dog/api/v2"
DOGCEO_BASE = "https://dog.ceo/api"

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# OpenAI client for embeddings
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================================================
# API FETCHING
# ============================================================================

async def fetch_all_breeds(session: aiohttp.ClientSession) -> List[Dict[str, Any]]:
    """Fetch all breeds from dogapi.dog"""
    print("🐕 Fetching breed data from dogapi.dog...")
    
    breeds = []
    url = f"{DOGAPI_BASE}/breeds"
    
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            breeds = data.get('data', [])
            print(f"✅ Fetched {len(breeds)} breeds from dogapi.dog")
        else:
            print(f"❌ Error fetching breeds: {response.status}")
    
    return breeds

async def fetch_breed_groups(session: aiohttp.ClientSession) -> Dict[str, str]:
    """Fetch breed group mappings from dogapi.dog"""
    print("📋 Fetching breed groups...")
    
    groups = {}
    url = f"{DOGAPI_BASE}/groups"
    
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            group_data = data.get('data', [])
            for group in group_data:
                groups[group['id']] = group['attributes']['name']
            print(f"✅ Fetched {len(groups)} breed groups")
        else:
            print(f"⚠️  Could not fetch groups: {response.status}")
    
    return groups

async def fetch_dog_ceo_breeds(session: aiohttp.ClientSession) -> Dict[str, List[str]]:
    """Fetch breed list from dog.ceo API"""
    print("🖼️  Fetching breed list from dog.ceo...")
    
    url = f"{DOGCEO_BASE}/breeds/list/all"
    
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            breeds = data.get('message', {})
            print(f"✅ Fetched {len(breeds)} breed names from dog.ceo")
            return breeds
        else:
            print(f"❌ Error fetching dog.ceo breeds: {response.status}")
            return {}

async def fetch_breed_images(session: aiohttp.ClientSession, breed_name: str, max_images: int = 5) -> List[str]:
    """Fetch image URLs for a specific breed from dog.ceo"""
    # Normalize breed name for dog.ceo URL format
    breed_search = breed_name.lower().replace(' ', '-')
    
    # Try various name formats
    variations = [
        breed_search,
        breed_search.replace('-', ''),
        breed_search.split('-')[0] if '-' in breed_search else breed_search,
    ]
    
    for variant in variations:
        url = f"{DOGCEO_BASE}/breed/{variant}/images/random/{max_images}"
        
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('status') == 'success':
                        return data.get('message', [])
        except:
            continue
    
    return []

# ============================================================================
# DATA PROCESSING
# ============================================================================

def categorize_size(male_max: Optional[int], female_max: Optional[int]) -> str:
    """Categorize breed size based on weight"""
    if male_max is None and female_max is None:
        return "Medium"
    
    max_weight = max(male_max or 0, female_max or 0)
    
    if max_weight < 25:
        return "Small"
    elif max_weight < 60:
        return "Medium"
    else:
        return "Large"

def infer_attributes_from_description(description: str, name: str) -> Dict[str, Any]:
    """Infer behavioral attributes from breed description using keywords"""
    desc_lower = description.lower()
    name_lower = name.lower()
    
    attributes = {
        'temperament': [],
        'energy_level': 'Medium',
        'exercise_needs': 'Medium',
        'trainability': 'Medium',
        'apartment_friendly': None,
        'good_with_kids': None,
        'good_with_pets': None,
        'grooming_needs': 'Medium',
        'shedding_level': 'Moderate',
    }
    
    # Temperament keywords
    if any(word in desc_lower for word in ['intelligent', 'smart', 'clever']):
        attributes['temperament'].append('Intelligent')
    if any(word in desc_lower for word in ['loyal', 'devoted']):
        attributes['temperament'].append('Loyal')
    if any(word in desc_lower for word in ['friendly', 'affectionate', 'loving']):
        attributes['temperament'].append('Friendly')
    if any(word in desc_lower for word in ['energetic', 'active']):
        attributes['temperament'].append('Energetic')
    if any(word in desc_lower for word in ['playful']):
        attributes['temperament'].append('Playful')
    if any(word in desc_lower for word in ['protective', 'guard']):
        attributes['temperament'].append('Protective')
    if any(word in desc_lower for word in ['independent']):
        attributes['temperament'].append('Independent')
    if any(word in desc_lower for word in ['gentle', 'calm']):
        attributes['temperament'].append('Gentle')
    
    # Energy level
    if any(word in desc_lower for word in ['very energetic', 'highly active', 'very highly active']):
        attributes['energy_level'] = 'Very High'
    elif any(word in desc_lower for word in ['energetic', 'active', 'lively']):
        attributes['energy_level'] = 'High'
    elif any(word in desc_lower for word in ['calm', 'gentle', 'laid-back', 'quiet']):
        attributes['energy_level'] = 'Low'
    
    # Exercise needs
    if any(phrase in desc_lower for phrase in ['high exercise', 'plenty of exercise', 'lots of exercise']):
        attributes['exercise_needs'] = 'High'
    elif any(phrase in desc_lower for phrase in ['low exercise', 'minimal exercise']):
        attributes['exercise_needs'] = 'Low'
    
    # Trainability
    if any(word in desc_lower for word in ['intelligent', 'trainable', 'eager to please']):
        attributes['trainability'] = 'High'
    if any(word in desc_lower for word in ['stubborn', 'independent']):
        attributes['trainability'] = 'Medium'
    
    # Good with kids
    if any(phrase in desc_lower for phrase in ['good with children', 'good with kids', 'family', 'excellent family']):
        attributes['good_with_kids'] = True
    
    # Good with pets
    if any(phrase in desc_lower for phrase in ['good with other', 'good with pets']):
        attributes['good_with_pets'] = True
    
    # Apartment friendly (small breeds generally are)
    if 'small' in desc_lower or 'apartment' in desc_lower:
        attributes['apartment_friendly'] = True
    elif 'large' in desc_lower or 'space' in desc_lower:
        attributes['apartment_friendly'] = False
    
    # Grooming
    if any(word in desc_lower for word in ['long coat', 'thick coat', 'woolly', 'fluffy']):
        attributes['grooming_needs'] = 'High'
        attributes['shedding_level'] = 'Heavy'
    elif any(word in desc_lower for word in ['short coat', 'smooth coat']):
        attributes['grooming_needs'] = 'Low'
        attributes['shedding_level'] = 'Low'
    
    return attributes

def build_profile_text(breed_data: Dict[str, Any]) -> str:
    """Build rich text profile for embedding"""
    name = breed_data.get('name', '')
    description = breed_data.get('description', '')
    size = breed_data.get('size_category', '')
    group = breed_data.get('breed_group', '')
    temperament = breed_data.get('temperament', [])
    energy = breed_data.get('energy_level', '')
    exercise = breed_data.get('exercise_needs', '')
    apartment = breed_data.get('apartment_friendly')
    kids = breed_data.get('good_with_kids')
    pets = breed_data.get('good_with_pets')
    shedding = breed_data.get('shedding_level', '')
    grooming = breed_data.get('grooming_needs', '')
    hypoallergenic = breed_data.get('hypoallergenic', False)
    trainability = breed_data.get('trainability', '')
    
    parts = [f"{name}: {description}"]
    
    if size:
        parts.append(f"Size: {size}.")
    
    if group:
        parts.append(f"Breed group: {group}.")
    
    if temperament:
        parts.append(f"Temperament: {', '.join(temperament)}.")
    
    if energy:
        parts.append(f"Energy level: {energy}.")
    
    if exercise:
        parts.append(f"Exercise needs: {exercise}.")
    
    if trainability:
        parts.append(f"Trainability: {trainability}.")
    
    living_parts = []
    if apartment is not None:
        living_parts.append(f"{'Apartment friendly' if apartment else 'Needs space'}")
    if kids is not None:
        living_parts.append(f"{'Good with kids' if kids else 'Best without small children'}")
    if pets is not None:
        living_parts.append(f"{'Good with other pets' if pets else 'May not get along with other pets'}")
    
    if living_parts:
        parts.append(' and '.join(living_parts) + '.')
    
    grooming_parts = []
    if grooming:
        grooming_parts.append(f"{grooming} grooming needs")
    if shedding:
        grooming_parts.append(f"{shedding} shedding")
    if hypoallergenic:
        grooming_parts.append("hypoallergenic")
    
    if grooming_parts:
        parts.append(' with '.join([grooming_parts[0]] + grooming_parts[1:]) + '.')
    
    return ' '.join(parts)

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI"""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return []

# ============================================================================
# MAIN SCRAPER
# ============================================================================

async def scrape_and_process_breeds():
    """Main scraper function"""
    print("\n" + "="*60)
    print("🐕 DOG BREED DATA SCRAPER")
    print("="*60 + "\n")
    
    async with aiohttp.ClientSession() as session:
        # Fetch all data
        breeds = await fetch_all_breeds(session)
        groups = await fetch_breed_groups(session)
        dog_ceo_breeds = await fetch_dog_ceo_breeds(session)
        
        if not breeds:
            print("❌ No breeds fetched. Exiting.")
            return
        
        processed_breeds = []
        
        print(f"\n📝 Processing {len(breeds)} breeds...")
        
        for i, breed in enumerate(breeds, 1):
            attrs = breed.get('attributes', {})
            relationships = breed.get('relationships', {})
            
            breed_id = breed.get('id')
            name = attrs.get('name', '')
            description = attrs.get('description', '')
            
            # Get group name
            group_data = relationships.get('group', {}).get('data', {})
            group_id = group_data.get('id')
            breed_group = groups.get(group_id, 'Unknown')
            
            # Physical attributes
            life = attrs.get('life', {})
            male_weight = attrs.get('male_weight', {})
            female_weight = attrs.get('female_weight', {})
            
            size_category = categorize_size(
                male_weight.get('max'),
                female_weight.get('max')
            )
            
            # Infer behavioral attributes
            inferred = infer_attributes_from_description(description, name)
            
            # Build breed data
            breed_data = {
                'breed_id': breed_id,
                'name': name,
                'description': description,
                'size_category': size_category,
                'male_weight_min': male_weight.get('min'),
                'male_weight_max': male_weight.get('max'),
                'female_weight_min': female_weight.get('min'),
                'female_weight_max': female_weight.get('max'),
                'life_min': life.get('min'),
                'life_max': life.get('max'),
                'breed_group': breed_group,
                'temperament': inferred['temperament'],
                'energy_level': inferred['energy_level'],
                'exercise_needs': inferred['exercise_needs'],
                'trainability': inferred['trainability'],
                'apartment_friendly': inferred['apartment_friendly'],
                'good_with_kids': inferred['good_with_kids'],
                'good_with_pets': inferred['good_with_pets'],
                'grooming_needs': inferred['grooming_needs'],
                'shedding_level': inferred['shedding_level'],
                'hypoallergenic': attrs.get('hypoallergenic', False),
                'metadata': attrs
            }
            
            # Fetch images
            print(f"  [{i}/{len(breeds)}] Processing {name}... ", end='', flush=True)
            image_urls = await fetch_breed_images(session, name)
            breed_data['image_urls'] = image_urls
            print(f"({len(image_urls)} images)")
            
            # Build profile text
            breed_data['profile_text'] = build_profile_text(breed_data)
            
            processed_breeds.append(breed_data)
        
        # Generate embeddings
        print(f"\n🧮 Generating embeddings for {len(processed_breeds)} breeds...")
        for i, breed in enumerate(processed_breeds, 1):
            print(f"  [{i}/{len(processed_breeds)}] Embedding {breed['name']}...")
            embedding = generate_embedding(breed['profile_text'])
            breed['embedding'] = embedding
        
        # Upload to Supabase
        print(f"\n☁️  Uploading {len(processed_breeds)} breeds to Supabase...")
        
        for i, breed in enumerate(processed_breeds, 1):
            try:
                response = supabase.table('dog_breeds').upsert(
                    breed,
                    on_conflict='breed_id'
                ).execute()
                print(f"  [{i}/{len(processed_breeds)}] ✅ {breed['name']}")
            except Exception as e:
                print(f"  [{i}/{len(processed_breeds)}] ❌ Error uploading {breed['name']}: {e}")
        
        print("\n" + "="*60)
        print("✨ SCRAPING COMPLETE!")
        print("="*60)
        print(f"Total breeds processed: {len(processed_breeds)}")
        print(f"Breeds with images: {sum(1 for b in processed_breeds if b['image_urls'])}")
        print(f"Breeds with embeddings: {sum(1 for b in processed_breeds if b['embedding'])}")
        print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(scrape_and_process_breeds())
