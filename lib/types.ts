export interface Compound {
  id: string
  name: string
  category: string
  halfLifeDays: number
  defaultDose: number
  frequency: string
  route: string
  color: string
  notes?: string
}

export interface CycleCompound {
  compoundId: string
  dosePerApp: number
}

export interface Cycle {
  id: string
  name: string
  startDate: string
  endDate?: string
  objective: 'Cutting' | 'Bulking' | 'Recomp' | 'TPC' | 'Outro'
  compounds: CycleCompound[]
  active: boolean
  endedAt?: string
}

export interface Application {
  id: string
  cycleId: string
  compoundId: string
  dose: number
  date: string
  muscle: string
  notes?: string
}

export interface WeightEntry {
  id: string
  weight: number
  date: string
}

export interface Food {
  id: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  category: string
}

export interface MealEntry {
  id: string
  foodId?: string
  foodName: string
  quantity: number
  meal: string
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  aiResolved?: boolean
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: number
  weight: number
}

export interface Workout {
  id: string
  type: string
  date: string
  duration: number
  notes?: string
  exercises: WorkoutExercise[]
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
}

export interface DietPlan {
  id: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  notes?: string
}

export interface DB {
  compounds: Compound[]
  cycles: Cycle[]
  applications: Application[]
  weightEntries: WeightEntry[]
  weightGoal: number | null
  foods: Food[]
  meals: MealEntry[]
  workouts: Workout[]
  workoutPlans: WorkoutPlan[]
  dietPlans: DietPlan[]
}
