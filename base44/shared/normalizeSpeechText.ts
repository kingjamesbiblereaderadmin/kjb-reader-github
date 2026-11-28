// One source-cleaning path for live speech, batch speech and repair selection.
// Only spoken input changes. The printed Bible is never modified.
export function normalizeSpeechText(raw) {
  let s = String(raw || '');
  s = s.replace(/<<[^>]*>>/g, ' ');
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[A-Za-z\[])/g, "$1'");
  s = s.replace(/([A-Za-z\]])[\u00B6\uFFFD\u000F\u2019](?=[^A-Za-z\[]|$)/g, "$1'");
  s = s.replace(/(^|[\s(\[])[\u00B6\uFFFD\u000F](?=[a-z])/g, '$1\u00C6');
  s = s.replace(/[\u00B6\uFFFD\u000F]/g, ' ');
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/[\u00C6]/g, 'Ae').replace(/[\u00E6]/g, 'ae');
  s = s.replace(/\[([^\]]*)\]/g, '$1');
  s = s.replace(/\b[A-Z]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
  s = s.replace(/([:;])-?[)\]]/g, '$1');
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '');
  s = s.replace(/\s+([,.;:!?])/g, '$1');
  // "I John, who also am your brother" is the apostle speaking, but the engine
  // reads "I" before a book's name as that book's roman numeral: Revelation 1:9
  // came out "First John". A comma after the pronoun is the one mark that says
  // it is the speaker, and the engine reads it as "I". Only names that are also
  // books of the Bible are listed: any other name is never taken for a numeral,
  // so a comma there would only add a pause that is not in the verse.
  for (const name of ['John', 'Daniel']) {
    s = s.replace(new RegExp(`(^|[^A-Za-z])I\\s+${name}\\b`, 'g'), `$1I, ${name}`);
  }
  return s.replace(/\s+/g, ' ').trim();
}