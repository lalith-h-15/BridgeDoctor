import { ChevronDown, FlaskConical } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import type { Confidence, EvidenceClass } from '../types';
import { STATE_ICON, STATE_LABEL, type VisualState } from './icons';

/** Status pill: icon + text, never colour alone. */
export function StatusPill({ state, label, compact }: { state: VisualState; label?: string; compact?: boolean }) {
  const Icon = STATE_ICON[state];
  return (
    <span className={`pill pill-${state}${compact ? ' pill-compact' : ''}`}>
      <Icon size={compact ? 12 : 14} aria-hidden className={state === 'running' ? 'spin' : undefined} />
      {label ?? STATE_LABEL[state]}
    </span>
  );
}

export function EvidenceBadge({ value }: { value: EvidenceClass }) {
  return <span className={`ev ev-${value.toLowerCase()}`}>{value}</span>;
}

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return <span className={`conf conf-${value.toLowerCase()}`}>{value}</span>;
}

export function RuleChip({ id, active }: { id: string; active?: boolean }) {
  return <code className={`rule-chip${active ? ' is-active' : ''}`}>{id}</code>;
}

/** Permanent reminder that nothing on screen is a real measurement. */
export function SimBadge({ children = 'Sample Simulation Data' }: { children?: ReactNode }) {
  return (
    <span className="sim-badge">
      <FlaskConical size={12} aria-hidden />
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  children,
  right,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {children && <p className="section-lede">{children}</p>}
      </div>
      {right && <div className="section-right">{right}</div>}
    </header>
  );
}

/** Disclosure widget with proper aria wiring. Controlled when `open` is passed. */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  open,
  onToggle,
  badge,
  className = '',
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  badge?: ReactNode;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultOpen);
  const id = useId();
  const isOpen = open ?? inner;
  const toggle = () => {
    onToggle?.(!isOpen);
    if (open === undefined) setInner(!isOpen);
  };
  return (
    <div className={`collapsible${isOpen ? ' is-open' : ''} ${className}`}>
      <button type="button" className="collapsible-head" aria-expanded={isOpen} aria-controls={id} onClick={toggle}>
        <span className="collapsible-title">{title}</span>
        {badge}
        <ChevronDown size={16} aria-hidden className="chev" />
      </button>
      <div id={id} className="collapsible-body" hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}

/** Small mono key/value grid for structured evidence. */
export function KeyValues({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k} className="kv-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
