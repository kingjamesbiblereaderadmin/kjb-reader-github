// Mirrors the server's narrowly scoped recording revisions. Printed text never changes.
export default function pronunciationRevision(text) {
  if (/\bcursed\b/i.test(text)) return 'h10';
  if (/\bnaked\b/i.test(text)) return 'h9';
  if (/\bblessed\b/i.test(text)) return 'h8';
  if (/\b(?:goeth|doeth|seeth|lieth|dieth|useth|oweth|loveth|moveth|giveth|crieth|flieth|trieth|drieth|aijeleth|alameth|alemeth|azmaveth|chinnereth|dabbasheth|elisabeth|gennesareth|hammoleketh|hareth|harosheth|haraseth|hareseth|hazarmaveth|japheth|jerubbesheth|jetheth|mephibosheth|meshullemeth|mispereth|nazareth|peleth|beseth|pochereth|remeth|shallecheth|shibboleth|sibboleth|sophereth|tanhumeth|tebeth|topheth|zereth|zoheleth|zoheth|bosheth|ishbosheth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth)\b/i.test(text)) return 'h7';
  if (/\btears\b/i.test(text)) return 'h6';
  if (/\bevildoers?\b/i.test(text)) return 'h5';
  if (/\b(?:maketh|imputeth)\b/i.test(text)) return 'h4';
  return /\bmarketh\b|\btheir\s+desert\b|\bbow\s+down\b/i.test(text) ? 'h3' : '';
}