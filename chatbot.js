// EvalLoopjobs - Job Search Chatbot
// Reads the same opportunities.json used by the main page.

let evalLoopJobs = [];

// Same inbox the site's own resume-intake section sends to.
const EVALLOOP_RESUME_EMAIL = 'uimockup.plus@gmail.com';

// Opens Gmail's own compose screen in a new tab (not the OS mail app).
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

async function loadEvalLoopJobs() {
  try {
    const response = await fetch('./opportunities.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Could not load opportunities.json');
    }

    evalLoopJobs = await response.json();

    console.log(`EvalLoop chatbot loaded ${evalLoopJobs.length} opportunities.`);

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
            <strong>EvalLoopjobs</strong>
            <small>Job search assistant</small>
          </div>
        </div>
        <button id="evalbot-close" aria-label="Close assistant">×</button>
      </div>

      <div id="evalbot-messages">
        <div class="evalbot-message evalbot-bot">
          Hi, I'm the EvalLoopjobs assistant. Ask me about the opportunities in the directory below, or try one of these:
          <div class="evalbot-suggestions">
            <button class="evalbot-suggestion" data-question="Show me remote jobs">Remote jobs</button>
            <button class="evalbot-suggestion" data-question="Show LLM evaluation jobs">LLM jobs</button>
            <button class="evalbot-suggestion" data-question="Show jobs for freshers">Fresher jobs</button>
            <button class="evalbot-suggestion" data-question="Show data annotation jobs">Annotation jobs</button>
            <button class="evalbot-suggestion" data-question="Send my resume">Send my resume</button>
          </div>
        </div>
      </div>

      <div class="evalbot-quick-actions">
        <a href="${buildResumeGmailUrl()}" target="_blank" rel="noopener noreferrer" class="evalbot-resume-pin">
          📎 Send resume for personalized recommendations
        </a>
      </div>

      <div class="evalbot-input-area">
        <input
          id="evalbot-input"
          type="text"
          placeholder="Ask about AI jobs…"
          autocomplete="off"
        />
        <button id="evalbot-send" aria-label="Send message">↗</button>
      </div>

    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatbotHTML);

  const toggle = document.getElementById('evalbot-toggle');
  const closeBtn = document.getElementById('evalbot-close');
  const chatbot = document.getElementById('evalbot');
  const input = document.getElementById('evalbot-input');
  const send = document.getElementById('evalbot-send');

  toggle.addEventListener('click', () => {
    const isOpen = chatbot.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Close EvalLoopjobs assistant' : 'Open EvalLoopjobs assistant');
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    chatbot.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-label', 'Open EvalLoopjobs assistant');
  });

  send.addEventListener('click', sendEvalLoopMessage);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendEvalLoopMessage();
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

  if (!question) return;

  addEvalLoopMessage(escapeEvalLoopHTML(question), 'user');
  input.value = '';

  const typing = showEvalLoopTyping();

  setTimeout(() => {
    typing.remove();
    const answer = generateEvalLoopAnswer(question);
    addEvalLoopMessage(answer, 'bot');
  }, 350);

}


// -----------------------------
// Message rendering
// -----------------------------

function addEvalLoopMessage(content, type) {

  const messages = document.getElementById('evalbot-messages');
  const message = document.createElement('div');

  message.className = `evalbot-message evalbot-${type}`;
  message.innerHTML = content;

  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;

  return message;
}

function showEvalLoopTyping() {
  const messages = document.getElementById('evalbot-messages');
  const typing = document.createElement('div');
  typing.className = 'evalbot-message evalbot-bot evalbot-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
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

  const q = normalizeText(question);
  if (!evalLoopJobs.length) return [];

  const words = q.split(' ').filter(word => word.length > 2);

  const scoredJobs = evalLoopJobs.map(job => {

    const searchableText = normalizeText(
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
      if (searchableText.includes(word)) score += 1;
    });

    // Special matching rules
    const boosts = [
      ['remote', 'remote'],
      ['work from home', 'work from home'],
      ['llm', 'llm'],
      ['annotation', 'annotation'],
      ['evaluation', 'evaluation'],
      ['hyderabad', 'hyderabad'],
      ['chennai', 'chennai'],
      ['pune', 'pune']
    ];

    boosts.forEach(([trigger, match]) => {
      if (q.includes(trigger) && searchableText.includes(match)) score += 5;
    });

    if ((q.includes('fresher') || q.includes('freshers')) && searchableText.includes('fresher')) {
      score += 5;
    }

    if ((q.includes('bangalore') || q.includes('bengaluru')) &&
        (searchableText.includes('bengaluru') || searchableText.includes('bangalore'))) {
      score += 5;
    }

    return { job, score };
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
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('hello chatbot')) {
    return `
      Hello! You can ask me things like:
      <br><br>
      • Show remote jobs<br>
      • Find LLM evaluation jobs<br>
      • Show fresher jobs<br>
      • Find annotation jobs<br>
      • Show Hyderabad jobs
    `;
  }

  // Resume / personalized recommendations
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
  if (q.includes('how many jobs') || q.includes('how many opportunities') || q.includes('total jobs')) {
    return `Right now there ${evalLoopJobs.length === 1 ? 'is' : 'are'} <strong>${evalLoopJobs.length}</strong> opportunit${evalLoopJobs.length === 1 ? 'y' : 'ies'} in the directory.`;
  }

  // Latest jobs (falls back to list order if no postedAt field is present)
  if (q.includes('latest') || q.includes('recent') || q.includes('new jobs')) {
    const latest = [...evalLoopJobs]
      .sort((a, b) => String(b.postedAt || '').localeCompare(String(a.postedAt || ''))
      )
      .slice(0, 5);

    return formatEvalLoopJobs(latest, `Here are the most recent opportunities:`);
  }

  // Search
  const results = searchEvalLoopJobs(question);

  if (results.length) {
    return formatEvalLoopJobs(
      results,
      `Found ${results.length} matching opportunit${results.length === 1 ? 'y' : 'ies'}:`
    );
  }

  // No result
  return `
    I couldn't find a match for that in the current directory.
    <br><br>
    Try asking:
    <br><br>
    • "Show remote jobs"<br>
    • "Find LLM evaluation jobs"<br>
    • "Show annotation jobs"<br>
    • "Show fresher jobs"<br>
    • "Show latest jobs"
  `;

}


// -----------------------------
// Format job results
// -----------------------------

function formatEvalLoopJobs(jobs, heading) {

  let html = `${escapeEvalLoopHTML(heading)}`;

  jobs.forEach(job => {

    const tags = (job.tags || [])
      .slice(0, 3)
      .map(tag => `<span>${escapeEvalLoopHTML(tag)}</span>`)
      .join('');

    // Build whichever action buttons this job actually has —
    // same fields the main directory cards use (link / email / whatsapp).
    const actions = [];

    if (job.link) {
      actions.push(
        `<a href="${escapeAttribute(job.link)}" target="_blank" rel="noopener noreferrer">Apply ↗</a>`
      );
    }
    if (job.email) {
      const subject = encodeURIComponent(`Application for ${job.title || 'the role'}`);
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
        <strong>${escapeEvalLoopHTML(job.title || 'Opportunity')}</strong>
        <small>${escapeEvalLoopHTML(job.company || 'Company not specified')}</small>
        <small>📍 ${escapeEvalLoopHTML(job.location || 'Location not specified')}</small>
        ${job.highlight ? `<small>💰 ${escapeEvalLoopHTML(job.highlight)}</small>` : ''}
        ${tags ? `<div class="evalbot-job-tags">${tags}</div>` : ''}
        ${actions.length ? `<div class="evalbot-job-actions">${actions.join('')}</div>` : ''}
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

loadEvalLoopJobs().then(() => {
  createEvalLoopChatbot();
});
