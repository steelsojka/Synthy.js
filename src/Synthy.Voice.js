var Synthy = (function() {

  Synthy.Voice = function(baseFreq) {
    var patch = Synthy.patch;
    this.osc = [];

    this.envelope = new Synthy.Envelope(patch.volumeEnv);
    this.filter = new Synthy.Filter(patch.filter[0], baseFreq);
    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], baseFreq));
      this.osc[i].output.connect(this.filter.input);
    }

    this.filter.output.connect(this.envelope.input);
    this.output = this.envelope.output;
  };

  Synthy.Voice.prototype = {
    trigger : function() {
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].trigger();
      }
      this.filter.trigger();
      this.envelope.trigger();
    },
    release : function() {
      this.envelope.release();
      this.filter.release();
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].release(this.envelope.getReleaseTime());
      }
    },
    kill : function() {
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].kill();
      }
    }
  };

  return Synthy;

}(Synthy || {}));