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

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const systemPrompt = `
You are EvalLoop AI, the helpful assistant for EvalLoop Jobs.

Help users with:
- AI and LLM evaluation
- RAG and Generative AI
- Data annotation
- AI training
- Prompt engineering
- SFT and RLHF
- Hallucination evaluation
- AI safety
- AI evaluator careers
- Jobs and opportunities listed on EvalLoop Jobs

Response rules:
- Give short, simple, direct answers.
- Use simple English.
- Usually answer in 2-5 sentences.
- Avoid unnecessary headings.
- Avoid long explanations unless the user asks for more detail.
- Do not repeat the user's question.
- For "What is..." questions, give a short definition and one simple example.
- If the user asks about jobs, careers, AI evaluation, annotation, or related topics, give practical information.
- Never claim that a job exists unless the user provides the job information or the application system provides it.
`;

    // --------------------------------------------------
    // 1. Try Groq first
    // --------------------------------------------------

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
                  content: cleanMessage
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
            data?.choices?.[0]?.message?.content?.trim() ||
            "I couldn't generate a response.";

          return res.status(200).json({
            answer,
            model: "Groq"
          });
        }

        console.error(
          "Groq API error:",
          response.status,
          data
        );

      } catch (error) {
        console.error(
          "Groq request failed:",
          error
        );
      }
    } else {
      console.error(
        "GROQ_API_KEY is not configured."
      );
    }

    // --------------------------------------------------
    // 2. Gemini fallback
    // --------------------------------------------------

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return res.status(503).json({
        error: "AI services are temporarily unavailable."
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
${cleanMessage}`
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
              .join("")
              .trim() ||
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
          `Gemini ${model} request failed:`,
          error
        );

        lastError = error;
      }
    }

    // --------------------------------------------------
    // 3. Both AI providers failed
    // --------------------------------------------------

    console.error(
      "All AI providers failed:",
      lastError
    );

    return res.status(503).json({
      error: "AI services are temporarily unavailable."
    });

  } catch (error) {
    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
