import requests
import json

BASE_URL = "http://localhost:8080"

def test_get_questions():
    print("Testing GET /api/lsat/questions...")
    try:
        response = requests.post(f"{BASE_URL}/api/lsat/questions", json={
            "dataset": "tasksource/lsat-ar",
            "count": 1
        })
        if response.status_code == 200:
            data = response.json()
            if "questions" in data and len(data["questions"]) > 0:
                q = data["questions"][0]
                print(f"✅ Successfully fetched {len(data['questions'])} questions")
                print(f"🔍 Question 1 Options: {q.get('options')}")
                if q.get('options') and len(q.get('options')) > 0:
                     print("✅ Options are present")
                     return q
                else:
                     print("❌ Options are missing or empty")
            else:
                print("❌ Response missing questions array")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    return None

def test_analyze(question):
    print("\nTesting POST /api/lsat/analyze...")
    try:
        response = requests.post(f"{BASE_URL}/api/lsat/analyze", json={
            "question_data": question
        })
        if response.status_code == 200:
            data = response.json()
            if "system_prompt" in data and "user_prompt" in data:
                print("✅ Successfully generated analysis prompt")
            else:
                print("❌ Response missing prompt data")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting LSAT Backend Verification")
    question = test_get_questions()
    if question:
        test_analyze(question)
