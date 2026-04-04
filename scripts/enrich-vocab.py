#!/usr/bin/env python3
"""Generate example sentences and full definitions for vocab words using AI."""
import json, os, time
import urllib.request

API_URL = "https://gru.ai/api/ai-proxy/openai/v1/chat/completions"
API_KEY = os.environ.get("AI_PROXY_KEY", "Z2g6dmFuZ2llOmdob19aUEtxTEU0MERGVzhJdEI1TXg2cDNMY2hsejlIQ0kwVk04RWI=")

def call_ai(words_batch):
    word_list = "\n".join([f"- {w['front']} ({w['back']})" for w in words_batch])
    
    prompt = f"""For each English word below, provide:
1. A simple example sentence suitable for a 7th grader (bold the target word with **word**)
2. Chinese translation of the sentence
3. Any additional common meanings beyond what's listed (keep concise)

Words:
{word_list}

Return a JSON array with objects like:
[
  {{
    "word": "travel",
    "example": "I love to **travel** around the world.",
    "exampleCn": "我喜欢环游世界。",
    "extraMeanings": ""
  }}
]

ONLY return the JSON array. No markdown wrapping."""

    payload = json.dumps({
        "model": "gpt-5.2",
        "messages": [
            {"role": "system", "content": "You are an English teaching assistant for Chinese middle school students. Keep examples simple and natural."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 4000
    }).encode()

    req = urllib.request.Request(API_URL, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    })

    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    
    content = data["choices"][0]["message"]["content"]
    # Strip markdown wrapping if present
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]
    return json.loads(content)

def main():
    with open("data/vocab-7b.json") as f:
        words = json.load(f)
    
    batches = [words[i:i+20] for i in range(0, len(words), 20)]
    all_results = []
    
    for i, batch in enumerate(batches):
        print(f"Processing batch {i+1}/{len(batches)}: {batch[0]['front']} ... {batch[-1]['front']}")
        try:
            results = call_ai(batch)
            all_results.extend(results)
            print(f"  ✅ Got {len(results)} results")
        except Exception as e:
            print(f"  ❌ Error: {e}")
            # Add empty entries as fallback
            for w in batch:
                all_results.append({
                    "word": w["front"],
                    "example": "",
                    "exampleCn": "",
                    "extraMeanings": ""
                })
        time.sleep(1)  # rate limit
    
    # Merge with original data
    example_map = {r["word"]: r for r in all_results}
    enriched = []
    for w in words:
        ex = example_map.get(w["front"], {})
        enriched.append({
            **w,
            "example": ex.get("example", ""),
            "exampleCn": ex.get("exampleCn", ""),
            "extraMeanings": ex.get("extraMeanings", "")
        })
    
    with open("data/vocab-7b-enriched.json", "w") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Done! {len(enriched)} words enriched → data/vocab-7b-enriched.json")
    with_examples = sum(1 for e in enriched if e["example"])
    print(f"   {with_examples}/{len(enriched)} have examples")

if __name__ == "__main__":
    main()
