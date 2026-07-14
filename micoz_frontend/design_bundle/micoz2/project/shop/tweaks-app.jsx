// MICOZ — Tweakable shell with 3 expressive controls
//
// Mood   — palette swap (4 curated tones); reshapes the whole color identity
// Voice  — typography personality (3 options); changes how the brand "sounds"
// Rhythm — display type scale (3 options); changes spatial drama
//
// Each control is system-level — not pixel-pushing. Together they create ~36
// distinct visual personalities while preserving the underlying design.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "deep-plum",
  "voice": "Editorial",
  "rhythm": "Hushed"
}/*EDITMODE-END*/;

// ─── Mood palettes ──────────────────────────────────────
const MOODS = {
  'deep-plum': {
    label: 'Deep Plum',
    swatch: ['#2a1a3e', '#f5f1ea'],
    vars: {
      '--plum-900': '#18102a',
      '--plum-800': '#221638',
      '--plum-700': '#2a1a3e',
      '--plum-600': '#3a2552',
      '--plum-500': '#4d3470',
      '--plum-400': '#6b4d8f',
      '--plum-300': '#9a7fb8',
      '--plum-200': '#c4b0d8',
      '--plum-100': '#e8d8f0',
      '--plum-50':  '#f5edf7',
      '--cream':    '#f5f1ea',
      '--cream-2':  '#ede7dc',
      '--paper':    '#faf7f2',
      '--ink':      '#1a1424',
      '--muted':    '#6b5d72',
      '--line':     'rgba(42, 26, 62, 0.12)',
      '--line-strong': 'rgba(42, 26, 62, 0.22)',
    },
  },
  'velvet-noir': {
    label: 'Velvet Noir',
    swatch: ['#1a1a2e', '#efedf3'],
    vars: {
      '--plum-900': '#06060f',
      '--plum-800': '#0e0e1c',
      '--plum-700': '#1a1a2e',
      '--plum-600': '#252540',
      '--plum-500': '#3a3060',
      '--plum-400': '#5a4a80',
      '--plum-300': '#8878a8',
      '--plum-200': '#b0a0c8',
      '--plum-100': '#dcd6e8',
      '--plum-50':  '#eeebf3',
      '--cream':    '#efedf3',
      '--cream-2':  '#e4e1ea',
      '--paper':    '#f6f4f9',
      '--ink':      '#0e0e1c',
      '--muted':    '#5d5d75',
      '--line':     'rgba(14, 14, 28, 0.10)',
      '--line-strong': 'rgba(14, 14, 28, 0.22)',
    },
  },
  'lavender-dawn': {
    label: 'Lavender Dawn',
    swatch: ['#6b4d8f', '#faf6fc'],
    vars: {
      '--plum-900': '#3a2552',
      '--plum-800': '#4d3470',
      '--plum-700': '#6b4d8f',
      '--plum-600': '#7e62a3',
      '--plum-500': '#9a7fb8',
      '--plum-400': '#b599d0',
      '--plum-300': '#c4b0d8',
      '--plum-200': '#dbcde6',
      '--plum-100': '#f0e6f5',
      '--plum-50':  '#faf4fc',
      '--cream':    '#faf6fc',
      '--cream-2':  '#f1eaf5',
      '--paper':    '#fcfaff',
      '--ink':      '#3a2552',
      '--muted':    '#7a6b85',
      '--line':     'rgba(107, 77, 143, 0.14)',
      '--line-strong': 'rgba(107, 77, 143, 0.28)',
    },
  },
  'aubergine': {
    label: 'Aubergine',
    swatch: ['#4a2c5a', '#f5f0e8'],
    vars: {
      '--plum-900': '#1a0f2e',
      '--plum-800': '#3a2046',
      '--plum-700': '#4a2c5a',
      '--plum-600': '#5b3870',
      '--plum-500': '#6b4380',
      '--plum-400': '#88629a',
      '--plum-300': '#a085b0',
      '--plum-200': '#c2b0d0',
      '--plum-100': '#e8dcef',
      '--plum-50':  '#f5edf7',
      '--cream':    '#f5f0e8',
      '--cream-2':  '#ebe5dc',
      '--paper':    '#fbf8f2',
      '--ink':      '#1a0f2e',
      '--muted':    '#6b5d72',
      '--line':     'rgba(74, 44, 90, 0.13)',
      '--line-strong': 'rgba(74, 44, 90, 0.25)',
    },
  },
};

// ─── Voice variants ─────────────────────────────────────
const VOICES = {
  Editorial: {
    serif: '"Noto Serif KR", "Spectral", "Times New Roman", serif',
    serifEn: '"Spectral", "Noto Serif KR", serif',
  },
  Modern: {
    serif: '"Pretendard", -apple-system, "Apple SD Gothic Neo", system-ui, sans-serif',
    serifEn: '"Pretendard", -apple-system, sans-serif',
  },
  Classic: {
    serif: '"Cormorant Garamond", "Noto Serif KR", serif',
    serifEn: '"Cormorant Garamond", serif',
  },
};

let _cormorantLoaded = false;
function ensureCormorant() {
  if (_cormorantLoaded) return;
  _cormorantLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap';
  document.head.appendChild(link);
}

// ─── Apply tweaks ───────────────────────────────────────
function applyTweaks(t) {
  const root = document.documentElement;
  const mood = MOODS[t.mood] || MOODS['deep-plum'];
  for (const [k, v] of Object.entries(mood.vars)) root.style.setProperty(k, v);

  const voice = VOICES[t.voice] || VOICES.Editorial;
  root.style.setProperty('--serif', voice.serif);
  root.style.setProperty('--serif-en', voice.serifEn);
  if (t.voice === 'Classic') ensureCormorant();

  document.body.dataset.mood = t.mood;
  document.body.dataset.voice = t.voice;
  document.body.dataset.rhythm = t.rhythm;
}

// ─── Voice + Rhythm CSS rules ───────────────────────────
// Inline fontSize wins over normal CSS, so we use !important to reshape
// display headings without rewriting every component.
const TWEAK_CSS = `
  /* Voice — Modern: sans-serif headlines, heavy weight, tight tracking */
  body[data-voice="Modern"] h1,
  body[data-voice="Modern"] h2,
  body[data-voice="Modern"] h3 {
    font-family: var(--sans) !important;
    font-weight: 700 !important;
    letter-spacing: -0.04em !important;
  }
  body[data-voice="Modern"] em {
    font-style: normal !important;
    font-weight: 300 !important;
    opacity: 0.5 !important;
    letter-spacing: 0 !important;
  }

  /* Voice — Classic: lighter weight, more refined italics, looser tracking */
  body[data-voice="Classic"] h1,
  body[data-voice="Classic"] h2,
  body[data-voice="Classic"] h3 {
    font-weight: 300 !important;
    letter-spacing: -0.005em !important;
  }
  body[data-voice="Classic"] em {
    letter-spacing: 0.01em !important;
  }

  /* Rhythm — Dramatic: huge display headings, magazine-style proportions */
  body[data-rhythm="Dramatic"] h1 {
    font-size: clamp(80px, 11vw, 160px) !important;
    line-height: 0.92 !important;
    letter-spacing: -0.04em !important;
  }
  body[data-rhythm="Dramatic"] h2 {
    font-size: clamp(56px, 6.5vw, 96px) !important;
    line-height: 1 !important;
    letter-spacing: -0.025em !important;
  }
  body[data-rhythm="Dramatic"] h3 {
    font-size: clamp(28px, 2.5vw, 36px) !important;
  }

  /* Rhythm — Reserved: smaller, calmer, restrained */
  body[data-rhythm="Reserved"] h1 {
    font-size: clamp(28px, 3.2vw, 44px) !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    font-weight: 400 !important;
  }
  body[data-rhythm="Reserved"] h2 {
    font-size: clamp(22px, 2.4vw, 30px) !important;
    line-height: 1.35 !important;
  }
  body[data-rhythm="Reserved"] h3 {
    font-size: clamp(15px, 1.4vw, 18px) !important;
  }
`;

if (!document.getElementById('micoz-tweak-css')) {
  const s = document.createElement('style');
  s.id = 'micoz-tweak-css';
  s.textContent = TWEAK_CSS;
  document.head.appendChild(s);
}

// ─── Custom mood swatch picker (more expressive than TweakColor) ─────
function MoodPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {Object.entries(MOODS).map(([k, m]) => {
        const sel = value === k;
        return (
          <button key={k} type="button" onClick={() => onChange(k)} style={{
            padding: '8px 10px', borderRadius: 8,
            background: sel ? 'rgba(0,0,0,0.06)' : 'transparent',
            border: '0.5px solid ' + (sel ? 'rgba(41,38,27,0.35)' : 'rgba(0,0,0,0.08)'),
            cursor: 'default', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 8,
            font: 'inherit',
            transition: 'background .15s, border-color .15s',
          }}>
            <div style={{
              display: 'flex', flex: '0 0 auto',
              borderRadius: 999, overflow: 'hidden',
              boxShadow: '0 0 0 0.5px rgba(0,0,0,0.12)',
            }}>
              <span style={{ width: 14, height: 14, background: m.swatch[0] }}/>
              <span style={{ width: 14, height: 14, background: m.swatch[1] }}/>
            </div>
            <span style={{
              fontSize: 11, fontWeight: sel ? 600 : 400,
              color: 'rgba(41,38,27,.85)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── TweaksLayer (overlay on top of design canvas) ─────────
function TweaksLayer() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t.mood, t.voice, t.rhythm]);

  return (
    <TweaksPanel title="MICOZ · Tweaks" noDeckControls>
      <TweakSection label="Mood" />
      <TweakRow label="Palette">
        <MoodPicker value={t.mood} onChange={(v) => setTweak('mood', v)} />
      </TweakRow>

      <TweakSection label="Voice" />
      <TweakRadio
        label="Type personality"
        value={t.voice}
        options={['Editorial', 'Modern', 'Classic']}
        onChange={(v) => setTweak('voice', v)}
      />

      <TweakSection label="Rhythm" />
      <TweakRadio
        label="Display scale"
        value={t.rhythm}
        options={['Hushed', 'Dramatic', 'Reserved']}
        onChange={(v) => setTweak('rhythm', v)}
      />
    </TweaksPanel>
  );
}

// Bootstrap: separate root so the panel layers above the design canvas
(function bootTweaks() {
  // Apply defaults immediately so first paint is consistent
  applyTweaks(TWEAK_DEFAULTS);
  const host = document.createElement('div');
  host.id = 'micoz-tweak-host';
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<TweaksLayer />);
})();
