export async function handler(event) {
  const origin = event.headers["origin"] || "";

  if (event.httpMethod === "OPTIONS") {
    return corsResponse(null, 204, origin);
  }

  if (event.httpMethod !== "GET") {
    return corsResponse(JSON.stringify({ error: "Method not allowed" }), 405, origin);
  }

  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && origin && origin !== allowed) {
    return corsResponse(JSON.stringify({ error: "Forbidden" }), 403, origin);
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const url = `https://${process.env.MYCLUB_DOMAIN}.myclub.fi/api/events?` +
      new URLSearchParams({
        group_id:   process.env.MYCLUB_GROUP_ID,
        start_date: today,
        limit:      20,
      });

    const res = await fetch(url, {
      headers: {
        "X-myClub-token": process.env.MYCLUB_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return corsResponse(
        JSON.stringify({ error: "MyClub API error", status: res.status }),
        502, origin
      );
    }

    const data = await res.json();
    const raw = Array.isArray(data) ? data : (data.events || []);
    const events = raw.map(ev => {
      const e = ev.event || ev;
      return {
        name:      e.name,
        starts_at: e.starts_at,
        ends_at:   e.ends_at,
        venue_id:  e.venue_id  || null,
        group_id:  e.group_id  || null,
      };
    });

    return corsResponse(JSON.stringify(events), 200, origin);

  } catch (err) {
    console.error("Function error:", err);
    return corsResponse(JSON.stringify({ error: "Internal error" }), 500, origin);
  }
}

function corsResponse(body, statusCode, origin) {
  const allowed = process.env.ALLOWED_ORIGIN || "*";
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    },
    body: body || "",
  };
}
