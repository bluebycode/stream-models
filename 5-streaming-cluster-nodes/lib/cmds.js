var util = require('util');

var mod = module.exports;
(function(container){
  "use strict";

  var Cmd = function Cmd(cmd, ref){
    this._cmd = cmd;
    this._ref = ref;
  };
  container.Cmd = Cmd;
  container.Cmd._globals = {
    pattern: /^{\"cmd\"[\s]*:[\s]*\"([a-z]+)\"[\s]*,[\s]*\"ref\"[\s]*:[\s]*\"([a-z0-9]+)\"[\s]*}.*$/
  };

  container.Cmd.prototype.val = function(){
    return util.format('{\"cmd\": \"%s", \"ref\":\"%s\"}', this._cmd, this._ref);
  };

  container.Cmd.isCmd = function(representation){
    return Cmd._globals.pattern.test(
      (representation instanceof Buffer)? representation.toString().trim() : representation
    );
  };

  container.Cmd.from = function(representation){
    var match = Cmd._globals.pattern.exec(
      (representation instanceof Buffer)? representation.toString().trim() : representation
    );
    if (!match){
      throw new Error('wrong format of cmd');
    }
    return new container.Cmd(match[1],match[2]);
  };

  container.PONG = function(ref){
    return new container.Cmd('pong', ref);
  };

  container.PING = function(ref){
    return new container.Cmd('ping', ref);
  };

  container.INFO = function(options){
    return new container.Cmd('info', JSON.stringify(options));
  };

})(mod);

/**
 * Block only call for unit testing.
 */
if (process.argv[2] === 'test') {
  var assert = require('assert');

  assert.equal(mod.Cmd.isCmd('{"cmd": "ping", "ref":"anyreferencewith10020202022"}'), true, 'isCmd?');

  var cmd = mod.Cmd.from('{"cmd": "ping", "ref":"anyreferencewith10020202022"}');
  assert.equal(cmd._cmd, 'ping', 'cmd===ping');
  assert.equal(cmd._ref, 'anyreferencewith10020202022', 'ref===anyreferencewith10020202022');
  assert.equal(cmd.val(),'{"cmd": "ping", "ref":"anyreferencewith10020202022"}', 'cmd.fmt===fmt');

  assert.throws(function(){
      "use strict";
      var message = 'anothermessage';
      mod.Cmd.from(message);
    },
    /wrong format.*/
  );
}
