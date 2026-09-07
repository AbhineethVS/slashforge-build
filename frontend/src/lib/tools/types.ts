export const TOOL_DOMAINS = [
  'computer-science',
  'mathematics',
  'physics',
  'electrical',
  'electronics',
  'mechanical',
  'civil',
  'aerospace',
  'chemistry',
  'biology',
  'medicine',
  'earth-science',
  'astronomy',
  'geography',
  'architecture',
  'general-stem',
] as const

export type ToolDomain = (typeof TOOL_DOMAINS)[number]

export const LEARNING_MODES = [
  'visualize',
  'simulate',
  'explore-3d',
  'build',
  'experiment',
  'run-code',
  'calculate',
  'practice',
  'design',
] as const

export type LearningMode = (typeof LEARNING_MODES)[number]

export type LearningTool = {
  id: string
  name: string
  url: string
  description: string
  keywords: string[]
  domains: ToolDomain[]
  learningModes: LearningMode[]
  featured: boolean
  popular: boolean
  recommendation?: string
}

export const SUBJECTS: { id: ToolDomain; label: string }[] = [
  { id: 'computer-science', label: 'Computer Science' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'civil', label: 'Civil' },
  { id: 'aerospace', label: 'Aerospace' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'medicine', label: 'Medicine / Anatomy' },
  { id: 'earth-science', label: 'Earth Science' },
  { id: 'astronomy', label: 'Astronomy' },
  { id: 'geography', label: 'Geography' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'general-stem', label: 'General STEM' },
]

export const ACTIVITIES: { id: LearningMode; label: string }[] = [
  { id: 'visualize', label: 'Visualize' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'explore-3d', label: 'Explore in 3D' },
  { id: 'build', label: 'Build' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'run-code', label: 'Run code' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'practice', label: 'Practice' },
  { id: 'design', label: 'Design' },
]
