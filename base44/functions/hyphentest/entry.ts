// TEMPORARY diagnostic page: renders identical hyphenatable text in five
// layout variants to pinpoint which CSS property suppresses Chromium's
// automatic hyphenation in the reader's two-column view. Delete after use.
export default async function(req) {
  try {
    const para = "internationalization internationalization internationalization";

    const block = (label, inner) => `
      <div style="margin:10px 0; padding:8px; border:3px solid #000;">
        <div style="font:700 16px sans-serif; margin-bottom:6px;">${label}</div>
        <div style="width:150px; font:22px/1.3 serif;">${inner}</div>
      </div>`;

    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>hyphentest</title>
<style>
  .flexrow { display:flex; align-items:flex-start; width:100%; gap:0.5em; }
  .flexitem { flex:1; min-width:0; }
  .supnum { flex-shrink:0; width:1.5em; font:700 12px sans-serif; color:#a33; }
</style>
</head>
<body style="margin:0; padding:10px;">
${block("H0 lang=en-US", `<div lang="en-US" style="-webkit-hyphens:auto; hyphens:auto;"><p style="margin:0;">${para}</p></div>`)}
${block("H1 lang=en", `<div lang="en" style="-webkit-hyphens:auto; hyphens:auto;"><p style="margin:0;">${para}</p></div>`)}
${block("H2 lang=en-GB", `<div lang="en-GB" style="-webkit-hyphens:auto; hyphens:auto;"><p style="margin:0;">${para}</p></div>`)}
${block("H3 lang=en-US + flex + break-word + pretty", `<div lang="en-US" class="flexrow" style="-webkit-hyphens:auto; hyphens:auto; overflow-wrap:break-word; text-wrap:pretty;"><span class="supnum">1</span><span class="flexitem"><p style="margin:0;">${para}</p></span></div>`)}
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}