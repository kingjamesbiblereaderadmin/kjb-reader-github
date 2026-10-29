const NVIDIA_TTS_URL = "https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio";
const MODEL_ID = "877104f7-e885-42b9-8de8-f6e4c6303969";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  const apiKey = Deno.env.get("NVIDIA_API_KEY");
  if (!apiKey) {
    return json({
      error: "NVIDIA_API_KEY is not configured. Add it as a server-side secret in your Base44 app settings, then retry.",
      code: "MISSING_SECRET",
    }, 503);
  }

  try {
    const body = await req.json();
    const action = String(body.action || "synthesize");

    if (action === "voices") {
      const response = await fetch(`${NVIDIA_TTS_URL}/list_voices`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const raw = await response.text();
      if (!response.ok) {
        return json({ error: `NVIDIA voice lookup failed (${response.status}): ${raw.slice(0, 500)}` }, response.status);
      }
      let voices: unknown;
      try { voices = JSON.parse(raw); } catch { voices = raw; }
      return json({ success: true, voices, modelId: MODEL_ID });
    }

    const text = String(body.text || "").trim();
    const language = String(body.language || "en-GB");
    const voice = String(body.voice || "").trim();

    if (!text) return json({ error: "Enter a short passage to read aloud." }, 400);
    if (text.length > 1800) return json({ error: "For this test, keep the text under 1,800 characters." }, 400);
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
      return json({ error: "Use a locale such as en-GB or en-US." }, 400);
    }

    const form = new FormData();
    form.set("text", text);
    form.set("language", language);
    if (voice) form.set("voice", voice);
    form.set("encoding", "LINEAR_PCM");
    form.set("sample_rate_hz", "22050");

    const response = await fetch(`${NVIDIA_TTS_URL}/synthesize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 900);
      const ukHint = language === "en-GB"
        ? " NVIDIA's published Magpie Multilingual locale list currently documents en-US, not en-GB; this error may mean a British-English voice is not supported by this model."
        : "";
      return json({
        error: `NVIDIA synthesis failed (${response.status}): ${detail}${ukHint}`,
        status: response.status,
        language,
        modelId: MODEL_ID,
      }, response.status >= 500 ? 502 : response.status);
    }

    const audio = new Uint8Array(await response.arrayBuffer());
    if (!audio.length) return json({ error: "NVIDIA returned an empty audio file." }, 502);
    return json({
      success: true,
      audioBase64: bytesToBase64(audio),
      contentType: response.headers.get("content-type") || "audio/wav",
      bytes: audio.length,
      language,
      voice: voice || "NVIDIA model default",
      modelId: MODEL_ID,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected TTS error." }, 500);
  }
});
