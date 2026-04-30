# cf_ai_edge_sentiment_analyzer

A serverless AI-powered application built using Cloudflare Workers that analyzes user messages in real time and returns structured sentiment, summary, and actionable advice.

## Live Demo
https://purple-unit-beeb.ke7787.workers.dev

---

## Features
- AI-powered text analysis using an LLM (OpenAI API)
- Global edge deployment using Cloudflare Workers
- Real-time user input via web interface
- Request rate limiting per user IP (security)
- Per-user memory (recent message history)

---

## AI Components
- **LLM**: OpenAI GPT model
- **Workflow**: Cloudflare Workers (serverless execution)
- **User Input**: Web UI (chat-style input)
- **Memory/State**: Per-user history stored in memory

---

## Example

Input:
"I feel stressed about interviews"

Output:
{
  "sentiment": "negative",
  "summary": "The user is feeling overwhelmed.",
  "advice": "Take a short break and focus on one step at a time."
}

---

## How to Run

### Option 1 (Live)
Open:
https://purple-unit-beeb.ke7787.workers.dev

### Option 2 (Deploy Yourself)
1. Create a Cloudflare Worker
2. Copy `worker.js` into the editor
3. Add environment variable:
   OPENAI_API_KEY = your API key
4. Deploy

---

## Tech Stack
- JavaScript
- Cloudflare Workers
- OpenAI API

---

## Notes
This project demonstrates building an AI-powered application at the edge with real-time processing, structured outputs, and basic state management.
