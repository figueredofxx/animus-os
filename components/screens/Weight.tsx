'use client'

import { useEffect, useRef, useState } from 'react'
import { DB } from '@/lib/types'
import { uid, today, fmtDate, fmtShort } from '@/lib/db'
import { Card, KPI, Btn, Input, Empty } from '@/components/ui'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }

export default function Weight({ db, updateDB }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const [peso, setPeso] = useState('')
  const [date, setDate] = useState(today())
  const [meta, setMeta] = useState(db.weightGoal?.toString() || '')

  const ps = [...db.weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const last = ps[ps.length - 1]
  const first = ps[0]
  const perdido = last && first ? (first.weight - last.weight).toFixed(1) : null
  const falta = last && db.weightGoal ? Math.max(0, last.weight - db.weightGoal).toFixed(1) : null
  const pctMeta = last && first && db.weightGoal
    ? Math.min(100, Math.round(((first.weight - last.weight) / Math.max(0.1, first.weight - db.weightGoal)) * 100))
    : 0

  const save = () => {
    if (!peso || !date) return alert('Informe peso e data')
    updateDB(d => {
      const entries = [...d.weightEntries]
      const idx = entries.findIndex(e => e.date === date)
      if (idx >= 0) entries[idx] = { ...entries[idx], weight: +peso }
      else entries.push({ id: uid(), weight: +peso, date })
      return { ...d, weightEntries: entries, weightGoal: meta ? +meta : d.weightGoal }
    })
    setPeso('')
  }

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const ctx = chartRef.current.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 200)
    grad.addColorStop(0, 'rgba(184,255,0,0.3)')
    grad.addColorStop(1, 'rgba(184,255,0,0)')
    const datasets: Chart['data']['datasets'] = [
      { label: 'Peso', data: ps.map(p => p.weight), borderColor: '#b8ff00', backgroundColor: grad, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#b8ff00', pointBorderColor: '#05050a', pointBorderWidth: 2, tension: 0.4, fill: true },
    ]
    if (db.weightGoal) {
      datasets.push({ label: 'Meta', data: ps.map(() => db.weightGoal!), borderColor: '#ff3366', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 } as any)
    }
    chartInst.current = new Chart(ctx, {
      type: 'line',
      data: { labels: ps.map(p => fmtShort(p.date)), datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 800 },
        plugins: {
          legend: { display: !!db.weightGoal, labels: { color: '#444466', font: { size: 10, family: 'Rajdhani, sans-serif' }, boxWidth: 12 } },
          tooltip: { backgroundColor: 'rgba(8,8,15,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#b8ff00', bodyColor: '#e8e8f0', callbacks: { label: c => `${c.parsed.y}kg` } },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } }, border: { color: 'rgba(255,255,255,0.06)' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' }, callback: v => `${v}kg` }, border: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    })
  }, [db.weightEntries, db.weightGoal])

  return (
    <div style={{ padding: '14px', paddingBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <KPI label="ATUAL" value={last?.weight ?? '—'} sub="kg" color="#b8ff00" />
        <KPI label="PERDIDO" value={perdido ? Math.abs(+perdido) : '—'} sub="kg desde início" color="#ff3366" />
        <KPI label="META" value={db.weightGoal ?? '—'} sub="kg" color="#ffd700" />
        <KPI label="FALTA" value={falta ?? '—'} sub="kg" color="#00e5ff" />
      </div>

      <Card glow="#b8ff00">
        <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>CURVA DE PESO</div>
        <div style={{ position: 'relative', height: '200px' }}><canvas ref={chartRef} /></div>
      </Card>

      {/* Meta progress */}
      {db.weightGoal && last && (
        <Card glow="#ff3366">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px' }}>PROGRESSO DA META</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 700, color: '#ff3366' }}>{pctMeta}%</div>
          </div>
          <div style={{ background: '#111122', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ height: '100%', width: `${pctMeta}%`, background: 'linear-gradient(90deg,#ff3366,#ff9900)', borderRadius: '4px', boxShadow: '0 0 12px rgba(255,51,102,0.4)', transition: 'width 1s ease' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{falta}kg até {db.weightGoal}kg</div>
        </Card>
      )}

      {/* Register */}
      <Card>
        <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>REGISTRAR PESAGEM</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="PESO (kg)" type="number" step="0.1" placeholder="82.5" value={peso} onChange={e => setPeso(e.target.value)} />
          <Input label="DATA" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <Input label="META (kg)" type="number" step="0.1" placeholder="75.0" value={meta} onChange={e => setMeta(e.target.value)} />
        <Btn onClick={save}>REGISTRAR</Btn>
      </Card>

      <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', marginTop: '4px' }}>
        HISTÓRICO <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
      </div>
      {[...ps].reverse().slice(0, 30).map((p, i, arr) => {
        const prev = arr[i + 1]
        const delta = prev ? (p.weight - prev.weight).toFixed(1) : null
        return (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>{fmtDate(p.date)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {delta !== null && <span style={{ fontSize: '11px', color: +delta < 0 ? '#b8ff00' : '#ff3366', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{+delta > 0 ? '+' : ''}{delta}kg</span>}
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fontWeight: 700 }}>{p.weight}<span style={{ fontSize: '11px', color: '#444466' }}>kg</span></div>
            </div>
          </div>
        )
      })}
      {!ps.length && <Empty text="NENHUMA PESAGEM" />}
    </div>
  )
}
