import { DB, Compound, Food } from './types'

const DB_KEY = 'animus_v3'

const DEFAULT_COMPOUNDS: Compound[] = [
  { id: 'c1', name: 'Testosterona Enantato', category: 'Testosterona', halfLifeDays: 8, defaultDose: 250, frequency: 'Semanal', route: 'Intramuscular', color: '#b8ff00' },
  { id: 'c2', name: 'Testosterona Cipionato', category: 'Testosterona', halfLifeDays: 9, defaultDose: 200, frequency: 'Semanal', route: 'Intramuscular', color: '#aadd00' },
  { id: 'c3', name: 'Testosterona Propionato', category: 'Testosterona', halfLifeDays: 3, defaultDose: 100, frequency: 'EOD', route: 'Intramuscular', color: '#ffdd00' },
  { id: 'c4', name: 'Decanoato de Nandrolona', category: 'Nandrolona', halfLifeDays: 14, defaultDose: 300, frequency: 'Semanal', route: 'Intramuscular', color: '#00e5ff' },
  { id: 'c5', name: 'Trembolona Acetato', category: 'Trembolona', halfLifeDays: 3, defaultDose: 100, frequency: 'EOD', route: 'Intramuscular', color: '#ff3366' },
  { id: 'c6', name: 'Trembolona Enantato', category: 'Trembolona', halfLifeDays: 7, defaultDose: 200, frequency: 'Semanal', route: 'Intramuscular', color: '#ff0044' },
  { id: 'c7', name: 'Stanozolol (Winstrol)', category: 'Estanozolol', halfLifeDays: 1, defaultDose: 50, frequency: 'Diária', route: 'Oral', color: '#ff7700' },
  { id: 'c8', name: 'Oxandrolona (Anavar)', category: 'Oxandrolona', halfLifeDays: 0.8, defaultDose: 40, frequency: 'Diária', route: 'Oral', color: '#9d4edd' },
  { id: 'c9', name: 'Boldenona (EQ)', category: 'Boldenona', halfLifeDays: 14, defaultDose: 300, frequency: 'Semanal', route: 'Intramuscular', color: '#00aaff' },
  { id: 'c10', name: 'Masteron Enantato', category: 'Outro', halfLifeDays: 8, defaultDose: 200, frequency: 'Semanal', route: 'Intramuscular', color: '#00ffaa' },
  { id: 'c11', name: 'Clomid', category: 'TPC', halfLifeDays: 5, defaultDose: 50, frequency: 'Diária', route: 'Oral', color: '#ffd700' },
  { id: 'c12', name: 'Tamoxifeno', category: 'TPC', halfLifeDays: 7, defaultDose: 20, frequency: 'Diária', route: 'Oral', color: '#ff9900' },
]

const DEFAULT_FOODS: Food[] = [
  { id: 'f1', name: 'Frango grelhado', kcal: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Proteína' },
  { id: 'f2', name: 'Carne moída 90%', kcal: 218, protein: 24, carbs: 0, fat: 13, category: 'Proteína' },
  { id: 'f3', name: 'Atum em lata', kcal: 132, protein: 28, carbs: 0, fat: 1.5, category: 'Proteína' },
  { id: 'f4', name: 'Ovo inteiro', kcal: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Proteína' },
  { id: 'f5', name: 'Clara de ovo', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, category: 'Proteína' },
  { id: 'f6', name: 'Whey Protein', kcal: 380, protein: 80, carbs: 5, fat: 5, category: 'Suplemento' },
  { id: 'f7', name: 'Arroz branco cozido', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Carboidrato' },
  { id: 'f8', name: 'Batata doce cozida', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'Carboidrato' },
  { id: 'f9', name: 'Aveia em flocos', kcal: 389, protein: 17, carbs: 66, fat: 7, category: 'Carboidrato' },
  { id: 'f10', name: 'Banana', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'Fruta' },
  { id: 'f11', name: 'Brócolis cozido', kcal: 35, protein: 2.4, carbs: 7, fat: 0.4, category: 'Vegetal' },
  { id: 'f12', name: 'Azeite de oliva', kcal: 884, protein: 0, carbs: 0, fat: 100, category: 'Gordura' },
  { id: 'f13', name: 'Queijo cottage', kcal: 98, protein: 11, carbs: 3.4, fat: 4.3, category: 'Laticínio' },
  { id: 'f14', name: 'Iogurte grego 0%', kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, category: 'Laticínio' },
  { id: 'f15', name: 'Amendoim', kcal: 567, protein: 26, carbs: 16, fat: 49, category: 'Gordura' },
]

const DEFAULT_DB: DB = {
  compounds: DEFAULT_COMPOUNDS,
  cycles: [],
  applications: [],
  weightEntries: [],
  weightGoal: null,
  foods: DEFAULT_FOODS,
  meals: [],
  workouts: [],
  workoutPlans: [],
  dietPlans: [],
}

export function loadDB(): DB {
  if (typeof window === 'undefined') return DEFAULT_DB
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return { ...DEFAULT_DB }
    return JSON.parse(raw) as DB
  } catch {
    return { ...DEFAULT_DB }
  }
}

export function saveDB(db: DB): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function fmtDate(s: string): string {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function fmtShort(s: string): string {
  if (!s) return ''
  const [, m, d] = s.split('-')
  return `${d}/${m}`
}

export function getWeekStr(d: Date): string {
  const s = new Date(d)
  s.setDate(s.getDate() - s.getDay())
  return s.toISOString().split('T')[0].slice(5)
}
