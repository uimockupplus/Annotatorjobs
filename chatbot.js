/* =========================================================
   EVALLOOP JOBS - AI CHATBOT
   Text + Voice Input
   Voice output ONLY for voice-based prompts
   ========================================================= */

let evalLoopJobs = [];

const EVALLOOP_RESUME_EMAIL = "techultron2020@gmail.com";

/* =========================================================
   GMAIL HELPER
   ========================================================= */

function openEvalLoopGmail(subject = "", body = "") {
  const url =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    "&to=" +
    encodeURIComponent(EVALLOOP_RESUME_EMAIL) +
    "&su=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body);

  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================================
   LOAD JOBS
   ========================================================= */

async function loadEvalLoopJobs() {
  try {
    const response = await fetch("./opportunities.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Unable to load opportunities.json");
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      evalLoopJobs = data;
    } else {
      evalLoopJobs = [];
    }

    console.log(
      `EvalLoop AI: loaded ${evalLoopJobs.length} opportunities`
    );
  } catch (error) {
    console.error("EvalLoop jobs loading error:", error);
    evalLoopJobs = [];
  }
}

/* =========================================================
   CHATBOT HTML
   ========================================================= */

function createEvalLoopChatbot() {
  if (document.getElementById("evalbot")) {
    return;
  }

  const chatbotHTML = `
    <button
      id="evalbot-toggle"
      type="button"
      aria-label="Open EvalLoop AI"
      title="EvalLoop AI"
    >
      <span class="evalbot-toggle-icon">✦</span>
    </button>

    <div
      id="evalbot-label"
      aria-hidden="true"
    >
      EvalLoop AI
    </div>

    <section
      id="evalbot"
      aria-label="EvalLoop AI chatbot"
    >

      <div class="evalbot-header">

        <div class="evalbot-header-info">
          <div class="evalbot-avatar">
            ✦
          </div>

          <div>
            <div class="evalbot-title">
              EvalLoop AI
            </div>

            <div class="evalbot-status">
              AI Jobs & Career Assistant
            </div>
          </div>
        </div>

        <button
          id="evalbot-close"
          type="button"
          aria-label="Close chatbot"
          title="Close"
        >
          ×
        </button>

      </div>

      <div
        id="evalbot-messages"
        class="evalbot-messages"
      >

        <div class="evalbot-message bot-message">
          <div class="evalbot-message-bubble">
            Hi! 👋 I'm EvalLoop AI.

            <br><br>

            Ask me about AI jobs, LLM evaluation, data annotation,
            RAG, prompt engineering, AI training, or anything related
            to your AI career.
          </div>
        </div>

      </div>

      <div
        id="evalbot-typing"
        class="evalbot-typing"
        style="display:none;"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div
        id="evalbot-voice-status"
        class="evalbot-voice-status"
        style="display:none;"
      >
        Listening...
      </div>

      <div class="evalbot-suggestions">

        <button
          type="button"
          class="evalbot-suggestion"
          data-question="What AI jobs are available?"
        >
          🔎 AI jobs
        </button>

        <button
          type="button"
          class="evalbot-suggestion"
          data-question="What is LLM evaluation?"
        >
          🤖 LLM evaluation
        </button>

        <button
          type="button"
          class="evalbot-suggestion"
          data-question="How can I improve my AI evaluator career?"
        >
          💼 Career
        </button>

      </div>

      <div class="evalbot-input-area">

        <input
          id="evalbot-input"
          type="text"
          autocomplete="off"
          placeholder="Ask EvalLoop AI..."
          aria-label="Ask EvalLoop AI"
        />

        <button
          id="evalbot-mic"
          type="button"
          aria-label="Ask by voice"
          title="Ask by voice"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            aria-hidden="true"
          >
            <path
              d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              d="M18.5 10.5v.5a6.5 6.5 0 0 1-13 0v-.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />

            <path
              d="M12 17.5V21"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />

            <path
              d="M9 21h6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <button
          id="evalbot-send"
          type="button"
          aria-label="Send message"
          title="Send"
        >
          ➤
        </button>

      </div>

      <div class="evalbot-footer">
        Powered by EvalLoop AI
      </div>

    </section>
  `;

  document.body.insertAdjacentHTML(
    "beforeend",
    chatbotHTML
  );

  setupEvalLoopChatbotEvents();
}

/* =========================================================
   SETUP EVENTS
   ========================================================= */

function setupEvalLoopChatbotEvents() {
  const toggle = document.getElementById("evalbot-toggle");
  const close = document.getElementById("evalbot-close");
  const input = document.getElementById("evalbot-input");
  const send = document.getElementById("evalbot-send");
  const mic = document.getElementById("evalbot-mic");

  if (toggle) {
    toggle.addEventListener("click", () => {
      toggleEvalLoopChatbot(true);
    });
  }

  if (close) {
    close.addEventListener("click", () => {
      toggleEvalLoopChatbot(false);
    });
  }

  if (send) {
    send.addEventListener("click", () => {
      /*
       * IMPORTANT:
       * Typed messages are NOT voice messages.
       * Therefore the second argument is false.
       */
      sendEvalLoopMessage(null, false);
    });
  }

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        /*
         * Typed messages remain silent.
         */
        sendEvalLoopMessage(null, false);
      }
    });
  }

  document
    .querySelectorAll(".evalbot-suggestion")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const question =
          button.getAttribute("data-question");

        if (!question) {
          return;
        }

        /*
         * Suggestions are NOT voice prompts.
         */
        sendEvalLoopMessage(question, false);
      });
    });

  if (mic) {
    mic.addEventListener("click", () => {
      startEvalLoopVoiceInput();
    });
  }
}

/* =========================================================
   OPEN / CLOSE CHATBOT
   ========================================================= */

function toggleEvalLoopChatbot(open) {
  const chatbot = document.getElementById("evalbot");
  const label = document.getElementById("evalbot-label");

  if (!chatbot) {
    return;
  }

  if (open) {
    chatbot.style.display = "flex";

    if (label) {
      label.style.display = "none";
    }

    const input =
      document.getElementById("evalbot-input");

    if (input) {
      setTimeout(() => {
        input.focus();
      }, 100);
    }
  } else {
    chatbot.style.display = "none";

    if (label) {
      label.style.display = "block";
    }

    stopEvalLoopSpeech();
  }
}

/* =========================================================
   ADD MESSAGE
   ========================================================= */

function addEvalLoopMessage(
  text,
  sender = "bot"
) {
  const messages =
    document.getElementById("evalbot-messages");

  if (!messages) {
    return;
  }

  const wrapper =
    document.createElement("div");

  wrapper.className =
    sender === "user"
      ? "evalbot-message user-message"
      : "evalbot-message bot-message";

  const bubble =
    document.createElement("div");

  bubble.className =
    "evalbot-message-bubble";

  bubble.innerHTML =
    sender === "user"
      ? escapeEvalLoopHTML(text)
      : formatAIResponse(text);

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);

  messages.scrollTop =
    messages.scrollHeight;
}

/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function setEvalLoopTyping(show) {
  const typing =
    document.getElementById("evalbot-typing");

  if (!typing) {
    return;
  }

  typing.style.display =
    show ? "flex" : "none";

  if (show) {
    const messages =
      document.getElementById(
        "evalbot-messages"
      );

    if (messages) {
      messages.scrollTop =
        messages.scrollHeight;
    }
  }
}

/* =========================================================
   VOICE STATUS
   ========================================================= */

function setEvalLoopVoiceStatus(
  text,
  show = true
) {
  const status =
    document.getElementById(
      "evalbot-voice-status"
    );

  if (!status) {
    return;
  }

  status.textContent = text;
  status.style.display =
    show ? "block" : "none";
}

/* =========================================================
   MAIN MESSAGE FUNCTION
   ========================================================= */

/*
 * forcedQuestion:
 *   Used for suggestion buttons.
 *
 * fromVoice:
 *   TRUE  = user spoke using microphone.
 *   FALSE = typed/suggestion.
 *
 * This flag is the main fix that prevents
 * typed questions from being spoken aloud.
 */

async function sendEvalLoopMessage(
  forcedQuestion = null,
  fromVoice = false
) {
  const input =
    document.getElementById("evalbot-input");

  if (!input) {
    return;
  }

  const question =
    forcedQuestion !== null
      ? String(forcedQuestion).trim()
      : input.value.trim();

  if (!question) {
    return;
  }

  /*
   * Clear the text box.
   */
  if (forcedQuestion === null) {
    input.value = "";
  }

  /*
   * Add user's message.
   */
  addEvalLoopMessage(
    question,
    "user"
  );

  setEvalLoopTyping(true);

  try {
    /*
     * IMPORTANT:
     *
     * We explicitly pass fromVoice here.
     *
     * Typed question:
     * generateEvalLoopAnswer(question, false)
     *
     * Voice question:
     * generateEvalLoopAnswer(question, true)
     */
    const result =
      await generateEvalLoopAnswer(
        question,
        fromVoice
      );

    setEvalLoopTyping(false);

    if (!result) {
      addEvalLoopMessage(
        "Sorry, I couldn't generate a response.",
        "bot"
      );

      return;
    }

    if (result.answer) {
      addEvalLoopMessage(
        result.answer,
        "bot"
      );
    }

    /*
     * CRITICAL VOICE CONTROL
     *
     * The browser speaks ONLY when:
     *
     * result.speak === true
     *
     * and result.speak is set to true only
     * when the original request came through
     * the microphone.
     */
    if (
      result.speak === true &&
      result.aiResponse
    ) {
      speakEvalLoopAnswer(
        result.aiResponse
      );
    }

  } catch (error) {
    console.error(
      "EvalLoop message error:",
      error
    );

    setEvalLoopTyping(false);

    addEvalLoopMessage(
      "Sorry, something went wrong. Please try again.",
      "bot"
    );
  }
}

/* =========================================================
   GENERATE ANSWER
   ========================================================= */

async function generateEvalLoopAnswer(
  question,
  fromVoice = false
) {
  const normalized =
    normalizeText(question);

  /*
   * Greeting
   */
  if (
    /^(hi|hello|hey|hii|helo|good morning|good afternoon|good evening)$/i
      .test(normalized)
  ) {
    return {
      answer:
        "Hi! 👋 How can I help you today?",
      aiResponse:
        "Hi! How can I help you today?",
      speak: false
    };
  }

  /*
   * Resume request
   */
  if (
    normalized.includes("resume") &&
    (
      normalized.includes("send") ||
      normalized.includes("email") ||
      normalized.includes("mail")
    )
  ) {
    const answer = `
      I can help you send your resume.

      <br><br>

      <button
        type="button"
        class="evalbot-action-button"
        onclick="openEvalLoopGmail(
          'Resume - AI/LLM Evaluation Opportunities',
          'Hello,\\n\\nPlease find my resume attached for AI/LLM evaluation opportunities.\\n\\nRegards,\\nVivek'
        )"
      >
        📧 Email Resume
      </button>
    `;

    return {
      answer,
      aiResponse:
        "I can help you send your resume by email.",
      speak: false
    };
  }

  /*
   * Total jobs
   */
  if (
    normalized.includes("how many jobs") ||
    normalized.includes("how many opportunities") ||
    normalized.includes("total jobs") ||
    normalized.includes("total opportunities")
  ) {
    const count =
      evalLoopJobs.length;

    return {
      answer:
        `There are currently <strong>${count}</strong> opportunities listed on EvalLoop Jobs.`,
      aiResponse:
        `There are currently ${count} opportunities listed on EvalLoop Jobs.`,
      speak: false
    };
  }

  /*
   * Latest jobs
   */
  if (
    normalized.includes("latest jobs") ||
    normalized.includes("latest opportunities") ||
    normalized.includes("recent jobs") ||
    normalized.includes("new jobs")
  ) {
    const latest =
      evalLoopJobs.slice(0, 5);

    return {
      answer:
        formatEvalLoopJobs(latest),
      aiResponse:
        `I found ${latest.length} recent opportunities on EvalLoop Jobs.`,
      speak: false
    };
  }

  /*
   * Job search
   */
  if (isJobSearch(normalized)) {
    const jobs =
      searchEvalLoopJobs(question);

    if (jobs.length > 0) {
      return {
        answer:
          formatEvalLoopJobs(jobs),
        aiResponse:
          `I found ${jobs.length} matching opportunities.`,
        /*
         * Keep job-card results visual.
         * We don't read all job cards aloud.
         */
        speak: false
      };
    }

    return {
      answer:
        "I couldn't find a matching job in the current EvalLoop Jobs directory. Try keywords such as AI evaluator, LLM evaluation, data annotation, prompt engineering, or Telugu.",
      aiResponse:
        "I couldn't find a matching job in the current EvalLoop Jobs directory.",
      speak: false
    };
  }

  /*
   * General AI question
   */
  const ai =
    await askEvalLoopAI(question);

  /*
   * THIS IS THE IMPORTANT PART.
   *
   * If fromVoice = true:
   *   speak = true
   *
   * If fromVoice = false:
   *   speak = false
   */
  return {
    answer: ai.html,
    aiResponse: ai.text,
    speak: fromVoice
  };
}

/* =========================================================
   NORMALIZE TEXT
   ========================================================= */

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   DETECT JOB SEARCH
   ========================================================= */

function isJobSearch(text) {
  const keywords = [
    "job",
    "jobs",
    "opportunity",
    "opportunities",
    "hiring",
    "vacancy",
    "vacancies",
    "role",
    "roles",
    "position",
    "positions",
    "annotation",
    "annotator",
    "evaluator",
    "evaluation",
    "llm",
    "ai trainer",
    "prompt engineer",
    "data annotation",
    "remote job",
    "work from home"
  ];

  return keywords.some((keyword) =>
    text.includes(keyword)
  );
}

/* =========================================================
   SEARCH JOBS
   ========================================================= */

function searchEvalLoopJobs(query) {
  if (!Array.isArray(evalLoopJobs)) {
    return [];
  }

  const normalizedQuery =
    normalizeText(query);

  const words =
    normalizedQuery
      .split(" ")
      .filter(
        (word) => word.length >= 2
      );

  if (words.length === 0) {
    return [];
  }

  const scoredJobs =
    evalLoopJobs.map((job) => {
      const searchableText =
        normalizeText(
          [
            job.company,
            job.title,
            job.description,
            Array.isArray(job.tags)
              ? job.tags.join(" ")
              : job.tags,
            job.location,
            job.duration,
            job.highlight
          ]
            .filter(Boolean)
            .join(" ")
        );

      let score = 0;

      words.forEach((word) => {
        if (searchableText.includes(word)) {
          score += 1;
        }
      });

      /*
       * Extra weight for title/company matches.
       */
      const title =
        normalizeText(job.title || "");

      const company =
        normalizeText(job.company || "");

      words.forEach((word) => {
        if (title.includes(word)) {
          score += 3;
        }

        if (company.includes(word)) {
          score += 1;
        }
      });

      return {
        job,
        score
      };
    });

  return scoredJobs
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score
    )
    .slice(0, 8)
    .map((item) => item.job);
}

/* =========================================================
   ASK AI BACKEND
   ========================================================= */

async function askEvalLoopAI(question) {
  try {
    const response =
      await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message: question
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "AI request failed"
      );
    }

    const text =
      data?.answer ||
      "I couldn't generate a response.";

    return {
      text,
      html: formatAIResponse(text)
    };

  } catch (error) {
    console.error(
      "AI backend error:",
      error
    );

    const fallback =
      "Sorry, the AI service is temporarily unavailable. Please try again.";

    return {
      text: fallback,
      html: formatAIResponse(fallback)
    };
  }
}

/* =========================================================
   FORMAT AI RESPONSE
   ========================================================= */

function formatAIResponse(text) {
  if (!text) {
    return "";
  }

  let safe =
    escapeEvalLoopHTML(text);

  /*
   * Bold markdown
   */
  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  /*
   * Markdown bullets
   */
  safe = safe.replace(
    /^\s*[-*]\s+/gm,
    "• "
  );

  /*
   * New lines
   */
  safe = safe.replace(
    /\n/g,
    "<br>"
  );

  return safe;
}

/* =========================================================
   FORMAT JOB CARDS
   ========================================================= */

function formatEvalLoopJobs(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return `
      <div class="evalbot-empty">
        No matching opportunities found.
      </div>
    `;
  }

  return `
    <div class="evalbot-job-results">

      ${jobs
        .map((job) => {
          const company =
            escapeEvalLoopHTML(
              job.company || "Company"
            );

          const title =
            escapeEvalLoopHTML(
              job.title || "AI Opportunity"
            );

          const description =
            escapeEvalLoopHTML(
              job.description || ""
            );

          const location =
            escapeEvalLoopHTML(
              job.location || ""
            );

          const duration =
            escapeEvalLoopHTML(
              job.duration || ""
            );

          const highlight =
            escapeEvalLoopHTML(
              job.highlight || ""
            );

          const link =
            safeEvalLoopURL(
              job.link || ""
            );

          const email =
            safeEvalLoopEmail(
              job.email || ""
            );

          const whatsapp =
            safeEvalLoopWhatsApp(
              job.whatsapp || ""
            );

          return `
            <div class="evalbot-job-card">

              <div class="evalbot-job-company">
                ${company}
              </div>

              <div class="evalbot-job-title">
                ${title}
              </div>

              ${
                description
                  ? `
                    <div class="evalbot-job-description">
                      ${description}
                    </div>
                  `
                  : ""
              }

              ${
                location
                  ? `
                    <div class="evalbot-job-meta">
                      📍 ${location}
                    </div>
                  `
                  : ""
              }

              ${
                duration
                  ? `
                    <div class="evalbot-job-meta">
                      ⏱ ${duration}
                    </div>
                  `
                  : ""
              }

              ${
                highlight
                  ? `
                    <div class="evalbot-job-highlight">
                      ${highlight}
                    </div>
                  `
                  : ""
              }

              <div class="evalbot-job-actions">

                ${
                  link
                    ? `
                      <a
                        href="${link}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="evalbot-job-button"
                      >
                        Apply
                      </a>
                    `
                    : ""
                }

                ${
                  email
                    ? `
                      <a
                        href="mailto:${email}"
                        class="evalbot-job-button"
                      >
                        Email
                      </a>
                    `
                    : ""
                }

                ${
                  whatsapp
                    ? `
                      <a
                        href="${whatsapp}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="evalbot-job-button"
                      >
                        WhatsApp
                      </a>
                    `
                    : ""
                }

              </div>

            </div>
          `;
        })
        .join("")}

    </div>
  `;
}

/* =========================================================
   VOICE INPUT
   ========================================================= */

let evalLoopMediaRecorder = null;
let evalLoopAudioChunks = [];
let evalLoopRecording = false;

/*
 * Start microphone recording.
 *
 * IMPORTANT:
 * The resulting transcription is sent with:
 *
 * sendEvalLoopMessage(transcript, true)
 *
 * That TRUE tells the chatbot that the original
 * question came from voice.
 */

async function startEvalLoopVoiceInput() {
  if (evalLoopRecording) {
    stopEvalLoopVoiceInput();
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    alert(
      "Voice input is not supported by this browser."
    );

    return;
  }

  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    evalLoopAudioChunks = [];

    evalLoopMediaRecorder =
      new MediaRecorder(stream);

    evalLoopRecording = true;

    const mic =
      document.getElementById(
        "evalbot-mic"
      );

    if (mic) {
      mic.classList.add(
        "evalbot-mic-recording"
      );
    }

    setEvalLoopVoiceStatus(
      "Listening... speak now",
      true
    );

    evalLoopMediaRecorder.ondataavailable =
      (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          evalLoopAudioChunks.push(
            event.data
          );
        }
      };

    evalLoopMediaRecorder.onstop =
      async () => {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        const audioBlob =
          new Blob(
            evalLoopAudioChunks,
            {
              type:
                evalLoopMediaRecorder.mimeType ||
                "audio/webm"
            }
          );

        evalLoopRecording = false;

        if (mic) {
          mic.classList.remove(
            "evalbot-mic-recording"
          );
        }

        setEvalLoopVoiceStatus(
          "Processing voice...",
          true
        );

        await transcribeEvalLoopAudio(
          audioBlob
        );
      };

    evalLoopMediaRecorder.start();

    /*
     * Automatically stop after 30 seconds.
     */
    setTimeout(() => {
      if (evalLoopRecording) {
        stopEvalLoopVoiceInput();
      }
    }, 30000);

  } catch (error) {
    console.error(
      "Microphone error:",
      error
    );

    evalLoopRecording = false;

    setEvalLoopVoiceStatus(
      "",
      false
    );

    alert(
      "Microphone permission is required for voice input."
    );
  }
}

/* =========================================================
   STOP VOICE INPUT
   ========================================================= */

function stopEvalLoopVoiceInput() {
  if (
    evalLoopMediaRecorder &&
    evalLoopMediaRecorder.state !== "inactive"
  ) {
    evalLoopMediaRecorder.stop();
  }
}

/* =========================================================
   TRANSCRIBE AUDIO
   ========================================================= */

async function transcribeEvalLoopAudio(
  audioBlob
) {
  try {
    const formData =
      new FormData();

    formData.append(
      "audio",
      audioBlob,
      "voice.webm"
    );

    const response =
      await fetch(
        "/api/transcribe",
        {
          method: "POST",
          body: formData
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Transcription failed"
      );
    }

    const transcript =
      String(
        data?.text ||
        data?.transcript ||
        ""
      ).trim();

    if (!transcript) {
      setEvalLoopVoiceStatus(
        "I couldn't hear anything.",
        true
      );

      setTimeout(() => {
        setEvalLoopVoiceStatus(
          "",
          false
        );
      }, 2500);

      return;
    }

    /*
     * Put transcript into input so the user
     * can see what was understood.
     */
    const input =
      document.getElementById(
        "evalbot-input"
      );

    if (input) {
      input.value = transcript;
    }

    setEvalLoopVoiceStatus(
      "",
      false
    );

    /*
     * VERY IMPORTANT:
     *
     * TRUE = this was a voice prompt.
     *
     * Therefore the AI answer can be spoken.
     */
    await sendEvalLoopMessage(
      transcript,
      true
    );

  } catch (error) {
    console.error(
      "Voice transcription error:",
      error
    );

    setEvalLoopVoiceStatus(
      "",
      false
    );

    addEvalLoopMessage(
      "Sorry, I couldn't understand the voice input. Please try again.",
      "bot"
    );
  }
}

/* =========================================================
   TEXT TO SPEECH
   ========================================================= */

function speakEvalLoopAnswer(text) {
  /*
   * Safety check:
   * This function is only called when
   * result.speak === true.
   */

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  if (!text) {
    return;
  }

  stopEvalLoopSpeech();

  const cleanText =
    String(text)
      .replace(/<[^>]*>/g, " ")
      .replace(/\*\*/g, "")
      .replace(/[`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanText) {
    return;
  }

  const utterance =
    new SpeechSynthesisUtterance(
      cleanText
    );

  utterance.lang = "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

/* =========================================================
   STOP TEXT TO SPEECH
   ========================================================= */

function stopEvalLoopSpeech() {
  if (
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeEvalLoopHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   SAFE URL
   ========================================================= */

function safeEvalLoopURL(value) {
  try {
    const url =
      new URL(
        String(value || ""),
        window.location.origin
      );

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return escapeEvalLoopHTML(
        url.href
      );
    }

    return "";
  } catch {
    return "";
  }
}

/* =========================================================
   SAFE EMAIL
   ========================================================= */

function safeEvalLoopEmail(value) {
  const email =
    String(value || "").trim();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return "";
  }

  return escapeEvalLoopHTML(
    email
  );
}

/* =========================================================
   SAFE WHATSAPP
   ========================================================= */

function safeEvalLoopWhatsApp(value) {
  const raw =
    String(value || "").trim();

  if (!raw) {
    return "";
  }

  try {
    /*
     * Support both:
     * https://wa.me/...
     * https://api.whatsapp.com/...
     */
    const url =
      new URL(raw);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    if (
      !url.hostname.includes(
        "wa.me"
      ) &&
      !url.hostname.includes(
        "whatsapp.com"
      )
    ) {
      return "";
    }

    return escapeEvalLoopHTML(
      url.href
    );

  } catch {
    return "";
  }
}

/* =========================================================
   INITIALIZE CHATBOT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    createEvalLoopChatbot();

    await loadEvalLoopJobs();
  }
);
