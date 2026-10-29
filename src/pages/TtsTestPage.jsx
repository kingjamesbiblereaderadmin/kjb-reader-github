import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AudioLines, Loader2, Play, RefreshCw, Volume2, AlertCircle, CheckCircle2, Languages } from 'lucide-react';

const SAMPLE_TEXT = 'In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.';

function errorMessage(error) {
  return error?.response?.data?.error || error?.message || 'The request failed. Please try again.';
}

function getVoicesList(payload) {
  const raw = payload?.voices;
  if (!raw || typeof raw !== 'object') return [];
  const all = [];
  for (const [localeGroup, value] of Object.entries(raw)) {
    const voices = Array.isArray(value?.voices) ? value.voices : [];
    for (const voice of voices) {
      all.push({ name: voice, localeGroup });
    }
  }
  return all;
}

export default function TtsTestPage() {
  const [language, setLanguage] = useState('en-GB');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioMeta, setAudioMeta] = useState(null);

  const filteredVoices = useMemo(() => voices.filter(v => v.name.toLowerCase().includes(language.toLowerCase())), [voices, language]);

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  async function loadVoices() {
    setVoicesLoading(true);
    setStatus(null);
    try {
      const response = await base44.functions.invoke('nvidiaMagpieTts', { action: 'voices' });
      const list = getVoicesList(response?.data);
      setVoices(list);
      setVoice(current => list.some(v => v.name === current) ? current : '');
      setStatus({ kind: 'success', message: list.length ? `Connected to NVIDIA. Found ${list.length} voices. Published Magpie voices may be limited to en-US for English.` : 'The API responded, but no voices were returned in the expected format.' });
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) });
    } finally {
      setVoicesLoading(false);
    }
  }

  async function runTest() {
    setTesting(true);
    setStatus(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl('');
    setAudioMeta(null);
    try {
      const response = await base44.functions.invoke('nvidiaMagpieTts', {
        action: 'synthesize',
        text,
        language,
        voice: voice || undefined,
      });
      const data = response?.data;
      if (!data?.success || !data?.audioBase64) throw new Error(data?.error || 'NVIDIA did not return audio.');
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: data.contentType || 'audio/wav' }));
      setAudioUrl(url);
      setAudioMeta(data);
      setStatus({ kind: 'success', message: `Audio generated successfully in ${data.language}.` });
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-xl bg-primary/10 p-3"><AudioLines className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">NVIDIA Magpie TTS Test</h1>
          <p className="text-sm text-muted-foreground">Test speech synthesis before adding it to Bible reading.</p>
        </div>
      </div>

      <div className="my-5 rounded-xl border border-border bg-card p-4 text-sm text-foreground">
        <div className="flex items-start gap-2"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p><strong>English (UK) is selected by default.</strong> NVIDIA's published Magpie Multilingual locale list currently shows English (US), not English (UK). This test checks the actual API response; if en-GB is rejected, try en-US to verify the API key and audio pipeline separately.</p></div>
      </div>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <label htmlFor="tts-language" className="mb-2 block text-sm font-medium text-foreground">Language / accent</label>
          <select id="tts-language" value={language} onChange={e => { setLanguage(e.target.value); setVoice(''); }} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground">
            <option value="en-GB">English (UK) — requested</option>
            <option value="en-US">English (US) — documented Magpie locale</option>
          </select>
        </div>
        <div>
          <label htmlFor="tts-voice" className="mb-2 block text-sm font-medium text-foreground">Voice (optional)</label>
          <div className="flex gap-2">
            <select id="tts-voice" value={voice} onChange={e => setVoice(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-foreground">
              <option value="">Use NVIDIA's default voice</option>
              {filteredVoices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
            <button type="button" onClick={loadVoices} disabled={voicesLoading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50" title="Check NVIDIA voices">
              {voicesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} <span className="hidden sm:inline">Check voices</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{filteredVoices.length ? `${filteredVoices.length} matching voices available.` : 'Voice list has not been loaded or no voices match this locale. The default voice can still be tested.'}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="tts-text" className="text-sm font-medium text-foreground">Text to speak</label>
            <button type="button" onClick={() => setText(SAMPLE_TEXT)} className="text-xs text-primary hover:underline">Restore KJV sample</button>
          </div>
          <textarea id="tts-text" value={text} onChange={e => setText(e.target.value)} maxLength={1800} rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground" />
          <p className="mt-1 text-right text-xs text-muted-foreground">{text.length}/1,800 characters</p>
        </div>
        <button type="button" onClick={runTest} disabled={testing || !text.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {testing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />} {testing ? 'Generating audio…' : 'Test speech'}
        </button>

        {status && <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${status.kind === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground' : 'border-destructive/30 bg-destructive/5 text-foreground'}`}>
          {status.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
          <p className="whitespace-pre-wrap break-words">{status.message}</p>
        </div>}

        {audioUrl && <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 font-medium text-foreground"><Volume2 className="h-5 w-5 text-primary" /> Generated audio</div>
          <audio controls autoPlay src={audioUrl} className="w-full">Your browser does not support audio playback.</audio>
          {audioMeta && <p className="text-xs text-muted-foreground">Locale: {audioMeta.language} · Voice: {audioMeta.voice} · Audio: {(audioMeta.bytes / 1024).toFixed(1)} KB</p>}
          <a href={audioUrl} download={`kjb-reader-magpie-${audioMeta?.language || 'test'}.wav`} className="inline-block text-sm text-primary underline underline-offset-4">Save test audio</a>
        </div>}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">This is a temporary test page. The NVIDIA API key is read only on the server and is never sent to the browser. Generated audio is not cached or stored by this page.</p>
    </main>
  );
}
