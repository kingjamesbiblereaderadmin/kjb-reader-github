// Words the Authorised Version spells the same but says differently.
//
// A neural voice reads the letters, so it has to guess which sense a word
// carries: it says "leed" for the metal in Exodus 15:10 and "boh" for the bow
// that is bent in Genesis 37:7. The verse on screen keeps its printed spelling;
// only the text handed to the engine is respelled here, and only where the
// surrounding words settle the meaning.
//
// Kept in one module because both speech functions (the player and the bulk
// run) must build a clip from exactly the same words, or the cache would hand
// back one pronunciation for a verse and make another for the same verse.

const WORD = /\b(?:lead|bow|bows|sow|tear|tears|read|live|wound|blessed|learned|naked|cursed|aged|crooked|beloved)\b/gi;

// Spellings the engine reads wrongly whatever the sentence says around them:
// the priority names from the app's own pronunciation audit, plus the archaic
// forms it still gets wrong. Lower-case, because an all-caps syllable can make
// a neural voice spell the word out letter by letter.
const RESPELL: Record<string, string> = {
  ahasuerus: 'uh-haz-yoo-air-us',
  artaxerxes: 'ar-tuh-zurk-seez',
  chedorlaomer: 'ked-or-lay-oh-mer',
  mephibosheth: 'meh-fib-oh-sheth',
  sennacherib: 'sen-ak-uh-rib',
  shalmaneser: 'shal-muh-nee-zer',
  tirhakah: 'tir-hay-kuh',
  melchisedec: 'mel-kiz-uh-dek',
  mizpah: 'miz-pah',
  mizpeh: 'miz-peh',
  shibboleth: 'shib-oh-leth',
  esaias: 'ee-zay-us',
  selah: 'see-lah',
  urim: 'yoo-rim',
  thummim: 'thum-im',
  jubile: 'joo-buh-lee',
  hallowed: 'hal-low-ed',
  // Keep the "mark" stem distinct from "make", including through the proxy.
  marketh: 'mahr-keth',
  // Unambiguous tokens also carry IPA through both direct Azure and the proxy.
  maketh: 'maykith',
  imputeth: 'impyootith',
};

export const CORRECTED_IPA: Record<string, string> = {
  maykith: 'ˈmeɪkɪθ',
  impyootith: 'ɪmˈpjuːtɪθ',
  evildoer: 'ˈiːvəlˌduːə',
  evildoers: 'ˈiːvəlˌduːəz',
  teers: 'tɪəz',
  // The Authorised Version gives "blessed" its own syllable (BLESS-id). The
  // hyphen respelling on its own was flattened back to "blest" by the engine,
  // so the word is pinned in IPA the same way "teers" is.
  'bless-ed': 'ˈblesɪd',
  goeth: 'ˈɡəʊɪθ', doeth: 'ˈduːɪθ', seeth: 'ˈsiːɪθ',
  lieth: 'ˈlaɪɪθ', dieth: 'ˈdaɪɪθ', useth: 'ˈjuːzɪθ', oweth: 'ˈəʊɪθ',
  loveth: 'ˈlʌvɪθ', moveth: 'ˈmuːvɪθ', giveth: 'ˈɡɪvɪθ',
  crieth: 'ˈkraɪɪθ', flieth: 'ˈflaɪɪθ', trieth: 'ˈtraɪɪθ', drieth: 'ˈdraɪɪθ',
};

const RESPELL_RE = new RegExp(
  `\\b(${Object.keys(RESPELL).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'gi',
);

const wordBefore = (before: string) => {
  const m = before.match(/([A-Za-z']+)[^A-Za-z']*$/);
  return m ? m[1].toLowerCase() : '';
};

const wordAfter = (after: string) => {
  const m = after.match(/^[^A-Za-z']*([A-Za-z']+)/);
  return m ? m[1].toLowerCase() : '';
};

const secondAfter = (after: string) => {
  const m = after.match(/^[^A-Za-z']*([A-Za-z']+)[^A-Za-z']*([A-Za-z']+)/);
  return m ? m[2].toLowerCase() : '';
};

// The respelling is returned in the same case as the printed word, so a word
// that opens a sentence stays a capital and is never spelled out letter by
// letter by the engine.
function say(word: string, prev: string, next: string, next2: string): string {
  switch (word) {
    // The metal is always the noun in a list ("iron, tin, and lead") or after
    // "as", "of", "with". Everything else is the verb, which the KJB otherwise
    // spells "led" or "leadeth": "lead the people", "lead Zedekiah to Babylon".
    case 'lead':
      if (/^(as|like|of|with|than|from|upon)$/.test(prev)) return 'led';
      if (/^(the|a|and|or)$/.test(prev) && /^(is|was|be|and|they|in|or|that)?$/.test(next)) return 'led';
      return 'leed';
    // The weapon and the rainbow are long "o"; bending the knee is "bau".
    case 'bow':
      if (/^(down|yourselves|yourself|thyself|himself|themselves|unto|to|before|at)$/.test(next)) return 'bough';
      if (next === 'the' && /^(knee|knees)$/.test(next2)) return 'bau';
      if (/^(my|his|her|their|thy|our|your|the|a|this|that)$/.test(prev)) return 'boh';
      return 'bau';
    case 'bows': return 'bohz';
    // Scattering seed is long "o"; "the sow that was washed" is a pig.
    case 'sow': return /^(a|the)$/.test(prev) ? 'sau' : 'soh';
    // Weeping is "teer"; rending in pieces is "tair".
    case 'tears': return 'teers';
    case 'tear': return 'tair';
    // "have ye not read" is the past, "he that readeth" is the present.
    case 'read':
      if (/^(shall|shalt|will|wilt|would|may|might|must|can|could|should|to|let|do|doth|dost)$/.test(prev)) return word;
      if (/^(have|hast|has|hath|had|having|did|never|not|ye|we|they|and|then|when|after|afterward|also|which)$/.test(prev)) return 'red';
      if (/^(it|in|all|before|therein|them|out|the|not|unto|from|their|his|her|this|that)$/.test(next)) return 'red';
      return word;
    // "a live coal" is the only place the adjective appears.
    case 'live': return /^(coal|coals)$/.test(next) ? 'lyve' : word;
    // "wound about" is the past of wind; an injury keeps its own sound.
    case 'wound': return /^(about|round|roundabout)$/.test(next) ? 'wownd' : word;
    // The "-ed" words the Authorised Version reads with their own syllable.
    case 'blessed': return /^(have|hast|has|had|having)$/.test(prev) ? word : 'bless-ed';
    case 'learned': return /^(have|hast|has|had|having|never)$/.test(prev) ? word : 'learn-ed';
    case 'naked': return 'nay-ked';
    // "cursed be Canaan" and "cursed is the ground" carry their own syllable;
    // "he cursed the LORD's anointed" is the plain past and does not.
    case 'cursed': return /^(he|she|they|we|ye|i|thou|it|had|have|hath|hast)$/.test(prev) && /^(the|his|her|their|thy|my|your|our|him|them|me|thee|this|that|a)$/.test(next) ? word : 'curs-ed';
    case 'aged': return 'ay-jed';
    case 'crooked': return 'crook-ed';
    case 'beloved': return 'be-lov-ed';
    default: return word;
  }
}

/**
 * Respell the words whose meaning the verse settles.
 * `changed` is true when at least one word was rewritten, which is what tells
 * the cache that this verse needs a fresh clip.
 */
export function applyHeteronyms(text: string): { text: string; changed: boolean; revision: string } {
  let changed = false;
  // Only these corrections get a new recording key. Existing h2 recordings for
  // other settled pronunciations are retained and are not generated again.
  const auditUpdated = /\b(?:goeth|doeth|seeth|lieth|dieth|useth|oweth|loveth|moveth|giveth|crieth|flieth|trieth|drieth|aijeleth|alameth|alemeth|azmaveth|chinnereth|dabbasheth|elisabeth|gennesareth|hammoleketh|hareth|harosheth|haraseth|hareseth|hazarmaveth|japheth|jerubbesheth|jetheth|mephibosheth|meshullemeth|mispereth|nazareth|peleth|beseth|pochereth|remeth|shallecheth|shibboleth|sibboleth|sophereth|tanhumeth|tebeth|topheth|zereth|zoheleth|zoheth|bosheth|ishbosheth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth)\b/i.test(text);
  const blessedUpdated = /\bblessed\b/i.test(text);
  const tearsUpdated = /\btears\b/i.test(text);
  const evilUpdated = /\bevildoers?\b/i.test(text);
  const newlyUpdated = /\b(?:maketh|imputeth)\b/i.test(text);
  const updated = /\bmarketh\b|\btheir\s+desert\b|\bbow\s+down\b/i.test(text);
  const source = String(text || '').replace(/\b(their\s+)desert\b/gi, '$1dih-zurt');
  if (source !== text) changed = true;
  const fixed = source.replace(RESPELL_RE, (word: string) => {
    const replacement = RESPELL[word.toLowerCase()];
    if (!replacement) return word;
    changed = true;
    return replacement;
  });
  const out = fixed.replace(WORD, (word: string, offset: number, whole: string) => {
    const before = whole.slice(Math.max(0, offset - 48), offset);
    const after = whole.slice(offset + word.length, offset + word.length + 48);
    const replacement = say(word.toLowerCase(), wordBefore(before), wordAfter(after), secondAfter(after));
    if (replacement === word.toLowerCase()) return word;
    changed = true;
    return /^[A-Z]/.test(word) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
  });
  return { text: out, changed, revision: blessedUpdated ? 'h8' : auditUpdated ? 'h7' : tearsUpdated ? 'h6' : evilUpdated ? 'h5' : newlyUpdated ? 'h4' : updated ? 'h3' : changed ? 'h2' : '' };
}