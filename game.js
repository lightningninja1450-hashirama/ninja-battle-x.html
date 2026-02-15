let ws;
let myId;
let players = {};
let currentServer = null;
let currentMode = null;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const gamemodeMenu = document.getElementById("gamemodeMenu");
const serverMenu = document.getElementById("serverMenu");
const serversDiv = document.getElementById("servers");

let me = { x: 200, y: 200, vx:0, vy:0, hp:100 };

ws = new WebSocket(`ws://${location.host}`);

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "serverList") renderServers(data.servers);

  if (data.type === "init") {
    myId = data.id;
    players = data.players;
    currentServer = data.server;

    serverMenu.classList.add("hidden");
    canvas.style.display = "block";
  }

  if (data.type === "players" && data.server === currentServer) {
    players = data.players;
  }
};

function openGamemode() {
  mainMenu.classList.add("hidden");
  gamemodeMenu.classList.remove("hidden");
}

function openServers(mode) {
  currentMode = mode;
  gamemodeMenu.classList.add("hidden");
  serverMenu.classList.remove("hidden");
  ws.send(JSON.stringify({ type:"getServers", mode }));
}

function backToMain() {
  gamemodeMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
}

function backToModes() {
  serverMenu.classList.add("hidden");
  gamemodeMenu.classList.remove("hidden");
}

function renderServers(list) {
  serversDiv.innerHTML = "";
  for (let s in list) {
    const div = document.createElement("div");
    div.className = "server";
    div.innerHTML = `${s}<br>Players: ${list[s]}`;
    div.onclick = () => joinServer(s);
    serversDiv.appendChild(div);
  }
}

function joinServer(server) {
  ws.send(JSON.stringify({ type:"join", server, mode:currentMode }));
}

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.onclick = () => shoot();

function shoot(){
  ws.send(JSON.stringify({ type:"shoot", x:me.x, y:me.y }));
}

function loop() {
  requestAnimationFrame(loop);
  update();
  draw();
}
loop();

function update() {
  if(!currentServer) return;

  me.vx = 0;
  if(keys.a) me.vx = -5;
  if(keys.d) me.vx = 5;
  if(keys.w && me.y > 150) me.vy = -10;

  me.vy += 0.5;
  me.x += me.vx;
  me.y += me.vy;

  if(me.y > 620){ me.y = 620; me.vy = 0; }

  ws.send(JSON.stringify({ type:"move", x:me.x, y:me.y }));
}

function draw() {
  if(!currentServer) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let id in players){
    let p = players[id];

    ctx.fillStyle = id===myId ? "#00ffff":"#ff3c3c";
    ctx.fillRect(p.x,p.y,30,40);

    ctx.fillStyle="lime";
    ctx.fillRect(p.x,p.y-8,p.hp/2,4);
  }
}
