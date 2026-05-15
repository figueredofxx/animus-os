'use client'

import { useState, useEffect, useRef } from 'react'
import { DB, Cycle, CycleCompound } from '@/lib/types'
import { uid, today, fmtDate, fmtShort } from '@/lib/db'
import { computeBloodLevels, getActiveCompoundIds } from '@/lib/halflife'
import { Card, Badge, Btn, Input, Select, Sheet, Tabs, Empty } from '@/components/ui'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }

const COLORS = ['#b8ff00', '#00e5ff', '#ff3366', '#ff7700', '#9d4edd', '#ffd700', '#00ffaa']

const OBJ_BADGE: Record<string, 'cyan' | 'orange' | 'lime' | 'red' | 'muted'> = {
  Cutting: 'cyan', Bulking: 'orange', Recomp: 'lime', TPC: 'red', Outro: 'muted'
}

export default function Cycles({ db, updateDB }: Props) {
  const [tab, setTab] = useState('ATIVO')
  const [showNewCycle, setShowNewCycle] = useState(false)
  const [showNewCompound, setShowNewCompound] = useState(false)
  const [showApp, setShowApp] = useState(false)

  // New cycle form
  const [cycleName, setCycleName] = useState('')
  const [cycleStart, setCycleStart] = useState(today())
  const [cycleEnd, setCycleEnd] = useState('')
  const [cycleObj, setCycleObj] = useState<Cycle['objective']>('Bulking')
  const [cycleComps, setCycleComps] = useState<CycleCompound[]>([])

  // New compound form
  const [cpName, setCpName] = useState('')
  const [cpCat, setCpCat] = useState('Testosterona')
  const [cpHalf, setCpHalf] = useState(7)
  const [cpDose, setCpDose] = useState(250)
  const [cpFreq, setCpFreq] = useState('Semanal')
  const [cpRoute, setCpRoute] = useState('Intramuscular')

  // Application form
  const [appCycleId, setAppCycleId] = useState('')
  const [appCompId, setAppCompId] = useState('')
  const [appDose, setAppDose] = useState(250)
  const [appDate, setAppDate] = useState(today())
  const [appMuscle, setAppMuscle] = useState('Glúteo D')
  const [appNotes, setAppNotes] = useState('')

  const hlChartRef = useRef<HTMLCanvasElement>(null)
  const hlChart = useRef<Chart | null>(null)

  const todayStr = today()
  const activeCycle = db.cycles.find(c => c.active && c.startDate <= todayStr)
  const cycleWeek = activeCycle ? Math.ceil((Date.now() - new Date(activeCycle.startDate + 'T12:00:00').getTime()) / (7 * 86400000)) : null

  const saveCycle = () => {
    if (!cycleName || !cycleStart) return alert('Nome e início obrigatórios')
    updateDB(d => ({
      ...d,
      cycles: [...d.cycles, { id: uid(), name: cycleName, startDate: cycleStart, endDate: cycleEnd || undefined, objective: cycleObj, compounds: cycleComps.filter(c => c.compoundId && c.dosePerApp), active: true }]
    }))
    setCycleName(''); setCycleEnd(''); setCycleComps([])
    setShowNewCycle(false)
  }

  const saveCompound = () => {
    if (!cpName) return alert('Nome obrigatório')
    const cor = COLORS[db.compounds.length % COLORS.length]
    updateDB(d => ({ ...d, compounds: [...d.compounds, { id: uid(), name: cpName, category: cpCat, halfLifeDays: cpHalf, defaultDose: cpDose, frequency: cpFreq, route: cpRoute, color: cor }] }))
    setCpName(''); setShowNewCompound(false)
  }

  const openApp = (cid: string) => {
    setAppCycleId(cid); setAppDate(today())
    const cycle = db.cycles.find(c => c.id === cid)
    setAppCompId(cycle?.compounds[0]?.compoundId || db.compounds[0]?.id || '')
    setAppDose(250); setShowApp(true)
  }

  const saveApp = () => {
    if (!appCompId || !appDose || !appDate) return alert('Preencha composto, dose e data')
    updateDB(d => ({ ...d, applications: [...d.applications, { id: uid(), cycleId: appCycleId, compoundId: appCompId, dose: appDose, date: appDate, muscle: appMuscle, notes: appNotes }] }))
    setAppDose(250); setAppNotes(''); setShowApp(false)
  }

  const endCycle = (id: string) => {
    if (!confirm('Encerrar este ciclo?')) return
    updateDB(d => ({ ...d, cycles: d.cycles.map(c => c.id === id ? { ...c, active: false, endedAt: today() } : c) }))
  }

  // HALF-LIFE CHART
  useEffect(() => {
    if (tab !== 'GRÁFICOS' || !hlChartRef.current) return
    if (hlChart.current) hlChart.current.destroy()

    const apps = activeCycle ? db.applications.filter(a => a.cycleId === activeCycle.id) : db.applications.slice(-50)
    const points = computeBloodLevels(apps, db.compounds, 28)
    const compIds = getActiveCompoundIds(apps)

    const ctx = hlChartRef.current.getContext('2d')!
    const todayMs = Date.now()

    hlChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => fmtShort(p.date)),
        datasets: [
          ...compIds.map((cid, i) => {
            const cp = db.compounds.find(c => c.id === cid)
            const color = cp?.color || COLORS[i % COLORS.length]
            const grad = ctx.createLinearGradient(0, 0, 0, 220)
            grad.addColorStop(0, color + '44')
            grad.addColorStop(1, color + '00')
            return {
              label: cp?.name.split(' ')[0] || '?',
              data: points.map(p => Math.round(p.levels[cid] || 0)),
              borderColor: color, backgroundColor: grad,
              borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true,
            }
          }),
          {
            label: 'TOTAL',
            data: points.map(p => Math.round(p.total)),
            borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent',
            borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: {
          legend: { display: true, labels: { color: '#444466', font: { size: 10, family: 'Rajdhani, sans-serif' }, boxWidth: 10, padding: 10 } },
          tooltip: {
            backgroundColor: 'rgba(8,8,15,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            titleColor: '#b8ff00', bodyColor: '#e8e8f0', padding: 10,
            titleFont: { family: 'Orbitron, sans-serif', size: 10 },
            callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}mg` },
          },

        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 9, family: 'Rajdhani, sans-serif' }, maxTicksLimit: 10 }, border: { color: 'rgba(255,255,255,0.06)' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#444466', font: { size: 9, family: 'Rajdhani, sans-serif' }, callback: (v) => `${v}mg` }, border: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    })
  }, [tab, db.applications, db.compounds, activeCycle, todayStr])


  return (
    <div style={{ padding: '14px', paddingBottom: '8px' }}>
      <Tabs tabs={['ATIVO', 'GRÁFICOS', 'COMPOSTOS', 'HISTÓRICO']} active={tab} onChange={setTab} />

      {/* ── ATIVO ── */}
      {tab === 'ATIVO' && (
        <>
          {activeCycle ? (
            <Card glow="#00e5ff">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', marginBottom: '4px' }}>CICLO ATIVO</div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '17px', fontWeight: 700 }}>{activeCycle.name}</div>
                </div>
                <Badge color={OBJ_BADGE[activeCycle.objective] || 'lime'}>{activeCycle.objective}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'INÍCIO', val: fmtDate(activeCycle.startDate), color: '#e8e8f0' },
                  { label: 'SEMANA', val: `${cycleWeek}${activeCycle.endDate ? '/' + Math.ceil((new Date(activeCycle.endDate).getTime() - new Date(activeCycle.startDate).getTime()) / (7 * 86400000)) : ''}`, color: '#00e5ff' },
                  { label: 'APPS', val: db.applications.filter(a => a.cycleId === activeCycle.id).length, color: '#b8ff00' },
                ].map(k => (
                  <div key={k.label}>
                    <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '1px' }}>{k.label}</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 700, color: k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {activeCycle.endDate && (() => {
                const total = Math.ceil((new Date(activeCycle.endDate).getTime() - new Date(activeCycle.startDate).getTime()) / (7 * 86400000))
                const pct = Math.min(100, Math.round((cycleWeek! / total) * 100))
                return (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>PROGRESSO</span>
                      <span style={{ fontSize: '10px', color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ background: '#111122', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#00e5ff,#b8ff00)', borderRadius: '4px', boxShadow: '0 0 12px rgba(0,229,255,0.4)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Compounds */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px', marginBottom: '8px' }}>COMPOSTOS</div>
                {activeCycle.compounds.map(cc => {
                  const cp = db.compounds.find(c => c.id === cc.compoundId)
                  if (!cp) return null
                  return (
                    <div key={cc.compoundId} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', fontWeight: 700, color: cp.color }}>{cp.name}</span>
                        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', fontWeight: 600, color: cp.color }}>{cc.dosePerApp}mg {cp.frequency}</span>
                      </div>
                      <div style={{ background: '#111122', borderRadius: '4px', height: '7px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: cp.color, borderRadius: '4px', width: '100%', boxShadow: `0 0 10px ${cp.color}55` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Btn onClick={() => openApp(activeCycle.id)}>💉 REGISTRAR APLICAÇÃO</Btn>
                <Btn variant="danger" onClick={() => endCycle(activeCycle.id)}>ENCERRAR CICLO</Btn>
              </div>
            </Card>
          ) : (
            <Empty text="NENHUM CICLO ATIVO" />
          )}
          <Btn variant="ghost" onClick={() => setShowNewCycle(true)} style={{ marginTop: '4px' }}>+ NOVO CICLO</Btn>
        </>
      )}

      {/* ── GRÁFICOS ── */}
      {tab === 'GRÁFICOS' && (
        <>
          <Card glow="#00e5ff">
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '4px' }}>NÍVEL DOS COMPOSTOS NO SANGUE</div>
            <div style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', marginBottom: '12px' }}>curva de meia-vida por aplicação registrada</div>
            <div style={{ position: 'relative', height: '220px' }}>
              <canvas ref={hlChartRef} />
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>ÚLTIMAS APLICAÇÕES</div>
            {[...db.applications].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15).map(app => {
              const cp = db.compounds.find(c => c.id === app.compoundId)
              return (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: cp?.color || '#b8ff00' }}>{cp?.name || '?'}</div>
                    <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{fmtDate(app.date)} · {app.muscle}</div>
                  </div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fontWeight: 700, color: cp?.color || '#b8ff00' }}>{app.dose}<span style={{ fontSize: '11px', color: '#444466' }}>mg</span></div>
                </div>
              )
            })}
            {!db.applications.length && <Empty text="NENHUMA APLICAÇÃO" />}
          </Card>
        </>
      )}

      {/* ── COMPOSTOS ── */}
      {tab === 'COMPOSTOS' && (
        <>
          {db.compounds.map(cp => (
            <div key={cp.id} style={{ background: '#0c0c18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cp.color, boxShadow: `0 0 6px ${cp.color}88`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{cp.name}</div>
                <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>{cp.defaultDose}mg · {cp.frequency} · {cp.route} · t½ {cp.halfLifeDays}d</div>
              </div>
              <Btn variant="danger" small onClick={() => updateDB(d => ({ ...d, compounds: d.compounds.filter(c => c.id !== cp.id) }))}>✕</Btn>
            </div>
          ))}
          <Btn variant="ghost" onClick={() => setShowNewCompound(true)} style={{ marginTop: '4px' }}>+ NOVO COMPOSTO</Btn>
        </>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'HISTÓRICO' && (
        <>
          {[...db.cycles].sort((a, b) => b.startDate.localeCompare(a.startDate)).map(c => (
            <Card key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Badge color={c.active ? 'lime' : 'muted'}>{c.active ? 'ATIVO' : 'ENCERRADO'}</Badge>
                <Badge color={OBJ_BADGE[c.objective] || 'lime'}>{c.objective}</Badge>
              </div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{c.name}</div>
              <div style={{ fontSize: '11px', color: '#444466', fontFamily: 'Rajdhani, sans-serif' }}>
                {fmtDate(c.startDate)}{c.endDate ? ` → ${fmtDate(c.endDate)}` : ''} · {db.applications.filter(a => a.cycleId === c.id).length} aplicações
              </div>
            </Card>
          ))}
          {!db.cycles.length && <Empty text="NENHUM CICLO" />}
        </>
      )}

      {/* ── SHEETS ── */}
      <Sheet title="NOVO CICLO" open={showNewCycle} onClose={() => setShowNewCycle(false)} id="novo-ciclo">
        <Input label="NOME" value={cycleName} onChange={e => setCycleName(e.target.value)} placeholder="Ex: Bulking Inverno 2025" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="INÍCIO" type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} />
          <Input label="FIM PREVISTO" type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} />
        </div>
        <Select label="OBJETIVO" value={cycleObj} onChange={e => setCycleObj(e.target.value as Cycle['objective'])}>
          {['Cutting', 'Bulking', 'Recomp', 'TPC', 'Outro'].map(o => <option key={o}>{o}</option>)}
        </Select>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', color: '#444466', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '2px' }}>COMPOSTOS</span>
          <Btn small variant="ghost" onClick={() => setCycleComps(prev => [...prev, { compoundId: db.compounds[0]?.id || '', dosePerApp: 250 }])}>+ ADD</Btn>
        </div>
        {cycleComps.map((cc, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <Select style={{ flex: 2 }} value={cc.compoundId} onChange={e => setCycleComps(prev => prev.map((x, j) => j === i ? { ...x, compoundId: e.target.value } : x))}>
              {db.compounds.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
            </Select>
            <Input style={{ flex: 1 }} type="number" placeholder="mg" value={cc.dosePerApp || ''} onChange={e => setCycleComps(prev => prev.map((x, j) => j === i ? { ...x, dosePerApp: +e.target.value } : x))} />
          </div>
        ))}
        <Btn onClick={saveCycle} style={{ marginTop: '8px' }}>CRIAR CICLO</Btn>
      </Sheet>

      <Sheet title="NOVO COMPOSTO" open={showNewCompound} onClose={() => setShowNewCompound(false)} id="novo-comp">
        <Input label="NOME" value={cpName} onChange={e => setCpName(e.target.value)} placeholder="Ex: Testosterona Enantato" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select label="CATEGORIA" value={cpCat} onChange={e => setCpCat(e.target.value)}>
            {['Testosterona','Nandrolona','Trembolona','Estanozolol','Oxandrolona','Boldenona','HGH','Insulina','SARMs','TPC','Outro'].map(o => <option key={o}>{o}</option>)}
          </Select>
          <Input label="MEIA-VIDA (dias)" type="number" value={cpHalf} onChange={e => setCpHalf(+e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="DOSE PADRÃO (mg)" type="number" value={cpDose} onChange={e => setCpDose(+e.target.value)} />
          <Select label="FREQUÊNCIA" value={cpFreq} onChange={e => setCpFreq(e.target.value)}>
            {['Semanal','2x/semana','Diária','EOD','Quinzenal'].map(o => <option key={o}>{o}</option>)}
          </Select>
        </div>
        <Select label="VIA" value={cpRoute} onChange={e => setCpRoute(e.target.value)}>
          {['Intramuscular','Subcutânea','Oral','Transdérmica'].map(o => <option key={o}>{o}</option>)}
        </Select>
        <Btn onClick={saveCompound} style={{ marginTop: '8px' }}>SALVAR</Btn>
      </Sheet>

      <Sheet title="REGISTRAR APLICAÇÃO" open={showApp} onClose={() => setShowApp(false)} id="app">
        <Select label="COMPOSTO" value={appCompId} onChange={e => setAppCompId(e.target.value)}>
          {(db.cycles.find(c => c.id === appCycleId)?.compounds || []).map(cc => {
            const cp = db.compounds.find(c => c.id === cc.compoundId)
            return cp ? <option key={cp.id} value={cp.id}>{cp.name}</option> : null
          })}
        </Select>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input label="DOSE (mg)" type="number" value={appDose} onChange={e => setAppDose(+e.target.value)} />
          <Input label="DATA" type="date" value={appDate} onChange={e => setAppDate(e.target.value)} />
        </div>
        <Select label="MÚSCULO" value={appMuscle} onChange={e => setAppMuscle(e.target.value)}>
          {['Glúteo D','Glúteo E','Deltoide D','Deltoide E','Vasto D','Vasto E','Oral'].map(o => <option key={o}>{o}</option>)}
        </Select>
        <Input label="OBSERVAÇÃO" value={appNotes} onChange={e => setAppNotes(e.target.value)} placeholder="Sem intercorrências..." />
        <Btn onClick={saveApp} style={{ marginTop: '8px' }}>REGISTRAR</Btn>
      </Sheet>
    </div>
  )
}
