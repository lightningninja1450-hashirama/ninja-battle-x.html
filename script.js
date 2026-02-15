<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShadowStrike.io</title>
<style>
body{margin:0;background:#050812;font-family:Arial;color:white;overflow:hidden}
#menu{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#060a1f,#02040d)}
#menuBox{background:#0b1030;padding:25px 35px;border-radius:12px;border:2px solid #3cffd0;text-align:center;width:320px}
#menu h1{color:#3cffd0;margin-bottom:10px}
button{width:100%;margin:8px 0;padding:12px;font-size:15px;background:#3cffd0;border:none;border-radius:6px;cursor:pointer;font-weight:bold}
button:hover{background:#29c6a4}
canvas{display:none;margin:auto;background:#080d24}
#hud{display:none;position:fixed;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:20px;font-size:14px;color:#3cffd0}
</style>
</head>
<body>

<div id="menu">
  <div id="menuBox">
    <h1>ShadowStrike.io</h1>
    <p>Select Game Mode</p>
    <button onclick="startGame('ffa')">Free For All</button>
    <button onclick="startGame('tdm')">Team Deathmatch</button>
    <button onclick="startGame('ctf')">Capture The Flag</button>
    <button onclick="startGame('parkour')">Parkour</button>
  </div>
</div>

<div id="hud">
  <div id="mode">Mode: FFA</div>
  <div id="map">Map: Arena</div>
</div>

<canvas id="game" width="1100" height="600"></canvas>

<script>
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const maps={
  arena:[{x:0,y:560,w:1100,h:40},{x:300,y:450,w:200,h:20},{x:650,y:340,w:200,h:20}],
  aerial:[{x:0,y:560,w:1100,h:40},{x:200,y:400,w:180,h:20},{x:470,y:300,w:180,h:20},{x:760,y:220,w:180,h:20}],
  coldfront:[{x:0,y:560,w:1100,h:40},{x:150,y:480,w:220,h:20},{x:450,y:400,w:220,h:20},{x:750,y:320,w:220,h:20}],
  neon:[{x:0,y:560,w:1100,h:40},{x:250,y:460,w:220,h:20},{x:550,y:380,w:220,h:20}]
};

let mapNames=Object.keys(maps);
let currentMap;
let mode='ffa';

const keys={};
addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

class Player{
  constructor(){this.x=100;this.y=100;this.w=30;this.h=42;this.vx=0;this.vy=0;this.speed=4;this.jump=-11;this.onGround=false;}
  update(){
    this.vx=0;
    if(keys.a)this.vx=-this.speed;
    if(keys.d)this.vx=this.speed;
    if((keys.w||keys[' '])&&this.onGround){this.vy=this.jump;this.onGround=false;}
    this.vy+=0.6;
    this.x+=this.vx;this.y+=this.vy;
    this.onGround=false;
    for(const p of currentMap){
      if(this.x+this.w>p.x&&this.x<p.x+p.w&&this.y+this.h>p.y&&this.y+this.h<p.y+p.h+20){
        this.y=p.y-this.h;this.vy=0;this.onGround=true;
      }
    }
  }
  draw(){ctx.fillStyle='#3cffd0';ctx.fillRect(this.x,this.y,this.w,this.h);}
}

const player=new Player();

function startGame(m){
  mode=m;
  document.getElementById('menu').style.display='none';
  document.getElementById('hud').style.display='flex';
  canvas.style.display='block';

  const mapName=mapNames[Math.floor(Math.random()*mapNames.length)];
  currentMap=maps[mapName];
  document.getElementById('mode').textContent='Mode: '+m.toUpperCase();
  document.getElementById('map').textContent='Map: '+mapName;
  loop();
}

function drawMap(){
  for(const p of currentMap){ctx.fillStyle='#1e2350';ctx.fillRect(p.x,p.y,p.w,p.h);}  
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMap();
  player.update();
  player.draw();
  requestAnimationFrame(loop);
}
</script>
</body>
</html>
