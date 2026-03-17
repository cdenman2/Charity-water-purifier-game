const dropsContainer = document.getElementById("dropsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const dirtyTankDisplay = document.getElementById("dirtyTankDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const reservoirFill = document.getElementById("reservoirFill");
const reservoirFillText = document.getElementById("reservoirFillText");
const leftDrinkFill = document.getElementById("leftDrinkFill");
const rightDrinkFill = document.getElementById("rightDrinkFill");
const messageBox = document.getElementById("messageBox");
const celebrationBanner = document.getElementById("celebrationBanner");
const confettiContainer = document.getElementById("confettiContainer");
const gameOverPanel = document.getElementById("gameOverPanel");
const finalLives = document.getElementById("finalLives");
const finalDirty = document.getElementById("finalDirty");
const finalScore = document.getElementById("finalScore");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const desktopStartBtn = document.getElementById("desktopStartBtn");
const desktopPauseBtn = document.getElementById("desktopPauseBtn");
const desktopResetBtn = document.getElementById("desktopResetBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const gameArea = document.getElementById("gameArea");

const MAX_DIRTY_IN_TANK = 4;
const STARTING_LIVES = 4;
const DIRTY_CLICK_POINTS = 100;
const DIRTY_HIT_PENALTY = 200;
const TANK_FULL_BONUS = 1000;

let score = 0;
let level = 1;
let lives = STARTING_LIVES;
let dirtyInTank = 0;
let reservoirCurrent = 0;
let drinkTankProgress = 0;

let running = false;
let gameOver = false;
let levelTransition = false;

let dropIdCounter = 0;
let animationFrameId = null;
let spawnIntervalId = null;
let messageTimeoutId = null;

let drops = [];

function getLevelGoal() {
  return 12 + (level - 1) * 4;
}

function getSpawnRate() {
  return Math.max(520, 1500 - (level - 1) * 110);
}

function getDropSpeed() {
  return 0.75 + (level - 1) * 0.16;
}

function getPollutedChance() {
  return Math.min(0.62, 0.22 + (level - 1) * 0.05);
}

function getLaneWidthPercent() {
  if (window.innerWidth <= 560) return 0.66;
  if (window.innerWidth <= 800) return 0.58;
  if (window.innerWidth <= 1100) return 0.62;
  return 0.54;
}

function getReservoirHeight() {
  return window.innerWidth <= 560 ? 110 : 120;
}

function getLaneLeft() {
  const laneWidth = gameArea.clientWidth * getLaneWidthPercent();
  return (gameArea.clientWidth - laneWidth) / 2;
}

function getLaneWidth() {
  return gameArea.clientWidth * getLaneWidthPercent();
}

function getDropStartY() {
  return window.innerWidth <= 560 ? 165 : 170;
}

function updateDisplays() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  dirtyTankDisplay.textContent = `${dirtyInTank} / ${MAX_DIRTY_IN_TANK}`;
  reservoirFillText.textContent = `Reservoir Fill: ${reservoirCurrent} / ${getLevelGoal()}`;

  const fillPercent = Math.min((reservoirCurrent / getLevelGoal()) * 100, 100);
  reservoirFill.style.height = `${fillPercent}%`;

  const drinkPercent = Math.min((drinkTankProgress / 8) * 100, 100);
  leftDrinkFill.style.height = `${drinkPercent}%`;
  rightDrinkFill.style.height = `${drinkPercent}%`;

  renderLives();
}

function renderLives() {
  livesDisplay.innerHTML = "";

  for (let i = 0; i < STARTING_LIVES; i++) {
    const glass = document.createElement("div");
    glass.className = i < lives ? "glass" : "glass empty";
    livesDisplay.appendChild(glass);
  }
}

function showMessage(text, type = "") {
  messageBox.textContent = text;
  messageBox.className = "message-box";

  if (type === "success") {
    messageBox.classList.add("success");
  } else if (type === "warning") {
    messageBox.classList.add("warning");
  }

  clearTimeout(messageTimeoutId);
  messageTimeoutId = setTimeout(() => {
    messageBox.textContent = "Protect the reservoir and keep polluted water out.";
    messageBox.className = "message-box";
  }, 2000);
}

function startGame() {
  if (gameOver || levelTransition || running) return;
  running = true;
  showMessage("Game started. Catch the polluted drops before they enter the reservoir.");
  beginSpawning();
  animateDrops();
}

function pauseGame() {
  if (gameOver) return;
  running = false;
  clearInterval(spawnIntervalId);
  cancelAnimationFrame(animationFrameId);
  showMessage("Game paused.");
}

function resetGame() {
  running = false;
  gameOver = false;
  levelTransition = false;

  clearInterval(spawnIntervalId);
  cancelAnimationFrame(animationFrameId);
  clearTimeout(messageTimeoutId);

  drops = [];
  score = 0;
  level = 1;
  lives = STARTING_LIVES;
  dirtyInTank = 0;
  reservoirCurrent = 0;
  drinkTankProgress = 0;

  dropsContainer.innerHTML = "";
  confettiContainer.innerHTML = "";
  celebrationBanner.classList.add("hidden");
  gameOverPanel.classList.add("hidden");

  updateDisplays();
  showMessage("Game reset. Ready to protect clean water.");
}

function endGame() {
  running = false;
  gameOver = true;

  clearInterval(spawnIntervalId);
  cancelAnimationFrame(animationFrameId);

  finalLives.textContent = lives;
  finalDirty.textContent = dirtyInTank;
  finalScore.textContent = score;
  gameOverPanel.classList.remove("hidden");

  showMessage("Game over. Too much pollution reached the reservoir.", "warning");
}

function beginSpawning() {
  clearInterval(spawnIntervalId);

  spawnIntervalId = setInterval(() => {
    if (!running || gameOver || levelTransition) return;
    createDrop();
  }, getSpawnRate());
}

function createDrop() {
  const isPolluted = Math.random() < getPollutedChance();

  const drop = document.createElement("div");
  drop.className = `drop ${isPolluted ? "polluted-drop clickable" : "clean-drop"}`;
  drop.dataset.id = String(dropIdCounter++);

  const shape = document.createElement("div");
  shape.className = "drop-shape";
  drop.appendChild(shape);

  const size = isPolluted ? 42 : 38;
  const laneLeft = getLaneLeft();
  const laneWidth = getLaneWidth();
  const minX = laneLeft + 10;
  const maxX = laneLeft + laneWidth - size - 10;
  const startX = Math.random() * (maxX - minX) + minX;

  drop.style.left = `${startX}px`;
  drop.style.top = `${getDropStartY()}px`;
  drop.style.width = `${size}px`;
  drop.style.height = `${size * 1.25}px`;

  dropsContainer.appendChild(drop);

  const dropObj = {
    id: drop.dataset.id,
    element: drop,
    polluted: isPolluted,
    x: startX,
    y: getDropStartY(),
    speed: getDropSpeed()
  };

  if (isPolluted) {
    drop.addEventListener("click", () => clickPollutedDrop(dropObj.id));
  }

  drops.push(dropObj);
}

function clickPollutedDrop(id) {
  const index = drops.findIndex((drop) => drop.id === id);
  if (index === -1) return;

  const drop = drops[index];
  if (!drop.polluted) return;

  drop.element.remove();
  drops.splice(index, 1);

  score += DIRTY_CLICK_POINTS;
  updateDisplays();
  showMessage("Awesome Job, purifying water one drop at a time.", "success");
}

function animateDrops() {
  if (!running || gameOver || levelTransition) return;

  const reservoirTop = gameArea.clientHeight - getReservoirHeight() - 18;

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];
    drop.y += drop.speed;
    drop.element.style.top = `${drop.y}px`;
    drop.element.style.left = `${drop.x}px`;

    if (drop.y >= reservoirTop) {
      handleDropReachedReservoir(drop, i);
    }
  }

  animationFrameId = requestAnimationFrame(animateDrops);
}

function handleDropReachedReservoir(drop, index) {
  drop.element.remove();
  drops.splice(index, 1);

  if (drop.polluted) {
    dirtyInTank += 1;
    lives -= 1;
    score -= DIRTY_HIT_PENALTY;

    if (score < 0) score = 0;
    if (lives < 0) lives = 0;

    updateDisplays();
    showMessage("Let's do better on our clean up.", "warning");

    if (dirtyInTank >= MAX_DIRTY_IN_TANK || lives <= 0) {
      endGame();
    }
  } else {
    reservoirCurrent += 1;
    updateDisplays();

    if (reservoirCurrent >= getLevelGoal()) {
      completeLevel();
    }
  }
}

function completeLevel() {
  if (levelTransition || gameOver) return;

  levelTransition = true;
  running = false;

  clearInterval(spawnIntervalId);
  cancelAnimationFrame(animationFrameId);

  showCelebration();
  showMessage(`Reservoir full! Clean water is flowing to the drinkable tanks. Level ${level + 1} is starting.`, "success");

  setTimeout(() => {
    drainReservoir(() => {
      fillDrinkableWaterTanks(() => {
        level += 1;
        reservoirCurrent = 0;
        dirtyInTank = 0;

        drops.forEach((drop) => drop.element.remove());
        drops = [];

        updateDisplays();
        hideCelebration();

        levelTransition = false;
        running = true;
        beginSpawning();
        animateDrops();
      });
    });
  }, 1400);
}

function drainReservoir(callback) {
  let percent = 100;

  const drainInterval = setInterval(() => {
    percent -= 5;
    if (percent < 0) percent = 0;

    reservoirFill.style.height = `${percent}%`;

    if (percent === 0) {
      clearInterval(drainInterval);
      callback();
    }
  }, 60);
}

function fillDrinkableWaterTanks(callback) {
  drinkTankProgress += 1;
  updateDisplays();

  if (drinkTankProgress >= 8) {
    setTimeout(() => {
      score += TANK_FULL_BONUS;
      drinkTankProgress = 0;
      updateDisplays();
      showMessage("Drinkable water tanks are full! Bonus +1000 points!", "success");
      setTimeout(callback, 900);
    }, 900);
  } else {
    setTimeout(callback, 900);
  }
}

function showCelebration() {
  celebrationBanner.classList.remove("hidden");
  makeConfetti();
}

function hideCelebration() {
  celebrationBanner.classList.add("hidden");
  confettiContainer.innerHTML = "";
}

function makeConfetti() {
  confettiContainer.innerHTML = "";
  const colors = ["#ffd400", "#1b8cff", "#37c95d", "#ff5f78", "#b83bff", "#ff8b22"];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-20 - Math.random() * 120}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.transition = `transform ${1.8 + Math.random()}s linear, top ${1.8 + Math.random()}s linear`;

    confettiContainer.appendChild(piece);

    requestAnimationFrame(() => {
      piece.style.top = `${200 + Math.random() * 340}px`;
      piece.style.transform = `translateX(${Math.random() * 160 - 80}px) rotate(${Math.random() * 540}deg)`;
    });
  }
}

function attachButton(btn, handler) {
  if (btn) btn.addEventListener("click", handler);
}

attachButton(startBtn, startGame);
attachButton(pauseBtn, pauseGame);
attachButton(resetBtn, resetGame);
attachButton(desktopStartBtn, startGame);
attachButton(desktopPauseBtn, pauseGame);
attachButton(desktopResetBtn, resetGame);
attachButton(playAgainBtn, resetGame);

window.addEventListener("resize", () => {
  for (const drop of drops) {
    drop.element.style.left = `${drop.x}px`;
  }
});

updateDisplays();
