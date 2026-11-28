import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { getPlatformLabel, permissionSummary } from '@/lib/platformPermissions';

// What the player's info button opens: where the voice comes from, what this
// copy of the app may ask for, the terms it is used under, and where to report
// a fault. Each part folds away, so the panel opens as four short rows instead
// of a wall of text.
const TRIGGER = 'py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline';
const BODY = 'text-xs text-foreground/85 leading-relaxed';

export default function VoiceInfoPanel({ bundledAudio = false }) {
  // Held here, not inside the accordion, so opening one section never disturbs
  // the ones already open: each row folds on its own.
  const [open, setOpen] = useState([]);
  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="font-sans">
      <AccordionItem value="voice" className="border-border">
        <AccordionTrigger className={TRIGGER}>The voice</AccordionTrigger>
        <AccordionContent className="pb-2">
          <p className={BODY}>
            <span className="font-semibold text-foreground notranslate" translate="no">Microsoft Azure AI Speech</span>{' '}
            <span className="notranslate" translate="no">(en-GB-RyanNeural)</span>, voiced once per verse and cached.{' '}
            {bundledAudio
              ? 'The clips are stored inside this app, so it plays offline.'
              : 'Verses you play are kept on this device for offline replay.'}
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="permissions" className="border-border">
        <AccordionTrigger className={TRIGGER}>
          <span className="flex-1 text-left">
            Permissions <span className="normal-case tracking-normal font-normal">&mdash; {getPlatformLabel()}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <ul className={BODY}>
            {permissionSummary().map((line) => <li key={line}>• {line}</li>)}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="licensing" className="border-border">
        <AccordionTrigger className={TRIGGER}>Licensing</AccordionTrigger>
        <AccordionContent className="pb-2">
          <p className={BODY}>
            Free for personal, non-commercial reading and study, never sold. The King James text is public domain,
            though commercial use in the UK may need a Cambridge University Press or King&rsquo;s Printer licence.
          </p>
          <p className={`${BODY} mt-1`}>
            The voice is generated on the developer&rsquo;s own{' '}
            <span className="font-semibold text-foreground notranslate" translate="no">Microsoft Azure</span> subscription
            under Microsoft&rsquo;s Azure service terms. The audio is played inside the app only, and is never sold or
            offered as audio on its own.
          </p>
          <p className={`${BODY} mt-1`}>
            Full terms on the <Link to="/credits" className="text-primary hover:underline">Credits page</Link>.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="feedback" className="border-b-0">
        <AccordionTrigger className={TRIGGER}>Feedback</AccordionTrigger>
        <AccordionContent className="pb-1">
          <p className={BODY}>
            Wrong word, bad pronunciation, or audio that will not play? Email{' '}
            <a href="mailto:kingjamesbiblereader@outlook.sg" className="text-primary hover:underline notranslate" translate="no">
              kingjamesbiblereader@outlook.sg
            </a>.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}