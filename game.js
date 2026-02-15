// =====================
// GLOBAL VARIABLES
// =====================
let ws;
let myId;
let players = {};
let mode = null;
let currentServer = null;
let currentMap = null;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let me = { x: 200, y: 200, vx: 0, vy: 0, hp: 100 };
let bullets = [];

const keys = {};

// =====================
// INPUT HANDLERS
// =====================
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Left click shooting
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const angle = Math.atan2(my - me.y, mx - me.x);
  ws.send(JSON.stringify({ type: "shoot", x: me.x, y: me.y, angle }));
});

// =====================
// WEBSOCKET CONNECTION
// =====================
ws = new WebSocket("wss://YOUR_SERVER_URL"); // Replace with your backend URL

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "serverList") renderServers(data.servers);

  if (data.type === "init") {
    myId = data.id;
    players = data.players;
    currentServer = data.server;
    currentMap = MAPS.find(m => m.name === data.mapObj) || MAPS[0];
    canvas.style.display = "block";
    document.getElementById("serverMenu").classList.add("hidden");
  }

  if (data.type === "players") players = data.players;
};

// =====================
// GAME LOOP
// =====================
function update() {
  if (!myId) return;

  // GRAVITY
  me.vy += 0.5;

  // MOVEMENT
  me.vx = 0;
  if (keys.a || keys["arrowleft"]) me.vx = -4;
  if (keys.d || keys["arrowright"]) me.vx = 4;
  if ((keys.w || keys["arrowup"]) && solidAt(currentMap, me.x, me.y + 41)) me.vy = -10;

  me.x += me.vx;
  me.y += me.vy;

  // COLLISION WITH SOLID TILES
  if (solidAt(currentMap, me.x, me.y + 40)) {
    me.y = Math.floor(me.y / TILE) * TILE;
    me.vy = 0;
  }

  // SEND MOVEMENT TO SERVER
  ws.send(JSON.stringify({ type: "move", x: me.x, y: me.y }));

  updateBullets();
}

function draw() {
  if (!myId || !currentMap) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw map
  drawMap(ctx, currentMap);

  // Draw players
  for (let id in players) {
    const p = players[id];
    ctx.fillStyle = id === myId ? "#0ff" : "#f33";
    ctx.fillRect(p.x, p.y, 30, 40);

    // HP bar
    ctx.fillStyle = "lime";
    ctx.fillRect(p.x, p.y - 8, p.hp / 2, 4);
  }

  // Draw bullets
  drawBullets();
}

function loop() {
  requestAnimationFrame(loop);
  update();
  draw();
}
loop();

// =====================
// BULLET SYSTEM
// =====================
function spawnBullet(x, y, angle, owner) {
  bullets.push({ x, y, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, owner });
}

function updateBullets() {
  bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 4));
}

// =====================
// MENU SYSTEM
// =====================
const mainMenu = document.getElementById("mainMenu");
const modeMenu = document.getElementById("modeMenu");
const serverMenu = document.getElementById("serverMenu");
const serversDiv = document.getElementById("servers");

function openModes() {
  mainMenu.classList.add("hidden");
  modeMenu.classList.remove("hidden");
}

function openServers(m) {
  mode = m;
  modeMenu.classList.add("hidden");
  serverMenu.classList.remove("hidden");
  serversDiv.innerHTML = "Loading servers...";
  ws.send(JSON.stringify({ type: "getServers", mode }));
}

function backMain() {
  modeMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
}

function backModes() {
  serverMenu.classList.add("hidden");
  modeMenu.classList.remove("hidden");
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
  ws.send(JSON.stringify({ type: "join", server, mode }));
}
