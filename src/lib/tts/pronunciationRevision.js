// Mirrors the server's narrowly scoped recording revisions. Printed text never changes.
export default function pronunciationRevision(text) {
  // The closing notes of the epistles name men the engine reads off the
  // letters ("Tychicus" as "Tiki Coos", "Onesimus" as "Onessi Muse"), and the
  // same names stand in the verses. Naming the revision here makes the reader
  // skip the take it remembers and ask for the re-voiced one.
  // A compound name printed with a hyphen ("Beth-lehem", "Beth-el", "En-gedi")
  // is spoken as one word now, so those verses ask for the re-voiced take.
  // Elijah is said ee-LY-juh now (a long "ee" before the stress), so those
  // verses ask for the re-voiced take instead of the one they remember.
  // "prophecies" is the plural noun (PROF-uh-seez), not the verb, so those
  // verses ask for the take voiced from the pinned IPA.
  // "lucre" is LOO-kuh, so those verses ask for the take voiced from the pin.
  if (/\blucre\b/i.test(text)) return 'h30';
  if (/\bprophecies\b/i.test(text)) return 'h29';
  if (/\belijah\b/i.test(text)) return 'h28';
  if (/[A-Z][a-z]+-[a-z]/.test(text)) return 'h27';
  // Bernice was pinned to the wrong reading, and Galatia, Antioch and Laodicea
  // carried no pin at all, so those takes ask for the corrected one by name.
  if (/\b(?:bernice|galatia|antioch|laodicea)\b/i.test(text)) return 'h26';
  if (/\b(?:tychicus|onesimus|timotheus|cenchrea|pacatiana)\b/i.test(text)) return 'h23';
  // Names the recorded library was heard to get wrong, now pinned in IPA, so
  // those verses ask for the re-voiced take instead of the one they remember.
  if (/\b(?:euodias|epaphras|sopater|belteshazzar|jozadak|zerubbabel|ahaziah|mishael|mattaniah|puteoli|syracuse|trogyllium|gallio|paphos|pamphylia|pisidia|galatia|antioch|laodicea)\b/i.test(text)) return 'h24';
  if (/[;:]\s*\)/.test(text)) return 'h22';
  if (/\bwrath(?:ful)?\b/i.test(text)) return 'h21';
  if (/\bhereticks?\b/i.test(text)) return 'h20';
  if (/\b(?:soweth|sowest|sowed|sower|sowers|sowing)\b/i.test(text)) return 'h19';
  if (/\b(?:caesar|caesarea|judaea|alphaeus|galilaean|galilaeans|arimathaea|thaddaeus|aeneas|hymenaeus|lebbaeus|idumaea|bartimaeus|timaeus|praetorium|ituraea|aenon|chaldaeans|epaenetus)\b/i.test(text)) return 'h19';
  // A word voiced wrongly before it was pinned in IPA keeps its old take in the
  // device's memory and in the offline bundle. Naming the revision here is what
  // makes the reader skip both and ask the server for the re-voiced clip.
  // "baptize" was recorded with the stress on the first syllable; the IPA pin
  // moves it to the last, so these verses ask for the re-voiced take.
  // The sowing forms were recorded as "sow-eth" (the animal) before they were
  // pinned, and the æ-ligature names were re-voiced once before Judaea and
  // Cæsar were pinned. Both ask for the corrected take by name, so a device
  // holding the old bundle or download does not replay it.
  if (/\b(?:soweth|sowest|sowed|sower|sowers|sowing)\b/i.test(text)) return 'h19';
  if (/\b(?:caesar|caesarea|judaea|alphaeus|galilaean|galilaeans|arimathaea|thaddaeus|aeneas|hymenaeus|lebbaeus|idumaea|bartimaeus|timaeus|praetorium|ituraea|aenon|chaldaeans|epaenetus)\b/i.test(text)) return 'h19';
  if (/\bbaptiz(?:e|ed|est|eth|ing)\b/i.test(text)) return 'h18';
  // Sosthenes was spelled out letter by letter in every clip made before it was
  // pinned in IPA, and those clips are what the device still remembers and what
  // the offline bundle holds.
  if (/\bsosthenes\b/i.test(text)) return 'h17';
  if (/\bcainan\b/i.test(text)) return 'h16';
  if (/\benos\b/i.test(text)) return 'h15';
  if (/\bnaked\b/i.test(text)) return 'h14';
  if (/\bsatest\b/i.test(text)) return 'h13';
  if (/\badar\b/i.test(text)) return 'h12';
  if (/\bcursed\b/i.test(text)) return 'h10';
  if (/\bblessed\b/i.test(text)) return 'h8';
  if (/\b(?:goeth|doeth|seeth|lieth|dieth|useth|oweth|loveth|moveth|giveth|crieth|flieth|trieth|drieth|aijeleth|alameth|alemeth|azmaveth|chinnereth|dabbasheth|elisabeth|gennesareth|hammoleketh|hareth|harosheth|haraseth|hareseth|hazarmaveth|japheth|jerubbesheth|jetheth|mephibosheth|meshullemeth|mispereth|nazareth|peleth|beseth|pochereth|remeth|shallecheth|shibboleth|sibboleth|sophereth|tanhumeth|tebeth|topheth|zereth|zoheleth|zoheth|bosheth|ishbosheth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth)\b/i.test(text)) return 'h7';
  if (/\btears\b/i.test(text)) return 'h6';
  if (/\bevildoers?\b/i.test(text)) return 'h5';
  if (/\b(?:maketh|imputeth)\b/i.test(text)) return 'h4';
  return /\bmarketh\b|\btheir\s+desert\b|\bbow\s+down\b/i.test(text) ? 'h3' : '';
}