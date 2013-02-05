var Synthy = (function(Synthy) {

  Synthy.Envelope = function(patch) {
    this.envelope = Synthy.context.createGainNode();
    this.envelope.gain.value = 0;
    this.patch = patch;
    this.input = this.output = this.envelope;
  };

  Synthy.Envelope.prototype = {
    trigger : function() {
      var now = Synthy.context.currentTime;
      var attackEnd = now + this.patch.A / 10;

      this.envelope.gain.setValueAtTime(0, now);
      this.envelope.gain.linearRampToValueAtTime(1, attackEnd);
      this.envelope.gain.setTargetValueAtTime((this.patch.S / 100), attackEnd, (this.patch.D / 100) + 0.001);
    },
    release : function() {
      var now = Synthy.context.currentTime;
      this.envelope.gain.cancelScheduledValues(now);
      this.envelope.gain.setValueAtTime(this.envelope.gain.value, now);
      this.envelope.gain.linearRampToValueAtTime(0, now + (this.patch.R / 100));
    },
    getReleaseTime : function() {
      return this.patch.R / 100;
    }
  };

  return Synthy;

}(Synthy || {}));