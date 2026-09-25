// EvalLoop Jobs - Free Job Chatbot

let evalLoopJobs = [];

async function loadEvalLoopJobs() {
  try {
    const response = await fetch('./opportunities.json');

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
    <button id="evalbot-toggle" aria-label="Open EvalLoop Jobs chatbot">
      💬
    </button>

    <div id="evalbot">

      <div class="evalbot-header">

        <div class="evalbot-title">

          <div class="evalbot-icon">
            🤖
          </div>

          <div>
            <strong>EvalLoop Jobs</strong>
            <small>Job Search Assistant</small>
          </div>

        </div>

        <button id="evalbot-close">×</button>

      </div>


      <div id="evalbot-messages">

        <div class="evalbot-message evalbot-bot">

          👋 Hi! I'm the EvalLoop Jobs assistant.

          <br><br>

          I can help you find opportunities from our job database.

          <div class="evalbot-suggestions">

            <button class="evalbot-suggestion"
              data-question="Show me remote jobs">
              Remote jobs
            </button>

            <button class="evalbot-suggestion"
              data-question="Show LLM evaluation jobs">
              LLM jobs
            </button>

            <button class="evalbot-suggestion"
              data-question="Show jobs for freshers">
              Fresher jobs
            </button>

            <button class="evalbot-suggestion"
              data-question="Show data annotation jobs">
              Annotation jobs
            </button>

          </div>

        </div>

      </div>


      <div class="evalbot-input-area">

        <input
          id="evalbot-input"
          type="text"
          placeholder="Ask about AI jobs..."
          autocomplete="off"
        />

        <button id="evalbot-send">
          ➤
        </button>

      </div>

    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatbotHTML);


  const toggle = document.getElementById('evalbot-toggle');
  const close = document.getElementById('evalbot-close');
  const chatbot = document.getElementById('evalbot');
  const input = document.getElementById('evalbot-input');
  const send = document.getElementById('evalbot-send');


  toggle.addEventListener('click', () => {
    chatbot.classList.toggle('open');

    if (chatbot.classList.contains('open')) {
      input.focus();
    }
  });


  close.addEventListener('click', () => {
    chatbot.classList.remove('open');
  });


  send.addEventListener('click', sendEvalLoopMessage);


  input.addEventListener('keydown', (event) => {

    if (event.key === 'Enter') {
      sendEvalLoopMessage();
    }

  });


  document.addEventListener('click', (event) => {

    if (event.target.classList.contains('evalbot-suggestion')) {

      const question = event.target.dataset.question;

      input.value = question;

      sendEvalLoopMessage();

    }

  });

}


// -----------------------------
// Send message
// -----------------------------

function sendEvalLoopMessage() {

  const input = document.getElementById('evalbot-input');

  const question = input.value.trim();

  if (!question) {
    return;
  }

  addEvalLoopMessage(question, 'user');

  input.value = '';

  setTimeout(() => {

    const answer = generateEvalLoopAnswer(question);

    addEvalLoopMessage(answer, 'bot');

  }, 250);

}


// -----------------------------
// Add message
// -----------------------------

function addEvalLoopMessage(content, type) {

  const messages = document.getElementById('evalbot-messages');

  const message = document.createElement('div');

  message.className =
    `evalbot-message evalbot-${type}`;

  message.innerHTML = content;

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;
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

  const q = normalizeText(question);

  if (!evalLoopJobs.length) {
    return [];
  }


  const words = q
    .split(' ')
    .filter(word => word.length > 2);


  const scoredJobs = evalLoopJobs.map(job => {

    const searchableText = normalizeText(
      [
        job.company,
        job.title,
        job.description,
        job.location,
        job.duration,
        job.pay,
        job.experience,
        job.qualification,
        ...(job.tags || []),
        ...(job.skills || []),
        ...(job.responsibilities || []),
        ...(job.languagesRequired || [])
      ].join(' ')
    );


    let score = 0;


    words.forEach(word => {

      if (searchableText.includes(word)) {
        score += 1;
      }

    });


    // Special matching rules

    if (
      q.includes('remote') &&
      searchableText.includes('remote')
    ) {
      score += 5;
    }


    if (
      q.includes('work from home') &&
      searchableText.includes('work from home')
    ) {
      score += 5;
    }


    if (
      (q.includes('fresher') ||
       q.includes('freshers')) &&
      searchableText.includes('fresher')
    ) {
      score += 5;
    }


    if (
      q.includes('llm') &&
      searchableText.includes('llm')
    ) {
      score += 5;
    }


    if (
      q.includes('annotation') &&
      searchableText.includes('annotation')
    ) {
      score += 5;
    }


    if (
      q.includes('evaluation') &&
      searchableText.includes('evaluation')
    ) {
      score += 5;
    }


    if (
      q.includes('hyderabad') &&
      searchableText.includes('hyderabad')
    ) {
      score += 5;
    }


    if (
      q.includes('bangalore') ||
      q.includes('bengaluru')
    ) {

      if (
        searchableText.includes('bengaluru') ||
        searchableText.includes('bangalore')
      ) {
        score += 5;
      }

    }


    if (
      q.includes('chennai') &&
      searchableText.includes('chennai')
    ) {
      score += 5;
    }


    if (
      q.includes('pune') &&
      searchableText.includes('pune')
    ) {
      score += 5;
    }


    return {
      job,
      score
    };

  });


  return scoredJobs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.job);

}


// -----------------------------
// Generate answer
// -----------------------------

function generateEvalLoopAnswer(question) {

  const q = normalizeText(question);


  // Greetings

  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('hello chatbot')
  ) {

    return `
      👋 Hello!

      I'm the EvalLoop Jobs assistant.

      You can ask me things like:

      <br><br>

      • Show remote jobs<br>
      • Find LLM evaluation jobs<br>
      • Show fresher jobs<br>
      • Find annotation jobs<br>
      • Show Hyderabad jobs
    `;

  }


  // Total jobs

  if (
    q.includes('how many jobs') ||
    q.includes('how many opportunities') ||
    q.includes('total jobs')
  ) {

    return `
      📊 Currently, EvalLoop Jobs has
      <strong>${evalLoopJobs.length}</strong>
      opportunities in the database.
    `;

  }


  // Latest jobs

  if (
    q.includes('latest') ||
    q.includes('recent') ||
    q.includes('new jobs')
  ) {

    const latest = [...evalLoopJobs]
      .sort((a, b) =>
        String(b.postedAt || '')
          .localeCompare(String(a.postedAt || ''))
      )
      .slice(0, 5);


    return formatEvalLoopJobs(
      latest,
      `🆕 Here are some of the latest opportunities:`
    );

  }


  // Search

  const results = searchEvalLoopJobs(question);


  if (results.length) {

    return formatEvalLoopJobs(
      results,
      `🔎 I found ${results.length} relevant opportunit${
        results.length === 1 ? 'y' : 'ies'
      }:`
    );

  }


  // No result

  return `
    I couldn't find a matching opportunity in the current database.

    <br><br>

    Try asking:

    <br><br>

    • "Show remote jobs"<br>
    • "Find LLM evaluation jobs"<br>
    • "Show annotation jobs"<br>
    • "Show fresher jobs"<br>
    • "Show Hyderabad jobs"<br>
    • "Show latest jobs"
  `;

}


// -----------------------------
// Format job results
// -----------------------------

function formatEvalLoopJobs(jobs, heading) {

  let html = `${heading}<br><br>`;


  jobs.forEach(job => {

    html += `

      <div class="evalbot-job">

        <strong>
          ${escapeEvalLoopHTML(job.title || 'Opportunity')}
        </strong>

        <small>
          ${escapeEvalLoopHTML(job.company || 'Company not specified')}
        </small>

        <small>
          📍 ${escapeEvalLoopHTML(job.location || 'Location not specified')}
        </small>

        <small>
          💰 ${escapeEvalLoopHTML(job.pay || 'Pay not specified')}
        </small>

        ${
          job.applyUrl
            ? `
              <a
                href="${escapeAttribute(job.applyUrl)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply ↗
              </a>
            `
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


function escapeAttribute(value) {

  return String(value || '')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


// -----------------------------
// Start chatbot
// -----------------------------

loadEvalLoopJobs()
  .then(() => {
    createEvalLoopChatbot();
  });
