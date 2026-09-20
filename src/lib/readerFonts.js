// Reading font CSS values shared by the reader page and the reader toolbar.
export function getFontFamilyValue(family) {
  if (family === 'cursive') return "'Dancing Script', cursive";
  if (family === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  if (family === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
  if (family === 'monospace') return "'Courier New', monospace";
  if (family === 'comic-sans') return "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', system-ui, sans-serif";
  if (family === 'times') return "'Times New Roman', Times, serif";
  if (family === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (family === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  return family;
}