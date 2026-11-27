// The -eth helper must not rewrite place names, people or ordinal numbers.
const NON_VERBS = /^(?:aijeleth|alameth|alemeth|azmaveth|chinnereth|dabbasheth|elisabeth|gennesareth|hammoleketh|hareth|harosheth|haraseth|hareseth|hazarmaveth|japheth|jerubbesheth|jetheth|mephibosheth|meshullemeth|mispereth|nazareth|peleth|beseth|pochereth|remeth|shallecheth|shibboleth|sibboleth|sophereth|tanhumeth|tebeth|topheth|zereth|zoheleth|zoheth|bosheth|ishbosheth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth)$/i;
export function splitVerbEndings(text, silentE, hasIpa) {
  return text.replace(/\b(\w{3,})eth\b/g, (word, stem) => {
    if (NON_VERBS.test(word) || hasIpa(word)) return word;
    return silentE[word.toLowerCase()] || `${stem}-eth`;
  });
}