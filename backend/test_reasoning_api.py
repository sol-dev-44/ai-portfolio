import requests
import os
from dotenv import load_dotenv

# Load env to get API key if needed (though we might hit local)
load_dotenv('.env.local')

BASE_URL = "http://localhost:8000"

def test_reasoning_run():
    print("Testing /api/reasoning/run...")
    payload = {
        "custom_question": "What is 2+2?",
        "strategy": "zero_shot_cot",
        "model": "gpt-4",
        "n_traces": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/reasoning/run", json=payload)
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"  Session ID: {data.get('session_id')}")
            print(f"  Problem Text: {data.get('problem_text')}")
            print(f"  Total Cost: ${data.get('total_cost')}")
            print(f"  Total Tokens: {data.get('total_tokens')}")
            
            if 'problem_text' in data and 'total_cost' in data:
                print("  ✅ New fields present")
            else:
                print("  ❌ Missing new fields")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_star_run():
    print("\nTesting /api/reasoning/star with gpt-4o-mini...")
    payload = {
        "custom_question": "What is 3+3?",
        "num_rounds": 2,
        "traces_per_round": 2,
        "model": "gpt-4o-mini"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/reasoning/star", json=payload)
        if response.status_code == 200:
            data = response.json()
            print("✅ Success (gpt-4o-mini)!")
            print(f"  Session ID: {data.get('session_id')}")
            print(f"  Total Cost: ${data.get('total_cost')}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_local_model():
    print("\nTesting /api/reasoning/run with local model...")
    payload = {
        "custom_question": "What is 5+5?",
        "strategy": "zero_shot_cot",
        "model": "local",
        "n_traces": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/reasoning/run", json=payload)
        if response.status_code == 200:
            data = response.json()
            print("✅ Success (local)!")
            print(f"  Reasoning: {data['traces'][0]['reasoning_text'][:50]}...")
            print(f"  Total Cost: ${data.get('total_cost')}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_reasoning_run()
    test_star_run()
    test_local_model()
