import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, ChevronDown, Plus, Loader2, Search, Printer, Shield, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { printHtml } from '@/lib/printHelpers';
import DefenceItemForm from '@/components/defence/DefenceItemForm';
import DefenceWarningBanner from '@/components/defence/DefenceWarningBanner';
import DefenceCategoryList from '@/components/defence/DefenceCategoryList';
import CopyButton from '@/components/defence/CopyButton';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_STYLES = {
  'KJB Defence': { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'Why Modern Versions Are Corrupt': { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  '1 John 5:7 Defence': { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'Westcott & Hort Heresies': { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  'NKJV Exposed': { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  'Living Bible Exposed': { color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  'ESV & NIV Exposed': { color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
};
const DEFAULT_STYLE = { color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' };
// Only the proper noun / acronym / reference inside a category name needs
// protection from browser translation — the surrounding plain English words
// (e.g. "Why Modern Versions Are Corrupt") should stay translatable.
const PROTECTED_TERM_BY_CATEGORY = {
  'KJB Defence': 'KJB',
  '1 John 5:7 Defence': '1 John 5:7',
  'Westcott & Hort Heresies': 'Westcott & Hort',
  'NKJV Exposed': 'NKJV',
  'Living Bible Exposed': 'Living Bible',
  'ESV & NIV Exposed': 'ESV & NIV',
};
function renderCategoryName(name) {
  const term = PROTECTED_TERM_BY_CATEGORY[name];
  const idx = term ? name.indexOf(term) : -1;
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="notranslate" translate="no">{term}</span>
      {name.slice(idx + term.length)}
    </>
  );
}
// Preserve a stable display order for known categories; unknown ones append.
const CATEGORY_ORDER = [
  'KJB Defence',
  'Why Modern Versions Are Corrupt',
  '1 John 5:7 Defence',
  'Westcott & Hort Heresies',
  'NKJV Exposed',
  'Living Bible Exposed',
  'ESV & NIV Exposed',
];

export default function KjbDefencePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [expanded, setExpanded] = useState(() => Object.fromEntries(CATEGORY_ORDER.map((c) => [c, true])));
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.DefenceResource.list('-updated_date', 500);
      // Plain "|| []" here, NOT Array.isArray() -- matching every other
      // working .list() call in this codebase (ExtensionConfig,
      // ManifestConfig, BibleTextOverride, etc). The SDK's returned value
      // may not be a literal JS Array (e.g. wrapped/proxied) while still
      // being perfectly valid data -- an earlier version of this used
      // Array.isArray() specifically here and it silently discarded a
      // real, successful response, showing "No defence resources yet."
      // even though the backend genuinely had 38 entries.
      const safeList = list || [];
      setItems(safeList);
      // Cache the last successful fetch so offline visits (or a temporarily
      // unreachable backend) can still show something instead of an empty
      // page + error toast. This content lives in a live, admin-editable
      // database (unlike the Bible text/fonts/images bundled natively
      // elsewhere in the app), so a build-time snapshot would go stale the
      // moment an admin edits it -- caching the most recent successful load
      // instead keeps it reasonably fresh while still giving a usable
      // offline fallback.
      try { localStorage.setItem('kjb-defence-cache', JSON.stringify(safeList)); } catch {}
    } catch (err) {
      console.error('[KjbDefence] load failed', err);
      let cached = null;
      try {
        const raw = localStorage.getItem('kjb-defence-cache');
        if (raw) cached = JSON.parse(raw);
      } catch {}
      if (Array.isArray(cached) && cached.length > 0) {
        setItems(cached);
        toast.error('Showing saved copy — could not reach the server for the latest resources.');
      } else {
        toast.error('Failed to load defence resources.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: keep the list fresh when an admin edits from another tab/device.
  useEffect(() => {
    const unsub = base44.entities.DefenceResource.subscribe((event) => {
      setItems((prev) => {
        // Defensive: `prev` should always be an array (useState([]) plus
        // every other setItems() call here produces one), but nothing
        // downstream re-checked that assumption -- if it were ever
        // something else at the moment a realtime event arrived, every
        // method below would throw "X is not a function", and a returned
        // non-array would keep propagating into every later render (the
        // categories useMemo's own "|| []" fallback only rescues a falsy
        // value, not a truthy non-array one).
        const list = Array.isArray(prev) ? prev : [];
        if (event.type === 'delete') return list.filter((i) => i.id !== event.id);
        const idx = list.findIndex((i) => i.id === event.id);
        const next = [...list];
        if (event.type === 'create' && idx === -1) return [event.data, ...list];
        if (idx >= 0) { next[idx] = event.data; return next; }
        return list;
      });
    });
    return unsub;
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((it) => {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    });
    const known = CATEGORY_ORDER.filter((c) => map.has(c));
    const extras = [...map.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
    return [...known, ...extras].map((c) => ({
      name: c,
      style: CATEGORY_STYLES[c] || DEFAULT_STYLE,
      items: map.get(c).sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
  }, [items]);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((cat) => ({ ...cat, items: cat.items.filter((i) => (i.title + ' ' + i.desc + ' ' + i.category).toLowerCase().includes(q)) }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, query]);

  const allExpanded = categories.every((c) => expanded[c.name] !== false);
  const toggleAll = () => {
    const next = !allExpanded;
    setExpanded(Object.fromEntries(categories.map((c) => [c.name, next])));
  };
  const toggle = (name) => setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setShowForm(true); };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.DefenceResource.update(editing.id, values);
        toast.success('Resource updated.');
      } else {
        await base44.entities.DefenceResource.create(values);
        toast.success('Resource added.');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error('[KjbDefence] save failed', err);
      toast.error('Save failed: ' + (err?.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await base44.entities.DefenceResource.delete(item.id);
      toast.success('Resource deleted.');
      setItems((prev) => (Array.isArray(prev) ? prev : []).filter((i) => i.id !== item.id));
    } catch (err) {
      console.error('[KjbDefence] delete failed', err);
      toast.error('Delete failed.');
    }
  };

  // Persist a new order for a category's items after a drag-and-drop reorder.
  // Updates optimistically and rolls back via reload if the save fails.
  const handleReorder = async (categoryName, reorderedItems) => {
    const previous = items;
    setItems((prev) => (Array.isArray(prev) ? prev : []).map((it) => {
      if (it.category !== categoryName) return it;
      const newOrder = reorderedItems.findIndex((r) => r.id === it.id);
      return newOrder >= 0 ? { ...it, order: newOrder } : it;
    }));
    try {
      await base44.entities.DefenceResource.bulkUpdate(
        reorderedItems.map((it, idx) => ({ id: it.id, order: idx }))
      );
    } catch (err) {
      console.error('[KjbDefence] reorder failed', err);
      toast.error('Reorder failed to save.');
      setItems(previous);
      await load();
    }
  };

  const handlePrint = () => {
    const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html = `<h1 translate="no" style="font-family:Georgia,serif;font-size:22pt;text-align:center;margin-bottom:6pt;">KJB Defence</h1><p style="text-align:center;font-size:11pt;color:#555;margin-bottom:24pt;">Resources defending the <span translate="no">King James Bible</span>.</p>`;
    categories.forEach((cat) => {
      html += `<h2 translate="no" style="font-size:15pt;margin:24pt 0 8pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${esc(cat.name)}</h2>`;
      cat.items.forEach((it) => {
        html += `<h3 translate="no" style="font-size:13pt;margin:12pt 0 2pt 0;">${esc(it.title)}</h3><p style="font-size:11pt;line-height:1.5;margin:0 0 4pt 0;">${esc(it.desc)}</p><p style="font-size:10pt;color:#2a5ac8;margin:0 0 4pt 0;">${esc(it.url)}</p>`;
      });
    });
    printHtml(html);
  };

  const existingCategories = categories.map((c) => c.name);

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <ShieldAlert className="w-7 h-7 text-blue-500" />
        </div>
        <h1 className="notranslate font-serif text-4xl font-bold text-foreground mb-3" translate="no">KJB Defence</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">Resources defending the <span className="notranslate" translate="no">King James Bible</span> as the preserved, infallible Word of God — and exposing the corruption of modern versions.</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setAdminMode((m) => !m)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${adminMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
            >
              {adminMode ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {adminMode ? 'Admin Mode On' : 'Admin Mode'}
            </button>
          )}
          {isAdmin && adminMode && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          )}
          <button
            onClick={toggleAll}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <button
            onClick={() => {
              const text = `KJB Defence\n\n${categories.map((cat) => `${cat.name}\n\n${cat.items.map((i) => `${i.title}\n${i.desc}\n${i.url}`).join('\n\n')}`).join('\n\n')}`;
              navigator.clipboard.writeText(text);
              toast.success('Copied all resources to clipboard.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" /> Copy All
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <DefenceWarningBanner />

      {/* Search */}
      <div className="relative mb-6 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search defence resources..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary/70" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-muted-foreground">{query ? 'No resources match your search.' : 'No defence resources yet.'}</p>
          {isAdmin && adminMode && !query && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium">
              <Plus className="w-4 h-4" /> Add the first resource
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cat) => {
            const isOpen = expanded[cat.name] !== false;
            return (
              <div key={cat.name} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggle(cat.name)}
                  className={`w-full ${cat.style.bg} border-b rounded-t-xl p-4 hover:opacity-90 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`w-5 h-5 ${cat.style.color}`} />
                      <h2 className={`font-sans font-semibold ${cat.style.color}`}>{renderCategoryName(cat.name)}</h2>
                      <span className="font-sans text-xs text-muted-foreground">({cat.items.length})</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <CopyButton
                        text={`${cat.name}\n\n${cat.items.map((i) => `${i.title}\n${i.desc}\n${i.url}`).join('\n\n')}`}
                        className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${cat.style.color} cursor-pointer`}
                      />
                      <ChevronDown className={`w-4 h-4 ${cat.style.color} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <DefenceCategoryList
                    cat={cat}
                    isAdmin={isAdmin}
                    adminMode={adminMode}
                    onReorder={handleReorder}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAdd={openAdd}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Resource' : 'Add Defence Resource'}</DialogTitle>
            <DialogDescription>{editing ? 'Update the details of this resource.' : 'Add a new resource to the KJB Defence page.'}</DialogDescription>
          </DialogHeader>
          <DefenceItemForm
            initialItem={editing}
            existingCategories={existingCategories}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}