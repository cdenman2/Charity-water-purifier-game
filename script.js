const container = document.getElementById("dropsContainer")

let score = 0
let level = 1
let lives = 4
let dirty = 0

let running = false

function updateDisplays(){

document.getElementById("scoreDisplay").textContent = score
document.getElementById("levelDisplay").textContent = level
document.getElementById("dirtyTankDisplay").textContent = dirty + " / 4"

}

function createDrop(){

if(!running)return

let drop = document.createElement("div")

let polluted = Math.random() < .3

drop.className = polluted ? "drop polluted-drop" : "drop clean-drop"

let shape = document.createElement("div")
shape.className="drop-shape"

drop.appendChild(shape)

let lane = document.getElementById("gameArea").clientWidth * .5
let left = (document.getElementById("gameArea").clientWidth - lane)/2

drop.style.left = left + Math.random()*lane + "px"
drop.style.top = "120px"

container.appendChild(drop)

let y = 120

function fall(){

if(!running)return

y += 1 + level*.3

drop.style.top = y + "px"

if(y > 580){

drop.remove()

if(polluted){

dirty++
score -= 200
lives--

document.getElementById("messageBox").textContent="Let's do better on our clean up"

if(dirty>=4 || lives<=0){

alert("GAME OVER")

running=false

}

}else{

score += 10

}

updateDisplays()

return

}

requestAnimationFrame(fall)

}

if(polluted){

drop.onclick=()=>{

drop.remove()

score+=100

document.getElementById("messageBox").textContent="Awesome Job, purifying water one drop at a time"

updateDisplays()

}

}

fall()

}

function startGame(){

running=true

setInterval(createDrop,1500)

}

document.getElementById("startBtn").onclick=startGame
document.getElementById("pauseBtn").onclick=()=>running=false
document.getElementById("resetBtn").onclick=()=>location.reload()

updateDisplays()
