import requests
import json
import time
import sys

def test_stream():
    url = "http://localhost:8080/api/llm/generate_stream"
    payload = {
        "prompt": "Count from 1 to 10.",
        "max_new_tokens": 20,
        "model_id": "Qwen/Qwen2.5-1.5B-Instruct"
    }
    
    print(f"Connecting to {url}...")
    start_time = time.time()
    
    try:
        with requests.post(url, json=payload, stream=True) as r:
            print(f"Response status: {r.status_code}")
            if r.status_code != 200:
                print(r.text)
                return

            print("Stream started. Waiting for chunks...")
            first_chunk_time = None
            
            for line in r.iter_lines():
                if line:
                    now = time.time()
                    if first_chunk_time is None:
                        first_chunk_time = now
                        print(f"First chunk received after {first_chunk_time - start_time:.2f}s")
                    
                    try:
                        data = json.loads(line)
                        token = data.get("token", "")
                        sys.stdout.write(token)
                        sys.stdout.flush()
                    except:
                        print(f"\nError parsing: {line}")
            
            print(f"\n\nTotal time: {time.time() - start_time:.2f}s")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_stream()
