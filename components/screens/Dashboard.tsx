'use client'

import { useEffect, useRef } from 'react'
import { DB } from '@/lib/types'
import { fmtShort, getWeekStr } from '@/lib/db'
import { Card, KPI, MacroRing } from '@/components/ui'
import { BASE_OPTS, TOOLTIP } from '@/components/chartConfig'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }

export default function Dashboard({ db }: Props) {
  const pesoRef = useRef<HTMLCanvasElement>(null)
  const pesoChart = useRef<Chart | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const ps = [...db.weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const lastW = ps[ps.length - 1]
  const prevW = ps[ps.length - 2]
  const deltaPeso = lastW && prevW ? (lastW.weight - prevW.weight).toFixed(1) : null

  const mes = today.slice(0, 7)
  const treinosMes = db.workouts.filter(t => t.date?.startsWith(mes)).length

  const refsHoje = db.meals.filter(r => r.date === today)
  const totHoje = refsHoje.reduce(
    (s, r) => ({ kcal: s.kcal + r.kcal, protein: s.protein + r.protein, carbs: s.carbs + r.carbs, fat: s.fat + r.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const activeCycle = db.cycles.find(c => c.active && c.startDate <= today)
  const cycleWeek = activeCycle
    ? Math.ceil((Date.now() - new Date(activeCycle.startDate + 'T12:00:00').getTime()) / (7 * 86400000))
    : null

  // Heatmap
  const weeks = 8
  const grid: number[][] = Array.from({ length: 7 }, () => Array(weeks).fill(0))
  db.workouts.forEach(t => {
    const td = new Date(t.date + 'T12:00:00')
    const diff = Math.floor((Date.now() - td.getTime()) / 86400000)
    if (diff < 0 || diff > weeks * 7) return
    const week = Math.floor(diff / 7)
    const dow = td.getDay()
    grid[dow][weeks - 1 - week] = (grid[dow][weeks - 1 - week] || 0) + 1
  })

  useEffect(() => {
    if (!pesoRef.current) return
    if (pesoChart.current) pesoChart.current.destroy()
    const ctx = pesoRef.current.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 160)
    grad.addColorStop(0, 'rgba(184,255,0,0.25)')
    grad.addColorStop(1, 'rgba(184,255,0,0)')
    pesoChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ps.slice(-14).map(p => fmtShort(p.date)),
        datasets: [{
          data: ps.slice(-14).map(p => p.weight),
          borderColor: '#b8ff00', backgroundColor: grad,
          borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#b8ff00',
          pointBorderColor: '#05050a', pointBorderWidth: 2, tension: 0.4, fill: true,
        }],
      },
      options: {
        ...BASE_OPTS,
        plugins: { ...BASE_OPTS.plugins, tooltip: { ...TOOLTIP, callbacks: { label: (c: any) => `${c.parsed.y}kg` } } },
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.weightEntries])

  const hDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div style={{ padding: '14px', paddingBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <KPI label="PESO ATUAL" value={lastW ? `${lastW.weight}` : '—'}
          sub={deltaPeso ? `${+deltaPeso > 0 ? '▲' : '▼'}${Math.abs(+deltaPeso)}kg vs anterior` : 'kg'} color="#b8ff00" />
        <KPI label="SEMANA CICLO" value={cycleWeek ? `S${cycleWeek}` : '—'}
          sub={activeCycle?.name || 'sem ciclo ativo'} color="#00e5ff" />
        <KPI label="CALORIAS HOJE" value={Math.round(totHoje.kcal)} sub="kcal" color="#ff7700" />
        <KPI label="TREINOS/MÊS" value={treinosMes} sub="este mês" color="#ffd700" />
      </div>

      <Card glow="#b8ff00">
        <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>
          PROGRESSO DE PESO
        </div>
        <div style={{ position: 'relative', height: '160px' }}><canvas ref={pesoRef} /></div>
      </Card>

      <Card glow="#ff7700">
        <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>MACROS DE HOJE</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <MacroRing label="KCAL" value={Math.round(totHoje.kcal)} max={2500} color="#ffd700" />
          <MacroRing label="PROT" value={Math.round(totHoje.protein)} max={200} color="#00e5ff" />
          <MacroRing label="CARBO" value={Math.round(totHoje.carbs)} max={300} color="#ff3366" />
          <MacroRing label="GORD" value={Math.round(totHoje.fat)} max={80} color="#ff7700" />
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>FREQUÊNCIA DE TREINOS — 8 SEMANAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {hDays.map((day, di) => (
            <div key={di} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ width: '20px', fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', flexShrink: 0 }}>{day}</div>
              <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                {Array.from({ length: weeks }, (_, wi) => {
                  const v = grid[di]?.[wi] || 0
                  const alpha = v > 0 ? Math.min(1, 0.3 + v * 0.35) : 0
                  return <div key={wi} style={{ flex: 1, height: '20px', borderRadius: '3px', background: v ? `rgba(184,255,0,${alpha})` : '#111122' }} />
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
