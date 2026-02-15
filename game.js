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

let me = { x: 200, y: 200, vx: 0, vy: 0, hp: 100, crouch: false };
let bullets = [];

const keys = {};

// =====================
// INPUT HANDLERS
// =====================
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =====================
// MOUSE SHOOTING
// =====================
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const angle = Math.atan2(my - me.y, mx - me.x);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: "shoot", x: me.x, y: me.y, angle }));
  }
});

// =====================
// WEBSOCKET CONNECTION
// =====================
function connectWebSocket() {
  ws = new WebSocket("wss://ninja-battle-x-html.onrender.com"); // replace with your server

  ws.onopen = () => console.log("Connected to server!");

  ws.onmessage = e => {
    const data = JSON.parse(e.data);

    // Server list received
    if (data.type === "serverList") renderServers(data.servers);

    // Player init
    if (data.type === "init") {
      myId = data.id;
      players = data.players;
      currentServer = data.server;
      currentMap = MAPS.find(m => m.name === data.mapObj) || MAPS[0];
      canvas.style.display = "block";
      document.getElementById("serverMenu").classList.add("hidden");
    }

    // Player updates
    if (data.type === "players") players = data.players;
  };

  ws.onclose = () => {
    console.log("Disconnected. Reconnecting in 3 seconds...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = err => console.error("WebSocket error:", err);
}

// Connect immediately
connectWebSocket();

// =====================
// GAME LOOP
// =====================
function update() {
  if (!myId || !currentMap) return;

  // Gravity
  me.vy += 0.5;

  // Horizontal movement
  me.vx = 0;
  if (keys.a || keys["arrowleft"]) me.vx = -4;
  if (keys.d || keys["arrowright"]) me.vx = 4;

  // Crouch
  me.crouch = keys["control"];

  // Check if standing on ground (both bottom corners)
  const onGround = solidAt(currentMap, me.x, me.y + 40) || solidAt(currentMap, me.x + 29, me.y + 40);

  // Jump (spacebar)
  if (keys[" "] && onGround) {
    me.vy = -10;
  }

  // Update position
  me.x += me.vx;
  me.y += me.vy;

  // Vertical collision (floor)
  if (onGround && me.vy >= 0) {
    me.y = Math.floor(me.y / TILE) * TILE;
    me.vy = 0;
  }

  // Ceiling collision
  if (solidAt(currentMap, me.x, me.y) || solidAt(currentMap, me.x + 29, me.y)) {
    me.vy = 0;
  }

  // Send movement to server
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: "move", x: me.x, y: me.y }));
  }

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

    // Crouch height
    const height = p.crouch ? 20 : 40;
    ctx.fillRect(p.x, p.y + (40 - height), 30, height);

    // HP bar
    ctx.fillStyle = "lime";
    ctx.fillRect(p.x, p.y - 8, p.hp / 2, 4);
  }

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

  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: "getServers", mode }));
  } else {
    console.log("WebSocket not ready, retrying in 500ms...");
    setTimeout(() => openServers(m), 500);
  }
}

function backMain() {
  modeMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
}

function backModes() {
  serverMenu.classList.add("hidden");
  modeMenu.classList.remove("hidden");
}

// Render server list
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

// Join server
function joinServer(server) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: "join", server, mode }));
  } else {
    console.log("WebSocket not ready, cannot join server yet");
  }
}
