import { put, head } from "@vercel/blob";

const KNOWN = new Set("v-ss-salt,v-ss-boulder,v-ss-whiteink,v-ls-raisin,v-pocket-suede,v-jogger-black,v-halfzip-army,v-hoodie-acorn,v-sweat-butter,rb-harvey-steel,rb-dalton-salute,rb-sweater-granite,rb-sweater-steel,rb-henley-black,rb-trainers,oc-low1-white,tn-hoodie-stone,tn-jogger-stone".split(","));
const PATH = "bought.json";

async function readList() {
  try {
    const meta = await head(PATH);
    const r = await fetch(meta.url + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.bought) ? data.bought.filter((id) => KNOWN.has(id)) : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({ bought: await readList() });
  }
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const id = body && body.id;
    if (typeof id !== "string" || !KNOWN.has(id)) return res.status(400).json({ error: "unknown item" });
    const set = new Set(await readList());
    if (body.on) set.add(id); else set.delete(id);
    const bought = [...set];
    await put(PATH, JSON.stringify({ bought }), {
      access: "public", addRandomSuffix: false, allowOverwrite: true,
      contentType: "application/json", cacheControlMaxAge: 0,
    });
    return res.status(200).json({ bought });
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
