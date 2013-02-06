var Synthy = (function(Synthy) {

  Synthy.Envelope = function(patch, context) {
    this.context = context;
    this.envelope = context.createGainNode();
    this.envelope.gain.value = 0;
    this.patch = patch;
    this.input = this.output = this.envelope;
  };

  Synthy.Envelope.prototype = {
    trigger : function() {
      var now = this.context.currentTime;
      var gain = this.envelope.gain;
      var attackEnd = now + this.patch.attack / 10;

      gain.setValueAtTime(0, now);
      gain.linearRampToValueAtTime(1, attackEnd);
      gain.setTargetValueAtTime((this.patch.sustain / 100), attackEnd, (this.patch.decay / 100) + 0.001);
    },
    release : function() {
      var now = this.context.currentTime;
      var gain = this.envelope.gain;

      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + (this.patch.release / 100));
    },
    getReleaseTime : function() {
      return this.patch.release / 100;
    }
  };

  return Synthy;

}(Synthy || {}));