/* docs/js/shop.js */
/* eslint-env browser, es2021 */
import { supabase } from './supabase.js';

/* ---------- Constants ---------- */
const ITEMS = [
  ['Phantom Dash', 'Ghost Cutter',    'Runner’s Instinct'],
  ['Iron Reversal','Anchor Field',    'Guardian’s Will'  ],
  ['Crimson Drain','Wrath Unchained', 'Berserker’s Blood']
];
const ENTRY_SET = new Set(['Phantom Dash','Iron Reversal','Crimson Drain']);
const DESC = {
  'Phantom Dash'      : 'Dash forward dealing damage along the path.',
  'Ghost Cutter'      : 'Temporarily boosts attack power.',
  'Runner’s Instinct' : 'Passive: kill refreshes Phantom Dash cooldown.',
  'Iron Reversal'     : 'Creates a reflecting shield.',
  'Anchor Field'      : 'Slows enemies in an area.',
  'Guardian’s Will'   : 'Passive: damage in Anchor Field buffs next shield.',
  'Crimson Drain'     : 'Attacks restore some HP.',
  'Wrath Unchained'   : 'Charge-up 360° heavy strike.',
  'Berserker’s Blood' : 'Passive: low HP greatly increases attack.'
};

/* ---------- Helpers ---------- */
const findPos = name => {
  for (let c = 0; c < 3; c++) {
    const r = ITEMS[c].indexOf(name);
    if (r !== -1) return { col: c, row: r };
  }
  return null;
};

/* ---------- DOM ---------- */
const $shop   = document.getElementById('shop');
const $stored = document.getElementById('storedList');
const $lvl    = document.getElementById('levelDisplay');
const $reset  = document.getElementById('resetBtn');
const $undo   = document.getElementById('undoBtn');
const $back   = document.getElementById('backToGame');
const $tip    = document.getElementById('tooltip');

const params  = new URLSearchParams(location.search);
const saveId  = params.get('saveId');
if (!saveId) { alert('saveId missing'); throw new Error('saveId'); }

/* ---------- State ---------- */
let level   = 1;
let stored  = [];
let homeCol = null;
let history = [];          // for Undo snapshots

/* ---------- UI ---------- */
function renderStored () {
  $stored.innerHTML = stored.length
    ? stored.map(n => `<li>${n}</li>`).join('')
    : '<li>None</li>';
}

function updateUI () {
  $lvl.textContent = `Level: ${level}`;

  document.querySelectorAll('.column').forEach($c => {
    const col = +$c.dataset.col;

    /* column glow */
    $c.classList.remove('active', 'green', 'yellow', 'red');
    
    if (level >= 2) {
     const selectedInCol = ITEMS[col].filter(n => stored.includes(n));
     if (selectedInCol.length === 3) {
      $c.classList.add('active', ['green', 'yellow', 'red'][col]);
     }
   }
    /* cells */
    $c.querySelectorAll('.item').forEach($it => {
      const row  = +$it.dataset.row;
      const name = $it.querySelector('.name').textContent;

      let disabled = true;
      if (level === 1) {
        disabled = !ENTRY_SET.has(name) || stored.length >= 1;
      } else if (level === 2) {
        if (stored.length === 1) {
          if (col === homeCol && row === 1) disabled = false;
          if (col !== homeCol && (row === 0 || row === 1)) disabled = false;
        } else if (stored.length === 2) {
          const used = new Set(stored.map(n => findPos(n).col));
          if (!used.has(col) && (row === 0 || row === 1)) disabled = false;
        }
      }
      if (stored.includes(name) || row === 2) disabled = true;

      $it.classList.toggle('disabled',  disabled);
      $it.classList.toggle('selected',  stored.includes(name));
    });
  });

  $undo.disabled = history.length === 0;
  renderStored();
}

/* ---------- Supabase ---------- */
async function loadSave () {
  const { data, error } = await supabase
    .from('saves')
    .select('current_level,skills')
    .eq('id', saveId)
    .single();

  if (error) { console.error(error); return; }

  level  = data.current_level || 1;
  stored = data.skills        || [];

  if (stored.length) {
    const p = findPos(stored[0]);
    homeCol = p ? p.col : null;
  }
  updateUI();
}

function save () {
  return supabase
    .from('saves')
    .update({ current_level: level, skills: stored })
    .eq('id', saveId);
}

/* ---------- Tooltip ---------- */
$shop.addEventListener('pointerover', e => {
  const $it = e.target.closest('.item');
  if (!$it) return;
  const name = $it.querySelector('.name').textContent;
  $tip.textContent = DESC[name] || name;
  $tip.style.opacity = '1';
});
$shop.addEventListener('pointermove', e => {
  $tip.style.left = `${e.clientX + 12}px`;
  $tip.style.top  = `${e.clientY + 12}px`;
});
$shop.addEventListener('pointerout', () => { $tip.style.opacity = '0'; });

/* ---------- Click Logic ---------- */
$shop.addEventListener('click', async e => {
  const $it = e.target.closest('.item');
  if (!$it || $it.classList.contains('disabled')) return;

  const col  = +$it.parentElement.dataset.col;
  const row  = +$it.dataset.row;
  const name = $it.querySelector('.name').textContent;

  /* snapshot for undo */
  history.push({ level, stored: [...stored], homeCol });

  if (level === 1) {
    stored.push(name);
    homeCol = col;
  } else if (level === 2) {
    if (stored.length === 1) {
      if (col === homeCol && row === 1) {
        stored.push(name);
        stored.push(ITEMS[col][2]);                 // auto-unlock passive
      } else if (col !== homeCol && (row === 0 || row === 1)) {
        stored.push(name);
      }
    } else if (stored.length === 2) {
      const used = new Set(stored.map(n => findPos(n).col));
      if (!used.has(col) && (row === 0 || row === 1)) {
        stored.push(name);
      }
    }
  }

  await save();
  updateUI();
});

/* ---------- Undo ---------- */
$undo.addEventListener('click', async () => {
  if (!history.length) return;
  const prev = history.pop();
  level   = prev.level;
  stored  = prev.stored;
  homeCol = prev.homeCol;
  await save();
  updateUI();
});

/* ---------- Reset ---------- */
$reset.addEventListener('click', async () => {
  history.push({ level, stored: [...stored], homeCol });
  level = 1;
  stored = [];
  homeCol = null;
  await save();
  updateUI();
});

/* ---------- Continue ---------- */
$back.addEventListener('click', async () => {
  if (level === 1 && stored.length === 1)       level = 2;
  else if (level === 2 && stored.length >= 2)   level = 3;
  else if (level === 3)                         level = 4;
  else if (level === 4)                         level = 5;

  document
    .getElementById('bgFrame')
    .contentWindow
    .postMessage({ type: 'level', level }, '*');

  await save();
  location.href = `game.html?saveId=${saveId}`;
});

/* ---------- Init ---------- */
loadSave();