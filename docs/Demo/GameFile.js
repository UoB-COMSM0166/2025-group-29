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
let bulletReflectedImg; // 反弹贴图

let bullets = []; // 所有子弹对象
let bulletPatternType = 3; // 1=水平双发，2=四向，3=六向

let collisionManager;
//玩家贴图
let playerIdleRightGif, playerIdleLeftGif;
let playerAttackRightGif, playerAttackLeftGif;

let levelManager;



function preload() {
  // 加载技能图标（统一管理）
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
  //玩家贴图
  playerIdleRightGif  = null;
  //loadImage("精灵-0001.gif");
  playerAttackRightGif= null;
  //loadImage("精灵-0002.gif");
}



function setup() {
  createCanvas(windowWidth, windowHeight);
  console.log("Canvas Width:", windowWidth, "Canvas Height:",  windowHeight); //打印调试信息
  

  //设置玩家
  setPlayer();
  //设置技能系统
  setSkillSystem();

  // 初始化关卡系统
  levelManager = new LevelManager();
  levelManager.addLevel(new Level1());
  // 这里可以继续 addLevel(new Level2()), ... 以后加



  
  // 设置敌人
  // setEnemies();



  // 吞食逻辑未完成
  // setTimeBonuses();

  levelManager.loadLevel(0);



}
  
function setSkillSystem() {
  skillSystem = new SkillSystem();
  
  skillSystem.addSkill(new DashSkill(player, enemies)); 
  skillSystem.addSkill(new AttackBoostSkill(player)); 
  skillSystem.addSkill(new DashResetSkill(player,skillSystem.selectedSkills)); 

  skillSystem.selectSkill(skillSystem.allSkills[0]);
  skillSystem.selectSkill(skillSystem.allSkills[1]);
  skillSystem.selectSkill(skillSystem.allSkills[2]);

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
    for (let i = 0; i < 3; i++) {
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

if (checkGameOver()) return;

// 只有在关卡没结束时更新倒计时
if (!levelManager.currentLevel.finished) {
  updateTimer();
}
// updateTimer();
updateCamera();
drawMapBorder();

// updateTimeBonuses();
// updateEnemies();
// updateBullets();

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

  saveProgress(slot) {
  const playerId = "player123";  // 假设你有玩家 ID，可从外部传入
  const levelNumber = this.levelNumber || 1;  // 当前关卡号
  const now = new Date();

  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const sql = `
  INSERT INTO saves (slot_number, player_id, level_number, save_date, save_time )
  VALUES (${slot},'${playerId}', ${levelNumber}, '${dateStr}', '${timeStr}' );
`;

  // 下载为 .sql 文件
  this.downloadSQLFile(sql.trim(), `save_slot_${slot}.sql`);
}

  downloadSQLFile(sqlContent, fileName) {
  const blob = new Blob([sqlContent], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}


  isCompleted() {
    // 默认 false，子类可以重写，判断通关条件
    return false;
  }
}


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
  handleKeyPressed() {
    if (this.stage === 0) {
      this.stage = 1;
      this.tip = "Use the arrow keys to move";
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







function updateTimer() {
  let elapsedTime = (millis() - startTime) / 1000;
  remainingTime = max(0, timer - elapsedTime);
  if (remainingTime <= 0) {
    gameOver = true;
    showGameOverScreen();
  }
}

function updateCamera() {
  push();
  resetMatrix();
  background(0);
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

    // 最后判断是否爆炸动画也结束了
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
  background(0); // 确保整个屏幕填充黑色

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

  // 阶段推进（Level1 专用）
  if (levelManager && levelManager.currentLevel instanceof Level1) {
    levelManager.currentLevel.handleKeyPressed();
  }

  if (key == '1'){
    gamelevel = 1;
  }
  
  if (key == '2'){
    gamelevel = 2;
  }
  
  if (key.toLowerCase() === 'a') {
    player.meleeAttack.trigger();

  // 告诉 Level1 玩家攻击了
  if (levelManager && levelManager.currentLevel instanceof Level1) {
      levelManager.currentLevel.handlePlayerAttack();
  }
  }

  // 在结算界面时响应按键
  if (levelManager.currentLevel instanceof Level1 && levelManager.currentLevel.finished) {
    let currentLevel = levelManager.currentLevel;
  
    if (currentLevel.postGameStage === 0) {
        currentLevel.postGameStage = 1;  // 任意键切到保存/继续界面
    }
    else if (currentLevel.postGameStage === 1) {
        if (key.toLowerCase() === 's') {
            currentLevel.postGameStage = 2;  // 进入存档界面
        }
        else if (key.toLowerCase() === 'c') {
            console.log("进入下一关...");
            // levelManager.loadLevel(1);  // 假设下一关是 Level2
        }
    }
    else if (currentLevel.postGameStage === 2) {
      if (keyCode === UP_ARROW) {
        currentLevel.selectedSlotIndex--;
        if (currentLevel.selectedSlotIndex < 0) {
            currentLevel.selectedSlotIndex = currentLevel.saveSlots.length - 1;
        }
    } 
    else if (keyCode === DOWN_ARROW) {
        currentLevel.selectedSlotIndex++;
        if (currentLevel.selectedSlotIndex >= currentLevel.saveSlots.length) {
            currentLevel.selectedSlotIndex = 0;
        }
    }
    else if (keyCode === ENTER) {
        let slot = currentLevel.saveSlots[currentLevel.selectedSlotIndex];
        console.log(`正在存档到槽 ${slot}...`);
        currentLevel.saveProgress(slot);
    }
    }
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
  score = 0;
  startTime = millis();
  

  dashActive = false;  // 停止冲刺状态
  dashCooldownEndTime = millis();  // 立即结束冷却
  dashEndTime = 0; // 确保冲刺不会在新游戏开始后生效
  setup();
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
    
    this.hp = new HPSystem(100); // 初始血量100
    
    this.lastHitTime = 0; // 
    this.hitCooldown = 500; // 500ms 冷却时间

    this.baseAttack = 15;  // 原本的基础攻击力
    this.attackPower = this.baseAttack; // 当前生效的攻击力（默认 = 基础）

    this.isInvincible = false; // 初始不无敌

    this.selectedSkills = []; // 玩家已装备的技能

    //普攻和静态判断
  this.lastDirection = "right";  // 记录朝向
  this.isAttacking   = false;    // 攻击动画中
  this.attackImage   = null;     // 当前播放的 gif

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
    
    
  this.updateSkills(); // 更新技能状态
    
    
  
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
  let gifToDraw = this.isAttacking
    ? playerAttackRightGif
    : playerIdleRightGif;

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
    // GIF 未加载时的备用圆
    push();
    fill(this.isAttacking ? [255,255,0] : [0,255,0]);
    ellipse(this.pos.x, this.pos.y, this.r*2);
    pop();
  }
    
    this.hp.draw(this.pos.x, this.pos.y, this.r);

  }
  


}






class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);  // 所有敌人都需要位置
    this.hp = new HPSystem(30);     // 血量系统（子类可覆盖）
    this.dead = false;              // 死亡标记
  
    this.exploding = false; // ✅ 是否在播放死亡特效
    this.explodeStartTime = 0; // ✅ 记录开始时间
    this.explodeDuration = 500; // 毫秒

    this.explosion = null;
  }

 

  
  updateDeath() {
    if (!this.hp.isAlive() && !this.dead) {
      this.dead = true;
      this.onDeath();
    }
  }

  onDeath() {
    console.log("敌人死亡");

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
  }

  update() {
    // 实时追踪玩家
    let dir = p5.Vector.sub(player.pos, this.pos);
    dir.setMag(this.speed);
    this.pos.add(dir);

    super.update(); // ✅ 继续执行父类的死亡检测逻辑
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

  onDeath() {
    score += 15;
    console.log("FollowEnemy 死亡 +15 分");
    super.onDeath();
}

}




class AmbushEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 删除 r 和 mode 参数
    this.r = 40; // ✅ 设置自己的半径
    this.hp = new HPSystem(40); // ✅ 设置自己的血量（可选）

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

  onDeath() {
    score += 30;
    console.log("AmbushEnemy 死亡 +30 分");
    super.onDeath();
}

}

class StealthEnemy extends Enemy {
  constructor(x, y) {
    super(x, y); // ✅ 简化构造函数
    this.r = 35;
    this.hp = new HPSystem(25);

    this.visibility = 0;
    this.detectRange = 200;
    this.chaseRange = 150;
    this.hideRange = 250;
    this.isChasing = false;
    this.stealthspeed = 2;
    this.speed = 1.5;
    this.target = createVector(random(width * 2) - width, random(height * 2) - height); // ✅ 必须初始化
  }

  update() {
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
      dir = p5.Vector.sub(player.pos, this.pos);
      dir.setMag(this.stealthspeed);
    } else {
      if (frameCount % 60 === 0) {
        this.target = createVector(random(width * 2) - width, random(height * 2) - height);
      }
      dir = p5.Vector.sub(this.target, this.pos);
      dir.setMag(this.speed);
    }

    this.pos.add(dir);
    super.update();// ✅ 死亡判定
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

    onDeath() {
      score += 50;
      console.log("StealthEnemy 死亡 +50 分");
      super.onDeath();
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

  onDeath() {
    score += 80;
    console.log("BulletEnemy 死亡 +80 分");
    super.onDeath();
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
    // 实时追踪玩家
    let dir = p5.Vector.sub(player.pos, this.pos);
    dir.setMag(this.speed);
    this.pos.add(dir);

    super.update(); // 触发死亡/爆炸
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

  onDeath() {
    score += 10;
    console.log("CommonEnemy 死亡 +10 分");
    super.onDeath();
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
  }

  
}


class DashSkill extends Skill {
  constructor(player,enemies) {
    super("冲刺", "", 10); // 冲刺技能冷却2秒
    this.dashDamage = 5; // 冲刺时撞敌造成5伤害
    this.isDashing = false; // 冲刺中标记
    this.originalSpeed = 0; // 记录冲刺前的速度
    this.dashedEnemies = []; // 已经撞过的敌人列表
    this.dashEndTime = 0; // 冲刺结束时间

    this.dashTrail = [];             // ✅ 拖影数组
    this.maxDashTrailLength = 20;    // ✅ 最多记录多少

    this.player = player; 
    this.enemies = enemies; // 保存敌人列表
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
      if (this.dashedEnemies.includes(enemy)) continue; // 已经撞过就跳过

      let d = dist(this.player.pos.x, this.player.pos.y, enemy.pos.x, enemy.pos.y);
      if (d < this.player.r + enemy.r) {
        enemy.hp.takeDamage(this.dashDamage);
        this.dashedEnemies.push(enemy);
        console.log("冲刺撞击敌人，造成" + this.dashDamage + "点伤害！");
      }
    }
  }

  endDash() {
    console.log("冲刺结束，恢复速度");
    this.isDashing = false;
    this.player.speed = this.originalSpeed;
    this.player.isInvincible = false; // 冲刺结束后关闭无敌

    
    this.dashTrail = []; // 清空拖影
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

    if (!this.isReflected) {
      // 玩家碰撞检测
      if (dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y) < this.r + player.r) {
        this.alive = false;
        console.log("玩家被击中！预留扣血逻辑");
      }
    } else {
      // 反弹状态下：伤害第一个敌人
      for (let e of enemies) {
        if (!(e instanceof BulletEnemy)) {
          let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
          if (d < this.r + e.r) {
            console.log("敌人被反弹击中！");
            e.r = 0; // 或者加血、死亡等逻辑
            this.alive = false;
            break;
          }
        }
      }
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
  constructor(player, enemies) {
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
        
        if (!this.player.isInvincible && (now - this.player.lastHitTime > this.player.hitCooldown)) {
          this.player.hp.takeDamage(10);
          this.player.lastHitTime = now;
          console.log("玩家撞到敌人！扣10血");
  
          if (!this.player.hp.isAlive()) {
            gameOver = true;
            console.log("玩家死亡！");
          }
        }
      }
    }
  }
  

  handleBulletPlayerCollision() {
    

    for (let bullet of this.bullets) {
      if (bullet.isReflected) continue;
      if (!this.player.isInvincible && this.checkCollision(this.player, bullet)) {
        this.player.hp.takeDamage(5);
        bullet.alive = false;
        console.log("玩家被子弹击中！扣5血");
        if (!this.player.hp.isAlive()) {
          gameOver = true;
          console.log("玩家死亡！");
        }
      }
    }
  }

  handleBulletEnemyCollision() {
    for (let bullet of this.bullets) {
      if (!bullet.isReflected) continue;
      for (let enemy of this.enemies) {
        if (!enemy.hp || !enemy.hp.isAlive()) continue;
        if (enemy instanceof BulletEnemy) continue;
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
    this.player.playAttackGif();   // 切到攻击 GIF
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
      this.player.resetImage();
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

    for (let e of this.enemies) {
      if (!e.hp || !e.hp.isAlive()) continue;

      // 距离判定
      const d = dist(C.x, C.y, e.pos.x, e.pos.y);
      if (d > R + e.r) continue;

      // 方向判定
      let ang = atan2(e.pos.y - C.y, e.pos.x - C.x);
      let diff = (ang - dirAng + PI*3) % (PI*2) - PI; 
      if (abs(diff) <= arcAng/2) {
        // 造成一次伤害（此处填入具体数值）
        //e.hp.takeDamage(15);
        e.hp.takeDamage(player.attackPower);
        console.log("Melee hit! 敌人扣血");
      }
    }
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








