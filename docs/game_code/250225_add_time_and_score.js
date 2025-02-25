let player;
let foods = [];
let enemies = [];
let zoom = 1;
let gameOver = false;
let score = 0; // 记录得分
let timer = 60; // 设定倒计时时间（秒）
let startTime; // 记录游戏开始的时间

function setup() {
  createCanvas(windowWidth, windowHeight);
  player = new Player(random(width), random(height), 30);
  
  foods = [];
  enemies = [];
  startTime = millis(); // 记录游戏开始时间
  
  let enemyModes = ["chase", "chase", "patrol", "wander"];

  for (let i = 0; i < 50; i++) {
    foods.push(new Food(random(width * 2) - width, random(height * 2) - height));
  }

  for (let i = 0; i < 5; i++) {
    let mode = enemyModes[i % enemyModes.length]; // 采用原始敌人模式
    enemies.push(new Enemy(random(width * 2) - width, random(height * 2) - height, random(40, 80), mode));
     enemies.push(new AmbushEnemy(random(width * 2) - width, random(height * 2) - height, 45)); // 生成伏击型敌人
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

  // 应用平移，使视角跟随玩家
  translate(width / 2, height / 2);
  translate(-player.pos.x, -player.pos.y);

  // 绘制游戏对象
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
  for (let i = foods.length - 1; i >= 0; i--) {
    if (player.eats(foods[i])) {
      score += 10; // 每吃一个食物得 10 分
      foods.splice(i, 1);
      foods.push(new Food(random(width * 2) - width, random(height * 2) - height));
    }
  }

  // 处理敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (player.eats(enemies[i])) {
      player.r += enemies[i].r * 0.2;
      enemies.splice(i, 1);
    } else if (enemies[i].eats(player)) {
      gameOver = true;
      return;
    }
  }

  // *** 重要：绘制分数和倒计时，不受 translate 影响 ***
  push(); // 保存当前坐标系
  resetMatrix(); // 取消平移，恢复到 (0,0) 坐标系

  // 显示分数（左上角）
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  // 显示倒计时（右上角）
  textAlign(RIGHT, TOP);
  text("Time: " + nf(remainingTime, 2, 1) + "s", width - 20, 20);

  pop(); // 恢复坐标系，继续绘制游戏世界
}

// 游戏结束界面
function showGameOverScreen() {
  background(0);
  fill(255, 0, 0);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2 - 50);
  
  textSize(30);
  text("Final Score: " + score, width / 2, height / 2);
  text("Press 'R' to Restart", width / 2, height / 2 + 50);
}

// 重新开始游戏
function keyPressed() {
  if (key === 'R' || key === 'r') {
    restartGame();
  }
}

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
  }

  update() {
    let mouseVec = createVector(mouseX - width / 2, mouseY - height / 2);
    mouseVec.setMag(3.5); //更改自机速度，与敌人最大速度相同
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
    this.dushSpeed = 7; // 初始冲刺速度
    this.maxDashSpeed = 18; // 最大冲刺速度
    this.mode = mode || "chase"; // 默认为追击模式
    this.target = createVector(random(width * 2) - width, random(height * 2) - height); // 巡逻目标点
    this.isChasing = false; // 是否开始伏击
    this.isDashing = false; // 是否正在冲刺
    this.isResting = false; // 是否正在休息
    this.dashStartTime = 0; // 记录冲刺开始时间
    this.restStartTime = 0; // 记录休息开始时间
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

    } /*else if (this.mode === "ambush") {
      // **伏击模式**
      if (!this.isChasing && distance < 200) {
        this.isChasing = true;
        this.isDashing = true; // 立即进入冲刺状态
        this.dashStartTime = millis(); // 记录冲刺开始时间
        this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize(); // 设定冲刺方向
        this.dushSpeed = 3.5; // 重置冲刺速度
      }

      // 🏃‍♂️ 冲刺阶段（持续 5 秒，不断加速）
      if (this.isDashing) {
        let elapsedTime = millis() - this.dashStartTime; // 计算已冲刺时间
        let acceleration = map(elapsedTime, 0, 2000, 0, this.maxDashSpeed - this.dushSpeed); // 5 秒内加速
        let currentSpeed = this.dushSpeed + acceleration; // 计算当前速度
        let dashStep = p5.Vector.mult(this.dashDir, currentSpeed); // 计算移动步长
        
        console.log("Enemy Speed: ", this.speed);//
        
        this.pos.add(dashStep); // 让敌人移动

        if (elapsedTime > 2000) { // 如果冲刺满 2 秒
          this.isDashing = false; // 结束冲刺
          this.isResting = true; // 进入休息状态
          this.restStartTime = millis(); // 记录休息时间
        }
      }

      // ⏸ 休息阶段（停止 1 秒）
      if (this.isResting) {
        if (millis() - this.restStartTime > 500) { // 休息满 0.5 秒
          this.isResting = false; // 结束休息
          this.isDashing = true; // 重新开始冲刺
          this.dashStartTime = millis(); // 记录新一轮冲刺时间
          this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize(); // 重新计算冲刺方向
          this.dushSpeed = 3.5; // 重置冲刺速度
        }
      }
    }*/
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
    this.dashDir = createVector(0, 0);
  }

  update() {
    let distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

    if (!this.isChasing && distance < 200) {
      this.isChasing = true;
      this.isDashing = true;
      this.dashStartTime = millis();
      this.dashDir = p5.Vector.sub(player.pos, this.pos).normalize();
      this.dushSpeed = 3.5;
    }

    // 🏃‍♂️ 冲刺阶段（持续 2 秒，不断加速）
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
        this.dushSpeed = 3.5;
      }
    }
  }
}