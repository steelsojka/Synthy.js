var Synthy = (function() {

  Synthy.Osc = function(patch, freq) {
    this.modOsc  = Synthy.context.createOscillator();
    this.tremelo = Synthy.context.createGainNode();
    this.osc     = Synthy.context.createOscillator();
    this.mix     = Synthy.context.createGainNode();
    this.output  = this.mix;

    this.osc.connect(this.mix);
    // this.modOsc.connect(this.tremelo);
    // this.tremelo.connect(this.osc.frequency);

    this.tremelo.gain.value     = patch.mod.mix;
    this.modOsc.frequency.value = patch.mod.rate;
    this.osc.frequency.value    = freq;
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
      var now = Synthy.context.currentTime;

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