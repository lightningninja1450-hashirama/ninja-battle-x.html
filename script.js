// ================================
// SHADOWSTRIKE.IO MULTIPLAYER ENGINE
// Server + Client Starter Framework
// ================================

// ================================
// SERVER (Node.js + WebSocket)
// ================================

// 1) Create folder
//    mkdir shadowstrike && cd shadowstrike
//    npm init -y
//    npm install ws

// 2) Create file: server.js

const WebSocket = require('ws');
const PORT = 3000;

const wss = new WebSocket.Server({ port: PORT });

let players = {};

wss.on('connection', ws => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { id, x: 200, y: 200, vx: 0, vy: 0, hp: 100 };

  ws.send(JSON.stringify({ type: 'init', id, players }));

  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'update') {
      players[id] = { ...players[id], ...msg.data };
    }
  });

  ws.on('close', () => delete players[id]);
});

setInterval(() => {
  const payload = JSON.stringify({ type: 'state', players });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}, 1000 / 60);

console.log('ShadowStrike Server running on ws://localhost:' + PORT);


// ================================
// CLIENT (index.html)
// ================================

/*

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ShadowStrike.io</title>
<style>
body{margin:0;background:#050812;overflow:hidden}
canvas{display:block;margin:auto;background:#080d24}
</style>
</head>
<body>
<canvas id="c" width="1000" height="600"></canvas>
<script>

const c = document.getElementById('c');
const x = c.getContext('2d');

const ws = new WebSocket('ws://localhost:3000');
let id = null;
let players = {};

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if(msg.type === 'init'){ id = msg.id; players = msg.players; }
  if(msg.type === 'state') players = msg.players;
}

const keys = {};
addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

const me = { x:200,y:200,vx:0,vy:0 };

function update(){
  me.vx = 0;
  if(keys.a) me.vx=-4;
  if(keys.d) me.vx=4;
  if(keys.w) me.vy=-8;

  me.vy+=0.5;
  me.x+=me.vx;
  me.y+=me.vy;

  if(me.y>560){ me.y=560; me.vy=0 }

  ws.send(JSON.stringify({ type:'update', data: me }));
}

function draw(){
  x.clearRect(0,0,c.width,c.height);
  for(const p in players){
    const pl = players[p];
    x.fillStyle = p === id ? '#3cffd0' : '#ff3c3c';
    x.fillRect(pl.x,pl.y,30,40);
  }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();

</script>
</body>
</html>

*/
