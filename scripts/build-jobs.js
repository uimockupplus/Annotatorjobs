const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JSON_FILE = path.join(ROOT, "opportunities.json");
const JOBS_DIR = path.join(ROOT, "jobs");

const SITE_URL = "https://annotatorjobs.vercel.app";


/* -------------------------------------------------------
   BASIC HELPERS
------------------------------------------------------- */

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}


function jsonLd(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, "\\u003c");
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


function jobSlug(job) {
  return `${slugify(job.company)}-${slugify(job.title)}`;
}


function absoluteJobUrl(job) {
  return `${SITE_URL}/jobs/${jobSlug(job)}.html`;
}


/* -------------------------------------------------------
   JOB TYPE DETECTION
------------------------------------------------------- */

function isUnknownCompany(company) {
  const value = String(company || "").trim().toLowerCase();

  return !value ||
    value === "unknown" ||
    value === "n/a" ||
    value === "na" ||
    value === "not specified";
}


function looksLikeJob(job) {

  const text = [
    job.title,
    job.description,
    job.duration,
    job.highlight,
    ...(Array.isArray(job.tags) ? job.tags : [])
  ]
    .join(" ")
    .toLowerCase();

  /*
   * These are signals that the listing is more likely
   * to represent an actual employment/job opportunity.
   */

  const jobSignals = [
    "job",
    "role",
    "engineer",
    "developer",
    "analyst",
    "specialist",
    "associate",
    "manager",
    "lead",
    "intern",
    "trainee",
    "executive",
    "consultant",
    "administrator",
    "coordinator",
    "moderator",
    "annotator",
    "evaluator",
    "reviewer",
    "scientist",
    "architect",
    "operations",
    "employment",
    "full-time",
    "full time",
    "part-time",
    "part time"
  ];

  return jobSignals.some(signal => text.includes(signal));
}


/* -------------------------------------------------------
   STRUCTURED DATA
------------------------------------------------------- */

function buildStructuredData(job) {

  /*
   * IMPORTANT:
   *
   * EvalLoop Jobs is NOT the hiring organization.
   *
   * The actual company from opportunities.json becomes
   * hiringOrganization.
   */

  if (isUnknownCompany(job.company)) {
    return null;
  }

  if (!looksLikeJob(job)) {
    return null;
  }

  const data = {

    "@context": "https://schema.org",

    "@type": "JobPosting",

    "title": String(job.title || ""),

    "description": String(job.description || ""),

    "url": absoluteJobUrl(job),

    "hiringOrganization": {
      "@type": "Organization",
      "name": String(job.company)
    }

  };


  /*
   * Location
   *
   * We only provide a simple location string when one
   * exists. We intentionally don't invent addresses,
   * countries, cities, postal codes, etc.
   */

  if (job.location) {

    const locationText =
      String(job.location).trim();

    if (locationText) {

      data.jobLocation = {
        "@type": "Place",
        "name": locationText
      };

    }

  }


  /*
   * Employment type
   *
   * Only add values when the listing clearly indicates
   * the employment arrangement.
   */

  const duration =
    String(job.duration || "").toLowerCase();

  if (
    duration.includes("full-time") ||
    duration.includes("full time")
  ) {

    data.employmentType = "FULL_TIME";

  } else if (
    duration.includes("part-time") ||
    duration.includes("part time")
  ) {

    data.employmentType = "PART_TIME";

  } else if (
    duration.includes("intern")
  ) {

    data.employmentType = "INTERN";

  }


  return data;
}


/* -------------------------------------------------------
   PAGE HTML
------------------------------------------------------- */

function buildJobPage(job) {

  const title =
    String(job.title || "Opportunity");

  const company =
    String(job.company || "Opportunity Provider");

  const description =
    String(job.description || "");

  const location =
    String(job.location || "See original listing");

  const duration =
    String(job.duration || "See original listing");

  const highlight =
    String(job.highlight || "");

  const tags =
    Array.isArray(job.tags)
      ? job.tags
      : [];

  const pageUrl =
    absoluteJobUrl(job);

  const applyLink =
    job.link
      ? String(job.link)
      : "";


  const structuredData =
    buildStructuredData(job);


  const jsonLdScript =
    structuredData
      ? `
<script type="application/ld+json">
${jsonLd(structuredData)}
</script>
`
      : "";


  const tagHtml =
    tags
      .map(tag => `
<span>${esc(tag)}</span>
`)
      .join("");


  const applyHtml =
    applyLink
      ? `
<a
  class="btn primary"
  href="${esc(applyLink)}"
  target="_blank"
  rel="noopener noreferrer"
>
  Apply on original site ↗
</a>
`
      : `
<div class="no-apply">
  No direct application link is currently available.
</div>
`;


  const contactHtml = [

    job.email
      ? `
<a
  class="btn secondary"
  href="mailto:${esc(job.email)}?subject=${encodeURIComponent("Application for " + title)}"
>
  Email CV ✉
</a>
`
      : "",

    job.whatsapp
      ? `
<a
  class="btn secondary"
  href="https://wa.me/${esc(job.whatsapp)}"
  target="_blank"
  rel="noopener noreferrer"
>
  WhatsApp ↗
</a>
`
      : ""

  ].join("");


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
  content="${esc(title)} at ${esc(company)}. Opportunity details curated by EvalLoop Jobs."
>

<meta
  name="robots"
  content="index,follow"
>

<link
  rel="canonical"
  href="${esc(pageUrl)}"
>

<title>
${esc(title)} — ${esc(company)} | EvalLoop Jobs
</title>

<link
  rel="icon"
  type="image/png"
  href="/favicon.png?v=2"
>

<link
  rel="preconnect"
  href="https://fonts.googleapis.com"
>

<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossorigin
>

<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
  rel="stylesheet"
>

<style>

:root{
  --bg:#0b1224;
  --ink:#f5f8ff;
  --muted:#8fa0bb;
  --blue:#2588ff;
  --border:#233555;
  --cyan:#4db3ff;
  --panel:#111d36;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--ink);
  font-family:"DM Sans",sans-serif;
}

a{
  color:inherit;
  text-decoration:none;
}

.shell{
  min-height:100vh;
  background:
    linear-gradient(
      rgba(11,18,36,.96),
      rgba(11,18,36,.98)
    );
}

.wrap{
  width:min(1100px,calc(100% - 40px));
  margin:auto;
}

.header{
  min-height:88px;
  display:flex;
  align-items:center;
  gap:28px;
  border-bottom:1px solid var(--border);
}

.logo{
  display:flex;
  align-items:center;
  gap:9px;
  font:700 13px "Space Grotesk";
  letter-spacing:.12em;
}

.logo-mark{
  display:grid;
  place-items:center;
  width:23px;
  height:23px;
  border-radius:50%;
  background:var(--blue);
  color:#fff;
}

.nav{
  display:flex;
  gap:28px;
  margin-left:auto;
  color:var(--muted);
  font-size:12px;
}

.nav a:hover{
  color:var(--cyan);
}

.page{
  padding:90px 0 120px;
}

.eyebrow{
  color:var(--cyan);
  font:700 10px "Space Grotesk";
  letter-spacing:.16em;
  text-transform:uppercase;
}

.eyebrow:before{
  content:"";
  display:inline-block;
  width:28px;
  height:1px;
  margin-right:10px;
  vertical-align:middle;
  background:var(--blue);
}

h1{
  max-width:900px;
  margin:18px 0 16px;
  font:600 clamp(2.7rem,6vw,5.5rem)/.96 "Space Grotesk";
  letter-spacing:-.07em;
}

.company{
  color:var(--cyan);
  font:700 13px "Space Grotesk";
  letter-spacing:.14em;
  text-transform:uppercase;
}

.attribution{
  margin-top:32px;
  padding:20px 22px;
  border:1px solid rgba(77,179,255,.35);
  border-radius:8px;
  background:rgba(21,35,63,.55);
}

.attribution strong{
  display:block;
  margin-bottom:7px;
  color:var(--ink);
  font:600 14px "Space Grotesk";
}

.attribution span{
  color:var(--muted);
  font-size:11px;
  line-height:1.6;
}

.content{
  display:grid;
  grid-template-columns:1.5fr .8fr;
  gap:30px;
  margin-top:34px;
}

.card{
  padding:30px;
  border:1px solid var(--border);
  background:rgba(21,35,63,.45);
  border-radius:8px;
}

.card h2{
  margin:0 0 16px;
  font:600 22px "Space Grotesk";
  letter-spacing:-.04em;
}

.description{
  color:#c9d5e8;
  font-size:14px;
  line-height:1.75;
  white-space:pre-line;
}

.facts{
  display:grid;
  gap:18px;
}

.fact{
  padding-bottom:16px;
  border-bottom:1px solid var(--border);
}

.fact:last-child{
  border-bottom:0;
  padding-bottom:0;
}

.fact-label{
  display:block;
  margin-bottom:6px;
  color:var(--muted);
  font:700 9px "Space Grotesk";
  letter-spacing:.14em;
  text-transform:uppercase;
}

.fact-value{
  color:var(--ink);
  font-size:13px;
  line-height:1.5;
}

.highlight{
  color:var(--cyan);
  font:600 16px "Space Grotesk";
}

.tags{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:20px;
}

.tags span{
  padding:7px 10px;
  border:1px solid var(--border);
  border-radius:999px;
  color:var(--muted);
  font-size:10px;
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:26px;
}

.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:44px;
  padding:0 17px;
  border-radius:4px;
  font-size:11px;
  font-weight:700;
}

.primary{
  background:var(--blue);
  color:#fff;
  box-shadow:0 0 22px rgba(37,136,255,.25);
}

.primary:hover{
  background:var(--cyan);
  transform:translateY(-2px);
}

.secondary{
  border:1px solid var(--border);
  background:rgba(37,136,255,.08);
  color:var(--cyan);
}

.secondary:hover{
  border-color:var(--cyan);
  color:#fff;
  transform:translateY(-2px);
}

.no-apply{
  padding:12px;
  border:1px solid var(--border);
  color:var(--muted);
  font-size:11px;
  line-height:1.5;
}

.notice{
  margin-top:30px;
  padding:20px 22px;
  border:1px solid var(--border);
  background:rgba(11,18,36,.65);
  color:var(--muted);
  font-size:11px;
  line-height:1.65;
}

.notice strong{
  color:var(--ink);
}

.back{
  display:inline-flex;
  margin-top:34px;
  color:var(--cyan);
  font-size:11px;
}

.back:hover{
  text-decoration:underline;
  text-underline-offset:4px;
}

.footer{
  min-height:110px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  border-top:1px solid var(--border);
  color:var(--muted);
  font-size:10px;
}

.footer-links{
  display:flex;
  flex-wrap:wrap;
  gap:8px 22px;
}

.footer-links a:hover{
  color:var(--cyan);
}

@media(max-width:800px){

  .nav{
    display:none;
  }

  .content{
    grid-template-columns:1fr;
  }

  .page{
    padding-top:65px;
  }

}

@media(max-width:600px){

  .wrap{
    width:min(100% - 32px,1100px);
  }

  .header{
    min-height:74px;
  }

  h1{
    font-size:3.1rem;
  }

  .card{
    padding:22px;
  }

  .actions{
    flex-direction:column;
  }

  .btn{
    width:100%;
  }

  .footer{
    align-items:flex-start;
    flex-direction:column;
    justify-content:center;
    padding:28px 0;
  }

}

</style>

${jsonLdScript}

</head>


<body>

<div class="shell">

<header class="header wrap">

<a href="/index.html" class="logo">

<span class="logo-mark">
◉
</span>

<span>
EvalLoop Jobs
</span>

</a>


<nav class="nav">

<a href="/opportunities.html">
Opportunities
</a>

<a href="/about.html">
About
</a>

<a href="/index.html#how">
How it works
</a>

</nav>

</header>


<main class="page wrap">


<div class="eyebrow">
OPPORTUNITY / DETAILS
</div>


<h1>
${esc(title)}
</h1>


<div class="company">
${esc(company)}
</div>


<div class="attribution">

<strong>
Employer / Opportunity Provider
</strong>

<span>
${esc(company)}
</span>

<br><br>

<strong>
Listed and curated by
</strong>

<span>
EvalLoop Jobs — an independent opportunity discovery platform.
</span>

</div>


<div class="content">


<section class="card">

<h2>
About this opportunity
</h2>

<div class="description">
${esc(description)}
</div>


${tags.length ? `

<div class="tags">

${tagHtml}

</div>

` : ""}


<div class="actions">

${applyHtml}

${contactHtml}

</div>

</section>


<aside class="card">

<h2>
Opportunity details
</h2>


<div class="facts">


<div class="fact">

<span class="fact-label">
Employer / Provider
</span>

<div class="fact-value">
${esc(company)}
</div>

</div>


<div class="fact">

<span class="fact-label">
Location / Work mode
</span>

<div class="fact-value">
${esc(location)}
</div>

</div>


<div class="fact">

<span class="fact-label">
Duration
</span>

<div class="fact-value">
${esc(duration)}
</div>

</div>


${highlight ? `

<div class="fact">

<span class="fact-label">
Highlight
</span>

<div class="highlight">
${esc(highlight)}
</div>

</div>

` : ""}


</div>

</aside>

</div>


<div class="notice">

<strong>
Important:
</strong>

EvalLoop Jobs is an independent opportunity discovery platform and is not the employer, hiring company, or opportunity provider for this listing. Application decisions, eligibility, compensation, work arrangements, and hiring are determined by the employer or opportunity provider. Please verify the current opportunity details on the original application page before applying.

</div>


<a
class="back"
href="/opportunities.html"
>
← Back to all opportunities
</a>


</main>


<footer class="footer wrap">

<a href="/index.html" class="logo">

<span class="logo-mark">
◉
</span>

<span>
EvalLoop Jobs
</span>

</a>


<span>
Independent opportunity discovery for the work behind better AI.
</span>


<nav class="footer-links">

<a href="/about.html">
About
</a>

<a href="/opportunities.html">
Opportunities
</a>

<a href="/submit-opportunity.html">
Submit opportunity
</a>

<a href="/contact.html">
Contact
</a>

<a href="/disclaimer.html">
Disclaimer
</a>

<a href="/terms.html">
Terms
</a>

<a href="/privacy.html">
Privacy
</a>

</nav>

</footer>

</div>

</body>

</html>`;
}


/* -------------------------------------------------------
   READ JSON
------------------------------------------------------- */

if (!fs.existsSync(JSON_FILE)) {
  console.error("ERROR: opportunities.json was not found.");
  process.exit(1);
}


let jobs;

try {

  jobs =
    JSON.parse(
      fs.readFileSync(JSON_FILE, "utf8")
    );

} catch (error) {

  console.error(
    "ERROR: Could not read opportunities.json"
  );

  console.error(error);

  process.exit(1);

}


if (!Array.isArray(jobs)) {

  console.error(
    "ERROR: opportunities.json must contain an array."
  );

  process.exit(1);

}


/* -------------------------------------------------------
   CREATE JOB DIRECTORY
------------------------------------------------------- */

fs.mkdirSync(
  JOBS_DIR,
  { recursive:true }
);


/* -------------------------------------------------------
   REMOVE OLD GENERATED JOB PAGES
------------------------------------------------------- */

for (const file of fs.readdirSync(JOBS_DIR)) {

  if (file.endsWith(".html")) {

    fs.unlinkSync(
      path.join(JOBS_DIR,file)
    );

  }

}


/* -------------------------------------------------------
   HANDLE DUPLICATE SLUGS
------------------------------------------------------- */

const slugCounts = {};


/* -------------------------------------------------------
   GENERATE PAGES
------------------------------------------------------- */

const generatedUrls = [];

let generatedCount = 0;

let skippedCount = 0;


jobs.forEach((job,index)=>{

  if (!job || typeof job !== "object") {

    skippedCount++;

    return;

  }


  if (!job.title || !job.company) {

    console.warn(
      `Skipping opportunity ${index + 1}: missing company or title.`
    );

    skippedCount++;

    return;

  }


  let slug =
    jobSlug(job);


  if (!slug) {

    console.warn(
      `Skipping opportunity ${index + 1}: could not create slug.`
    );

    skippedCount++;

    return;

  }


  slugCounts[slug] =
    (slugCounts[slug] || 0) + 1;


  if (slugCounts[slug] > 1) {

    slug =
      `${slug}-${slugCounts[slug]}`;

  }


  const fileName =
    `${slug}.html`;


  const filePath =
    path.join(
      JOBS_DIR,
      fileName
    );


  const page =
    buildJobPage(job);


  fs.writeFileSync(
    filePath,
    page,
    "utf8"
  );


  generatedUrls.push(
    `${SITE_URL}/jobs/${fileName}`
  );


  generatedCount++;

});


/* -------------------------------------------------------
   GENERATE SITEMAP
------------------------------------------------------- */

const staticPages = [

  `${SITE_URL}/`,

  `${SITE_URL}/index.html`,

  `${SITE_URL}/opportunities.html`,

  `${SITE_URL}/about.html`,

  `${SITE_URL}/contact.html`,

  `${SITE_URL}/join-network.html`,

  `${SITE_URL}/submit-opportunity.html`,

  `${SITE_URL}/disclaimer.html`,

  `${SITE_URL}/terms.html`,

  `${SITE_URL}/privacy.html`

];


const allUrls =
  [...new Set([
    ...staticPages,
    ...generatedUrls
  ])];


const today =
  new Date()
    .toISOString()
    .split("T")[0];


const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>

${allUrls.map(url => `  <url>
    <loc>${esc(url)}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join("\n\n")}

</urlset>
`;


fs.writeFileSync(
  path.join(ROOT,"sitemap.xml"),
  sitemap,
  "utf8"
);


/* -------------------------------------------------------
   GENERATE ROBOTS.TXT
------------------------------------------------------- */

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;


fs.writeFileSync(
  path.join(ROOT,"robots.txt"),
  robots,
  "utf8"
);


/* -------------------------------------------------------
   SUMMARY
------------------------------------------------------- */

console.log("");
console.log("======================================");
console.log(" EvalLoop Jobs — Job Page Generator");
console.log("======================================");
console.log("");

console.log(
  `Opportunities in JSON: ${jobs.length}`
);

console.log(
  `Pages generated:       ${generatedCount}`
);

console.log(
  `Skipped:                ${skippedCount}`
);

console.log(
  `Sitemap URLs:           ${allUrls.length}`
);

console.log("");

console.log(
  `Generated directory:   ${JOBS_DIR}`
);

console.log("");

console.log("Done.");
console.log("");
