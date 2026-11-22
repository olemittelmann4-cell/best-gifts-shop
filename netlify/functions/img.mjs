import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const key = context.params.key || "";
  if (!/^[0-9a-f-]{36}$/.test(key)) return new Response("Nicht gefunden", { status: 404 });
  const res = await getStore("images").getWithMetadata(key, { type: "arrayBuffer" });
  if (!res) return new Response("Nicht gefunden", { status: 404 });
  return new Response(res.data, {
    headers: {
      "content-type": (res.metadata && res.metadata.type) || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/img/:key" };
