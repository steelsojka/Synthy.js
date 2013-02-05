var Synthy = (function(Synthy) {

  Synthy.initialize = function(_options) {
    var options = _options || {};
    this.oscCount = options.oscillators || 3;
    this.context = options.context || new webkitAudioContext();
    this.patch = new Synthy.Patch();
    this._voices = {};

    this.master = new Synthy.Master(this.patch.master);
    this.master.output.connect(this.context.destination);
  };

  Synthy.trigger = function(noteNumber) {
    var freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
    var voice = new Synthy.Voice(freq);
    this._voices[noteNumber] = voice;
    voice.output.connect(this.master.input);
    voice.trigger();
  };

  Synthy.release = function(noteNumber) {
    if (!(noteNumber in this._voices)) return;

    this._voices[noteNumber].release();
    delete this._voices[noteNumber];
  };

  Synthy.kill = function() {
    for (var osc in this._voices) {
      this._voices[osc].kill();
    }
  };

  return Synthy;

}(Synthy || {}));