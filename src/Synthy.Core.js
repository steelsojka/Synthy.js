var Synthy = (function(Synthy) {

  Synthy.Core = function(_options) {
    var options = _options || {};

    this.context = options.context || new webkitAudioContext();
    this._voices = {};

    this.load(options.patch);

    // this.master = new Synthy.Master(this.patch.master);
    // this.master.output.connect(this.context.destination);
  };


  Synthy.Core.prototype = {
    trigger : function(noteNumber) {
      if (!this.patch || noteNumber in this._voices) return;

      var voice = new Synthy.Voice(noteNumber, this.patch, this.context);
      this._voices[noteNumber] = voice;
      voice.trigger();
    },
    release : function(noteNumber) {
      if (!(noteNumber in this._voices)) return;

      this._voices[noteNumber].release();
      delete this._voices[noteNumber];
    },
    kill : function() {
      for (var osc in this._voices) {
        this._voices[osc].kill();
      }
    },
    load : function(patch) {
      if (!patch) return;

      this.patch = new Synthy.Patch(patch);
    },
    save : function() {
      return this.patch.save();
    }
  };

  Synthy.create = function(_options) {
    return new Synthy.Core(_options);
  };

  return Synthy;

}(Synthy || {}));