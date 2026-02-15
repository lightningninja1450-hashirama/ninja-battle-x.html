const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () => console.log("Server running on port 3000"));
const wss = new WebSocket.Server({ server });

const MAPS = ["Dojo","Forest","Factory","Ruins"];
function randomMap() { return MAPS[Math.floor(Math.random() * MAPS.length)]; }

const MODES = ["ffa","tdm","ctf","parkour"];
let servers = {};

for(let mode of MODES){
  servers[mode] = {
    "Server 1": { players: {}, map: "Dojo" },
    "Server 2": { players: {}, map: "Forest" },
    "Server 3": { players: {}, map: "Factory" },
    "Server 4": { players: {}, map: "Ruins" }
  };
}

wss.on("connection", ws => {
  let id = Math.random().toString(36).slice(2);
  let currentMode = null;
  let currentServer = null;

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if(data.type === "getServers"){
      const list = {};
      for(let s in servers[data.mode]){
        list[s] = Object.keys(servers[data.mode][s].players).length;
      }
      ws.send(JSON.stringify({ type:"serverList", servers:list }));
    }

    if(data.type === "join"){
      currentMode = data.mode;
      currentServer = data.server;
      servers[currentMode][currentServer].players[id] = { id, x:200, y:200, hp:100 };

      ws.send(JSON.stringify({
        type:"init",
        id,
        players: servers[currentMode][currentServer].players,
        server: currentServer,
        mapObj: servers[currentMode][currentServer].map
      }));

      broadcast();
    }

    if(data.type === "move" && currentMode && currentServer){
      let p = servers[currentMode][currentServer].players[id];
      if(!p) return;
      p.x = data.x; p.y = data.y;
      broadcast();
    }

    if(data.type === "shoot" && currentMode && currentServer){
      for(let pid in servers[currentMode][currentServer].players){
        if(pid!==id){
          let p = servers[currentMode][currentServer].players[pid];
          const dx = p.x - data.x;
          const dy = p.y - data.y;
          const dist = Math.hypot(dx, dy);
          if(dist < 60){
            p.hp -= 25;
            if(p.hp <=0){
              p.hp = 100;
              p.x = Math.random()*800 + 100;
              p.y = 200;
            }
          }
        }
      }
      broadcast();
    }

  });

  ws.on("close", ()=>{
    if(currentMode && currentServer){
      delete servers[currentMode][currentServer].players[id];
      broadcast();
    }
  });

  function broadcast(){
    if(!currentMode || !currentServer) return;
    const packet = JSON.stringify({
      type:"players",
      players: servers[currentMode][currentServer].players
    });
    wss.clients.forEach(c => { if(c.readyState===1) c.send(packet); });
  }
});
