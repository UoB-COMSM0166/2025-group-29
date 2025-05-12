import { supabase } from './js/supabase.js';

const params = new URLSearchParams(window.location.search);
const saveId = params.get('saveId');
const MAIN_URL = 'index.html?directMain=1';

function goToMainMenu() {
  window.location.href = MAIN_URL;
}

async function goToSummary() {
  window.location.href = `summary.html?saveId=${saveId}`;
}

if (!saveId) {
  alert('缺少存档 ID，无法加载存档。');
  throw new Error('saveId required');
}

let savedCumulativeScore = 0;
let savedLevel, savedMode, savedSkills = [];
let dataLoaded = false;

let minecraftFont;

async function loadSaveData() {
  const { data, error } = await supabase
    .from('saves')
    .select('current_level, mode, skills, cumulative_score')
    .eq('id', saveId)
    .single();

  if (error) {
    console.error('加载存档失败：', error);
    alert('加载存档失败：' + error.message);
    return;
  }

  savedLevel  = data.current_level;
  savedMode   = data.mode;
  savedSkills = data.skills || [];
  savedCumulativeScore = data.cumulative_score || 0;

  score = savedCumulativeScore; 

  //同步设置当前难度状态
  if (savedMode === 'hard') {
    isHardMode = true;
    console.log('当前难度：困难');
  }else {
    isHardMode = false; 
    console.log('当前难度：简单');
  }

  console.log('读到存档→', { savedLevel, savedMode, savedSkills });
}

let player;
let enemies = [];

let zoom = 1;
let gameOver = false;
let score; // 记录得分
let resumeScore = null;
let timer = 60; // 设定倒计时时间（秒）
let startTime; // 记录游戏开始的时间

let angle = 0;

let cooldownRemaining = 0;


let slowEffect = false;
let slowEffectStartTime = 0;

let warningMessage = "";
let warningTimer = 0;

let timeBonuses = [];


let width = 2400;
let height = 1500;

let keys = {};

let dashTrail = [];//拖影效果
let maxDashTrailLength = 20;

let n;
let gamelevel;
let skillSystem;//控制skill的类
let skillIcons = {}; // 统一集中管理图标


//弹幕
let bulletEnemyImg;
let bulletImg;

let bulletReflectedImg;         // 反弹子弹
//let playerReflectGif   = null;  // 反弹状态下的玩家 GIF

let bullets = []; // 所有子弹对象
let bulletPatternType = 3; // 1=水平双发，2=四向，3=六向

let collisionManager;
//玩家贴图
//let playerIdleRightGif, playerIdleLeftGif;
//let playerAttackRightGif, playerAttackLeftGif;

let boss = null;

// 黑洞
let blackHoles = [];

//关卡管理
let levelManager;

let remainingTime; // 剩余时间（秒）
let stealthTimer = 0;
let ambushTimer = 0;
let stealthSpawnedCount = 0; // 生成的隐形敌人数量
let ambushSpawnedCount = 0; // 生成的伏击怪数量
let ambushForceDashTriggered = false;

let isHardMode = false; // 是否开启困难模式


const GIF_POOL = {
  normal: { idle:{}, attack:{} },
  agile : { idle:{}, attack:{} },
  power : { idle:{}, attack:{} },
  tank  : { idle:{}, attack:{} }
};

let BOSS_IDLE_IMG;   // ← 新增
let BOSS_SUMMON_GIF;          // boss修改
let BOSS_WAVE_GIF ;// 震波特效（可选）
let BOSS_WAVE_BOSS_GIF ;//boss震波动作
let BOSS_TOWER_SKILL_GIF;
let TOWER_IMG;
let BOSS_DASH_GIF;        // boss 冲刺动作图
let BOSS_DASH_EXPLODE_GIF; // 冲刺结束后沿路径依次播放的爆炸特效

let BOSS_BLACKHOLE_SKILL_GIF;//boss生成黑洞动作
let TRAIL_IMG;    // 冲刺残影专用贴图
let follow_gif;
let ambush_gif;
let ambushactive_gif;
let stealth_gif;
let bulletenemy_gif;
let common_gif;
let bossBulletImg;
let enemyBulletImg;
let gifImg;

let bgmNormal, bgmBoss;
let currentBGM = null;


const SFX = {
  attack     : null,
  dash       : null,
  charge     : null,
  lifesteal  : null,
  reflect    : null,
  

  play(name) {
    if (this[name] && this[name].isLoaded()) {
      this[name].play();
    }
  }
};

function preload() {

  minecraftFont = loadFont('assets/font/Minecraft.ttf');

  loadSaveData().then(() => {
    dataLoaded = true;
  });

  skillIcons["Phantom Dash"] = loadImage("assets/media/icon/icon8.png"); 
  skillIcons["Ghost Cutter"] = loadImage("assets/media/icon/icon5.PNG"); 
  skillIcons["Runner’s Instinct"] = loadImage("assets/media/icon/icon4.PNG"); 
  skillIcons["Crimson Drain"] = loadImage("assets/media/icon/icon7.png"); 
  skillIcons["Wrath Unchained"] = loadImage("assets/media/icon/icon2.PNG"); 
  skillIcons["Berserker’s Blood"] = loadImage("assets/media/icon/icon9.png"); 
  skillIcons["Iron Reversal"] = loadImage("assets/media/icon/icon3.PNG"); 
  skillIcons["Anchor Field"] = loadImage("assets/media/icon/icon1.PNG"); 
  skillIcons["Guardian’s Will"] = loadImage("assets/media/icon/icon6.PNG"); 
  bulletEnemyImg = null;
  //loadImage("弹幕怪.gif");
  bossBulletImg = loadImage("assets/media/bullet/Boss-bullet.gif");
  //loadImage("弹幕1.gif");
  //这里的注释是为了测试方便，加载图片不是必须的，传入null可以只测试代码功能。
  bulletReflectedImg = loadImage("assets/media/bullet/Character-rebound-bullet.gif");
  //playerReflectGif   = null;          // or loadImage("player-reflect.gif");
  //玩家贴图
  //playerIdleRightGif  = null;
  //loadImage("精灵-0001.gif");
  //playerAttackRightGif= null;
  //loadImage("精灵-0002.gif");
// GameFile.js  → preload()
  


  GIF_POOL.normal.idle.base   = loadImage("assets/media/character/normal-idle-base.gif");
  GIF_POOL.normal.idle.dash   = loadImage("assets/media/character/normal-idle-dash.gif");
  GIF_POOL.normal.idle.boost  = loadImage("assets/media/character/normal-idle-boost.gif");
  GIF_POOL.normal.idle.steal  = loadImage("assets/media/character/normal-idle-steal.gif");
  GIF_POOL.normal.idle.charge = loadImage("assets/media/character/normal-attack-charge.gif");
  GIF_POOL.normal.idle.shield = loadImage("assets/media/character/normal-idle-shield.gif");
  GIF_POOL.normal.attack.base   = loadImage("assets/media/character/normal-attack-base.gif");
  GIF_POOL.normal.attack.dash   = null;//没用
  GIF_POOL.normal.attack.boost  = loadImage("assets/media/character/normal-attack-boost.gif");
  GIF_POOL.normal.attack.steal  = loadImage("assets/media/character/normal-attack-steal.gif");
  GIF_POOL.normal.attack.charge = null;//没用
  GIF_POOL.normal.attack.shield = loadImage("assets/media/character/normal-attack-shield.gif");
  GIF_POOL.agile.idle.base   = loadImage("assets/media/character/agile-idle-base.gif");
  GIF_POOL.agile.idle.dash   = loadImage("assets/media/character/agile-idle-dash.gif");
  GIF_POOL.agile.idle.boost  = loadImage("assets/media/character/agile-idle-boost.gif");
  GIF_POOL.agile.attack.base  = loadImage("assets/media/character/agile-attack-base.gif");
  GIF_POOL.agile.attack.dash  = null;//没用
  GIF_POOL.agile.attack.boost = loadImage("assets/media/character/agile-attack-boost.gif");
  GIF_POOL.power.idle.base   = loadImage("assets/media/character/power-idle-base.gif");
  GIF_POOL.power.idle.steal  = loadImage("assets/media/character/power-idle-steal.gif");
  GIF_POOL.power.idle.charge = loadImage("assets/media/character/power-attack-charge.gif");
  GIF_POOL.power.attack.base   = loadImage("assets/media/character/power-attack-base.gif");
  GIF_POOL.power.attack.steal  = loadImage("assets/media/character/power-attack-steal.gif");
  GIF_POOL.power.attack.charge = null;//没用
  GIF_POOL.tank.idle.base   = loadImage("assets/media/character/tank-idle-base.gif");
  GIF_POOL.tank.idle.shield = loadImage("assets/media/character/tank-idle-shield.gif");
  GIF_POOL.tank.attack.base   = loadImage("assets/media/character/tank-attack-base.gif");
  GIF_POOL.tank.attack.shield = loadImage("assets/media/character/tank-attack-shield.gif");

  BOSS_IDLE_IMG  = loadImage("assets/media/boss/BOSS_IDLE.gif");   // ★ 新增
  BOSS_SUMMON_GIF = loadImage("assets/media/boss/BOSS_SUMMON.gif");   // boss修改 竖排 8 帧
  BOSS_WAVE_GIF = loadImage("assets/media/boss/BOSS_WAVE.gif");
  BOSS_WAVE_BOSS_GIF = loadImage("assets/media/boss/BOSS_WAVE_BOSS.gif");
  
  // ─ Boss 新技能动画（30s 播放）  
  BOSS_TOWER_SKILL_GIF = loadImage("assets/media/boss/BOSS_TOWER_SKILL.gif");
  // ── 塔的贴图  
  TOWER_IMG           = loadImage("assets/media/boss/TOWER.gif");
  BOSS_DASH_GIF         = loadImage("assets/media/boss/BOSS_DASH.gif");
  BOSS_DASH_EXPLODE_GIF = loadImage("assets/media/boss/BOSS_DASH_EXPLODE.gif");
  BOSS_BLACKHOLE_SKILL_GIF = loadImage("assets/media/boss/BOSS_BLACKHOLE_SKILL.gif");

  TRAIL_IMG = loadImage("assets/media/character/dash.png");
  follow_gif = loadImage("assets/media/monster/Follow-monster.gif");
  ambush_gif = loadImage("assets/media/monster/Ambush-monster-idle.gif");
  ambushactive_gif = loadImage("assets/media/monster/Ambush-monster-attack.gif");
  stealth_gif = loadImage("assets/media/monster/Invisible-monster.gif");
  bulletenemy_gif = loadImage("assets/media/monster/Danmaku-monster.gif");
  common_gif = loadImage("assets/media/monster/normal-monster.gif");
  enemyBulletImg = loadImage("assets/media/bullet/Monster-bullet.gif");
  gifImg = loadImage("assets/media/time/time.gif");


  bgmNormal = loadSound("assets/media/audio/stage.mp3");     // 用于第1-4关
  bgmBoss   = loadSound("assets/media/audio/finalboss.mp3"); // 用于第5关
  bgmNormal.setVolume(0.1);
  bgmBoss.setVolume(0.1);

  SFX.attack     = loadSound("assets/media/audio/attack.mp3");
  SFX.dash       = loadSound("assets/media/audio/dash.mp3");
  SFX.charge     = loadSound("assets/media/audio/charge.mp3");
  SFX.lifesteal  = loadSound("assets/media/audio/lifesteal.mp3");
  SFX.reflect    = loadSound("assets/media/audio/reflect.mp3");
  SFX.boost    = loadSound("assets/media/audio/boost.mp3");
  SFX.slow    = loadSound("assets/media/audio/slow.mp3");

  SFX.attack.setVolume(0.1);
  SFX.dash.setVolume(0.1);
  SFX.charge.setVolume(0.1);
  SFX.lifesteal.setVolume(0.1);
  SFX.reflect.setVolume(0.1);
  SFX.boost.setVolume(0.1);
  SFX.slow.setVolume(0.1);
}

function playLevelBGM(levelNumber) {
  if (currentBGM && currentBGM.isPlaying()) {
    currentBGM.stop();
  }

  if (levelNumber === 5) {
    currentBGM = bgmBoss;
  } else {
    currentBGM = bgmNormal;
  }

  if (currentBGM) {
    currentBGM.setVolume(0.1);
    currentBGM.loop();
  }
}

function applyFactionFromSkills() {
  const sel = skillSystem.selectedSkills;

  // ─── ① 用 instanceof 判定具体被动 ───
  const hasAgile = sel.some(s => s instanceof DashResetSkill);
  const hasPower = sel.some(s => s instanceof BloodFurySkill);
  const hasTank  = sel.some(s => s instanceof SlowFieldBonusDamage);

  // ─── ② 决定流派并写回 player.faction ───
  if (hasAgile)        player.faction = "agile";
else if (hasPower)   player.faction = "power";
else if (hasTank)    player.faction = "tank";
else                  player.faction = "normal";
}



function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(minecraftFont);
  console.log("Canvas Width:", windowWidth, "Canvas Height:",  windowHeight); //打印调试信息
  


  // 延迟初始化
  if (!dataLoaded) {
    noLoop();
    const check = setInterval(() => {
      if (dataLoaded) {
        clearInterval(check);
        initGame();
        loop();
      }
    }, 50);
    return;
  }

  initGame(); // 正常加载路径


}
  
function initGame() {
  setPlayer();

  // 设置技能系统，传入后端存的技能
  setSkillSystem(savedSkills);

  // 初始化关卡系统
  levelManager = new LevelManager();
  levelManager.addLevel(new Level1());
  levelManager.addLevel(new Level2());
  levelManager.addLevel(new Level3());
  levelManager.addLevel(new Level4());
  levelManager.addLevel(new Level5());
  // 这里可以继续 addLevel(new Level2()), ... 以后加


  setTimeBonuses();

  collisionManager = new CollisionManager(player, enemies, bullets, timeBonuses);

// 假设 enemies 是你的敌人数组
player.meleeAttack = new MeleeAttack(player, enemies);

  applyFactionFromSkills();

  // 从存档加载关卡
  const idx = (typeof savedLevel === 'number' && savedLevel > 0)
  ? savedLevel - 1
  : 0;
levelManager.loadLevel(idx);
}
  
function setSkillSystem() {
  skillSystem = new SkillSystem();
   const slowField   = new SlowFieldSkill(player, enemies);
  const fieldShock  = new SlowFieldBonusDamage(player, enemies, slowField);
  
  skillSystem.addSkill(new DashSkill(player, enemies)); 
  skillSystem.addSkill(new AttackBoostSkill(player)); 
  skillSystem.addSkill(new DashResetSkill(player));
  skillSystem.addSkill(new LifestealSkill(player));
  skillSystem.addSkill(new ChargeStrikeSkill(player, enemies));
  skillSystem.addSkill(new BloodFurySkill(player));
  skillSystem.addSkill(new ReflectSkill(player));
  skillSystem.addSkill(slowField);
  skillSystem.addSkill(fieldShock);

  skillSystem.selectedSkills = [];

  if (savedSkills) {
    // 使用存档中的技能名选择技能
    for (let name of savedSkills) {
      let skill = skillSystem.allSkills.find(s => s.name === name);
      if (skill) skillSystem.selectSkill(skill);
    }
  } 
 
  player.selectedSkills = skillSystem.selectedSkills;

}


function setPlayer() {
  player = new Player(0, 0, 30);
  startTime = millis();
}
  

  function setTimeBonuses() {

  timeBonuses = [];

  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 15));
  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 30));
  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 45));
}



function draw() {
if (!levelManager || !levelManager.currentLevel) {
    return;
}
 // 只修正四个方向键的状态
keys["ArrowUp"]    = keyIsDown(UP_ARROW);
keys["ArrowDown"]  = keyIsDown(DOWN_ARROW);
keys["ArrowLeft"]  = keyIsDown(LEFT_ARROW);
keys["ArrowRight"] = keyIsDown(RIGHT_ARROW);

// 死亡优先级最高，优先处理
if (gameOver) {
  showGameOverScreen();
  return;
}

// 只有在关卡没结束时更新倒计时
if (!levelManager.currentLevel.finished) {
  updateTimer();
}


updateCamera();
 
drawMapBorder();


// 让 LevelManager 自主管理更新 & 渲染
if (levelManager) {

  // 只有当关卡没结束时才更新
  if (!levelManager.currentLevel.finished) {
  levelManager.update();  // 敌人/奖励/子弹都在关卡内部管理
  }

  levelManager.draw();    // 渲染提示、关卡 UI
}
// 玩家和碰撞检测只在关卡没结束时更新
if (!levelManager.currentLevel.finished) {
  updatePlayer();
  player.meleeAttack.update();
  collisionManager.update();
}


// HUD & 碰撞
drawInfo();

// 最后再叠加 Game Over 界面**
if (gameOver) {
  showGameOverScreen();
}



}


function updateTimer() {
  let elapsedTime = (millis() - startTime) / 1000;
  remainingTime = max(0, timer - elapsedTime);
  // ✅ 倒计时到 20 秒，强制所有伏击怪冲刺（只触发一次）
  if (!ambushForceDashTriggered && remainingTime <= 20) {
    ambushForceDashTriggered = true;
    for (let enemy of enemies) {
      if (enemy instanceof AmbushEnemy && !enemy.isDashing) {
        enemy.startDash(); // 调用伏击怪的冲刺函数（你已有这个函数）
      }
    }
    console.log("⚡ 所有伏击怪已强制进入冲刺状态");
  }
  

  if (remainingTime <= 0) {
    // 不再直接 Game Over，而是通知关卡
    if (levelManager && levelManager.currentLevel && typeof levelManager.currentLevel.onTimeUp === 'function') {
      levelManager.currentLevel.onTimeUp();
    } else {
      // 兜底：没有关卡 or 没实现 onTimeUp()，默认判定失败
      console.log("时间到（无关卡响应），默认判定失败");
      gameOver = true;
    }
  }

}

function updateCamera() {
  push();
  resetMatrix();
  clear();
  pop();

  let camX = constrain(player.pos.x, -width + windowWidth / 2, width - windowWidth / 2);
  let camY = constrain(player.pos.y, -height + windowHeight / 2, height - windowHeight / 2);
  translate(windowWidth / 2 - camX, windowHeight / 2 - camY);
}

function drawMapBorder() {
  push();
  stroke(0, 0, 0);
  strokeWeight(5);
  noFill();
  rectMode(CENTER);
  rect(0, 0, width * 2, height * 2);
  pop();
}


function updatePlayer() {
  player.update();
  player.show();
}

function drawInfo() {
  // *** 重要：绘制分数和倒计时，不受 translate 影响 ***
  push(); // 保存当前坐标系
  resetMatrix(); // 取消 translate() 的影响，恢复到屏幕原点

  // 显示分数（左上角）
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  // **修正计时器在右上角**
  textAlign(RIGHT, TOP);
  text("Time: " + nf(remainingTime, 2, 1) + "s", windowWidth - 20, 20); // **改为 windowWidth**
  
  // print level
  if (levelManager && levelManager.currentLevel) {
  let lv = levelManager.currentLevel.levelNumber ?? "?";
  text("Level: " + lv, windowWidth - 20, 50);  // 比 time 向下20~30像素
  }

  //print mode
   // 打印难度
  let modeText = isHardMode ? "Hard" : "Easy";
  text("Mode: " + modeText, windowWidth - 20, 80);


  //
  skillSystem.drawIcon();  // ✅ 画技能图标
  
  
 

  //玩家坐标
  
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Player X: ${floor(player.pos.x)}`, 20, 50);
  text(`Player Y: ${floor(player.pos.y)}`, 20, 80);

  // 显示玩家 HP 信息
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  let printHP = floor(player.hp.currentHP);  // 🌟 取整当前血量
  text(`Player HP: ${printHP} / ${player.hp.maxHP}`, 20, 110);
  
  

  // **在此处插入警告消息渲染**
  if (millis() < warningTimer) {
    //push();
    //resetMatrix(); // 重置坐标系，防止 translate() 影响
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(warningMessage, windowWidth / 2, windowHeight / 2 - 100);
    pop();
  }
}



//游戏结束屏幕
function showGameOverScreen() {
  push();
  resetMatrix(); // 取消 translate 变换，恢复默认坐标
  clear(); // 确保整个屏幕填充黑色

  fill(255, 0, 0);
  textSize(50);
  textAlign(CENTER, CENTER);

  // **使用 windowWidth 和 windowHeight 确保文本在屏幕中央**
  text("Game Over", windowWidth / 2, windowHeight / 2 - 50);

  textSize(30);

  const finalScore = (levelManager.currentLevel && levelManager.currentLevel.totalScore)
                 ? levelManager.currentLevel.totalScore
                 : score;  // 如果没有关卡就用当前 score
  text("Final Score: " + finalScore, windowWidth / 2, windowHeight / 2);
  text("Press 'R' to Restart", windowWidth / 2, windowHeight / 2 + 40);

  pop();
}


function keyPressed() {
  keys[key] = true;                    // 记录按下的按键

  /* ---------- 全局快捷 ---------- */
  if ((key === 'R' || key === 'r') && gameOver) {   // R：重新开始
    restartGame();
    return;
  }
  if (key === 'M' || key === 'm') {                 // M：回主菜单
    goToMainMenu();
    return;
  }

  /* ---------- 调试跳关 ---------- */
  if (key === '1') gamelevel = 1;
  if (key === '2') gamelevel = 2;

  /* ---------- 普攻 ---------- */
  if (key.toLowerCase() === 'a') {
    if (!player.isCharging) {          // 正在蓄力时禁止普通攻击
      player.meleeAttack.trigger();
      if (!player.isCharging) {
         player.meleeAttack.trigger();
         SFX.play("attack");
        }
      
    } else {
      console.log("⚠️ 蓄力中，A 键被忽略");
    }
    // 关卡 1 需要知道玩家攻击
    if (levelManager?.currentLevel instanceof Level1) {
      levelManager.currentLevel.handlePlayerAttack();
    }
  }

  /* ---------- 让当前关卡/技能系统处理 ---------- */
  levelManager?.currentLevel?.handleKeyPressed?.(key);
  skillSystem.tryActivateSkill(key);
}

function keyReleased() {
  keys[key] = false; // 记录松开的按键
}



 //重新开始
 function restartGame() {
  gameOver = false;
  player.hp.currentHP = player.hp.maxHP;  // 复活时满血（保险）
  player.hp.isDead = false; // 重置死亡状态
  resumeScore = score;                              // 保留分数 or 重置，看需要
  startTime = millis();

  player.speed = player.baseSpeed || 4;  // 重置速度（4 是默认值）

 // 🟢 清空敌人、子弹、奖励
  enemies.length = 0;
  bullets.length = 0;
  timeBonuses.length = 0;

   // 🟢 重置计数器
  ambushSpawnedCount = 0;
  stealthSpawnedCount = 0;
  ambushTimer = 0;
  stealthTimer = 0;


  // 获取当前关卡索引
  const currentIndex = levelManager.levels.indexOf(levelManager.currentLevel);
  if (currentIndex >= 0) {
      console.log(`重新加载当前关卡 Level ${currentIndex + 1}`);
      levelManager.loadLevel(currentIndex);
  } else {
      console.warn("未找到当前关卡索引，默认回到第1关");
      levelManager.loadLevel(0);
  }
}

function generateValidEnemyPosition(minDistance) {
  let pos;
  let safe = false;

  while (!safe) {
    pos = createVector(random(-width, width), random(-height, height));
    safe = true;

    // ✅ 1. 与玩家保持足够距离
    if (dist(pos.x, pos.y, player.pos.x, player.pos.y) < minDistance) {
      safe = false;
      continue;
    }

    // ✅ 2. 与其他敌人保持一定距离（避免重叠）
    for (let other of enemies) {
      if (dist(pos.x, pos.y, other.pos.x, other.pos.y) < minDistance) {
        safe = false;
        break;
      }
    }
  }

  return pos;
}


function generateOutsideViewPosition(maxAttempts = 20) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    let x = random(-width, width);
    let y = random(-height, height);

    let viewLeft   = player.pos.x - windowWidth * 0.75;
    let viewRight  = player.pos.x + windowWidth * 0.75;
    let viewTop    = player.pos.y - windowHeight * 0.75;
    let viewBottom = player.pos.y + windowHeight * 0.75;

    if (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom) {
      return createVector(x, y);
    }

    attempt++;
  }

  // fallback 强制生成远离玩家的位置
  return createVector(
    player.pos.x + random([-1, 1]) * 1000,
    player.pos.y + random([-1, 1]) * 1000
  );
}

function generateStealthEnemyAhead(playerPos, playerDir, distance = 600, spread = 200) {
  let normDir = playerDir.copy().normalize();  // ✅ 确保单位向量
  let base = p5.Vector.add(playerPos, p5.Vector.mult(normDir, distance));
  let offset = createVector(random(-spread, spread), random(-spread, spread));
  return p5.Vector.add(base, offset);
}


function generateAmbushOutsideViewPosition(playerPos, playerDir, baseDistance = 800, angleRange = PI / 4, maxAttempts = 20) {
  const normDir = playerDir.copy().normalize();

  // 地图边界范围
  const mapLeft = -width;
  const mapRight = width;
  const mapTop = -height;
  const mapBottom = height;

  let attempt = 0;
  while (attempt < maxAttempts) {
    const angleOffset = random(-angleRange, angleRange);
    const spawnAngle = normDir.heading() + angleOffset;

    const spawnVector = p5.Vector.fromAngle(spawnAngle).mult(baseDistance + random(-100, 100));
    const candidate = p5.Vector.add(playerPos, spawnVector);

    const viewLeft   = playerPos.x - windowWidth * 0.75;
    const viewRight  = playerPos.x + windowWidth * 0.75;
    const viewTop    = playerPos.y - windowHeight * 0.75;
    const viewBottom = playerPos.y + windowHeight * 0.75;

    const inView = (
      candidate.x >= viewLeft && candidate.x <= viewRight &&
      candidate.y >= viewTop  && candidate.y <= viewBottom
    );

    const inMap = (
      candidate.x >= mapLeft && candidate.x <= mapRight &&
      candidate.y >= mapTop  && candidate.y <= mapBottom
    );

    // ✅ 满足：视野外 且 地图内
    if (!inView && inMap) {
      return candidate;
    }

    attempt++;
  }

  // fallback：向前方生成并限制在地图边界内
  const fallback = p5.Vector.add(playerPos, p5.Vector.mult(normDir, 1000));
  fallback.x = constrain(fallback.x, mapLeft, mapRight);
  fallback.y = constrain(fallback.y, mapTop, mapBottom);
  return fallback;
}




function updateStealthSpawn(max) {
  stealthTimer++;
  if (stealthTimer % 120 === 0) { // 每2秒
    if (stealthSpawnedCount >= max) return;

    let dir = player.getDirection();
    if (dir.mag() < 0.01) return;

    let pos = generateStealthEnemyAhead(player.pos, dir);
    enemies.push(new StealthEnemy(pos.x, pos.y));
    stealthSpawnedCount++; // ✅ 每生成一个就增加
    console.log(`生成隐形敌人 ${stealthSpawnedCount}/${max}`, pos); 
  }
}
  


function updateAmbushSpawn(max) {
  ambushTimer++;

  if (ambushTimer % 360 === 0) { // 每 6 秒
    if (ambushSpawnedCount >= max) return;

    let dir = player.getDirection?.() || createVector(1, 0);
    if (dir.mag() < 0.01) dir = createVector(1, 0); // 保底方向

    const spawnPos = generateAmbushOutsideViewPosition(player.pos, dir);

    enemies.push(new AmbushEnemy(spawnPos.x, spawnPos.y));
    ambushSpawnedCount++; // ✅ 每生成一个就加1
    console.log(`伏击怪生成 ${ambushSpawnedCount}/${max} 于`, spawnPos);
  }
}


//修改关卡背景zc 5.9
function sendLevelToBackground(levelNumber) {
  const bgFrame = document.getElementById('bgFrame');
  if (bgFrame && bgFrame.contentWindow) {
    bgFrame.contentWindow.postMessage({
      type: 'level',
      level: levelNumber
    }, '*');
    console.log(`背景层已收到关卡编号：BG${levelNumber}.png`);
  } else {
    console.warn("未找到背景 iframe，无法更新背景图片");
  }
}

// 关卡管理
class LevelManager {
  constructor() {
    this.levels = [];     // 所有关卡
    this.currentLevel = null;
  }

  addLevel(level) {
    this.levels.push(level);
  }


  //修改关卡背景zc5.9
  loadLevel(index) {
  const prevLevel = this.currentLevel; 
  this.currentLevel = this.levels[index];
  console.log(`加载 Level ${index + 1}`);


  this.currentLevel.startingScore = prevLevel
    ? prevLevel.totalScore
    : savedCumulativeScore || 0;
  this.currentLevel.start();


  // 通知背景层更换背景图
  sendLevelToBackground(this.currentLevel.levelNumber);
  // 播放对应的背景音乐
  playLevelBGM(this.currentLevel.levelNumber);
  // 每次加载新关卡后，重新绑定系统
  collisionManager = new CollisionManager(player, enemies, bullets, timeBonuses);
  player.meleeAttack = new MeleeAttack(player, enemies);
}

  loadNextLevel() {
    if (!this.currentLevel) {
        console.warn("当前没有加载任何关卡，无法跳转下一关");
        return;
    }
    const currentIndex = this.levels.indexOf(this.currentLevel);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= this.levels.length) {
        console.log("🎉 已经完成所有关卡！");
        this.currentLevel = null;
    } else {
        this.loadLevel(nextIndex);
    }
  }

  update() {
    if (this.currentLevel && typeof this.currentLevel.update === 'function') {
      this.currentLevel.update();
    }
  }

  draw() {
    if (this.currentLevel && typeof this.currentLevel.draw === 'function') {
      this.currentLevel.draw();
    }
  }
}



class BaseLevel {
  constructor(name) {
    this.name      = name;
    this.baseScore = 0;
    this.timeBonus = 0;
    this.totalScore= 0;
    this.startingScore = 0;  // 进入本关时的“起点分数”
    this.blackHoles = [];
    this.finished       = false;   // 关卡是否已结束
    this.postGameStage  = 0;       // 0‑结算信息；1‑Save / Continue

    this.tipCharIndex = 0;            // 当前显示到哪个字符
    this.tipStartTime = 0;            // 动画开始时间
    this.tipCharDelay = 40;           // 每个字符的显示间隔（毫秒）

  }

  start() {
    console.log(`开始关卡: ${this.name}`);
    player.hp.currentHP = player.hp.maxHP;    // 每关开局满血
    this.resetSkillsCooldown(); // 重置技能冷却时间

    // 玩家归位
    player.pos.set(0, 0);

    // 清空数组
    enemies.length = 0;
    bullets.length = 0;
    timeBonuses.length = 0;


    // score = this.startingScore || 0;
    // 优先使用 resumeScore，如果没有才使用 startingScore
  if (resumeScore !== null) {
    score = resumeScore;
    console.log("使用 resumeScore 恢复分数:", score);
    resumeScore = null;  // 用过一次就清空，防止影响后续关卡
  } else {
    score = this.startingScore || 0;
    console.log("使用 startingScore 初始化分数:", score);
}


  }

  update() {
    // 关卡的逻辑更新，比如特殊机制
    // 更新奖励物
    for (let i = timeBonuses.length - 1; i >= 0; i--) {
          timeBonuses[i].show();
    }
    
    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          enemy.update();
          enemy.show();
  
          if (enemy.isExplosionFinished()) {
              enemies.splice(i, 1);
          }
    }

  }

  draw() {
    // 关卡的特效、提示


    push();
    resetMatrix();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);

    if (!this.tipExpireTime || millis() < this.tipExpireTime) {
    let now = millis();
    let elapsed = now - this.tipStartTime;
    this.tipCharIndex = Math.floor(elapsed / this.tipCharDelay);

    let displayedText = this.tip.substring(0, this.tipCharIndex);
    text(displayedText, windowWidth / 2, 80);
  }


    // 如果关卡完成，弹出结算界面
    if (this.finished) {
        this.showSummaryScreen();
    }


    pop();
  }

  setTipAnimated(msg, duration = 5000) {
    this.tip = msg;
    this.tipExpireTime = millis() + duration;
    this.tipStartTime = millis();
    this.tipCharIndex = 0;
}


  // 通用结算方法
  finalizeScore() {
    this.baseScore = score;
    this.timeBonus = Math.floor(remainingTime) * 10;
    this.totalScore= this.baseScore + this.timeBonus;

    savedCumulativeScore = this.totalScore;
  }

  onTimeUp() {
    if (!this.finished) {
      this.tip = "Finished！";
      this.tipExpireTime = null;
      this.finished = true;
      this.finalizeScore();
  }// 可被子类覆写


  }

  resetSkillsCooldown() {
    if (player.selectedSkills) {
        for (let skill of player.selectedSkills) {
            if (skill) {
                skill.cooldownRemaining = 0;
            }
        }
    }
}
  updateBlackHoles() {
  // 黑洞更新（可为空）
  for (let bh of this.blackHoles || []) {
    bh.update(player);
    bh.show();
  } 
}
  updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      bullets[i].show();
      if (!bullets[i].alive) {
        bullets.splice(i, 1);
      }
    }
  }

  generateCommonEnemy(max) {
  let count = 0;
  let interval = 1000; // 0.5 秒

  let spawnTimer = setInterval(() => {
    if (count >= max) {
      clearInterval(spawnTimer);
      return;
    }

    let pos = generateOutsideViewPosition();  
    enemies.push(new CommonEnemy(pos.x, pos.y));
    count++;
  }, interval);

  console.log("开始生成普通小怪（逐个生成）:", max);
}

  generateFollowEnemy(max) {
  let count = 0;
  let interval = 1000;

  let spawnTimer = setInterval(() => {
    if (count >= max) {
      clearInterval(spawnTimer);
      return;
    }

    let pos = generateOutsideViewPosition();  
    enemies.push(new FollowEnemy(pos.x, pos.y));
    count++;
  }, interval);

  console.log("开始生成跟随怪（逐个生成）:", max);
}

  generateBulletEnemy(max) {
  for (let i = 0; i < max; i++) {
    let pos = generateValidEnemyPosition(300); 
    enemies.push(new BulletEnemy(pos.x, pos.y));  
  }
  console.log("生成弹幕怪,数量:", max);
}

generateDangerBlackHole(max) {
  for (let i = 0; i < max; i++) {
    let pos = generateValidEnemyPosition(300);
    this.blackHoles.push(new BlackHole(pos.x, pos.y, "danger"));
  }
  console.log("生成危险黑洞,数量:", max);
}

generateHealBlackHole(max) {
  for (let i = 0; i < max; i++) {
    let pos = generateValidEnemyPosition(300);
    this.blackHoles.push(new BlackHole(pos.x, pos.y, "heal"));
  }
  console.log("生成回血黑洞,数量:", max);
}

  generateTimeBonus(max) {
    for (let i = 0; i < max; i++) {
      let pos = generateValidEnemyPosition(300);  // 
      timeBonuses.push(new TimeBonus(pos.x, pos.y, 15));
    }
    console.log("生成时间奖励,数量:", max);
  }  // 通用结算画面
  
    showSummaryScreen() {
    fill(0, 150);
    rect(0, 0, windowWidth, windowHeight);

    fill(255);
    textAlign(CENTER, CENTER);

    if (this.postGameStage === 0) {
    // 第一步：结算信息 + 按任意键继续
    textSize(40);
    text(`🎉 ${this.name} 完成！`, windowWidth / 2, windowHeight / 2 - 100);

    textSize(24);
    text(`Area Score: ${this.baseScore}`, windowWidth / 2, windowHeight / 2 - 30);
    text(`Time Bonus: ${this.timeBonus}`, windowWidth / 2, windowHeight / 2 + 10);
    text(`Total Score: ${this.totalScore}`, windowWidth / 2, windowHeight / 2 + 50);

    textSize(20);
    text("Press any key to continue", windowWidth / 2, windowHeight / 2 + 120);
    }

    
    else if (this.postGameStage === 1) {
      // 第二步：保存/继续界面
      textSize(24);
      text("Save current progress(press 'S')", windowWidth / 2, windowHeight / 2);
      
    }
  }

  /* ---------- 键盘交互 ---------- */
  async handleKeyPressed(key) {
    if (!this.finished) return;                // 只在关卡结束后响应

    /* 调试：直接跳关 */
    if (['2','3','4','5'].includes(key)) {
      const idx = Number(key) - 1;
      console.log(`🔄 跳转到 Level ${key}`);
      levelManager.loadLevel(idx);
      return;
    }

    /* 结算 → Save / Continue 选择 */
    if (this.postGameStage === 0) {
      this.postGameStage = 1;                  // 任意键继续
      return;
    }

    if (this.postGameStage === 1) {
      if (key === 'S' || key === 's') {
        await this.saveProgressToSupabase();   // 存档
        levelManager.loadNextLevel();          // 下一关
      }
      
    }
  }

  /* ---------- 保存到 Supabase ---------- */
  async saveProgressToSupabase() {
    // 本关获得的分数
    const gained = this.totalScore;  
    // 新的累计分数
    const newCumulative = gained;
    const payload = {
      current_level : this.levelNumber,            // 下一关
      skills        : player.selectedSkills.map(s => s.name),
      cumulative_score : newCumulative 
    };

    const { error } = await supabase
      .from('saves')
      .update(payload)
      .eq('id', saveId);

    if (error) {
      alert('保存失败：' + error.message);
      throw error;
    }
    console.log('✅ 进度已保存到 Supabase, 累计分数更新为', newCumulative);
    savedCumulativeScore = newCumulative;
      if (this.levelNumber === 5) {
         goToSummary();
      } else {
        goToShop();
}
  }

  isCompleted() {
    // 默认 false，子类可以重写，判断通关条件
    return false;
  }



}



// 第1关
class Level1 extends BaseLevel {
  constructor() {
    super("Level 1");
    this.levelNumber = 1;  // 当前关卡编号
    // 阶段控制：
    // 0: 欢迎界面
    // 1: 移动提示
    // 2: 近战提示
    // 3: 敌人来袭
    // 4: 生存中
    // 5: 完成
    this.stage = 0;

    this.setTipAnimated("Welcome to the Epilogue, Hunter");
    this.playerHasMoved = false;
    this.attackCount = 0;

    this.countdownStarted = false;
    this.countdownStartTime = 0;
    this.remainingTime = 60;  // 1 分钟
    this.completed = false;

    this.tipExpireTime = null;  // 提示语消失的时间戳（单位：毫秒）
    this.finished = false;  // 标记关卡是否结束

    this.postGameStage = 0;  // 0=结算等待任意键，1=显示“Save/Continue”界面，2=存档界面

  }

  start() {
    super.start();
    // 玩家出现在屏幕中心
    player.pos.set(0, 0);
    // 清空原数组内容，而不是新建数组（确保外部对象正常工作）
    enemies.length = 0;
    timeBonuses.length = 0;
    bullets.length = 0;
  }

  update() {
    super.update();
    // 阶段 4：处理生存倒计时 & 敌人更新
    if (this.stage === 4) {
      // 检查全局倒计时
      if (!this.finished && remainingTime <= 0) {
          this.stage = 5;
          this.tip = "Finished！";
          this.tipExpireTime = null;
          this.finished = true;  // 标记结束

          // 结算分数
          this.finalizeScore();

      }
  
      // 判断敌人是否清空 & 时间是否还在倒计时中
      if (!this.finished && enemies.length === 0 && remainingTime > 0) {
          // 提前完成
          this.stage = 5;
          this.tip = "Finished！";
          this.tipExpireTime = null; 
          this.finished = true;  // 标记结束

          // 结算分数
          this.finalizeScore();
      }
      

    }
  }

  onTimeUp() {
    if (!this.finished) {
      console.log("Level1 时间到，正常结算");
      this.stage = 5;
      this.tip = "Finished！";
      this.tipExpireTime = null;
      this.finished = true;
      this.finalizeScore();
    }
  }


  draw() {
  super.draw();
  }



  // 提供给外部的事件监听方法
  handleKeyPressed(key) {
    if (this.stage === 0) {
      this.stage = 1;
      this.setTipAnimated("Use the arrow keys to move");
    }else {
      // 默认的处理交给 BaseLevel
      super.handleKeyPressed(key);
  }

    
  }

  handlePlayerMoved() {
    if (this.stage === 1) {
      this.stage = 2;
      this.setTipAnimated("Press A for melee attack");
    }
  }

  handlePlayerAttack() {
    if (this.stage === 2) {
      this.attackCount++;
      if (this.attackCount >= 8) {
        this.stage = 3;
        this.setTipAnimated("Excellent! A large wave of enemies is coming. Survive within the time limit!",10000);

        // 延迟 2 秒启动敌人/奖励刷怪
        setTimeout(() => {
          this.startWave();
        }, 2000);
      }
    }
  }

  startWave() {
    console.log("开始刷敌人 & 奖励");
    this.stage = 4;
    this.countdownStarted = true;

    // 启动全局倒计时（利用已有的 updateTimer 机制）
    timer = 60;  // 设置全局 60 秒
    startTime = millis();  // 重置全局倒计时起点

    // 不要重新赋值新数组，而是清空原有数组内容
    enemies.length = 0;
    timeBonuses.length = 0;
    bullets.length = 0;

    // 刷奖励物
    for (let i = 0; i < 3; i++) {
        timeBonuses.push(new TimeBonus(
            random(-width, width),
            random(-height, height),
            15
        ));
    }

    // 刷敌人（Common + Follow，全 1HP）
    let minSpawnDistance = player.r * 10;

    // 5 个 CommonEnemy
    for (let i = 0; i < 5; i++) {
        let pos = generateValidEnemyPosition(minSpawnDistance);
        let enemy = new CommonEnemy(pos.x, pos.y);
        enemy.hp = new HPSystem(1);  // 设置为一刀死
        enemies.push(enemy);
    }

    // 3 个 FollowEnemy
    for (let i = 0; i < 3; i++) {
        let pos = generateValidEnemyPosition(minSpawnDistance);
        let enemy = new FollowEnemy(pos.x, pos.y);
        enemy.hp = new HPSystem(1);  // 一刀死
        enemies.push(enemy);
    }
  }


}

// 第2关：伏击怪
class Level2 extends BaseLevel {
  constructor() {
      super("Level 2");
      this.levelNumber = 2;

      // 阶段控制：
      // 0: 初始提示
      // 1: 生存战中
      // 2: 完成
      this.stage = 0;

      this.tip = "Marked for death...The ambush is coming fast-stay alert!";
      this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒
      this.pauseShown = false;
      this.pausedForBlackHoleTip = false;

  }
  start() {
    super.start();
    console.log("Level2 已开始");

    // 初始化提示内容 + 定时消失
    this.tip = "Marked for death...The ambush is coming fast - stay alert!";
    this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒


    this.pauseTimer = millis() + 10000;  // 10秒后触发黑洞暂停提示

    // FollowEnemy
    this.generateFollowEnemy(isHardMode? 40 : 20); 
    // CommonEnemy
    this.generateCommonEnemy(isHardMode? 50 : 30); 

    //时间柱
    this.generateTimeBonus(3); // 刷奖励物

    // 刷黑洞
    this.generateDangerBlackHole(isHardMode? 7 : 5); // 刷危险黑洞
    this.generateHealBlackHole(isHardMode? 0 : 2); // 刷治疗黑洞

    // 设置倒计时
    timer = 60;
    startTime = millis();

    this.stage = 1;  // 切换到正式战斗阶段
  }

  update() {
    super.update();
    if (this.stage === 1) {
      updateAmbushSpawn (isHardMode ? 9 : 5); // ✅ 每帧尝试生成伏击怪
        
      // 检查黑洞提示是否触发
        if (!this.pauseShown && millis() > this.pauseTimer) {
            // gamePaused = true;
            this.setTipAnimated("Seek out the black holes🌀— some heal, some hurt!", 8000);
            // this.tipExpireTime = millis() + 8000;  // 自动显示 8 秒
            this.pauseShown = true;
        }

        // 检查完成
        if (!this.finished && remainingTime <= 0) {
            this.stage = 2;
            this.tip = "Finished！";
            this.finished = true;

            // 结算分数
            this.finalizeScore();
        }

        this.updateBlackHoles();  // 更新黑洞

        
    }
}
  

  
draw() {
    super.draw();
}

// 外部事件监听
handleKeyPressed(key) {
    super.handleKeyPressed(key);
}


}

// 出现隐形怪
class Level3 extends BaseLevel {
  constructor() {
    super("Level 3");
    this.levelNumber = 3;

    // 阶段控制：
    // 0: 初始提示
    // 1: 生存战中
    // 2: 完成
    this.stage = 0;

    this.tip = "Something's lurking in the dark... Run for your life!";
    this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒

  }

  start() {
    super.start();
    console.log("Level3 已开始");


    // 初始化提示内容 + 定时消失
    this.setTipAnimated("Something's lurking in the dark... Run for your life!",8000);


    // 刷敌人
    
    // FollowEnemy
    this.generateFollowEnemy(isHardMode? 12 : 8); 

    // CommonEnemy
    this.generateCommonEnemy(isHardMode? 17: 12); 

    // 刷黑洞
    this.generateDangerBlackHole(isHardMode? 5 : 3); // 刷危险黑洞
    
   this.generateHealBlackHole(isHardMode? 0 : 2); // 刷治疗黑洞

    // 刷奖励物
    this.generateTimeBonus(3); // 刷奖励物
    

    // 设置倒计时
    timer = 60;
    startTime = millis();

    this.stage = 1;  // 切换到正式战斗阶段
  }

  update() {
    super.update();
    if (this.stage === 1) {

        updateStealthSpawn(isHardMode ? 22 : 15); // ✅ 每帧尝试生成隐身怪
        updateAmbushSpawn(isHardMode ? 13 : 6); // ✅ 每帧尝试生成伏击怪
      // 检查完成
      if (!this.finished && remainingTime <= 0) {
        this.stage = 2;
        this.tip = "Finished！";
        this.finished = true;

        // 结算分数
        this.finalizeScore();
      }


     this.updateBlackHoles();  // 更新黑洞
}        
  }


  draw() {
    super.draw();
  }

  handleKeyPressed(key) {
    // 直接转发给 BaseLevel 处理 Save / Continue 等逻辑
    super.handleKeyPressed(key);
  }
}

// 出现弹幕怪
class Level4 extends BaseLevel{
  constructor() {
      super("Level 4");
      this.levelNumber = 4;
  
      // 阶段控制：
      // 0: 初始提示
      // 1: 生存战中
      // 2: 完成
      this.stage = 0;
  
      this.tip = "Something wicked this way comes! Dodge their bullets!";
      this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒
    }

    start() {
      super.start();
      console.log("Level4 已开始");
  
  
      // 初始化提示内容 + 定时消失
      this.setTipAnimated("Something wicked this way comes! Dodge their bullets!", 8000);
  
  
     
  
      // BulletEnemy（弹幕怪）
      this.generateBulletEnemy(isHardMode? 5 : 3); // 刷弹幕怪
  
      // FollowEnemy
      this.generateFollowEnemy(isHardMode? 15 : 10);
  
      // CommonEnemy
      this.generateCommonEnemy(isHardMode? 20 : 15);
  
      // 刷黑洞
      this.generateDangerBlackHole(isHardMode? 4 : 2); // 刷危险黑洞
      
      this.generateHealBlackHole(isHardMode? 0 : 1); // 刷治疗黑洞
  
      // 刷奖励物
      this.generateTimeBonus(3); // 刷奖励物
      
  
      // 设置倒计时
      timer = 60;
      startTime = millis();
  
      this.stage = 1;  // 切换到正式战斗阶段
    }
update() {
  super.update();
  if (this.stage === 1) {
     updateStealthSpawn(isHardMode ? 35 : 25); // ✅ 每帧尝试生成隐身怪
        updateAmbushSpawn(isHardMode ? 15 : 9); // ✅ 每帧尝试生成伏击怪
    // 检查完成
    if (!this.finished && remainingTime <= 0) {
      this.stage = 2;
      this.tip = "Finished！";
      this.finished = true;

      // 结算分数
      this.finalizeScore();
    }


     this.updateBlackHoles();  // 更新黑洞

     this.updateBullets();  // 更新子弹
  }
}

draw() {
  super.draw();
}

handleKeyPressed(key) {
  // 直接转发给 BaseLevel 处理 Save / Continue 等逻辑
  super.handleKeyPressed(key);
}


}


class Level5 extends BaseLevel{
  constructor(){
      super("Level 5");
      this.levelNumber = 5;
  
      // 阶段控制：
      // 0: 初始提示
      // 1: 生存战中
      // 2: 完成
      this.stage = 0;
  
      this.tip = "So you've made it this far... Final battle begins now!";
      this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒
  }

  start() {
    super.start();

    // 初始化提示内容 + 定时消失
    this.setTipAnimated("So you've made it this far... Final battle begins now!",8000);
    //以下是测试boss内容
    const bossPos = createVector(0, -250);    // 出现在玩家正上方 250 像素
    boss = new Boss(bossPos.x, bossPos.y);    // boss 是全局 let 变量
    enemies.push(boss);                       // 加入敌人数组

   
  }

  update(){
    super.update();

    /* ---------- A. 所有阶段都更新 / 绘制敌人（含 Boss） ---------- */
  //这里硬编码了一部分，不然看不到bullet类
    if (boss && boss.towerActive) {
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].show();
        if (!bullets[i].alive) bullets.splice(i, 1);
    }
  }

      // 阶段 4：处理生存倒计时 & 敌人更新
  if (this.stage === 4) {
    // 检查全局倒计时
    if (!this.finished && remainingTime <= 0) {
          this.stage = 5;
          this.tip = "Finished！";
          this.tipExpireTime = null;
          this.finished = true;  // 标记结束

          // 结算分数
          this.finalizeScore();

      }
  
      // 更新奖励物
    for (let i = timeBonuses.length - 1; i >= 0; i--) {
          timeBonuses[i].show();
      }
  
    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          enemy.update();
          enemy.show();
  
          if (enemy.isExplosionFinished()) {
              enemies.splice(i, 1);
          }
    }
  
    // 更新子弹（如果有的话）
    for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].update();
          bullets[i].show();
          if (!bullets[i].alive) {
              bullets.splice(i, 1);
          }
      }


   
  
      // 判断敌人是否清空 & 时间是否还在倒计时中
      if (!this.finished && enemies.length === 0 && remainingTime > 0) {
          // 提前完成
          this.stage = 5;
          this.tip = "Finished！";
          this.tipExpireTime = null; 
          this.finished = true;  // 标记结束

          // 结算分数
          this.finalizeScore();
      }
    }

    if (!this.finished && boss && boss.hp.isDead) {
      this.finished = true;
      this.tip = "Victory!";
      this.finalizeScore(); // 正常计算 totalScore
  }





  }


  onTimeUp() {
    
  }

  getFinalRank(score) {
  if (score >= 1500) return 'S';
  if (score >= 1000) return 'A';
  return 'B';
}

  getFinalComment(rank) {
  switch (rank) {
    case 'S': return "S for Space legend!";
    case 'A': return "A for Almost perfect.";
    case 'B': return "Aliens laughed, but some died.";
    default:  return "";
  }
}

  showSummaryScreen() {
  fill(0, 180);
  rect(0, 0, windowWidth, windowHeight);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(28);
  text(`Total Score: ${this.totalScore}`, windowWidth / 2, windowHeight / 2 - 60);

  const rank = this.getFinalRank(this.totalScore);
  const comment = this.getFinalComment(rank);

  textSize(36);
  text(`Your Rank: ${rank}`, windowWidth / 2, windowHeight / 2 + 0);

  textSize(24);
  text(comment, windowWidth / 2, windowHeight / 2 + 50);
}

handleKeyPressed(key) {
  // 其他按键交给父类处理（保存、继续等）
  super.handleKeyPressed(key);
}



  draw() {
    super.draw();
  }

}



class Player {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = 35;
    this.speed = 4;


    
    this.hp = new HPSystem(600); // 初始血量100
    

    this.baseAttack = 40;  // 原本的基础攻击力
    this.buffAttack = this.baseAttack; // 当前生效的攻击力（默认 = 基础）

    this.selectedSkills = []; // 玩家已装备的技能

      //普攻和静态判断
    this.lastDirection = "right";  // 记录朝向
    this.isAttacking   = false;    // 攻击动画中
    this.attackImage   = null;     // 当前播放的 gif

    this.isCharging = false;
    this.damageMultiplier = 1; // 默认受伤为100%

    //新增流派系统
    this.faction   = "normal";              // <- 初始流派
    this.spriteMgr = new SpriteManager(this);
    
    this.pendingBonusShield = 0; // 存储由电击被动转化的护盾值
    this.isInBloodFury = false; // 是否处于血怒状态

    this.defaultSpeed = 4;           // 你的正常速度值（按需修改）
    this.inBlackHole = false;        // 是否在黑洞内
    this.blackHoleExitTime = null;   // 上次退出黑洞的时间

    this.furyParticles = []; // 血怒火焰粒子数组

}


  update() {
    if (this.isInBloodFury) {
  // 每帧添加一颗火焰粒子
  const p = {
    pos: this.pos.copy().add(p5.Vector.random2D().mult(random(10, 25))), // ← 更远的半径范围
vel: createVector(random(-1, 1), random(-2, -1)), // ← 更强的上飘速度
    alpha: 255,
    size: random(6, 10),
    color: color(255, random(80, 120), 0)
  };
  this.furyParticles.push(p);
}
    
    this.updateSkills(); // 更新技能状态

    
    this.updateMovement(); // 更新移动状态

    // 更新粒子
  for (let p of this.furyParticles) {
    p.pos.add(p.vel);
    p.alpha -= 5;
    p.size *= 0.95;
  }
    this.furyParticles = this.furyParticles.filter(p => p.alpha > 0);
  
  }

    
    
    
  
  

  updateSkills() {
    for (let skill of this.selectedSkills) {
      if (skill && typeof skill.update === 'function') {
        skill.update(); // 调用技能自身的 update 方法
      }
    }
  }
  
  updateMovement() {
     if (this.isCharging) return; // ✅ 蓄力中，完全不能移动
    
    let move = createVector(0, 0);

    // **检测按键输入，调整移动方向**
    if (keys['ArrowUp']) { 
      move.y -= 1; 
    }
    if (keys['ArrowDown']) { 
      move.y += 1; 
    }
    if (keys['ArrowLeft']) { 
      move.x -= 1; 
      this.lastDirection = "left";
    }
    if (keys['ArrowRight']) { 
      move.x += 1; 
      this.lastDirection = "right";
    }
    

    
    // **标准化方向，防止对角线加速**
    if (move.mag() > 0) {
      move.setMag(this.speed);
      this.pos.add(move);
    // 告诉 Level1 玩家移动了
    if (levelManager && levelManager.currentLevel instanceof Level1) {
      levelManager.currentLevel.handlePlayerMoved();
    }

    }

    // **限制玩家不超出地图范围**
    this.pos.x = constrain(this.pos.x, -width + this.r, width -this.r);
    this.pos.y = constrain(this.pos.y, -height + this.r, height - this.r);
    
    
    if (this.blackHoleExitTime) {
    if (millis() - this.blackHoleExitTime > 6000) {  // 8秒
      this.speed = this.defaultSpeed;  // 恢复速度
      this.blackHoleExitTime = null;   // 清除定时器
    }
  }
}
  
  show() {
    // ✅ 先画拖影
  for (let skill of this.selectedSkills) {
    if (skill instanceof DashSkill) {
      skill.showTrail();
    }
  }
    if (this.isInBloodFury) {
  push();
  noStroke();
  for (let p of this.furyParticles) {
    fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha);
    ellipse(p.pos.x, p.pos.y, p.size);
  }
  pop();
}
    
    //加载玩家贴图
     // 1️⃣ 选 GIF，不要再读 this.attackImage 了，直接用右向资源
     const gifToDraw = this.spriteMgr.chooseGif();         // ← 调用上面的函数流派系统修改        // ← 调用上面的函数

  // 2️⃣ 判断是否要水平翻转
  let flip = this.lastDirection === "left";

  if (gifToDraw) {
    push();
    translate(this.pos.x, this.pos.y);
    if (flip) scale(-1, 1);            // ← 镜像翻转
    imageMode(CENTER);
    image(
      gifToDraw,
      0, 0,
      this.r * (this.isAttacking ? 5.5 : 5),
      this.r * (this.isAttacking ? 5.5 : 5)
    );
    pop();
  } else {
    push();
  fill(255, 255, 0);   // ⬅️ 统一用状态色
  ellipse(this.pos.x, this.pos.y, this.r * 2);
  pop();
  }
    
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
    this.hp.drawShield(this.pos.x, this.pos.y, this.r, this.lastDirection);

  }


  receiveDamage(rawDamage, source = null) {
  if (source?.isReflected) return;
  if (this.isInvincibleFromDash) return;

  let dmg = rawDamage;

  // 蓝色护盾吸收
  if (this.hp.shieldHP > 0) {
    const absorb = Math.min(dmg, this.hp.shieldHP);
    this.hp.shieldHP -= absorb;
    dmg -= absorb;
    console.log(`🛡️主护盾吸收了 ${absorb}`);
  }

  // 金色 bonus 护盾吸收
  if (dmg > 0 && this.hp.bonusShieldHP > 0) {
    const absorb = Math.min(dmg, this.hp.bonusShieldHP);
    this.hp.bonusShieldHP -= absorb;
    dmg -= absorb;
    console.log(`bonus 护盾吸收了 ${absorb}`);
  }

  // 更新绘图用护盾状态
  this.hp.setShield(this.hp.shieldHP, this.hp.maxShieldHP, this.hp.bonusShieldHP, this.hp.maxBonusShieldHP);

  // 剩余伤害扣血
  if (dmg > 0) {
     let modeDamage = dmg;
    
     if (isHardMode){
       modeDamage = 1.5 * dmg;
       console.log("hardmode下伤害变为", modeDamage);
    }
    const damage = floor(modeDamage * this.damageMultiplier);
    this.hp.takeDamage(damage);
    console.log(`玩家受到 ${damage} 点伤害`);
  }

  if (!this.hp.isAlive()) {
    gameOver = true
    console.log("玩家死亡！");
  }
}

  isCurrentlyInvincible() {
    if (this.isInvincibleFromDash) console.log("⚡ Dash 提供无敌");
    if (this.isInvincibleFromReflect) console.log("🛡️ Reflect 提供无敌");
    return this.isInvincibleFromDash || this.isInvincibleFromReflect;
  }   
  getDirection() {
  if (!this.prevPos) this.prevPos = this.pos.copy();
  let dir = p5.Vector.sub(this.pos, this.prevPos);
  this.prevPos = this.pos.copy();
  return dir;
}
  


}


class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);  // Initial position of enemies
    this.hp = new HPSystem(60);     
    this.dead = false;              // Death Mark
  
    this.exploding = false; // Whether to play death effects
    this.explodeStartTime = 0; // Death animation start time
    this.explodeDuration = 1000; 

    this.explosion = null;

     // Each enemy has its own attack cooldown time
     this.nextHitTime = 0;
     this.hitCooldown = 500;

     this.contactDamage = 10; // Default contact damage
  
  
  }


  
  updateDeath() {
    if (!this.hp.isAlive() && !this.dead) {
      this.dead = true;
      this.onDeath();
    }
  }

  onDeath() {
    score += 10;
    console.log("敌人死亡 +10 分");

    this.exploding = true;
    this.explodeStartTime = millis();

    this.exploding = true;
    this.explosion = new PixelExplosion(this.pos);

     // 检查玩家有没有装备"冲刺重置"技能
  for (let skill of skillSystem.selectedSkills) {
    if (skill instanceof DashResetSkill) {
      skill.onEnemyKilled();
  }
      // 通知技能：有敌人死了
  }
  }
  

  update() {
    
    this.updateDeath(); // ✅ 父类负责统一的“死亡检测逻辑”
  }

  show() {
    if (this.exploding&& this.explosion) {
      this.explosion.updateAndDraw();
    } else {
      fill(255, 0, 0);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
      this.hp.drawHP(this.pos.x, this.pos.y, this.r);
    }
  }
  drawSprite(img, x, y, r, flip) {
    let scaleF = this.scaleFactor || 1.0;
    push();
    translate(x, y);
    scale(flip ? -1 : 1, 1);
    imageMode(CENTER);
    image(img, 0, 0, r * 2 * scaleF, r * 2 * scaleF); 
    pop();
  }

  isExplosionFinished() {
    return this.exploding && this.explosion && this.explosion.isFinished();
}
}

class FollowEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 35;
    this.speed = 3.6; // 速度稍慢于玩家 
    this.hp = new HPSystem(100); 
    this.contactDamage = 15; // 接触伤害
    this.scaleFactor = 2;//大小
    this.spriteImg = follow_gif;  // 比如 bulletEnemyImg
    this.flip = false;  // 初始是否翻转，可以动态更新
  }

  update() {
    this.applySeparation(enemies); // 防止敌人之间重叠

    const distanceToPlayer = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
    const stopDistance = this.r + player.r;

    if (distanceToPlayer > stopDistance) {
      let dir = p5.Vector.sub(player.pos, this.pos);
      dir.setMag(this.speed);
      this.pos.add(dir);
    }
    this.flip = (player.pos.x > this.pos.x); // 玩家在右边就翻转
    super.update(); // 死亡检测等
  }

  applySeparation(others) {
    let separationForce = createVector(0, 0);
    let desiredSeparation = this.r * 2;
    let count = 0;

    for (let other of others) {
      if (other === this || !other.hp.isAlive()) continue;

      let d = p5.Vector.dist(this.pos, other.pos);
      if (d < desiredSeparation && d > 0) {
        let diff = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
        separationForce.add(diff);
        count++;
      }
    }

    if (count > 0) {
      separationForce.div(count);
      separationForce.setMag(1.5);
      this.pos.add(separationForce);
    }
  }

  show() { 
    if (this.exploding && this.explosion) {
      super.show(); // 播放爆炸动画
      return;
    }

    this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
  }
}




class AmbushEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 删除 r 和 mode 参数
    this.r = 40; // ✅ 设置自己的半径
    this.hp = new HPSystem(80); // ✅ 设置自己的血量（可选）
    this.contactDamage = 15; // 接触伤害
    this.scaleFactor = 2;//大小
    this.ambushImg = ambush_gif;   // 伏击状态的图像
    this.dashGif = ambushactive_gif;       // 冲刺状态的 GIF 动画
    this.flip = player.pos.x < x; // 🟢 伏击状态：初始化翻转逻辑（只判断一次）
    this.spriteImg = this.ambushImg; // 初始为伏击图

    this.isChasing = false;
    this.isDashing = false;
    this.isResting = false;
    this.dashStartTime = 0;
    this.restStartTime = 0;
    this.dushSpeed = 4;
    this.maxDashSpeed = 20;
    this.dashDir = createVector(0, 0);
  }

  update() {
    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (!this.isChasing && distance < 200) {
      this.isChasing = true;
      this.isDashing = true;
      this.dashStartTime = millis();
      this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
      this.spriteImg = this.dashGif;  // 激活状态切换贴图
    }

    if (this.isDashing) {
      let elapsedTime = millis() - this.dashStartTime;
      let acceleration = map(elapsedTime, 0, 2000, 0, this.maxDashSpeed - this.dushSpeed);
      let currentSpeed = this.dushSpeed + acceleration;
      let dashStep = p5.Vector.mult(this.dashDir, currentSpeed);
      this.pos.add(dashStep);

      if (elapsedTime > 2000) {
        this.isDashing = false;
        this.isResting = true;
        this.restStartTime = millis();
      }
    }

    if (this.isResting) {
      if (millis() - this.restStartTime > 500) {
        this.isResting = false;
        this.isDashing = true;
        this.dashStartTime = millis();
        this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
      }
    }
    this.flip = this.dashDir.x < 0; // 如果 dashDir 朝左，flip = true
    super.update(); // ✅ 调用父类 update()，执行死亡检测
  }

  show() {
    if (this.exploding && this.explosion) {
      super.show(); // 这时父类会绘制爆炸
      return;
    }
    
    this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
    
  }

  startDash() {
  // 如果已经冲刺或正在休息，不重复激活
  if (!this.isDashing && !this.isResting) {
    this.isChasing = true;
    this.isDashing = true;
    this.dashStartTime = millis();
    this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
    this.spriteImg = this.dashGif;
  }
}

}

class StealthEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 简化构造函数
    this.r = 35;
    this.hp = new HPSystem(100);
    this.contactDamage = 20; // 接触伤害
    this.scaleFactor = 2;//大小
    this.spriteImg = stealth_gif;  // 比如 bulletEnemyImg
    this.flip = false;  // 初始是否翻转，可以动态更新

    this.visibility = 0;
    this.detectRange = 350;
    this.chaseRange = 200;
    this.isChasing = false;
    this.stealthSpeed = 3;
    this.slowSpeed = 2;
    this.target = createVector(random(width * 2) - width, random(height * 2) - height); // ✅ 必须初始化
  }

  update() {
  this.applySeparation(enemies);

  let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

  // ✅ 显隐逻辑（线性渐变 0 ~ 255）
if (distance < this.chaseRange) {
  this.visibility = 255; // 完全显形
} else if (distance < this.detectRange) {
  // 距离在 chaseRange 和 detectRange 之间：线性插值
  this.visibility = map(distance, this.detectRange, this.chaseRange, 0, 255, true);
} else {
  this.visibility = 0; // 超出感应范围，完全隐身
}

// ✅ 行为逻辑（控制移动）
let dir;

if (distance < this.chaseRange) {
  this.isChasing = true;
  this.needsRepositioned = false;

  let minDist = this.r + player.r;
  if (distance >= minDist) {
    dir = p5.Vector.sub(player.pos, this.pos);
    dir.setMag(this.stealthSpeed); // 快速追击
    this.pos.add(dir);
  }

} else if (distance < this.detectRange) {
  this.isChasing = false;
  this.needsRepositioned = false;

  // 慢速跟随
  dir = p5.Vector.sub(player.pos, this.pos);
  dir.setMag(this.slowSpeed);
  this.pos.add(dir);

} else {
  this.isChasing = false;

  if (!this.needsRepositioned) {
    this.visibility -= 10;
    if (this.visibility <= 0) {
      let playerDir = player.getDirection?.() || createVector(1, 0);
      if (playerDir.mag() < 0.01) playerDir = createVector(1, 0);
      let newPos = generateStealthEnemyAhead(player.pos, playerDir);
      
      this.needsRepositioned = true;
      this.pos = newPos.copy();

      // ✅ ✅ ✅ 加上以下代码：解除减速状态！
  if (this.originalStealthSpeed !== undefined) {
    this.stealthSpeed = 3;
    
    console.log("隐身敌人恢复正常追击速度", this.stealthSpeed);
  }
  if (this.originalSlowSpeed !== undefined) {
    this.slowSpeed = 2;
    
     console.log("隐身敌人恢复正常跟随速度", this.slowSpeed);
  }
  
      console.log(`隐身敌人重新定位至：(${newPos.x.toFixed(2)}, ${newPos.y.toFixed(2)})`);
    }
  }
}

this.flip = (player.pos.x > this.pos.x);
super.update();
  
}

  applySeparation(others) {
    let separationForce = createVector(0, 0);
    let desiredSeparation = this.r * 2;
    let count = 0;

    for (let other of others) {
      if (other === this || !other.hp.isAlive()) continue;

      let d = p5.Vector.dist(this.pos, other.pos);
      if (d < desiredSeparation && d > 0) {
        let diff = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
        separationForce.add(diff);
        count++;
      }
    }

    if (count > 0) {
      separationForce.div(count);
      separationForce.setMag(1.5);
      this.pos.add(separationForce);
    }
  }

  


    show() {
      if (this.exploding && this.explosion) {
        super.show(); // 播放爆炸动画
        return;
      }
    
      // 完全隐身时不绘制
      if (this.visibility === 0) return;
    
      push(); 
       /*// 🟣 显示紫色感应范围圆圈（调试用）
      noFill();
      stroke(150, 0, 255, 255); // 低透明紫色
      strokeWeight(1);
      ellipse(this.pos.x, this.pos.y, this.detectRange * 2);

      noFill();
      stroke(255, 0, 0, 255); // 
      strokeWeight(1);
      ellipse(this.pos.x, this.pos.y, this.chaseRange * 2);
      */

      //this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
       // ✅ 显隐贴图绘制
      tint(255, this.visibility);
      this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
      noTint(); // 清除 tint 状态

      // 血条只在可见状态下绘制（并共享透明度）
      if (dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y) <= this.chaseRange) {
        this.hp.drawHP(this.pos.x, this.pos.y, this.r);
      }
    
      pop();
    }
    
}


//弹幕怪
class BulletEnemy extends Enemy {
  constructor(x, y, r) {
    super(x, y); // ✅ 调用父类构造函数
    this.r = 30; // ✅ 设置自己的半径
    this.fireCooldown = 2000; // 每次发射的间隔（ms）
    this.lastFireTime = millis();
    
    this.hp = new HPSystem(170);
    this.spriteImg = bulletenemy_gif; // 设置贴图
    this.scaleFactor = 4;//大小
    this.flip = false; 
  }

  update() {
    // bulletEnemy 不需要追玩家，它站桩发射
    if (millis() - this.lastFireTime >= this.fireCooldown) {
      this.fire();
      this.lastFireTime = millis();
    }

    super.update(); // ✅ 调用父类 update()，执行死亡检测
  }

  fire() {
    const directions = [];

    if (bulletPatternType === 1) {
      directions.push(createVector(1, 0));   // 右
      directions.push(createVector(-1, 0));  // 左
    } else if (bulletPatternType === 2) {
      directions.push(createVector(1, 0));    // 右
      directions.push(createVector(-1, 0));   // 左
      directions.push(createVector(0, 1));    // 下
      directions.push(createVector(0, -1));   // 上
    } else if (bulletPatternType === 3) {
      directions.push(p5.Vector.fromAngle(0));
      directions.push(p5.Vector.fromAngle(PI / 3));
      directions.push(p5.Vector.fromAngle(2 * PI / 3));
      directions.push(p5.Vector.fromAngle(PI));
      directions.push(p5.Vector.fromAngle(-2 * PI / 3));
      directions.push(p5.Vector.fromAngle(-PI / 3));
    }

    for (let dir of directions) {
      bullets.push(new Bullet(this.pos.copy(), dir, "enemy"));
    }
  }

  show() {
    /*if (bulletEnemyImg) {
      imageMode(CENTER);
      image(bulletEnemyImg, this.pos.x, this.pos.y, this.r * 3.5, this.r * 3.5);
    } else  {*/
    
    if (this.exploding && this.explosion) {
      super.show(); // 这时父类会绘制爆炸
      return;
    }
    
    
    this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
      
    


  }
}

class CommonEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 20;             // 比精英怪小
    this.hp = new HPSystem(60); // 较低血量
    this.speed = 3.6;        // 稍快的移动速度
    this.scaleFactor = 1.8;//大小
    this.spriteImg = common_gif;  // 比如 bulletEnemyImg
    this.flip = false;  // 初始是否翻转，可以动态更新
  }

  update() {
    this.applySeparation(enemies); // 防止敌人之间重叠

    const distanceToPlayer = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
    const stopDistance = this.r + player.r;

    if (distanceToPlayer > stopDistance) {
      let dir = p5.Vector.sub(player.pos, this.pos);
      dir.setMag(this.speed);
      this.pos.add(dir);
    }
    this.flip = (player.pos.x > this.pos.x); // 玩家在右边就翻转
    super.update(); // 死亡检测等
  }

  applySeparation(others) {
    let separationForce = createVector(0, 0);
    let desiredSeparation = this.r * 2;
    let count = 0;

    for (let other of others) {
      if (other === this || !other.hp.isAlive()) continue;

      let d = p5.Vector.dist(this.pos, other.pos);
      if (d < desiredSeparation && d > 0) {
        let diff = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
        separationForce.add(diff);
        count++;
      }
    }

    if (count > 0) {
      separationForce.div(count);
      separationForce.setMag(1.5);
      this.pos.add(separationForce);
    }
  }

  show() {
    if (this.exploding && this.explosion) {
      super.show(); // 播放爆炸动画
      return;
    }

    this.drawSprite(this.spriteImg, this.pos.x, this.pos.y, this.r, this.flip);
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
  }
}

class Boss extends Enemy {
  constructor(x, y) {
    super(x, y);

    /* ───── 基本属性 ───── */
    this.r  = 115;
    this.hp = new HPSystem(2800);
    this.contactDamage = 40;

    /* ───── idle / 召唤图片 ───── */
    this.idleImg     = BOSS_IDLE_IMG;    // 可为 null
    this.summonGif   = BOSS_SUMMON_GIF;  // 8-帧竖排
    this.waveGif     = BOSS_WAVE_GIF;    // 可为 null
    this.bossWaveGif = BOSS_WAVE_BOSS_GIF;

    /* ───── 召唤伏击怪参数 ───── */
    this.summonDur   = 1000;
    this.summoning   = false;
    this.summonEndT  = 0;

    /* ───── 震波圆环参数 ───── */
    this.waveTotal   = 5010;    // 总时长 8s
    this.waveActive  = false;
    this.waveStart   = 0;
    //this.waveStart   = - (this.waveCD + this.waveTotal);  // ＝ -20000
    this.ringOrder   = [];      // 如 [2,0,1]
    this.ringHitOnce = new Set();

    /* 圆环半径：用屏幕宽度做基准，实时算 */
    this.getRings = () => {
      const big = max(windowWidth, windowHeight);   // 最外层
      return [ big * 0.15, big * 0.3, big * 0.45 ];
    };

        /* ───── 塔防战技能 ───── */
        this.towerDur        = 20000;      // 持续 30s
        this.towerActive     = false;
        this.towerStart      = 0;
        //this.towerStart = -(this.towerCD + this.towerDur);//-90000
        this.towers          = [];        // 存放生成的 Tower 实例
        this.lastTowerShot   = 0;
        this.towerFireRate   = 400;      // 每秒发一次弹
        this.bossTowerGif    = BOSS_TOWER_SKILL_GIF;
        this.towerAngleOffset = 0;    // ★ 新增：累计的发射偏移角

        /* ───── 冲刺技能 ───── */
        this.dashDelay         = 2500;     // 触发后等待 1s
        this.dashActive        = false;
        this.dashPhase         = "idle";   // idle → prepare → dashing → hold → explode
        this.dashPrepareEnd    = 0;
        //this.dashStartTime     = 0;
        this.dashStartTime     = 0;//提前触发
        this.dashTravelTime    = 0;
        this.dashHoldEnd       = 0;
        this.dashExplodeEnd    = 0;
        this.dashStartPos      = createVector(0, 0);
        this.dashEndPos        = createVector(0, 0);
        this.defaultContactDamage = 10;
        this.contactDamage     = 10;
        this.contactDamageMult = 7;        // 冲刺期间 ×7
        this.dashGif           = BOSS_DASH_GIF;
        this.explodeGif        = BOSS_DASH_EXPLODE_GIF;
        this.dashBarThickness = 180;    // 长条厚度
        this.dashDamageDone   = false; // 爆炸阶段是否已对玩家扣过血
         /* ───── 黑洞技能 ───── */
    this.bhActive     = false;
    this.bhStart      = 0;
    this.bhDuration   = 1000;                       // 持续 1s
    this.bhGif        = BOSS_BLACKHOLE_SKILL_GIF;   // 你需要预先加载
    this.blackHoles   = [];                         // 存放生成的 BlackHole 实例

    //统一管理技能触发
    this.unlockedSkills = [];          // [ 'earthquake', 'barrage', ... ]
    this.waitingForNext  = false;      // 正在空白期，等下一个技能触发
    this.idleStart       = 0;          // 空白期开始时刻
    this.idleDelay       = 4000;       // 空白期长度 (ms)
    this.currentSkill    = null;       // 正在执行的技能名字
  }

  /* ──────────────────────── 召唤伏击怪 ─ */
  triggerSummon() {
    if (this.summoning) return;
    this.summoning  = true;
    this.summonEndT = millis() + this.summonDur;
    this.lastSummon = millis();
  }
  finishSummon() {
    const N = 6, RAD = 150;
    for (let i = 0; i < N; i++) {
      const ang = TWO_PI * i / N;
      enemies.push(
        new AmbushEnemy(this.pos.x + cos(ang)*RAD,
                        this.pos.y + sin(ang)*RAD));
    }
  }

  /* ──────────────────────── 震波圆环 ─ */
  triggerWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.waveStart  = millis();
    /* 生成随机顺序，例如 [1,2,0] */
    this.ringOrder  = shuffle([0,1,2]);
    this.ringHitOnce.clear();
  }
  handleWaveDamage() {
    const elapsed = millis() - this.waveStart;
  
    // 1) 整体还没到伤害段就不判
    //    DAMAGE_START = 2010, WAVE_END = this.waveTotal (5010)
    const DAMAGE_START = 2010;
    const SEG_DUR      = 1000; // 每层 1000ms
    const BLANK        = 200;  // 每层前 200ms 空档
  
    if (elapsed < DAMAGE_START || elapsed >= this.waveTotal) {
      return;
    }
  
    // 2) 是哪一层？0,1,2
    const rel = elapsed - DAMAGE_START;
    const idx = floor(rel / SEG_DUR);
    if (idx < 0 || idx >= this.ringOrder.length) return;
  
    // 3) 本层前 200ms 空档
    const segStart = DAMAGE_START + idx * SEG_DUR;
    if (elapsed < segStart + BLANK) {
      return;
    }
  
    // 4) 真正判伤（后 800ms）
    const ringIdx = this.ringOrder[idx];
    if (this.ringHitOnce.has(ringIdx)) return;
  
    const rings  = this.getRings();
    const innerR = ringIdx === 0 ? 0 : rings[ringIdx - 1];
    const outerR = rings[ringIdx];
  
    const d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
    if (d >= innerR && d <= outerR) {
      player.receiveDamage(140);
      this.ringHitOnce.add(ringIdx);
      console.log(`⚡ Wave hit! ring ${ringIdx}`);
    }
  }
  //塔技能-------------------------------------------
  triggerTowerSkill() {
    if (this.towerActive) return;
    this.towerActive   = true;
    this.towerStart    = millis();
    this.lastTowerShot = millis();
    // 四周生成 4 座塔
    const R = this.r + 150;
    const angs = [0, HALF_PI, PI, PI+HALF_PI];
    for (let a of angs) {
      const x = this.pos.x + cos(a) * R;
      const y = this.pos.y + sin(a) * R;
      const t = new Tower(x, y);
      enemies.push(t);
      this.towers.push(t);
    }
  }

  handleTowerSkill() {
    const elapsed = millis() - this.towerStart;
    if (elapsed < this.towerDur) {
      if (millis() - this.lastTowerShot >= this.towerFireRate) {
        this.lastTowerShot = millis();

        // ——— 原来的 6 个主方向改成使用 “偏移” ———
        const baseDirs = [0, PI/3, 2*PI/3, PI, -2*PI/3, -PI/3];
        const spreadSteps  = 3;        // 每个主方向多发几发
        const spreadAngle  = PI/60;    // 每发间隔角度

        for (let d of baseDirs) {
          // 在主方向上加上当前的角度偏移
          let dir = d + this.towerAngleOffset;
          for (let s = -spreadSteps; s <= spreadSteps; s++) {
            let ang = dir + s * spreadAngle;
            let b = new Bullet(this.pos.copy(), p5.Vector.fromAngle(ang), "boss");
            b.r = 15;       // 子弹半径
            bullets.push(b);
          }
        }

        // ★ 每发完一次，偏移 +30°（弧度制）
        this.towerAngleOffset += radians(10);
        // 保持在 0～2π 之间，可选
        this.towerAngleOffset %= TWO_PI;
      }
    }
    // else {
    //   // 30s 到，清理塔并结算
    //   this.towerActive = false;
    //   // 还活着的塔
    //   const alive = this.towers.filter(t => t.hp.isAlive());
    //   if (alive.length) {
    //     // 有没被炸掉的塔 → 全部清除并伤害玩家
    //     alive.forEach(t => t.hp.takeDamage(t.hp.currentHP));
    //     player.receiveDamage(100);
    //   } else {
    //     // 全部被玩家拆掉 → boss 受伤
    //     this.hp.takeDamage(500);
    //   }
    //   this.towers = [];
    //   // ★ 杀掉残留子弹，避免血条继续被打 —— 
    //   bullets.length = 0;
    // }
  }

  //冲刺技能----------------------------------------------------
  triggerDashSkill(){
    if(this.dashActive) return;
     // —— 重置标记 —— 
    this.dashDamageDone = false;
    this.contactDamage  = this.defaultContactDamage * this.contactDamageMult;
    this.dashActive      = true;
    this.dashPhase       = "prepare";
    this.dashPrepareEnd  = millis() + this.dashDelay;
    this.lastDashTrigger = millis();
  }

  handleDashSkill(){
    const now = millis();
    if(this.dashPhase === "prepare"){
      if(now >= this.dashPrepareEnd){
        // 开始冲刺
        this.dashPhase     = "dashing";
        this.dashStartTime = now;
        this.dashStartPos  = this.pos.copy();
        this.dashEndPos    = player.pos.copy();
        // 固定 0.3s 完成冲刺
        this.dashTravelTime = 300;
        // 提升碰撞伤害
        this.contactDamage  = this.defaultContactDamage * this.contactDamageMult;
      }
    }
    else if(this.dashPhase === "dashing"){
      let t = (now - this.dashStartTime) / this.dashTravelTime;
      if(t < 1){
        this.pos = p5.Vector.lerp(this.dashStartPos, this.dashEndPos, t);
      } else {
        // 到终点，进入 hold
        this.pos           = this.dashEndPos.copy();
        this.dashPhase     = "hold";
        this.dashHoldEnd   = now + 500;   // 停留 0.5s
      }
    }
    else if(this.dashPhase === "hold"){
      if(now >= this.dashHoldEnd){
        // 冲刺完毕，进入“爆炸沿线”阶段
        this.dashPhase      = "explode";
        this.dashExplodeEnd = now + 3000; // 持续 3s
      }
    }
    else if(this.dashPhase === "explode"){
      if(now >= this.dashExplodeEnd){
        // 技能完全结束
        this.dashPhase    = "idle";
        this.dashActive   = false;
        this.contactDamage = this.defaultContactDamage;
      }
    }
  }

  //新增dash后的长条-------------------------------------
  handleDashDamage() {
    if (this.dashPhase !== "explode" || this.dashDamageDone) return;

    // 计算玩家到直线段最近点的距离
    const A = this.dashStartPos,
          B = this.dashEndPos,
          P = player.pos;
    const AB = p5.Vector.sub(B, A),
          AP = p5.Vector.sub(P, A);
    let t = AP.dot(AB) / AB.magSq();
    t = constrain(t, 0, 1);
    const closest = p5.Vector.add(A, p5.Vector.mult(AB, t));
    const d = dist(P.x, P.y, closest.x, closest.y);

    if (d <= this.dashBarThickness/2) {
      player.receiveDamage(100);
      this.dashDamageDone = true;
    }
  }

  // 触发黑洞技能
  triggerBhSkill() {
    if (this.bhActive) return;
    this.bhActive  = true;
    this.bhStart   = millis();
    this.lastBh    = this.bhStart;
    // 生成 4 个黑洞
    // 区域：以 (0,0) 画布中心为中心，宽高 = windowWidth*2, windowHeight*2
    for (let i = 0; i < 4; i++) {
      let px = random(-windowWidth, windowWidth);
      let py = random(-windowHeight, windowHeight);
      this.blackHoles.push(new BlackHole(px, py));
      // levelManager.currentLevel.blackHoles.push(new BlackHole(px, py));
    }
  }

  // 更新黑洞技能状态
  handleBhSkill() {
    const now = millis();
    if (!this.bhActive) return;

    // 播放 GIF 持续期间
    if (now - this.bhStart >= this.bhDuration) {
      // 1s 到，结束技能
      this.bhActive = false;
    }
  }

  //管理技能触发机制的函数方法-------------------------------------------------
  // 检查 Boss 有没有正在执行的技能
isAnySkillActive() {
  return this.bhActive
      || this.summoning
      || this.waveActive
      || this.towerActive
      || this.dashActive
      /* || earthquakeActive 等其它技能标志 */;
}

// 读取当前血量阶段，解锁＆随机触发
selectAndTriggerSkill() {
  const ratio = this.hp.currentHP / this.hp.maxHP;
  let stageSkill;
  if      (ratio <= 0.25) stageSkill = 'earthquake';
  else if (ratio <= 0.50) stageSkill = 'barrage';
  else if (ratio <= 0.73) stageSkill = 'dash';
  else if (ratio <= 0.88) stageSkill = 'summon';
  else                    stageSkill = 'blackhole';

  // 如果这个阶段的技能还没解锁，就只触发它，并加入池子
  if (!this.unlockedSkills.includes(stageSkill)) {
    this.unlockedSkills.push(stageSkill);
    this.triggerSkill(stageSkill);
  }
  // 否则从已解锁技能里随机选一个
  else {
    const pool = this.unlockedSkills;
    const choice = pool[floor(random(pool.length))];
    this.triggerSkill(choice);
  }
}

// Dispatcher：根据名字触发真正的方法
triggerSkill(name) {
  this.currentSkill = name;
  switch(name) {
    case 'earthquake': this.triggerWave();            break;
    case 'barrage'   : this.triggerTowerSkill();      break;
    case 'dash'      : this.triggerDashSkill();       break;
    case 'summon'    : this.triggerSummon();          break;
    case 'blackhole' : this.triggerBhSkill();         break;
  }
}

//检测是否还要tower--------------------------------------------
cleanupTower() {
  // 找出还存活的塔
  const alive = this.towers.filter(t => t.hp.isAlive());
  if (alive.length) {
    // 有没被拆的塔：把它们都爆掉并伤害玩家
    alive.forEach(t => t.hp.takeDamage(t.hp.currentHP));
    player.receiveDamage(120);
  } else {
    // 全部都被玩家拆了：Boss 受伤
    this.hp.takeDamage(500);
  }
  // 最后清空塔和子弹列表
  this.towers = [];
  bullets.length = 0;
}

  /* ──────────────────────── 更新 ─ */
  update() {
    super.update();  
  
    // 一、结束检测（必须放最前面）
    if (this.summoning && millis() >= this.summonEndT) {
      this.summoning = false;
      this.finishSummon();
    }
    if (this.waveActive && millis() - this.waveStart >= this.waveTotal) {
      this.waveActive = false;
    }
    if (this.towerActive && millis() - this.towerStart >= this.towerDur) {
      this.towerActive = false;
      this.cleanupTower(); // 你原来清塔并结算的逻辑
    }
    if (this.bhActive && millis() - this.bhStart >= this.bhDuration) {
      this.bhActive = false;
      // 不清 blackHoles，让它们留在场上
    }
    // 冲刺的结束已经在 handleDashSkill 里设置了 dashActive = false
  
    // 二、持续执行
    if (this.summoning) {
      // 纯动画，没有 damage 逻辑
    }
    if (this.waveActive) {
      this.handleWaveDamage();
    }
    if (this.towerActive) {
      this.handleTowerSkill();
    }
    if (this.dashActive) {
      this.handleDashSkill();
      this.handleDashDamage();
    }

    this.blackHoles.forEach(bh => bh.update(player));

  
    // 三、等待 & 触发下一个
    if (!this.isAnySkillActive()) {
      if (!this.waitingForNext) {
        this.waitingForNext = true;
        this.idleStart = millis();
      }
      else if (millis() - this.idleStart >= this.idleDelay) {
        this.waitingForNext = false;
        this.selectAndTriggerSkill();
      }
    }
  }

  /* ──────────────────────── 绘制 ─ */
  drawWave() {
    if (!this.waveActive) return;
    const elapsed = millis() - this.waveStart;
    const rings   = this.getRings();
    let activeRing = -1;
  
    // 1. 预演阶段：1000–2500ms，每 500ms 切换一次
    if (elapsed >= 1000 && elapsed < 1510) {
      const idx = floor((elapsed - 1000) / 170); // 0,1,2
      activeRing = this.ringOrder[idx];
    }
    // 2. 伤害阶段：3500–6500ms，每 1000ms 切换一次
    else if (elapsed >= 2010 && elapsed < this.waveTotal) {
      const idx = floor((elapsed - 2010) / 1000); // 0,1,2
      activeRing = this.ringOrder[idx];
    }
  
    // 画最内圈
    push();
    if (activeRing === 0) fill(255,0,0,140);
    else noFill();
    stroke(255,0,0, activeRing===0 ? 200 : 80);
    strokeWeight(4);
    circle(this.pos.x, this.pos.y, rings[0]*2);
    // 伤害阶段贴刺
    if (elapsed >= 2010 && elapsed < this.waveTotal && activeRing===0 && this.waveGif) {
      const N      = 12;
      const centre = rings[0] * 0.7;
      const scale  = centre / (this.waveGif.width/2);
      const w      = this.waveGif.width  * scale;
      const h      = this.waveGif.height * scale;
      imageMode(CENTER);
      for (let k = 0; k < N; k++) {
        const ang = TWO_PI*k/N + frameCount*0.01;
        const x   = this.pos.x + centre*cos(ang);
        const y   = this.pos.y + centre*sin(ang);
        push();
        translate(x,y);
        rotate(ang + HALF_PI);
        image(this.waveGif, 0,0, w,h);
        pop();
      }
    }
    pop();
  
    // 画外两圈
    noFill();
    for (let i = 1; i < 3; i++) {
      const innerR  = rings[i-1];
      const outerR  = rings[i];
      const bandW   = outerR - innerR;
      const centreR = (innerR + outerR)/2;
      if (i === activeRing) {
        stroke(255,0,0,140);
        strokeWeight(bandW);
        ellipse(this.pos.x, this.pos.y, centreR*2);
        if (elapsed >= 2510 && elapsed < this.waveTotal && this.waveGif) {
          const scale  = bandW / this.waveGif.height;
          const spikeW = this.waveGif.width * scale;
          const nSpike = floor(TWO_PI*centreR/spikeW);
          push();
          imageMode(CENTER);
          for (let k = 0; k < nSpike; k++) {
            const ang = k*TWO_PI/nSpike;
            const px  = this.pos.x + centreR*cos(ang);
            const py  = this.pos.y + centreR*sin(ang);
            push();
            translate(px,py);
            rotate(ang+HALF_PI);
            image(
              this.waveGif,
              0,0,
              this.waveGif.width*scale*1.65,
              this.waveGif.height*scale*1.65
            );
            pop();
          }
          pop();
        }
      } else {
        stroke(255,0,0,120);
        strokeWeight(4);
        ellipse(this.pos.x, this.pos.y, outerR*2);
      }
    }
  }

  show() {
    const S = 1.2;
    if (this.exploding && this.explosion) { super.show(); return; }

    /* 先画震波，以免被 Boss 本体挡住 */
    this.drawWave();

    push();
    imageMode(CENTER);
    
    function resetDrawingStyle() {
      fill(255);
      stroke(0);
      strokeWeight(1);
      imageMode(CORNER);  // 避免 imageMode(CENTER) 残留
    }
// ✅ 黑洞绘制隔离：防止染色污染
push();
for (let bh of this.blackHoles) {
  push();                     // 每个黑洞独立 push
  resetDrawingStyle();        // 可选：重置样式
  bh.show();                  // 黑洞绘制
  pop();
}
pop();

    if(this.bhActive){
      
      
      image(
        this.bhGif,
        this.pos.x, this.pos.y,
        this.bhGif.width  * S,
        this.bhGif.height * S
      );


    }
    else if (this.dashActive) {
      push();
      stroke(128, 0, 128, 0);
strokeWeight(this.dashBarThickness);
line(
  this.dashStartPos.x, this.dashStartPos.y,
  this.dashEndPos.x,   this.dashEndPos.y
);
// 如果是 explode 阶段，也在 overlay 上画 GIF
if (this.dashPhase === 'explode') {
  let p = 1 - (this.dashExplodeEnd - millis()) / 3000;
  const N = 5;
  for (let i = 0; i < floor(p * N); i++) {
    let t  = i / (N - 1);
    let px = lerp(this.dashStartPos.x, this.dashEndPos.x, t);
    let py = lerp(this.dashStartPos.y, this.dashEndPos.y, t);
    image(this.explodeGif, px, py, 170, 170);
  }
}
    pop();

  
      // ②── 再画 boss 本体 和 冲刺 GIF ──
      push();
     
      // 先画 idle 背景（或一个底图）
      if (this.idleImg) {
        image(
          this.idleImg,
          this.pos.x, this.pos.y,
          this.idleImg.width  * S,
          this.idleImg.height * S
        );
      } else {
        fill(255, 140, 0);
        ellipse(this.pos.x, this.pos.y, this.r * 2.5);
      }
      // 再叠加冲刺专用 GIF
      if (this.dashPhase === 'prepare'
       || this.dashPhase === 'dashing'
       || this.dashPhase === 'hold'
      ) {
        image(
          this.dashGif,
          this.pos.x, this.pos.y,
          this.dashGif.width  * S,
          this.dashGif.height * S
        );
      }
      pop();
    }
    else if (this.waveActive && this.bossWaveGif) {
      image(
        this.bossWaveGif,
        this.pos.x, this.pos.y,
        this.bossWaveGif.width  * S,
        this.bossWaveGif.height * S
      );
    /* 召唤中用 summonGif，否则用 idleImg / fallback */  
    }else if (this.towerActive && this.bossTowerGif) {
      image(
        this.bossTowerGif,
        this.pos.x, this.pos.y,
        this.bossTowerGif.width  * S,
        this.bossTowerGif.height * S
      );

    // ─── 原有 summon/idle/fallback 分支 ───
    }else if (this.summoning) {
      /* 召唤 GIF */
      image(this.summonGif, this.pos.x, this.pos.y,
            this.summonGif.width*S, this.summonGif.height*S);
    } else if (this.idleImg) {
      image(this.idleImg, this.pos.x, this.pos.y,
            this.idleImg.width*S, this.idleImg.height*S);
    } else {
      fill(255, 140, 0);
      ellipse(this.pos.x, this.pos.y, this.r*2.5);
    }
    pop();

    /* 血条 */
    this.hp.drawHP(this.pos.x, this.pos.y, this.r);
    
  
  }
}




class TimeBonus {
  constructor(x, y, bonusTime) {
    this.pos = createVector(x, y);
    this.r = 30;
    this.bonusTime = bonusTime; // 奖励的时间（秒）
    this.gifImg = gifImg;       // ✅ 新增：GIF 图像
  }

  show() {
    image(this.gifImg, this.pos.x, this.pos.y, this.r * 3, this.r * 3);
    
    fill(0);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text("Time Bonus\n" + this.bonusTime + "s", this.pos.x, this.pos.y);
  }
  
  
}



    class Skill {
  constructor(name, key, cooldownTotal) {
    this.name = name;
    this.key = key;
    this.cooldownTotal = cooldownTotal;
    this.cooldownRemaining = 0;
  }

  
  trigger() {
    if (this.cooldownRemaining <= 0) {
      this.cooldownRemaining = this.cooldownTotal;
      console.log(this.name + " 技能触发！");
    
      // 这里以后可以加技能效果，比如调用 castSkill(this.name)
      this.castSkillEffect();
    }
  }

  update() {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= deltaTime / 1000;
      this.cooldownRemaining = max(0, this.cooldownRemaining);
    }
  }

 show(x, y, size) {
    imageMode(CORNER);
    let icon = skillIcons[this.name];
    if (icon) {
      image(icon, x, y, size, size);
    } else {
      fill(100);
      rect(x, y, size, size); // 没图标时用灰方块代替
    }

    if (this.cooldownRemaining > 0) {
      let angle = map(this.cooldownRemaining, 0, this.cooldownTotal, 0, TWO_PI);
      push();
      translate(x + size/2, y + size/2);
      fill(0, 0, 0, 150);
      noStroke();
      arc(0, 0, size, size, -HALF_PI, -HALF_PI + angle, PIE);
      pop();

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(floor(this.cooldownRemaining), x + size/2, y + size/2);
    }
  }
}



class SkillSystem {
  constructor() {
    this.allSkills = [];         // 所有技能
    this.selectedSkills = [];    // 玩家已选择的技能
  }

  addSkill(skill) {
    if (skill) {
      this.allSkills.push(skill);
    } else {
      console.warn("⚠️ addSkill() 传入了 undefined，被忽略！");
    }
  }

  selectSkill(skill) {
    if (skill) {
      this.selectedSkills.push(skill);
    } else {
      console.warn("⚠️ selectSkill() 传入了 undefined，被忽略！");
    }
  }


  drawIcon() {
    let size = 64;
    let spacing = 10;
    let totalWidth = this.selectedSkills.length * (size + spacing) - spacing;
    let startX = windowWidth - totalWidth - 20;
    let y = windowHeight - size - 20;

    const keyMapping = ['Q', 'W', 'E'];

    for (let i = 0; i < this.selectedSkills.length; i++) {
      let skill = this.selectedSkills[i];
      if (!skill) continue; // 安全跳过

      let x = startX + i * (size + spacing);
      skill.show(x, y, size);

      fill(255);
      textAlign(CENTER, BOTTOM);
      textSize(16);
      text(keyMapping[i], x + size / 2, y - 5);
    }
  }

  tryActivateSkill(keyPressed) {
    const keyMapping = ['Q', 'W', 'E'];

    for (let i = 0; i < this.selectedSkills.length; i++) {
      let skill = this.selectedSkills[i];
      if (
        skill &&
        keyPressed.toUpperCase() === keyMapping[i] &&
        skill.cooldownRemaining <= 0
      ) {
        skill.trigger();
      }
    }
  }
}


class AttackBoostSkill extends Skill {
  constructor(player) {
    super("Ghost Cutter", "", 6); // 名称、按键（暂时空）、冷却时间
    this.player = player; // 保存玩家对象
  }

  castSkillEffect() {
    SFX.play("boost");
    console.log("快速攻击发动！攻击力提升3秒");
    this.player.buffAttack = 60; // 技能发动时，攻击力变成30
    setTimeout(() => {
      this.player.buffAttack = player.baseAttack; // 3秒后恢复原来的基础攻击
      console.log("攻击加成结束，恢复基础伤害");
    }, 3000);
    this.player.spriteMgr.request("boost", 3000, 1);
  }

  
}


  class DashSkill extends Skill {
  constructor(player,enemies) {
    super("Phantom Dash", "", 3); // 冲刺技能冷却
    this.dashDamage = 40; // 冲刺时撞敌造成5伤害
    this.isDashing = false; // 冲刺中标记
    this.originalSpeed = 0; // 记录冲刺前的速度
    this.dashedEnemies = []; // 已经撞过的敌人列表
    this.dashEndTime = 0; // 冲刺结束时间

    this.dashTrail = [];             // ✅ 拖影数组
    this.maxDashTrailLength = 20;   
    this.frameSkip = 1;       // 每 1 帧采样一次
    this._frameCounter = 0;

    this.trailImg = TRAIL_IMG;   // ← 存引用 // ✅ 最多记录多少
    this.trailSizeHead = 0.4;  // 玩家附近：0.4 × player.r
    this.trailSizeTail = 1.1;  // 尾端：1.1 × player.r
    this.trailSizeMul  = 5; 

    this.player = player; 
    this.enemies = enemies; // 保存敌人列表

    this.totalDamage = 0; // 累积冲刺造成的伤害
  }

  castSkillEffect() {
    if (this.isDashing) return; // 正在冲刺时不能再次触发
    SFX.play("dash");  // ✅ 冲刺音效

    console.log(" 冲刺技能发动！");
    this.isDashing = true;
    this.dashedEnemies = []; // 冲刺开始时清空已撞敌人列表
    this.originalSpeed = this.player.speed;
    this.player.speed *= 3;
    this.player.isInvincibleFromDash = true;
    
    

    this.dashEndTime = millis() + 500; // 冲刺持续0.5秒
    this.player.spriteMgr.request("dash", 500, 1);
  }

  update() {
    super.update(); // 更新冷却时间

    if (this.isDashing) {
      // 冲刺期间每帧处理
      this.checkDashDamage(); // 检查撞击伤害
      this.updateTrail(); // ✅ 每帧记录位置

      if (millis() > this.dashEndTime) {
        // 冲刺时间到了
        this.endDash();
      }
    }
  }
  // 更新冲刺拖影
    updateTrail() {
  if ((this._frameCounter++ % this.frameSkip) !== 0) return;

  this.dashTrail.push({
    pos: this.player.pos.copy(),
    dir: this.player.lastDirection   // "left" / "right"
  });
  if (this.dashTrail.length > this.maxDashTrailLength) {
    this.dashTrail.shift();
  }
 }

 showTrail() {
  if (!this.trailImg || !this.dashTrail.length) return;

  imageMode(CENTER);

  for (let i = 0; i < this.dashTrail.length; i++) {
    const { pos, dir } = this.dashTrail[i];

    // 透明度 & 尺寸渐隐
    const alpha = map(i, 0, this.dashTrail.length, 40, 255);
   const size = map(i, 0, this.dashTrail.length,
                 this.player.r * this.trailSizeHead,
                 this.player.r * this.trailSizeTail)
             * this.trailSizeMul;

    push();
    translate(pos.x, pos.y);
    if (dir === "left") scale(-1, 1);
    tint(255, alpha);
    image(this.trailImg, 0, 0, size, size);
    pop();
  }
  noTint();
 }
  

  checkDashDamage() {
    for (let enemy of this.enemies) {
      if (!enemy.hp || !enemy.hp.isAlive()) continue;
      if (this.dashedEnemies.includes(enemy)) continue;
  
      let d = dist(this.player.pos.x, this.player.pos.y, enemy.pos.x, enemy.pos.y);
      if (d < this.player.r + enemy.r) {
        const attackInfo = {
          source: "dash",
          player: this.player,
          baseDamage: this.dashDamage,
          target: enemy
        };
  
        let damageDone = DamageCalculator.calculate(attackInfo);
        this.totalDamage += damageDone; // ✅ 统计冲刺总伤害
        this.dashedEnemies.push(enemy);
  
        console.log(`冲刺撞击敌人，造成 ${damageDone} 点伤害`);
      }
    }
  }


    endDash() {
      console.log("冲刺结束，恢复速度");
      this.isDashing = false;
      this.player.speed = this.originalSpeed;
       // ✅ 延迟 1 秒后取消无敌
      setTimeout(() => {
        this.player.isInvincibleFromDash = false;
        console.log("冲刺后的无敌时间结束");
      }, 1500);
      
      if (this.totalDamage > 0) {
        for (let skill of this.player.selectedSkills) {
          if (skill instanceof LifestealSkill) {
            skill.onDamageDealt(this.totalDamage, "dash");
          }
        }
      }
    
      this.totalDamage = 0; // 重置
      this.dashTrail = [];
      this.dashedEnemies = [];

    }
    
  
}


class DashResetSkill extends Skill {
  constructor(player) {
    super("Runner’s Instinct", "", 0); // 0秒冷却，因为它是被动技能
    this.player = player;
  }

  onEnemyKilled() {
    console.log("敌人被消灭，尝试重置冲刺冷却！");
    for (let skill of this.player.selectedSkills) {
      if (skill instanceof DashSkill) {
        skill.cooldownRemaining = 0;
        console.log("✅ 冲刺技能冷却已重置！");
      }
    }
  }
}

/* ---------- ChargeStrikeSkill ---------- */
class ChargeStrikeSkill extends Skill {
  constructor(player, enemies) {
    super("Wrath Unchained", "", 7);
    this.player        = player;
    this.enemies       = enemies;

    this.chargeDuration = 2000;  // ms
    this.range          = 100;   // 蓄满后的最大攻击半径
    this.minRange       = 20;    // 起始提示半径
    this.chargeAttack = 100;      // 高额范围伤害

    this.isCharging = false;
    this.startTime  = 0;
  }

  /* 触发 —— 开始进入蓄力状态 */
  castSkillEffect() {
    SFX.play("charge");  // ✅ 播放蓄力启动音效
    console.log("⚡ 蓄力攻击启动");
    this.isCharging      = true;
    this.startTime       = millis();

    this.player.isCharging        = true;   // 禁止位移
    this.player.damageMultiplier  = 0.2;    // 蓄力期间减伤
    this.player.spriteMgr.request("charge", this.chargeDuration, 1);
  }

  /* 每帧更新 */
  update() {
    super.update();                     // 冷却

    if (this.isCharging) {
      /* ① 计算进度 & 渲染光波特效 */
      const p = constrain((millis() - this.startTime) / this.chargeDuration, 0, 1);
      this.drawChargingEffect(p);

      /* ② 到点后真正释放伤害 */
      if (p >= 1) {
        this.releaseExplosion();
        this.isCharging             = false;
        this.player.isCharging      = false;
        this.player.damageMultiplier= 1;
        console.log("✅ 蓄力攻击完成");
      }
    }
  }

  /* ------------ 蓄力期间的可视化 ------------- */
 drawChargingEffect(progress) {
  const C = this.player.pos;
  const R = lerp(this.minRange, this.range, progress);   // 半径插值

  push();
  translate(C.x, C.y);

  /* ------ 内层柔和渐变填充 ------ */
  const ctx = drawingContext;
  ctx.save();
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.85);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(220,220,220,0.25)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.85, 0, TWO_PI);      // ★ 满圆
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* ------ 外层高亮轮廓 ------ */
  stroke(255);
  strokeWeight(4);
  noFill();
  circle(0, 0, R * 2);                     // p5.js ≥1.4 自带 circle()

  /* ------ 粒子特效 ------ */
  noStroke();
  const nPart = 10 + floor(progress * 30); // 蓄力越久粒子越多
  for (let i = 0; i < nPart; i++) {
    const a  = random(TWO_PI);             // 任意方向
    const rr = random(R * 0.7, R * 1.1);
    const x  = cos(a) * rr, y = sin(a) * rr;
    const sz = random(4, 12);
    fill(50 + random(-15, 15), 100, 100, 180);
    ellipse(x, y, sz);
  }
  pop();
}

  /* ---------------- 释放伤害 ---------------- */
 releaseExplosion() {
    console.log("💥 蓄力完成，释放360°范围攻击！");
  
    let totalDamage = 0; // ✅ 累计总伤害
  
    for (let enemy of this.enemies) {
      if (!enemy.hp || !enemy.hp.isAlive()) continue;
  
      let d = dist(this.player.pos.x, this.player.pos.y, enemy.pos.x, enemy.pos.y);
      if (d <= this.range + enemy.r) {
        const attackInfo = {
          source: "charged",
          player: this.player,
          baseDamage: this.chargeAttack,
          target: enemy
        };
  
        let damageDone = DamageCalculator.calculate(attackInfo);
        totalDamage += damageDone;
  
        console.log(`命中敌人，造成 ${damageDone} 点伤害`);
      }
    }
  
    if (totalDamage > 0) {
      console.log(`✅ 蓄力攻击总伤害: ${totalDamage}`);
  
      for (let skill of this.player.selectedSkills) {
        if (skill instanceof LifestealSkill) {
          skill.onDamageDealt(totalDamage, "dash"); // 或 "melee"、"charged"
        }
      }
      
    }

   
  }
}



class LifestealSkill extends Skill {
  constructor(player) {
    super("Crimson Drain", "", 5); // 技能名称、按键、冷却秒数
    this.player = player;
    this.lifestealRatio = 0.5; // 吸血比例
    this.duration = 5000; // 持续时间（毫秒）
    this.active = false;
    this.endTime = 0;
  }

  castSkillEffect() {
    SFX.play("lifesteal");  // ✅ 启动吸血音效
    console.log("🩸 吸血技能启动！未来5秒内造成的伤害可吸血");
    this.active = true;
    this.endTime = millis() + this.duration;
    this.player.spriteMgr.request("steal", 5000, 1);
  }

  update() {
    super.update();
    if (this.active && millis() > this.endTime) {
      this.active = false;
      console.log("🩸 吸血效果结束");
    }
  }

  /**
   * 玩家造成一次伤害后由技能系统调用，统一吸血入口
   * @param {number} totalDamage - 本次攻击造成的总伤害
   * @param {string} source - 攻击来源，例如 "melee"、"charged"、"dash"
   */
  onDamageDealt(totalDamage, source) {
    if (!this.active || totalDamage <= 0) return;

    let healAmount = floor(totalDamage * this.lifestealRatio);
    this.player.hp.heal(healAmount);

    console.log(`[吸血] 来源: ${source}，伤害: ${totalDamage}，回血: ${healAmount}`);
  }
}

class BloodFurySkill extends Skill {
  constructor(player) {
    super("Berserker’s Blood", "", 0); // 被动技能，无需冷却
    this.player = player;
    player.isInBloodFury = false; // 初始化状态
    this.isBoosting = false;
  }

  update() {
    let hpRatio = this.player.hp.currentHP / this.player.hp.maxHP;

    if (!this.isBoosting && hpRatio <= 0.3) {
      this.isBoosting = true; // 进入血怒状态
      player.isInBloodFury = true; // 进入血怒状态
      console.log("🩸 血怒开始，攻击力提高");
     
    }

    if (this.isBoosting && hpRatio > 0.3) {
     this.isBoosting = false; // 结束血怒状态
     player.isInBloodFury = false;
      console.log("🩸 血怒结束，攻击力恢复基础值");
    }
  }

  castSkillEffect() {
    // 被动技能无需手动触发
  }
}


class ReflectSkill extends Skill {
  constructor(player) {
    super("Iron Reversal", "", 6); // 名称、快捷键占位、冷却秒数
    this.player = player;

    this.duration = 4 * 1000; // 持续时间：4秒
    this.endTime = 0;

    this.baseShield = 200; // 主护盾值
  }

  // 技能释放时触发
  castSkillEffect() {
    SFX.play("reflect");
    // 标记反弹状态
    this.player.isReflecting = true;
    this.player.isInvincibleFromReflect = true;

    // 计算护盾值
    const bonus = this.player.pendingBonusShield || 0;
    const totalShield = this.baseShield + bonus;

    // 更新护盾系统，用于绘图与吸收
    this.player.hp.setShield(
      totalShield,         // 当前总护盾（蓝+金）
      totalShield,         // 最大总护盾
      bonus,               // bonus 护盾（用于绘图金色条）
      bonus                // 最大 bonus 护盾
    );

    // 清除 bonus 记录
    this.player.pendingBonusShield = 0;

    // 显示护盾特效
    this.player.spriteMgr.request("shield", this.duration, 1);

    // 设置结束时间
    this.endTime = millis() + this.duration;

    console.log(`🛡️ Iron Reversal 启动！主护盾: ${this.baseShield}, bonus: ${bonus}`);
  }

  // 每帧检查是否超时
  update() {
    super.update(); // 冷却计时

    if (this.player.isReflecting && millis() > this.endTime) {
      this._endShield();
      console.log("⚡ Iron Reversal 结束，护盾消失");
    }
  }

  // 内部函数：结束技能状态
  _endShield() {
    this.player.isReflecting = false;
    this.player.isInvincibleFromReflect = false;

    // 清空护盾（也会影响绘图）
    this.player.hp.setShield(0, 0, 0, 0);
  }
}



/* ───────────────────────────────────────────────
 *  减速领域 - 主动
 *    Z 键触发，持续 5s，半径 160，敌人速度 ×0.4
 * ─────────────────────────────────────────────── */
class SlowFieldSkill extends Skill {
  constructor(player, enemies,
              radius   = 160,
              slowMul  = 0.1,
              duration = 5000) {

    super("Anchor Field", "", 8);     // 名称 / 触发键 / 冷却秒数
    this.player   = player;
    this.enemies  = enemies;

    this.radius   = radius;
    this.slowMul  = slowMul;
    this.duration = duration;

    this.active   = false;
    this.endTime  = 0;
    this.slowed   = new Set();     // 目前被减速的敌人
  }

  /* 主动触发 */
  castSkillEffect() {
    SFX.play("slow");
    this.active  = true;
    this.endTime = millis() + this.duration;
    console.log("🌀 减速领域开启");
  }

  /* 每帧调用（来自 Player.updateSkills） */
  update() {
    super.update();                // 冷却倒计时

    // ✅ 每一帧都更新敌人列表，确保包括新生成的敌人
    this.enemies = enemies;
    if (!this.active) return;

    // 1. 处理减速 / 恢复
    for (let enemy of this.enemies) {
      if (!enemy.hp || !enemy.hp.isAlive()) continue;

      const d       = dist(this.player.pos.x, this.player.pos.y,
                           enemy .pos.x, enemy .pos.y);
      const inAura  = d <= this.radius + enemy.r;

      if (inAura) {
  if (!this.slowed.has(enemy)) {

    /* 通用：有 speed 属性的怪 */
    if (enemy.speed !== undefined) {
      enemy.originalSpeed = enemy.speed;
      enemy.speed        *= this.slowMul;
    }

    /* 针对 AmbushEnemy：同时缩放冲刺速度 */
    if (enemy instanceof AmbushEnemy) {
      enemy.originalDash      = enemy.dushSpeed;
      enemy.originalMaxDash   = enemy.maxDashSpeed;

      enemy.dushSpeed    *= this.slowMul;
      enemy.maxDashSpeed *= this.slowMul;
    }

    //  新增：StealthEnemy 特殊处理
     // StealthEnemy ✅ 修复重点：
  if (enemy instanceof StealthEnemy) {
   
      enemy.originalStealthSpeed = enemy.stealthSpeed;
      
      
    

    enemy.stealthSpeed = 0.3;
    console.log("隐身敌人现在速度为:", enemy.stealthSpeed);
    
  }

    this.slowed.add(enemy);
  }
}

// ▽▽ ② 离开领域或领域结束时复原 ▽▽
else if (this.slowed.has(enemy)) {

  if (enemy.originalSpeed !== undefined) enemy.speed = enemy.originalSpeed;
  if (enemy instanceof AmbushEnemy) {
    enemy.dushSpeed    = enemy.originalDash;
    enemy.maxDashSpeed = enemy.originalMaxDash;
  }

  this.slowed.delete(enemy);
}
    }

    // 2. 到时关闭
    if (millis() > this.endTime) this.deactivate();

    // 3. 可视化光环（可删）
    this.drawAura();
  }

  deactivate() {
  this.active = false;

  for (let enemy of this.slowed) {
    /* ---------- 通用移动速度 ---------- */
    if (enemy.originalSpeed !== undefined) {
      enemy.speed = enemy.originalSpeed;
    }

    /* ---------- 伏击怪冲刺速度 ---------- */
    if (enemy instanceof AmbushEnemy) {
      enemy.dushSpeed    = enemy.originalDash;
      enemy.maxDashSpeed = enemy.originalMaxDash;
    }

     if (enemy instanceof StealthEnemy) {
      
        enemy.stealthSpeed = 3.5; // 恢复原速度
        console.log("隐身敌人速度恢复为:", enemy.stealthSpeed);
      

        
      
    }
  }

  this.slowed.clear();
  console.log("🌀 减速领域结束");
}

  drawAura() {
    push();
    noFill();
    stroke(0, 255, 255, 120);
    strokeWeight(3);
    ellipse(this.player.pos.x, this.player.pos.y,
            this.radius * 2);
    pop();
  }
}

/* ───────────────────────────────────────────────
 *  减速领域 • 首次入圈伤害 - 被动
 *    同一个敌人 10s 内只吃一次额外伤害
 * ─────────────────────────────────────────────── */


class SlowFieldBonusDamage extends Skill {
  constructor(player, enemies, slowField,
              damage   = 20,
              innerCD  = 7000) {

    super("Guardian’s Will", "", 0);    
    this.player    = player;
    this.enemies   = enemies;
    this.slowField = slowField;

    this.damage    = damage;
    this.innerCD   = innerCD;
    this.lastHit   = new Map();       // enemy → millis
  }

  update() {
    // 被动：只要主动技在生效，就检查 slowed 集合
    const now = millis();
    if (!this.slowField.active) return;

    let totalDamage = 0;

for (let enemy of this.slowField.slowed) {
  if (!enemy.hp || !enemy.hp.isAlive()) continue;

  const last = this.lastHit.get(enemy) ?? -Infinity;
  if (now - last >= this.innerCD) {

    const currentHP = enemy.hp.currentHP ?? 0;  // ✅ takeDamage 前先读取血量
    const realDamage = Math.min(currentHP, this.damage);

    enemy.hp.takeDamage(this.damage);  // 再扣血

    totalDamage += realDamage;

    this.lastHit.set(enemy, now);
    console.log(`⚡ 电击领域命中，造成 ${realDamage} 点真实伤害`);
  }
}

if (totalDamage > 0) {
  console.log(`⚡ 总共造成 ${totalDamage} 点真实伤害`);
  const shield = Math.floor(totalDamage * 1); // 50% 转化为护盾
  this.player.pendingBonusShield += shield;
  console.log(`🛡️ 转化为 ${shield} 点护盾`);
}
  }

  castSkillEffect() {}   // 被动，没有触发体
}


//弹幕
class Bullet {
  constructor(pos, direction, sourceType = "enemy") {
    this.pos = pos.copy();
    this.r = 12;
    this.speed = 6;
    this.direction = direction.copy();
    if (this.direction.mag() === 0) {
    this.direction = createVector(1, 0);  // 默认方向
    }
    this.direction.normalize();
    this.isReflected = false;
    this.alive = true;
    this.sourceType = sourceType;  // 🔥 新增字段，记录是谁发射的
  }

  update() {
    this.pos.add(p5.Vector.mult(this.direction, this.speed));

    // 越界判定
    if (this.pos.x < -width || this.pos.x > width ||
        this.pos.y < -height || this.pos.y > height) {
      this.alive = false;
    }
  }

  show() {
    imageMode(CENTER);
    if (this.isReflected && bulletReflectedImg) {
      image(bulletReflectedImg, this.pos.x, this.pos.y, this.r * 5, this.r * 5);
    } else {
      if (this.sourceType === "boss" && bossBulletImg) {
        image(bossBulletImg, this.pos.x, this.pos.y, this.r * 3.5, this.r * 3.5);
      } else if (this.sourceType === "enemy" && enemyBulletImg) {
        image(enemyBulletImg, this.pos.x, this.pos.y, this.r * 7, this.r * 7);
      } 
    }
  }

  reflect() {
    this.isReflected = true;
    // 1. 安全反向（防止方向为 0）
  if (this.direction.mag() === 0) {
    this.direction = createVector(-1, 0); // 默认反向
  } else {
    this.direction.mult(-1);
  }

  // 2. 立即小幅偏移避免连锁碰撞
  this.pos.add(p5.Vector.mult(this.direction, this.r * 1.5));
  }
}


class HPSystem {
  constructor(maxHP) {
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.isDead = false;
    
    this.shieldHP = 0;
    this.maxShieldHP = 0;

    this.bonusShieldHP = 0;
    this.maxBonusShieldHP = 0;
  
  
  }

  setShield(shieldHP, maxShieldHP, bonusShieldHP = 0, maxBonusShieldHP = 0) {
    this.shieldHP = shieldHP;
    this.maxShieldHP = maxShieldHP;
    this.bonusShieldHP = bonusShieldHP;
    this.maxBonusShieldHP = maxBonusShieldHP;
  }

  takeDamage(amount) {
    this.currentHP -= amount;
    if (this.currentHP <= 0) {
      this.currentHP = 0;
      this.isDead = true;
    }
  }

  heal(amount) {
    this.currentHP += amount;
    if (this.currentHP > this.maxHP) {
      this.currentHP = this.maxHP;
    }
  }

  isAlive() {
    return !this.isDead;
  }

  drawHP(x, y, r, width = 50, height = 6) {
  const barX = x - width / 2;
  const barY = y - r - 15;
  const radius = 0.5;

  // 背景条（半透明深灰）
  noStroke();
  fill(0, 0, 0, 120); // 半透明黑背景
  rect(barX - 1, barY - 1, width + 2, height + 2, radius); // 背景带边缘

  // 红色背景（最大血量）
  fill(150, 0, 0); // 深红色底条
  rect(barX, barY, width, height, radius);

  // 绿色当前血量
  fill(0, 200, 80); // 柔和绿色
  const hpWidth = map(this.currentHP, 0, this.maxHP, 0, width);
  rect(barX, barY, hpWidth, height, radius);

   
  // 边框（白色微边框）
  stroke(255);
  strokeWeight(0.5);
  noFill();
  rect(barX, barY, width, height, radius);
  noStroke();
}

drawShield(x, y, r, facing = "right", width = 6, height = 50) {
  const offset = 10;
  const dir = (facing === "right") ? "left" : "right";
  const radius = 0.5;
  let barX = (dir === "left")
    ? x - r - offset - width
    : x + r + offset;
  let barY = y - height / 2;

  // 先判断是否有护盾需要绘制
  const hasShield = (this.shieldHP > 0 && this.maxShieldHP > 0);
  const hasBonus  = (this.bonusShieldHP > 0 && this.maxBonusShieldHP > 0);
  if (!hasShield && !hasBonus) return; // 完全没有护盾，不绘制任何东西

  let shieldHeight = 0;
  if (hasShield) {
    shieldHeight = map(this.shieldHP, 0, this.maxShieldHP, 0, height);
  }

  let currentY = barY + height;

  // 🟦 主护盾（蓝色）
  if (shieldHeight > 0) {
    fill(0, 180, 255);
    currentY -= shieldHeight;
    rect(barX, currentY, width, shieldHeight, radius);
  }
  // 🧱 总体边框（仅在有护盾时绘制）
  stroke(255);
  strokeWeight(0.5);
  noFill();
  rect(barX, barY, width, height);
  noStroke();

  // 🟨 bonus护盾（金色），延长最多 1/3 主护盾长度
  if (hasBonus && shieldHeight > 0) {
    let rawBonusHeight = map(this.bonusShieldHP, 0, this.maxBonusShieldHP, 0, height);
    let maxBonusHeight = shieldHeight / 3;
    let bonusHeight = min(rawBonusHeight, maxBonusHeight);

    if (bonusHeight > 0) {
      fill(255, 215, 0);
      currentY -= bonusHeight;
      rect(barX, currentY, width, bonusHeight,radius);

      // 描边 bonus 护盾
      stroke(255);
      strokeWeight(0.5);
      noFill();
      rect(barX, currentY, width, bonusHeight,radius);
      noStroke();
    }
  }

  
}




}


class CollisionManager {
  constructor(player, enemies, bullets) {
    this.player = player;
    this.enemies = enemies;
    this.bullets = bullets;
    this.timeBonuses = timeBonuses;
  }

  update() {
    this.handlePlayerEnemyCollision();
    this.handleBulletPlayerCollision();
    this.handleBulletEnemyCollision();
    this.handlePlayerBonusCollision(); 
  }

  handlePlayerEnemyCollision() {
    let now = millis();
  
    for (let enemy of this.enemies) {
      if (!enemy.hp || !enemy.hp.isAlive()) continue;
  
      if (this.checkCollision(this.player, enemy)) {
        if (now > enemy.nextHitTime) {
          this.player.receiveDamage(enemy.contactDamage); // ✅ 不要提前判断无敌！
          enemy.nextHitTime = now + enemy.hitCooldown;
          console.log("敌人打到玩家！伤害:", enemy.contactDamage);
        }
      }
    }
  }
  
  

  handleBulletPlayerCollision() {
    for (let bullet of this.bullets) {
      
      if (this.checkCollision(this.player, bullet)) {
        if (this.player.isReflecting && !bullet.isReflected) {
          bullet.reflect(); // 开启反弹
          continue;         // 跳过后续伤害处理
        }
          this.player.receiveDamage(10); // 包含伤害判断和 gameOver 判定
          bullet.alive = false;
          console.log("玩家被子弹击中！");
        
      }
    }
  }
  

  handleBulletEnemyCollision() {
    for (let bullet of this.bullets) {
      if (!bullet.isReflected) continue;
      for (let enemy of this.enemies) {
        if (!enemy.hp || !enemy.hp.isAlive()) continue;
        if (this.checkCollision(bullet, enemy)) {
          enemy.hp.takeDamage(10);
          bullet.alive = false;
          console.log("敌人被反弹击中！扣15血");
        }
      }
    }
  }


  handlePlayerBonusCollision() {
    for (let i = this.timeBonuses.length - 1; i >= 0; i--) {
      let bonus = this.timeBonuses[i];
      if (this.checkCollision(this.player, bonus)) {
        timer += bonus.bonusTime;
        warningMessage = "Gained " + bonus.bonusTime + "s!";
        warningTimer = millis() + 3000;
        this.timeBonuses.splice(i, 1);
      }
    }
  }

  checkCollision(a, b) {
    return dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y) < a.r + b.r;
  }
}


class MeleeAttack {
  constructor(player, enemies) {
    this.player = player;
    this.enemies = enemies;
    this.cooldown = 500;         // 冷却时间 ms
    this.lastAttack = -Infinity; // 记录上次触发的时间

    this.inProgress = false;
    this.currentFrame = 0;
    this.frameDuration = 100;      // 每帧时长 ms
    this.frameStartTime = 0;
    this.hitEnemies = new Set(); // ✅ 每次攻击开始前清空
  }

  trigger() {
    if (this.inProgress) return;
    if (millis() - this.lastAttack < this.cooldown) return;

  // 重置并记录本次触发时间
  this.lastAttack    = millis();
    this.inProgress    = true;
    this.currentFrame  = 0;
    this.frameStartTime= millis();
    this.hitEnemies.clear(); // ✅ 初始化已击中敌人列表
    this.player.isAttacking = true;   // 切到攻击 GIF流派系统改动
  }

  update() {
    if (!this.inProgress) return;

    // 推进帧
    if (millis() - this.frameStartTime >= this.frameDuration) {
      this.currentFrame++;
      this.frameStartTime += this.frameDuration;
    }

      // 每帧都判伤，但只判一次每个敌人
    this.dealDamage(this.currentFrame);

  
    // 4 帧完毕后，恢复 Idle
    if (this.currentFrame >= 4) {
      this.inProgress   = false;
      this.currentFrame = 0;
      this.player.isAttacking = false;//流派系统改动
      return;
    }

    // 绘制特效
    this.renderFrame(this.currentFrame);
  }

  // 扇形特效渲染
  renderFrame(frame) {
    const C      = this.player.pos;
    const dirAng = this.player.lastDirection === "left" ? PI : 0;
    const baseR  = 60;
    const R      = baseR * (1 + frame * 0.3);
    const arcAng = radians(240);

    push();
    // —— 只在这里用 HSB —— 
    colorMode(HSB, 360, 100, 100, 255);
    translate(C.x, C.y);
    blendMode(ADD);

  
   const ctx = drawingContext;     // p5 底层 2D Canvas context
   ctx.save();                     // 不污染外面

  // 创建径向渐变：中心 0px → 外缘 R*0.85
   const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.85);
   grad.addColorStop(0,  'rgba(255,255,255,0)');     // 完全透明
   grad.addColorStop(1,  'rgba(220,220,220,0.2)');   // 50% 灰白

   ctx.fillStyle = grad;
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.arc(0, 0, R * 0.85, dirAng - arcAng/2, dirAng + arcAng/2);
   ctx.closePath();
   ctx.fill();
   ctx.restore();
   

    // 高亮线：白色
    stroke(0, 0, 100, 200);
    strokeWeight(4);
    noFill();
    arc(0, 0, R*2.0, R*2.0, dirAng - arcAng/2, dirAng + arcAng/2);

    // 粒子散落
    noStroke();
    for (let i = 0; i < 15; i++) {
      let a  = dirAng - arcAng/2 + random(arcAng);
      let rr = random(R*0.8, R*1.1);
      let x  = cos(a) * rr;
      let y  = sin(a) * rr;
      let sz = random(4, 12);
      // 粒子透明度随帧淡出
      fill(50 + random(-20,20), 100, 100, 200 * (1 - frame/4));
      ellipse(x, y, sz);
    }

    blendMode(BLEND);
    pop();
    // —— pop() 回到原来的 RGB 模式 —— 
  }

  // 伤害判定
  dealDamage(frame) {
    const C      = this.player.pos;
    const dirAng = this.player.lastDirection === "left" ? PI : 0;
    const arcAng = radians(240);
    const baseR  = 60;
    const R      = baseR * (1 + frame * 0.3);  // ✅ 动态半径

    let totalDamage = 0;

    for (let e of this.enemies) {
      if (!e.hp || !e.hp.isAlive()) continue;
      if (this.hitEnemies.has(e)) continue;

      const d = dist(C.x, C.y, e.pos.x, e.pos.y);
      if (d > R + e.r) continue;

      let ang = atan2(e.pos.y - C.y, e.pos.x - C.x);
      let diff = (ang - dirAng + PI * 3) % (PI * 2) - PI;
      if (abs(diff) <= arcAng / 2) {
        const attackInfo = {
          source: "melee",
          player: this.player,
          baseDamage: this.player.buffAttack,
          target: e
        };
        let damageDone = DamageCalculator.calculate(attackInfo);
        totalDamage += damageDone;
        this.hitEnemies.add(e);
        console.log(`Melee hit! 第${frame + 1}帧 - 敌人扣血 ${damageDone}`);
      }
    }

    if (totalDamage > 0) {
      console.log(`✅ 第 ${frame + 1} 帧：总伤害 ${totalDamage}`);
      for (let skill of this.player.selectedSkills) {
        if (skill instanceof LifestealSkill) {
          skill.onDamageDealt(totalDamage, "melee");
        }
      }
    }
  }
}

class DamageCalculator {
  static calculate(attackInfo) {
    const { source, baseDamage, player, target } = attackInfo;
    if (!target || !target.hp || !target.hp.isAlive()) return 0;

    // 根据来源修正最终伤害（被动加成）
    let effectiveDamage = baseDamage;

    if (source === "charged" || source === "melee") {
      effectiveDamage = baseDamage;

      if (player.isInBloodFury) {
        effectiveDamage = floor(baseDamage * 2);  // 血怒增伤
        console.log(`🩸 血怒增伤 [${source}] → 最终伤害: ${effectiveDamage}`);
      }
     
    }


    // 不超过目标血量
    let actualDamage = min(target.hp.currentHP, floor(effectiveDamage));
    target.hp.takeDamage(actualDamage);

    return actualDamage; // 返回真实伤害值
  }
}







class PixelExplosion {
  constructor(pos, count = 20, maxRadius = 50) {
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const angle = random(TWO_PI);
      const radius = random(0, maxRadius);
      const offset = p5.Vector.fromAngle(angle).mult(radius);
      const p = {
        pos: pos.copy(),
        vel: offset.copy().div(15),
        size: random(3, 5),
        gray: random(180, 255),
        life: 60
      };
      this.particles.push(p);
    }
  }

  updateAndDraw() {
    for (let p of this.particles) {
      p.pos.add(p.vel);
      p.life--;

      const alpha = map(p.life, 0, 30, 0, 255);
      fill(p.gray, alpha);
      rect(p.pos.x, p.pos.y, p.size, p.size);
    }

    // 移除死掉的粒子
    this.particles = this.particles.filter(p => p.life > 0);
  }

  isFinished() {
    return this.particles.length === 0;
  }
}


class BlackHole {
  constructor ( x, y, type = "danger", safeRadius = 80, dangerRadius = 60) {
    this.pos = createVector(x, y);
    this.state = "idle";

    this.type = type;  // "danger" or "heal"

    this.safeRadius = safeRadius;   // 玩家进入此范围变状态
    this.dangerRadius = dangerRadius;  // 判定为“在黑洞里”的范围
    this.sparkList = [];

    this.lastDamageTime = 0;  // 记录上次伤害时间
  }

  update( player ) {
    let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    // 切换状态判断
    if ( d < this.dangerRadius ) {
      if ( this.state !== "active") this.state = "active";
      this.applyEffects(player);

    // 标记玩家处于黑洞中
    if (this.type === "danger") {
    player.inBlackHole = true;
    }


    } else {
      this.state = "idle";

    // 离开危险黑洞时记录退出时间
    if (this.type === "danger" && player.inBlackHole) {
    player.inBlackHole = false;
    player.blackHoleExitTime = millis(); // 记录时间
  }
  }


    // 添加火花粒子
    if ( this.state == "active" ) {
      if ( this.type == "danger" ){
        for ( let i = 0; i < 20; i++ ){
          this.sparkList.push(new OgSpark(this.pos.x, this.pos.y));
        }
      } else if ( this.type == "heal" ){
        for ( let i = 0; i < 5; i++ ){
          this.sparkList.push(new CrossSpark(this.pos.x, this.pos.y));
        }
      }

    }

    for (let i = this.sparkList.length - 1; i >= 0; i--) {
      this.sparkList[i].update();
      if (this.sparkList[i].lifespan <= 0) {
        this.sparkList.splice(i, 1);
      }
    }



  }

    applyEffects(player) {
  const now = millis(); // 当前时间（毫秒）

  if (this.type == "danger") {
    const damageInterval = 1000; // 每秒一次（单位：毫秒）

    // 只有超过1秒才造成一次伤害
    if (now - this.lastDamageTime >= damageInterval) {
      player.receiveDamage(2); // ⬅️ 每秒掉2点血（你可以自定义）
      this.lastDamageTime = now;
    }

    // 减速逻辑（仍然每帧判断）
    if (!player.isInvincible && player.speed > 2) {
      player.speed = 2;
    }

  } else if (this.type === "heal") {
    // 同理，每秒回血一次
    const healInterval = 1000;
    if (now - this.lastDamageTime >= healInterval) {
      player.hp.heal(2); // ⬅️ 每秒回2点血
      this.lastDamageTime = now;
    }
  }
}
  
  show() {
      push();
      // translate(this.pos.x, this.pos.y);
      if (this.state === "idle") {
        push();
        translate(this.pos.x, this.pos.y);

        drawPixelSpiralBlackHole(80, frameCount * 0.03); // 打印锯齿状紫色黑洞
        pop();
      } else {
        push();
        translate(this.pos.x, this.pos.y);
        if ( this.type === "danger") {
          drawPurpleBlackHole( 120, frameCount * 0.04);
        } else if ( this.type === "heal" ) {
          drawGreenBlackHole(120, frameCount * 0.04);
        }
        // drawCircularSpiral(40, 8, frameCount * 0.08);    // 危险螺旋状态
        pop();

        for (let spark of this.sparkList) spark.display();
      }
      pop();
  }

  }



  // 危险的紫色黑洞
  function drawPurpleBlackHole( maxRadius, angleOffset) {
    let arms = 4; // 螺旋臂数was 3
    // let maxRadius = 120;
    let angleStep = 0.15;

    let pixelSize = 6;     // 像素块大小（越大越粗糙）
    let innerRadius = 10;

    for (let t = 0; t < TWO_PI * 10; t += angleStep) {
      let r = map(t, 0, TWO_PI * 10, 10, maxRadius);
      let baseAngle = t + angleOffset;

      for ( let a = 0; a < arms; a++ ) {
        let armOffset = a * TWO_PI / arms;
        let x = r * cos(baseAngle + armOffset);
        let y = r * sin(baseAngle + armOffset);
        let brightness = map(r, 10, maxRadius, 255, 20);
        fill(120, 0, 255, brightness); // 冷紫，alpha 控制亮暗


        // 像素网格对齐：确保块状颗粒感
        let px = floor(x / pixelSize) * pixelSize;
        let py = floor(y / pixelSize) * pixelSize;
        rect(px, py, pixelSize, pixelSize);

        // point(x, y);
      }
    }

    // noStroke();
    // fill(0);
    // ellipse(0, 0, 40, 40);
    // 中心遮挡（保持）
    fill(0);
    rect(-pixelSize/2, -pixelSize/2, pixelSize * 2, pixelSize * 2);

    // pop();

  }


// 安全的绿色黑洞，进去可以回血
function drawGreenBlackHole( maxRadius, angleOffset) {
  let arms = 4; // 螺旋臂数was 3
  // let maxRadius = 120;
  let angleStep = 0.15;

  let pixelSize = 6;     // 像素块大小（越大越粗糙）
  let innerRadius = 10;

  for (let t = 0; t < TWO_PI * 10; t += angleStep) {
    let r = map(t, 0, TWO_PI * 10, 10, maxRadius);
    let baseAngle = t + angleOffset;

    for ( let a = 0; a < arms; a++ ) {
      let armOffset = a * TWO_PI / arms;
      let x = r * cos(baseAngle + armOffset);
      let y = r * sin(baseAngle + armOffset);
      let brightness = map(r, 10, maxRadius, 255, 20);
      fill(0, 180, 80, brightness); // 绿色，alpha 控制亮暗


      // 像素网格对齐：确保块状颗粒感
      let px = floor(x / pixelSize) * pixelSize;
      let py = floor(y / pixelSize) * pixelSize;
      rect(px, py, pixelSize, pixelSize);

      // point(x, y);
    }
  }

  // noStroke();
  // fill(0);
  // ellipse(0, 0, 40, 40);
  // 中心遮挡（保持）
  fill(0);
  rect(-pixelSize/2, -pixelSize/2, pixelSize * 2, pixelSize * 2);

  // pop();

}





  // 锯齿状，紫色黑洞
  function drawPixelSpiralBlackHole( maxRadius, angleOffset ) {
    let stepSize = 4;
    let palette = [
      color(0),    
      color(59, 0, 102),
      color(68)
    ];

    let spiralTurns = 5;
    let angleStep = PI / 64;  // 更细腻的角度
    for (let t = 0; t < spiralTurns * TWO_PI; t += angleStep) {
      let r = map(t, 0, spiralTurns * TWO_PI, 0, maxRadius);
      let angle = t + angleOffset;

      let x = r * cos(angle);
      let y = r * sin(angle);

      // 调色：越靠近中心越黑
      let index = int(map(r, 0, maxRadius, 0, palette.length));
      index = constrain(index, 0, palette.length - 1);

      fill(palette[index]);
      rect(floor(x / stepSize) * stepSize, floor(y / stepSize) * stepSize, stepSize, stepSize);
    }
  }

  // 螺旋图案
  function drawCircularSpiral(radius, stepSize, angleOffset) {
    push();
    rotate(angleOffset);
    for (let r = radius; r > 0; r -= stepSize) {
      let angleStep = PI / 8;
      for (let a = 0; a < TWO_PI; a += angleStep) {
        let x = r * cos(a);
        let y = r * sin(a);
        let index = int((r + a * 10) / stepSize);
        fill(index % 2 === 0 ? 0 : 80);
        rect(x, y, stepSize, stepSize);
      }
    }
    pop();
  }

  // 普通火花
  class OgSpark {
    constructor(x, y) {
      this.pos = createVector(x, y);
      this.vel = p5.Vector.random2D().mult(random(2, 5));
      this.lifespan = 40 + random(20);
      let palette = [
        color(255, 105, 180),
        color(255, 165, 0),
        color(50, 255, 100)
      ];
      this.color = random(palette);
    }
  
    update() {
      this.pos.add(this.vel);
      this.lifespan -= 2;
    }
  
    display() {
      fill(red(this.color), green(this.color), blue(this.color), this.lifespan * 4);
      let px = floor(this.pos.x / 4) * 4;
      let py = floor(this.pos.y / 4) * 4;
      rect(px, py, 6, 6);
    }
  }

// 回血的绿色火花
class CrossSpark {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
    this.lifespan = 40 + random(20);
    this.size = 30;
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan -= 2;
  }

  display() {
    let px = floor(this.pos.x / 4) * 4;
    let py = floor(this.pos.y / 4) * 4;
    let alpha = this.lifespan * 4;

    fill(50, 255, 100, alpha); // 绿色

    // 绘制十字：竖一条，横一条
    rect(px, py - this.size, this.size, this.size);
    rect(px, py, this.size, this.size);
    rect(px, py + this.size, this.size, this.size);
    rect(px - this.size, py, this.size, this.size);
    rect(px + this.size, py, this.size, this.size);
  }
}

//新增对于playergif的管理流派系统
/* ========= ③ SpriteManager ========= */
class SpriteManager {
  constructor(player) {
    this.player  = player;
    this.queue   = [];   // {name, end, prio, ts}
  }

  /* 请求一张覆盖层 gif */
  request(name, keepMs, prio = 1) {
    this.queue.push({ name, end: millis()+keepMs, prio, ts: millis() });
  }

  /* 清过期 & 取当前 overlay */
  getCurrentOverlay() {
    const now = millis();
    this.queue = this.queue.filter(r => r.end > now);
    if (this.queue.length === 0) return "base";
    // 先比 prio 再比 ts
    return this.queue.sort((a,b)=>(b.prio-a.prio)||(b.ts-a.ts))[0].name;
  }

  /* Player.show() 调用 */
  chooseGif() {
    const fac   = this.player.faction;                // 流派
    const state = this.player.isAttacking ? "attack":"idle";
    const over  = this.getCurrentOverlay();           // shield/dash/base

    const p1 = GIF_POOL[fac]      ?? GIF_POOL.normal;
    const p2 = p1[state]          ?? p1.idle;
    return       p2[over]         ?? p2.base ?? null; // 兜底
  }
}


//新增tower类用于boss的弹幕技能-------------------------------------------------
class Tower extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r   = 30;
    this.hp  = new HPSystem(70);      // 两下子就能被拆
    this.gif = TOWER_IMG;
  }
  update() {
    // 固定不动，只管死亡检测
    super.update();
  }
  show() {
    if (this.exploding && this.explosion) {
      super.show();
    } else {
      if (this.gif) {
        push();
        imageMode(CENTER);
        image(this.gif, this.pos.x, this.pos.y, this.r*3.5, this.r*3.5);
        pop();
      } 
      this.hp.drawHP(this.pos.x, this.pos.y, this.r);
    }
  }
}

/* ---------- 跳商店 ---------- */
async function goToShop() {
  // 直接跳转到商店页面，不再提前更新 current_level
  window.location.href = `shop.html?saveId=${saveId}`;
}

// 文件末尾加上：
window.preload    = preload;
window.setup      = setup;
window.draw       = draw;
window.keyPressed = keyPressed;
window.keyReleased= keyReleased;
window.addEventListener('message', e => {
  if (e.data?.type === 'pause_action') {
    pauseFrame.style.display = 'none';
    const action = e.data.action;
    if (action === 'resume') {
      loop();      // 恢复 p5.js draw 循环
      window.focus();
    }
    // …
  }
});