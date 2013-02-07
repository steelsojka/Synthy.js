var Synthy = (function(Synthy) {

  var _camelCase = function(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  };

  Synthy.Core = function(_options) {
    var options = _options || {};

    this.context = options.context || new webkitAudioContext();
    this._voices = {};

    this.load(options.patch);
  };


  Synthy.Core.prototype = {
    trigger : function(noteNumber) {
      if (!this.patch || noteNumber in this._voices) return;

      var voice = new Synthy.Voice(noteNumber, this.patch, this.context);

      voice.output.connect(this.drive.input);
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

      this.patch  = new Synthy.Patch(patch);
      this.delay  = new Synthy.Delay(this.patch.fx.delay, this.context);
      this.drive  = new Synthy.Drive(this.patch.fx.drive, this.context);
      this.master = new Synthy.Master(this.patch.master, this.context);

      this.drive.output.connect(this.delay.input);
      this.delay.output.connect(this.master.input);
      this.master.output.connect(this.context.destination);
    },
    save : function(spaces) {
      this.patch.fx.delay = this.delay.getValues();
      this.patch.fx.drive = this.drive.getValues();
      this.patch.master   = this.master.getValues();
      return this.patch.save(spaces);
    },
    addOscillator : function(settings) {
      this.patch.addOscillator(settings);
    }
  };

  // A quicker way of adding prototype methods in bulk that perform similar functions

  ["setFeedback", "setTime", "setMix"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setDelay")] = function() {
      this.delay[prop].apply(this.delay, arguments);
    };
  });

  ["setAmount", "setMix", "setType"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setDrive")] = function() {
      this.drive[prop].apply(this.drive, arguments);
    };
  });

  ["setGain"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setMaster")] = function() {
      this.master[prop].apply(this.master, arguments);
    };
  });

  ["Cutoff", "Q", "Modulation", "Type", "Envelope", "Attack", "Decay", "Sustain", "Release"].forEach(function(prop) {
    Synthy.Core.prototype["setFilter" + prop] = function(v) {
      this.patch.setFilterProperty(prop.toLowerCase(), v);
    }
  });

  ["Attack", "Decay", "Sustain", "Release"].forEach(function(prop) {
    Synthy.Core.prototype["setEnvelope" + prop] = function(v) {
      this.patch.setEnvelopeProperty(prop.toLowerCase(), v);
    }
  });

  ["ModRate", "ModMix", "ModType", "Range", "Detune", "Mix", "Type", "Harmony", 
   "DriveAmount", "DriveMix", "DriveType"].forEach(function(prop) {
    Synthy.Core.prototype["setOsc" + prop] = function(osc, v) {
      this.patch.setOscillatorProperty(osc, _camelCase(prop), v);
    }
  });



  Synthy.create = function(_options) {
    return new Synthy.Core(_options);
  };

  return Synthy;

}(Synthy || {}));