const dropsContainer = document.getElementById("dropsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const dirtyTankDisplay = document.getElementById("dirtyTankDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const reservoirFill = document.getElementById("reservoirFill");
const reservoirFillText = document.getElementById("reservoirFillText");
const messageBox = document.getElementById("messageBox");
const celebrationBanner = document.getElementById("celebrationBanner");
const confettiContainer = document.getElementById("confettiContainer");
const gameOverPanel = document.getElementById("gameOverPanel");
const finalLives = document.getElementById("finalLives");
const finalDirty = document.getElementById("finalDirty");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const gameArea = document.getElementById("gameArea");

let score = 0;
let level = 1;
let lives = 5;
let dirtyInTank = 0;
let reservoirCurrent = 0;

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
  return Math.max(400, 1050 - (level - 1) * 85);
}

function getDropSpeed() {
  return 1.8 + (level - 1) * 0.35;
}

function getPollutedChance() {
  return Math.min(0.65, 0.25 + (level - 1) * 0.06);
}

function updateDisplays() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  dirtyTankDisplay.textContent = `${dirtyInTank} / 3`;
  reservoirFillText.textContent = `Reservoir Fill: ${reservoirCurrent} / ${getLevelGoal()}`;

  const fillPercent = Math.min((reservoirCurrent / getLevelGoal()) * 100, 100);
  reservoirFill.style.height = `${fillPercent}%`;

  renderLives();
}

function renderLives() {
  livesDisplay.innerHTML = "";

  for (let i = 0; i < 5; i++) {
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
  }, 1800);
}

function startGame() {
  if (gameOver || levelTransition) return;
  if (running) return;

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
  lives = 5;
  dirtyInTank = 0;
  reservoirCurrent = 0;

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

  const areaWidth = gameArea.clientWidth;
  const startX = Math.random() * (areaWidth - 80) + 20;
  const speed = getDropSpeed() + (Math.random() * 0.7 - 0.2);
  const drift = Math.random() * 0.8 - 0.4;
  const wobble = Math.random() * 1.7 + 0.6;
  const size = isPolluted ? 42 : 38 + Math.random() * 6;

  drop.style.left = `${startX}px`;
  drop.style.top = "76px";
  drop.style.width = `${size}px`;
  drop.style.height = `${size * 1.25}px`;

  dropsContainer.appendChild(drop);

  const dropObj = {
    id: drop.dataset.id,
    element: drop,
    polluted: isPolluted,
    x: startX,
    y: 76,
    speed: speed,
    drift: drift,
    wobble: wobble
  };

  if (isPolluted) {
    drop.addEventListener("click", () => clickPollutedDrop(dropObj.id));
  }

  drops.push(dropObj);
}

function clickPollutedDrop(id) {
  const index = drops.findIndex(drop => drop.id === id);
  if (index === -1) return;

  const drop = drops[index];

  if (!drop.polluted) return;

  drop.element.remove();
  drops.splice(index, 1);

  score += 15;
  updateDisplays();
  showMessage("Awesome Job, purifying water one drop at a time.", "success");
}

function animateDrops() {
  if (!running || gameOver || levelTransition) return;

  const reservoirTop = gameArea.clientHeight - 130 - 18;

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];

    drop.y += drop.speed;
    drop.x += Math.sin(drop.y / 28) * drop.wobble + drop.drift;

    if (drop.x < 10) drop.x = 10;
    if (drop.x > gameArea.clientWidth - 50) drop.x = gameArea.clientWidth - 50;

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

    if (lives < 0) lives = 0;
    updateDisplays();
    showMessage("Let's do better on our clean up.", "warning");

    if (dirtyInTank >= 3 || lives <= 0) {
      endGame();
    }
  } else {
    reservoirCurrent += 1;
    score += 5;
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
  showMessage(`Reservoir full! Clean water is flowing to the ocean. Level ${level + 1} is starting.`, "success");

  setTimeout(() => {
    drainReservoir(() => {
      level += 1;
      reservoirCurrent = 0;
      dirtyInTank = 0;
      drops.forEach(drop => drop.element.remove());
      drops = [];
      updateDisplays();

      hideCelebration();

      levelTransition = false;
      running = true;
      beginSpawning();
      animateDrops();
    });
  }, 1700);
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

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

updateDisplays();
