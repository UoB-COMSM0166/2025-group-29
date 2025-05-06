let player;
let foods = [];
let enemies = [];
let zoom = 1;
let gameOver = false;
let score = 0; // 记录得分
let timer = 60; // 设定倒计时时间（秒）
let startTime; // 记录游戏开始的时间

let angle = 0;

let powerFoodCount = 0;
let trapFoodCount = 0;
let maxPowerFood = 5;
let maxTrapFood = 7;

let speedBoostCount = 0;
let maxSpeedBoostFood = 2;

let dashActive = false; // 记录是否正在冲刺
let dashEndTime = 0; // 记录冲刺结束时间
let dashCooldownEndTime = 0; // 记录冷却结束时间
let cooldownRemaining = 0;

let powerMode = false;
let powerModeEndTime = 0;
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



//在setup函数之前做预加载
/*function preload() {
  skillSystem = new SkillSystem();

  skillSystem.addSkill(new Skill("闪现", "", null, 10));
  skillSystem.addSkill(new Skill("火球", "", null, 18));
  skillSystem.addSkill(new Skill("护盾", "", null, 12));
  skillSystem.addSkill(new Skill("治疗", "", null, 10));
  skillSystem.addSkill(new Skill("冰冻", "", null, 8));
  skillSystem.addSkill(new Skill("反弹", "", null, 12));

  loadSkillIcons(); // ✅ 加载图标
}*/

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
}

/*function loadSkillIcons() {
  for (let skill of skillSystem.allSkills) {
    if (skill.iconPath && typeof skill.iconPath === 'string' && skill.iconPath.trim() !== "") {
      skill.icon = loadImage(skill.iconPath);
    }
  }
}*/


function setup() {
  createCanvas(windowWidth, windowHeight);

  skillSystem = new SkillSystem();
  // 添加技能（不传图标路径）
  skillSystem.addSkill(new Skill("闪现", "", 10));
  skillSystem.addSkill(new Skill("火球", "", 18));
  skillSystem.addSkill(new Skill("护盾", "", 12));
  skillSystem.addSkill(new Skill("治疗", "", 10));
  skillSystem.addSkill(new Skill("冰冻", "",  8));
  skillSystem.addSkill(new Skill("反弹", "",12));


  // 选择技能（示例选择 3 个）
  skillSystem.selectSkill(skillSystem.allSkills[0]);
  skillSystem.selectSkill(skillSystem.allSkills[1]);
  skillSystem.selectSkill(skillSystem.allSkills[2]);

  

  console.log("Canvas Width:", windowWidth, "Canvas Height:",  windowHeight);
  

  
  player = new Player(0 ,0 , 30);

  //这里是测试模拟前端对于技能的选择
/*skillSystem.selectSkill(skillSystem.allSkills[1]); // 选择第一个技能（比如"闪现"）
skillSystem.selectSkill(skillSystem.allSkills[2]); // 选择第三个技能（比如"护盾"）
skillSystem.selectSkill(skillSystem.allSkills[4]); // 选择第五个技能（比如"冰冻"）*/


  foods = [];
  enemies = [];
  startTime = millis();


   // 创建三个时间柱，放置在随机位置
  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 15));
  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 30));
  timeBonuses.push(new TimeBonus(random(-width, width), random(-height, height), 45));
  
  let enemyModes = ["chase", "patrol", "patrol", "wander"];

 
  
  
  for (let i = 0; i < 100; i++) {
    let newFood = new Food(random(-width, width), random(-height, height));


    // 处理 `power food`
    if (newFood.type === "power_invincible" || newFood.type === "power_speedBoost") {
      if (powerFoodCount < maxPowerFood) {
        powerFoodCount++;

        // **如果是 `power_speedBoost`，再检查是否超出上限**
        if (newFood.type === "power_speedBoost") {
          if (speedBoostCount < maxSpeedBoostFood) {
            speedBoostCount++;
          } else {
            newFood.type = "power_invincible"; // 替换成 `power_invincible`
          }
        }

      } else {
        newFood.type = "normal"; // **如果 `powerFoodCount` 超过 `maxPowerFood`，转换为普通食物**
      }
    } 
  else if ( newFood.type == "trap") {
      if ( trapFoodCount < maxTrapFood) {
        trapFoodCount++;
      } else {
        newFood.type = "normal";
      }
    }

    foods.push(newFood);
    
    
  }

  let minSpawnDistance = player.r * 10; // **敌人生成的最小距离（确保不在玩家附近生成）**
  
  
 
  
  
  for (let i = 0; i < 5*n; i++) {
    let mode = random(enemyModes);
    let enemyPos = generateValidEnemyPosition(minSpawnDistance);
    enemies.push(new Enemy(enemyPos.x, enemyPos.y, random(40, 60), mode));
  }
    

  // **伏击型敌人
  
  for (let i = 0; i < 4*n; i++) {
    let ambushPos = generateValidEnemyPosition(minSpawnDistance);
    enemies.push(new AmbushEnemy(ambushPos.x, ambushPos.y, 45));
  }

  // **隐形敌人
  
  for (let i = 0; i < 3*n; i++) {
    let stealthPos = generateValidEnemyPosition(minSpawnDistance);
    enemies.push(new StealthEnemy(stealthPos.x, stealthPos.y, 40));
  }
  //加载弹幕怪的地方
  for (let i = 0; i < 3; i++) {
  let pos = generateValidEnemyPosition(200);
  enemies.push(new BulletEnemy(pos.x, pos.y, 35));
}
  
}
  



function draw() {
  if (gameOver) { 
    showGameOverScreen();
    return;
    
  } 
skillSystem.update();//技能图标的更新


 

  // 计算剩余时间
  let elapsedTime = (millis() - startTime) / 1000; 
  let remainingTime = max(0, timer - elapsedTime);

  if (remainingTime <= 0) {
  gameOver = true;
  showGameOverScreen();
  return;
}
 

  

 // **确保背景填满整个屏幕**
 push();
 resetMatrix();
 background(0);
 pop();


 
// 计算视角位置
let camX = constrain(
  player.pos.x, 
  -width + windowWidth / 2, 
  width - windowWidth / 2
);
let camY = constrain(
  player.pos.y,  
  -height + windowHeight / 2, 
  height - windowHeight / 2
);

// 让相机始终跟随玩家（视角跟随）
translate(windowWidth / 2 - camX, windowHeight / 2 - camY);

  push();
  stroke(255, 0, 0);  // 红色边框
  strokeWeight(5);     // 边框粗细
  noFill();            // 透明填充
  rectMode(CENTER);    // 以中心为基准绘制
  rect(0, 0, width*2, height*2); // 地图边界
  pop();

  
    // 显示时间柱
    for (let i = timeBonuses.length - 1; i >= 0; i--) {
      timeBonuses[i].show();
      if (player.eats(timeBonuses[i])) {
        timer += timeBonuses[i].bonusTime;
        warningMessage = "Gained " + timeBonuses[i].bonusTime + "s!";
        warningTimer = millis() + 3000;
        timeBonuses.splice(i, 1); // 移除已吃掉的时间柱
      }
    }
  
 
 for (let food of foods) {
    food.show();
    food.update();
  }

  for (let enemy of enemies) {
    enemy.show();
    enemy.update();
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
  bullets[i].update();
  bullets[i].show();
  if (!bullets[i].alive) {
    bullets.splice(i, 1);
  }
}


  player.update();
  player.show();

  // 吞食食物
  // 普通食物（normal）：+10 分，无特殊效果。
  // 陷阱食物（trap）：-20 分，并减缓玩家移动速度 15 秒，同时给出文字提醒。
  // 强化食物（power）：+20 分，玩家无敌 10 秒（无敌期间不会被敌人吞噬）。
  for (let i = foods.length - 1; i >= 0; i--) {
    if (player.eats(foods[i])) {
      // let foodType = foods[i].type;
      if (foods[i].type === "normal") {
        score += 10;
      } else if (foods[i].type === "trap" ) {
        if (!powerMode) {
          score -= 20;
          player.speed *= 0.75;
          warningMessage = "You ate a trap! Speed reduced for 15s!";
           warningTimer = millis() + 3000;
          setTimeout(() => player.speed /= 0.75, 15000); // 15s 后恢复速度
        }
        // score -= 20;
        // slowEffect = true;
        // slowEffectStartTime = millis();
        // warningMessage = "You ate a trap! Speed reduced for 15s!";
        // warningTimer = millis() + 3000;
      } else if (foods[i].type === "power_invincible") {
        score += 20;
        powerMode = true;
        powerModeEndTime = millis() + 10000;
      }
      else if (foods[i].type === "power_speedBoost") {
        score += 15;
        player.speed *= 1.35;
        warningMessage = "Speed Boost for 10s! Run for your life!";
        warningTimer = millis() + 3000;
        setTimeout( () => player.speed /= 1.35, 10000);
      }
      
      
      foods.splice(i, 1);
      foods.push(new Food(random(-width,width), random(-height,height)));
    }
  }

  
  
  
  //处理敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].eats(player) && !powerMode) {
      gameOver = true;
      return;
    }
  }
  

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
  
  skillSystem.draw();  // ✅ 画技能图标
  
  // 技能冷却时间显示在左下角
  
  fill(255);
  textSize(20);
  textAlign(LEFT, BOTTOM);
  cooldownRemaining = max(0, (dashCooldownEndTime - millis()) / 1000);
  text("Dash Cooldown: " + cooldownRemaining.toFixed(1) + "s", 10, windowHeight - 10);
 

  //玩家坐标
  
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Player X: ${floor(player.pos.x)}`, 20, 50);
  text(`Player Y: ${floor(player.pos.y)}`, 20, 80);
  
  
  if (powerMode) {
    let powerTimeLeft = max(0, (powerModeEndTime - millis()) / 1000);
    if (powerTimeLeft <= 0) {
      powerMode = false;
    } else {
      //push();
      //resetMatrix(); // 重置坐标系，防止 translate() 影响
      fill(0, 255, 255); // 青色文本
      textSize(20);
      textAlign(CENTER, TOP); // 文字居中，顶部对齐
      text("Invincible: " + nf(powerTimeLeft, 2, 1) + "s", windowWidth / 2, 20);
      //pop();

    }
  }
  

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

  if ( key == 'Shift' && millis() > dashCooldownEndTime ) {
    activeDash();
  }

  if (key == '1'){
    gamelevel = 1;
  }
  
  if (key == '2'){
    gamelevel = 2;
  }
  skillSystem.tryActivateSkill(key); // 让技能系统处理按键
  
  
}

function keyReleased() {
  keys[key] = false; // 记录松开的按键
}


function activeDash() {
  if (millis() < dashCooldownEndTime || dashActive) return; // 防止冷却时间内重复激活

  dashActive = true;
  let originalSpeed = player.speed; // 记录原始速度
  player.speed *= 3; // 速度翻倍
  dashEndTime = millis() + 500; // 1秒冲刺时间
  dashCooldownEndTime = millis() + 2000; // 20秒冷却时间

  setTimeout(() => {
    player.speed = originalSpeed; // 恢复原始速度
    dashActive = false; // 结束冲刺
    dashTrail = [];
  }, 500);
}

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

class Player {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = r;
    this.speed = 4;
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
    }
    if (keys['ArrowRight']) { 
      move.x += 1; 
    }

    // **标准化方向，防止对角线加速**
    if (move.mag() > 0) {
      move.setMag(this.speed);
      this.pos.add(move);
    }

    // **限制玩家不超出地图范围**
    this.pos.x = constrain(this.pos.x, -width + this.r, width -this.r);
    this.pos.y = constrain(this.pos.y, -height + this.r, height - this.r);
    
    if (dashActive) {
      dashTrail.push(this.pos.copy());
      if (dashTrail.length > maxDashTrailLength) {
        dashTrail.shift(); // 保持最大长度
      }
    }
  
  }

  showTrail() {//拖影效果
    for (let i = 0; i < dashTrail.length; i++) {
      let pos = dashTrail[i];
      let alpha = map(i, 0, dashTrail.length, 50, 200); // 渐变透明度
      let size = map(i, 0, dashTrail.length, this.r * 0.5, this.r); // 渐变大小
      fill(0, 255, 0, alpha); // 绿色渐变
      noStroke();
      ellipse(pos.x, pos.y, size * 2);
    }
  }
  
  show() {
    this.showTrail();//拖影
    fill(0, 255, 0);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
  

  eats(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < this.r + other.r && this.r > other.r) {
      this.r += other.r * 0.05;
      return true;
    }
    return false;
  }
}



  


class Food {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.r = random(5, 15);
    this.type = random(["normal", "trap", "power_invincible","power_speedBoost"]);
    this.basePos = this.pos.copy(); // 记录原始位置
    this.offset = random(0, TWO_PI); // 给不同食物一个不同的初始相位
    this.angle = 0; // 旋转角度（用于 power 食物）
  }

  update() {
    // 让食物在原始位置的基础上做小范围的左右摆动


    FoodMovePattern(this); // 让食物按照类型运动

    let range = 30; // 运动范围
    this.pos.x = this.basePos.x + sin(frameCount * 0.05 + this.offset) * range;
    this.pos.y = this.basePos.y + cos(frameCount * 0.05 + this.offset) * range;
  }

  show() {
    if (this.type === "normal") fill(200, 200, 0);
    if (this.type === "trap") fill(255, 0, 0);
    if (this.type === "power_invincible") fill(0, 0, 255);
    if (this.type === "power_speedBoost") fill(255, 105, 180);

    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
}

class Enemy {
  constructor(x, y, r, mode) {
    this.pos = createVector(x, y);
    this.r = r;
    
    this.speed = random(1, 3); // 普通移动速度
    
    this.mode = mode || "chase"; // 默认为追击模式
    this.target = createVector(random(width * 2) - width, random(height * 2) - height); // 巡逻目标点
    this.dashDir = createVector(0, 0); // 冲刺方向
  }

  update() {
    let dir = createVector(0, 0);
    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (this.mode === "chase") {
      // **追击模式**
      if (this.r > player.r) {
        dir = p5.Vector.sub(player.pos, this.pos);
        dir.setMag(this.speed);
        this.pos.add(dir);
      } else {
        dir = p5.Vector.sub(this.pos, player.pos);
        dir.setMag(this.speed);
        this.pos.add(dir);
      }

    } else if (this.mode === "patrol") {
      // **巡逻模式**（在固定区域来回移动）
      dir = p5.Vector.sub(this.target, this.pos);
      if (dir.mag() < 5) { // 到达目标点后，换一个新目标
        this.target = createVector(random(width * 2) - width, random(height * 2) - height);
      }
      dir.setMag(this.speed);
      this.pos.add(dir);

    } else if (this.mode === "wander") {
      // **随机游走模式**（每隔一段时间换方向）
      if (frameCount % 60 === 0) { // 每 60 帧换方向
        this.target = createVector(random(width * 2) - width, random(height * 2) - height);
      }
      dir = p5.Vector.sub(this.target, this.pos);
      dir.setMag(this.speed);
      this.pos.add(dir);

    } 
  }


  show() {
    fill(255, 50, 50);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }

  eats(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    return d < this.r + other.r;
  }
}



class AmbushEnemy extends Enemy {
  constructor(x, y, r) {
    super(x, y, r, "ambush"); // 继承父类构造函数
    this.isChasing = false;
    this.isDashing = false;
    this.isResting = false;
    this.dashStartTime = 0;
    this.restStartTime = 0;
    this.dushSpeed = 4; // 初始冲刺速度
    this.maxDashSpeed = 20; // 最大冲刺速度
    this.dashDir = createVector(0, 0);
  }

  update() {
    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (!this.isChasing && distance < 200) {
      this.isChasing = true;
      this.isDashing = true;
      this.dashStartTime = millis();
      this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
      this.dushSpeed;
    }

    // 冲刺阶段（持续 2 秒，不断加速）
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

    // ⏸ 休息阶段（停止 0.5 秒）
    if (this.isResting) {
      if (millis() - this.restStartTime > 500) {
        this.isResting = false;
        this.isDashing = true;
        this.dashStartTime = millis();
        this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
        this.dushSpeed;
      }
    }
  }

  show() {
    fill(0, 255, 250);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
}

class StealthEnemy extends Enemy {
  constructor(x, y, r) {
    super(x, y, r, "stealth"); // 继承普通敌人行为
    this.visibility = 0; // 初始透明度（0=完全隐身，255=完全显形）
    this.detectRange = 200; // 玩家检测范围（显形）
    this.chaseRange = 150; // 追击范围（主动追玩家）
    this.hideRange = 250; // 超过此距离重新隐身
    this.isChasing = false; // 追击状态
    this.stealthspeed = 2;
  }

  update() {
    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (distance < this.chaseRange) {
      // **近距离追击**
      this.isChasing = true;
      this.visibility = min(this.visibility + 20, 255); // 快速显形
    } else if (distance < this.detectRange) {
      // **进入可见范围，但还没进入追击范围**
      this.isChasing = false;
      this.visibility = min(this.visibility + 10, 255); // 逐渐显形
    } else if (distance > this.hideRange) {
      // **超出隐藏范围，回到隐身状态**
      this.isChasing = false;
      this.visibility = max(this.visibility - 15, 0); // 逐渐隐身
    }

    let dir;
    if (this.isChasing) {
      // **追击玩家**
      dir = p5.Vector.sub(player.pos, this.pos);
      dir.setMag(this.stealthspeed); // 追击时稍微加速
    } else {
      // **随机游走**
      if (frameCount % 60 === 0) { // 每 60 帧换方向
        this.target = createVector(random(width * 2) - width, random(height * 2) - height);
      }
      dir = p5.Vector.sub(this.target, this.pos);
      dir.setMag(this.speed);
    }

    this.pos.add(dir);
  }

  show() {
    push();
    fill(150, 0, 255, this.visibility); // 紫色，透明度根据可见度变化
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    pop();
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

/*class Skill {
  constructor(name, key, iconPath, cooldownTotal) {
    this.name = name;
    this.key = key;
    this.iconPath = iconPath;
    this.icon = null;
    this.cooldownTotal = cooldownTotal;
    this.cooldownRemaining = 0;
  }*/


    class Skill {
  constructor(name, key, cooldownTotal) {
    this.name = name;
    this.key = key;
    this.cooldownTotal = cooldownTotal;
    this.cooldownRemaining = 0;
  }

  /*preload() {
    this.icon = loadImage(this.iconPath);
  }*/

  trigger() {
    if (this.cooldownRemaining <= 0) {
      this.cooldownRemaining = this.cooldownTotal;
      console.log(this.name + " 技能触发！");
      // 这里以后可以加技能效果，比如调用 castSkill(this.name)
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

/*class SkillSystem {
  constructor() {
    this.allSkills = [];//所有技能，暂定为6个
    this.selectedSkills = [];//玩家选择的技能
  }

  addSkill(skill) {
    this.allSkills.push(skill);
  }



  update() {//每次只更新玩家选择的技能
    for (let skill of this.selectedSkills) {
      skill.update();
    }
  }

  draw() {
    let size = 64;
    let spacing = 10;
    let totalWidth = this.selectedSkills.length * (size + spacing) - spacing;
    let startX = windowWidth - totalWidth - 20;
    let y = windowHeight - size - 20;

    const keyMapping = ['F', 'G', 'H']; // ✅ 注意加在这里！！！
    
    for (let i = 0; i < this.selectedSkills.length; i++) {
      let skill = this.selectedSkills[i];
      let x = startX + i * (size + spacing);
      skill.draw(x, y, size);
      
      //加按键字母
       fill(255); // 白色字体
    textAlign(CENTER, BOTTOM);
    textSize(16);
    text(keyMapping[i], x + size / 2, y - 5); // 显示在图标上方（图标上方5像素
    }
  }

 tryActivateSkill(keyPressed) {
    const keyMapping = ['F', 'G', 'H']; // 按键固定 F -> 第一个技能，G -> 第二个技能，H -> 第三个技能

    for (let i = 0; i < this.selectedSkills.length; i++) {
      if (keyPressed.toUpperCase() === keyMapping[i]) {
        let skill = this.selectedSkills[i];
        if (skill.cooldownRemaining <= 0) {
          skill.trigger();
        }
      }
    }
  }

  // 这个方法用于在玩家选择完技能时调用
  selectSkill(skill) {
    this.selectedSkills.push(skill);
  }
}*/

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

  update() {
    for (let skill of this.selectedSkills) {
      if (skill) {
        skill.update();
      }
    }
  }

  draw() {
    let size = 64;
    let spacing = 10;
    let totalWidth = this.selectedSkills.length * (size + spacing) - spacing;
    let startX = windowWidth - totalWidth - 20;
    let y = windowHeight - size - 20;

    const keyMapping = ['F', 'G', 'H'];

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
    const keyMapping = ['F', 'G', 'H'];

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


//弹幕怪
class BulletEnemy extends Enemy {
  constructor(x, y, r) {
    super(x, y, r, "bullet_enemy");
    this.fireCooldown = 2000; // 每次发射的间隔（ms）
    this.lastFireTime = millis();
  }

  update() {
    // bulletEnemy 不需要追玩家，它站桩发射
    if (millis() - this.lastFireTime >= this.fireCooldown) {
      this.fire();
      this.lastFireTime = millis();
    }
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
    if (bulletEnemyImg) {
      imageMode(CENTER);
      image(bulletEnemyImg, this.pos.x, this.pos.y, this.r * 3.5, this.r * 3.5);
    } else {
      fill(255, 200, 0);
      ellipse(this.pos.x, this.pos.y, this.r * 2);
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






