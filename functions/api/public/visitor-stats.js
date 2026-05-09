const VISITOR_STATS_UPSTREAM = "https://api.hkskill.com/api/v1/public/visitor-stats/";

export async function onRequestGet({ env }) {
  const apiKey = env.HK_VISITOR_STATS_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, message: "Visitor stats key is not configured." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      }
    );
  }

  try {
    const upstreamResponse = await fetch(VISITOR_STATS_UPSTREAM, {
      headers: {
        "X-Visitor-Stats-Key": apiKey
      }
    });

    if (!upstreamResponse.ok) {
      console.error("Visitor stats upstream error", upstreamResponse.status, await upstreamResponse.text());
      return new Response(
        JSON.stringify({ success: false, message: "Failed to load visitor stats." }),
        {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        }
      );
    }

    const payload = await upstreamResponse.text();
    return new Response(payload, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Visitor stats proxy error", error);
    return new Response(
      JSON.stringify({ success: false, message: "Unexpected error loading visitor stats." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      }
    );
  }
}
