'use strict';

var util        = require('util');
var duplexer2   = require('duplexer2');
var stream      = require('stream');
var through2    = require('through2');
var through     = require('through');
var mergeStream = require('merge-stream');

/**
 * Selector class: resolve next iteration
 * from a number of options or nodes.
 * @param {number] total number of options/nodes}
 */
var Selector = function Selector(size){
  this._index = 0;
  this._size = size;
};

/**
 * Next selection.
 * @return {number] index of selection}.
 */
Selector.prototype.next = function(){
  this._index++;
  if (this._index >= this._size) {
    this._index = 0;
  }
  return this._index;
};

/**
 * [exports description]
 * @param  {type}
 * @param  {type}
 * @return {type}
 */
var MultiStream = module.exports = function MultiStream(options, nodes) {
  options = options || {};
  options.objectMode = true;

  stream.Writable.call(this, options);

  if (options.classifier) {
    this._classifier = options.classifier;
  }

  var self = this;

  var resume = function resume() {
    if (self.resume) {
      var r = self.resume;
      self.resume = null;
      r.call(null);
    }
  };

  this._channels = [];
  for (var n = 0; n < nodes; n++){
    var channel = new stream.Readable(options);
    channel._read = resume;
    this._channels.push(channel);
  }

  this.on('finish', function() {
    this._channels.forEach(function(channel){
      channel.push(null);
    });
  });
};

/**
 * Extending class as a Writable object.
 * @type {MultiStream] extended object from [stream.Writable}
 */
MultiStream.prototype = Object.create(stream.Writable.prototype, {constructor: {value: MultiStream}});

/**
 * Classification criteria by default.
 * @param  {Function] criteria / predicate}
 * @param  {Function] callback when done}
 * @return {type] ?}
 */
MultiStream.prototype._classifier = function(e, done) {
  return done(null, !!e);
};

/**
 * Retrieve the channel linked to nth stream node.
 * @param  {number] index}
 * @return {Stream] stream}
 */
MultiStream.prototype.channel = function(n){
  return this._channels[n];
};

/**
 * Writes on channel give by selection criteria.
 * @param  {Buffer} data.
 * @param  {String} encoding.
 * @param  {Function} callback.
 * @return {Function} void.
 */
MultiStream.prototype._write = function _write(input, encoding, done) {
  var self = this;

  this._classifier.call(null, input, function(err, node) {
    if (err) {
      return done(err);
    }
    var out = self._channels[node %  self._channels.length];
    if (out.push(input)) {
      return done();
    } else {
      self.resume = done;
    }
  });
};

/**
 * Makes a readable-writable stream, which makes a context switching
 * between the streams, which are connected to outbounds of stream.
 * @param  {array of streams objects}
 * @return {readable-writable stream composed by provided streams}
 */
var selectorStream = module.exports = function(streams){

  // through2 provides us a readable-writable simple stream as readable stream
  // which all streams will be connected by.
  var outStream = through2.obj();

  // Switch between streams
  // @todo: we should validate the healthy of streams provided
  var _selector = new Selector(streams.length);

  // Forking streams from main one
  // classifier method provides functionality of switching
  // between streams basically (selector algorithm..)
  var multiStream = new MultiStream({
    classifier: function (e, cb) {
      return cb(null, _selector.next());
    }
  }, streams.length);

  var mergedStream;

  // pipeling streams with channels
  streams.forEach(function(forward,n){
    multiStream.channel(n).pipe(forward);
    if (n === 0){
      mergedStream = forward;
    }else{
      mergedStream = mergeStream(forward, mergedStream);
    }
  });

  // **
  // MUST TO FIX: error propagation
  // **
  streams.forEach(function(forward,n){
    forward.on('error', function(err) {
      //console.log('forward !!!!!!!!',err);
      //mergedStream.emit('error', err);
    });
  });

  // Sending everything down-stream
  mergedStream.pipe(outStream);
  mergedStream.on('error', function(err) {
    //console.log('mergedStream !!!!!!!!',err);
    //outStream.emit('error', err);
  });

  outStream.on('error', function(err){
    //console.log('outStream !!!!!!!!',err);
  });

  // Consumers write in to forked stream, we write out to outStream
  return duplexer2({objectMode: true}, multiStream, outStream);
};

/**
 * Block only call for unit testing.
 */
if (process.argv[2] === 'test') {
  var assert = require('assert');

  var tr = function(index){
    return through(function(data){
      this.queue(util.format('[%s] [%s] %s\n', Date.now(), index, data));
    });
  };

  var assertStream = function(matching, message){
    return through(function(data){
      assert.equal(true, !!(matching.test(data)), message);
    });
  };

  var PassThrough = stream.PassThrough ||
    require('readable-stream').PassThrough;

  var pass = new PassThrough();
  pass
    .pipe(selectorStream([tr(0), tr(1), tr(2)]))
    .pipe(assertStream(/^\[[0-9]*\][\s]\[[0-9]*\][\s]hello/, 'message was expected!!'));
  pass.write('hello');

  /**
  * $ node selector.js test
  * my message
  * [1423506400054] [1] my message
  */
  console.log('Type>');
  process.stdin
    .pipe(selectorStream([tr(0), tr(1), tr(2)]))
    .pipe(process.stdout);
}
