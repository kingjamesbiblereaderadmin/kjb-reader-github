import React from 'react';

// Where the spoken pronunciations come from. Every entry here is a real
// reference used to settle a word: nothing in the narration is invented, and a
// name is only respelled once a dictionary form has been checked against it.
const SOURCES = [
  {
    title: 'The Authorised Version text (Pure Cambridge Edition)',
    body: 'The printed spelling is what is read aloud. Nothing on screen is changed to make a word easier to say — only the text handed to the voice is adjusted.',
  },
  {
    title: 'Oxford Dictionary of English and Collins English Dictionary',
    body: 'Received Pronunciation (RP) transcriptions for the names and places the dictionaries carry, which is the standard British form the narration follows.',
  },
  {
    title: 'Wiktionary',
    body: 'International Phonetic Alphabet entries for the biblical proper names the general dictionaries do not list, such as Tychicus, Onesimus and Cenchrea.',
  },
  {
    title: 'Traditional Authorised Version reading conventions',
    body: 'The forms the version is read with in public reading: bless-ed and curs-ed with their own syllable, bap-TIZE with the stress on the last, and the -eth verbs given their own final syllable.',
  },
  {
    title: 'The recordings themselves',
    body: 'Every verse that has been recorded is transcribed back and compared with the printed text. A name the voice misread — Tychicus heard as "Tiki Coos", Puteoli as "Peolti Olli" — is caught that way and recorded again.',
  },
];

const Eyebrow = ({ children }) => (
  <p className="font-sans text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2.5">{children}</p>
);

export default function PronunciationSection() {
  return (
    <div>
      <Eyebrow>Sources for the spoken pronunciation</Eyebrow>
      <ul className="space-y-2.5">
        {SOURCES.map((source) => (
          <li
            key={source.title}
            className="rounded-lg border border-border bg-card/60 px-3 py-2.5"
          >
            <p className="font-sans text-sm font-semibold text-foreground leading-snug">{source.title}</p>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-1">{source.body}</p>
          </li>
        ))}
      </ul>
      <Eyebrow>Permissions for those sources</Eyebrow>
      <ul className="space-y-1.5 font-sans text-xs text-muted-foreground leading-relaxed">
        <li>
          <span className="font-semibold text-foreground">The Authorised Version text:</span> public domain, so the text may be read, quoted and recorded freely.
        </li>
        <li>
          <span className="font-semibold text-foreground">Oxford and Collins dictionaries:</span> consulted for the standard British transcription of a word only. No dictionary text, audio or editorial content is copied, stored or shown in the app.
        </li>
        <li>
          <span className="font-semibold text-foreground">Wiktionary:</span> content is available under CC BY-SA 3.0 and the GNU Free Documentation License; it is used as a reference for IPA forms, which are statements of fact rather than protected text.
        </li>
        <li>
          <span className="font-semibold text-foreground">The recordings:</span> voiced with Microsoft Azure AI Speech neural voices on a paid Speech resource, whose terms permit commercial use of the generated audio.
        </li>
      </ul>

      <p className="font-sans text-[11px] text-muted-foreground leading-relaxed mt-4">
        Pronunciation references:{' '}
        <a href="https://www.oed.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Oxford English Dictionary</a>,{' '}
        <a href="https://www.collinsdictionary.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Collins English Dictionary</a>,{' '}
        <a href="https://en.wiktionary.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Wiktionary</a>.
        {' '}Where those disagree, the British RP form is used.
      </p>
    </div>
  );
}