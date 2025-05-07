/* eslint-env browser, es2021 */
// ──────────────────────────────────────────────────────────────
//  Shop page main logic
//  moved out from inline <script> to js/shop.js            
//  (place this file in the same js/ folder as supabase.js)
// ──────────────────────────────────────────────────────────────
import { supabase } from './supabase.js';

/* ─────────── 常量 / 工具 ─────────── */
const ITEMS = [
  ['Phantom Dash',   'Ghost Cutter',      'Runner’s Instinct'],   // col‑0 ‑ Agile
  ['Iron Reversal',  'Anchor Field',      'Guardian’s Will'   ],  // col‑1 ‑ Tank
  ['Crimson Drain',  'Wrath Unchained',   'Berserker’s Blood']    // col‑2 ‑ Power
];
const ATTR_NAMES = ['Agile', 'Tank', 'Power'];

// 🌟 Lv‑1 只允许三列首行技能（去掉 Ghost Cutter）
const ENTRY_SET = new Set([
  'Phantom Dash',   // col‑0 row‑0
  'Iron Reversal',  // col‑1 row‑0
  'Crimson Drain'   // col‑2 row‑0
]);

const findPos = (name) => {
  for (let c = 0; c < 3; c++) {
    const r = ITEMS[c].indexOf(name);
    if (r !== -1) return { col: c, row: r };
  }
  return null;
};

/* ─────────── DOM 引用 ─────────── */
const params     = new URLSearchParams(location.search);
const saveId     = params.get('saveId');
if (!saveId) { alert('缺少存档 ID'); throw new Error('saveId required'); }

const lvlDisplay = document.getElementById('levelDisplay');
const resetBtn   = document.getElementById('resetBtn');
const shop       = document.getElementById('shop');
const storedList = document.getElementById('storedList');
const backBtn    = document.getElementById('backToGame');

/* ─────────── 状态量 ─────────── */
let level   = 1;            // 初进商店默认为 1
let stored  = [];           // 已选技能名
let homeCol = null;         // 首选列 (0‥2)

/* ─────────── UI 渲染 ─────────── */
const renderStored = () => {
  storedList.innerHTML = stored.length
    ? stored.map((n) => `<li>${n}</li>`).join('')
    : '<li>None</li>';
};

const updateUI = () => {
  lvlDisplay.textContent = `Level: ${level}`;

  document.querySelectorAll('.column').forEach(($col) => {
    const col = +$col.dataset.col;
    $col.classList.toggle('active', col === homeCol);

    $col.querySelectorAll('.item').forEach(($it) => {
      const row  = +$it.dataset.row;
      const name = $it.textContent.trim();

      let disabled = true; // 默认禁用

      /* ───── Lv‑1 入门 ───── */
      if (level === 1) {
        disabled = !(ENTRY_SET.has(name)) || stored.length >= 1;
      }
      /* ───── Lv‑2 选择 ───── */
      else if (level === 2) {
        if (stored.length === 1) {
          if (col === homeCol && row === 1) disabled = false; // 专精
          if (col !== homeCol && row === 0) disabled = false; // 其它列首行
        } else if (stored.length === 2) {
          const usedCols = new Set(stored.map((n) => findPos(n).col));
          if (!usedCols.has(col) && row === 0) disabled = false;
        }
      }
      /* ───── Lv‑3 预览 ───── */
      else {
        disabled = true;
      }

      if (stored.includes(name)) disabled = true; // 已拥有
      if (row === 2) disabled = true;             // 被动永不手点

      $it.classList.toggle('disabled', disabled);
    });
  });

  renderStored();
};

/* ─────────── Supabase 读 / 写 ─────────── */
const loadSave = async () => {
  const { data, error } = await supabase
    .from('saves')
    .select('current_level, skills')
    .eq('id', saveId)
    .single();
  if (error) { alert('加载失败: ' + error.message); return; }

  level  = data.current_level || 1;
  stored = data.skills || [];

  if (stored.length) homeCol = findPos(stored[0]).col;
  updateUI();
};

const saveState = () =>
  supabase
    .from('saves')
    .update({ current_level: level, skills: stored })
    .eq('id', saveId);

/* ─────────── 点击逻辑 ─────────── */
shop.addEventListener('click', async (e) => {
  const $it = e.target.closest('.item');
  if (!$it || $it.classList.contains('disabled')) return;

  const col  = +$it.parentElement.dataset.col;
  const row  = +$it.dataset.row;
  const name = $it.textContent.trim();

  /* ---------- Level‑1 ---------- */
  if (level === 1) {
    stored.push(name);
    homeCol = col;
    // 返回游戏前在 backBtn 那边把 level++ → 2
  }
  /* ---------- Level‑2 ---------- */
  else if (level === 2) {
    if (col === homeCol && row === 1) {
      // 专精：同列第二行 + 被动
      stored.push(name);
      stored.push(ITEMS[col][2]);
      level = 3;
    } else if (row === 0 && col !== homeCol) {
      stored.push(name);
      if (stored.length === 3) level = 3;
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
  if (level === 1 && stored.length === 1) level = 2; // 进入第二阶段
  await saveState();
  location.href = `game.html?saveId=${saveId}`;
});

/* ─────────── 启动 ─────────── */
loadSave();
