export const config = {
  runtime: "edge", // fast + no cold-start concerns for a simple passthrough
};

const IMF_URL =
  "https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD";

export default async function handler(): Promise<Response> {
  try {
    const imfRes = await fetch(IMF_URL);
    if (!imfRes.ok) {
      return new Response(
        JSON.stringify({ error: `IMF API returned ${imfRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
    const data = await imfRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Restrict this to your actual domain in production rather than "*"
        // once you know it, to avoid other sites piggybacking on your proxy.
        "Access-Control-Allow-Origin": "*",
        // Cache at the edge for a while — IMF data doesn't change intraday.
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to reach IMF API", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
