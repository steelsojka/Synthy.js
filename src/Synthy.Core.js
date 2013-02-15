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
        velocity : velocity
      }, this.patch, this.context);
      this._voices[noteNumber] = voice;

      /*
       If we have to many nodes connected to the output at one time
       The audio starts to degrade. This connects 10 ms before the note
       is triggered 
       */
      this.timer.callbackAtTime(_time - 0.1, function(e) {
        console.log(e.target.context.currentTime + " :: " + _time );
        voice.output.connect(_this.drive.input);
        voice.trigger(_time);
      });
      // this.connectionTimeout = setTimeout(, (_time - 10) * 1000);
    },
    release : function(noteNumber, time) {
      if (!(noteNumber in this._voices)) return;

      this._voices[noteNumber].release(time);
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

  // AudioTimer.js

  (function(exports) {

    var _checkCallbacks = function(e) {
      var x = this._callbacks.length;
      var _time = this.context.currentTime;
      var callbacks = this._callbacks;
      var callback, removed;
      while (x--) {
        callback = callbacks[x];
        if (callback[0] <= _time) {
          removed = callbacks.splice(callbacks.indexOf(callback), 1)[0];
          removed[1](e);
        }
      }
    };

    var AudioTimer = function(context, buffer) {
      if (buffer == null) buffer = 512;
      this._callbacks = [];
      this.context = context || new webkitAudioContext();
      this.node = this.context.createScriptProcessor(buffer, 1, 1);
      this.node.onaudioprocess = _checkCallbacks.bind(this);
      this.node.connect(this.context.destination);
    };

    AudioTimer.prototype = {
      callbackAtTime : function(time, callback) {
        this._callbacks.push([time, callback]);
      }
    };

    exports.AudioTimer = AudioTimer;

  }(Synthy));


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