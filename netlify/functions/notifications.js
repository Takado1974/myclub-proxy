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
    const url = `https://${process.env.MYCLUB_DOMAIN}.myclub.fi/api/notifications?` +
      new URLSearchParams({
        group_id: process.env.MYCLUB_GROUP_ID,
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
    const raw = Array.isArray(data) ? data : (data.notifications || []);
    const notifications = raw.map(n => {
      const notif = n.notification || n;
      return {
        title: notif.subject,
        body:  notif.details_html || notif.details,
        date:  notif.published_at,
      };
    });

    return corsResponse(JSON.stringify(notifications), 200, origin);

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
