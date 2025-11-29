from datasets import load_dataset

def inspect_dataset():
    try:
        print("Loading dataset...")
        dataset = load_dataset("tasksource/lsat-ar", split="train", streaming=True)
        print("Dataset loaded. Fetching first item...")
        item = next(iter(dataset))
        print("\n--- Item Structure ---")
        for key, value in item.items():
            print(f"{key}: {type(value)}")
            if isinstance(value, list):
                print(f"  Sample: {value}")
        print("----------------------\n")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_dataset()
