const WebSocket = require('ws');
const Cmd = require('node-cmd');
const Net = require('net');
const Dgram = require('dgram');

const wss = new WebSocket.Server({ port: 8080 });

/** websocket clients from browser **/
var clients = [];

function Client(ws) {
  var me = this;
  this.ws = ws;
  this.cloudwares = [];

  ws.on('message', function(message) {
    console.log('received: %s', message);
    var msg = JSON.parse(message);
    if (!msg) {
      return;
    }
    switch (msg.request) {
      case 'run':
        me.runCloudware(msg.payload);
        break;
    }
  });
  ws.on('close', function() {
    me.clean();
  });
}

Client.prototype = {
  runCloudware: function(cmd) {
    var me = this;
    Cmd.get(cmd, function(output) {
      console.log(output);
      me.cloudwares.push(output);
    });
  },
  clean: function() {
    var me = this;
    var cloudwares = me.cloudwares;
    for (var i in cloudwares) {
      Cmd.run('sudo docker rm -f ' + cloudwares[i]);
    }
    findClientByWs(me.ws, function(cli, idx) {
      clients.splice(idx, 1);
    })
  }
};

function findClientByWs(ws, callback) {
  var client = null;

  /** find client from clients **/
  for (var i in clients) {
    if (clients[i].ws == ws) {
      client = clients[i];
      break;
    }
  }
  if (callback) {
    callback(client, i);
  }
  return client;
}

wss.on('connection', function(ws) {
  var client = new Client(ws);
  clients.push(client);

});

