const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let ws;
let myId = null;
let players = {};
let mode = null;

function startGame(m) {
  mode = m;

  document.getElementById("menu").style.display = "none";
  document.getElementById("hud").style.display = "flex";
  canvas.style.display = "block";

  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type:"join", mode }));
  };

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);

    if (msg.type === "init") {
      myId = msg.id;
    }

    if (msg.type === "state") {
      players = msg.players;
    }
  };

  loop();
}

const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let me = { x:200, y:100, vx:0, vy:0 };

function update() {
  me.vx = 0;
  if (keys.a) me.vx = -4;
  if (keys.d) me.vx = 4;
  if (keys.w && me.y > 100) me.vy = -10;

  me.vy += 0.5;
  me.x += me.vx;
  me.y += me.vy;

  if (me.y > 550) {
    me.y = 550;
    me.vy = 0;
  }

  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type:"update", data: me }));
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (const id in players) {
    const p = players[id];

    ctx.fillStyle = id === myId ? "#3cffd0" : "#ff4b4b";
    ctx.fillRect(p.x,p.y,30,40);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
