var Synthy = (function(Synthy) {

  Synthy.Filter = function(patch, note, context) {

    this.context = context;
    this.filter = context.createBiquadFilter();

    this.filter.frequency.value = patch.cutoff;
    this.filter.Q.value         = patch.q;
    this.filter.type            = patch.type;
    this.freq                   = Synthy.Util.noteToFreq(note);
    this.env                    = patch.envelope;
    this.patch                  = patch;

    this.input = this.output = this.filter;
  };

  Synthy.Filter.prototype = {
    trigger : function(time) {
      var patch = this.patch;
      var now = time || this.context.currentTime;
      var freq = this.filter.frequency;
  
      this.startLevel = this.frequencyFromCutoff(patch.cutoff / 100);
      this.attackLevel = this.frequencyFromCutoff((patch.cutoff / 100) + (this.env  / 120));
      this.sustainLevel = this.frequencyFromCutoff((patch.cutoff / 100) + 
                                             ((this.env  / 120) * (patch.sustain / 100)));
      this.attackEnd = now + (patch.attack / 20);

      freq.value = this.startLevel;
      freq.setValueAtTime(this.startLevel, now);
      freq.linearRampToValueAtTime(this.attackLevel, this.attackEnd);
      freq.setTargetValueAtTime(this.sustainLevel, this.attackEnd, patch.decay / 100);
    },
    frequencyFromCutoff : function(cutoff) {
      var ny = 0.5 * this.context.sampleRate;
      var freq = Math.pow(2, (9 * cutoff) - 1) * this.freq;
      if (freq > ny) {
        freq = ny;
      }
      return freq;
    },
    release : function(time) {
      var now = time || this.context.currentTime;
      var freq = this.filter.frequency;

      freq.cancelScheduledValues(now);
      freq.setValueAtTime(freq.value, now);
      freq.linearRampToValueAtTime(this.startLevel, now + (this.patch.release / 100));
    }
  };

  return Synthy;

}(Synthy || {}));