let ws;
let myId;
let players = {};
let mode = null;

const mainMenu = document.getElementById("mainMenu");
const modeMenu = document.getElementById("modeMenu");
const serverMenu = document.getElementById("serverMenu");
const serversDiv = document.getElementById("servers");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let me = { x: 500, y: 300 };

ws = new WebSocket("wss://ninja-battle-x-html.onrender.com");

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "serverList") renderServers(data.servers);

  if (data.type === "init") {
    myId = data.id;
    players = data.players;

    serverMenu.classList.add("hidden");
    canvas.style.display = "block";
  }

  if (data.type === "players") players = data.players;
};

function openModes() {
  mainMenu.classList.add("hidden");
  modeMenu.classList.remove("hidden");
}

function openServers(m) {
  mode = m;
  modeMenu.classList.add("hidden");
  serverMenu.classList.remove("hidden");

  serversDiv.innerHTML = "Loading servers...";

  ws.send(JSON.stringify({
    type: "getServers",
    mode: mode
  }));
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
  ws.send(JSON.stringify({
    type: "join",
    server,
    mode
  }));
}

const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.onclick = () => {
  ws.send(JSON.stringify({ type: "shoot", x: me.x, y: me.y }));
};

function loop() {
  requestAnimationFrame(loop);
  update();
  draw();
}
loop();

function update() {
  if (!myId) return;

  if (keys.a) me.x -= 4;
  if (keys.d) me.x += 4;
  if (keys.w) me.y -= 4;
  if (keys.s) me.y += 4;

  ws.send(JSON.stringify({
    type: "move",
    x: me.x,
    y: me.y
  }));
}

function draw() {
  if (!myId) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let id in players) {
    const p = players[id];

    ctx.fillStyle = id === myId ? "#00ffff" : "#ff4040";
    ctx.fillRect(p.x, p.y, 30, 40);

    ctx.fillStyle = "lime";
    ctx.fillRect(p.x, p.y - 8, p.hp / 2, 4);
  }
}
