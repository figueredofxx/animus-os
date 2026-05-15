'use client'

import { useEffect, useRef, useState } from 'react'
import { DB } from '@/lib/types'
import { uid, today, fmtShort } from '@/lib/db'
import { Card, Btn, Input, Select, Sheet, MacroRing, ProgressBar, Empty } from '@/components/ui'
import Chart from 'chart.js/auto'

interface Props { db: DB; updateDB: (fn: (d: DB) => DB) => void }
interface AiResult { name: string; quantity: number; unit: string; kcal: number; protein: number; carbs: number; fat: number; items?: string[]; confidence: 'high'|'medium'|'low'; notes?: string }

const Ic = {
  camera: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  spark:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>,
  plus:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  check:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  drop:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  food:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  spin:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
}

const MEALS = ['Café da manhã','Pré-treino','Almoço','Lanche','Jantar','Ceia']
const CONF: Record<string,{bg:string;color:string;label:string}> = {
  high:   {bg:'rgba(184,255,0,0.1)',  color:'#b8ff00',label:'PRECISO'},
  medium: {bg:'rgba(255,215,0,0.1)',  color:'#ffd700',label:'ESTIMADO'},
  low:    {bg:'rgba(255,119,0,0.1)',  color:'#ff7700',label:'APROXIMADO'},
}

const inp: React.CSSProperties = { width:'100%', background:'#111122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', color:'#e8e8f0', fontFamily:'DM Sans,sans-serif', fontSize:'14px', padding:'10px 12px', outline:'none' }
const lbl: React.CSSProperties = { fontSize:'10px', color:'#444466', fontFamily:'Rajdhani,sans-serif', fontWeight:600, letterSpacing:'2px', display:'block', marginBottom:'5px' }
const pill = (a:boolean): React.CSSProperties => ({ padding:'6px 12px', borderRadius:'16px', border:`1px solid ${a?'rgba(184,255,0,0.3)':'rgba(255,255,255,0.07)'}`, background:a?'rgba(184,255,0,0.12)':'transparent', color:a?'#b8ff00':'#444466', fontSize:'11px', fontFamily:'Rajdhani,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', whiteSpace:'nowrap' as const })
const ibtn = (c?:string): React.CSSProperties => ({ display:'flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', background:c?`${c}15`:'rgba(255,255,255,0.05)', border:`1px solid ${c?c+'28':'rgba(255,255,255,0.07)'}`, color:c||'#666688', cursor:'pointer', flexShrink:0 })

export default function Diet({ db, updateDB }: Props) {
  const [tab, setTab]   = useState('HOJE')
  const [showAdd, setShowAdd] = useState(false)
  const [showFood, setShowFood] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [aiMode, setAiMode]   = useState<'text'|'camera'|'manual'>('text')
  const [aiText, setAiText]   = useState('')
  const [aiImg, setAiImg]     = useState<File|null>(null)
  const [aiPrev, setAiPrev]   = useState('')
  const [aiLoad, setAiLoad]   = useState(false)
  const [aiRes, setAiRes]     = useState<AiResult|null>(null)
  const [aiErr, setAiErr]     = useState('')
  const [meal, setMeal]       = useState('Almoço')
  const [agua, setAgua]       = useState('')
  const [selFood, setSelFood] = useState('')
  const [foodQtd, setFoodQtd] = useState('150')
  const [foodSrch, setFoodSrch] = useState('')
  const [fName,setFName]=useState(''); const [fKcal,setFKcal]=useState(''); const [fProt,setFProt]=useState('')
  const [fCarb,setFCarb]=useState(''); const [fFat,setFFat]=useState('');   const [fCat,setFCat]=useState('Proteína')
  const [pNome,setPNome]=useState(''); const [pKcal,setPKcal]=useState(''); const [pProt,setPProt]=useState('')
  const [pCarb,setPCarb]=useState(''); const [pFat,setPFat]=useState('');   const [pNota,setPNota]=useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const kcalRef = useRef<HTMLCanvasElement>(null)
  const protRef = useRef<HTMLCanvasElement>(null)
  const kcalCh  = useRef<Chart|null>(null)
  const protCh  = useRef<Chart|null>(null)

  const todayStr  = today()
  const refsHoje  = db.meals.filter(r => r.date===todayStr && !(r as any).tipo)
  const aguaHoje  = (db.meals.find(r => r.date===todayStr && (r as any).tipo==='agua') as any)?.agua || 0
  const tot       = refsHoje.reduce((s,r)=>({kcal:s.kcal+r.kcal,prot:s.prot+r.protein,carb:s.carb+r.carbs,fat:s.fat+r.fat}),{kcal:0,prot:0,carb:0,fat:0})
  const foods     = db.foods.filter(f=>f.name.toLowerCase().includes(foodSrch.toLowerCase()))
  const selF      = db.foods.find(f=>f.id===selFood)
  const prev      = selF && foodQtd ? { kcal:Math.round(selF.kcal*(+foodQtd/100)), prot:(selF.protein*(+foodQtd/100)).toFixed(1), carb:(selF.carbs*(+foodQtd/100)).toFixed(1), fat:(selF.fat*(+foodQtd/100)).toFixed(1) } : null
  const groups    = MEALS.map(m=>({name:m,items:refsHoje.filter(r=>r.meal===m)})).filter(g=>g.items.length>0)

  const resetAdd  = () => { setAiRes(null); setAiErr(''); setAiText(''); setAiImg(null); setAiPrev('') }

  const analyze = async () => {
    setAiLoad(true); setAiErr(''); setAiRes(null)
    try {
      let res: Response
      if (aiMode==='camera' && aiImg) {
        const fd = new FormData(); fd.append('image',aiImg); fd.append('meal',meal)
        res = await fetch('/api/analyze-food',{method:'POST',body:fd})
      } else {
        if (!aiText.trim()) { setAiLoad(false); return }
        res = await fetch('/api/analyze-food',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:aiText})})
      }
      if (!res.ok) throw new Error()
      setAiRes(await res.json())
    } catch { setAiErr('Falha ao analisar. Verifique GEMINI_API_KEY nas configurações.') }
    finally { setAiLoad(false) }
  }

  const confirmAi = () => {
    if (!aiRes) return
    updateDB(d=>({...d,meals:[...d.meals,{id:uid(),foodName:aiRes.name,quantity:aiRes.quantity,meal,date:todayStr,kcal:aiRes.kcal,protein:aiRes.protein,carbs:aiRes.carbs,fat:aiRes.fat,aiResolved:true}]}))
    resetAdd(); setShowAdd(false)
  }

  const saveManual = () => {
    if (!selF||!foodQtd) return
    const f=+foodQtd/100
    updateDB(d=>({...d,meals:[...d.meals,{id:uid(),foodId:selF.id,foodName:selF.name,quantity:+foodQtd,meal,date:todayStr,kcal:+(selF.kcal*f).toFixed(1),protein:+(selF.protein*f).toFixed(1),carbs:+(selF.carbs*f).toFixed(1),fat:+(selF.fat*f).toFixed(1)}]}))
    setFoodQtd('150'); setSelFood(''); setShowAdd(false)
  }

  const saveAgua = () => {
    if (!agua) return
    updateDB(d=>{ const ms=d.meals.filter(m=>!(m.date===todayStr&&(m as any).tipo==='agua')); return {...d,meals:[...ms,{id:uid(),tipo:'agua',agua:+agua,date:todayStr,foodName:'Água',quantity:+agua,meal:'',kcal:0,protein:0,carbs:0,fat:0} as any]} })
    setAgua('')
  }

  const saveFood = () => {
    if (!fName) return alert('Nome obrigatório')
    updateDB(d=>({...d,foods:[...d.foods,{id:uid(),name:fName,kcal:+fKcal||0,protein:+fProt||0,carbs:+fCarb||0,fat:+fFat||0,category:fCat}]}))
    setFName('');setFKcal('');setFProt('');setFCarb('');setFFat(''); setShowFood(false)
  }

  const savePlan = () => {
    if (!pNome) return alert('Nome obrigatório')
    updateDB(d=>({...d,dietPlans:[...d.dietPlans,{id:uid(),name:pNome,kcal:+pKcal||0,protein:+pProt||0,carbs:+pCarb||0,fat:+pFat||0,notes:pNota}]}))
    setPNome('');setPKcal('');setPProt('');setPCarb('');setPFat('');setPNota(''); setShowPlan(false)
  }

  useEffect(()=>{
    if (tab!=='SEMANA') return
    const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().split('T')[0]})
    const kcals=days.map(d=>Math.round(db.meals.filter(r=>r.date===d&&!(r as any).tipo).reduce((s,r)=>s+r.kcal,0)))
    const prots=days.map(d=>Math.round(db.meals.filter(r=>r.date===d&&!(r as any).tipo).reduce((s,r)=>s+r.protein,0)))
    const labels=days.map(d=>{ const[,m,dy]=d.split('-'); return `${dy}/${m}` })
    const sc:any={x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#444466',font:{size:10,family:'Rajdhani,sans-serif'}},border:{color:'rgba(255,255,255,0.06)'}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#444466',font:{size:10,family:'Rajdhani,sans-serif'}},border:{color:'rgba(255,255,255,0.06)'}}}
    if (kcalRef.current){if(kcalCh.current)kcalCh.current.destroy();const ctx=kcalRef.current.getContext('2d')!;const g=ctx.createLinearGradient(0,0,0,170);g.addColorStop(0,'rgba(255,215,0,0.35)');g.addColorStop(1,'rgba(255,215,0,0)');kcalCh.current=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data:kcals,backgroundColor:g,borderColor:'#ffd700',borderWidth:1.5,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:700},plugins:{legend:{display:false}},scales:sc} as any})}
    if (protRef.current){if(protCh.current)protCh.current.destroy();const ctx=protRef.current.getContext('2d')!;const g=ctx.createLinearGradient(0,0,0,150);g.addColorStop(0,'rgba(0,229,255,0.35)');g.addColorStop(1,'rgba(0,229,255,0)');protCh.current=new Chart(ctx,{type:'line',data:{labels,datasets:[{data:prots,borderColor:'#00e5ff',backgroundColor:g,borderWidth:2,pointRadius:4,pointBackgroundColor:'#00e5ff',pointBorderColor:'#05050a',pointBorderWidth:2,tension:0.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:700},plugins:{legend:{display:false}},scales:{...sc,y:{...sc.y,ticks:{...sc.y.ticks,callback:(v:any)=>`${v}g`}}}} as any})}
  },[tab,db.meals])

  return (
    <div style={{padding:'14px 14px 20px'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* TABS */}
      <div style={{display:'flex',gap:'5px',marginBottom:'14px',overflowX:'auto',paddingBottom:'2px'}}>
        {['HOJE','SEMANA','ALIMENTOS','PLANOS'].map(t=><button key={t} onClick={()=>setTab(t)} style={pill(tab===t)}>{t}</button>)}
      </div>

      {/* ── HOJE ── */}
      {tab==='HOJE' && <>
        <Card glow="#ff7700" style={{marginBottom:'8px'}}>
          <div style={{fontSize:'10px',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',marginBottom:'10px'}}>MACROS DE HOJE</div>
          <div style={{display:'flex',justifyContent:'space-around',marginBottom:'10px'}}>
            <MacroRing label="KCAL" value={Math.round(tot.kcal)} max={2500} color="#ffd700"/>
            <MacroRing label="PROT" value={Math.round(tot.prot)} max={200}  color="#00e5ff"/>
            <MacroRing label="CARBO" value={Math.round(tot.carb)} max={300} color="#ff3366"/>
            <MacroRing label="GORD" value={Math.round(tot.fat)}  max={80}   color="#ff7700"/>
          </div>
          <div style={{display:'flex',gap:'5px'}}>
            {[{l:'Calorias',v:`${Math.round(tot.kcal)} kcal`,c:'#ffd700'},{l:'Proteína',v:`${Math.round(tot.prot)}g`,c:'#00e5ff'},{l:'Carbo',v:`${Math.round(tot.carb)}g`,c:'#ff3366'}].map(m=>(
              <div key={m.l} style={{flex:1,background:`${m.c}10`,borderRadius:'8px',padding:'7px',textAlign:'center'}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'12px',fontWeight:700,color:m.c}}>{m.v}</div>
                <div style={{fontSize:'9px',color:'#444466',fontFamily:'Rajdhani,sans-serif',letterSpacing:'1px',marginTop:'2px'}}>{m.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ÁGUA */}
        <Card style={{padding:'11px 14px',marginBottom:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'7px'}}>
            <div style={{color:'#00e5ff',display:'flex'}}>{Ic.drop}</div>
            <div style={{fontSize:'10px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',color:'#444466',flex:1}}>HIDRATAÇÃO</div>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'13px',fontWeight:700,color:'#00e5ff'}}>{aguaHoje}<span style={{fontSize:'10px',color:'#444466'}}>ml</span></div>
          </div>
          <ProgressBar value={aguaHoje} max={2500} color="#00e5ff" height={5}/>
          <div style={{display:'flex',gap:'6px',marginTop:'9px',alignItems:'center'}}>
            <input type="number" placeholder="ml de água hoje" value={agua} onChange={e=>setAgua(e.target.value)} style={{...inp,flex:1,fontSize:'13px',padding:'8px 10px'}}/>
            <button onClick={saveAgua} style={{...ibtn('#00e5ff'),width:'38px',height:'38px',borderRadius:'9px'}}>{Ic.check}</button>
          </div>
        </Card>

        {/* ADD BTN */}
        <button onClick={()=>{setShowAdd(true);resetAdd()}} style={{width:'100%',padding:'13px',borderRadius:'12px',background:'rgba(184,255,0,0.08)',border:'1px solid rgba(184,255,0,0.2)',color:'#b8ff00',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'13px',letterSpacing:'2px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',marginBottom:'14px'}}>
          {Ic.plus} ADICIONAR REFEIÇÃO
        </button>

        {/* MEAL GROUPS */}
        {groups.length>0 ? groups.map(g=>(
          <div key={g.name} style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'8px'}}>
              {g.name.toUpperCase()}
              <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.05)'}}/>
              <span style={{color:'#555577'}}>{Math.round(g.items.reduce((s,r)=>s+r.kcal,0))} kcal</span>
            </div>
            {g.items.map(r=>(
              <div key={r.id} style={{background:'#0c0c18',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'10px 12px',marginBottom:'5px',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',gap:'5px'}}>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.foodName}</span>
                    {r.aiResolved && <span style={{display:'inline-flex',alignItems:'center',gap:'2px',padding:'1px 5px',borderRadius:'3px',fontSize:'8px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'1px',background:'rgba(184,255,0,0.1)',color:'#b8ff00',flexShrink:0}}>{Ic.spark}IA</span>}
                  </div>
                  <div style={{fontSize:'11px',color:'#444466',fontFamily:'Rajdhani,sans-serif',marginTop:'2px'}}>{r.quantity}g · P:{r.protein.toFixed(0)} C:{r.carbs.toFixed(0)} G:{r.fat.toFixed(0)}</div>
                </div>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'14px',fontWeight:700,color:'#ff7700',flexShrink:0}}>{Math.round(r.kcal)}<span style={{fontSize:'9px',color:'#444466'}}>kcal</span></div>
                <button onClick={()=>updateDB(d=>({...d,meals:d.meals.filter(m=>m.id!==r.id)}))} style={ibtn('#ff3366')}>{Ic.trash}</button>
              </div>
            ))}
          </div>
        )) : <Empty text="NENHUMA REFEIÇÃO REGISTRADA HOJE"/>}
      </>}

      {/* ── SEMANA ── */}
      {tab==='SEMANA' && <>
        <Card glow="#ffd700"><div style={{fontSize:'10px',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',marginBottom:'10px'}}>CALORIAS — 7 DIAS</div><div style={{position:'relative',height:'170px'}}><canvas ref={kcalRef}/></div></Card>
        <Card glow="#00e5ff"><div style={{fontSize:'10px',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',marginBottom:'10px'}}>PROTEÍNA — 7 DIAS</div><div style={{position:'relative',height:'150px'}}><canvas ref={protRef}/></div></Card>
      </>}

      {/* ── ALIMENTOS ── */}
      {tab==='ALIMENTOS' && <>
        <div style={{position:'relative',marginBottom:'10px'}}>
          <div style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#444466',display:'flex'}}>{Ic.search}</div>
          <input placeholder="Buscar alimento..." value={foodSrch} onChange={e=>setFoodSrch(e.target.value)} style={{...inp,paddingLeft:'36px'}}/>
        </div>
        {foods.map(f=>(
          <div key={f.id} style={{background:'#0c0c18',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'10px 12px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:600}}>{f.name}</div>
              <div style={{fontSize:'11px',color:'#444466',fontFamily:'Rajdhani,sans-serif',marginTop:'2px'}}>{f.kcal} kcal · P:{f.protein}g C:{f.carbs}g G:{f.fat}g por 100g</div>
            </div>
            <span style={{padding:'2px 7px',borderRadius:'4px',fontSize:'9px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'1px',background:'rgba(0,229,255,0.1)',color:'#00e5ff'}}>{f.category}</span>
            <button onClick={()=>updateDB(d=>({...d,foods:d.foods.filter(x=>x.id!==f.id)}))} style={ibtn('#ff3366')}>{Ic.trash}</button>
          </div>
        ))}
        <button onClick={()=>setShowFood(true)} style={{width:'100%',marginTop:'8px',padding:'11px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'12px',letterSpacing:'2px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          {Ic.plus} CADASTRAR ALIMENTO
        </button>
      </>}

      {/* ── PLANOS ── */}
      {tab==='PLANOS' && <>
        {db.dietPlans.map(p=>(
          <Card key={p.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'15px',fontWeight:700}}>{p.name}</div>
              <button onClick={()=>updateDB(d=>({...d,dietPlans:d.dietPlans.filter(x=>x.id!==p.id)}))} style={ibtn('#ff3366')}>{Ic.trash}</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
              {[{l:'KCAL',v:p.kcal,c:'#ff7700'},{l:'PROT',v:`${p.protein}g`,c:'#00e5ff'},{l:'CARBO',v:`${p.carbs}g`,c:'#ff3366'},{l:'GORD',v:`${p.fat}g`,c:'#ffd700'}].map(m=>(
                <div key={m.l} style={{textAlign:'center',background:'#111122',borderRadius:'7px',padding:'6px 3px'}}>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'12px',fontWeight:700,color:m.c}}>{m.v}</div>
                  <div style={{fontSize:'9px',color:'#444466',fontFamily:'Rajdhani,sans-serif',letterSpacing:'1px'}}>{m.l}</div>
                </div>
              ))}
            </div>
            {p.notes&&<div style={{fontSize:'12px',color:'#444466',marginTop:'8px'}}>{p.notes}</div>}
          </Card>
        ))}
        {!db.dietPlans.length&&<Empty text="NENHUM PLANO"/>}
        <button onClick={()=>setShowPlan(true)} style={{width:'100%',marginTop:'8px',padding:'11px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'12px',letterSpacing:'2px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          {Ic.plus} CRIAR PLANO
        </button>
      </>}

      {/* ════════ SHEET: ADD MEAL ════════ */}
      <Sheet title="ADICIONAR REFEIÇÃO" open={showAdd} onClose={()=>setShowAdd(false)} id="add">
        {/* MODE TABS */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'5px',marginBottom:'14px'}}>
          {([['text','DESCREVER',Ic.spark],['camera','FOTO',Ic.camera],['manual','MANUAL',Ic.food]] as const).map(([id,label,icon])=>(
            <button key={id} onClick={()=>{setAiMode(id as any);setAiRes(null);setAiErr('')}} style={{padding:'9px 4px',borderRadius:'10px',background:aiMode===id?'rgba(184,255,0,0.1)':'#111122',border:`1px solid ${aiMode===id?'rgba(184,255,0,0.25)':'rgba(255,255,255,0.06)'}`,color:aiMode===id?'#b8ff00':'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'10px',letterSpacing:'1.5px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'5px'}}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* REFEIÇÃO PILLS */}
        <div style={{display:'flex',gap:'4px',marginBottom:'14px',overflowX:'auto',paddingBottom:'2px'}}>
          {MEALS.map(m=><button key={m} onClick={()=>setMeal(m)} style={pill(meal===m)}>{m}</button>)}
        </div>

        {/* TEXT */}
        {aiMode==='text' && <>
          <label style={lbl}>DESCREVA A REFEIÇÃO</label>
          <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={3} placeholder="Ex: 200g frango grelhado com 150g batata doce e brócolis..." style={{...inp,resize:'none',marginBottom:'10px'}}/>
        </>}

        {/* CAMERA */}
        {aiMode==='camera' && <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];if(!f)return;setAiImg(f);setAiPrev(URL.createObjectURL(f));setAiRes(null);setAiErr('')}} style={{display:'none'}}/>
          <label style={lbl}>FOTO DA REFEIÇÃO</label>
          {aiPrev ? (
            <div style={{position:'relative',marginBottom:'10px'}}>
              <img src={aiPrev} alt="prev" style={{width:'100%',borderRadius:'10px',maxHeight:'180px',objectFit:'cover'}}/>
              <button onClick={()=>{setAiImg(null);setAiPrev('');setAiRes(null)}} style={{position:'absolute',top:'8px',right:'8px',...ibtn('#ff3366'),background:'rgba(8,8,15,0.85)'}}>
                {Ic.close}
              </button>
            </div>
          ) : (
            <button onClick={()=>fileRef.current?.click()} style={{width:'100%',padding:'28px',borderRadius:'10px',background:'#111122',border:'2px dashed rgba(255,255,255,0.08)',color:'#444466',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',fontFamily:'Rajdhani,sans-serif',fontSize:'12px',fontWeight:600,letterSpacing:'1px',marginBottom:'10px'}}>
              {Ic.camera} TIRAR FOTO / GALERIA
            </button>
          )}
        </>}

        {/* AI ERROR */}
        {aiErr && <div style={{background:'rgba(255,51,102,0.07)',border:'1px solid rgba(255,51,102,0.18)',borderRadius:'8px',padding:'10px 12px',fontSize:'12px',color:'#ff3366',marginBottom:'10px',fontFamily:'Rajdhani,sans-serif'}}>{aiErr}</div>}

        {/* AI RESULT */}
        {aiRes && (aiMode==='text'||aiMode==='camera') && (
          <div style={{background:'#111122',border:'1px solid rgba(184,255,0,0.15)',borderRadius:'12px',padding:'14px',marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'14px',fontWeight:700,flex:1,paddingRight:'8px',lineHeight:1.3}}>{aiRes.name}</div>
              <div style={{padding:'3px 7px',borderRadius:'4px',fontSize:'9px',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'1px',flexShrink:0,background:CONF[aiRes.confidence]?.bg,color:CONF[aiRes.confidence]?.color}}>{CONF[aiRes.confidence]?.label}</div>
            </div>
            {aiRes.items && aiRes.items.length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'3px',marginBottom:'10px'}}>
                {aiRes.items.map((item,i)=><span key={i} style={{padding:'2px 7px',borderRadius:'4px',fontSize:'10px',fontFamily:'Rajdhani,sans-serif',background:'rgba(255,255,255,0.05)',color:'#555577'}}>{item}</span>)}
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px',marginBottom:'10px'}}>
              {[{l:'KCAL',v:Math.round(aiRes.kcal),c:'#ffd700'},{l:'PROT',v:`${aiRes.protein.toFixed(1)}g`,c:'#00e5ff'},{l:'CARBO',v:`${aiRes.carbs.toFixed(1)}g`,c:'#ff3366'},{l:'GORD',v:`${aiRes.fat.toFixed(1)}g`,c:'#ff7700'}].map(m=>(
                <div key={m.l} style={{textAlign:'center',background:'#0c0c18',borderRadius:'8px',padding:'7px 4px'}}>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'12px',fontWeight:700,color:m.c}}>{m.v}</div>
                  <div style={{fontSize:'9px',color:'#444466',fontFamily:'Rajdhani,sans-serif',letterSpacing:'1px'}}>{m.l}</div>
                </div>
              ))}
            </div>
            {aiRes.notes && <div style={{fontSize:'11px',color:'#444466',fontFamily:'Rajdhani,sans-serif',marginBottom:'10px'}}>{aiRes.notes}</div>}
            <button onClick={confirmAi} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'#b8ff00',color:'#000',border:'none',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'14px',letterSpacing:'2px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
              {Ic.check} CONFIRMAR E LANÇAR
            </button>
          </div>
        )}

        {/* ANALYZE BTN */}
        {(aiMode==='text'||aiMode==='camera') && !aiRes && (
          <button onClick={analyze} disabled={aiLoad||(aiMode==='text'?!aiText.trim():!aiImg)} style={{width:'100%',padding:'13px',borderRadius:'10px',background:aiLoad?'#111122':'rgba(184,255,0,0.1)',border:`1px solid ${aiLoad?'rgba(255,255,255,0.06)':'rgba(184,255,0,0.22)'}`,color:aiLoad?'#444466':'#b8ff00',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'13px',letterSpacing:'2px',cursor:aiLoad?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px'}}>
            {aiLoad ? <>{Ic.spin} ANALISANDO...</> : <>{Ic.spark} ANALISAR COM IA</>}
          </button>
        )}

        {/* MANUAL */}
        {aiMode==='manual' && <>
          <label style={lbl}>BUSCAR ALIMENTO</label>
          <div style={{position:'relative',marginBottom:'8px'}}>
            <div style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#444466',display:'flex'}}>{Ic.search}</div>
            <input placeholder="Digite para buscar..." value={foodSrch} onChange={e=>setFoodSrch(e.target.value)} style={{...inp,paddingLeft:'36px'}}/>
          </div>
          <div style={{maxHeight:'180px',overflowY:'auto',marginBottom:'10px',display:'flex',flexDirection:'column',gap:'3px'}}>
            {db.foods.filter(f=>f.name.toLowerCase().includes(foodSrch.toLowerCase())).slice(0,20).map(f=>(
              <button key={f.id} onClick={()=>setSelFood(f.id)} style={{padding:'9px 12px',borderRadius:'8px',border:'none',cursor:'pointer',textAlign:'left',background:selFood===f.id?'rgba(184,255,0,0.08)':'#111122',borderLeft:`3px solid ${selFood===f.id?'#b8ff00':'transparent'}`,transition:'all 0.15s'}}>
                <div style={{fontSize:'13px',color:selFood===f.id?'#b8ff00':'#e8e8f0',fontWeight:600}}>{f.name}</div>
                <div style={{fontSize:'11px',color:'#444466',fontFamily:'Rajdhani,sans-serif',marginTop:'1px'}}>{f.kcal} kcal · P:{f.protein}g por 100g</div>
              </button>
            ))}
          </div>
          {selF && <>
            <Input label="QUANTIDADE (g/ml)" type="number" value={foodQtd} onChange={e=>setFoodQtd(e.target.value)}/>
            {prev && (
              <div style={{background:'#111122',border:'1px solid rgba(0,229,255,0.12)',borderRadius:'10px',padding:'10px',marginBottom:'10px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
                {[{l:'KCAL',v:prev.kcal,c:'#ffd700'},{l:'PROT',v:`${prev.prot}g`,c:'#00e5ff'},{l:'CARBO',v:`${prev.carb}g`,c:'#ff3366'},{l:'GORD',v:`${prev.fat}g`,c:'#ff7700'}].map(m=>(
                  <div key={m.l} style={{textAlign:'center'}}>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'12px',fontWeight:700,color:m.c}}>{m.v}</div>
                    <div style={{fontSize:'9px',color:'#444466',fontFamily:'Rajdhani,sans-serif'}}>{m.l}</div>
                  </div>
                ))}
              </div>
            )}
            <Btn onClick={saveManual}>LANÇAR</Btn>
          </>}
        </>}
      </Sheet>

      {/* SHEET: NEW FOOD */}
      <Sheet title="CADASTRAR ALIMENTO" open={showFood} onClose={()=>setShowFood(false)} id="food">
        <Input label="NOME" value={fName} onChange={e=>setFName(e.target.value)} placeholder="Ex: Frango grelhado"/>
        <div style={{fontSize:'10px',color:'#444466',fontFamily:'Rajdhani,sans-serif',fontWeight:700,letterSpacing:'2px',marginBottom:'8px',marginTop:'4px'}}>MACROS POR 100g</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          <Input label="CALORIAS" type="number" value={fKcal} onChange={e=>setFKcal(e.target.value)} placeholder="165"/>
          <Input label="PROTEÍNA (g)" type="number" value={fProt} onChange={e=>setFProt(e.target.value)} placeholder="31"/>
          <Input label="CARBO (g)" type="number" value={fCarb} onChange={e=>setFCarb(e.target.value)} placeholder="0"/>
          <Input label="GORDURA (g)" type="number" value={fFat} onChange={e=>setFFat(e.target.value)} placeholder="3.6"/>
        </div>
        <Select label="CATEGORIA" value={fCat} onChange={e=>setFCat(e.target.value)}>
          {['Proteína','Carboidrato','Gordura','Vegetal','Fruta','Laticínio','Suplemento','Outro'].map(o=><option key={o}>{o}</option>)}
        </Select>
        <Btn onClick={saveFood} style={{marginTop:'4px'}}>SALVAR</Btn>
      </Sheet>

      {/* SHEET: PLAN */}
      <Sheet title="PLANO ALIMENTAR" open={showPlan} onClose={()=>setShowPlan(false)} id="plan">
        <Input label="NOME" value={pNome} onChange={e=>setPNome(e.target.value)} placeholder="Ex: Cutting 2500 kcal"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          <Input label="KCAL" type="number" value={pKcal} onChange={e=>setPKcal(e.target.value)} placeholder="2500"/>
          <Input label="PROTEÍNA (g)" type="number" value={pProt} onChange={e=>setPProt(e.target.value)} placeholder="200"/>
          <Input label="CARBO (g)" type="number" value={pCarb} onChange={e=>setPCarb(e.target.value)} placeholder="250"/>
          <Input label="GORDURA (g)" type="number" value={pFat} onChange={e=>setPFat(e.target.value)} placeholder="70"/>
        </div>
        <div style={{marginBottom:'10px'}}>
          <label style={lbl}>NOTAS</label>
          <textarea value={pNota} onChange={e=>setPNota(e.target.value)} rows={2} style={{...inp,resize:'none'}}/>
        </div>
        <Btn onClick={savePlan}>SALVAR</Btn>
      </Sheet>
    </div>
  )
}
