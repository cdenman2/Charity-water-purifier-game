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


/* ----------------------------- GAME CONSTANTS ----------------------------- */

const MAX_DIRTY_IN_TANK = 4;
const STARTING_LIVES = 4;

const DIRTY_CLICK_POINTS = 100;
const DIRTY_HIT_PENALTY = 200;

const TANK_FULL_BONUS = 1000;


/* ----------------------------- GAME STATE ----------------------------- */

let score = 0;
let level = 1;
let lives = STARTING_LIVES;

let dirtyInTank = 0;
let reservoirCurrent = 0;
let drinkTankProgress = 0;

let running = false;
let gameOver = false;

let spawnIntervalId = null;
let animationFrameId = null;

let messageTimeoutId = null;

let drops = [];


/* ----------------------------- SPLASH SOUND ----------------------------- */

let audioContext = null;

function playSplashSound() {

  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;

  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * 0.25,
    audioContext.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, now);
  filter.Q.setValueAtTime(0.8, now);

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(1.5, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  source.start(now);
  source.stop(now + 0.25);
}


/* ----------------------------- LEVEL SETTINGS ----------------------------- */

function getLevelGoal() {
  return 12 + (level - 1) * 4;
}

function getSpawnRate() {
  return Math.max(520, 1500 - (level - 1) * 110);
}

function getDropSpeed() {
  return 0.75 + (level - 1) * 0.16;
}

function getDropStartY() {
  return window.innerWidth <= 640 ? 170 : 200;
}

function getReservoirCollisionY() {
  return window.innerWidth <= 640
    ? gameArea.clientHeight - 250
    : gameArea.clientHeight - 360;
}


/* ----------------------------- DISPLAY UPDATES ----------------------------- */

function updateDisplays() {

  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;

  dirtyTankDisplay.textContent =
    `${dirtyInTank} / ${MAX_DIRTY_IN_TANK}`;

  reservoirFillText.textContent =
    `Reservoir Fill: ${reservoirCurrent} / ${getLevelGoal()}`;

  const fillPercent =
    Math.min((reservoirCurrent / getLevelGoal()) * 100, 100);

  reservoirFill.style.height = `${fillPercent}%`;

  const drinkPercent =
    Math.min((drinkTankProgress / 8) * 100, 100);

  leftDrinkFill.style.height = `${drinkPercent}%`;
  rightDrinkFill.style.height = `${drinkPercent}%`;

  renderLives();
}


function renderLives() {

  livesDisplay.innerHTML = "";

  for (let i = 0; i < STARTING_LIVES; i++) {

    const glass = document.createElement("div");

    glass.className =
      i < lives ? "glass" : "glass empty";

    livesDisplay.appendChild(glass);
  }
}


/* ----------------------------- MESSAGE BOX ----------------------------- */

function showMessage(text, type = "") {

  messageBox.textContent = text;
  messageBox.className = "message-box";

  if (type === "success") {
    messageBox.classList.add("success");
  }

  if (type === "warning") {
    messageBox.classList.add("warning");
  }

  clearTimeout(messageTimeoutId);

  messageTimeoutId = setTimeout(() => {

    messageBox.textContent =
      "Protect the reservoir and keep polluted water out.";

    messageBox.className = "message-box";

  }, 1800);
}


/* ----------------------------- DROP CREATION ----------------------------- */

function createDrop() {

  if (!running || gameOver) return;

  const drop = document.createElement("div");

  const polluted = Math.random() < 0.3;

  drop.className =
    polluted ? "drop polluted-drop clickable" : "drop clean-drop";

  const shape = document.createElement("div");
  shape.className = "drop-shape";

  drop.appendChild(shape);

  const gameWidth = gameArea.clientWidth;

  const laneWidth = Math.min(gameWidth * 0.52, 680);

  const laneLeft = (gameWidth - laneWidth) / 2;

  const startX =
    laneLeft + Math.random() * (laneWidth - 42);

  drop.style.left = `${startX}px`;
  drop.style.top = `${getDropStartY()}px`;

  dropsContainer.appendChild(drop);

  const dropData = {

    element: drop,
    polluted: polluted,

    x: startX,
    y: getDropStartY(),

    speed: getDropSpeed()

  };

  if (polluted) {

    drop.addEventListener("click", () => {

      if (!drops.includes(dropData)) return;

      /* SPLASH SOUND */
      playSplashSound();

      drop.remove();

      drops = drops.filter(d => d !== dropData);

      score += DIRTY_CLICK_POINTS;

      updateDisplays();

      showMessage(
        "Awesome Job, purifying water one drop at a time.",
        "success"
      );

    });
  }

  drops.push(dropData);
}


/* ----------------------------- DROP COLLISION ----------------------------- */

function handleDropReachedReservoir(dropData) {

  dropData.element.remove();

  drops = drops.filter(d => d !== dropData);

  if (dropData.polluted) {

    dirtyInTank += 1;
    lives -= 1;

    score -= DIRTY_HIT_PENALTY;

    if (score < 0) score = 0;
    if (lives < 0) lives = 0;

    updateDisplays();

    showMessage(
      "Let's do better on our clean up.",
      "warning"
    );

    if (
      dirtyInTank >= MAX_DIRTY_IN_TANK ||
      lives <= 0
    ) {
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


/* ----------------------------- DROP ANIMATION ----------------------------- */

function animateDrops() {

  if (!running || gameOver) return;

  const reservoirTop =
    getReservoirCollisionY();

  for (let i = drops.length - 1; i >= 0; i--) {

    const drop = drops[i];

    drop.y += drop.speed;

    drop.element.style.top = `${drop.y}px`;

    if (drop.y >= reservoirTop) {

      handleDropReachedReservoir(drop);

    }
  }

  animationFrameId =
    requestAnimationFrame(animateDrops);
}


/* ----------------------------- LEVEL COMPLETE ----------------------------- */

function completeLevel() {

  running = false;

  clearInterval(spawnIntervalId);
  cancelAnimationFrame(animationFrameId);

  drinkTankProgress += 1;

  if (drinkTankProgress >= 8) {

    drinkTankProgress = 0;

    score += TANK_FULL_BONUS;

    showMessage(
      "Drinkable water tanks are full! Bonus +1000 points!",
      "success"
    );

  } else {

    showMessage(`Level ${level} cleared!`, "success");
  }

  reservoirCurrent = 0;
  dirtyInTank = 0;

  level += 1;

  updateDisplays();

  setTimeout(() => {

    running = true;

    spawnIntervalId =
      setInterval(createDrop, getSpawnRate());

    animateDrops();

  }, 1300);
}


/* ----------------------------- GAME CONTROLS ----------------------------- */

function startGame() {

  if (running || gameOver) return;

  running = true;

  showMessage(
    "Game started. Catch the polluted drops before they enter the reservoir."
  );

  spawnIntervalId =
    setInterval(createDrop, getSpawnRate());

  animateDrops();
}


function pauseGame() {

  running = false;

  clearInterval(spawnIntervalId);

  cancelAnimationFrame(animationFrameId);

  showMessage("Game paused.");
}


function resetGame() {

  running = false;
  gameOver = false;

  clearInterval(spawnIntervalId);

  cancelAnimationFrame(animationFrameId);

  drops.forEach(drop => drop.element.remove());

  drops = [];

  score = 0;
  level = 1;
  lives = STARTING_LIVES;

  dirtyInTank = 0;
  reservoirCurrent = 0;
  drinkTankProgress = 0;

  gameOverPanel.classList.add("hidden");

  updateDisplays();

  showMessage(
    "Game reset. Ready to protect clean water."
  );
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
}


/* ----------------------------- BUTTON BINDING ----------------------------- */

function bindButton(button, handler) {

  if (!button) return;

  button.addEventListener("click", handler);

  button.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      handler();
    },
    { passive: false }
  );
}

bindButton(startBtn, startGame);
bindButton(pauseBtn, pauseGame);
bindButton(resetBtn, resetGame);

bindButton(desktopStartBtn, startGame);
bindButton(desktopPauseBtn, pauseGame);
bindButton(desktopResetBtn, resetGame);

bindButton(playAgainBtn, resetGame);


/* ----------------------------- INIT ----------------------------- */

updateDisplays();
