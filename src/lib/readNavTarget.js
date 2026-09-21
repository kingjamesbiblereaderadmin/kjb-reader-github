// Where any "Read" entry point (desktop footer, hamburger menu, bottom-nav
// fallback, cold-start route restore) should go: back to the reader's exact
// last URL, including its search/gospel flags (?from=search&q=…) — so
// leaving mid-step and tapping Read returns to the SAME step with the
// "Searched" pill and stepper intact instead of a bare /read that drops them.
export const readNavTarget = () => {
  try {
    const u = localStorage.getItem('kjb-last-read-url');
    if (u && u.startsWith('/read')) return u;
  } catch {}
  return '/read';
};
