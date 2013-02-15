var Synthy = (function() {

  Synthy.Osc = function(patch, note, velocity, context) {
    this.context = context;
    this.modOsc  = context.createOscillator();
    this.tremelo = context.createGainNode();
    this.osc     = context.createOscillator();
    this.mix     = context.createGainNode();
    // this.gate    = context.createOscillator();
    // this.gateGain = context.createGainNode();
    this.vGain = context.createGainNode();
    this.output  = this.mix;

    this.osc.connect(this.vGain);
    this.vGain.connect(this.mix);

    // this.gate.connect(this.gateGain);
    // this.gateGain.connect(this.mix.gain);

    this.modOsc.connect(this.tremelo);
    this.tremelo.connect(this.osc.frequency);

    this.tremelo.gain.value     = patch.modMix;
    this.modOsc.frequency.value = patch.modRate;
    this.modOsc.type            = patch.modType;
    this.range                  = patch.range;
    this.harmony                = patch.harmony
    this.osc.frequency.value    = Synthy.Util.noteToFreq(note + (this.range * 12) + (this.harmony));
    this.osc.detune.value       = patch.detune;
    this.osc.type               = patch.type;
    this.mix.gain.value         = patch.mix;
    this.vGain.gain.value       = velocity / 127;
    // this.gate.type              = patch.gateType;
    // this.gate.frequency.value   = patch.gateRate;
    // this.gateGain.gain.value    = patch.gateMix;
  };

  Synthy.Osc.prototype = {
    trigger : function(time) {
      if (time == null) time = 0;
      this.modOsc.start(time);
      this.osc.start(time);
    },
    release : function(time) {      
      this.modOsc.stop(time);
      this.osc.stop(time);
    },
    kill : function() {
      this.modOsc.stop(0);
      this.osc.stop(0);
    }
  };

  return Synthy;

}(Synthy || {}));