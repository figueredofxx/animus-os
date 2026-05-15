'use client'
import { ReactNode } from 'react'

/* ─── CARD ─── */
export function Card({ children, glow, style }: { children: ReactNode; glow?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#0c0c18', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '14px', marginBottom: '10px',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {glow && (
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 120, height: 120,
          background: `radial-gradient(circle, ${glow}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </div>
  )
}

/* ─── KPI ─── */
export function KPI({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: '#0c0c18', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '12px 14px',
    }}>
      <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px' }}>{label}</div>
      <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '26px', fontWeight: 700, lineHeight: 1.1, marginTop: '4px', color: color || '#e8e8f0' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#444466', marginTop: '3px', fontFamily: 'Rajdhani, sans-serif' }}>{sub}</div>}
    </div>
  )
}

/* ─── SECTION TITLE ─── */
export function STitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '4px', whiteSpace: 'nowrap' }}>{children}</div>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

/* ─── BADGE ─── */
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  lime: { bg: 'rgba(184,255,0,0.12)', text: '#b8ff00' },
  red: { bg: 'rgba(255,51,102,0.12)', text: '#ff3366' },
  cyan: { bg: 'rgba(0,229,255,0.12)', text: '#00e5ff' },
  orange: { bg: 'rgba(255,119,0,0.12)', text: '#ff7700' },
  purple: { bg: 'rgba(157,78,221,0.12)', text: '#9d4edd' },
  muted: { bg: 'rgba(68,68,102,0.4)', text: '#666688' },
}
export function Badge({ children, color = 'lime' }: { children: ReactNode; color?: keyof typeof BADGE_COLORS }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.lime
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1px', background: c.bg, color: c.text }}>
      {children}
    </span>
  )
}

/* ─── BUTTON ─── */
export function Btn({ children, onClick, variant = 'lime', small, style }: { children: ReactNode; onClick?: () => void; variant?: 'lime' | 'ghost' | 'danger'; small?: boolean; style?: React.CSSProperties }) {
  const styles = {
    lime: { background: '#b8ff00', color: '#000' },
    ghost: { background: '#111122', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.12)' },
    danger: { background: 'rgba(255,51,102,0.15)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)' },
  }
  return (
    <button
      onClick={onClick}
      style={{
        width: small ? 'auto' : '100%',
        padding: small ? '6px 12px' : '12px',
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px',
        fontSize: small ? '12px' : '16px',
        transition: 'opacity 0.2s',
        ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ─── INPUT ─── */
export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: '10px' }}>
      {label && <label style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>{label}</label>}
      <input
        {...props}
        style={{
          width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          padding: '10px 12px', outline: 'none', WebkitAppearance: 'none', appearance: 'none',
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = '#b8ff00'; e.target.style.boxShadow = '0 0 0 2px rgba(184,255,0,0.08)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

/* ─── SELECT ─── */
export function Select({ label, children, ...props }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ marginBottom: '10px' }}>
      {label && <label style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>{label}</label>}
      <select
        {...props}
        style={{
          width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          padding: '10px 12px', outline: 'none', WebkitAppearance: 'none', appearance: 'none',
          ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  )
}

/* ─── SHEET (bottom modal) ─── */
export function Sheet({ id, title, children, open, onClose }: { id: string; title: string; children: ReactNode; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}
    >
      <div style={{
        width: '100%', background: '#08080f', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '18px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        maxHeight: '88vh', overflowY: 'auto',
        animation: 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '3px', marginBottom: '18px' }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

/* ─── TABS ─── */
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '7px 14px', borderRadius: '20px',
            border: active === t ? 'none' : '1px solid rgba(255,255,255,0.06)',
            background: active === t ? '#b8ff00' : 'transparent',
            color: active === t ? '#000' : '#444466',
            fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1.5px',
            whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
            boxShadow: active === t ? '0 0 16px rgba(184,255,0,0.25)' : 'none',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/* ─── EMPTY STATE ─── */
export function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', fontSize: '12px' }}>
      {text}
    </div>
  )
}

/* ─── MACRO RING SVG ─── */
export function MacroRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const R = 28, cx = 35, cy = 35, sw = 6
  const pct = Math.min(1, value / Math.max(max, 1))
  const full = 2 * Math.PI * R
  const dash = pct * full
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${full}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 4px ${color}66)`, transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontFamily="Orbitron, sans-serif" fontSize="11" fontWeight="700" fill={color}>{Math.round(value)}</text>
      </svg>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '10px', letterSpacing: '1.5px', color: '#444466' }}>{label}</div>
    </div>
  )
}

/* ─── PROGRESS BAR ─── */
export function ProgressBar({ value, max, color, height = 6 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100)
  return (
    <div style={{ background: '#111122', borderRadius: '4px', height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', boxShadow: `0 0 8px ${color}55`, transition: 'width 0.8s ease' }} />
    </div>
  )
}
