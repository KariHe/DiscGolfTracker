/** Record shapes per storage kind (ADR-0001 collections). */
export type Kind = 'courses' | 'layouts' | 'players' | 'rounds'

export interface Course {
  id: string
  name: string
  location?: string
  archived?: boolean
}

export interface Layout {
  id: string
  courseId: string
  name: string
  pars: number[]
  archived?: boolean
}

export interface Player {
  id: string
  name: string
  archived?: boolean
}

export interface Round {
  id: string
  date?: string
  layoutId?: string
  playerIds?: string[]
  scores?: Record<string, (number | undefined)[]>
  finished?: boolean
  note?: string
}

export type RecordOf = {
  courses: Course
  layouts: Layout
  players: Player
  rounds: Round
}
