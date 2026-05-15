// Shared chart options — typed loosely to avoid Chart.js strict type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOLTIP: any = {
  backgroundColor: 'rgba(8,8,15,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  titleColor: '#b8ff00',
  bodyColor: '#e8e8f0',
  padding: 10,
  titleFont: { family: 'Orbitron, sans-serif', size: 11 },
  bodyFont: { family: 'Rajdhani, sans-serif', size: 13 },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BASE_OPTS: any = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: 'easeInOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: TOOLTIP,
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani, sans-serif' } },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#444466', font: { size: 10, family: 'Rajdhani, sans-serif' } },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
  },
}
