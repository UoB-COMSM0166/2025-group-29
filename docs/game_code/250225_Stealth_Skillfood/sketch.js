let player;
let foods = [];
let enemies = [];
let zoom = 1;
let gameOver = false;
let score = 0; // 记录得分
let timer = 60; // 设定倒计时时间（秒）
let startTime; // 记录游戏开始的时间

let powerMode = false;
let powerModeEndTime = 0;
let slowEffect = false;
let slowEffectStartTime = 0;

let warningMessage = "";
let warningTimer = 0;



function setup() {
  createCanvas(windowWidth, windowHeight);
  player = new Player(random(width), random(height), 30);

  foods = [];
  enemies = [];
  startTime = millis();
  
  
  let enemyModes = ["chase", "patrol", "patrol", "wander"];

  for (let i = 0; i < 50; i++) {
    foods.push(new Food(random(width * 2) - width, random(height * 2) - height));
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

  background(0);  

  translate(width / 2, height / 2);
  translate(-player.pos.x, -player.pos.y);

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
  // 强化食物（power）：玩家无敌 10 秒（无敌期间不会被敌人吞噬）。
  for (let i = foods.length - 1; i >= 0; i--) {
    if (player.eats(foods[i])) {
      // let foodType = foods[i].type;
      if (foods[i].type === "normal") {
        score += 10;
      } else if (foods[i].type === "trap" ) {
        if (!powerMode) {
          score -= 20;
          player.speed *= 0.65;
          warningMessage = "You ate a trap! Speed reduced for 15s!";
           warningTimer = millis() + 3000;
          setTimeout(() => player.speed /= 0.65, 15000); // 15s 后恢复速度
        }
        // score -= 20;
        // slowEffect = true;
        // slowEffectStartTime = millis();
        // warningMessage = "You ate a trap! Speed reduced for 15s!";
        // warningTimer = millis() + 3000;
      } else if (foods[i].type === "power") {
        powerMode = true;
        powerModeEndTime = millis() + 10000;
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

//按R重新开始
function keyPressed() {
  if (key === 'R' || key === 'r') {
    restartGame();
  }
}

//重新开始
function restartGame() {
  gameOver = false;
  score = 0;
  startTime = millis();
  setup();
}

class Player {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = r;
    this.speed = 3.5;
  }

  update() {
    let mouseVec = createVector(mouseX - width / 2, mouseY - height / 2);
    mouseVec.setMag(this.speed ); //更改自机速度，与敌人最大速度相同
    this.pos.add(mouseVec);

  
  }

   

  show() {
    fill(0, 255, 0);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }

  eats(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < this.r + other.r && this.r > other.r) { //添加判断敌人和玩家谁大
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
    this.type = random(["normal", "trap", "power"]);
  }

  show() {
    if (this.type === "normal") fill(200, 200, 0);
    if (this.type === "trap") fill(255, 0, 0);
    if (this.type === "power") fill(0, 0, 255);

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