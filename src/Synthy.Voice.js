var Synthy = (function() {

  Synthy.Voice = function(params, patch, context) {
    var noteNumber = params.noteNumber;
    var velocity = params.velocity || 127;

    this.osc = [];
    this.driveFx = [];

    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);

    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], noteNumber, velocity, context));
      
      this.driveFx.push(new Synthy.Drive({
        "drive" : patch.osc[i].driveAmount,
        "mix" : patch.osc[i].driveMix,
        "type" : patch.osc[i].driveType
      }, context));

      this.osc[i].output.connect(this.driveFx[i].input);
      this.driveFx[i].output.connect(this.filter.input);
    }

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
      this.timeout = setTimeout(this.destroy.bind(this), (_time + end) * 1000);
    },
    destroy : function() {
      this.output.disconnect(0);
    },
    kill : function() {
      clearTimeout(this.timeout);
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].kill();
      }
    }
  };

  return Synthy;

}(Synthy || {}));