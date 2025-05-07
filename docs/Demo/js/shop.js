/* eslint-env browser, es2021 */
// ──────────────────────────────────────────────────────────────
// Shop page main logic — js/shop.js
// (place this file alongside supabase.js in your js/ folder)
// ──────────────────────────────────────────────────────────────
import { supabase } from './supabase.js';

/* ─────────── Constants & Helpers ─────────── */
const ITEMS = [
  ['Phantom Dash',  'Ghost Cutter',      'Runner’s Instinct'],   // col-0 - Agile
  ['Iron Reversal', 'Anchor Field',      'Guardian’s Will'   ],  // col-1 - Tank
  ['Crimson Drain', 'Wrath Unchained',   'Berserker’s Blood']    // col-2 - Power
];
// Level-1 entry: only top‐row of each column
const ENTRY_SET = new Set([
  'Phantom Dash',
  'Iron Reversal',
  'Crimson Drain'
]);
// Find column & row for a skill name
const findPos = name => {
  for (let c = 0; c < 3; c++) {
    const r = ITEMS[c].indexOf(name);
    if (r !== -1) return { col: c, row: r };
  }
  return null;
};

/* ─────────── DOM References ─────────── */
const params     = new URLSearchParams(location.search);
const saveId     = params.get('saveId');
if (!saveId) {
  alert('缺少存档 ID');
  throw new Error('saveId required');
}
const lvlDisplay = document.getElementById('levelDisplay');
const resetBtn   = document.getElementById('resetBtn');
const shop       = document.getElementById('shop');
const storedList = document.getElementById('storedList');
const backBtn    = document.getElementById('backToGame');

/* ─────────── State ─────────── */
let level   = 1;    // overwritten by loadSave()
let stored  = [];   // chosen skill names
let homeCol = null; // column chosen in stage 1

/* ─────────── UI Rendering ─────────── */
function renderStored() {
  storedList.innerHTML = stored.length
    ? stored.map(n => `<li>${n}</li>`).join('')
    : '<li>None</li>';
}

function updateUI() {
  lvlDisplay.textContent = `Level: ${level}`;

  document.querySelectorAll('.column').forEach($col => {
    const col = +$col.dataset.col;
    $col.classList.toggle('active', col === homeCol);

    $col.querySelectorAll('.item').forEach($it => {
      const row  = +$it.dataset.row;
      const name = $it.textContent.trim();
      let disabled = true;

      if (level === 1) {
        // Level 1: pick exactly one from the top row
        disabled = !ENTRY_SET.has(name) || stored.length >= 1;
      }
      else if (level === 2) {
        if (stored.length === 1) {
          // specialization: same-column row 1
          if (col === homeCol && row === 1) disabled = false;
          // cross-column first pick: other columns, row 0 or 1
          if (col !== homeCol && (row === 0 || row === 1)) disabled = false;
        }
        else if (stored.length === 2) {
          // cross-column second pick: only the remaining column, row 0 or 1
          const usedCols = new Set(stored.map(n => findPos(n).col));
          if (!usedCols.has(col) && (row === 0 || row === 1)) {
            disabled = false;
          }
        }
      }
      // Level ≥3: all disabled (preview only)
      
      // never allow re-clicking an owned skill or any passive (row 2)
      if (stored.includes(name) || row === 2) disabled = true;

      $it.classList.toggle('disabled', disabled);
    });
  });

  renderStored();
}

/* ─────────── Supabase Load / Save ─────────── */
async function loadSave() {
  const { data, error } = await supabase
    .from('saves')
    .select('current_level, skills')
    .eq('id', saveId)
    .single();
  if (error) {
    alert('加载失败: ' + error.message);
    return;
  }

  level  = data.current_level || 1;
  stored = data.skills        || [];

  if (stored.length) {
    const p = findPos(stored[0]);
    homeCol = p ? p.col : null;
  }

  updateUI();
}

function saveState() {
  return supabase
    .from('saves')
    .update({ current_level: level, skills: stored })
    .eq('id', saveId);
}

/* ─────────── Shop Click Logic ─────────── */
shop.addEventListener('click', async e => {
  const $it = e.target.closest('.item');
  if (!$it || $it.classList.contains('disabled')) return;

  const col  = +$it.parentElement.dataset.col;
  const row  = +$it.dataset.row;
  const name = $it.textContent.trim();

  if (level === 1) {
    // Stage 1 pick
    stored.push(name);
    homeCol = col;
  }
  else if (level === 2) {
    if (stored.length === 1) {
      // first pick in Level 2
      if (col === homeCol && row === 1) {
        // specialize: same-column second row + auto-unlock passive
        stored.push(name);
        stored.push(ITEMS[col][2]);
      }
      else if (col !== homeCol && (row === 0 || row === 1)) {
        // cross-column first pick
        stored.push(name);
      }
    }
    else if (stored.length === 2) {
      // cross-column second pick
      const usedCols = new Set(stored.map(n => findPos(n).col));
      if (!usedCols.has(col) && (row === 0 || row === 1)) {
        stored.push(name);
      }
    }
  }

  await saveState();
  updateUI();
});

/* ─────────── Reset / Continue ─────────── */
resetBtn.addEventListener('click', async () => {
  level   = 1;
  stored  = [];
  homeCol = null;
  await saveState();
  updateUI();
});

backBtn.addEventListener('click', async () => {
  // advance stage on Continue
  if (level === 1 && stored.length === 1) {
    level = 2;
  } else if (level === 2 && stored.length >= 2) {
    level = 3;
  } else if (level === 3) {
    level = 4;
  } else if (level === 4) {
    level = 5;
  }

  // notify BG frame to switch tileset
  document
    .getElementById('bgFrame')
    .contentWindow
    .postMessage({ type: 'level', level }, '*');

  await saveState();
  location.href = `game.html?saveId=${saveId}`;
});

/* ─────────── Init ─────────── */
loadSave();