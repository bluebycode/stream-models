/*jslint node: true */
"use strict";

var through = require('through');
var util    = require('util');
var cmds    = require('./lib/cmds.js');

var source = function(id){
  return through(function(chunk){
    if (cmds.Cmd.isCmd(chunk.toString().trim())){
      return;
    }
    this.queue(util.format('[%s] %s %s\n', Date.now(), id, chunk));
  });
};
module.exports = source;

//process.stdin.pipe(source(1)).pipe(process.stdout);
