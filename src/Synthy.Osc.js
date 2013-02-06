var Synthy = (function() {

  Synthy.Osc = function(patch, note, context) {
    this.context = context;
    this.modOsc  = context.createOscillator();
    this.tremelo = context.createGainNode();
    this.osc     = context.createOscillator();
    this.mix     = context.createGainNode();
    this.output  = this.mix;

    this.osc.connect(this.mix);
    this.modOsc.connect(this.tremelo);
    this.tremelo.connect(this.osc.frequency);

    this.tremelo.gain.value     = patch.mod.mix;
    this.modOsc.frequency.value = patch.mod.rate;
    this.modOsc.type            = patch.mod.type;
    this.range                  = patch.range;
    this.harmony                = patch.harmony
    this.osc.frequency.value    = Synthy.Util.noteToFreq(note + (this.range * 12) + (this.harmony));
    this.osc.detune.value       = patch.detune;
    this.osc.type               = patch.type;
    this.mix.gain.value         = patch.mix;
  };

  Synthy.Osc.prototype = {
    trigger : function() {
      this.modOsc.start(0);
      this.osc.start(0);
    },
    release : function(time) {
      var now = this.context.currentTime;

      this.modOsc.stop(now + time);
      this.osc.stop(now + time);
    },
    kill : function() {
      this.modOsc.stop(0);
      this.osc.stop(0);
    }
  };

  return Synthy;

}(Synthy || {}));