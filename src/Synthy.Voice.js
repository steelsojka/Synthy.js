var Synthy = (function() {

  Synthy.Voice = function(noteNumber, patch, context) {
    this.osc = [];

    this.master   = new Synthy.Master(patch.master, context);
    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);
    this.delay    = new Synthy.Delay(patch.fx.delay, context);
    this.drive    = new Synthy.Drive(patch.fx.drive, context);

    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], noteNumber, context));
      this.osc[i].output.connect(this.filter.input);
    }

    this.filter.output.connect(this.envelope.input);
    this.envelope.output.connect(this.drive.input);
    this.drive.output.connect(this.delay.input);
    this.delay.output.connect(this.master.input);
    this.master.output.connect(context.destination);
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