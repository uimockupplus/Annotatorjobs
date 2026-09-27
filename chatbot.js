// EvalLoopjobs - AI + Job Search + Voice Chatbot

let evalLoopJobs = [];

let evalLoopConversation = [];

let evalLoopMediaRecorder = null;
let evalLoopAudioChunks = [];
let evalLoopIsRecording = false;

const EVALLOOP_RESUME_EMAIL =
  'techultron2020@gmail.com';


// =========================================================
// Gmail helpers
// =========================================================

function buildGmailComposeUrl({
  to,
  subject,
  body
}) {

  const params =
    new URLSearchParams({
      view: 'cm',
      fs: '1',
      to,
      su: subject,
      body
    });

  return `https://mail.google.com/mail/?${params.toString()}`;
}


function buildResumeGmailUrl() {

  return buildGmailComposeUrl({

    to: EVALLOOP_RESUME_EMAIL,

    subject:
      'Resume for personalized AI opportunities',

    body:
      'Hello,\n\nPlease find my resume attached.\n\n' +
      'Target role:\nPreferred location:\nWork type:\n\nThank you.'

  });

}


function resumeButtonHTML() {

  return `
    <div class="evalbot-resume-cta">

      <a
        href="${buildResumeGmailUrl()}"
        target="_blank"
        rel="noopener noreferrer"
      >
        📎 Send resume via Gmail ↗
      </a>

    </div>
  `;

}


// =========================================================
// Load jobs
// =========================================================

async function loadEvalLoopJobs() {

  try {

    const response =
      await fetch(
        './opportunities.json',
        {
          cache: 'no-store'
        }
      );


    if (!response.ok) {

      throw new Error(
        'Could not load opportunities.json'
      );

    }


    evalLoopJobs =
      await response.json();


    console.log(
      `EvalLoop chatbot loaded ${evalLoopJobs.length} opportunities.`
    );


  } catch (error) {

    console.error(
      'Chatbot job loading error:',
      error
    );

  }

}


// =========================================================
// Mic icon
// =========================================================

function evalLoopMicIcon() {

  return `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >

      <path
        d="M12 14.5C14.21 14.5 16 12.71 16 10.5V6.5C16 4.29 14.21 2.5 12 2.5C9.79 2.5 8 4.29 8 6.5V10.5C8 12.71 9.79 14.5 12 14.5Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <path
        d="M19 10.5C19 14.37 15.87 17.5 12 17.5C8.13 17.5 5 14.37 5 10.5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

      <path
        d="M12 17.5V21.5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

      <path
        d="M9 21.5H15"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

    </svg>
  `;

}


// =========================================================
// Chatbot UI
// =========================================================

function createEvalLoopChatbot() {

  const chatbotHTML = `

    <button
      id="evalbot-toggle"
      aria-label="Open EvalLoop AI"
      type="button"
    >

      <span class="evalbot-toggle-icon">
        ◉
      </span>

      <span class="evalbot-toggle-close">
        ×
      </span>

    </button>


    <div
      id="evalbot-label"
      aria-hidden="true"
    >

      EvalLoop AI

      <span class="evalbot-ai-dot"></span>

    </div>


    <div
      id="evalbot"
      role="dialog"
      aria-label="EvalLoop AI"
    >


      <div class="evalbot-header">

        <div class="evalbot-title">

          <div class="evalbot-icon">
            ◉
          </div>

          <div>

            <strong>
              EvalLoop AI
            </strong>

            <small>
              AI & Job Assistant
            </small>

          </div>

        </div>


        <button
          id="evalbot-close"
          aria-label="Close assistant"
          type="button"
        >
          ×
        </button>

      </div>


      <div id="evalbot-messages">

        <div class="evalbot-message evalbot-bot">

          Hi! I'm <strong>EvalLoop AI</strong> 🚀

          <br><br>

          I can answer AI/LLM questions and help you find opportunities from the directory.

          <div class="evalbot-suggestions">

            <button
              class="evalbot-suggestion"
              data-question="What is LLM evaluation?"
              type="button"
            >
              What is LLM evaluation?
            </button>


            <button
              class="evalbot-suggestion"
              data-question="Show me remote jobs"
              type="button"
            >
              Remote jobs
            </button>


            <button
              class="evalbot-suggestion"
              data-question="Show LLM evaluation jobs"
              type="button"
            >
              LLM jobs
            </button>


            <button
              class="evalbot-suggestion"
              data-question="Show jobs for freshers"
              type="button"
            >
              Fresher jobs
            </button>


            <button
              class="evalbot-suggestion"
              data-question="Show data annotation jobs"
              type="button"
            >
              Annotation jobs
            </button>


            <button
              class="evalbot-suggestion"
              data-question="Send my resume"
              type="button"
            >
              Send my resume
            </button>

          </div>

        </div>

      </div>


      <div class="evalbot-quick-actions">

        <a
          href="${buildResumeGmailUrl()}"
          target="_blank"
          rel="noopener noreferrer"
          class="evalbot-resume-pin"
        >
          📎 Send resume for personalized recommendations
        </a>

      </div>


      <div class="evalbot-input-area">

        <input
          id="evalbot-input"
          type="text"
          placeholder="Ask anything about AI or jobs…"
          autocomplete="off"
        />


        <button
          id="evalbot-mic"
          aria-label="Start voice input"
          title="Voice input"
          type="button"
        >
          ${evalLoopMicIcon()}
        </button>


        <button
          id="evalbot-send"
          aria-label="Send message"
          type="button"
        >
          ↗
        </button>


        <div
          id="evalbot-voice-status"
          class="evalbot-voice-status"
        ></div>

      </div>

    </div>

  `;


  document.body.insertAdjacentHTML(
    'beforeend',
    chatbotHTML
  );


  const toggle =
    document.getElementById(
      'evalbot-toggle'
    );


  const closeBtn =
    document.getElementById(
      'evalbot-close'
    );


  const chatbot =
    document.getElementById(
      'evalbot'
    );


  const label =
    document.getElementById(
      'evalbot-label'
    );


  const input =
    document.getElementById(
      'evalbot-input'
    );


  const send =
    document.getElementById(
      'evalbot-send'
    );


  const mic =
    document.getElementById(
      'evalbot-mic'
    );


  toggle.addEventListener(
    'click',
    () => {

      const isOpen =
        chatbot.classList.toggle(
          'open'
        );


      toggle.classList.toggle(
        'open',
        isOpen
      );


      toggle.setAttribute(
        'aria-label',
        isOpen
          ? 'Close EvalLoop AI'
          : 'Open EvalLoop AI'
      );


      setEvalLoopChatOpen(
        isOpen
      );


      if (isOpen) {
        input.focus();
      }

    }
  );


  closeBtn.addEventListener(
    'click',
    () => {

      if (
        evalLoopIsRecording
      ) {
        stopEvalLoopRecording();
      }


      chatbot.classList.remove(
        'open'
      );


      toggle.classList.remove(
        'open'
      );


      toggle.setAttribute(
        'aria-label',
        'Open EvalLoop AI'
      );


      setEvalLoopChatOpen(
        false
      );

    }
  );


  send.addEventListener(
    'click',
    sendEvalLoopMessage
  );


  input.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Enter'
      ) {

        event.preventDefault();

        sendEvalLoopMessage();

      }

    }
  );


  mic.addEventListener(
    'click',
    toggleEvalLoopRecording
  );


  document.addEventListener(
    'click',
    event => {

      if (
        event.target.classList.contains(
          'evalbot-suggestion'
        )
      ) {

        const question =
          event.target.dataset.question;


        input.value =
          question;


        sendEvalLoopMessage();

      }

    }
  );


  startEvalLoopLabelLoop(
    label
  );

}


// =========================================================
// Label
// =========================================================

let evalLoopChatIsOpen = false;


function setEvalLoopChatOpen(
  isOpen
) {

  evalLoopChatIsOpen =
    isOpen;


  const label =
    document.getElementById(
      'evalbot-label'
    );


  if (
    isOpen &&
    label
  ) {

    label.classList.remove(
      'show'
    );

  }

}


function startEvalLoopLabelLoop(
  label
) {

  if (!label) return;


  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  const SHOW_MS =
    35000;


  const HIDE_MS =
    1000;


  if (reducedMotion) {

    label.classList.add(
      'show'
    );

    return;

  }


  function cycle() {

    if (!evalLoopChatIsOpen) {

      label.classList.add(
        'show'
      );

    }


    setTimeout(
      () => {

        label.classList.remove(
          'show'
        );


        setTimeout(
          cycle,
          HIDE_MS
        );

      },
      SHOW_MS
    );

  }


  setTimeout(
    cycle,
    1500
  );

}


// =========================================================
// Send message
// =========================================================

async function sendEvalLoopMessage(
  forcedQuestion = null
) {

  const input =
    document.getElementById(
      'evalbot-input'
    );


  const question =
    forcedQuestion !== null
      ? String(
          forcedQuestion
        ).trim()
      : input.value.trim();


  if (!question) {
    return;
  }


  addEvalLoopMessage(
    escapeEvalLoopHTML(
      question
    ),
    'user'
  );


  input.value =
    '';


  const typing =
    showEvalLoopTyping();


  try {

    const result =
      await generateEvalLoopAnswer(
        question
      );


    typing.remove();


    addEvalLoopMessage(
      result.answer,
      'bot'
    );


    if (
      result.aiResponse
    ) {

      evalLoopConversation.push({

        role: 'user',

        content:
          question

      });


      evalLoopConversation.push({

        role: 'assistant',

        content:
          result.aiResponse

      });

    }


    if (
      result.speak &&
      result.aiResponse
    ) {

      speakEvalLoopAnswer(
        result.aiResponse
      );

    }


  } catch (error) {

    console.error(
      'EvalLoop AI error:',
      error
    );


    typing.remove();


    addEvalLoopMessage(
      `
        Sorry, I couldn't process that request right now.
        <br><br>
        Please try again.
      `,
      'bot'
    );

  }

}


// =========================================================
// Message rendering
// =========================================================

function addEvalLoopMessage(
  content,
  type
) {

  const messages =
    document.getElementById(
      'evalbot-messages'
    );


  const message =
    document.createElement(
      'div'
    );


  message.className =
    `evalbot-message evalbot-${type}`;


  message.innerHTML =
    content;


  messages.appendChild(
    message
  );


  messages.scrollTop =
    messages.scrollHeight;


  return message;

}


function showEvalLoopTyping() {

  const messages =
    document.getElementById(
      'evalbot-messages'
    );


  const typing =
    document.createElement(
      'div'
    );


  typing.className =
    'evalbot-message evalbot-bot evalbot-typing';


  typing.innerHTML =
    '<span></span><span></span><span></span>';


  messages.appendChild(
    typing
  );


  messages.scrollTop =
    messages.scrollHeight;


  return typing;

}


// =========================================================
// Voice status
// =========================================================

function setEvalLoopVoiceStatus(
  text,
  visible = true,
  state = ''
) {

  const status =
    document.getElementById(
      'evalbot-voice-status'
    );


  if (!status) return;


  status.textContent =
    text;


  status.className =
    'evalbot-voice-status';


  if (state) {

    status.classList.add(
      state
    );

  }


  if (visible) {

    status.classList.add(
      'show'
    );

  }

}


// =========================================================
// Start / stop recording
// =========================================================

async function toggleEvalLoopRecording() {

  if (
    evalLoopIsRecording
  ) {

    stopEvalLoopRecording();

    return;

  }


  await startEvalLoopRecording();

}


async function startEvalLoopRecording() {

  const mic =
    document.getElementById(
      'evalbot-mic'
    );


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    addEvalLoopMessage(
      'Voice input is not supported in this browser.',
      'bot'
    );

    return;

  }


  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });


    evalLoopAudioChunks =
      [];


    let mimeType =
      '';


    if (
      MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus'
      )
    ) {

      mimeType =
        'audio/webm;codecs=opus';

    } else if (
      MediaRecorder.isTypeSupported(
        'audio/webm'
      )
    ) {

      mimeType =
        'audio/webm';

    }


    evalLoopMediaRecorder =
      mimeType
        ? new MediaRecorder(
            stream,
            {
              mimeType
            }
          )
        : new MediaRecorder(
            stream
          );


    evalLoopMediaRecorder.addEventListener(
      'dataavailable',
      event => {

        if (
          event.data &&
          event.data.size > 0
        ) {

          evalLoopAudioChunks.push(
            event.data
          );

        }

      }
    );


    evalLoopMediaRecorder.addEventListener(
      'stop',
      async () => {

        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );


        const blob =
          new Blob(
            evalLoopAudioChunks,
            {
              type:
                evalLoopMediaRecorder.mimeType ||
                'audio/webm'
            }
          );


        await transcribeEvalLoopAudio(
          blob
        );

      }
    );


    evalLoopMediaRecorder.start();


    evalLoopIsRecording =
      true;


    mic.classList.add(
      'recording'
    );


    mic.setAttribute(
      'aria-label',
      'Stop voice recording'
    );


    mic.setAttribute(
      'title',
      'Stop recording'
    );


    setEvalLoopVoiceStatus(
      'Listening…',
      true,
      'recording'
    );


  } catch (error) {

    console.error(
      'Microphone error:',
      error
    );


    addEvalLoopMessage(
      `
        Microphone access was blocked.
        Please allow microphone access and try again.
      `,
      'bot'
    );

  }

}


function stopEvalLoopRecording() {

  if (
    !evalLoopMediaRecorder ||
    !evalLoopIsRecording
  ) {

    return;

  }


  evalLoopIsRecording =
    false;


  const mic =
    document.getElementById(
      'evalbot-mic'
    );


  mic.classList.remove(
    'recording'
  );


  mic.classList.add(
    'processing'
  );


  mic.setAttribute(
    'aria-label',
    'Processing voice input'
  );


  mic.setAttribute(
    'title',
    'Processing…'
  );


  setEvalLoopVoiceStatus(
    'Transcribing…',
    true
  );


  evalLoopMediaRecorder.stop();

}


// =========================================================
// Transcription
// =========================================================

async function transcribeEvalLoopAudio(
  audioBlob
) {

  const mic =
    document.getElementById(
      'evalbot-mic'
    );


  try {

    const formData =
      new FormData();


    formData.append(
      'audio',
      audioBlob,
      'evalloop-voice.webm'
    );


    const response =
      await fetch(
        '/api/transcribe',
        {
          method: 'POST',
          body: formData
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data?.error ||
        'Transcription failed'
      );

    }


    const transcript =
      String(
        data?.text || ''
      ).trim();


    if (!transcript) {

      throw new Error(
        'No speech detected'
      );

    }


    setEvalLoopVoiceStatus(
      'Sending…',
      true
    );


    await sendEvalLoopMessage(
      transcript
    );


  } catch (error) {

    console.error(
      'Voice transcription error:',
      error
    );


    addEvalLoopMessage(
      `
        I couldn't understand that audio.
        Please try speaking again.
      `,
      'bot'
    );


  } finally {

    evalLoopAudioChunks =
      [];


    if (mic) {

      mic.classList.remove(
        'processing'
      );


      mic.setAttribute(
        'aria-label',
        'Start voice input'
      );


      mic.setAttribute(
        'title',
        'Voice input'
      );

    }


    setEvalLoopVoiceStatus(
      '',
      false
    );

  }

}


// =========================================================
// Browser speech output
// =========================================================

function speakEvalLoopAnswer(
  text
) {

  if (
    !('speechSynthesis' in window)
  ) {

    return;

  }


  const cleanText =
    String(text || '')
      .replace(
        /[*#_`]/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();


  if (!cleanText) {
    return;
  }


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      cleanText
    );


  utterance.rate =
    1;


  utterance.pitch =
    1;


  utterance.volume =
    1;


  window.speechSynthesis.speak(
    utterance
  );

}


// =========================================================
// Normalize
// =========================================================

function normalizeText(
  text
) {

  return String(
    text || ''
  )
    .toLowerCase()
    .replace(
      /[^\w\s₹.-]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

}


// =========================================================
// Job search
// =========================================================

function searchEvalLoopJobs(
  question
) {

  const q =
    normalizeText(
      question
    );


  if (
    !evalLoopJobs.length
  ) {

    return [];

  }


  const words =
    q.split(' ')
      .filter(
        word =>
          word.length > 2
      );


  const scoredJobs =
    evalLoopJobs.map(
      job => {

        const searchableText =
          normalizeText(
            [
              job.company,
              job.title,
              job.description,
              job.location,
              job.duration,
              job.highlight,
              ...(job.tags || [])
            ].join(' ')
          );


        let score =
          0;


        words.forEach(
          word => {

            if (
              searchableText.includes(
                word
              )
            ) {

              score += 1;

            }

          }
        );


        const boosts = [

          ['remote', 'remote'],

          [
            'work from home',
            'work from home'
          ],

          ['llm', 'llm'],

          [
            'annotation',
            'annotation'
          ],

          [
            'evaluation',
            'evaluation'
          ],

          [
            'ai evaluator',
            'evaluation'
          ],

          [
            'hyderabad',
            'hyderabad'
          ],

          [
            'chennai',
            'chennai'
          ],

          [
            'pune',
            'pune'
          ],

          [
            'bangalore',
            'bangalore'
          ],

          [
            'bengaluru',
            'bengaluru'
          ]

        ];


        boosts.forEach(
          ([trigger, match]) => {

            if (
              q.includes(trigger) &&
              searchableText.includes(match)
            ) {

              score += 5;

            }

          }
        );


        if (
          q.includes('fresher') ||
          q.includes('freshers')
        ) {

          if (
            searchableText.includes(
              'fresher'
            )
          ) {

            score += 5;

          }

        }


        return {
          job,
          score
        };

      }
    );


  return scoredJobs

    .filter(
      item =>
        item.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    )

    .slice(
      0,
      5
    )

    .map(
      item =>
        item.job
    );

}


// =========================================================
// Job detection
// =========================================================

function isJobSearch(
  question
) {

  const q =
    normalizeText(
      question
    );


  const jobKeywords = [

    'job',
    'jobs',
    'opportunity',
    'opportunities',
    'hiring',
    'vacancy',
    'vacancies',
    'role',
    'roles',
    'apply',
    'application',
    'remote job',
    'fresher job',
    'annotation job',
    'llm job',
    'evaluation job',
    'latest jobs',
    'recent jobs',
    'show jobs',
    'find jobs'

  ];


  return jobKeywords.some(
    keyword =>
      q.includes(keyword)
  );

}


// =========================================================
// Ask AI
// =========================================================

async function askEvalLoopAI(
  question
) {

  const response =
    await fetch(
      '/api/chat',
      {

        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify({

            message:
              question,

            history:
              evalLoopConversation.slice(
                -12
              )

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      `API request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  if (!data.answer) {

    throw new Error(
      'No AI response received'
    );

  }


  return {

    html:
      formatAIResponse(
        data.answer
      ),

    text:
      data.answer

  };

}


// =========================================================
// Format AI
// =========================================================

function formatAIResponse(
  text
) {

  let safeText =
    escapeEvalLoopHTML(
      text
    );


  safeText =
    safeText.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    );


  safeText =
    safeText.replace(
      /\n/g,
      '<br>'
    );


  return safeText;

}


// =========================================================
// Generate answer
// =========================================================

async function generateEvalLoopAnswer(
  question
) {

  const q =
    normalizeText(
      question
    );


  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes(
      'hello chatbot'
    )
  ) {

    return {

      answer: `
        Hello! 👋
        <br><br>
        I'm <strong>EvalLoop AI</strong>.
        I can answer AI/LLM questions and help you find opportunities.
        <br><br>
        Try asking:
        <br><br>
        • What is LLM evaluation?<br>
        • What is RLHF?<br>
        • What is SFT?<br>
        • Show remote AI jobs<br>
        • Find LLM evaluation jobs
      `,

      aiResponse:
        null,

      speak:
        false

    };

  }


  if (
    q.includes('resume') ||
    q.includes('cv') ||
    q.includes('personalized') ||
    q.includes('personal recommendation') ||
    q.includes('recommend jobs for me') ||
    q.includes('recommend me')
  ) {

    return {

      answer: `
        Send your resume and I'll pass along your preferred role, location, and work type — we'll use that to curate more relevant opportunities for you.
        ${resumeButtonHTML()}
      `,

      aiResponse:
        null,

      speak:
        false

    };

  }


  if (
    q.includes('how many jobs') ||
    q.includes('how many opportunities') ||
    q.includes('total jobs')
  ) {

    return {

      answer: `
        Right now there are
        <strong>${evalLoopJobs.length}</strong>
        opportunities in the directory.
      `,

      aiResponse:
        null,

      speak:
        false

    };

  }


  if (
    q.includes('latest') ||
    q.includes('recent') ||
    q.includes('new jobs')
  ) {

    const latest =
      [...evalLoopJobs]
        .sort(
          (a, b) =>
            String(
              b.postedAt || ''
            ).localeCompare(
              String(
                a.postedAt || ''
              )
            )
        )
        .slice(
          0,
          5
        );


    return {

      answer:
        formatEvalLoopJobs(
          latest,
          'Here are the most recent opportunities:'
        ),

      aiResponse:
        null,

      speak:
        false

    };

  }


  if (
    isJobSearch(question)
  ) {

    const results =
      searchEvalLoopJobs(
        question
      );


    if (
      results.length
    ) {

      return {

        answer:
          formatEvalLoopJobs(
            results,
            `Found ${results.length} matching opportunit${results.length === 1 ? 'y' : 'ies'}:`
          ),

        aiResponse:
          null,

        speak:
          false

      };

    }


    return {

      answer: `
        I couldn't find an exact match in the current EvalLoop Jobs directory.
        <br><br>
        Try:
        <br><br>
        • Show remote jobs<br>
        • Find LLM evaluation jobs<br>
        • Show annotation jobs<br>
        • Show fresher jobs<br>
        • Show latest jobs
      `,

      aiResponse:
        null,

      speak:
        false

    };

  }


  const ai =
    await askEvalLoopAI(
      question
    );


  return {

    answer:
      ai.html,

    aiResponse:
      ai.text,

    speak:
      true

  };

}


// =========================================================
// Job cards
// =========================================================

function formatEvalLoopJobs(
  jobs,
  heading
) {

  let html =
    escapeEvalLoopHTML(
      heading
    );


  jobs.forEach(
    job => {

      const tags =
        (job.tags || [])
          .slice(
            0,
            3
          )
          .map(
            tag =>
              `<span>${escapeEvalLoopHTML(tag)}</span>`
          )
          .join('');


      const actions =
        [];


      if (job.link) {

        actions.push(
          `<a href="${escapeAttribute(job.link)}" target="_blank" rel="noopener noreferrer">Apply ↗</a>`
        );

      }


      if (job.email) {

        const subject =
          encodeURIComponent(
            `Application for ${job.title || 'the role'}`
          );


        actions.push(
          `<a href="mailto:${escapeAttribute(job.email)}?subject=${subject}">Email CV ✉</a>`
        );

      }


      if (job.whatsapp) {

        actions.push(
          `<a href="https://wa.me/${escapeAttribute(job.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>`
        );

      }


      html += `

        <div class="evalbot-job">

          <strong>
            ${escapeEvalLoopHTML(
              job.title ||
              'Opportunity'
            )}
          </strong>


          <small>
            ${escapeEvalLoopHTML(
              job.company ||
              'Company not specified'
            )}
          </small>


          <small>
            📍
            ${escapeEvalLoopHTML(
              job.location ||
              'Location not specified'
            )}
          </small>


          ${
            job.highlight
              ? `
                <small>
                  💰
                  ${escapeEvalLoopHTML(
                    job.highlight
                  )}
                </small>
              `
              : ''
          }


          ${
            tags
              ? `
                <div class="evalbot-job-tags">
                  ${tags}
                </div>
              `
              : ''
          }


          ${
            actions.length
              ? `
                <div class="evalbot-job-actions">
                  ${actions.join('')}
                </div>
              `
              : ''
          }

        </div>

      `;

    }
  );


  return html;

}


// =========================================================
// Security
// =========================================================

function escapeEvalLoopHTML(
  value
) {

  return String(
    value || ''
  )

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


function escapeAttribute(
  value
) {

  return String(
    value || ''
  )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


// =========================================================
// Start
// =========================================================

loadEvalLoopJobs()
  .then(
    () => {
      createEvalLoopChatbot();
    }
  );
