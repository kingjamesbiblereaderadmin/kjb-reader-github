// Local-only saved verses — no cloud sync (accounts removed).

const SAVED_KEY = 'kjb-saved-verses';

// Default folder. British spelling: builds before September 2026 stored
// 'Favorites' — normalizeFolder() migrates those reads on the fly, and
// persistFolderRename() below performs the one-time stored rename.
export const DEFAULT_FOLDER = 'Favourites';

function normalizeFolder(name) {
  return name === 'Favorites' ? DEFAULT_FOLDER : name;
}

function persistFolderRename() {
  // One-time migration: rewrite the stored folders list without the legacy
  // spelling so both origins (and the cross-origin mirror) settle on
  // 'Favourites'.
  try {
    const raw = localStorage.getItem('kjb-saved-folders');
    if (!raw) return;
    const folders = JSON.parse(raw);
    if (!Array.isArray(folders) || !folders.includes('Favorites')) return;
    const migrated = folders.map(normalizeFolder);
    localStorage.setItem('kjb-saved-folders', JSON.stringify(migrated));
  } catch {}
}
persistFolderRename();

export function getSavedVerses() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.map(v => ({ ...v, folder: normalizeFolder(v.folder || DEFAULT_FOLDER) }))
      : [];
  } catch {
    return [];
  }
}

export function getSavedFolders() {
  try {
    const folders = JSON.parse(localStorage.getItem('kjb-saved-folders') || '[]');
    const normalized = (Array.isArray(folders) ? folders : []).map(normalizeFolder);
    if (!normalized.includes(DEFAULT_FOLDER)) {
      normalized.unshift(DEFAULT_FOLDER);
    }
    return normalized;
  } catch {
    return [DEFAULT_FOLDER];
  }
}

export function createFolder(name) {
  const folders = getSavedFolders();
  if (!folders.includes(name)) {
    folders.push(name);
    localStorage.setItem('kjb-saved-folders', JSON.stringify(folders));
  }
}

export function isVerseSaved(abbr, chapter, verse) {
  return getSavedVerses().some(v => v.abbr === abbr && v.chapter === chapter && v.verse === verse);
}

export function saveVerse(entry) {
  const saved = getSavedVerses();
  if (!isVerseSaved(entry.abbr, entry.chapter, entry.verse)) {
    saved.unshift({ ...entry, folder: entry.folder || DEFAULT_FOLDER });
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
}

export function updateVerseFolder(abbr, chapter, verse, newFolder) {
  const saved = getSavedVerses().map(v => {
    if (v.abbr === abbr && v.chapter === chapter && v.verse === verse) {
      return { ...v, folder: newFolder };
    }
    return v;
  });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export function removeSavedVerse(abbr, chapter, verse) {
  const saved = getSavedVerses().filter(v => !(v.abbr === abbr && v.chapter === chapter && v.verse === verse));
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export function deleteFolder(name) {
  if (name === DEFAULT_FOLDER) return;
  const folders = getSavedFolders().filter(f => f !== name);
  localStorage.setItem('kjb-saved-folders', JSON.stringify(folders));

  const saved = getSavedVerses().map(v => {
    if (v.folder === name) {
      return { ...v, folder: DEFAULT_FOLDER };
    }
    return v;
  });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}