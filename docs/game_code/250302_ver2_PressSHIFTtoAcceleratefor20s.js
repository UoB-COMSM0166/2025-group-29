let player;
let foods = [];
let enemies = [];
let zoom = 1;
let gameOver = false;
let score = 0; // 记录得分
let timer = 60; // 设定倒计时时间（秒）
let startTime; // 记录游戏开始的时间

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

/*let width = 9000;
let height = 9000;*/

let keys = {};



function setup() {
  createCanvas(windowWidth, windowHeight);

  
  player = new Player(width / 2, height / 2, 30);



  foods = [];
  enemies = [];
  startTime = millis();
  
  
  let enemyModes = ["chase", "patrol", "patrol", "wander"];

  
  
  
  for (let i = 0; i < 50; i++) {
    let newFood = new Food(random(width * 2) - width, random(height * 2)- height);

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

 for (let i = 0; i < 3; i++) {
    let mode = enemyModes[i];
    
    enemies.push(new Enemy(random(width * 2) - width, random(height * 2) - height, random(40, 60),mode));
  }
    
  for (let i = 0; i < 5; i++){
    enemies.push(new AmbushEnemy(random(width * 2) - width, random(height * 2) - height, 45)); // 生成伏击型敌人
  }

  for (let i = 0; i < 3; i++) { 
    enemies.push(new StealthEnemy(random(width * 2) - width, random(height * 2) - height, 40)); 
  }
  
}


function draw() {
  if (gameOver) { 
    showGameOverScreen();
    return;
  } 

 

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

 /*// **绘制固定边框**
 push();
 resetMatrix();
 stroke(255, 0, 0);
 strokeWeight(5);
 noFill();
 rect(0, 0, width, height); // **确保边框不随玩家移动**
 pop();*/

 // **设置相机视角，让玩家始终处于中心**
 translate(width / 2 - player.pos.x, height / 2 - player.pos.y);
  
 
 for (let food of foods) {
    food.show();
  }

  for (let enemy of enemies) {
    enemy.show();
    enemy.update();
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
      foods.push(new Food(random(width * 2) - width, random(height * 2) - height));
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
  push(); // 保存当前坐标系s
  resetMatrix(); // 取消平移，恢复到 (0,0) 坐标系

  // 显示分数（左上角）
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  // 显示倒计时（右上角）
  textAlign(RIGHT, TOP);
  text("Time: " + nf(remainingTime, 2, 1) + "s", width - 20, 20);

  textAlign(LEFT, BOTTOM);
  cooldownRemaining = max( 0, ( dashCooldownEndTime - millis()) / 1000);
  text("Dash Cooldown: " + cooldownRemaining.toFixed(1) + "s", 20, height - 20);
  
  if (powerMode) {
    let powerTimeLeft = max(0, (powerModeEndTime - millis()) / 1000);
    if (powerTimeLeft <= 0) {
      powerMode = false;
    } else {
      fill(0, 255, 255);
      textSize(20);
      textAlign(CENTER, TOP);
      text("Invincible: " + nf(powerTimeLeft, 2, 1) + "s", width / 2, 20);
    }
  }
  

  // **在此处插入警告消息渲染**
  if (millis() < warningTimer) {
  fill(255, 0, 0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(warningMessage, width / 2, height / 2 - 100);
}



  pop(); // 恢复坐标系，继续绘制游戏世界
}

//游戏结束屏幕
function showGameOverScreen() {
  background(0);
  fill(255, 0, 0);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2 - 50);
  textSize(30);
  text("Final Score: " + score, width / 2, height / 2);
  text("Press 'R' to Restart", width / 2, height / 2 + 40);
}

function keyPressed() {
  keys[key] = true; // 记录按下的按键

  if ( key == 'Shift' && millis() > dashCooldownEndTime ) {
    activeDash();
  }

  if (key === 'R' || key === 'r') { // 按 R 重新开始
    restartGame();
  }

  
}

function keyReleased() {
  keys[key] = false; // 记录松开的按键
}

function activeDash(){
  dashActive = true;
  player.speed *= 2; // 速度翻倍
  dashEndTime = millis() + 1000; // 1s后恢复
  dashCooldownEndTime = millis() + 20000; // 20s冷却时间
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
    this.pos.x = constrain(this.pos.x, -width, width);
    this.pos.y = constrain(this.pos.y, -height, height);

    // 冲刺状态检测
    if ( dashActive && millis() > dashEndTime ) {
      dashActive = false;
      this.speed /= 2;
    }
  }

  show() {
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
