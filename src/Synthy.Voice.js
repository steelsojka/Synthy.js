var Synthy = (function() {

  Synthy.Voice = function(params, patch, context) {
    var noteNumber = params.noteNumber;
    var velocity = params.velocity || 127;
    var _this = this;

    this.timer = params.timer;
    this.osc = [];
    this.driveFx = [];

    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);

    patch.osc.forEach(function(osc) {
      var sOsc = new Synthy.Osc(osc, noteNumber, velocity, context)
      var driveFx = new Synthy.Drive({
        "drive" : osc.driveAmount,
        "mix" : osc.driveMix,
        "type" : osc.driveType
      }, context);

      _this.osc.push(sOsc);
      _this.driveFx.push(driveFx);

      _this.on('kill', sOsc.kill, sOsc);

      sOsc.output.connect(driveFx.input);
      driveFx.output.connect(_this.filter.input);
      
    });

    this.filter.output.connect(this.envelope.input);
    this.output = this.envelope.input;
  };

  Synthy.Voice.prototype = {
    trigger : function(time) {
      if (time == null) time = 0;

      for (var i = 0, _len = this.osc.length; i < _len; i++) {
          this.osc[i].trigger(time);
      }
      this.filter.trigger(time);
      this.envelope.trigger(time);
    },
    release : function(time) {
      var end = this.envelope.getReleaseTime();
      var _time = time || 0;

      this.envelope.release(time);
      this.filter.release(time);
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].release(_time + end);
      }
      this.killTime = _time + end;
      this.timer.callbackAtTime(this.killTime, this.destroy, this);
      // this.timeout = setTimeout(this.destroy.bind(this), (_time + end) * 1000);
    },
    destroy : function() {
      this.emit('destroy');
      this.output.disconnect(0);
    },
    kill : function() {
      this.timer.removeCallbackAtTime(this.destroy, this.killTime);
      this.emit('kill');
      this.output.disconnect(0);
      // for (var i = 0, _len = this.osc.length; i < _len; i++) {
      //   this.osc[i].kill();
      // }
    }
  };

  Synthy.Emitter.register(Synthy.Voice);

  return Synthy;

}(Synthy || {}));