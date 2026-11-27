import { ABBR_TO_NAME, BOOK_ORDER } from './biblePceData.ts';

export const BOOK_CODES = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[.\s_-]/g, '');
const aliases = new Map(Object.entries(ABBR_TO_NAME).map(([code, name]) => [normalize(code), name]));
BOOK_ORDER.forEach((name, index) => { aliases.set(normalize(name), name); aliases.set(normalize(BOOK_CODES[index]), name); });
aliases.set('jde', 'Jude');

export function resolveBibleBook(value) { return aliases.get(normalize(value)) || null; }