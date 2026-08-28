export const config = {
  runtime: "edge",
};
const IMF_URL = "https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD";
export default async function handler(): Promise<Response> {
  try {
    const imfRes = await fetch(IMF_URL, {
      headers: { Accept: "application/json" },
    });
    if (!imfRes.ok) {
      return new Response(JSON.stringify({ error: `IMF API returned ${imfRes.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await imfRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to reach IMF API", detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
