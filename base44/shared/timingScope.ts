// All approved spoken Bible clips, including printed furniture and revisions.
export function recordingTimingQuery(chapterKey = '') {
  const prefix = chapterKey ? `${chapterKey}:` : '[1-3A-Z]{3}:\\d{1,3}:';
  return {
    voice: 'en-GB-RyanNeural',
    url: { $regex: '^(https?://|data:audio/mpeg;base64,)' },
    ref: { $regex: `^${prefix}(\\d{1,3}|sub|col|end|title|intro|chapter|h\\d{1,3})(:h\\d+)?$` },
  };
}

export function timingReference(ref) {
  // PSA:119:h1 is a stanza label. Only a FOURTH segment is a revision.
  return String(ref).replace(/^([1-3A-Z]{3}:\d{1,3}:[^:]+):h\d+$/, '$1');
}