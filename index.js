const WebSocket = require('ws');
const Cmd = require('node-cmd');
const Request = require('request');


const wss = new WebSocket.Server({port: 8081});

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
        me.runCloudware(msg.payload, function(token) {
          //setTimeout(function() {
          ws.send(JSON.stringify({
            seq: msg.seq,
            payload: token
          }));
          //}, 5000);
        });
        break;
    }
  });
  ws.on('close', function() {
    me.clean();
  });
}

Client.prototype = {
  runCloudware: function(name, callback) { // TODO: use name to run cloudware
    var me = this;
    var token = randomIntBetween(100000, 999999);
    var port = randomIntBetween(10000, 30000);
    var display = randomIntBetween(10, 10000);
    /*var cmd = 'sudo docker run -ti -d --net host --privileged -e DISPLAY=:' + display + ' -e PORT=' + port + ' -e APP=gedit -e SIGNAL_ADDR="ws://signal-service.cloudwarehub.com:8088/' + token + '" cloudwarehouse/demo';
     Cmd.get(cmd, function(output) {
     console.log(output);
     me.cloudwares.push(output);
     });*/

    var image = 'daocloud.io/guodong/pulsar:latest';
    switch (name) {
      case 'gedit':
        image = 'daocloud.io/guodong/pulsar:latest';
        break;
      case 'matlab':
        image = 'daocloud.io/guodong/matlab-pulsar:latest';
        break;
      case 'supertuxkart':
        image = 'cloudwarelabs/supertuxkart:latest';
        break;
      default:
        break;
    }

    var data = {
      "environment": {
        DISPLAY: ':' + display,
        SIGNAL_ADDR: 'ws://signal-service.cloudwarehub.com:8088/' + token,
        APP: name
      },
      "expose": [],
      "imageUuid": "docker:" + image,
      "instanceTriggeredStop": "stop",
      "networkIds": [],
      "ports": [],
      "requestedHostId": "1h4",
      "startOnCreate": true,
      "command": ["/root/start.sh"],
      "publishAllPorts": true,
      "privileged": true,
      "capAdd": [],
      "capDrop": [],
      "dns": [],
      "dnsSearch": [],
      "stdinOpen": true,
      "tty": true,
      "entryPoint": [],
      "restartPolicy": null,
      "devices": [],
      "healthCheck": null,
      "securityOpt": [],
      "logConfig": null,
      "extraHosts": [],
      "readOnly": false,
      "build": null,
      "dnsOpt": [],
      "groupAdd": [],
      "ulimits": [],
      "netAlias": [],
      "healthCmd": [],
      "secrets": [],
      "networkMode": "host",
      "dataVolumes": [],
      "dataVolumesFrom": []
    };
    Request.post({
      url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers',
      method: 'POST',
      json: data
    }, function(err, httpResponse, body) {
      me.cloudwares.push(body.id);
    });
    if (callback) {
      callback(token);
    }
  },
  clean: function() {
    var me = this;
    var cloudwares = me.cloudwares;
    for (var i in cloudwares) {
      Request.delete('http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers/' + cloudwares[i]);
    }
    findClientByWs(me.ws, function(cli, idx) {
      clients.splice(idx, 1);
    })
  }
};

function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

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

