// EvalLoopjobs - AI + Job Search Chatbot
// Uses opportunities.json for job searches
// Uses /api/chat for general AI questions

let evalLoopJobs = [];

const EVALLOOP_RESUME_EMAIL = 'uimockup.plus@gmail.com';


// -----------------------------
// Gmail helpers
// -----------------------------

function buildGmailComposeUrl({ to, subject, body }) {
  const params = new URLSearchParams({
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
    subject: 'Resume for personalized AI opportunities',
    body:
      'Hello,\n\nPlease find my resume attached.\n\n' +
      'Target role:\nPreferred location:\nWork type:\n\nThank you.'
  });
}


function resumeButtonHTML() {
  return `
    <div class="evalbot-resume-cta">
      <a href="${buildResumeGmailUrl()}" target="_blank" rel="noopener noreferrer">
        📎 Send resume via Gmail ↗
      </a>
    </div>
  `;
}


// -----------------------------
// Load jobs
// -----------------------------

async function loadEvalLoopJobs() {

  try {

    const response = await fetch('./opportunities.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Could not load opportunities.json');
    }

    evalLoopJobs = await response.json();

    console.log(
      `EvalLoop chatbot loaded ${evalLoopJobs.length} opportunities.`
    );

  } catch (error) {

    console.error('Chatbot job loading error:', error);

  }

}


// -----------------------------
// Chatbot UI
// -----------------------------

function createEvalLoopChatbot() {

  const chatbotHTML = `
    <button id="evalbot-toggle" aria-label="Open EvalLoopjobs assistant">
      <span class="evalbot-toggle-icon">◉</span>
      <span class="evalbot-toggle-close">×</span>
    </button>

    <div id="evalbot" role="dialog" aria-label="EvalLoopjobs assistant">

      <div class="evalbot-header">

        <div class="evalbot-title">

          <div class="evalbot-icon">◉</div>

          <div>
            <strong>EvalLoop AI</strong>
            <small>AI & Job Assistant</small>
          </div>

        </div>

        <button id="evalbot-close" aria-label="Close assistant">
          ×
        </button>

      </div>


      <div id="evalbot-messages">

        <div class="evalbot-message evalbot-bot">

          Hi! I'm <strong>EvalLoop AI</strong> 🤖

          <br><br>

          I can answer AI/LLM questions and help you find opportunities from the directory.

          <div class="evalbot-suggestions">

            <button
              class="evalbot-suggestion"
              data-question="What is LLM evaluation?"
            >
              What is LLM evaluation?
            </button>

            <button
              class="evalbot-suggestion"
              data-question="Show me remote jobs"
            >
              Remote jobs
            </button>

            <button
              class="evalbot-suggestion"
              data-question="Show LLM evaluation jobs"
            >
              LLM jobs
            </button>

            <button
              class="evalbot-suggestion"
              data-question="Show jobs for freshers"
            >
              Fresher jobs
            </button>

            <button
              class="evalbot-suggestion"
              data-question="Show data annotation jobs"
            >
              Annotation jobs
            </button>

            <button
              class="evalbot-suggestion"
              data-question="Send my resume"
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
          id="evalbot-send"
          aria-label="Send message"
        >
          ↗
        </button>

      </div>

    </div>
  `;


  document.body.insertAdjacentHTML(
    'beforeend',
    chatbotHTML
  );


  const toggle =
    document.getElementById('evalbot-toggle');

  const closeBtn =
    document.getElementById('evalbot-close');

  const chatbot =
    document.getElementById('evalbot');

  const input =
    document.getElementById('evalbot-input');

  const send =
    document.getElementById('evalbot-send');


  toggle.addEventListener('click', () => {

    const isOpen =
      chatbot.classList.toggle('open');

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

    if (isOpen) {
      input.focus();
    }

  });


  closeBtn.addEventListener('click', () => {

    chatbot.classList.remove('open');

    toggle.classList.remove('open');

    toggle.setAttribute(
      'aria-label',
      'Open EvalLoop AI'
    );

  });


  send.addEventListener(
    'click',
    sendEvalLoopMessage
  );


  input.addEventListener(
    'keydown',
    (event) => {

      if (event.key === 'Enter') {
        sendEvalLoopMessage();
      }

    }
  );


  document.addEventListener(
    'click',
    (event) => {

      if (
        event.target.classList.contains(
          'evalbot-suggestion'
        )
      ) {

        const question =
          event.target.dataset.question;

        input.value = question;

        sendEvalLoopMessage();

      }

    }
  );

}


// -----------------------------
// Send message
// -----------------------------

async function sendEvalLoopMessage() {

  const input =
    document.getElementById('evalbot-input');

  const question =
    input.value.trim();

  if (!question) return;


  addEvalLoopMessage(
    escapeEvalLoopHTML(question),
    'user'
  );


  input.value = '';


  const typing =
    showEvalLoopTyping();


  try {

    const answer =
      await generateEvalLoopAnswer(question);

    typing.remove();

    addEvalLoopMessage(
      answer,
      'bot'
    );

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


// -----------------------------
// Message rendering
// -----------------------------

function addEvalLoopMessage(
  content,
  type
) {

  const messages =
    document.getElementById(
      'evalbot-messages'
    );

  const message =
    document.createElement('div');

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
    document.createElement('div');

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


// -----------------------------
// Normalize text
// -----------------------------

function normalizeText(text) {

  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s₹.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

}


// -----------------------------
// Search jobs
// -----------------------------

function searchEvalLoopJobs(question) {

  const q =
    normalizeText(question);

  if (!evalLoopJobs.length) {
    return [];
  }


  const words =
    q.split(' ')
      .filter(
        word => word.length > 2
      );


  const scoredJobs =
    evalLoopJobs.map(job => {

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


      let score = 0;


      words.forEach(word => {

        if (
          searchableText.includes(word)
        ) {
          score += 1;
        }

      });


      const boosts = [

        ['remote', 'remote'],

        ['work from home', 'work from home'],

        ['llm', 'llm'],

        ['annotation', 'annotation'],

        ['evaluation', 'evaluation'],

        ['ai evaluator', 'evaluation'],

        ['hyderabad', 'hyderabad'],

        ['chennai', 'chennai'],

        ['pune', 'pune'],

        ['bangalore', 'bangalore'],

        ['bengaluru', 'bengaluru']

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
          searchableText.includes('fresher')
        ) {

          score += 5;

        }

      }


      return {
        job,
        score
      };

    });


  return scoredJobs

    .filter(
      item => item.score > 0
    )

    .sort(
      (a, b) => b.score - a.score
    )

    .slice(0, 5)

    .map(
      item => item.job
    );

}


// -----------------------------
// Detect job searches
// -----------------------------

function isJobSearch(question) {

  const q =
    normalizeText(question);


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
    keyword => q.includes(keyword)
  );

}


// -----------------------------
// Ask Gemini
// -----------------------------

async function askEvalLoopAI(question) {

  const response =
    await fetch(
      '/api/chat',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          message: question
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


  return formatAIResponse(
    data.answer
  );

}


// -----------------------------
// Format AI response
// -----------------------------

function formatAIResponse(text) {

  let safeText =
    escapeEvalLoopHTML(text);


  // Basic Markdown conversion

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


// -----------------------------
// Generate answer
// -----------------------------

async function generateEvalLoopAnswer(
  question
) {

  const q =
    normalizeText(question);


  // Greetings

  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('hello chatbot')
  ) {

    return `
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
    `;

  }


  // Resume

  if (
    q.includes('resume') ||
    q.includes('cv') ||
    q.includes('personalized') ||
    q.includes('personal recommendation') ||
    q.includes('recommend jobs for me') ||
    q.includes('recommend me')
  ) {

    return `
      Send your resume and I'll pass along your preferred role, location, and work type — we'll use that to curate more relevant opportunities for you.
      ${resumeButtonHTML()}
    `;

  }


  // Total jobs

  if (
    q.includes('how many jobs') ||
    q.includes('how many opportunities') ||
    q.includes('total jobs')
  ) {

    return `
      Right now there are
      <strong>${evalLoopJobs.length}</strong>
      opportunities in the directory.
    `;

  }


  // Latest jobs

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
        .slice(0, 5);


    return formatEvalLoopJobs(
      latest,
      'Here are the most recent opportunities:'
    );

  }


  // Job search

  if (
    isJobSearch(question)
  ) {

    const results =
      searchEvalLoopJobs(
        question
      );


    if (results.length) {

      return formatEvalLoopJobs(
        results,
        `Found ${results.length} matching opportunit${results.length === 1 ? 'y' : 'ies'}:`
      );

    }


    // If the user clearly asks for a job
    // but local search finds nothing,
    // ask Gemini to explain that no exact
    // local match was found.

    return `
      I couldn't find an exact match in the current EvalLoop Jobs directory.
      <br><br>
      Try:
      <br><br>
      • Show remote jobs<br>
      • Find LLM evaluation jobs<br>
      • Show annotation jobs<br>
      • Show fresher jobs<br>
      • Show latest jobs
    `;

  }


  // General AI question → Gemini

  return await askEvalLoopAI(
    question
  );

}


// -----------------------------
// Format job results
// -----------------------------

function formatEvalLoopJobs(
  jobs,
  heading
) {

  let html =
    `${escapeEvalLoopHTML(heading)}`;


  jobs.forEach(job => {

    const tags =
      (job.tags || [])
        .slice(0, 3)
        .map(
          tag =>
            `<span>${escapeEvalLoopHTML(tag)}</span>`
        )
        .join('');


    const actions = [];


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
            job.title || 'Opportunity'
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
            ? `<small>💰 ${escapeEvalLoopHTML(
                job.highlight
              )}</small>`
            : ''
        }

        ${
          tags
            ? `<div class="evalbot-job-tags">${tags}</div>`
            : ''
        }

        ${
          actions.length
            ? `<div class="evalbot-job-actions">${actions.join('')}</div>`
            : ''
        }

      </div>

    `;

  });


  return html;

}


// -----------------------------
// Security helpers
// -----------------------------

function escapeEvalLoopHTML(value) {

  return String(value || '')

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


function escapeAttribute(value) {

  return String(value || '')

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


// -----------------------------
// Start chatbot
// -----------------------------

loadEvalLoopJobs()
  .then(() => {

    createEvalLoopChatbot();

  });
