/**
 * Visual security boundary. Inside: what the prototype is. Outside: everything real it never touches.
 * Pure SVG with CSS variables, so it follows the theme and scales with its container.
 */
const OUTSIDE = [
  'GST portal',
  'Real Windows processes & ports',
  'Physical USB DSC token',
  'Private keys & DSC PIN',
  'Your documents',
  'Certificate trust settings',
];

export function SecurityBoundary() {
  return (
    <div className="boundary-wrap">
      <svg viewBox="0 0 920 410" role="img" aria-labelledby="sb-title sb-desc" className="boundary">
        <title id="sb-title">Security boundary diagram</title>
        <desc id="sb-desc">
          Inside the boundary, a browser tab holds predefined mock data, a deterministic engine and a local report download. Six real-world targets sit outside the boundary and are never accessed.
        </desc>
        <defs>
          <pattern id="sb-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--line)" strokeWidth="1" opacity=".6" />
          </pattern>
        </defs>

        {/* Inside */}
        <rect x="10" y="10" width="420" height="390" fill="url(#sb-grid)" stroke="var(--teal)" strokeWidth="1.5" rx="3" />
        <text x="28" y="40" className="sb-title" fill="var(--teal)">INSIDE THE BOUNDARY</text>
        <text x="28" y="60" className="sb-sub" fill="var(--text-dim)">Your browser tab, this page only</text>

        {[
          { y: 84, t: 'Predefined mock observations', s: 'Static TypeScript data, six scenarios' },
          { y: 172, t: 'Deterministic diagnostic engine', s: 'Pure functions: no clock, no network' },
          { y: 260, t: 'Result, evidence and JSON report', s: 'Generated and downloaded locally' },
        ].map((b, i) => (
          <g key={b.t}>
            <rect x="40" y={b.y} width="360" height="62" rx="2" fill="var(--bg-2)" stroke="var(--line-strong)" />
            <text x="58" y={b.y + 27} className="sb-box" fill="var(--text)">{b.t}</text>
            <text x="58" y={b.y + 47} className="sb-sub" fill="var(--text-dim)">{b.s}</text>
            {i < 2 && (
              <g stroke="var(--teal)" strokeWidth="1.6" fill="none">
                <path d={`M220 ${b.y + 62} V${b.y + 88}`} />
                <path d={`M214 ${b.y + 80} L220 ${b.y + 88} L226 ${b.y + 80}`} />
              </g>
            )}
          </g>
        ))}
        <text x="28" y="372" className="sb-sub" fill="var(--text-faint)">Fonts, code and data are bundled. No network calls at run time.</text>

        {/* Boundary line */}
        <line x1="470" y1="10" x2="470" y2="400" stroke="var(--amber)" strokeWidth="2" strokeDasharray="8 6" />
        <text x="470" y="404" textAnchor="middle" className="sb-sub" fill="var(--amber)" dy="-2" />

        {/* Outside */}
        <text x="510" y="40" className="sb-title" fill="var(--text-dim)">OUTSIDE · NEVER ACCESSED</text>
        {OUTSIDE.map((label, i) => {
          const y = 60 + i * 56;
          return (
            <g key={label}>
              <line x1="430" y1={y + 20} x2="462" y2={y + 20} stroke="var(--slate)" strokeWidth="1.4" strokeDasharray="4 4" />
              <g transform={`translate(470 ${y + 20})`}>
                <circle r="10" fill="var(--bg-1)" stroke="var(--red)" strokeWidth="1.6" />
                <path d="M-4 -4L4 4M4 -4L-4 4" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
              </g>
              <rect x="494" y={y} width="410" height="40" rx="2" fill="none" stroke="var(--line-strong)" strokeDasharray="5 4" />
              <text x="512" y={y + 25} className="sb-box" fill="var(--text-dim)">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
