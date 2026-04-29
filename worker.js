export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // Rate limiting
    if (!globalThis.rateLimit) globalThis.rateLimit = {};

    const now = Date.now();
    const windowTime = 10000; // 10 seconds
    const maxRequests = 5;

    if (!globalThis.rateLimit[ip]) globalThis.rateLimit[ip] = [];

    globalThis.rateLimit[ip] = globalThis.rateLimit[ip].filter(
      (t) => now - t < windowTime
    );

    if (globalThis.rateLimit[ip].length >= maxRequests) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again soon." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    globalThis.rateLimit[ip].push(now);

    // AI endpoint
    if (url.pathname === "/analyze") {
      const text = url.searchParams.get("text") || "";

      if (!text.trim()) {
        return new Response(
          JSON.stringify({ error: "Text is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are an AI text analyzer.

Return ONLY valid JSON in this exact format:
{
  "sentiment": "positive | neutral | negative",
  "summary": "one short sentence",
  "advice": "one helpful human-like suggestion"
}

Do not include markdown.
Do not include extra text.
Keep it simple and natural.
              `,
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
      });

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || "{}";

      let analysis;
      try {
        analysis = JSON.parse(rawReply);
      } catch {
        analysis = {
          sentiment: "unknown",
          summary: rawReply,
          advice: "Try again with more specific text.",
        };
      }

      return new Response(
        JSON.stringify({
          input: text,
          analysis,
          metadata: {
            ip,
            timestamp: new Date().toISOString(),
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Frontend
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Edge AI Request Analyzer</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #0f172a;
      color: white;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 850px;
      padding: 24px;
    }

    .card {
      background: #111827;
      border: 1px solid #334155;
      border-radius: 22px;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    }

    .tag {
      display: inline-block;
      background: #1e293b;
      color: #93c5fd;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 34px;
      margin: 0 0 10px;
    }

    p {
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    textarea {
      width: 100%;
      height: 145px;
      border-radius: 16px;
      border: 1px solid #475569;
      background: #020617;
      color: white;
      padding: 16px;
      font-size: 16px;
      resize: none;
      outline: none;
      box-sizing: border-box;
    }

    button {
      width: 100%;
      margin-top: 16px;
      padding: 15px;
      border: none;
      border-radius: 16px;
      background: #2563eb;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    .results {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
      margin-top: 24px;
    }

    .result-box {
      background: #020617;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 18px;
    }

    .label {
      color: #93c5fd;
      font-size: 13px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      color: #e5e7eb;
      font-size: 16px;
      line-height: 1.5;
    }

    .footer {
      text-align: center;
      margin-top: 18px;
      color: #94a3b8;
      font-size: 13px;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="card">
      <div class="tag">Cloudflare Workers + OpenAI + Rate Limiting</div>

      <h1>Edge AI Request Analyzer</h1>

      <p>
        Analyze a message in real time using an AI-powered serverless API deployed on Cloudflare Workers.
      </p>

      <textarea id="text" placeholder="Example: I feel overwhelmed about internship applications..."></textarea>

      <button onclick="analyzeText()">Analyze Text</button>

      <div class="results">
        <div class="result-box">
          <div class="label">Sentiment</div>
          <div class="value" id="sentiment">Waiting for input...</div>
        </div>

        <div class="result-box">
          <div class="label">Summary</div>
          <div class="value" id="summary">Waiting for input...</div>
        </div>

        <div class="result-box">
          <div class="label">Advice</div>
          <div class="value" id="advice">Waiting for input...</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Built with Cloudflare Workers, OpenAI API, and edge request rate limiting.
    </div>
  </div>

  <script>
    async function analyzeText() {
      const text = document.getElementById("text").value;

      const sentiment = document.getElementById("sentiment");
      const summary = document.getElementById("summary");
      const advice = document.getElementById("advice");

      if (!text.trim()) {
        sentiment.textContent = "No input";
        summary.textContent = "Please enter a message first.";
        advice.textContent = "Type a sentence and try again.";
        return;
      }

      sentiment.textContent = "Analyzing...";
      summary.textContent = "Analyzing...";
      advice.textContent = "Analyzing...";

      try {
        const res = await fetch("/analyze?text=" + encodeURIComponent(text));
        const data = await res.json();

        if (data.error) {
          sentiment.textContent = "Error";
          summary.textContent = data.error;
          advice.textContent = "Please wait and try again.";
          return;
        }

        sentiment.textContent = data.analysis.sentiment || "Unknown";
        summary.textContent = data.analysis.summary || "No summary returned.";
        advice.textContent = data.analysis.advice || "No advice returned.";
      } catch (error) {
        sentiment.textContent = "Error";
        summary.textContent = "Something went wrong.";
        advice.textContent = "Please try again.";
      }
    }
  </script>
</body>
</html>
`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
