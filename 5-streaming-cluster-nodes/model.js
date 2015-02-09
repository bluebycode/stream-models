/*jslint node: true */
'use strict';

var child   = require('child_process');
var stream  = require('stream');
var PassThrough = stream.PassThrough ||
  require('readable-stream').PassThrough;

//
// Bind inbounds data with the outbounds passing through a module defined.
//
module.exports = function(inbounds, outbounds, mod, parameters){
  var _options = parameters || {};

  // Opening fd:3, fd:4 as communication channels to child processes with two streams.
  var _channels =  [ 0, 1, 2, 'pipe','pipe'];

  // Spawning cluster nodes of type defined on 'module' argument. options.clients means client will be
  // used to access cluster nodes, we can user less or more than spawn nodes.
  var _cluster = child.spawn('node', ['./cluster.js',mod, _options.clients], { stdio: _channels});

  // Pipeline path. Main process set the streaming communication on file descriptors 3:4
  // as channels
  // [Inbounds] => [fd:3] => [readable-writable module stream flow>] => [fd:4] => [Outbounds]
  var _passing = new PassThrough();
  _passing
    .pipe(inbounds)
    .pipe(_cluster.stdio[3])
    .pipe(_cluster.stdio[4])
    .pipe(outbounds);
};
