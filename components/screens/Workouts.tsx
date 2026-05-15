'use client'

import { useEffect, useRef, useState } from 'react'
import { DB, WorkoutExercise } from '@/lib/types'
import { uid, today, fmtDate, fmtShort, getWeekStr } from '@/lib/db'
import { Card, Badge, Btn, Input, Select, Sheet, Tabs, Empty } from '@/components/ui'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }

const TYPES = ['Peito','Costas','Ombros','Bíceps','Tríceps','Pernas','Glúteos','Abdômen','Full Body','Cardio','HIIT','Outro']
const COLORS = ['#b8ff00','#00e5ff','#ff3366','#ff7700','#9d4edd','#ffd700','#00ffaa','#ff00aa','#4466ff','#00cc88']

export default function Workouts({ db, updateDB }: Props) {
  const [tab, setTab] = useState('REGISTRAR')
  const [showPlano, setShowPlano] = useState(false)

  const [tipo, setTipo] = useState(TYPES[0])
  const [date, setDate] = useState(today())
  const [dur, setDur] = useState('')
  const [obs, setObs] = useState('')
  const [exercs, setExercs] = useState<WorkoutExercise[]>([])

  const [planoNome, setPlanoNome] = useState('')
  const [planoDesc, setPlanoDesc] = useState('')

  const semRef = useRef<HTMLCanvasElement>(null)
  const pizzaRef = useRef<HTMLCanvasElement>(null)
  const semChart = useRef<Chart | null>(null)
  const pizzaChart = useRef<Chart | null>(null)

  const saveTreino = () => {
    if (!date) return alert('Informe a data')
    updateDB(d => ({ ...d, workouts: [...d.workouts, { id: uid(), type: tipo, date, duration: +dur || 0, notes: obs, exercises: exercs.filter(e => e.name) }] }))
    setExercs([]); setObs(''); setDur('')
    alert('✓ Treino salvo!')
  }

  const addExerc = () => setExercs(prev => [...prev, { name: '', sets: 0, reps: 0, weight: 0 }])

  const savePlano = () => {
    if (!planoNome) return alert('Nome obrigatório')
    updateDB(d => ({ ...d, workoutPlans: [...d.workoutPlans, { id: uid(), name: planoNome, description: planoDesc }] }))
    setPlanoNome(''); setPlanoDesc(''); setShowPlano(false)
  }

  useEffect(() => {
    if (tab !== 'STATS') return
    const semMap: Record<string, number> = {}
    db.workouts.forEach(t => {
      const d = new Date(t.date + 'T12:00:00')
      const w = getWeekStr(d)
      semMap[w] = (semMap[w] || 0) + 1
    })
    const wLabels = Object.keys(semMap).slice(-8)

    if (semRef.current) {
      if (semChart.current) semChart.current.destroy()
      const ctx = semRef.current.getContext('2d')!
      const grad = ctx.createLinearGradient(0, 0, 0, 180)
      grad.addColorStop(0, 'rgba(184,255,0,0.4)'); grad.addColorStop(1, 'rgba(184,255,0,0)')
      semChart.current = new Chart(ctx, {
        type: 'bar',
        data: { labels: wLabels.length ? wLabels : ['—'], datasets: [{ data: wLabels.map(w => semMap[w] || 0), backgroundColor: grad, borderColor: '#b8ff00', borderWidth: 1.5, borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 800 }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } } } } },
      })
    }
    if (pizzaRef.current) {
      if (pizzaChart.current) pizzaChart.current.destroy()
      const tipos: Record<string, number> = {}
      db.workouts.forEach(t => { tipos[t.type] = (tipos[t.type] || 0) + 1 })
      const labels = Object.keys(tipos)
      pizzaChart.current = new Chart(pizzaRef.current, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: labels.map(l => tipos[l]), backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length] + 'cc'), borderColor: '#05050a', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', animation: { duration: 800 }, plugins: { legend: { display: true, labels: { color: '#444466', font: { size: 10, family: 'Rajdhani' }, boxWidth: 8, padding: 8 } } } },
      })
    }
  }, [tab, db.workouts])

  return (
    <div style={{ padding: '14px', paddingBottom: '8px' }}>
      <Tabs tabs={['REGISTRAR', 'STATS', 'PLANOS', 'HISTÓRICO']} active={tab} onChange={setTab} />

      {tab === 'REGISTRAR' && (
        <Card>
          <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>NOVO TREINO</div>
          <Select label="TIPO" value={tipo} onChange={e => setTipo(e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input label="DATA" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="DURAÇÃO (min)" type="number" placeholder="60" value={dur} onChange={e => setDur(e.target.value)} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>OBSERVAÇÕES</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Carga, sensação, PR..." style={{ width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', padding: '10px 12px', outline: 'none', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px' }}>EXERCÍCIOS</span>
            <Btn small variant="ghost" onClick={addExerc}>+ ADD</Btn>
          </div>
          {exercs.map((ex, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '5px', marginBottom: '6px' }}>
              {(['name', 'sets', 'reps', 'weight'] as const).map(field => (
                <input key={field} type={field === 'name' ? 'text' : 'number'} placeholder={field === 'name' ? 'Exercício' : field === 'weight' ? 'Kg' : field}
                  value={(ex[field] as any) || ''}
                  onChange={e => setExercs(prev => prev.map((x, j) => j === i ? { ...x, [field]: field === 'name' ? e.target.value : +e.target.value } : x))}
                  style={{ background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '12px', padding: '8px', outline: 'none' }} />
              ))}
            </div>
          ))}
          <Btn onClick={saveTreino} style={{ marginTop: '8px' }}>SALVAR TREINO</Btn>
        </Card>
      )}

      {tab === 'STATS' && (
        <>
          <Card glow="#b8ff00">
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>VOLUME POR SEMANA</div>
            <div style={{ position: 'relative', height: '180px' }}><canvas ref={semRef} /></div>
          </Card>
          <Card>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>DISTRIBUIÇÃO POR GRUPO</div>
            <div style={{ position: 'relative', height: '200px' }}><canvas ref={pizzaRef} /></div>
          </Card>
        </>
      )}

      {tab === 'PLANOS' && (
        <>
          {db.workoutPlans.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', fontWeight: 700 }}>{p.name}</div>
                <Btn small variant="danger" onClick={() => updateDB(d => ({ ...d, workoutPlans: d.workoutPlans.filter(x => x.id !== p.id) }))}>✕</Btn>
              </div>
              {p.description && <div style={{ fontSize: '12px', color: '#444466', marginTop: '6px' }}>{p.description}</div>}
            </Card>
          ))}
          {!db.workoutPlans.length && <Empty text="NENHUM PLANO" />}
          <Btn variant="ghost" onClick={() => setShowPlano(true)} style={{ marginTop: '4px' }}>+ CRIAR PLANO</Btn>
        </>
      )}

      {tab === 'HISTÓRICO' && (
        <>
          {[...db.workouts].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
            <Card key={t.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: 700 }}>{t.type}</div>
                <span style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{fmtDate(t.date)}</span>
              </div>
              {t.duration > 0 && <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:'4px', fontSize:'10px', fontFamily:'Rajdhani, sans-serif', fontWeight:700, letterSpacing:'1px', background:'rgba(184,255,0,0.12)', color:'#b8ff00', marginBottom:'6px' }}>⏱ {t.duration} MIN</span>}
              {t.exercises?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {t.exercises.map((e, i) => <Badge key={i} color="cyan">{e.name}{e.weight ? ` ${e.weight}kg` : ''}</Badge>)}
                </div>
              )}
              {t.notes && <div style={{ fontSize: '12px', color: '#444466', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>{t.notes}</div>}
            </Card>
          ))}
          {!db.workouts.length && <Empty text="NENHUM TREINO" />}
        </>
      )}

      <Sheet title="PLANO DE TREINO" open={showPlano} onClose={() => setShowPlano(false)} id="plano">
        <Input label="NOME" value={planoNome} onChange={e => setPlanoNome(e.target.value)} placeholder="Ex: ABC Split" />
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>DESCRIÇÃO</label>
          <textarea value={planoDesc} onChange={e => setPlanoDesc(e.target.value)} rows={3} placeholder="Descreva a divisão..." style={{ width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '14px', padding: '10px 12px', outline: 'none', resize: 'none' }} />
        </div>
        <Btn onClick={savePlano}>SALVAR</Btn>
      </Sheet>
    </div>
  )
}
