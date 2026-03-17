const dropsContainer = document.getElementById("dropsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const dirtyTankDisplay = document.getElementById("dirtyTankDisplay");
const livesDisplay = document.getElementById("livesDisplay");

const reservoirFill = document.getElementById("reservoirFill");
const reservoirFillText = document.getElementById("reservoirFillText");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

let score=0;
let level=1;
let lives=4;
let dirtyInTank=0;
let reservoirFillAmount=0;

let running=false;
let drops=[];

function renderLives(){
livesDisplay.innerHTML="";
for(let i=0;i<4;i++){
let g=document.createElement("div");
g.style.width="20px";
g.style.height="30px";
g.style.border="2px solid white";
g.style.display="inline-block";
g.style.margin="2px";
g.style.background=i<lives?"#73cbff":"#999";
livesDisplay.appendChild(g);
}
}

function updateDisplays(){
scoreDisplay.innerText=score;
levelDisplay.innerText=level;
dirtyTankDisplay.innerText=dirtyInTank+" / 4";
reservoirFillText.innerText="Reservoir Fill: "+reservoirFillAmount+" / 12";
reservoirFill.style.height=(reservoirFillAmount/12*100)+"%";
renderLives();
}

function createDrop(){

if(!running) return;

let drop=document.createElement("div");
drop.className="drop";

let shape=document.createElement("div");
shape.className="dropShape";

let polluted=Math.random()<0.3;

shape.classList.add(polluted?"dirty":"clean");

drop.appendChild(shape);

let laneWidth=600;
let left=(window.innerWidth/2)-(laneWidth/2);
let x=left+Math.random()*(laneWidth-40);

drop.style.left=x+"px";
drop.style.top="240px";

dropsContainer.appendChild(drop);

let d={el:drop,y:240,polluted:polluted};

if(polluted){

drop.onclick=()=>{
drop.remove();
drops=drops.filter(o=>o!==d);
score+=100;
updateDisplays();
};
}

drops.push(d);
}

function animate(){

if(!running) return;

for(let i=drops.length-1;i>=0;i--){

let d=drops[i];
d.y+=1+level*0.3;
d.el.style.top=d.y+"px";

if(d.y>600){

d.el.remove();
drops.splice(i,1);

if(d.polluted){

dirtyInTank++;
lives--;
score-=200;

}else{

reservoirFillAmount++;
}

if(score<0)score=0;

updateDisplays();

if(lives<=0||dirtyInTank>=4){
running=false;
alert("GAME OVER");
}

if(reservoirFillAmount>=12){
level++;
reservoirFillAmount=0;
dirtyInTank=0;
updateDisplays();
}

}
}

requestAnimationFrame(animate);
}

startBtn.onclick=()=>{
running=true;
animate();
setInterval(createDrop,1200);
};

pauseBtn.onclick=()=>{
running=false;
};

resetBtn.onclick=()=>{
location.reload();
};

updateDisplays();
