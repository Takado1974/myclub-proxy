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
    const groupId = process.env.MYCLUB_GROUP_ID;
    const today = new Date().toISOString().split("T")[0];

    const url = `https://api.myclub.fi/api/v2/groups/${groupId}/events/?` +
      new URLSearchParams({
        ordering: "start_time",
        start_time__gte: today,
        limit: 20,
      });

    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${process.env.MYCLUB_API_KEY}`,
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
    const events = (data.objects || []).map(ev => ({
      title:      ev.title,
      start_time: ev.start_time,
      end_time:   ev.end_time,
      location:   ev.location?.name || null,
      group:      ev.group?.name    || null,
    }));

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
