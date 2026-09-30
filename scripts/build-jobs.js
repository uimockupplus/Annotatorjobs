const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const JSON_FILE = path.join(ROOT, "opportunities.json");
const JOBS_DIR = path.join(ROOT, "jobs");

const SITE_URL = "https://annotatorjobs.vercel.app";
const SITE_NAME = "EvalLoop Jobs";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidJob(job) {
  return (
    job &&
    typeof job === "object" &&
    cleanText(job.title) &&
    cleanText(job.company)
  );
}

function looksLikeJob(job) {
  const title = cleanText(job.title).toLowerCase();
  const description = cleanText(job.description).toLowerCase();
  const duration = cleanText(job.duration).toLowerCase();
  const combined = `${title} ${description} ${duration}`;

  const jobSignals = [
    "engineer",
    "developer",
    "analyst",
    "specialist",
    "annotator",
    "annotation",
    "evaluator",
    "evaluation",
    "reviewer",
    "trainer",
    "operator",
    "moderator",
    "manager",
    "designer",
    "scientist",
    "researcher",
    "consultant",
    "associate",
    "intern",
    "apprentice",
    "qa",
    "quality",
    "data entry",
    "data labeling",
    "data labelling",
    "prompt",
    "llm",
    "ai",
    "machine learning",
    "genai",
    "generative ai"
  ];

  return jobSignals.some((signal) => combined.includes(signal));
}

function employmentTypeFromDuration(duration) {
  const value = cleanText(duration).toLowerCase();

  if (!value) return null;

  if (value.includes("full-time") || value.includes("full time")) {
    return "FULL_TIME";
  }

  if (value.includes("part-time") || value.includes("part time")) {
    return "PART_TIME";
  }

  if (value.includes("contract")) {
    return "CONTRACTOR";
  }

  if (value.includes("intern")) {
    return "INTERN";
  }

  if (value.includes("temporary") || value.includes("temp")) {
    return "TEMPORARY";
  }

  return null;
}

function isRemoteLocation(location) {
  const value = cleanText(location).toLowerCase();

  return (
    value.includes("remote") ||
    value.includes("work from home") ||
    value.includes("wfh") ||
    value.includes("work-from-home")
  );
}

function buildMetaDescription(job) {
  const company = cleanText(job.company);
  const title = cleanText(job.title);
  const location = cleanText(job.location);

  let text = `${title} at ${company}. Listed and curated by ${SITE_NAME}, an independent opportunity discovery platform.`;

  if (location) {
    text = `${title} at ${company} — ${location}. Listed and curated by ${SITE_NAME}, an independent opportunity discovery platform.`;
  }

  return text.slice(0, 300);
}

function buildDescription(job) {
  const description = cleanText(job.description);

  if (description) {
    return description;
  }

  return `${cleanText(job.title)} opportunity associated with ${cleanText(job.company)}.`;
}

function buildJobPage(job, finalSlug) {
  const company = cleanText(job.company);
  const title = cleanText(job.title);
  const description = buildDescription(job);
  const location = cleanText(job.location);
  const duration = cleanText(job.duration);
  const highlight = cleanText(job.highlight);
  const link = cleanText(job.link);

  const jobUrl = `${SITE_URL}/jobs/${finalSlug}.html`;
  const metaDescription = buildMetaDescription(job);

  const employmentType = employmentTypeFromDuration(duration);

  /*
   * Structured data is intentionally conservative.
   *
   * EvalLoop Jobs is NOT the employer.
   * The actual company from opportunities.json is used as
   * hiringOrganization.
   */
  let structuredData = null;

  if (looksLikeJob(job) && company) {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title,
      description,
      url: jobUrl,
      hiringOrganization: {
        "@type": "Organization",
        name: company
      }
    };

    if (employmentType) {
      structuredData.employmentType = employmentType;
    }

    /*
     * Only mark a job as telecommute when the source data
     * explicitly indicates remote work.
     */
    if (isRemoteLocation(location)) {
      structuredData.jobLocationType = "TELECOMMUTE";
    }
  }

  const structuredDataHtml = structuredData
    ? `
    <script type="application/ld+json">
${escapeJson(structuredData)}
    </script>`
    : "";

  const tags = Array.isArray(job.tags)
    ? job.tags.filter(Boolean).map((tag) => cleanText(tag))
    : [];

  const tagsHtml = tags.length
    ? `
      <div class="tags">
        ${tags
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")}
      </div>
    `
    : "";

  const locationHtml = location
    ? `
      <div class="info-row">
        <span class="label">Location</span>
        <span>${escapeHtml(location)}</span>
      </div>
    `
    : "";

  const durationHtml = duration
    ? `
      <div class="info-row">
        <span class="label">Type / Duration</span>
        <span>${escapeHtml(duration)}</span>
      </div>
    `
    : "";

  const highlightHtml = highlight
    ? `
      <div class="highlight">
        <strong>Highlight</strong>
        <p>${escapeHtml(highlight)}</p>
      </div>
    `
    : "";

  const applyHtml = link
    ? `
      <a
        class="apply-button"
        href="${escapeHtml(link)}"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        Apply / View Original Opportunity ↗
      </a>
    `
    : `
      <div class="no-link">
        The original application link was not provided.
      </div>
    `;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    name="description"
    content="${escapeHtml(metaDescription)}"
  >

  <meta
    name="robots"
    content="index,follow"
  >

  <link
    rel="canonical"
    href="${escapeHtml(jobUrl)}"
  >

  <link
    rel="icon"
    type="image/png"
    href="/favicon.png?v=2"
  >

  <title>${escapeHtml(title)} — ${escapeHtml(company)} | ${SITE_NAME}</title>

  ${structuredDataHtml}

  <style>
    :root {
      --bg: #070b12;
      --panel: #0d131d;
      --panel-2: #111925;
      --border: rgba(255,255,255,0.10);
      --text: #f4f7fb;
      --muted: #a6b0bf;
      --blue: #2588ff;
      --blue-dark: #176dcc;
      --green: #35d07f;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(
          circle at top,
          rgba(37,136,255,0.12),
          transparent 34%
        ),
        var(--bg);
      color: var(--text);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      line-height: 1.6;
    }

    a {
      color: inherit;
    }

    .container {
      width: min(920px, calc(100% - 32px));
      margin: 0 auto;
    }

    header {
      border-bottom: 1px solid var(--border);
      background: rgba(7,11,18,0.88);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .nav {
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .logo {
      text-decoration: none;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .logo span {
      color: var(--blue);
    }

    .back {
      color: var(--muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }

    .back:hover {
      color: var(--text);
    }

    main {
      padding: 56px 0 80px;
    }

    .eyebrow {
      color: var(--blue);
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    h1 {
      margin: 0;
      max-width: 820px;
      font-size: clamp(32px, 6vw, 58px);
      line-height: 1.05;
      letter-spacing: -1.8px;
    }

    .company {
      margin-top: 18px;
      font-size: 20px;
      font-weight: 700;
    }

    .company-label {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-right: 8px;
    }

    .card {
      margin-top: 34px;
      background: linear-gradient(
        180deg,
        rgba(255,255,255,0.045),
        rgba(255,255,255,0.02)
      );
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.28);
    }

    .info {
      display: grid;
      gap: 0;
      margin-bottom: 28px;
    }

    .info-row {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 18px;
      padding: 15px 0;
      border-bottom: 1px solid var(--border);
    }

    .label {
      color: var(--muted);
      font-weight: 700;
      font-size: 14px;
    }

    .description {
      white-space: pre-line;
      color: #dbe2ec;
      font-size: 16px;
    }

    .highlight {
      margin-top: 28px;
      padding: 18px 20px;
      border-left: 3px solid var(--blue);
      background: rgba(37,136,255,0.07);
      border-radius: 0 12px 12px 0;
    }

    .highlight strong {
      display: block;
      margin-bottom: 5px;
    }

    .highlight p {
      margin: 0;
      color: #dbe2ec;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 28px;
    }

    .tag {
      padding: 7px 11px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.04);
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 600;
    }

    .apply-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 32px;
      padding: 14px 22px;
      border-radius: 12px;
      background: var(--blue);
      color: white;
      text-decoration: none;
      font-weight: 800;
      transition: 0.2s ease;
    }

    .apply-button:hover {
      background: var(--blue-dark);
      transform: translateY(-1px);
    }

    .no-link {
      margin-top: 28px;
      color: var(--muted);
      font-size: 14px;
    }

    .directory-note {
      margin-top: 26px;
      padding: 18px 20px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255,255,255,0.025);
      color: var(--muted);
      font-size: 14px;
    }

    .directory-note strong {
      color: var(--text);
    }

    footer {
      border-top: 1px solid var(--border);
      padding: 30px 0 45px;
      color: var(--muted);
      font-size: 13px;
    }

    @media (max-width: 640px) {
      .container {
        width: min(100% - 22px, 920px);
      }

      .nav {
        min-height: 64px;
      }

      main {
        padding: 38px 0 60px;
      }

      .card {
        padding: 20px;
        border-radius: 16px;
      }

      .info-row {
        grid-template-columns: 1fr;
        gap: 5px;
      }

      h1 {
        letter-spacing: -1px;
      }

      .apply-button {
        width: 100%;
      }
    }
  </style>
</head>

<body>

<header>
  <div class="container nav">
    <a class="logo" href="/index.html">
      EvalLoop <span>Jobs</span>
    </a>

    <a class="back" href="/opportunities.html">
      ← All opportunities
    </a>
  </div>
</header>

<main>
  <div class="container">

    <div class="eyebrow">
      AI / Data Opportunity
    </div>

    <h1>
      ${escapeHtml(title)}
    </h1>

    <div class="company">
      <span class="company-label">
        Employer / Opportunity Provider
      </span>
      ${escapeHtml(company)}
    </div>

    <section class="card">

      <div class="info">
        ${locationHtml}
        ${durationHtml}
      </div>

      <div class="description">
        ${escapeHtml(description)}
      </div>

      ${highlightHtml}

      ${tagsHtml}

      ${applyHtml}

      <div class="directory-note">
        <strong>About this listing:</strong><br>
        This opportunity is listed and curated by
        <strong>${SITE_NAME}</strong>, an independent opportunity
        discovery platform. ${SITE_NAME} is not the employer or
        recruiter for third-party opportunities listed here.
        The company shown above is the associated employer or
        opportunity provider where available.
        Please verify the original opportunity, eligibility,
        application process, and other details independently
        before applying.
      </div>

    </section>

  </div>
</main>

<footer>
  <div class="container">
    © ${new Date().getFullYear()} ${SITE_NAME}.
    Independent opportunity discovery platform.
  </div>
</footer>

</body>
</html>`;
}

function buildSitemap(slugs) {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/index.html`,
    `${SITE_URL}/opportunities.html`,
    `${SITE_URL}/about.html`,
    `${SITE_URL}/disclaimer.html`,
    `${SITE_URL}/terms.html`,
    `${SITE_URL}/privacy.html`,
    `${SITE_URL}/contact.html`,
    `${SITE_URL}/join-network.html`,
    `${SITE_URL}/submit-opportunity.html`,
    ...slugs.map((slug) => `${SITE_URL}/jobs/${slug}.html`)
  ];

  const uniqueUrls = [...new Set(urls)];

  const xmlUrls = uniqueUrls
    .map(
      (url) => `  <url>
    <loc>${escapeHtml(url)}</loc>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${xmlUrls}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function main() {
  if (!fs.existsSync(JSON_FILE)) {
    throw new Error(`Missing opportunities.json at: ${JSON_FILE}`);
  }

  const raw = fs.readFileSync(JSON_FILE, "utf8");

  let opportunities;

  try {
    opportunities = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Unable to parse opportunities.json: ${error.message}`
    );
  }

  if (!Array.isArray(opportunities)) {
    throw new Error(
      "opportunities.json must contain an array of opportunities."
    );
  }

  const jobs = opportunities.filter(isValidJob);

  /*
   * Assign final slugs ONCE here.
   *
   * This is important because two opportunities can have
   * the same company + title.
   *
   * Example:
   *
   * acme-ai-evaluator.html
   * acme-ai-evaluator-2.html
   * acme-ai-evaluator-3.html
   */
  const slugCounts = {};

  const jobsWithSlugs = jobs.map((job) => {
    const baseSlug =
      `${slugify(job.company)}-${slugify(job.title)}`
        .replace(/^-+|-+$/g, "");

    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;

    const count = slugCounts[baseSlug];

    const finalSlug =
      count === 1
        ? baseSlug
        : `${baseSlug}-${count}`;

    return {
      ...job,
      _slug: finalSlug
    };
  });

  /*
   * Remove old generated job pages.
   */
  if (fs.existsSync(JOBS_DIR)) {
    const oldFiles = fs.readdirSync(JOBS_DIR);

    for (const file of oldFiles) {
      if (file.endsWith(".html")) {
        fs.unlinkSync(path.join(JOBS_DIR, file));
      }
    }
  } else {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }

  const generatedSlugs = [];

  for (const job of jobsWithSlugs) {
    const filename = `${job._slug}.html`;
    const outputPath = path.join(JOBS_DIR, filename);

    const html = buildJobPage(job, job._slug);

    fs.writeFileSync(outputPath, html, "utf8");

    generatedSlugs.push(job._slug);

    console.log(`Generated: jobs/${filename}`);
  }

  /*
   * Generate sitemap.xml
   */
  const sitemap = buildSitemap(generatedSlugs);

  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    sitemap,
    "utf8"
  );

  /*
   * Generate robots.txt
   */
  const robots = buildRobots();

  fs.writeFileSync(
    path.join(ROOT, "robots.txt"),
    robots,
    "utf8"
  );

  console.log("");
  console.log("======================================");
  console.log(`${SITE_NAME} job build complete`);
  console.log("======================================");
  console.log(`Opportunities found: ${opportunities.length}`);
  console.log(`Valid listings:      ${jobs.length}`);
  console.log(`Job pages generated: ${generatedSlugs.length}`);
  console.log(`Sitemap:             ${SITE_URL}/sitemap.xml`);
  console.log(`Robots:              ${SITE_URL}/robots.txt`);
  console.log("======================================");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("BUILD FAILED");
  console.error(error.message);
  process.exit(1);
}
