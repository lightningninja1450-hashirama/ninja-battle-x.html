const maps = [
  {
    name: "Dojo",
    platforms: [
      {x:100,y:600,w:1000,h:40},
      {x:200,y:480,w:250,h:20},
      {x:600,y:450,w:300,h:20}
    ]
  },
  {
    name: "Forest",
    platforms: [
      {x:50,y:620,w:1100,h:40},
      {x:150,y:500,w:250,h:20},
      {x:550,y:470,w:300,h:20}
    ]
  }
];

function randomMap() {
  return maps[Math.floor(Math.random() * maps.length)];
}
