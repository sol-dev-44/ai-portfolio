#!/usr/bin/env python3
"""
Generate AI images for dog breeds without photos
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env.local')

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_breeds_without_images():
    """Fetch all breeds that don't have image URLs"""
    print("📊 Fetching breeds without images from Supabase...")
    
    response = supabase.table('dog_breeds').select('breed_id, name, image_urls').execute()
    breeds = response.data
    
    breeds_without_images = [
        {'breed_id': b['breed_id'], 'name': b['name']} 
        for b in breeds 
        if not b.get('image_urls') or len(b.get('image_urls', [])) == 0
    ]
    
    print(f"✅ Found {len(breeds_without_images)} breeds without images")
    return breeds_without_images

def update_breed_with_local_image(breed_id: str, image_path: str):
    """Update breed in database with local image path"""
    try:
        # Update with local path - frontend will use this
        supabase.table('dog_breeds').update({
            'image_urls': [image_path]
        }).eq('breed_id', breed_id).execute()
        return True
    except Exception as e:
        print(f"❌ Error updating {breed_id}: {e}")
        return False

if __name__ == "__main__":
    breeds = get_breeds_without_images()
    
    print(f"\n📝 Breeds without images:")
    for i, breed in enumerate(breeds[:10], 1):
        print(f"  {i}. {breed['name']}")
    
    if len(breeds) > 10:
        print(f"  ... and {len(breeds) - 10} more")
    
    print(f"\n🎨 Ready to generate {len(breeds)} images")
    print("Note: Image generation will be handled by the main agent")
