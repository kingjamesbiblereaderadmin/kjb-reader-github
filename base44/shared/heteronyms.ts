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

const WORD = /\b(?:lead|leadeth|leadest|leading|leads|bow|bows|bowed|boweth|bowing|sow|soweth|sowest|sowed|tear|tears|read|readeth|readest|reading|live|wound|wounds|blessed|blessedness|learned|naked|cursed|aged|crooked|beloved)\b/gi;

// Words that settle which sense a spelling carries. Every branch below returns
// an explicit respelling — never the bare word — because leaving it bare let the
// engine guess the other tense ("whoso readeth" came out as the past "red").
const MODAL = /^(?:shall|shalt|will|wilt|would|may|might|must|can|could|should|to|let|do|doth|dost|didst)$/;
const PAST_MARK = /^(?:have|hast|has|hath|had|having|did|never|not|ye|we|they|he|she|it|i|thou|and|then|when|after|afterward|also|which|that|who|whosoever|as|so|thus|but|if|because|wherefore|for|therefore)$/;
const OBJECT_AFTER = /^(?:it|in|all|before|therein|them|out|the|unto|from|their|his|her|this|that|of|thereout|thereof)$/;

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
  // "prophecies" is the plural NOUN — PROF-uh-seez, the short o of "prophecy"
  // with a soft c. Left to the letters the engine says "pro-FEE-seez", which is
  // the sound of the verb "prophesy".
  prophecies: 'ˈprɒfɪsiːz',
  // "lucre" (filthy lucre) is LOO-kuh: a long u and a soft final -re, never
  // "LOO-ker" with the r sounded.
  lucre: 'ˈluːkə',
  // ── The other part of speech the engine gives these words ──
  // "prophesy" and its inflections are the VERB — PROF-uh-sigh, with a long i
  // in the last syllable. Read off the letters the engine gave them the noun's
  // -ee, so "they shall prophesy" came out as "prophecy".
  prophesy: 'ˈprɒfɪsaɪ',
  prophesied: 'ˈprɒfɪsaɪd',
  prophesieth: 'ˈprɒfɪsaɪɪθ',
  prophesying: 'ˈprɒfɪsaɪɪŋ',
  prophesyings: 'ˈprɒfɪsaɪɪŋz',
  prophesyest: 'ˈprɒfɪsaɪɪst',
  // "incense" is the NOUN — IN-sens, stress on the first syllable. The engine
  // stresses it as the verb (in-SENS), which the KJB never uses here.
  incense: 'ˈɪnsɛns',
  // "shew" and its family are the AV's spelling of "show" — SHO, never "shoo".
  shew: 'ʃəʊ',
  shewed: 'ʃəʊd',
  shewedst: 'ˈʃəʊdɪst',
  shewest: 'ˈʃəʊɪst',
  sheweth: 'ˈʃəʊɪθ',
  shewing: 'ˈʃəʊɪŋ',
  shewn: 'ʃəʊn',
  shewbread: 'ˈʃəʊbrɛd',
  shewbreads: 'ˈʃəʊbrɛdz',
  // "live" in "thou livest" and "he liveth" is the VERB — LIV, the short i of
  // "give" — but the engine reads the -est and -eth forms as the adjective and
  // says "LYVE-est", the sound of a live broadcast. Every occurrence in the AV
  // is the verb, so both forms are pinned rather than left to the letters.
  livest: 'ˈlɪvɪst',
  liveth: 'ˈlɪvɪθ',
  // "victuals" is VIT-lz — the c is silent and the u is swallowed.
  victuals: 'ˈvɪtəlz',
  // Words the KJB prints with the æ ligature (Cæsar, Judæa, Cæsarea …). The
  // reader spells the ligature out as "ae" before speaking, so they are keyed by
  // the plain spelling and pinned to standard British forms; left to itself the
  // engine can guess ("KAI-zar", "joo-DAY-uh").
  caesar: 'ˈsiːzə',
  caesarea: 'ˌsiːzəˈriːə',
  // Cambridge Dictionary UK: https://dictionary.cambridge.org/pronunciation/english/judaea
  // Standard British joo-DEE-uh replaces the earlier custom joo-DAY-uh.
  judaea: 'dʒuːˈdiːə',
  alphaeus: 'ælˈfiːəs',
  galilaean: 'ˌɡælɪˈliːən',
  galilaeans: 'ˌɡælɪˈliːənz',
  arimathaea: 'ˌærɪməˈθiːə',
  thaddaeus: 'ˈθædiːəs',
  aeneas: 'ɪˈniːəs',
  hymenaeus: 'ˌhaɪməˈniːəs',
  lebbaeus: 'leˈbiːəs',
  idumaea: 'aɪˈdjuːmiə',
  bartimaeus: 'bɑːtɪˈmiːəs',
  timaeus: 'tɪˈmiːəs',
  praetorium: 'priːˈtɔːriəm',
  ituraea: 'ˌɪtjʊˈriːə',
  aenon: 'ˈiːnɒn',
  chaldaeans: 'kælˈdiːənz',
  epaenetus: 'ɪˈpiːnɪtəs',
  maykith: 'ˈmeɪkɪθ',
  impyootith: 'ɪmˈpjuːtɪθ',
  evildoer: 'ˈiːvəlˌduːə',
  evildoers: 'ˈiːvəlˌduːəz',
  teers: 'tɪəz',
  // Cainan is KAY-nuhn, with a hard K and stress on the first syllable.
  cainan: 'ˈkeɪnən',
  // Keep Enos as EE-noss, never an "ay" sound in the final syllable.
  enos: 'ˈiːnɒs',
  // Standard British and international dictionary pronunciation: NAY-kid.
  naked: 'ˈneɪkɪd',
  // The Authorised Version gives "blessed" its own syllable (BLESS-id). The
  // hyphen respelling on its own was flattened back to "blest" by the engine,
  // so the word is pinned in IPA the same way "teers" is.
  'bless-ed': 'ˈblesɪd',
  // "Cursed" in the Authorised Version carries its own second syllable
  // (CURS-id), and the hyphen respelling alone was flattened back to "curst"
  // exactly as "bless-ed" was, so it is pinned in IPA too.
  'curs-ed': 'ˈkɜːsɪd',
  // The month in Esther, kept with its Hebrew stress: "ah-DAR", the second
  // syllable carrying the accent, not the English "AY-dar".
  adar: 'ɑːˈdɑː',
  // "thou satest in the throne" (Psalm 9:4) is SAT-est, not "say-test".
  satest: 'ˈsætest',
  // The closing notes of the epistles name men the engine reads off the
  // letters: "Tychicus" came out "Tiki Coos", "Onesimus" "Onessi Muse" and
  // "Timotheus" "Taimothius". The same names stand in the verses too (Acts,
  // the pastorals, Philemon), so each is pinned in IPA once for both.
  tychicus: 'ˈtɪkɪkəs',
  onesimus: 'əʊˈnɛsɪməs',
  timotheus: 'tɪˈməʊθiəs',
  cenchrea: 'ˈsɛnkriə',
  pacatiana: 'ˌpækəˈtaɪənə',

  // ── Proper names ──
  // A name is printed the same in every edition but said one way: rather than
  // let the voice guess at the letters, the dictionary form (British RP) is
  // pinned. The first group is the names the recorded library actually got
  // wrong — each checked against the stored word timings, which carry what the
  // engine really said ("Io Dias" for Euodias, "Peolti Olli" for Puteoli) — so
  // those verses are recorded again under h24.
  euodias: 'juːˈəʊdiəs',
  epaphras: 'ˈepəfrəs',
  sopater: 'ˈsəʊpətə',
  belteshazzar: 'belˈteʃæzə',
  jozadak: 'ˈdʒəʊzədæk',
  zerubbabel: 'zəˈrʌbəbəl',
  ahaziah: 'ˌeɪhəˈzaɪə',
  mishael: 'ˈmɪʃeɪəl',
  mattaniah: 'ˌmætəˈnaɪə',
  puteoli: 'pjuːˈtiːəlaɪ',
  syracuse: 'ˈsaɪrəkjuːz',
  trogyllium: 'trəʊˈɡɪliəm',
  gallio: 'ˈɡæliəʊ',
  paphos: 'ˈpeɪfɒs',
  pamphylia: 'pæmˈfɪliə',
  pisidia: 'pɪˈsɪdiə',
  // Galatia, Antioch and Laodicea triggered a re-recording with the site names
  // but were never pinned, so those takes were voiced from the bare letters
  // again. Pinned in the dictionary forms.
  galatia: 'ɡəˈleɪʃə',
  antioch: 'ˈæntiɒk',
  laodicea: 'leɪˌɒdɪˈsiːə',
  // The rest — right in the dictionary form, applied to every recording made
  // from here on (a verse keeps its old clip until something else re-voices it).
  nicopolis: 'nɪˈkɒpəlɪs',
  hierapolis: 'ˌhaɪəˈræpəlɪs',
  colosse: 'kəˈlɒsi',
  phrygia: 'ˈfrɪdʒiə',
  lycaonia: 'ˌlaɪkəˈəʊniə',
  cilicia: 'sɪˈlɪʃə',
  miletus: 'maɪˈliːtəs',
  troas: 'ˈtrəʊæs',
  rhegium: 'ˈriːdʒiəm',
  melita: 'ˈmelɪtə',
  dalmatia: 'dælˈmeɪʃə',
  illyricum: 'ɪˈlɪrɪkəm',
  achaia: 'əˈkaɪə',
  phenice: 'fɪˈnaɪsi',
  salmone: 'sælˈməʊni',
  cnidus: 'ˈnaɪdəs',
  myra: 'ˈmaɪrə',
  patara: 'ˈpætərə',
  coos: 'kəʊs',
  assos: 'ˈæsɒs',
  derbe: 'ˈdɜːbi',
  lystra: 'ˈlɪstrə',
  pergamos: 'ˈpɜːɡəmɒs',
  thyatira: 'ˌθaɪəˈtaɪrə',
  smyrna: 'ˈsmɜːnə',
  sardis: 'ˈsɑːdɪs',
  niger: 'ˈnaɪdʒə',
  manaen: 'ˈmæneɪən',
  lucius: 'ˈluːʃəs',
  sosipater: 'səʊˈsɪpətə',
  aristarchus: 'ˌærɪsˈtɑːkəs',
  secundus: 'sɪˈkʌndəs',
  gaius: 'ˈɡaɪəs',
  trophimus: 'ˈtrɒfɪməs',
  onesiphorus: 'ˌɒnɪˈsɪfərəs',
  archippus: 'ɑːˈkɪpəs',
  apphia: 'ˈæfiə',
  nymphas: 'ˈnɪmfəs',
  demas: 'ˈdiːməs',
  crescens: 'ˈkresənz',
  phygellus: 'faɪˈdʒeləs',
  hermogenes: 'hɜːˈmɒdʒəniːz',
  philetus: 'fɪˈliːtəs',
  eunice: 'juːˈnaɪsi',
  lois: 'ˈləʊɪs',
  priscilla: 'prɪˈsɪlə',
  syntyche: 'ˈsɪntɪki',
  clement: 'ˈklemənt',
  justus: 'ˈdʒʌstəs',
  crispus: 'ˈkrɪspəs',
  dorcas: 'ˈdɔːkəs',
  tabitha: 'ˈtæbɪθə',
  lydia: 'ˈlɪdiə',
  agabus: 'ˈæɡəbəs',
  demetrius: 'dɪˈmiːtriəs',
  diana: 'daɪˈænə',
  // Bernice (Acts 25–26) is BUR-neess, never "ber-NY-see".
  bernice: 'bɜːˈniːs',
  drusilla: 'druːˈsɪlə',
  lysias: 'ˈlɪsiəs',
  porcius: 'ˈpɔːʃəs',
  elymas: 'ˈelɪməs',
  sergius: 'ˈsɜːdʒiəs',
  barjesus: 'bɑːˈdʒiːzəs',
  claudius: 'ˈklɔːdiəs',
  augustus: 'ɔːˈɡʌstəs',
  tiberius: 'taɪˈbɪəriəs',
  archelaus: 'ˌɑːkɪˈleɪəs',
  herodias: 'hɪˈrəʊdiəs',
  caiaphas: 'ˈkeɪəfəs',
  annas: 'ˈænəs',
  matthias: 'məˈθaɪəs',
  cleopas: 'ˈkliːəpəs',
  lazarus: 'ˈlæzərəs',
  magdalene: 'ˈmæɡdəliːn',
  jairus: 'dʒeɪˈaɪrəs',
  nathanael: 'nəˈθænɪəl',
  zebedee: 'ˈzebədiː',
  salome: 'səˈləʊmi',
  boanerges: 'ˌbəʊəˈnɜːdʒiːz',
  chorazin: 'ˈkɒrəzɪn',
  decapolis: 'dɪˈkæpəlɪs',
  gadarenes: 'ˈɡædəriːnz',
  bethsaida: 'beθˈseɪɪdə',
  bethesda: 'bəˈθezdə',
  siloam: 'saɪˈləʊəm',
  nazareth: 'ˈnæzəreθ',
  bethlehem: 'ˈbeθlɪhem',
  bethany: 'ˈbeθəni',
  tabor: 'ˈteɪbɔː',
  hermon: 'ˈhɜːmɒn',
  carmel: 'ˈkɑːmel',
  megiddo: 'məˈɡɪdəʊ',
  moriah: 'mɒˈraɪə',
  kidron: 'ˈkɪdrɒn',
  shiloh: 'ˈʃaɪləʊ',
  shechem: 'ˈʃiːkem',
  gibeon: 'ˈɡɪbiən',
  hebron: 'ˈhiːbrɒn',
  jericho: 'ˈdʒerɪkəʊ',
  gilgal: 'ˈɡɪlɡæl',
  bethel: 'ˈbeθel',
  sodom: 'ˈsɒdəm',
  gomorrah: 'ɡəˈmɒrə',
  nineveh: 'ˈnɪnɪvə',
  nimrod: 'ˈnɪmrɒd',
  tarshish: 'ˈtɑːʃɪʃ',
  ophir: 'ˈəʊfə',
  havilah: 'ˈhævɪlə',
  jephthah: 'ˈdʒefθə',
  sisera: 'ˈsɪsərə',
  othniel: 'ˈɒθnɪəl',
  ehud: 'ˈiːhʌd',
  gideon: 'ˈɡɪdiən',
  elkanah: 'elˈkeɪnə',
  peninnah: 'pɪˈnɪnə',
  hophni: 'ˈhɒfnaɪ',
  phinehas: 'ˈfɪnɪhæs',
  ichabod: 'ˈɪkəbɒd',
  dagon: 'ˈdeɪɡɒn',
  delilah: 'dɪˈlaɪlə',
  naomi: 'neɪˈəʊmaɪ',
  boaz: 'ˈbəʊæz',
  elisha: 'ɪˈlaɪʃə',
  // Elijah opens with a long "ee" before the stress — ee-LY-juh — not the
  // short "i" the engine had been reading.
  elijah: 'iˈlaɪdʒə',
  gehazi: 'ɡɪˈheɪzaɪ',
  naaman: 'ˈneɪəmən',
  hazael: 'ˈhæzeɪəl',
  jezreel: 'ˈdʒezriːəl',
  naboth: 'ˈneɪbɒθ',
  joab: 'ˈdʒəʊæb',
  abner: 'ˈæbnə',
  absalom: 'ˈæbsələm',
  adonijah: 'ˌædəˈnaɪdʒə',
  ahithophel: 'əˈhɪθəfel',
  barzillai: 'bɑːˈzɪlaɪ',
  shimei: 'ˈʃɪmaɪ',
  uriah: 'jʊˈraɪə',
  zadok: 'ˈzeɪdɒk',
  abiathar: 'əˈbaɪəθɑː',
  amasa: 'əˈmeɪsə',
  amnon: 'ˈæmnɒn',
  tamar: 'ˈteɪmɑː',
  jehu: 'ˈdʒiːhjuː',
  jezebel: 'ˈdʒezəbel',
  athaliah: 'ˌæθəˈlaɪə',
  jehoiada: 'dʒɪˈhɔɪədə',
  jotham: 'ˈdʒəʊθəm',
  ahaz: 'ˈeɪhæz',
  jeroboam: 'ˌdʒerəˈbəʊəm',
  abijah: 'əˈbaɪdʒə',
  asa: 'ˈeɪsə',
  jehoshaphat: 'dʒɪˈhɒʃəfæt',
  zedekiah: 'ˌzedɪˈkaɪə',
  jehoiakim: 'dʒɪˈhɔɪəkɪm',
  jehoiachin: 'dʒɪˈhɔɪəkɪn',
  sanballat: 'sænˈbælət',
  tobiah: 'təˈbaɪə',
  geshem: 'ˈɡeʃem',
  haggai: 'ˈhæɡaɪ',
  malachi: 'ˈmæləkaɪ',
  micah: 'ˈmaɪkə',
  nahum: 'ˈneɪhəm',
  jonah: 'ˈdʒəʊnə',
  amos: 'ˈeɪmɒs',
  hosea: 'həʊˈziːə',
  joel: 'ˈdʒəʊəl',
  ezekiel: 'ɪˈziːkiəl',
  baruch: 'ˈbeərʊk',
  gedaliah: 'ˌɡedəˈlaɪə',
  nebuzaradan: 'ˌnebjʊˈzærədæn',
  nebushasban: 'ˌnebʊˈʃæzbən',
  merodach: 'ˈmerədæk',
  sargon: 'ˈsɑːɡɒn',
  rabshakeh: 'ˈræbʃəke',
  meshach: 'ˈmiːʃæk',
  shadrach: 'ˈʃeɪdræk',
  abednego: 'əˈbednɪɡəʊ',
  belshazzar: 'belˈʃæzə',
  johanan: 'dʒəʊˈheɪnən',
  azariah: 'ˌæzəˈraɪə',
  hananiah: 'ˌhænəˈnaɪə',
  ebedmelech: 'ˌiːbedˈmiːlek',
  abimelech: 'əˈbɪməlek',
  ahimelech: 'əˈhɪməlek',
  potiphar: 'ˈpɒtɪfɑː',
  jochebed: 'ˈjɒkɪbed',
  korah: 'ˈkɔːrə',
  dathan: 'ˈdeɪθən',
  abiram: 'əˈbaɪræm',
  balaam: 'ˈbeɪləm',
  balak: 'ˈbeɪlæk',
  sihon: 'ˈsaɪhɒn',
  jabin: 'ˈdʒeɪbɪn',
  agag: 'ˈeɪɡæɡ',
  aphek: 'ˈeɪfek',
  ashdod: 'ˈæʃdɒd',
  ashkelon: 'ˈæʃkelɒn',
  ekron: 'ˈekrɒn',
  gath: 'ɡæθ',
  gaza: 'ˈɡeɪzə',
  ebal: 'ˈiːbəl',
  gerizim: 'ˈɡerɪzɪm',
  kohath: 'ˈkəʊhæθ',
  merari: 'mɪˈrɑːraɪ',
  gershon: 'ˈɡɜːʃɒn',
  amram: 'ˈæmræm',
  naphtali: 'ˈnæftəlaɪ',
  zebulun: 'ˈzebjʊlən',
  issachar: 'ˈɪsəkɑː',
  asher: 'ˈæʃə',
  simeon: 'ˈsɪmiən',
  reuben: 'ˈruːbən',
  zilpah: 'ˈzɪlpə',
  bilhah: 'ˈbɪlhə',
  // Sosthenes (Acts 18:17, 1 Corinthians 1:1) came out as letters spelled one
  // by one. Pinned in IPA so the engine says the name: SOS-thuh-neez.
  sosthenes: 'ˈsɒsθəniːz',
  // Baptize keeps the Greek -IZE ending (bap-TIZE), not the "bap-tees" the
  // engine guesses at from the printed letters. Every printed form is pinned in
  // IPA, so the verse keeps its spelling and only the spoken word changes.
  baptize: 'bæpˈtaɪz',
  baptized: 'bæpˈtaɪzd',
  baptizest: 'bæpˈtaɪzɪst',
  baptizeth: 'bæpˈtaɪzɪθ',
  baptizing: 'bæpˈtaɪzɪŋ',
  goeth: 'ˈɡəʊɪθ', doeth: 'ˈduːɪθ', seeth: 'ˈsiːɪθ',
  lieth: 'ˈlaɪɪθ', dieth: 'ˈdaɪɪθ', useth: 'ˈjuːzɪθ', oweth: 'ˈəʊɪθ',
  loveth: 'ˈlʌvɪθ', moveth: 'ˈmuːvɪθ', giveth: 'ˈɡɪvɪθ',
  crieth: 'ˈkraɪɪθ', flieth: 'ˈflaɪɪθ', trieth: 'ˈtraɪɪθ', drieth: 'ˈdraɪɪθ',
  // "Soweth" is the seed, never the pig: SOH-ith, with the diphthong of "so".
  // Left to the engine the -eth ending pulls it towards "sow-eth" (as in the
  // animal) or splits the vowel, so every printed form is pinned.
  // "Heretick" is the Authorised Version's spelling of heretic: HER-e-tik,
  // with a short e in the middle. The engine reads the -ick as a hard "eek".
  heretick: 'ˈhɛrɪtɪk', hereticks: 'ˈhɛrɪtɪks',
  soweth: 'ˈsəʊɪθ', sowest: 'ˈsəʊɪst', sowed: 'səʊd',
  sower: 'ˈsəʊə', sowers: 'ˈsəʊəz', sowing: 'ˈsəʊɪŋ',
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
    // ── read: present "reed", past "red" ──
    // "he that readeth" is the present; "have ye not read" is the past.
    case 'read':
      if (MODAL.test(prev)) return 'reed';
      if (PAST_MARK.test(prev)) return 'red';
      if (OBJECT_AFTER.test(next)) return 'red';
      return 'reed';
    case 'readeth':
    case 'readest':
    case 'reading':
      return `reed${word.slice(4)}`;
    // ── live: the verb is liv, the adjective in "a live coal" is lyve ──
    case 'live':
      return /^(?:coal|coals)$/.test(next) ? 'lyve' : 'liv';
    // ── lead: the metal is led, the verb is leed ──
    case 'lead':
      if (/^(?:as|like|of|with|than|from|upon)$/.test(prev)) return 'led';
      if (/^(?:and|or)$/.test(prev) && !/^(?:the|a|an|his|her|their|thy|my|your|our|them|me|thee|you|him|it|us|forth|away|up|out|into|unto|to|through|in|about)$/.test(next)) return 'led';
      return 'leed';
    case 'leadeth':
    case 'leadest':
    case 'leading':
    case 'leads':
      return `leed${word.slice(4)}`;
    // ── bow: bending is bough, the weapon and the rainbow are boh ──
    case 'bow':
      if (/^(?:down|yourselves|yourself|thyself|himself|themselves|unto|to|before|at)$/.test(next)) return 'bough';
      if (next === 'the' && /^(?:knee|knees)$/.test(next2)) return 'bau';
      if (/^(?:my|his|her|their|thy|our|your|the|a|this|that|with|whose)$/.test(prev)) return 'boh';
      return 'bough';
    case 'bows': return 'bohz';
    case 'bowed': return 'boughd';
    case 'boweth':
    case 'bowing':
      return `bough${word.slice(3)}`;
    // ── sow: scattering seed is soh, the pig is sau ──
    case 'sow':
      return /^(?:a|the|that)$/.test(prev) ? 'sau' : 'soh';
    case 'sowed': return 'sohd';
    case 'soweth':
    case 'sowest':
      return `soh${word.slice(3)}`;
    // ── tear: weeping is teer, rending is tair ──
    case 'tears': return 'teers';
    case 'tear': return 'tair';
    // ── wound: an injury is woond, "wound about" is the past of wind ──
    case 'wound': return /^(?:about|round|roundabout)$/.test(next) ? 'wownd' : 'woond';
    case 'wounds': return 'woondz';
    // ── -ed words the AV gives a syllable of their own ──
    case 'blessed':
      // "hath blessed" is the plain past; "Blessed be the LORD" takes the second.
      return /^(?:have|hast|has|hath|had|having)$/.test(prev) ? 'blest' : 'bless-ed';
    case 'blessedness': return 'bless-ed-ness';
    case 'learned':
      // "a learned man", "learned in all wisdom" are the adjective;
      // "I have learned" is the past.
      if (/^(?:have|hast|has|hath|had|having|never|ye|we|they|he|she|i|thou)$/.test(prev)) return 'learnd';
      if (/^(?:a|an|the|was|were|is|are|being|most|very|more)$/.test(prev)) return 'learn-ed';
      if (/^(?:in|of|man|men)$/.test(next)) return 'learn-ed';
      return 'learnd';
    // Keep the spelling intact so CORRECTED_IPA supplies NAY-kid.
    case 'naked': return word;
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
  // Elijah is now pinned with a long "ee" before the stress (ee-LY-juh), so
  // every verse that prints the name is voiced once more.
  const elijahUpdated = /\belijah\b/i.test(text);
  // "livest" and "liveth" were voiced as the adjective ("LYVE-est") before they
  // were pinned in IPA, so every verse that prints one is voiced once more.
  const liveUpdated = /\b(?:livest|liveth)\b/i.test(text);
  // "prophecies" was voiced as the verb ("pro-FEE-seez") before the plural noun
  // was pinned in IPA, so every verse that prints it is voiced once more.
  const propheciesUpdated = /\bprophecies\b/i.test(text);
  // "lucre" was read off the letters, so it is voiced again from the pin.
  const lucreUpdated = /\blucre\b/i.test(text);
  const cainanUpdated = /\bcainan\b/i.test(text);
  const enosUpdated = /\benos\b/i.test(text);
  const nakedUpdated = /\bnaked\b/i.test(text);
  const blessedUpdated = /\bblessed\b/i.test(text);
  const tearsUpdated = /\btears\b/i.test(text);
  const evilUpdated = /\bevildoers?\b/i.test(text);
  // Sosthenes was spelled out letter by letter in its old recordings, and the
  // file name a clip is uploaded under is derived from its key — so the verse
  // needs a key of its own rather than the plain reference it already used.
  const sosthenesUpdated = /\bsosthenes\b/i.test(text);
  // "baptize" and its inflections were voiced as "bap-tees", with the stress on
  // the first syllable, before they were pinned in IPA (which moves it to the
  // last), so every verse that prints one needs a recording of its own.
  const baptizeUpdated = /\bbaptiz(?:e|ed|est|eth|ing)\b/i.test(text);
  const newlyUpdated = /\b(?:maketh|imputeth)\b/i.test(text);
  // The sowing forms were voiced from the unpinned letters, which came out as
  // "sow-eth" (the animal) rather than "SOH-ith". Only verses that print one
  // are recorded again.
  const sowUpdated = /\b(?:soweth|sowest|sowed|sower|sowers|sowing)\b/i.test(text);
  // Verses printing "heretick" were voiced from the unpinned letters.
  const heretickUpdated = /\bhereticks?\b/i.test(text);
  const updated = /\bmarketh\b|\btheir\s+desert\b|\bbow\s+down\b/i.test(text);
  // The Authorised Version hyphenates compound names ("Beth-lehem", "Beth-el",
  // "En-gedi", "Kirjath-jearim"). A hyphen makes the voice read two words, so
  // the printed hyphen is dropped and the name is spoken as one word — which is
  // also what lets its pinned form (BETH-li-hem, BETHEL) apply.
  const joined = String(text || '').replace(/([A-Z][a-z]+)-(?=[a-z])/g, '$1');
  const source = joined.replace(/\b(their\s+)desert\b/gi, '$1dih-zurt');
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
  // Only the verses where "cursed" really takes the second syllable are
  // recorded again; the plain past ("he cursed the ground") keeps its clip.
  // The names pinned above (Tychicus, Onesimus, Timotheus, Cenchrea,
  // Pacatiana) were voiced from the unpinned letters, so every verse and
  // closing note that prints one is recorded again under this revision.
  const namesUpdated = /\b(?:tychicus|onesimus|timotheus|cenchrea|pacatiana)\b/i.test(text);
  // The names the recorded library was heard to get wrong — checked against the
  // word timings of the clips already made (Euodias as "Io Dias", Puteoli as
  // "Peolti Olli", Zerubbabel as "Zurubbabel") — are recorded again too.
  const siteNamesUpdated = /\b(?:euodias|epaphras|sopater|belteshazzar|jozadak|zerubbabel|ahaziah|mishael|mattaniah|puteoli|syracuse|trogyllium|gallio|paphos|pamphylia|pisidia|galatia|antioch|laodicea)\b/i.test(text);
  const cursedUpdated = /\bcurs-ed\b/i.test(out);
  const adarUpdated = /\badar\b/i.test(text);
  const satUpdated = /\bsatest\b/i.test(text);
  // Bernice was pinned to the wrong reading, and Galatia, Antioch and Laodicea
  // had no pin at all although their verses were re-recorded. Those four are
  // voiced once more so the corrected pins are what actually plays.
  const repinnedUpdated = /\b(?:bernice|galatia|antioch|laodicea)\b/i.test(text);
  // A compound name the text hyphenates ("Beth-lehem", "Beth-el", "En-gedi") is
  // now spoken as one word, so those verses are voiced once more without the
  // break the hyphen was making.
  const hyphenatedName = /[A-Z][a-z]+-[a-z]/.test(String(text || ''));
  // Every word the AV spells the same but says differently by part of speech
  // ("read" reed/red, "lead" leed/led, "bow" boh/bough, "sow" soh/sau, "tear",
  // "wound", "learned"), plus the forms the engine reads with the other part of
  // speech ("prophesy" as the noun, "incense" as the verb, "shew" as "shoo"),
  // is voiced again under ONE revision — so each affected verse is recorded
  // once, not once per word.
  const contextUpdated = /\b(?:read|readeth|readest|reading|lead|leadeth|leadest|leading|leads|bow|bows|bowed|boweth|bowing|sow|soweth|sowest|sowed|tear|tears|wound|wounds|learned|prophesy|prophesied|prophesieth|prophesying|prophesyings|prophesyest|prophecy|incense|shew|shewed|shewedst|shewest|sheweth|shewing|shewn|shewbread|shewbreads|victuals|blessedness)\b/i.test(text)
    || /\blive\s+coals?\b/i.test(text);
  const britishUpdated = /\b(?:judaea|judæa)\b/i.test(text);
  return { text: out, changed, revision: liveUpdated ? 'h33' : britishUpdated ? 'h32' : contextUpdated ? 'h31' : lucreUpdated ? 'h30' : propheciesUpdated ? 'h29' : elijahUpdated ? 'h28' : hyphenatedName ? 'h27' : repinnedUpdated ? 'h26' : siteNamesUpdated ? 'h24' : namesUpdated ? 'h23' : heretickUpdated ? 'h20' : sowUpdated ? 'h19' : baptizeUpdated ? 'h18' : sosthenesUpdated ? 'h17' : cainanUpdated ? 'h16' : enosUpdated ? 'h15' : nakedUpdated ? 'h14' : satUpdated ? 'h13' : adarUpdated ? 'h12' : cursedUpdated ? 'h10' : blessedUpdated ? 'h8' : auditUpdated ? 'h7' : tearsUpdated ? 'h6' : evilUpdated ? 'h5' : newlyUpdated ? 'h4' : updated ? 'h3' : changed ? 'h2' : '' };
}