/*jslint node: true */
"use strict";

var cluster  = require('cluster');
var os       = require('os');
var fs       = require('fs');
var Q        = require('q');
var util     = require('util');
var _        = require('underscore');
var through  = require('through');
var net      = require('net');
var conf     = require('./config.js');
var selector = require('./lib/selector.js');
var cmds     = require('./lib/cmds.js');

// Importing streaming source from another module
// name should be mandatory.
var source  = require(util.format('./%s.js',process.argv[2]));

var tr = function(id){
  return through(function(chunk){
    var data = chunk.toString().trim();
    this.queue(util.format('%s\t%s\n', id, data));
  });
};

if (cluster.isMaster){

  var clients = process.argv[3],
      nodes = os.cpus().length;

  var inbounds = fs.createReadStream(null, {fd: 3});
  inbounds.on('error', function(err) {
    console.log('[fd:3]',err);
  });

  var outbounds = fs.createWriteStream(null, {fd: 4});
  outbounds.on('error', function(err){
    console.log('[fd:4]',err);
  });

  // Each worker forked on the cluster block should listen on
  // server port.
  var workers = Q.allSettled(_.map(_.range(nodes), function(){
    var defer = Q.defer();
    var worker = cluster.fork();
    worker.on('error', function(err){
      console.log(err);
    });
    worker.on('listening', function() {
      console.log('Worker.' + worker.id , ' listening, pid: ' + worker.process.pid);
      defer.resolve(this);
    });
    return defer.promise;
  }));

  // Spawning clients as-is cluster nodes are.
  // It performs a simple handshaking PING-PONG with cluster server.
  // With the handshaking, reference of cluster node can be found on
  // same command message.
  workers.then(function(){
    var nodes = _.map(_.range(clients), function(id){
      var client = net.Socket({
        allowHalfOpen: true,
        readable: false,
        writable: true
      });
      client.connect(conf.Cluster.port);
      client.on('connect', function(){
        client.write(cmds.PING(id).val() + '\n');
      });
      client.on('data', function(data) {
        if (cmds.Cmd.isCmd(data) && cmds.Cmd.from(data)._cmd === 'pong'){
          console.log('Client.'+id+' : under sync with node: ', cmds.Cmd.from(data)._ref);
        }
      });
      client.on('error', function(err) {
        console.log('Connection error with clusters: ', err);
      });
      client.on('close', function() {
        console.log('Connection with clusters was closed!');
      });
      return client;
    });

    inbounds
      .pipe(tr('master'))
      .pipe(selector(nodes))
      .pipe(outbounds);
  });

} else if (cluster.isWorker){

  // Cluster node listening. Handshaking answers handled from this side.
  // Incoming data from socket will be pipelined to a duplex-streaming source
  // defined as module (check process.argv[2]).
  net.createServer(function(socket){
    socket.on('data', function(data){
      if (cmds.Cmd.isCmd(data)){
        var cmd = cmds.Cmd.from(data);
        switch(cmd._cmd) {
          // {"cmd": "ping","ref":"own"}
          case 'ping':
            socket.write(cmds.PONG(cluster.worker.process.pid).val());
            break;
          // {"cmd": "info","ref":"own"}
          case 'info':
            console.log(cluster);
            socket.write(cmds.INFO({
              pid:   cluster.worker.process.pid,
              nodes: cluster.workers
            }).val());
            break;
        }
        return null;
      }
      return data;
    });

    // Client packets (from 'master' node) arrives for going through a readable-writable source
    // and giving back to client.
    socket
      .pipe(source(cluster.worker.id))
      .pipe(socket);// or {fd: 7}
  }).listen(conf.Cluster.port);

}
