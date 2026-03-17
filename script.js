const dropsContainer=document.getElementById("dropsContainer")
const scoreDisplay=document.getElementById("scoreDisplay")
const levelDisplay=document.getElementById("levelDisplay")
const dirtyTankDisplay=document.getElementById("dirtyTankDisplay")
const livesDisplay=document.getElementById("livesDisplay")

const MAX_DIRTY=4
const START_LIVES=4

let score=0
let level=1
let lives=START_LIVES
let dirty=0

let drops=[]
let running=false

function updateHUD(){

scoreDisplay.textContent=score
levelDisplay.textContent=level
dirtyTankDisplay.textContent=dirty+" / "+MAX_DIRTY

livesDisplay.innerHTML=""

for(let i=0;i<START_LIVES;i++){

const g=document.createElement("div")
g.className="glass"

if(i>=lives)g.style.opacity=.3

livesDisplay.appendChild(g)

}

}

function spawnDrop(){

if(!running)return

const drop=document.createElement("div")

const polluted=Math.random()<0.3

drop.className="drop "+(polluted?"polluted":"clean")

const x=200+Math.random()*400

drop.style.left=x+"px"
drop.style.top="150px"

dropsContainer.appendChild(drop)

const data={
el:drop,
y:150,
polluted
}

if(polluted){

drop.onclick=()=>{

spawnConfetti(x,data.y)

score+=100
drop.remove()
drops=drops.filter(d=>d!==data)

updateHUD()

}

}

drops.push(data)

}

function animate(){

if(!running)return

for(let d of drops){

d.y+=1.4+(level*.3)

d.el.style.top=d.y+"px"

if(d.y>500){

d.el.remove()
drops=drops.filter(x=>x!==d)

if(d.polluted){

dirty++
lives--
score-=200

updateHUD()

if(lives<=0 || dirty>=MAX_DIRTY){
running=false
}

}

}

}

requestAnimationFrame(animate)

}

function spawnConfetti(x,y){

for(let i=0;i<15;i++){

const c=document.createElement("div")

c.className="confetti"

c.style.left=x+"px"
c.style.top=y+"px"

document.getElementById("confettiContainer").appendChild(c)

setTimeout(()=>c.remove(),2000)

}

}

function startGame(){

if(running)return

running=true

setInterval(spawnDrop,1200)

animate()

}

document.addEventListener("keydown",e=>{
if(e.key==="s")startGame()
})

updateHUD()
