'use client'

import { useEffect, useRef, useState } from 'react'
import { DB } from '@/lib/types'
import { uid, today, fmtDate, fmtShort } from '@/lib/db'
import { Card, Badge, Btn, Input, Select, Sheet, Tabs, MacroRing, ProgressBar, Empty } from '@/components/ui'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }

interface AiResult {
  name: string; quantity: number; unit: string
  kcal: number; protein: number; carbs: number; fat: number
  confidence: 'high' | 'medium' | 'low'; notes?: string
}

const COLORS = ['#b8ff00', '#00e5ff', '#ff3366', '#ff7700', '#9d4edd', '#ffd700']

export default function Diet({ db, updateDB }: Props) {
  const [tab, setTab] = useState('HOJE')
  const [showFood, setShowFood] = useState(false)
  const [showPlan, setShowPlan] = useState(false)

  // AI meal input
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [aiError, setAiError] = useState('')
  const [meal, setMeal] = useState('Almoço')
  const [agua, setAgua] = useState('')

  // Manual food
  const [selFood, setSelFood] = useState(db.foods[0]?.id || '')
  const [foodQtd, setFoodQtd] = useState('150')
  const [foodMeal, setFoodMeal] = useState('Almoço')

  // New food form
  const [fName, setFName] = useState(''); const [fKcal, setFKcal] = useState('')
  const [fProt, setFProt] = useState(''); const [fCarb, setFCarb] = useState('')
  const [fFat, setFFat] = useState(''); const [fCat, setFCat] = useState('Proteína')

  // Plan form
  const [pNome, setPNome] = useState(''); const [pKcal, setPKcal] = useState('')
  const [pProt, setPProt] = useState(''); const [pCarb, setPCarb] = useState('')
  const [pFat, setPFat] = useState(''); const [pNota, setPNota] = useState('')

  const kcalRef = useRef<HTMLCanvasElement>(null)
  const protRef = useRef<HTMLCanvasElement>(null)
  const kcalChart = useRef<Chart | null>(null)
  const protChart = useRef<Chart | null>(null)

  const todayStr = today()
  const refsHoje = db.meals.filter(r => r.date === todayStr)
  const aguaHoje = db.meals.find(r => r.date === todayStr && (r as any).tipo === 'agua') as any
  const totHoje = refsHoje.reduce((s, r) => ({ kcal: s.kcal + r.kcal, protein: s.protein + r.protein, carbs: s.carbs + r.carbs, fat: s.fat + r.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

  // ── AI ANALYZE ──
  const analyzeFood = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true); setAiError(''); setAiResult(null)
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiInput }),
      })
      if (!res.ok) throw new Error('Erro na API')
      const data: AiResult = await res.json()
      setAiResult(data)
    } catch {
      setAiError('Não foi possível analisar. Verifique a chave GEMINI_API_KEY.')
    } finally {
      setAiLoading(false)
    }
  }

  const confirmAiMeal = () => {
    if (!aiResult) return
    updateDB(d => ({
      ...d,
      meals: [...d.meals, {
        id: uid(), foodName: aiResult.name, quantity: aiResult.quantity, meal, date: todayStr,
        kcal: aiResult.kcal, protein: aiResult.protein, carbs: aiResult.carbs, fat: aiResult.fat,
        aiResolved: true,
      }]
    }))
    setAiInput(''); setAiResult(null)
  }

  const saveManual = () => {
    const food = db.foods.find(f => f.id === selFood)
    if (!food || !foodQtd) return
    const f = +foodQtd / 100
    updateDB(d => ({
      ...d,
      meals: [...d.meals, {
        id: uid(), foodId: food.id, foodName: food.name, quantity: +foodQtd, meal: foodMeal, date: todayStr,
        kcal: +(food.kcal * f).toFixed(1), protein: +(food.protein * f).toFixed(1),
        carbs: +(food.carbs * f).toFixed(1), fat: +(food.fat * f).toFixed(1),
      }]
    }))
    setFoodQtd('150')
  }

  const saveAgua = () => {
    if (!agua) return
    updateDB(d => {
      const meals = d.meals.filter(m => !(m.date === todayStr && (m as any).tipo === 'agua'))
      return { ...d, meals: [...meals, { id: uid(), tipo: 'agua', agua: +agua, date: todayStr, foodName: 'Água', quantity: +agua, meal: '', kcal: 0, protein: 0, carbs: 0, fat: 0 } as any] }
    })
    setAgua('')
  }

  const saveFood = () => {
    if (!fName) return alert('Nome obrigatório')
    updateDB(d => ({ ...d, foods: [...d.foods, { id: uid(), name: fName, kcal: +fKcal || 0, protein: +fProt || 0, carbs: +fCarb || 0, fat: +fFat || 0, category: fCat }] }))
    setFName(''); setFKcal(''); setFProt(''); setFCarb(''); setFFat('')
    setShowFood(false)
  }

  const savePlan = () => {
    if (!pNome) return alert('Nome obrigatório')
    updateDB(d => ({ ...d, dietPlans: [...d.dietPlans, { id: uid(), name: pNome, kcal: +pKcal || 0, protein: +pProt || 0, carbs: +pCarb || 0, fat: +pFat || 0, notes: pNota }] }))
    setPNome(''); setPKcal(''); setPProt(''); setPCarb(''); setPFat(''); setPNota(''); setShowPlan(false)
  }

  // Weekly charts
  useEffect(() => {
    if (tab !== 'SEMANA') return
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().split('T')[0] })
    const kcals = days.map(d => Math.round(db.meals.filter(r => r.date === d && !(r as any).tipo).reduce((s, r) => s + r.kcal, 0)))
    const prots = days.map(d => Math.round(db.meals.filter(r => r.date === d && !(r as any).tipo).reduce((s, r) => s + r.protein, 0)))
    const labels = days.map(fmtShort)

    if (kcalRef.current) {
      if (kcalChart.current) kcalChart.current.destroy()
      const ctx = kcalRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, 'rgba(255,215,0,0.4)'); g.addColorStop(1, 'rgba(255,215,0,0)')
      kcalChart.current = new Chart(ctx, {
        type: 'bar', data: { labels, datasets: [{ data: kcals, backgroundColor: g, borderColor: '#ffd700', borderWidth: 1.5, borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 800 }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } } } } },
      })
    }
    if (protRef.current) {
      if (protChart.current) protChart.current.destroy()
      const ctx = protRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, 'rgba(0,229,255,0.4)'); g.addColorStop(1, 'rgba(0,229,255,0)')
      protChart.current = new Chart(ctx, {
        type: 'line', data: { labels, datasets: [{ data: prots, borderColor: '#00e5ff', backgroundColor: g, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#00e5ff', pointBorderColor: '#05050a', pointBorderWidth: 2, tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 800 }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani' }, callback: v => `${v}g` } } } },
      })
    }
  }, [tab, db.meals])

  const confColor = { high: '#b8ff00', medium: '#ffd700', low: '#ff7700' }

  return (
    <div style={{ padding: '14px', paddingBottom: '8px' }}>
      <Tabs tabs={['HOJE', 'SEMANA', 'ALIMENTOS', 'PLANOS']} active={tab} onChange={setTab} />

      {/* ── HOJE ── */}
      {tab === 'HOJE' && (
        <>
          {/* Macro rings */}
          <Card glow="#ff7700">
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>MACROS DE HOJE</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <MacroRing label="KCAL" value={Math.round(totHoje.kcal)} max={2500} color="#ffd700" />
              <MacroRing label="PROT" value={Math.round(totHoje.protein)} max={200} color="#00e5ff" />
              <MacroRing label="CARBO" value={Math.round(totHoje.carbs)} max={300} color="#ff3366" />
              <MacroRing label="GORD" value={Math.round(totHoje.fat)} max={80} color="#ff7700" />
            </div>
          </Card>

          {/* Água */}
          <Card style={{ padding: '12px 14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px' }}>HIDRATAÇÃO</div>
              <Badge color="cyan">{aguaHoje?.agua || 0}ml</Badge>
            </div>
            <ProgressBar value={aguaHoje?.agua || 0} max={2500} color="#00e5ff" height={8} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input type="number" placeholder="ml bebidos hoje" value={agua} onChange={e => setAgua(e.target.value)} style={{ flex: 1, background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
              <Btn small onClick={saveAgua}>SALVAR</Btn>
            </div>
          </Card>

          {/* ── AI MEAL INPUT ── */}
          <Card glow="#b8ff00">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px' }}>LANÇAR COM IA</div>
              <Badge color="lime">GEMINI</Badge>
            </div>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', marginBottom: '8px' }}>
              Descreva qualquer refeição em linguagem natural. A IA busca os macros reais.
            </div>
            <div style={{ marginBottom: '8px' }}>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                rows={2}
                placeholder="Ex: 200g de frango grelhado com 150g de batata doce cozida e brócolis"
                style={{ width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '13px', padding: '10px 12px', outline: 'none', resize: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#b8ff00'; e.target.style.boxShadow = '0 0 0 2px rgba(184,255,0,0.08)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <Select value={meal} onChange={e => setMeal(e.target.value)} style={{ flex: 1, marginBottom: 0 }}>
                {['Café','Pré-treino','Almoço','Lanche','Jantar','Ceia'].map(m => <option key={m}>{m}</option>)}
              </Select>
              <Btn small onClick={analyzeFood} style={{ flexShrink: 0 }}>{aiLoading ? '⏳' : '🤖 ANALISAR'}</Btn>
            </div>

            {aiError && <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#ff3366', marginBottom: '10px' }}>{aiError}</div>}

            {aiResult && (
              <div style={{ background: '#111122', border: '1px solid rgba(184,255,0,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 700, flex: 1, paddingRight: '8px' }}>{aiResult.name}</div>
                  <Badge color={aiResult.confidence === 'high' ? 'lime' : aiResult.confidence === 'medium' ? 'orange' : 'red'}>{aiResult.confidence.toUpperCase()}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', marginBottom: '10px' }}>{aiResult.quantity}{aiResult.unit} estimado</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { l: 'KCAL', v: Math.round(aiResult.kcal), c: '#ffd700' },
                    { l: 'PROT', v: `${aiResult.protein.toFixed(1)}g`, c: '#00e5ff' },
                    { l: 'CARBO', v: `${aiResult.carbs.toFixed(1)}g`, c: '#ff3366' },
                    { l: 'GORD', v: `${aiResult.fat.toFixed(1)}g`, c: '#ff7700' },
                  ].map(m => (
                    <div key={m.l} style={{ textAlign: 'center', background: '#0c0c18', borderRadius: '8px', padding: '8px 4px' }}>
                      <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: 700, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {aiResult.notes && <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', marginBottom: '10px' }}>ℹ️ {aiResult.notes}</div>}
                <Btn onClick={confirmAiMeal}>✓ CONFIRMAR E LANÇAR</Btn>
              </div>
            )}
          </Card>

          {/* Manual */}
          <Card>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>LANÇAR MANUAL</div>
            <Select label="ALIMENTO" value={selFood} onChange={e => setSelFood(e.target.value)}>
              {db.foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input label="QTD (g/ml)" type="number" value={foodQtd} onChange={e => setFoodQtd(e.target.value)} />
              <Select label="REFEIÇÃO" value={foodMeal} onChange={e => setFoodMeal(e.target.value)}>
                {['Café','Pré-treino','Almoço','Lanche','Jantar','Ceia'].map(m => <option key={m}>{m}</option>)}
              </Select>
            </div>
            {selFood && foodQtd && (() => {
              const food = db.foods.find(f => f.id === selFood)
              if (!food) return null
              const f = +foodQtd / 100
              return <div style={{ background: '#111122', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                {Math.round(food.kcal * f)} kcal · P:{(food.protein * f).toFixed(1)}g · C:{(food.carbs * f).toFixed(1)}g · G:{(food.fat * f).toFixed(1)}g
              </div>
            })()}
            <Btn onClick={saveManual}>LANÇAR</Btn>
          </Card>

          {/* Today's meals */}
          <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            REFEIÇÕES DE HOJE <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>
          {refsHoje.map(r => (
            <div key={r.id} style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {r.foodName}
                  {r.aiResolved && <span style={{ display:'inline-flex', alignItems:'center', padding:'1px 5px', borderRadius:'3px', fontSize:'8px', fontFamily:'Rajdhani, sans-serif', fontWeight:700, letterSpacing:'1px', background:'rgba(184,255,0,0.15)', color:'#b8ff00' }}>IA</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{r.meal} · {r.quantity}g</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: 700, color: '#ff7700' }}>{Math.round(r.kcal)}<span style={{ fontSize: '10px', color: '#444466' }}>kcal</span></div>
                <div style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>P:{r.protein.toFixed(0)} C:{r.carbs.toFixed(0)} G:{r.fat.toFixed(0)}</div>
              </div>
              <button onClick={() => updateDB(d => ({ ...d, meals: d.meals.filter(m => m.id !== r.id) }))} style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: '16px', padding: '0 2px' }}>✕</button>
            </div>
          ))}
          {!refsHoje.length && <Empty text="NENHUMA REFEIÇÃO HOJE" />}
        </>
      )}

      {/* ── SEMANA ── */}
      {tab === 'SEMANA' && (
        <>
          <Card glow="#ffd700">
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>CALORIAS — ÚLTIMOS 7 DIAS</div>
            <div style={{ position: 'relative', height: '180px' }}><canvas ref={kcalRef} /></div>
          </Card>
          <Card glow="#00e5ff">
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>PROTEÍNA — ÚLTIMOS 7 DIAS</div>
            <div style={{ position: 'relative', height: '160px' }}><canvas ref={protRef} /></div>
          </Card>
        </>
      )}

      {/* ── ALIMENTOS ── */}
      {tab === 'ALIMENTOS' && (
        <>
          <input type="text" placeholder="🔍  buscar alimento..." onChange={e => {
            const q = e.target.value.toLowerCase()
            // filter is done inline below
          }} style={{ width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '14px', padding: '10px 12px', outline: 'none', marginBottom: '10px' }} id="food-search-input" />
          {db.foods.filter(f => {
            const q = (document.getElementById('food-search-input') as HTMLInputElement)?.value?.toLowerCase() || ''
            return f.name.toLowerCase().includes(q)
          }).map(f => (
            <div key={f.id} style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{f.kcal} kcal · P:{f.protein}g C:{f.carbs}g G:{f.fat}g por 100g</div>
              </div>
              <Badge color="cyan">{f.category}</Badge>
              <Btn small variant="danger" onClick={() => updateDB(d => ({ ...d, foods: d.foods.filter(x => x.id !== f.id) }))}>✕</Btn>
            </div>
          ))}
          <Btn variant="ghost" onClick={() => setShowFood(true)} style={{ marginTop: '4px' }}>+ CADASTRAR ALIMENTO</Btn>
        </>
      )}

      {/* ── PLANOS ── */}
      {tab === 'PLANOS' && (
        <>
          {db.dietPlans.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', fontWeight: 700 }}>{p.name}</div>
                <Btn small variant="danger" onClick={() => updateDB(d => ({ ...d, dietPlans: d.dietPlans.filter(x => x.id !== p.id) }))}>✕</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                {[{ l:'KCAL',v:p.kcal,c:'#ff7700'},{l:'PROT',v:`${p.protein}g`,c:'#00e5ff'},{l:'CARBO',v:`${p.carbs}g`,c:'#ff3366'}].map(m => (
                  <div key={m.l} style={{ textAlign: 'center', background: '#111122', borderRadius: '8px', padding: '8px' }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: 700, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>{m.l}</div>
                  </div>
                ))}
              </div>
              {p.notes && <div style={{ fontSize: '12px', color: '#444466', marginTop: '8px' }}>{p.notes}</div>}
            </Card>
          ))}
          {!db.dietPlans.length && <Empty text="NENHUM PLANO" />}
          <Btn variant="ghost" onClick={() => setShowPlan(true)} style={{ marginTop: '4px' }}>+ CRIAR PLANO</Btn>
        </>
      )}

      {/* SHEETS */}
      <Sheet title="CADASTRAR ALIMENTO" open={showFood} onClose={() => setShowFood(false)} id="food">
        <Input label="NOME" value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Frango grelhado" />
        <div style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>MACROS POR 100g</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="CALORIAS" type="number" value={fKcal} onChange={e => setFKcal(e.target.value)} placeholder="165" />
          <Input label="PROTEÍNA (g)" type="number" value={fProt} onChange={e => setFProt(e.target.value)} placeholder="31" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="CARBO (g)" type="number" value={fCarb} onChange={e => setFCarb(e.target.value)} placeholder="0" />
          <Input label="GORDURA (g)" type="number" value={fFat} onChange={e => setFFat(e.target.value)} placeholder="3.6" />
        </div>
        <Select label="CATEGORIA" value={fCat} onChange={e => setFCat(e.target.value)}>
          {['Proteína','Carboidrato','Gordura','Vegetal','Fruta','Laticínio','Suplemento','Outro'].map(o => <option key={o}>{o}</option>)}
        </Select>
        <Btn onClick={saveFood}>SALVAR</Btn>
      </Sheet>

      <Sheet title="PLANO ALIMENTAR" open={showPlan} onClose={() => setShowPlan(false)} id="plan">
        <Input label="NOME" value={pNome} onChange={e => setPNome(e.target.value)} placeholder="Ex: Cutting 2500 kcal" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="KCAL" type="number" value={pKcal} onChange={e => setPKcal(e.target.value)} placeholder="2500" />
          <Input label="PROTEÍNA (g)" type="number" value={pProt} onChange={e => setPProt(e.target.value)} placeholder="200" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="CARBO (g)" type="number" value={pCarb} onChange={e => setPCarb(e.target.value)} placeholder="250" />
          <Input label="GORDURA (g)" type="number" value={pFat} onChange={e => setPFat(e.target.value)} placeholder="70" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>NOTAS</label>
          <textarea value={pNota} onChange={e => setPNota(e.target.value)} rows={2} style={{ width: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '14px', padding: '10px 12px', outline: 'none', resize: 'none' }} />
        </div>
        <Btn onClick={savePlan}>SALVAR</Btn>
      </Sheet>
    </div>
  )
}
