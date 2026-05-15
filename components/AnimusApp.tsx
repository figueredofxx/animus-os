'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadDB, saveDB } from '@/lib/db'
import { DB } from '@/lib/types'
import Dashboard from './screens/Dashboard'
import Cycles from './screens/Cycles'
import Weight from './screens/Weight'
import Workouts from './screens/Workouts'
import Diet from './screens/Diet'

type Screen = 'dash' | 'ciclos' | 'peso' | 'treinos' | 'dieta'

const NAV = [
  { id: 'dash', label: 'PAINEL', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  { id: 'ciclos', label: 'CICLOS', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  )},
  { id: 'peso', label: 'PESO', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { id: 'treinos', label: 'TREINOS', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4"/>
    </svg>
  )},
  { id: 'dieta', label: 'DIETA', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M12 20v-6M12 8V4M4 12H2M22 12h-2"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  )},
] as const

export default function AnimusApp() {
  const [screen, setScreen] = useState<Screen>('dash')
  const [db, setDb] = useState<DB | null>(null)

  useEffect(() => {
    setDb(loadDB())
  }, [])

  const updateDB = useCallback((updater: (prev: DB) => DB) => {
    setDb(prev => {
      if (!prev) return prev
      const next = updater(prev)
      saveDB(next)
      return next
    })
  }, [])

  if (!db) return (
    <div style={{ background: '#05050a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#b8ff00', letterSpacing: '6px', fontSize: '20px' }}>
        ANIMUS
      </div>
    </div>
  )

  // Active cycle info for header
  const today = new Date().toISOString().split('T')[0]
  const activeCycle = db.cycles.find(c => c.active && c.startDate <= today)
  const lastWeight = [...db.weightEntries].sort((a, b) => a.date.localeCompare(b.date)).pop()
  const cycleWeek = activeCycle
    ? Math.ceil((Date.now() - new Date(activeCycle.startDate + 'T12:00:00').getTime()) / (7 * 86400000))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#05050a' }}>
      {/* HEADER */}
      <header style={{
        flexShrink: 0, padding: '14px 18px 10px',
        background: 'rgba(8,8,15,0.98)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(20px)', position: 'relative', zIndex: 10,
      }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 900, letterSpacing: '5px' }}>
          <span style={{ color: '#b8ff00' }}>ANIM</span>US
          <div style={{ fontSize: '8px', color: '#444466', letterSpacing: '3px', marginTop: '-3px', fontWeight: 400 }}>ATHLETE OS</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeCycle && cycleWeek && (
            <div style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '5px 12px', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>
              CICLO <span style={{ color: '#00e5ff' }}>S{cycleWeek}</span>
            </div>
          )}
          {lastWeight && (
            <div style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '5px 12px', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>
              <span style={{ color: '#b8ff00' }}>{lastWeight.weight}kg</span>
            </div>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screen === 'dash' && <Dashboard db={db} updateDB={updateDB} />}
        {screen === 'ciclos' && <Cycles db={db} updateDB={updateDB} />}
        {screen === 'peso' && <Weight db={db} updateDB={updateDB} />}
        {screen === 'treinos' && <Workouts db={db} updateDB={updateDB} />}
        {screen === 'dieta' && <Diet db={db} updateDB={updateDB} />}
      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        flexShrink: 0, display: 'flex',
        background: 'rgba(8,8,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}>
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setScreen(id as Screen)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '9px 2px', gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
              color: screen === id ? '#b8ff00' : '#444466',
              fontSize: '9px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '1.5px',
              position: 'relative', transition: 'color 0.2s',
            }}
          >
            {screen === id && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '24px', height: '2px', background: '#b8ff00', borderRadius: '0 0 4px 4px',
                boxShadow: '0 0 12px #b8ff00',
              }} />
            )}
            {icon}
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
