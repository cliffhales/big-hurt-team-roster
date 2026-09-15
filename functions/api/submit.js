const ALLOWED_ORIGINS = new Set([
  "https://big-hurt-team-roster.pages.dev",
  "https://big-hurt-survey.pages.dev",
  "https://peninsulaadventuresports.com",
  "https://www.peninsulaadventuresports.com",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://big-hurt-team-roster.pages.dev";
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin")) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, origin);

  if (!env.APPS_SCRIPT_URL || !env.SUBMISSION_SECRET) {
    return json({ error: "Submission service is not configured yet." }, 503, origin);
  }

  let row;
  try {
    const body = await request.json();
    row = body?.row;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400, origin);
  }

  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return json({ error: "A roster row is required." }, 400, origin);
  }

  const response = await fetch(env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.SUBMISSION_SECRET, row }),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { error: "The spreadsheet service returned an invalid response." };
  }

  if (!response.ok || result.ok !== true) {
    return json({ error: result.error || "The spreadsheet service rejected the submission." }, 502, origin);
  }

  return json({ ok: true }, 200, origin);
}
