import { Application, Compound } from './types'

export interface BloodLevelPoint {
  date: string
  timestamp: number
  levels: Record<string, number> // compoundId -> mg still active
  total: number
}

/**
 * Calculates compound blood level over time using exponential decay.
 * Level(t) = dose * 0.5^(t / halfLife)
 * Each application contributes its own decaying curve; we sum all active ones.
 */
export function computeBloodLevels(
  applications: Application[],
  compounds: Compound[],
  daysAfterLast = 21 // how many days after last app to project
): BloodLevelPoint[] {
  if (!applications.length) return []

  const compoundMap = Object.fromEntries(compounds.map(c => [c.id, c]))

  // Determine time range
  const dates = applications.map(a => new Date(a.date + 'T12:00:00').getTime())
  const startMs = Math.min(...dates)
  const endMs = Math.max(...dates) + daysAfterLast * 86400000

  // Generate one point per day
  const points: BloodLevelPoint[] = []
  const totalDays = Math.ceil((endMs - startMs) / 86400000)

  for (let day = 0; day <= totalDays; day++) {
    const pointMs = startMs + day * 86400000
    const pointDate = new Date(pointMs).toISOString().split('T')[0]
    const levels: Record<string, number> = {}
    let total = 0

    for (const app of applications) {
      const compound = compoundMap[app.compoundId]
      if (!compound) continue

      const appMs = new Date(app.date + 'T12:00:00').getTime()
      const daysSince = (pointMs - appMs) / 86400000

      if (daysSince < 0) continue // future application

      // Exponential decay: remaining = dose * e^(-ln2 * days / halfLife)
      const remaining = app.dose * Math.pow(0.5, daysSince / compound.halfLifeDays)

      // Only count if above 1% of original dose (threshold)
      if (remaining > app.dose * 0.01) {
        levels[app.compoundId] = (levels[app.compoundId] || 0) + remaining
        total += remaining
      }
    }

    points.push({ date: pointDate, timestamp: pointMs, levels, total })
  }

  return points
}

/**
 * Gets the compound IDs present in applications
 */
export function getActiveCompoundIds(applications: Application[]): string[] {
  return [...new Set(applications.map(a => a.compoundId))]
}

/**
 * Peak blood level for a compound given regular dosing schedule
 */
export function estimateSteadyState(
  dosePerApp: number,
  halfLifeDays: number,
  frequencyDays: number
): number {
  // At steady state: C_ss = dose / (1 - 0.5^(interval/halfLife))
  const accumFactor = 1 / (1 - Math.pow(0.5, frequencyDays / halfLifeDays))
  return dosePerApp * accumFactor
}
