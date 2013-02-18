var Synthy = (function(Synthy) {

  var _camelCase = function(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  };

  Synthy.Core = function(_options) {
    var options = _options || {};

    this.context = options.context || new webkitAudioContext();
    this._voices = {};
    this.timer = new Synthy.AudioTimer(this.context);

    this.load(options.patch);
  };


  Synthy.Core.prototype = {
    trigger : function(noteNumber, velocity, time) {
      if (!this.patch || noteNumber in this._voices) return;

      var _this = this;
      var _time = time;
      var _velocity = velocity;
      var voice = new Synthy.Voice({
        noteNumber : noteNumber,
        velocity : velocity,
        timer : this.timer
      }, this.patch, this.context);

      this.on('kill', voice.kill, voice);
      
      if (!this._voices[noteNumber]) {
        this._voices[noteNumber] = [];
      }
      
      this._voices[noteNumber].push(voice);

      /*
       If we have to many nodes connected to the output at one time
       The audio starts to degrade. This connects 10 ms before the note
       is triggered 
       */
      this.timer.callbackAtTime(_time - 0.1, function(e) {
        // console.log(e.target.context.currentTime + " :: " + _time );
        voice.output.connect(_this.drive.input);
        voice.trigger(_time);
      });
      // this.connectionTimeout = setTimeout(, (_time - 10) * 1000);
    },
    release : function(noteNumber, time) {
      if (!(noteNumber in this._voices)) return;
      var voice = this._voices[noteNumber].pop();
      var _this = this;

      voice.release(time);

      voice.on('destroy', function(e) {
        _this.off('kill', voice.kill);
      });

      delete this._voices[noteNumber];
    },
    kill : function() {
      this.emit('kill');
      this.off('kill');
      this.timer.clearCallbacks();
      this._voices = {};
      // for (var osc in this._voices) {
      //   this._voices[osc].kill();
      // }
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


  Synthy.Emitter.register(Synthy.Core);

  Synthy.create = function(_options) {
    return new Synthy.Core(_options);
  };

  return Synthy;

}(Synthy || {}));