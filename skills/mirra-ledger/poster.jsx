// Poster template — the face of an update card.
//
// This page gets screenshotted at exactly 900x540 and shown to teammates at
// roughly a THIRD of that size, on a phone, in a feed they are scrolling past.
// So it holds one thought, set very large, and nothing else. At the size it is
// actually seen, 14px body copy renders as five pixels of grey texture — which
// is why there is no body copy here and you should not add any.
//
// Three type sizes, and the template picks between them for you:
//   STATEMENT  158px for a number (up to 8 characters, so 179,644 fits),
//              104px for a few words, stepping down as the line gets longer
//   CAPTION     47px — what the statement means
//   EYEBROW /   26px — the kind of thing this is, and where it came from
//   FOOTER
//
// To use it: change the four strings, publish with `mirra-pages createPage`,
// attach the page to the item, then name its URL as the line's heroPageUrl.
// Everything below the strings is the frame — leave it alone.

function App() {
  // ── Fill these in ──────────────────────────────────────────────────────
  var EYEBROW   = 'SHIPPED';                        // SHIPPED / NEXT / NEEDS YOU
  var STATEMENT = 'The store is gone';              // ONE thing. A number, or ≤6 words.
  var CAPTION   = '179,644 lines removed, nothing broke';  // what it means, ≤10 words
  var FOOTER    = 'FXN · 26 Jul';                   // space and date, quietly
  // ───────────────────────────────────────────────────────────────────────

  // Fit the statement to the frame. Thresholds are measured, not guessed: at
  // 772px of usable width one line holds 8 chars at 158px, 12 at 104, 17 at 72.
  // Wrapping to a SECOND line is fine and still reads well — doubling those is
  // the real budget (16 / 24 / 35). A third line overflows 540 and gets clipped,
  // so the last tier exists to keep a long statement inside the frame. If you
  // land there, shorten the statement instead — that is the actual fix.
  var n = STATEMENT.length;
  var statementSize = n <= 8 ? 158 : n <= 24 ? 104 : n <= 35 ? 72 : 56;

  return (
    <div
      className="bg-m-bg text-m-text flex flex-col justify-between overflow-hidden"
      style={{ width: 900, height: 540, padding: 64 }}
    >
      <div
        className="font-mono uppercase text-m-accent-text"
        style={{ fontSize: 26, letterSpacing: 4 }}
      >
        {EYEBROW}
      </div>

      <div>
        <div
          className="font-display"
          style={{ fontSize: statementSize, lineHeight: 1.02, letterSpacing: -1 }}
        >
          {STATEMENT}
        </div>
        <div
          className="font-body text-m-text-secondary"
          style={{ fontSize: 47, lineHeight: 1.15, marginTop: 20 }}
        >
          {CAPTION}
        </div>
      </div>

      <div className="font-mono text-m-text-muted" style={{ fontSize: 26 }}>
        {FOOTER}
      </div>
    </div>
  );
}
