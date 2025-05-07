import { supabase } from './js/supabase.js';

const params = new URLSearchParams(window.location.search);
const saveId = params.get('saveId');

if (!saveId) {
  alert('缺少存档 ID，无法加载存档。');
  throw new Error('saveId required');
}

let savedLevel, savedMode, savedSkills = [];
let dataLoaded = false;

async function loadSaveData() {
  const { data, error } = await supabase
    .from('saves')
    .select('current_level, mode, skills')
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

  console.log('读到存档→', { savedLevel, savedMode, savedSkills });
}

let player;
let enemies = [];

let zoom = 1;
let gameOver = false;
let score = 0; // 记录得分
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
let gamePaused = false;

let remainingTime = 60; // 剩余时间（秒）

const GIF_POOL = {
  normal: { idle:{}, attack:{} },
  agile : { idle:{}, attack:{} },
  power : { idle:{}, attack:{} },
  tank  : { idle:{}, attack:{} }
};





function preload() {

  loadSaveData().then(() => {
    dataLoaded = true;
  });

  skillIcons["闪现"] = null;
  skillIcons["火球"] = null;
  skillIcons["护盾"] = null;
  skillIcons["治疗"] = null;
  skillIcons["冰冻"] = null;
  skillIcons["反弹"] = null;
  bulletEnemyImg = null;
  //loadImage("弹幕怪.gif");
  bulletImg = null;
  //loadImage("弹幕1.gif");
  //这里的注释是为了测试方便，加载图片不是必须的，传入null可以只测试代码功能。
  bulletReflectedImg = null;
  //playerReflectGif   = null;          // or loadImage("player-reflect.gif");
  //玩家贴图
  //playerIdleRightGif  = null;
  //loadImage("精灵-0001.gif");
  //playerAttackRightGif= null;
  //loadImage("精灵-0002.gif");

  GIF_POOL.normal.idle.base   = null;
  GIF_POOL.normal.idle.dash   = null;
  GIF_POOL.normal.idle.boost  = null;
  GIF_POOL.normal.idle.steal  = null;
  GIF_POOL.normal.idle.charge = null;
  GIF_POOL.normal.idle.shield = null;
  GIF_POOL.normal.attack.base   = null;
  GIF_POOL.normal.attack.dash   = null;//没用
  GIF_POOL.normal.attack.boost  = null;
  GIF_POOL.normal.attack.steal  = null;
  GIF_POOL.normal.attack.charge = null;//没用
  GIF_POOL.normal.attack.shield = null;
  GIF_POOL.agile.idle.base   = null;
  GIF_POOL.agile.idle.dash   = null;
  GIF_POOL.agile.idle.boost  = null;
  GIF_POOL.agile.attack.base  = null;
  GIF_POOL.agile.attack.dash  = null;//没用
  GIF_POOL.agile.attack.boost = null;
  GIF_POOL.power.idle.base   = null;
  GIF_POOL.power.idle.steal  = null;
  GIF_POOL.power.idle.charge = null;
  GIF_POOL.power.attack.base   = null;
  GIF_POOL.power.attack.steal  = null;
  GIF_POOL.power.attack.charge = null;//没用
  GIF_POOL.tank.idle.base   = null;
  GIF_POOL.tank.idle.shield = null;
  GIF_POOL.tank.attack.base   = null;
  GIF_POOL.tank.attack.shield = null;

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
  skillSystem.addSkill(new DashResetSkill(player, skillSystem.selectedSkills));
  skillSystem.addSkill(new LifestealSkill(player));
  skillSystem.addSkill(new ChargeStrikeSkill(player, enemies));
  skillSystem.addSkill(new BloodFurySkill(player));
  skillSystem.addSkill(new ReflectSkill(player));
  skillSystem.addSkill(slowField);
  skillSystem.addSkill(fieldShock);

  skillSystem.selectedSkills = [];

  /*if (savedSkills) {
    // 使用存档中的技能名选择技能
    for (let name of savedSkills) {
      let skill = skillSystem.allSkills.find(s => s.name === name);
      if (skill) skillSystem.selectSkill(skill);
    }
  } */
 
 skillSystem.selectSkill(skillSystem.allSkills[6]);
 skillSystem.selectSkill(skillSystem.allSkills[7]);
 skillSystem.selectSkill(skillSystem.allSkills[8]);

  player.selectedSkills = skillSystem.selectedSkills;

}


function setPlayer() {
  player = new Player(0, 0, 30);
  startTime = millis();
}

function setEnemies() {
  
    enemies = [];
    let minSpawnDistance = player.r * 10;//**敌人生成的最小距离（确保不在玩家附近生成）
   
    // **追踪敌人
    for (let i = 0; i < 3; i++) {
      let wanderPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new FollowEnemy(wanderPos.x, wanderPos.y));
    }
  
    // **伏击型敌人
    for (let i = 0; i < 4; i++) {
      let ambushPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new AmbushEnemy(ambushPos.x, ambushPos.y, 45));
    }
  
    // **隐形敌人
    for (let i = 0; i < 30; i++) {
      let stealthPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new StealthEnemy(stealthPos.x, stealthPos.y, 40));
    }
  
    // **弹幕怪
    for (let i = 0; i < 3; i++) {
      let pos = generateValidEnemyPosition(200);
      enemies.push(new BulletEnemy(pos.x, pos.y, 35));
    }

      // 普通小怪一开始生成多个
  for (let i = 0; i < 10; i++) {
    let pos = generateOutsideViewPosition();
    enemies.push(new CommonEnemy(pos.x, pos.y));
  }

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



// 检查暂停状态
if (typeof gamePaused !== 'undefined' && gamePaused) {
  clear(); // 保持黑色背景
  if (levelManager && levelManager.currentLevel) {
    levelManager.currentLevel.draw();  // 显示关卡的提示语
  }
  drawInfo();  // 分数、时间、技能 HUD
  return;  // 提前退出，避免更新其他逻辑
}

// 只有在关卡没结束时更新倒计时
if (!levelManager.currentLevel.finished) {
  updateTimer();
}



updateCamera();
 
drawMapBorder();

//updateTimeBonuses();

//updateEnemies();

//updateBoss();

//updateBullets()

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

/*updatePlayer();
    // … 更新、绘制玩家后 …
player.meleeAttack.update();
collisionManager.update();*/

// HUD & 碰撞
drawInfo();

// 最后再叠加 Game Over 界面**
if (gameOver) {
  showGameOverScreen();
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

  loadLevel(index) {
    if (index < 0 || index >= this.levels.length) {
      console.error("关卡索引超出范围！");
      return;
    }
    this.currentLevel = this.levels[index];
    console.log(`加载 Level ${index + 1}`);
    this.currentLevel.start();  // 启动关卡

    //  每次加载新关卡后，重新创建碰撞检测器和近战攻击器
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
    this.name = name;
    this.baseScore = 0;
    this.timeBonus = 0;
    this.totalScore = 0;

    this.saveSlots = [1, 2, 3, 4, 5];   // 存档槽编号（以后可扩展为真正的存档信息）
    this.selectedSlotIndex = 0;         // 当前高亮选中的存档框索引（0 ~ 4）


    this.finished = false;
  }

  start() {
    console.log(`开始关卡: ${this.name}`);
    player.hp.currentHP = player.hp.maxHP;  // 每关开始时HP回复满
    // 初始化关卡数据（如敌人、道具等）
  }

  update() {
    // 关卡的逻辑更新，比如特殊机制
  }

  draw() {
    // 关卡的特效、提示
  }

  // 通用结算方法
  finalizeScore() {
    this.baseScore = score;
    this.timeBonus = Math.floor(remainingTime) * 10;
    this.totalScore = this.baseScore + this.timeBonus;

  }

  onTimeUp() {
    console.log("时间到（BaseLevel 默认处理）：判定失败");
    gameOver = true;  // 默认行为：时间到即失败（比如 Boss 关）
  }
  


  // 通用结算画面
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
    text("Press any key to countinue", windowWidth / 2, windowHeight / 2 + 120);
    }

    
    else if (this.postGameStage === 1) {
      // 第二步：保存/继续界面
      textSize(30);

      textSize(24);
      text("Save current progress(press 'S')", windowWidth / 2, windowHeight / 2);
      text("Countinue without saving(press 'C')", windowWidth / 2, windowHeight / 2 + 40);
    }

    else if (this.postGameStage === 2) {
    // 存档界面（简单显示存档格子）
    textSize(30);
    text("Please select a save slot", windowWidth / 2, windowHeight / 2 - 160);

    const slotWidth = 400;
    const slotHeight = 50;
    const slotSpacing = 20;
    const startX = windowWidth / 2 - slotWidth / 2;
    const startY = windowHeight / 2 - 100;

    for (let i = 0; i < this.saveSlots.length; i++) {
      let y = startY + i * (slotHeight + slotSpacing);

      // 高亮选中的槽
      if (i === this.selectedSlotIndex) {
          fill(100, 200, 255);  
          stroke(255);
          strokeWeight(3);
      } else {
          fill(80);
          stroke(180);
          strokeWeight(1);
      }

      rect(startX, y, slotWidth, slotHeight, 8);  // 圆角矩形

      // 绘制槽号
      fill(255);
      noStroke();
      textSize(20);
      textAlign(CENTER, CENTER);
    }

    textSize(18);
    fill(200);
    text("Use ↑ ↓ to select, press Enter to save", windowWidth / 2, windowHeight - 60);
  }
}


handleKeyPressed(key) {
  if (this.finished) {

    // 🔥 特殊快捷键：按 2 / 3 / 4 直接切换关卡
    if (key === '2') {
      console.log("🔄 跳转到 Level 2");
      levelManager.loadLevel(1);  // 关卡数组是从 0 开始的
      return;
  } else if (key === '3') {
      console.log("🔄 跳转到 Level 3");
      levelManager.loadLevel(2);
      return;
  } else if (key === '4') {
      console.log("🔄 跳转到 Level 4");
      levelManager.loadLevel(3);
      return;
  }



      if (this.postGameStage === 0) {
          // 玩家按任意键继续
          this.postGameStage = 1;
      }
      else if (this.postGameStage === 1) {
          if (key === 'S' || key === 's') {
              // 进入存档界面
              this.postGameStage = 2;
          }
          else if (key === 'C' || key === 'c') {
              // 🚀 直接进入下一关
              console.log("玩家选择继续下一关");
              levelManager.loadNextLevel();
          }
      }
      else if (this.postGameStage === 2) {
          // 在存档界面时，用 ↑ ↓ 选择槽，用 Enter 存档
          if (keyCode === UP_ARROW) {
              this.selectedSlotIndex = (this.selectedSlotIndex - 1 + this.saveSlots.length) % this.saveSlots.length;
          }
          else if (keyCode === DOWN_ARROW) {
              this.selectedSlotIndex = (this.selectedSlotIndex + 1) % this.saveSlots.length;
          }
          else if (keyCode === ENTER) {
              const selectedSlot = this.saveSlots[this.selectedSlotIndex];
              console.log(`保存到槽 ${selectedSlot}`);
              this.saveProgress(selectedSlot);

              // 存档完毕，自动进入下一关
              levelManager.loadNextLevel();
          }
      }
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

    this.tip = "Welcome to the Epilogue, Hunter";
    this.playerHasMoved = false;
    this.attackCount = 0;

    this.countdownStarted = false;
    this.countdownStartTime = 0;
    this.remainingTime = 60;  // 1 分钟
    this.completed = false;

    this.tipExpireTime = null;  // 🆕 提示语消失的时间戳（单位：毫秒）
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
    push();
    resetMatrix();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);
    // text(this.tip, windowWidth / 2, 80);

    // 判断是否过期：只有未过期时显示
    if (!this.tipExpireTime || millis() < this.tipExpireTime) {
      text(this.tip, windowWidth / 2, 80);
  }


    // 如果关卡完成，弹出结算界面
    if (this.finished) {
        this.showSummaryScreen();
    }


    pop();
  }



  // 提供给外部的事件监听方法
  handleKeyPressed(key) {
    if (this.stage === 0) {
      this.stage = 1;
      this.tip = "Use the arrow keys to move";
    }else {
      // 默认的处理交给 BaseLevel
      super.handleKeyPressed(key);
  }

    
  }

  handlePlayerMoved() {
    if (this.stage === 1) {
      this.stage = 2;
      this.tip = "Press A for melee attack";
    }
  }

  handlePlayerAttack() {
    if (this.stage === 2) {
      this.attackCount++;
      if (this.attackCount >= 8) {
        this.stage = 3;
        this.tip = "Excellent! A large wave of enemies is coming. Survive within the time limit!";
        this.tipExpireTime = millis() + 10000;  // 设置10秒后消失

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
      this.finished = false;

      this.blackHoles = [];

      // this.pauseTimer = millis() + 10000;  // 10秒后触发暂停提示
      this.pauseShown = false;
      this.pausedForBlackHoleTip = false;

      this.postGameStage = 0;
  }
  start() {
    super.start();
    console.log("Level2 已开始");

    // 玩家归位
    player.pos.set(0, 0);

    // 清空数组
    enemies.length = 0;
    bullets.length = 0;
    timeBonuses.length = 0;

    // 初始化提示内容 + 定时消失
    this.tip = "Marked for death...The ambush is coming fast - stay alert!";
    this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒

    // 刷敌人（正常血量）
    let minSpawnDistance = player.r * 10;

    this.pauseTimer = millis() + 10000;  // 10秒后触发黑洞暂停提示

    // AmbushEnemy
    for (let i = 0; i < 4; i++) {
        let ambushPos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new AmbushEnemy(ambushPos.x, ambushPos.y));
    }

    // FollowEnemy
    for (let i = 0; i < 5; i++) {
        let followPos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new FollowEnemy(followPos.x, followPos.y));
    }

    // CommonEnemy
    for (let i = 0; i < 8; i++) {
        let pos = generateOutsideViewPosition();
        enemies.push(new CommonEnemy(pos.x, pos.y));
    }

    // 刷黑洞
    for (let i = 0; i < 2; i++) {
        let pos = generateValidEnemyPosition(300);
        this.blackHoles.push(new BlackHole(pos.x, pos.y, "danger"));
    }
    let healPos = generateValidEnemyPosition(300);
    this.blackHoles.push(new BlackHole(healPos.x, healPos.y, "heal"));

    // 设置倒计时
    timer = 60;
    startTime = millis();

    this.stage = 1;  // 切换到正式战斗阶段
  }

  update() {
    if (this.stage === 1) {
        // 检查黑洞提示是否触发
        if (!this.pauseShown && millis() > this.pauseTimer) {
            gamePaused = true;
            this.tip = "Seek out the black holes🌀— some heal, some hurt!";
            this.pauseShown = true;
            this.pausedForBlackHoleTip = true;
            this.tipExpireTime = null;  // 让它一直显示，直到按键继续
        }

        // 检查完成
        if (!this.finished && remainingTime <= 0) {
            this.stage = 2;
            this.tip = "Finished！";
            this.finished = true;

            // 结算分数
            this.finalizeScore();
        }

        

        // 更新奖励物
        for (let i = timeBonuses.length - 1; i >= 0; i--) {
            timeBonuses[i].show();
        }

        // 更新黑洞
        for (let bh of this.blackHoles) {
            bh.update(player);
            bh.show();
        }

        // 更新敌人
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.update();
            enemy.show();

            if (enemy.isExplosionFinished()) {
                if (enemy instanceof CommonEnemy) {
                    let pos = generateOutsideViewPosition();
                    enemies.push(new CommonEnemy(pos.x, pos.y));
                }
                enemies.splice(i, 1);
            }
        }

        // 更新子弹
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update();
            bullets[i].show();
            if (!bullets[i].alive) {
                bullets.splice(i, 1);
            }
        }
    }
}
  
onTimeUp() {
  if (!this.finished) {
    console.log("Level2 时间到，正常结算");
    this.stage = 2;
    this.tip = "Finished！";
    this.finished = true;
    this.finalizeScore();
  }
}

  
draw() {
  push();
  resetMatrix();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);

  // 判断是否过期：只有未过期时显示
  if (!this.tipExpireTime || millis() < this.tipExpireTime) {
      text(this.tip, windowWidth / 2, 80);
  }

  if (this.finished) {
      this.showSummaryScreen();
  }

  pop();
}

// 外部事件监听
handleKeyPressed(key) {
  // 黑洞提示暂停状态，按任意键继续
  if (this.pausedForBlackHoleTip) {
      gamePaused = false;
      this.tip = "";
      this.pausedForBlackHoleTip = false;
  } else {
    // 其他按键转发给 BaseLevel，处理 Save / Continue 等逻辑
    super.handleKeyPressed(key);
}
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
    this.finished = false;

    this.blackHoles = [];
    this.postGameStage = 0;
  }

  start() {
    super.start();
    console.log("Level3 已开始");

    // 玩家归位
    player.pos.set(0, 0);

    // 清空数组
    enemies.length = 0;
    bullets.length = 0;
    timeBonuses.length = 0;

    // 初始化提示内容 + 定时消失
    this.tip = "Something's lurking in the dark... Run for your life!";
    this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒


    // 刷敌人
    let minSpawnDistance = player.r * 10;

    // AmbushEnemy
    for (let i = 0; i < 4; i++) {
      let ambushPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new AmbushEnemy(ambushPos.x, ambushPos.y));
    }

    // StealthEnemy
    for (let i = 0; i < 4; i++) {
      let stealthPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new StealthEnemy(stealthPos.x, stealthPos.y));
    }

    // FollowEnemy
    for (let i = 0; i < 5; i++) {
      let followPos = generateValidEnemyPosition(minSpawnDistance);
      enemies.push(new FollowEnemy(followPos.x, followPos.y));
    }

    // CommonEnemy
    for (let i = 0; i < 10; i++) {
      let pos = generateOutsideViewPosition();
      enemies.push(new CommonEnemy(pos.x, pos.y));
    }

    // 刷黑洞
    for (let i = 0; i < 2; i++) {
      let pos = generateValidEnemyPosition(300);
      this.blackHoles.push(new BlackHole(pos.x, pos.y, "danger"));
    }
    let healPos = generateValidEnemyPosition(300);
    this.blackHoles.push(new BlackHole(healPos.x, healPos.y, "heal"));

    // 刷奖励物
    for (let i = 0; i < 3; i++) {
      timeBonuses.push(new TimeBonus(
        random(-width, width),
        random(-height, height),
        15
      ));
    }

    // 设置倒计时
    timer = 60;
    startTime = millis();

    this.stage = 1;  // 切换到正式战斗阶段
  }

  update() {
    if (this.stage === 1) {
      // 检查完成
      if (!this.finished && remainingTime <= 0) {
        this.stage = 2;
        this.tip = "Finished！";
        this.finished = true;

        // 结算分数
        this.finalizeScore();
      }

      // 更新奖励物
      for (let i = timeBonuses.length - 1; i >= 0; i--) {
        timeBonuses[i].show();
      }

      // 更新黑洞
      for (let bh of this.blackHoles) {
        bh.update(player);
        bh.show();
      }

      // 更新敌人
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.show();

        if (enemy.isExplosionFinished()) {
          if (enemy instanceof CommonEnemy) {
            let pos = generateOutsideViewPosition();
            enemies.push(new CommonEnemy(pos.x, pos.y));
          }
          enemies.splice(i, 1);
        }
      }

      // 更新子弹
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].show();
        if (!bullets[i].alive) {
          bullets.splice(i, 1);
        }
      }

              // 检查完成
              if (!this.finished && remainingTime <= 0) {
                this.stage = 2;
                this.tip = "Finished！";
                this.finished = true;
    
                // 结算分数
                this.finalizeScore();
            }

    }
  }


  onTimeUp() {
    if (!this.finished) {
      console.log("Level3 时间到，正常结算");
      this.stage = 2;
      this.tip = "Finished！";
      this.finished = true;
      this.finalizeScore();
    }
  }
  

  draw() {
    push();
    resetMatrix();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);

    // 判断是否过期：只有未过期时显示
    if (!this.tipExpireTime || millis() < this.tipExpireTime) {
      text(this.tip, windowWidth / 2, 80);
    }

    if (this.finished) {
      this.showSummaryScreen();
    }

    pop();
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
      this.finished = false;
  
      this.blackHoles = [];
      this.postGameStage = 0;
    }

    start() {
      super.start();
      console.log("Level4 已开始");
  
      // 玩家归位
      player.pos.set(0, 0);
  
      // 清空数组
      enemies.length = 0;
      bullets.length = 0;
      timeBonuses.length = 0;
  
      // 初始化提示内容 + 定时消失
      this.tip = "Something wicked this way comes! Dodge their bullets!";
      this.tipExpireTime = millis() + 10000;  // 初始提示显示10秒
  
  
      // 刷敌人
      let minSpawnDistance = player.r * 10;
  
      // BulletEnemy（弹幕怪）追击玩家
      for (let i = 0; i < 5; i++) {
        let pos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new BulletEnemy(pos.x, pos.y, 35));
      }
  
      // AmbushEnemy
      for (let i = 0; i < 4; i++) {
        let ambushPos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new AmbushEnemy(ambushPos.x, ambushPos.y));
      }
  
      // StealthEnemy
      for (let i = 0; i < 4; i++) {
        let stealthPos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new StealthEnemy(stealthPos.x, stealthPos.y));
      }
  
      // FollowEnemy
      for (let i = 0; i < 5; i++) {
        let followPos = generateValidEnemyPosition(minSpawnDistance);
        enemies.push(new FollowEnemy(followPos.x, followPos.y));
      }
  
      // CommonEnemy
      for (let i = 0; i < 10; i++) {
        let pos = generateOutsideViewPosition();
        enemies.push(new CommonEnemy(pos.x, pos.y));
      }
  
      // 刷黑洞
      for (let i = 0; i < 2; i++) {
        let pos = generateValidEnemyPosition(300);
        this.blackHoles.push(new BlackHole(pos.x, pos.y, "danger"));
      }
      let healPos = generateValidEnemyPosition(300);
      this.blackHoles.push(new BlackHole(healPos.x, healPos.y, "heal"));
  
      // 刷奖励物
      for (let i = 0; i < 3; i++) {
        timeBonuses.push(new TimeBonus(
          random(-width, width),
          random(-height, height),
          15
        ));
      }
  
      // 设置倒计时
      timer = 60;
      startTime = millis();
  
      this.stage = 1;  // 切换到正式战斗阶段
    }
update() {
  if (this.stage === 1) {
    // 检查完成
    if (!this.finished && remainingTime <= 0) {
      this.stage = 2;
      this.tip = "Finished！";
      this.finished = true;

      // 结算分数
      this.finalizeScore();
    }

    // 更新奖励物
    for (let i = timeBonuses.length - 1; i >= 0; i--) {
      timeBonuses[i].show();
    }

    // 更新黑洞
    for (let bh of this.blackHoles) {
      bh.update(player);
      bh.show();
    }

    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.update();
      enemy.show();

      if (enemy.isExplosionFinished()) {
        if (enemy instanceof CommonEnemy) {
          let pos = generateOutsideViewPosition();
          enemies.push(new CommonEnemy(pos.x, pos.y));
        }
        enemies.splice(i, 1);
      }
    }

    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      bullets[i].show();
      if (!bullets[i].alive) {
        bullets.splice(i, 1);
      }
    }

            // 检查完成
            if (!this.finished && remainingTime <= 0) {
              this.stage = 2;
              this.tip = "Finished！";
              this.finished = true;
  
              // 结算分数
              this.finalizeScore();
          }
  


  }
}

onTimeUp() {
  if (!this.finished) {
    console.log("Level4 时间到，正常结算");
    this.stage = 2;
    this.tip = "Finished！";
    this.finished = true;
    this.finalizeScore();
  }
}



draw() {
  push();
  resetMatrix();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);

  // 判断是否过期：只有未过期时显示
  if (!this.tipExpireTime || millis() < this.tipExpireTime) {
    text(this.tip, windowWidth / 2, 80);
  }

  if (this.finished) {
    this.showSummaryScreen();
  }

  pop();
}

handleKeyPressed(key) {
  // 直接转发给 BaseLevel 处理 Save / Continue 等逻辑
  super.handleKeyPressed(key);
}


}



function updateTimer() {
  let elapsedTime = (millis() - startTime) / 1000;
  remainingTime = max(0, timer - elapsedTime);
  // if (remainingTime <= 0) {
  //   gameOver = true;
  //   showGameOverScreen();
  // }
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
  stroke(255, 0, 0);
  strokeWeight(5);
  noFill();
  rectMode(CENTER);
  rect(0, 0, width * 2, height * 2);
  pop();
}

function updateTimeBonuses() {
  for (let i = timeBonuses.length - 1; i >= 0; i--) {
    timeBonuses[i].show();
    
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    enemy.update();       // 控制逻辑（会设置死亡、生成爆炸对象）
    enemy.show();         // 必须调用！让它画出爆炸/尸体

    // ❗最后判断是否爆炸动画也结束了
    if (enemy.isExplosionFinished()) {
      // 如果是 CommonEnemy，就补充一个新的
      if (enemy instanceof CommonEnemy) {
        let pos = generateOutsideViewPosition();
        enemies.push(new CommonEnemy(pos.x, pos.y));
      }

      enemies.splice(i, 1);
  }
}
}




function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (!bullets[i].alive) {
      bullets.splice(i, 1);
    }
  }
}

function updatePlayer() {
  player.update();
  player.show();
}

function updateBoss(){
  
    boss.update();
    boss.show();
  
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
  text(`Player HP: ${player.hp.currentHP} / ${player.hp.maxHP}`, 20, 110);
  
  

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
  text("Final Score: " + score, windowWidth / 2, windowHeight / 2);
  text("Press 'R' to Restart", windowWidth / 2, windowHeight / 2 + 40);

  pop();
}


function keyPressed() {
  keys[key] = true; // 记录按下的按键

  if (key === 'R' || key === 'r') { // 按 R 重新开始
    restartGame();
  }



  if (key == '1'){
    gamelevel = 1;
  }
  
  if (key == '2'){
    gamelevel = 2;
  }
  
  if (key.toLowerCase() === 'a') {
    if (!player.isCharging) { // ✅ 正在蓄力时不能普攻
      player.meleeAttack.trigger();
    } else {
      console.log("⚠️ 当前为蓄力攻击状态，禁止普通攻击");
    }

    // 告诉 Level1 玩家攻击了
  if (levelManager && levelManager.currentLevel instanceof Level1) {
    levelManager.currentLevel.handlePlayerAttack();
}
  }

  // 让当前关卡处理按键
  if (levelManager && levelManager.currentLevel) {
    levelManager.currentLevel.handleKeyPressed(key);
}
  
  

  skillSystem.tryActivateSkill(key); // 让技能系统处理按键
  
  
}

function keyReleased() {
  keys[key] = false; // 记录松开的按键
}



//保留，可以复用为其他的类别的移动方式
function FoodMovePattern(food) {
  let range = 10; // 运动范围
  let speed = 0.5; // 普通食物移动速度

  if (food.type === "normal") {
    // Normal 食物 - 轻微漂浮
    food.pos.x += random(-speed, speed);
    food.pos.y += random(-speed, speed);
  } 
  else if (food.type === "trap") {
    // Trap 食物 - 更剧烈的抖动
    food.pos.x += random(-speed * 5, speed * 5);
    food.pos.y += random(-speed * 5, speed * 5);
  } 
  else if (food.type === "power_invincible" || food.type === "power_speedBoost") {
    // Power 食物 - 旋转运动
    food.angle += 0.05; // 控制旋转速度
    food.pos.x = food.basePos.x + cos(food.angle) * range;
    food.pos.y = food.basePos.y + sin(food.angle) * range;
  }

  // 确保食物不会移动得太远
  food.pos.x = constrain(food.pos.x, food.basePos.x - range, food.basePos.x + range);
  food.pos.y = constrain(food.pos.y, food.basePos.y - range, food.basePos.y + range);
}



function checkGameOver() {
  if (gameOver) {
    showGameOverScreen();
    return true;
  }
  return false;
}


 //重新开始
 function restartGame() {
  gameOver = false;
  player.hp.currentHP = player.hp.maxHP;  // 复活时满血（保险）
  player.hp.isDead = false; // 重置死亡状态
  score = 0;                               // 保留分数 or 重置，看需要
  startTime = millis();

  player.speed = player.baseSpeed || 4;  // 重置速度（4 是默认值）


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

    
    // **检查敌人与玩家的距离**
    if (dist(pos.x, pos.y, player.pos.x, player.pos.y) >= minDistance) {
      safe = true; // 只有当距离足够远时才接受这个位置
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


class Player {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = 35;
    this.speed = 4;


    
    this.hp = new HPSystem(1000); // 初始血量100
    

    this.baseAttack = 15;  // 原本的基础攻击力
    this.attackPower = this.baseAttack; // 当前生效的攻击力（默认 = 基础）

    this.isInvincible = false; // 初始不无敌

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

  }

  
  //两个被调用来切图的方法
  playAttackGif() {
  this.isAttacking = true;
  // 根据当前朝向切 GIF
   }

  resetImage() {
  this.isAttacking = false;
  // 切回 Idle 图
   }



  update() {
    this.updateSkills(); // 更新技能状态
    
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
    
    
 
    
    
    
    
  
  }

  updateSkills() {
    for (let skill of this.selectedSkills) {
      if (skill && typeof skill.update === 'function') {
        skill.update(); // 调用技能自身的 update 方法
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
      this.r * (this.isAttacking ? 2.5 : 2),
      this.r * (this.isAttacking ? 2.5 : 2)
    );
    pop();
  } else {
    push();
  fill(255, 255, 0);   // ⬅️ 统一用状态色
  ellipse(this.pos.x, this.pos.y, this.r * 2);
  pop();
  }
    
    this.hp.draw(this.pos.x, this.pos.y, this.r);

  }

  receiveDamage(rawDamage) {
    if (this.isInvincible) return;
  
    let damage = floor(rawDamage * this.damageMultiplier); // 支持减伤
    this.hp.takeDamage(damage);
    console.log(`玩家受到 ${damage} 点伤害`);
  
    if (!this.hp.isAlive()) {
      gameOver = true;
      console.log("玩家死亡！");
    }
  }
  




}






class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);  // 所有敌人都需要位置
    this.hp = new HPSystem(30);     // 血量系统（子类可覆盖）
    this.dead = false;              // 死亡标记
  
    this.exploding = false; // ✅ 是否在播放死亡特效
    this.explodeStartTime = 0; // ✅ 记录开始时间
    this.explodeDuration = 1000; // 毫秒

    this.explosion = null;

     // ✅ 每个敌人自己有攻击冷却时间
     this.nextHitTime = 0;
     this.hitCooldown = 500; // 500ms

     this.contactDamage = 10; // ✅ 默认接触伤害
  
  
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
      this.hp.draw(this.pos.x, this.pos.y, this.r);
    }
  }

  isExplosionFinished() {
    return this.exploding && this.explosion && this.explosion.isFinished();
}
}

class FollowEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 35;
    this.speed = 3; // 速度稍慢于玩家 

    this.contactDamage = 15; // 接触伤害
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

    fill(255, 0, 0); // 红色敌人
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    this.hp.draw(this.pos.x, this.pos.y, this.r);
  }
}




class AmbushEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 删除 r 和 mode 参数
    this.r = 40; // ✅ 设置自己的半径
    this.hp = new HPSystem(40); // ✅ 设置自己的血量（可选）
    this.contactDamage = 15; // 接触伤害

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

    super.update(); // ✅ 调用父类 update()，执行死亡检测
  }

  show() {
    if (this.exploding && this.explosion) {
      super.show(); // 这时父类会绘制爆炸
      return;
    }
    
    fill(0, 255, 250);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    this.hp.draw(this.pos.x, this.pos.y, this.r);
    
  }
}

class StealthEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 简化构造函数
    this.r = 35;
    this.hp = new HPSystem(25);
    this.contactDamage = 20; // 接触伤害

    this.visibility = 0;
    this.detectRange = 300;
    this.chaseRange = 200;
    this.hideRange = 350;
    this.isChasing = false;
    this.stealthspeed = 2;
    this.speed = 1.5;
    this.target = createVector(random(width * 2) - width, random(height * 2) - height); // ✅ 必须初始化
  }

  update() {
    this.applySeparation(enemies); // 加入防重叠行为

    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (distance < this.chaseRange) {
      this.isChasing = true;
      this.visibility = min(this.visibility + 20, 255);
    } else if (distance < this.detectRange) {
      this.isChasing = false;
      this.visibility = min(this.visibility + 10, 255);
    } else if (distance > this.hideRange) {
      this.isChasing = false;
      this.visibility = max(this.visibility - 15, 0);
    }

    let dir;
    if (this.isChasing) {
      const stopDistance = this.r + player.r;
      if (distance > stopDistance) {
        dir = p5.Vector.sub(player.pos, this.pos);
        dir.setMag(this.stealthspeed);
        this.pos.add(dir);
      }
    } else {
      if (frameCount % 60 === 0) {
        this.target = createVector(random(width * 2) - width, random(height * 2) - height);
      }
      dir = p5.Vector.sub(this.target, this.pos);
      dir.setMag(this.speed);
      this.pos.add(dir);
    }

    super.update(); // 死亡检测
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
      fill(150, 0, 255, this.visibility);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
    
      // 血条只在可见状态下绘制（并共享透明度）
      if (this.visibility > 0) {
        this.hp.draw(this.pos.x, this.pos.y, this.r);
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
    
    this.hp = new HPSystem(25);

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
      bullets.push(new Bullet(this.pos.copy(), dir));
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
    
    
      fill(255, 200, 0);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
      this.hp.draw(this.pos.x, this.pos.y, this.r);
    


  }
}

class CommonEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 20;             // 比精英怪小
    this.hp = new HPSystem(25); // 较低血量
    this.speed = 3;        // 稍快的移动速度
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

    fill(200, 200, 200); // 灰色，作为基础小怪
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    this.hp.draw(this.pos.x, this.pos.y, this.r);
  }
}

class Boss extends Enemy {
  constructor(x, y) {
    super(x, y); // 调用 Enemy 构造函数
    this.r = 50;
    this.hp = new HPSystem(1000); // Boss血量比普通敌人多
    this.stage = 1;
    this.contactDamage = 25; // ✅ Boss 攻击更痛

    this.actions = []; // ✅ 当前阶段动作池
    this.lastActionTime = 0;
    
    this.setStageActions(); // 初始化阶段行为
  }

  update() {
    super.update();
    if (!this.hp.isAlive()) return;

    this.checkStageTransition();

    for (let action of this.actions) {
      if (action.canTrigger()) {
        action.trigger();
        break; // 每帧只执行一个行为
    }
  }
  }

  checkStageTransition() {
    const hp = this.hp.currentHP;

    if (this.stage === 1 && hp <= 700) {
      this.stage = 2;
      this.setStageActions();
      console.log("⚠️ Boss 进入第二阶段！");
    } else if (this.stage === 2 && hp <= 300) {
      this.stage = 3;
      this.setStageActions();
      console.log("🚨 Boss 进入第三阶段！");
    }
  }

  setStageActions() {
    this.actions = [];

    if (this.stage === 1) {
      this.actions.push(new SummonAction(this));
      this.actions.push(new LaserAction(this));
    } else if (this.stage === 2) {
      this.actions.push(new BulletAction(this));
      this.actions.push(new LaserAction(this));
      this.actions.push(new ChargeAction(this));
    } else if (this.stage === 3) {
      this.actions.push(new BulletAction(this));
      this.actions.push(new ChargeAction(this));
    }
  }

  show() {
    if (this.exploding && this.explosion) {
      super.show(); // 播放爆炸动画
      return;
    }

    fill(255, 140, 0);
    ellipse(this.pos.x, this.pos.y, this.r * 2.5);
    this.hp.draw(this.pos.x, this.pos.y, this.r);
  }
}




class TimeBonus {
  constructor(x, y, bonusTime) {
    this.pos = createVector(x, y);
    this.r = 30;
    this.bonusTime = bonusTime; // 奖励的时间（秒）
  }

  show() {
    fill(0, 255, 255);
    stroke(255);
    strokeWeight(2);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    
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

    const keyMapping = ['Z', 'X', 'C'];

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
    const keyMapping = ['Z', 'X', 'C'];

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
    super("快速攻击", "", 10); // 名称、按键（暂时空）、冷却时间
    this.player = player; // 保存玩家对象
  }

  castSkillEffect() {
    console.log("快速攻击发动！攻击力提升3秒");
    this.player.attackPower = 30; // 技能发动时，攻击力变成30

    setTimeout(() => {
      this.player.attackPower = player.baseAttack; // 3秒后恢复原来的基础攻击
      console.log("攻击加成结束，恢复基础伤害");
    }, 3000);
    this.player.spriteMgr.request("boost", 3000, 1);
  }

  
}


class DashSkill extends Skill {
  constructor(player,enemies) {
    super("冲刺", "", 1); // 冲刺技能冷却2秒
    this.dashDamage = 5; // 冲刺时撞敌造成5伤害
    this.isDashing = false; // 冲刺中标记
    this.originalSpeed = 0; // 记录冲刺前的速度
    this.dashedEnemies = []; // 已经撞过的敌人列表
    this.dashEndTime = 0; // 冲刺结束时间

    this.dashTrail = [];             // ✅ 拖影数组
    this.maxDashTrailLength = 20;    // ✅ 最多记录多少

    this.player = player; 
    this.enemies = enemies; // 保存敌人列表

    this.totalDamage = 0; // 累积冲刺造成的伤害
  }

  castSkillEffect() {
    if (this.isDashing) return; // 正在冲刺时不能再次触发

    console.log(" 冲刺技能发动！");
    this.isDashing = true;
    this.dashedEnemies = []; // 冲刺开始时清空已撞敌人列表
    this.originalSpeed = this.player.speed;
    this.player.speed *= 3;
    this.player.isInvincible = true; // 开启无敌

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

  updateTrail() {
    this.dashTrail.push(this.player.pos.copy());
    if (this.dashTrail.length > this.maxDashTrailLength) {
      this.dashTrail.shift();
    }
  }

  showTrail() {
    for (let i = 0; i < this.dashTrail.length; i++) {
      let pos = this.dashTrail[i];
      let alpha = map(i, 0, this.dashTrail.length, 50, 200);
      let size = map(i, 0, this.dashTrail.length, player.r * 0.5, this.player.r);
      fill(0, 255, 0, alpha);
      noStroke();
      ellipse(pos.x, pos.y, size * 2);
    }
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
  

  /*endDash() {
    console.log("冲刺结束，恢复速度");
    this.isDashing = false;
    this.player.speed = this.originalSpeed;
    this.player.isInvincible = false;
  
    for (let skill of this.player.selectedSkills) {
      if (skill instanceof LifestealSkill) {
        skill.onDamageDealt(totalDamage, "dash"); // 或 "melee"、"charged"
      }
    }
    
  
    this.totalDamage = 0;
    this.dashTrail = [];
    this.dashedEnemies = [];
  }*/


    endDash() {
      console.log("冲刺结束，恢复速度");
      this.isDashing = false;
      this.player.speed = this.originalSpeed;
      this.player.isInvincible = false;
    
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
  constructor(player,selectedSkills) {
    super("冲刺重置", "", 0); // 0秒冷却，因为它是被动技能
    this.player = player; // 保存玩家对象
    this.selectedSkills = selectedSkills; // 保存已装备技能列表
  }

  castSkillEffect() {
    // ⚡ 这里什么都不用做，因为它是被动的，不靠手动触发
    console.log("⚡ 冲刺重置技能被动生效！");
  }

  // 新增一个方法，用来在敌人死亡时被调用
  onEnemyKilled() {
    console.log("敌人被消灭，尝试重置冲刺冷却！");

    // 遍历已装备技能，找到冲刺技能
    for (let skill of this.selectedSkills) {
      if (skill instanceof DashSkill) { // 找到冲刺技能
        skill.cooldownRemaining = 0;    // 重置冲刺技能冷却
        console.log("✅ 冲刺技能冷却已重置！");
      }
    }
  }
}

class ChargeStrikeSkill extends Skill {
  constructor(player, enemies) {
    super("蓄力攻击", "", 3); // 技能名称，按键X，冷却8秒
    this.player = player;
    this.enemies = enemies;

    this.isCharging = false;
    this.startTime = 0;
    this.chargeDuration = 2000; // 1秒蓄力
    this.attackPower = 30;      // 高额范围伤害
    this.range = 100;           // 攻击范围半径
  }

  castSkillEffect() {
    console.log("⚡ 蓄力攻击启动：玩家进入蓄力状态");

    this.isCharging = true;
    this.startTime = millis();

    // ✅ 设置玩家状态
    this.player.isCharging = true;         // 禁止移动（在 player.update 中处理）
    this.player.damageMultiplier = 0.5;    // 减伤50%
    this.player.spriteMgr.request("charge", 2000, 1);
  }

  update() {
    super.update();

    if (this.isCharging && millis() - this.startTime >= this.chargeDuration) {
      this.releaseExplosion();             // 造成范围伤害
      this.isCharging = false;

      // ✅ 恢复玩家状态
      this.player.isCharging = false;
      this.player.damageMultiplier = 1;
      console.log("✅ 蓄力攻击完成，状态恢复");
    }
  }

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
          baseDamage: this.attackPower,
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

    // 👉 可以在这里加入爆炸粒子特效等
  }
}



class LifestealSkill extends Skill {
  constructor(player) {
    super("吸血", "", 6); // 技能名称、按键、冷却秒数
    this.player = player;
    this.lifestealRatio = 0.3; // 吸血比例
    this.duration = 5000; // 持续时间（毫秒）
    this.active = false;
    this.endTime = 0;
  }

  castSkillEffect() {
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
    super("血怒", "", 0); // 被动技能，无需冷却
    this.player = player;
    this.isBoosting = false;
  }

  update() {
    let hpRatio = this.player.hp.currentHP / this.player.hp.maxHP;

    if (!this.isBoosting && hpRatio <= 0.2) {
      this.player.attackPower = 30;
      this.isBoosting = true;
      console.log("🩸 血怒发动！攻击力提升至30");
    }

    if (this.isBoosting && hpRatio > 0.2) {
      this.player.attackPower = this.player.baseAttack;
      this.isBoosting = false;
      console.log("🩸 血怒结束，攻击力恢复基础值");
    }
  }

  castSkillEffect() {
    // 被动技能无需手动触发
  }
}

class ReflectSkill extends Skill {
  constructor(player) {
    super("反弹", "", 5);     // 名称、按键占位、冷却 12 s
    this.player   = player;
    this.duration = 4 * 1000;  // 4 秒持续
    this.endTime  = 0;
  }

  /* ① 真正的效果写在这里，供父类 trigger() 调用 */
  castSkillEffect() {
    this.player.isReflecting = true;       // 开启反弹状态
    this.endTime = millis() + this.duration;
    console.log("⚡ 反弹开启（4 s）");
    this.player.spriteMgr.request("shield", 4000, 1);
  }

  /* ② 持续检查时间，自动关掉反弹 */
  update() {
    super.update();                         // 先递减冷却
    if ( this.player.isReflecting &&
         millis() > this.endTime ) {
      this.player.isReflecting = false;
      console.log("⚡ 反弹结束");
    }
  }
}







//弹幕
class Bullet {
  constructor(pos, direction) {
    this.pos = pos.copy();
    this.r = 12;
    this.speed = 6;
    this.direction = direction.copy().normalize();
    this.isReflected = false;
    this.alive = true;
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
      image(bulletReflectedImg, this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    } else if (!this.isReflected && bulletImg) {
      image(bulletImg, this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    } else {
      fill(this.isReflected ? [0, 255, 255] : [255, 0, 255]);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
    }
  }

  reflect() {
    this.isReflected = true;
    this.direction.mult(-1); // 原路返回
  }
}


class HPSystem {
  constructor(maxHP) {
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.isDead = false;
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

  draw(x, y, r, width = 50, height = 6) {
    noStroke();
  
    // 红色背景条
    fill(255, 0, 0);
    rect(x - width / 2, y - r - 15, width, height);  // 注意是居中对齐 + 悬浮在圆圈上方
  
    // 绿色血量条
    fill(0, 255, 0);
    let w = map(this.currentHP, 0, this.maxHP, 0, width);
    rect(x - width / 2, y - r - 15, w, height);  // 同样位置
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
        if (!this.player.isInvincible && now > enemy.nextHitTime) {
          this.player.receiveDamage(enemy.contactDamage); // ✅ 改为每个敌人自己的伤害
          enemy.nextHitTime = now + enemy.hitCooldown;
          console.log("敌人打到玩家！伤害:", enemy.contactDamage);
        }
      }
    }
  }
  
  

  handleBulletPlayerCollision() {
    for (let bullet of this.bullets) {
      if (bullet.isReflected) continue;
  
      if (this.checkCollision(this.player, bullet)) {
        if (this.player.isReflecting) {
          bullet.reflect(); // 开启反弹
          continue;         // 跳过后续伤害处理
        }
  
        if (!this.player.isInvincible) {
          this.player.receiveDamage(5); // 包含伤害判断和 gameOver 判定
          bullet.alive = false;
          console.log("玩家被子弹击中！");
        }
      }
    }
  }
  

  handleBulletEnemyCollision() {
    for (let bullet of this.bullets) {
      if (!bullet.isReflected) continue;
      for (let enemy of this.enemies) {
        if (!enemy.hp || !enemy.hp.isAlive()) continue;
        if (this.checkCollision(bullet, enemy)) {
          enemy.hp.takeDamage(15);
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
    this.damageDone = false;       // 当帧到达时只造成一次伤害
  }

  trigger() {
    if (this.inProgress) return;
    if (millis() - this.lastAttack < this.cooldown) return;

  // 重置并记录本次触发时间
  this.lastAttack    = millis();
    this.inProgress    = true;
    this.currentFrame  = 0;
    this.frameStartTime= millis();
    this.damageDone    = false;
    this.player.isAttacking = true;   // 切到攻击 GIF流派系统改动
  }

  update() {
    if (!this.inProgress) return;

    // 推进帧
    if (millis() - this.frameStartTime >= this.frameDuration) {
      this.currentFrame++;
      this.frameStartTime += this.frameDuration;
    }

      // 在第1帧造成一次伤害
      if (this.currentFrame === 0 && !this.damageDone) {
        this.dealDamage();
        this.damageDone = true;
      }
  

    // 在第 2 帧造成一次伤害
    if (this.currentFrame === 1 && !this.damageDone) {
      this.dealDamage();
      this.damageDone = true;
    }

  
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

    // 底层大弧：偏蓝青色（HSB）
    noStroke();
    fill(200, 80, 100, 80);
    arc(0, 0, R*2.2, R*2.2, dirAng - arcAng/2, dirAng + arcAng/2, PIE);

    // 中层弧：明黄色
    fill(50, 100, 100, 120);
    arc(0, 0, R*1.7, R*1.7, dirAng - arcAng/2, dirAng + arcAng/2, PIE);

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
  dealDamage() {
    const C      = this.player.pos;
    const dirAng = this.player.lastDirection === "left" ? PI : 0;
    const arcAng = radians(240);
    const R      = 60 * (1 + 1 * 0.25); // 在帧 1 时的实际半径

    let totalDamage = 0; // ✅ 初始化总伤害

    for (let e of this.enemies) {
      if (!e.hp || !e.hp.isAlive()) continue;

      // 距离判定
      const d = dist(C.x, C.y, e.pos.x, e.pos.y);
      if (d > R + e.r) continue;

      // 方向判定
      let ang = atan2(e.pos.y - C.y, e.pos.x - C.x);
      let diff = (ang - dirAng + PI*3) % (PI*2) - PI; 
      if (abs(diff) <= arcAng/2) {
        /*// 造成一次伤害（此处填入具体数值）
        
        e.hp.takeDamage(player.attackPower);
        console.log("Melee hit! 敌人扣血");*/

        // ✅ 使用统一伤害计算器
        const attackInfo = {
        source: "melee",                          // 普通攻击
        player: this.player,
        baseDamage: this.player.baseAttack,      // 注意是 baseAttack，不是 attackPower
        target: e
      };

      let damageDone = DamageCalculator.calculate(attackInfo);
      totalDamage += damageDone; // ✅ 累加到总伤害
      console.log(`Melee hit! 敌人扣血 ${damageDone}`);

      }
    }

    // ✅ 攻击结束，报告总伤害值
  if (totalDamage > 0) {
    console.log(`✅ 本次普攻总伤害: ${totalDamage}`);

    for (let skill of this.player.selectedSkills) {
      if (skill instanceof LifestealSkill) {
        skill.onDamageDealt(totalDamage, "melee"); // 或 "melee"、"charged"
      }
    }
    

  }
    
  
  }
}

class DamageCalculator {
  static calculate(attackInfo) {
    const { source, baseDamage, player, target } = attackInfo;
    if (!target || !target.hp || !target.hp.isAlive()) return 0;

    // 根据来源修正最终伤害（如技能加成等）
    let effectiveDamage = baseDamage;

    if (source === "melee") {
      effectiveDamage = player.attackPower; // 这里自动包含加成
    } else if (source === "charged") {
      effectiveDamage = baseDamage; // 示例：蓄力2倍
    }else if (source === "dash") {
      effectiveDamage = baseDamage; // 你可以以后给 dash 加成倍率
    }
    // 👉 未来你可以拓展更多类型：fireball、dash、critical 等

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

/* ───────────────────────────────────────────────
 *  减速领域 - 主动
 *    Z 键触发，持续 5s，半径 160，敌人速度 ×0.4
 * ─────────────────────────────────────────────── */
class SlowFieldSkill extends Skill {
  constructor(player, enemies,
              radius   = 160,
              slowMul  = 0.1,
              duration = 5000) {

    super("减速领域", "Z", 8);     // 名称 / 触发键 / 冷却秒数
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
    this.active  = true;
    this.endTime = millis() + this.duration;
    console.log("🌀 减速领域开启");
  }

  /* 每帧调用（来自 Player.updateSkills） */
  update() {
    super.update();                // 冷却倒计时

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
              damage   = 5,
              innerCD  = 10000) {

    super("减速领域-电击", "", 0);     /* 被动无需手动触发 */
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

    for (let enemy of this.slowField.slowed) {
      if (!enemy.hp || !enemy.hp.isAlive()) continue;

      const last = this.lastHit.get(enemy) ?? -Infinity;
      if (now - last >= this.innerCD) {
        enemy.hp.takeDamage(this.damage);
        this.lastHit.set(enemy, now);
        console.log("⚡ 电击领域额外伤害", this.damage);
      }
    }
  }

  castSkillEffect() {}   // 被动，没有触发体
}


class BlackHole {
  constructor ( x, y, type = "danger", safeRadius = 80, dangerRadius = 60) {
    this.pos = createVector(x, y);
    this.state = "idle";

    this.type = type;  // "danger" or "heal"

    this.safeRadius = safeRadius;   // 玩家进入此范围变状态
    this.dangerRadius = dangerRadius;  // 判定为“在黑洞里”的范围
    this.sparkList = [];
  }

  update( player ) {
    let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    // 切换状态判断
    if ( d < this.dangerRadius ) {
      if ( this.state !== "active") this.state = "active";
      this.applyEffects(player);
    } else {
      this.state = "idle";
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
    if (this.type == "danger") {


      player.hp.takeDamage(0.3); // 每帧小幅掉血
      // 用 player.isInvincible 判断冲刺状态
      if (!player.isInvincible && player.speed > 2) {
        player.speed = 2;
      }



    } else if (this.type === "heal") {
      player.hp.heal(0.2);
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

/* ---------- 跳商店 ---------- */
async function goToShop() {
  // 1. 计算下一关号（当前关卡已完成，所以 +1）
  const current = levelManager.currentLevel.levelNumber || 1;
  const nextLvl = current + 1;

  // 2. 写回 Supabase
  const { error } = await supabase
    .from('saves')
    .update({ current_level: nextLvl })
    .eq('id', saveId);

  if (error) {
    alert('同步存档失败：' + error.message);
    return;
  }

  // 3. 跳转到商店并把 saveId 携带过去
  window.location.href = `shop.html?saveId=${saveId}`;
}

// 文件末尾加上：
window.preload    = preload;
window.setup      = setup;
window.draw       = draw;
window.keyPressed = keyPressed;
window.keyReleased= keyReleased;