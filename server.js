const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () =>
  console.log("Game running at http://localhost:3000")
);

const wss = new WebSocket.Server({ server });

let servers = {
  "US-East": { players:{} },
  "US-West": { players:{} },
  "EU": { players:{} },
  "Asia": { players:{} }
};

wss.on("connection", ws => {
  let myId = Math.random().toString(36).slice(2);
  let myServer = null;

  ws.send(JSON.stringify({ type:"serverList", servers:getCounts() }));

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if(data.type==="join"){
      myServer = data.server;
      servers[myServer].players[myId] = {
        id:myId,
        x:200+Math.random()*600,
        y:200,
        hp:100,
        score:0
      };

      ws.send(JSON.stringify({
        type:"init",
        id:myId,
        server:myServer,
        players:servers[myServer].players
      }));

      broadcast(myServer);
    }

    if(data.type==="move" && myServer){
      let p = servers[myServer].players[myId];
      if(!p) return;
      p.x=data.x; p.y=data.y;
      broadcast(myServer);
    }

    if(data.type==="shoot" && myServer){
      for(let id in servers[myServer].players){
        if(id!==myId){
          let p=servers[myServer].players[id];
          let d=Math.hypot(p.x-data.x,p.y-data.y);
          if(d<50){
            p.hp-=25;
            if(p.hp<=0){
              p.hp=100;
              p.x=100+Math.random()*900;
              p.y=200;
            }
          }
        }
      }
      broadcast(myServer);
    }
  });

  ws.on("close",()=>{
    if(myServer){
      delete servers[myServer].players[myId];
      broadcast(myServer);
    }
  });
});

function broadcast(server){
  const msg=JSON.stringify({
    type:"players",
    server,
    players:servers[server].players
  });

  wss.clients.forEach(c=>{
    if(c.readyState===1) c.send(msg);
  });
}

function getCounts(){
  const list={};
  for(let s in servers){
    list[s]=Object.keys(servers[s].players).length;
  }
  return list;
}
