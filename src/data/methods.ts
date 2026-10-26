import type { ToolId, ToolDef } from '@/types/tools'

/* ═══════════════════════════════════════════════════════════════════════════
   Tool Categories — condensed grouping for the TabBar
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ToolCategory {
  id: string
  label: string
  icon: string
  description: string
  tools: ToolDef[]
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'learn',
    label: 'Learn',
    icon: '📖',
    description: 'Read, understand, and encode the material',
    tools: [
      { id: 'read', label: 'Read & Edit', icon: '📖' },
      { id: 'rsvp', label: 'Speed Read', icon: '⚡' },
      { id: 'chunk', label: 'Chunk', icon: '🧱' },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: '✏️',
    description: 'Active recall and retrieval drills',
    tools: [
      { id: 'fill', label: 'Fill Blank', icon: '✏️' },
      { id: 'firstletter', label: 'First Letters', icon: '🔤' },
      { id: 'freewrite', label: 'Free Write', icon: '📝' },
      { id: 'flashcard', label: 'Flashcards', icon: '🃏' },
    ],
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: '🔗',
    description: 'Build sequences and associations',
    tools: [
      { id: 'chain', label: 'Chain', icon: '🔗' },
      { id: 'cue', label: 'Cue Lines', icon: '🎭' },
      { id: 'recall', label: 'Recall', icon: '🧠' },
      { id: 'loci', label: 'Palace', icon: '🏛️' },
    ],
  },
  {
    id: 'perform',
    label: 'Perform',
    icon: '🎬',
    description: 'Stage-ready rehearsal',
    tools: [
      { id: 'perform', label: 'Perform', icon: '🎬' },
    ],
  },
  {
    id: 'meta',
    label: 'More',
    icon: '⚙️',
    description: 'Planning, analytics, and utilities',
    tools: [
      { id: 'studyguide', label: 'Study Guide', icon: '📋' },
      { id: 'editor', label: 'Editor', icon: '✂️' },
      { id: 'map', label: 'Map', icon: '🗺️' },
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
]

/** Flat list of all tools across categories */
export const METHODS: ToolDef[] = TOOL_CATEGORIES.flatMap(c => c.tools)

/**
 * The tools shown in the app (Patrick, 26 Oct): one row, no categories.
 * Every other tool keeps its code but is not reachable from the screen;
 * their ideas are parked in Notion to bring back if they make sense.
 */
// 'read' is the editor that saves (full text, Edit → Save, tags). The old 'editor' tool
// was a text box that never saved, so it is hidden and redirects here.
export const ACTIVE_TOOL_IDS: ToolId[] = ['studyguide', 'rsvp', 'fill', 'firstletter', 'read']
export const ACTIVE_TOOLS: ToolDef[] = ACTIVE_TOOL_IDS.map(id => METHODS.find(t => t.id === id)!)
export const isActiveTool = (id: ToolId) => ACTIVE_TOOL_IDS.includes(id)

/** Where a button that still names a hidden tool (day plan, ladder, shortcuts) now leads. */
const HIDDEN_TOOL_REDIRECT: Partial<Record<ToolId, ToolId>> = {
  editor: 'read', chunk: 'read', cue: 'read', loci: 'read', perform: 'read',
  freewrite: 'fill', flashcard: 'fill',
  chain: 'firstletter', recall: 'firstletter',
  map: 'studyguide', dashboard: 'studyguide', future: 'studyguide',
}
export const toActiveTool = (id: ToolId): ToolId => (isActiveTool(id) ? id : HIDDEN_TOOL_REDIRECT[id] ?? 'studyguide')

/* ═══════════════════════════════════════════════════════════════════════════
   Tool Combos (legacy — used by MapView)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ToolCombo {
  id: string
  label: string
  desc: string
  tools: ToolId[]
  phase: string
  orbit: number
}

export const TOOL_COMBOS: ToolCombo[] = [
  { id: 'foundation', label: 'Foundation Pack', desc: 'First exposure — read, visualize, imprint',
    tools: ['read', 'loci', 'rsvp'], phase: 'encoding', orbit: 1 },
  { id: 'drill', label: 'Drill Pack', desc: 'Active retrieval — chunk, fill, test',
    tools: ['chunk', 'fill', 'freewrite', 'flashcard'], phase: 'retrieval', orbit: 2 },
  { id: 'connect', label: 'Connection Pack', desc: 'Link everything — chain, cue, recall',
    tools: ['chain', 'cue', 'recall'], phase: 'integration', orbit: 3 },
  { id: 'perform', label: 'Performance Pack', desc: 'Stage-ready — perform, first letters, speed',
    tools: ['perform', 'firstletter', 'rsvp'], phase: 'transfer', orbit: 4 },
]

/* ═══════════════════════════════════════════════════════════════════════════
   Science entries
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ScienceEntry {
  name: string
  researcher: string
  what: string
  how: string
  when: string
}

export const SCIENCE: Partial<Record<ToolId, ScienceEntry>> = {
  read: { name: 'Elaborative Encoding', researcher: 'Craik & Lockhart, 1972',
    what: 'Processing information at a deeper level (meaning, emotion, context) creates stronger memory traces than shallow processing (just reading words).',
    how: "Don't just read — engage with the emotion, the humor, the stage directions. Ask yourself WHY the character says each line. The deeper you process, the stronger the memory.",
    when: 'Start here. First 1-2 passes through the material. Return whenever you need to re-anchor meaning.' },
  fill: { name: 'Cloze Deletion / Retrieval Practice', researcher: 'Pimsleur, 1967 / Roediger & Karpicke, 2006',
    what: 'Actively retrieving information from memory strengthens the memory trace far more than re-reading. Cloze deletion (filling blanks) forces retrieval at the word level.',
    how: 'Start at 20-30% blanks. As you improve, increase to 60-80%, then push to 100% for full recall practice. The struggle of trying to recall IS the learning.',
    when: 'After 2-3 read-throughs. This is your main workhorse for word-perfect memorization.' },
  firstletter: { name: 'Retrieval Cue Theory', researcher: 'Tulving & Pearlstone, 1966',
    what: 'Memory works through associations. A single cue (like a first letter) can trigger recall of the entire word or phrase. First-letter cues bridge the gap between full text and pure recall.',
    how: "Read through with first letters only. Say each word aloud as you decode it. When you get stuck, that's a weak link — focus extra attention there.",
    when: "After you're ~70% comfortable with the text. Great for identifying specific weak spots." },
  chunk: { name: 'Scaffolded Learning / Chunking', researcher: 'Vygotsky, 1978 / Miller, 1956',
    what: 'Working memory holds ~7 items. By grouping information into meaningful chunks and mastering each before combining, you work within cognitive limits while building toward the whole.',
    how: "Master each chunk until you can recite it without looking. Use sub-chunks (3a, 3b, 3c) to break down long passages before building back up to the full chunk.",
    when: 'Core learning phase. After initial read-through, this is where real memorization happens.' },
  flashcard: { name: 'Leitner Spaced Repetition', researcher: 'Sebastian Leitner, 1972',
    what: 'Cards you know well get tested less frequently; cards you struggle with get repeated immediately. This optimizes study time by focusing effort where it\'s needed most.',
    how: "Be honest with self-grading. Wrong cards come back the same round. The system automatically focuses your energy on weak spots.",
    when: 'After initial chunk learning. Great for consolidation and identifying which chunks need more work.' },
  cue: { name: 'Context-Dependent Memory', researcher: 'Godden & Baddeley, 1975',
    what: 'Memory retrieval is stronger when the retrieval context matches the encoding context. Practicing with cue lines simulates the actual performance context.',
    how: "Listen to/read the cue line, then deliver yours from memory. Focus on the transition — the cue should trigger your line automatically.",
    when: 'Performance preparation phase. After you know the words, train the transitions.' },
  rsvp: { name: 'Rapid Serial Visual Presentation', researcher: 'Forster, 1970',
    what: 'Presenting words one at a time at the Optimal Recognition Point eliminates eye movement, increasing reading speed and forcing sequential processing that mirrors speech patterns.',
    how: 'Start at 150-200 WPM for encoding. Increase speed as familiarity grows. The text-below view lets you see context. Multiple passes at increasing speeds builds fluency.',
    when: 'Supplementary tool throughout. Low speed for encoding, high speed for fluency.' },
  chain: { name: 'Serial Position & Chaining', researcher: 'Ebbinghaus, 1885',
    what: 'Items at the beginning (primacy) and end (recency) of a list are remembered best. The middle is weakest. Chaining progressively builds connections across the weak middle sections.',
    how: 'Start with chunks 1-2, then 1-3, then 1-4, etc. Each time you add a chunk, run the entire chain. This strengthens the transitions between chunks.',
    when: 'After mastering individual chunks. This bridges the gap between knowing parts and performing the whole.' },
  recall: { name: 'Free Recall / Testing Effect', researcher: 'Roediger & Karpicke, 2006',
    what: "Testing yourself (even unsuccessfully) produces better long-term retention than additional study time. The 3-tier grading (missed/close/nailed) gives you diagnostic information.",
    how: "See the chunk name and anchor. Try to recite the entire chunk aloud. Be honest in grading — 'close' means you got the gist but missed specific words.",
    when: 'Assessment checkpoints. Use between study sessions to measure progress and identify weak spots.' },
  loci: { name: 'Method of Loci (Memory Palace)', researcher: 'Simonides of Ceos, ~500 BC',
    what: 'Spatial memory is one of the strongest memory systems. By associating each piece of information with a vivid location in a familiar space, you leverage this powerful system.',
    how: "Walk through each 'stop' slowly. Spend 20-30 seconds vividly imagining the scene. Make it absurd, emotional, multi-sensory. The more vivid, the stronger the link.",
    when: "Early learning phase for structure. Return to it when you lose your place — the spatial sequence helps you find where you are." },
  perform: { name: 'Transfer-Appropriate Processing', researcher: 'Morris, Bransford & Franks, 1977',
    what: 'Memory is best when practice conditions match performance conditions. Performing the full skit with timing, emotion, and physicality is the closest match to the real thing.',
    how: 'Stand up. Use gestures. Time yourself. The physical and emotional engagement creates additional memory pathways beyond the verbal.',
    when: 'Final preparation. After all other methods have built the foundation, perform repeatedly to lock it in.' },
}

export function exportConfig(type: string, id: string): string {
  const config: Record<string, unknown> = { version: '1.0', type, exported: new Date().toISOString() }
  if (type === 'tool') {
    const m = METHODS.find(m => m.id === id)
    const s = SCIENCE[id as ToolId]
    config.tool = { id: m?.id, label: m?.label, icon: m?.icon, science: s ? { name: s.name, researcher: s.researcher } : null }
  } else if (type === 'combo') {
    const combo = TOOL_COMBOS.find(c => c.id === id)
    if (combo) {
      config.combo = { ...combo, toolDetails: combo.tools.map(tid => { const m = METHODS.find(m => m.id === tid); return { id: tid, label: m?.label, icon: m?.icon } }) }
    }
  } else if (type === 'plan') {
    config.plan = { label: '1-Day Memorization Plan', tools: METHODS.map(m => m.id) }
  }
  return JSON.stringify(config, null, 2)
}
