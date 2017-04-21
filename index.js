const WebSocket = require('ws');
const Cmd = require('node-cmd');
const Request = require('request');

const RANCHER_USER = 'CBCA67D9254C7C52D0C0';
const RANCHER_PASS = 'R45874piapVw45Sgyp7XogBJu7RLgm3HyEHEed2k';

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
      case 'runDesktop':
        me.runDesktop(function(port) {
          ws.send(JSON.stringify({
            seq: msg.seq,
            payload: port
          }));
        });
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
    if (name)
      image = name;

    var data = {
      "environment": {
        DISPLAY: ':' + display,
        SIGNAL_ADDR: 'ws://signal-service.cloudwarehub.com:8088/' + token,
        APP: 'gedit'
      },
      "expose": [],
      "imageUuid": "docker:" + image,
      "instanceTriggeredStop": "stop",
      "networkIds": [],
      "ports": [],
      "requestedHostId": "1h4",
      "startOnCreate": true,
      //"command": ["/root/start.sh"],
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
      "networkMode": "bridge",
      "dataVolumes": [],
      "dataVolumesFrom": []
    };
    Request.post({
      url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers',
      method: 'POST',
      auth: {
        user: RANCHER_USER,
        pass: RANCHER_PASS
      },
      json: data
    }, function(err, httpResponse, body) {
      me.cloudwares.push(body.id);
    });
    if (callback) {
      callback(token);
    }
  },
  runDesktop: function(callback) {
    var me = this;
    var data = {
      instanceTriggeredStop: "stop",
      startOnCreate: true,
      publishAllPorts: false,
      privileged: false,
      stdinOpen: true,
      tty: true,
      readOnly: false,
      networkMode: "bridge",
      type: "container",
      requestedHostId: "1h4",
      secrets: [],
      dataVolumes: [],
      dataVolumesFrom: [],
      dns: [],
      dnsSearch: [],
      capAdd: [],
      capDrop: [],
      devices: [],
      logConfig: {"driver": "", "config": {}},
      dataVolumesFromLaunchConfigs: [],
      imageUuid: "docker:daocloud.io/guodong/pulsar-desktop:latest",
      ports: ["5678/tcp"],
      instanceLinks: {},
      labels: {},
      networkContainerId: null,
      count: null,
      createIndex: null,
      created: null,
      deploymentUnitUuid: null,
      description: null,
      externalId: null,
      firstRunning: null,
      healthState: null,
      hostname: null,
      kind: null,
      memoryReservation: null,
      milliCpuReservation: null,
      removed: null,
      startCount: null,
      uuid: null,
      volumeDriver: null,
      workingDir: null,
      user: null,
      domainName: null,
      memorySwap: null,
      memory: null,
      cpuSet: null,
      cpuShares: null,
      pidMode: null,
      blkioWeight: null,
      cgroupParent: null,
      usernsMode: null,
      pidsLimit: null,
      diskQuota: null,
      cpuCount: null,
      cpuPercent: null,
      ioMaximumIOps: null,
      ioMaximumBandwidth: null,
      cpuPeriod: null,
      cpuQuota: null,
      cpuSetMems: null,
      isolation: null,
      kernelMemory: null,
      memorySwappiness: null,
      shmSize: null,
      uts: null,
      ipcMode: null,
      stopSignal: null,
      oomScoreAdj: null,
      ip: null,
      ip6: null,
      healthInterval: null,
      healthTimeout: null,
      healthRetries: null
    };
    Request.post({
      url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/container',
      method: 'POST',
      auth: {
        user: RANCHER_USER,
        pass: RANCHER_PASS
      },
      json: data
    }, function(err, httpResponse, body) {
      console.log(body);
      console.log('create container: '+body.id);
      /*function getPort(cb) {
        Request.get({
          url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers/'+body.id+'/ports',
        }, function(err, hr, body) {
          console.log(body);
          var d = JSON.parse(body);
          var port = d.data[0].publicPort;
          if (!port) {
            getPort(callback);
          }
          if (cb) {
            cb(port);
          }
        });
      }*/
      setTimeout(function() {
        Request.get({
          url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers/'+body.id+'/ports',
          auth: {
            user: RANCHER_USER,
            pass: RANCHER_PASS
          },
        }, function(err, hr, body) {
          console.log(body);
          var d = JSON.parse(body);
          var port = d.data[0].publicPort;
          if (!port) {

          }
          if (callback) {
            callback(port);
          }
        });
      }, 4000);

      me.cloudwares.push(body.id);
    });
  },
  clean: function() {
    var me = this;
    var cloudwares = me.cloudwares;
    for (var i in cloudwares) {
      Request.delete({
        url: 'http://rancher.cloudwarehub.com:8080/v2-beta/projects/1a5/containers/' + cloudwares[i],
        auth: {
          user: RANCHER_USER,
          pass: RANCHER_PASS
        },
      });
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

