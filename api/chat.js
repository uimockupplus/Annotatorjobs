export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured"
      });
    }

    const models = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite"
    ];

    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are EvalLoop AI, the helpful assistant for EvalLoop Jobs.

Help users with:
- AI and LLM evaluation
- RAG and generative AI
- Data annotation
- AI training
- Prompt engineering
- SFT and RLHF
- Hallucination evaluation
- AI safety
- AI evaluator careers
- Jobs and opportunities listed on EvalLoop Jobs

Give short, simple, direct answers.

Rules:
- Answer in 2-5 sentences by default.
- Use simple English.
- Avoid long explanations.
- Avoid unnecessary headings.
- Avoid long bullet lists.
- Give only the information needed to answer the question.
- If the user asks for more detail, then explain further.
- For simple "What is..." questions, give a short definition and one simple example.

User question:
${message}
User question:
${message}`
                    }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (response.ok) {
          const answer =
            data?.candidates?.[0]?.content?.parts
              ?.map(part => part.text || "")
              .join("") ||
            "I couldn't generate a response.";

          return res.status(200).json({
            answer,
            model
          });
        }

        console.error(`Gemini ${model} error:`, data);

        lastError = data;

        // Try the next model for temporary/unavailable errors
        if (
          response.status === 503 ||
          response.status === 429 ||
          response.status === 500
        ) {
          continue;
        }

        return res.status(response.status).json({
          error: "Gemini API request failed",
          details: data
        });

      } catch (error) {
        console.error(`Error with ${model}:`, error);
        lastError = error;
      }
    }

    return res.status(503).json({
      error: "All Gemini models are temporarily unavailable",
      details: lastError
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
