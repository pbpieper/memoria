/* ════════════════════════════════════════════════════════════════
   Memoria — SHARED EXERCISE SOURCE OF TRUTH
   Consumed by both "Exercise Lab.dc.html" (full editing) and
   "Memoria.dc.html" (the app climb + per-piece roadmap).

   The Lab edits EXERCISES and persists them to localStorage; the app
   reads the same store to decide what each level offers. The five-level
   spine (Meet → Perform) is the fixed grammar the climb is organized by;
   exercises slot into it by their `level`.

   Two kinds of exercise:
     • core    — on the must-pass spine. Clear it to unlock the next.
     • support — side-loops that feed back into a core exercise when a
                 learner is struggling (speed-read, hints, hear-it…).
                 They make the roadmap a real tree, not a single line.
   ════════════════════════════════════════════════════════════════ */
(function () {
  const CATS = { Reading: '#60A5FA', Listening: '#A78BFA', Writing: '#34D399', Speaking: '#F472B6' };
  const LEVELS = ['Meet', 'Recognize', 'Recall', 'Produce', 'Perform'];
  const LEVEL_EMOJI = { Meet: '📖', Recognize: '⚡', Recall: '✏️', Produce: '🧠', Perform: '🎭' };
  const LEVEL_BLURB = {
    Meet: 'First encounter — get the words in front of you.',
    Recognize: 'Know it when you see it — light scaffolds.',
    Recall: 'Retrieve it with shrinking support.',
    Produce: 'Reproduce it cold, from nothing.',
    Perform: 'Deliver it live, aloud, for someone.',
  };

  // Step 0 — the raw text, before any exercise. Root of the tree.
  const INPUT_NOTE = 'The raw passage you want to memorize. Paste it once; every step below works on this same text. Everything in the climb branches from here.';

  // Per-step paragraph: the sequence & logic the learner is walked through.
  const STEP_INTRO = {
    Meet: 'First contact with the whole text. Read it aloud and type it as you read so a spoken and a written trace both go down. Speed-read sits to the side as support — drop back to it whenever a section won\'t stick.',
    Recognize: 'The text starts to hide. Cloze 25% shows first letters and asks for the rest; speed-read stays on hand as support. Echo/shadow waits here for when audio is wired up.',
    Recall: 'Support shrinks. Cloze 50% is the core retrieval; speed-read · fast and dictation sit alongside as optional pushes when a section is shaky.',
    Produce: 'Reproduce the whole passage cold, from nothing. Once the cold copy is reliable, speed-type adds time pressure on top.',
    Perform: 'Deliver it live, aloud, for a listener. Cold and for-someone are one act now — the summit of the climb.',
  };

  // Bridge: what it takes to cross from this step to the next (a milestone,
  // not just "self-mark"). Struggle → loop back through the step\'s supports.
  const STEP_BRIDGE = {
    Meet: 'Section the text into chunks — that division is what the next step practises against.',
    Recognize: 'Read the first-letters version aloud, start to end. Stumble? Loop back and repeat before crossing.',
    Recall: 'Hold one full section from memory with no scaffold before going fully cold. (revising)',
    Produce: 'Run the whole piece once end-to-end with nothing shown. (revising)',
  };

  // The canonical exercise set. Each node: id, name, categories[],
  // level (which grade it counts toward), kind (core|support),
  // active (false = off / not built), graded, cp (none|self|hard),
  // support/demand, spec/notes, optional family / nodeType.
  const DEFAULT_EXERCISES = [
    // ── Step 1 · Meet — first contact with the whole text ──
    { id:'read-aloud', name:'Read aloud', categories:['Speaking'], level:'Meet', kind:'core', support:0, demand:18, graded:false, cp:'self', gates:null, spec:'Read the full text out loud, once.', notes:'Core: the spoken first pass.' },
    { id:'type-as-read', name:'Type-as-read', categories:['Writing'], level:'Meet', kind:'core', support:10, demand:26, graded:true, cp:'none', gates:null, spec:'Type the text while it is visible — builds the motor trace.', notes:'Core: the written first pass.' },
    { id:'rsvp-slow', name:'Speed-read · slow', categories:['Reading'], level:'Meet', kind:'support', family:'Speed-read', support:12, demand:28, graded:false, cp:'none', gates:null, spec:'One word at a time at a comfortable pace.', notes:'Support: drop back here when a section won\'t stick.' },
    { id:'hear-tts', name:'Hear it (TTS)', categories:['Listening'], level:'Meet', kind:'support', support:0, demand:6, active:false, graded:false, cp:'self', gates:null, spec:'Text-to-speech playback of the passage.', notes:'Support (off): needs a TTS engine.' },
    { id:'silent-read', name:'Silent read', categories:['Reading'], level:'Meet', kind:'support', support:0, demand:5, active:false, graded:false, cp:'self', gates:null, spec:'Read the full text silently, at your own pace.', notes:'Support (off): folded into speed-read · slow.' },

    // ── Step 2 · Recognize — recognise each section with light scaffolds ──
    { id:'cloze25', name:'Cloze 25% · first letters', categories:['Writing'], level:'Recognize', kind:'core', family:'Cloze', support:25, demand:38, graded:true, cp:'none', gates:null, spec:'25% of words removed, first letters shown for the rest.', notes:'Core: the first recall scaffold.' },
    { id:'rsvp-mid', name:'Speed-read', categories:['Reading'], level:'Recognize', kind:'support', family:'Speed-read', support:18, demand:35, graded:false, cp:'none', gates:null, spec:'One word at a time, picking up the pace.', notes:'Support: the recurring speed dial.' },
    { id:'shadow', name:'Shadow / echo', categories:['Speaking'], level:'Recognize', kind:'support', support:14, demand:36, active:false, graded:false, cp:'none', gates:null, spec:'Hear a line, echo it back immediately.', notes:'Support (off): needs TTS + mic.' },
    { id:'cue-lines', name:'Cue-lines', categories:['Speaking'], level:'Recognize', kind:'support', support:30, demand:44, active:false, graded:false, cp:'self', gates:null, spec:'First line of each chunk shown as a cue; say the rest aloud.', notes:'Support (off).' },

    // ── Step 3 · Recall — retrieve with shrinking support ──
    { id:'cloze50', name:'Cloze 50%', categories:['Writing'], level:'Recall', kind:'core', family:'Cloze', support:50, demand:55, graded:true, cp:'none', gates:null, spec:'Fill in 50% of words removed.', notes:'Core retrieval.' },
    { id:'rsvp-fast', name:'Speed-read · fast', categories:['Reading'], level:'Recall', kind:'support', family:'Speed-read', support:22, demand:42, graded:false, cp:'none', gates:null, spec:'RSVP fast — pushes recognition toward recall.', notes:'Support.' },
    { id:'dictation', name:'Dictation', categories:['Writing'], level:'Recall', kind:'support', support:32, demand:56, active:false, graded:true, cp:'none', gates:null, spec:'Type what you hear.', notes:'Support (off): needs TTS.' },
    { id:'cloze75', name:'Cloze 75%', categories:['Writing'], level:'Recall', kind:'core', family:'Cloze', support:75, demand:62, active:false, graded:true, cp:'none', gates:null, spec:'Fill in 75% of words removed.', notes:'(off) for now.' },
    { id:'first-letters', name:'First-letters', categories:['Writing'], level:'Recall', kind:'core', support:62, demand:66, active:false, graded:true, cp:'none', gates:null, spec:'Only first letters shown; type the rest.', notes:'(off): folded into Cloze 25%.' },
    { id:'recite-fl', name:'Recite from first-letters (aloud)', categories:['Speaking'], level:'Recall', kind:'support', support:60, demand:72, active:false, graded:false, cp:'self', gates:null, spec:'First-letters scaffold; recite aloud.', notes:'(off): used as the bridge to step 3.' },

    // ── Step 4 · Produce — reproduce it cold ──
    { id:'produce-cold', name:'Produce cold', categories:['Writing'], level:'Produce', kind:'core', support:100, demand:85, graded:true, cp:'none', gates:null, spec:'Reproduce the whole passage from nothing.', notes:'Core.' },
    { id:'speed-type', name:'Speed-type cold', categories:['Writing'], level:'Produce', kind:'support', support:100, demand:92, graded:true, cp:'none', gates:null, spec:'Produce cold, against the clock.', notes:'Support: timed pressure once cold is reliable.' },

    // ── Step 5 · Perform — deliver it live ──
    { id:'perform', name:'Perform', categories:['Speaking'], level:'Perform', kind:'core', support:100, demand:100, graded:false, cp:'self', gates:null, spec:'Perform the whole piece from memory, aloud — for a live listener.', notes:'Core: cold + for-someone, merged. The summit.' },
  ];

  // The app's fixed five-level spine. Each entry is the primary mechanic the
  // climb runs at that grade; the practice engine reads mode/kind/frac/graded.
  const APP_SPINE = [
    { n:'Meet',      level:'Meet',      cat:'Reading', mode:'encounter', kind:'encounter', graded:false },
    { n:'Recognize', level:'Recognize', cat:'Reading', mode:'full', kind:'speedread', graded:false },
    { n:'Recall',    level:'Recall',    cat:'Writing', mode:'cloze',     frac:0.55,        graded:true  },
    { n:'Produce',   level:'Produce',   cat:'Writing', mode:'blank',     kind:'blank',     graded:true  },
    { n:'Perform',   level:'Perform',   cat:'Perform', mode:'perform',   kind:'perform',   graded:false },
  ];

  const STORE_KEY = 'memoria_exercises_v5';

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const a = JSON.parse(raw); if (Array.isArray(a) && a.length) return a; }
    } catch (e) {}
    return DEFAULT_EXERCISES.map(e => ({ ...e }));
  }
  function save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // Group the editable set by level for the app's roadmap strip.
  function byLevel(list) {
    const src = list || load();
    return LEVELS.map(lv => {
      const exs = src.filter(e => e.level === lv && e.active !== false).map(e => ({
        id: e.id, name: e.name,
        cat: (e.categories && e.categories[0]) || 'Writing',
        color: CATS[(e.categories && e.categories[0]) || 'Writing'] || '#94A3B8',
        kind: e.kind === 'support' ? 'support' : 'core',
        support: e.kind === 'support',
        step: e.nodeType === 'step',
        hard: e.cp === 'hard',
      }));
      return { level: lv, emoji: LEVEL_EMOJI[lv], blurb: LEVEL_BLURB[lv], intro: STEP_INTRO[lv], bridge: STEP_BRIDGE[lv], exercises: exs,
               core: exs.filter(x => !x.support), support: exs.filter(x => x.support) };
    });
  }

  window.MEMORIA = { CATS, LEVELS, LEVEL_EMOJI, LEVEL_BLURB, INPUT_NOTE, STEP_INTRO, STEP_BRIDGE, DEFAULT_EXERCISES, APP_SPINE, STORE_KEY, load, save, byLevel };
})();
