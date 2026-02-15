const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let rooms = {
  ffa: {},
  tdm: {},
  ctf: {},
  parkour: {}
};

wss.on('connection', ws => {

  let player = { id: Math.random().toString(36).slice(2), room: null };

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'join') {
      player.room = data.mode;
      rooms[player.room][player.id] = {
        id: player.id,
        x: Math.random()*900+100,
        y: 100,
        hp: 100
      };

      ws.send(JSON.stringify({
        type:'init',
        id: player.id
      }));
    }

    if (data.type === 'update' && player.room) {
      if (rooms[player.room][player.id]) {
        rooms[player.room][player.id] = {
          ...rooms[player.room][player.id],
          ...data.data
        };
      }
    }
  });

  ws.on('close', () => {
    if(player.room && rooms[player.room][player.id]){
      delete rooms[player.room][player.id];
    }
  });

});

setInterval(() => {
  for (const mode in rooms) {
    const payload = JSON.stringify({
      type:'state',
      players: rooms[mode]
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}, 1000/60);

console.log('Server running on ws://localhost:3000');
