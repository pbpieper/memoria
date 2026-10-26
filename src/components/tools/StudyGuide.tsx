import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { useSkitContext } from '@/context/SkitContext'
import type { ToolId } from '@/types/tools'

/* ═══════════════════════════════════════════════════════════════════════════
   PHASES & STEPS — all 17 steps across 5 phases
   ═══════════════════════════════════════════════════════════════════════════ */

export const PHASES: { id: number; label: string; icon: string; startStep: number; endStep: number }[] = [
  { id: 1, label: 'Familiarize', icon: '🌱', startStep: 1, endStep: 3 },
  { id: 2, label: 'Active Recall', icon: '🧠', startStep: 4, endStep: 6 },
  { id: 3, label: 'Strengthen', icon: '💪', startStep: 7, endStep: 9 },
  { id: 4, label: 'Master', icon: '🏆', startStep: 10, endStep: 12 },
  { id: 5, label: 'Perform', icon: '🎭', startStep: 13, endStep: 17 },
]

export const STUDY_STEPS: {
  step: number; title: string; tool: ToolId; icon: string
  description: string; difficulty: string; tip: string; citation: string
}[] = [
  // === PHASE 1: FAMILIARIZE ===
  {
    step: 1, title: 'Silent Read', tool: 'read', icon: '📖',
    difficulty: '⬜ Warm-up',
    description: 'Read the full text silently. Don\'t try to memorize — just understand the meaning, the story, the flow. Read it twice.',
    tip: 'Comprehension must come before memorization. You cannot recall what you never understood.',
    citation: 'Craik & Lockhart, 1972 — Depth of Processing',
  },
  {
    step: 2, title: 'Read Aloud', tool: 'read', icon: '🗣️',
    difficulty: '⬜ Warm-up',
    description: 'Read the full text out loud. Feel the rhythm, the pauses, the emotion. Hear yourself say every word. This activates motor memory alongside visual.',
    tip: 'Speaking engages articulatory rehearsal — your mouth remembers patterns your eyes alone cannot.',
    citation: 'Baddeley, 1986 — Phonological Loop',
  },
  {
    step: 3, title: 'Speed Read — Slow Pass', tool: 'rsvp', icon: '⚡',
    difficulty: '🟩 Easy',
    description: 'Set speed to 120–150 WPM. Let each word land. The forced sequential presentation removes the temptation to skip ahead. Watch for the pink focus letter.',
    tip: 'RSVP at slow speeds is an encoding tool, not a speed tool. You\'re imprinting word order.',
    citation: 'Forster, 1970 — Rapid Serial Visual Presentation',
  },
  // === PHASE 2: ACTIVE RECALL ===
  {
    step: 4, title: 'Chunk — Section by Section', tool: 'read', icon: '🧱',
    difficulty: '🟩 Easy',
    description: 'Take one section at a time. Read it twice, look away and recite it from memory. Rate yourself honestly. Master each section before moving on.',
    tip: 'Working memory holds 7±2 items. Chunking compresses information into manageable units.',
    citation: 'Miller, 1956 — The Magical Number Seven',
  },
  {
    step: 5, title: 'Fill Blank — 20% (with hints)', tool: 'fill', icon: '✏️',
    difficulty: '🟨 Medium',
    description: 'Set difficulty to 20%. First-letter hints are shown. Only 1 in 5 words is blanked — you should get most right. This is your first active retrieval test.',
    tip: 'The effort of retrieval — even when easy — strengthens the memory trace more than re-reading.',
    citation: 'Roediger & Karpicke, 2006 — Testing Effect',
  },
  {
    step: 6, title: 'First Letters — Read Along', tool: 'firstletter', icon: '🔤',
    difficulty: '🟨 Medium',
    description: 'The full text is reduced to first letters only. Read through WITHOUT revealing — try to speak each word from the single letter cue. Then tap lines you struggled with to check.',
    tip: 'A single letter cue can trigger recall of the entire word by exploiting pattern completion.',
    citation: 'Tulving & Pearlstone, 1966 — Retrieval Cues',
  },
  // === PHASE 3: STRENGTHEN ===
  {
    step: 7, title: 'Fill Blank — 50%', tool: 'fill', icon: '✏️',
    difficulty: '🟧 Hard',
    description: 'Increase to 50% blanked. Half the words are missing. Work section by section if the full text is too difficult. Type each word — no peeking.',
    tip: 'Desirable difficulty: the harder the retrieval, the stronger the resulting memory. Don\'t make it easy.',
    citation: 'Bjork & Bjork, 1992 — Desirable Difficulties',
  },
  {
    step: 8, title: 'Speed Read — Medium Pass', tool: 'rsvp', icon: '⚡',
    difficulty: '🟧 Hard',
    description: 'Set speed to 200–250 WPM. You should recognize most words now. Notice where you feel uncertain — those are your weak spots. Run it 2–3 times.',
    tip: 'Increasing speed forces automatic processing. Words you truly know will keep up; words you don\'t will feel jarring.',
    citation: 'Logan, 1988 — Instance Theory of Automatization',
  },
  {
    step: 9, title: 'First Letters — Recite Aloud', tool: 'firstletter', icon: '🔤',
    difficulty: '🟧 Hard',
    description: 'Same as Step 6 but now speak the FULL text aloud from first letters alone. Go section by section. Don\'t tap to reveal until you\'ve tried the entire section.',
    tip: 'Combining motor output (speech) with visual cues creates a dual encoding trace.',
    citation: 'Paivio, 1971 — Dual Coding Theory',
  },
  // === PHASE 4: MASTER ===
  {
    step: 10, title: 'Fill Blank — 80%', tool: 'fill', icon: '✏️',
    difficulty: '🟥 Expert',
    description: 'Set difficulty to 80%. Almost every word is blanked. You are essentially writing the text from memory with minimal scaffolding. This is the real test.',
    tip: 'At 80%, you\'re generating text, not recognizing it. Generation produces the strongest long-term memories.',
    citation: 'Slamecka & Graf, 1978 — Generation Effect',
  },
  {
    step: 11, title: 'Speed Read — Fast Pass', tool: 'rsvp', icon: '⚡',
    difficulty: '🟥 Expert',
    description: 'Set speed to 300–400 WPM. If you can follow at this speed, the text is deeply encoded. Run it once as a victory lap. If you lose track, drop back to 250 and try again tomorrow.',
    tip: 'Fluent processing at high speed indicates automaticity — the text has moved to long-term memory.',
    citation: 'LaBerge & Samuels, 1974 — Automatic Processing',
  },
  {
    step: 12, title: 'Full Recall — Eyes Closed', tool: 'firstletter', icon: '🏆',
    difficulty: '🟥 Expert',
    description: 'Close your eyes (or look away from the screen). Recite the entire text from memory. Use the first letters ONLY if you get stuck. If you can do this, you\'ve mastered it.',
    tip: 'Free recall without cues is the gold standard of memory strength. If you can do this, the text is yours.',
    citation: 'Tulving, 1972 — Episodic Memory',
  },
  // === PHASE 5: PERFORM ===
  {
    step: 13, title: 'Write It Out', tool: 'fill', icon: '📝',
    difficulty: '🟪 Performance',
    description: 'Write out the entire text from memory: in Fill Blank choose Brutal (100%, no hints) and type every word. Your misses show in red; redo the lines you missed.',
    tip: 'Handwriting activates unique neural pathways. Writing from memory is the most demanding — and most effective — form of retrieval practice.',
    citation: 'Mueller & Oppenheimer, 2014 — The Pen Is Mightier',
  },
  {
    step: 14, title: 'Rehearse in Character', tool: 'read', icon: '🎭',
    difficulty: '🟪 Performance',
    description: 'Stand up. Deliver the text as if you\'re performing. Use gestures, facial expressions, voice variation. Move through the space. If it\'s a dialogue, switch voices between speakers.',
    tip: 'Embodied cognition: physical movement linked to words creates richer, more durable memory traces. Every great actor rehearses on their feet.',
    citation: 'Glenberg, 1997 — Embodied Cognition; Stanislavski Method',
  },
  {
    step: 15, title: 'Visualize the Performance', tool: 'read', icon: '🧘',
    difficulty: '🟪 Performance',
    description: 'Close your eyes. Mentally walk through the entire text in your mind. Visualize yourself delivering each line — where you stand, how you gesture, the audience\'s reaction. Run it like a movie.',
    tip: 'Mental rehearsal activates the same motor and cognitive pathways as physical performance. Elite athletes and performers use this technique before every event.',
    citation: 'Driskell et al., 1994 — Mental Practice; Feltz & Landers, 1983',
  },
  {
    step: 16, title: 'Distraction Test', tool: 'firstletter', icon: '🌀',
    difficulty: '🟪 Performance',
    description: 'Do something else for 30 minutes — walk, cook, scroll your phone. Then return and recite from memory cold, without any warm-up. This tests true long-term retention.',
    tip: 'The spacing effect: retrieval after a delay is harder but produces dramatically stronger memories than massed practice.',
    citation: 'Ebbinghaus, 1885 — Spacing Effect; Cepeda et al., 2006',
  },
  {
    step: 17, title: 'Perform for Someone', tool: 'read', icon: '🌟',
    difficulty: '🟪 Performance',
    description: 'Find an audience — a friend, family member, or your phone camera. Perform the full text from memory. The social pressure of a real audience reveals gaps you didn\'t know existed and cements what you do know.',
    tip: 'Social facilitation theory: the presence of others heightens arousal and performance on well-learned tasks. If you can do it in front of someone, you own it.',
    citation: 'Zajonc, 1965 — Social Facilitation; Meisner Technique',
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
   GUIDE PROGRESS — localStorage persistence (per-skit)
   ═══════════════════════════════════════════════════════════════════════════ */

const GUIDE_STORAGE = 'skit-trainer-guide'

export function loadGuideProgress(skitId: string): Record<number, boolean> {
  try {
    const r = localStorage.getItem(`${GUIDE_STORAGE}-${skitId}`)
    return r ? JSON.parse(r) : {}
  } catch {
    return {}
  }
}

function saveGuideProgress(skitId: string, completed: Record<number, boolean>) {
  localStorage.setItem(`${GUIDE_STORAGE}-${skitId}`, JSON.stringify(completed))
}

/* ═══════════════════════════════════════════════════════════════════════════
   DAY TRACKING — per-skit start date
   ═══════════════════════════════════════════════════════════════════════════ */

const STUDY_START_STORAGE = 'skit-study-start'

function loadStudyStart(skitId: string): string | null {
  try {
    return localStorage.getItem(`${STUDY_START_STORAGE}-${skitId}`)
  } catch {
    return null
  }
}

function saveStudyStart(skitId: string, date: string) {
  localStorage.setItem(`${STUDY_START_STORAGE}-${skitId}`, date)
}

export function getDayNumber(skitId: string): number {
  let start = loadStudyStart(skitId)
  if (!start) {
    start = new Date().toISOString().split('T')[0]
    saveStudyStart(skitId, start)
  }
  const startDate = new Date(start)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  startDate.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function getTodaySteps(day: number): { startStep: number; endStep: number; label: string } {
  if (day <= 1) return { startStep: 1, endStep: 3, label: 'Familiarize' }
  if (day <= 2) return { startStep: 4, endStep: 6, label: 'Active Recall' }
  if (day <= 3) return { startStep: 7, endStep: 9, label: 'Strengthen' }
  return { startStep: 10, endStep: 17, label: 'Master & Perform' }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STUDY GUIDE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function StudyGuide() {
  const { setActiveTool } = useApp()
  const { skitId } = useSkitContext()

  const [open, setOpen] = useState(true) // open by default: it is the first tool you land on
  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({ 1: true })
  const [completed, setCompleted] = useState<Record<number, boolean>>(() => loadGuideProgress(skitId))

  const togglePhase = (id: number) => setOpenPhases(p => ({ ...p, [id]: !p[id] }))

  // Persist on change
  useEffect(() => { saveGuideProgress(skitId, completed) }, [completed, skitId])
  // Reset when skit changes
  useEffect(() => { setCompleted(loadGuideProgress(skitId)) }, [skitId])

  const toggleStep = (step: number) => {
    setCompleted(prev => ({ ...prev, [step]: !prev[step] }))
  }

  const navigateToTool = (tool: ToolId) => {
    setActiveTool(tool)
    setOpen(false)
  }

  const totalCompleted = Object.values(completed).filter(Boolean).length
  const totalSteps = STUDY_STEPS.length

  return (
    <div className="mb-3.5">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold
          cursor-pointer transition-all duration-150
          ${open
            ? 'bg-emerald-100 border border-emerald-400 text-emerald-900'
            : 'bg-gray-50 border border-gray-200 text-gray-500'
          }
        `}
      >
        📋 Study Guide
        <span className={`
          text-[11px] font-bold ml-1 px-2 py-px rounded-full
          ${totalCompleted === totalSteps
            ? 'bg-emerald-600 text-white border border-emerald-600'
            : totalCompleted > 0
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }
        `}>
          {totalCompleted}/{totalSteps}
        </span>
        <span className="text-[10px] ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expandable guide body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 mt-2.5">
              <p className="text-xs text-gray-400 leading-relaxed mb-1.5">
                Follow these {totalSteps} steps across 5 phases. Check off each step as you complete it.
                Progress: {totalCompleted}/{totalSteps}
              </p>

              {PHASES.map(phase => {
                const phaseSteps = STUDY_STEPS.filter(
                  s => s.step >= phase.startStep && s.step <= phase.endStep
                )
                const phaseCompleted = phaseSteps.filter(s => completed[s.step]).length
                const phaseTotal = phaseSteps.length
                const phaseComplete = phaseCompleted === phaseTotal
                const isOpen = !!openPhases[phase.id]

                return (
                  <div key={phase.id}>
                    {/* Phase header */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className={`
                        w-full flex items-center justify-between px-2.5 py-2 rounded-lg
                        cursor-pointer transition-all duration-200
                        ${phase.id > 1 ? 'mt-1' : ''}
                        ${phaseComplete
                          ? 'bg-emerald-600 border border-emerald-600'
                          : isOpen
                            ? 'bg-emerald-100 border border-emerald-400'
                            : 'bg-transparent border border-gray-200'
                        }
                      `}
                    >
                      <span className={`
                        text-xs font-extrabold uppercase tracking-wide
                        ${phaseComplete ? 'text-white' : 'text-emerald-900'}
                      `}>
                        {phaseComplete ? '✓' : phase.icon} Phase {phase.id}: {phase.label}
                      </span>
                      <span className={`
                        text-[11px] font-semibold
                        ${phaseComplete ? 'text-white/85' : 'text-gray-400'}
                      `}>
                        {phaseCompleted}/{phaseTotal} {isOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Phase steps */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pt-1">
                            {phaseSteps.map(s => {
                              const done = !!completed[s.step]
                              return (
                                <div
                                  key={s.step}
                                  className={`
                                    flex gap-2.5 items-start rounded-xl p-2.5 transition-all duration-200
                                    ${done
                                      ? 'bg-emerald-100 border border-emerald-400'
                                      : 'bg-white border border-gray-200'
                                    }
                                  `}
                                >
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleStep(s.step)}
                                    className={`
                                      w-7 h-7 min-w-[28px] min-h-[28px] rounded-md shrink-0
                                      flex items-center justify-center text-sm text-white
                                      cursor-pointer transition-all duration-150
                                      ${done
                                        ? 'bg-emerald-600 border-2 border-emerald-600'
                                        : 'bg-transparent border-2 border-gray-300'
                                      }
                                    `}
                                  >
                                    {done ? '✓' : ''}
                                  </button>

                                  {/* Step content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                      <span className={`
                                        font-bold text-[13px]
                                        ${done ? 'text-emerald-900 line-through opacity-70' : 'text-gray-900'}
                                      `}>
                                        {s.icon} {s.title}{' '}
                                        <span className="text-[10px] opacity-60 ml-1">{s.difficulty}</span>
                                      </span>
                                      <button
                                        onClick={() => navigateToTool(s.tool)}
                                        className="text-[11px] font-bold text-pink-500 px-2.5 py-0.5
                                                   rounded-full bg-pink-50 border border-pink-300
                                                   shrink-0 min-h-[28px] min-w-[28px]
                                                   hover:bg-pink-100 transition-colors cursor-pointer"
                                      >
                                        Go →
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-0.5">
                                      {s.description}
                                    </p>
                                    <p className="text-[11px] text-gray-400 italic leading-snug">
                                      💡 {s.tip}{' '}
                                      <span className="opacity-60">— {s.citation}</span>
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
