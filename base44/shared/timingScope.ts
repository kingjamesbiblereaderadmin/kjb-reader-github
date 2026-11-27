// All approved spoken Bible clips, including printed furniture and revisions.
export function recordingTimingQuery(chapterKey = '') {
  const prefix = chapterKey ? `${chapterKey}:` : '[1-3A-Z]{3}:\\d{1,3}:';
  return {
    voice: 'en-GB-RyanNeural',
    url: { $regex: '^(https?://|data:audio/mpeg;base64,)' },
    // The trailing suffix is either a pronunciation revision (:h7) or the
    // re-voiced key a speech fix moved a verse to (:v2).
    ref: { $regex: `^${prefix}(\\d{1,3}|sub|col|end|title|intro|chapter|h\\d{1,3})(:h\\d+|:v\\d+)?$` },
  };
}

export function timingReference(ref) {
  // PSA:119:h1 is a stanza label. Only a FOURTH segment is a revision.
  // A revision or re-voiced key is dropped so the timing row carries the ref
  // the reader looks up; when two clips of a verse are both measured, the
  // reader tells them apart by audio url or hash, never by the ref alone.
  return String(ref).replace(/^([1-3A-Z]{3}:\d{1,3}:[^:]+):(?:h\d+|v\d+)$/, '$1');
}