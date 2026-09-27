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

    const systemPrompt = `You are EvalLoop AI, the helpful assistant for EvalLoop Jobs.

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
- For simple "What is..." questions, give a short definition and one simple example.`;

    /*
     * =========================================================
     * 1. GROQ — PRIMARY
     * =========================================================
     */

    const groqApiKey = process.env.GROQ_API_KEY;

    if (groqApiKey) {
      try {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 8000);

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: message
                }
              ],
              max_completion_tokens: 500,
              temperature: 0.2,
              include_reasoning: false
            })
          }
        );

        clearTimeout(timeout);

        const data = await response.json();

        if (response.ok) {
          const answer =
            data?.choices?.[0]?.message?.content ||
            "I couldn't generate a response.";

          return res.status(200).json({
            answer,
            model: "Groq"
          });
        }

        console.error("Groq error:", response.status, data);

      } catch (error) {
        console.error("Groq request failed:", error);
      }
    } else {
      console.error("GROQ_API_KEY is not configured.");
    }

    /*
     * =========================================================
     * 2. GEMINI — SECONDARY FALLBACK
     * =========================================================
     */

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return res.status(503).json({
        error: "Both Groq and Gemini are unavailable."
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
              "x-goog-api-key": geminiApiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}

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
            model: `Gemini (${model})`
          });
        }

        console.error(
          `Gemini ${model} error:`,
          response.status,
          data
        );

        lastError = data;

        if (
          response.status === 429 ||
          response.status === 500 ||
          response.status === 503
        ) {
          continue;
        }

        return res.status(response.status).json({
          error: "Gemini API request failed"
        });

      } catch (error) {
        console.error(
          `Error with Gemini ${model}:`,
          error
        );

        lastError = error;
      }
    }

    return res.status(503).json({
      error: "Both Groq and Gemini are temporarily unavailable.",
      details: lastError
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
