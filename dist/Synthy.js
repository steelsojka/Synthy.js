/**
 * Synthy.js v0.2.0
 *
 * A polyphonic customizable synthesizer
 * @author Steven Sojka - Monday, February 18, 2013
 *
 * MIT Licensed
 */
var Synthy = (function(Synthy) {

  Synthy.Emitter = function() {};

  Synthy.Emitter.prototype = {
    on : function(event, listener, context) {
      var events = event.split(" ");
      this.__events = this.__events || {};
      for (var i = 0, _len = events.length; i < _len; i++) {
        this.__events[events[i]] = this.__events[events[i]] || [];
        this.__events[events[i]].push(context ? listener.bind(context) : listener);
      }
    },
    off : function(event, listener) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      if (listener) {
        this.__events[event].splice(this.__events[event].indexOf(listener), 1);
      } else {
        delete this.__events[event];
      }
    }, 
    emit : function(event) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      for (var i = 0, _len = this.__events[event].length; i < _len; i++) {
        this.__events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  Synthy.Emitter.register = function(obj) {
    for (var key in Synthy.Emitter.prototype) {
      if (Synthy.Emitter.prototype.hasOwnProperty(key)) {
        obj.prototype[key] = Synthy.Emitter.prototype[key];
      }
    }
  };

  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

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
        // 
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

}(Synthy || {}));var Synthy = (function(Synthy) {

	Synthy.Util = {
		noteToFreq : function(note) {
			return 440 * Math.pow(2, (note - 69) / 12);
		}
	};

	return Synthy;

}(Synthy || {}));var Synthy = (function(exports) {

  var _checkCallbacks = function(e) {
    var x = this._callbacks.length;
    var _time = this.context.currentTime;
    var callbacks = this._callbacks;
    var callback, removed;

    while (x--) {
      callback = callbacks[x];
      if (callback[0] <= _time) {
        removed = callbacks.splice(callbacks.indexOf(callback), 1)[0];
        if (removed[2]) {
          removed[1].call(removed[2], e);
        } else {
          removed[1](e);
        }
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
    callbackAtTime : function(time, callback, context) {
      this._callbacks.push([time, callback, context]);
    },
    clearCallbacks : function() {
      this._callbacks = [];
    },
    removeCallbackAtTime : function(callback, time) {
      var callbacks = this._callbacks;
      var x = callbacks.length;
      var _callback;

      while (x--) {
        _callback = callbacks[x];
        if (_callback[1] === callback) {
          if (time !== undefined) {
            if (time === _callback[0]) {
              callbacks.splice(callbacks.indexOf(_callback), 1);
            }
          } else {
            callbacks.splice(callbacks.indexOf(_callback), 1);
          }
        }
      }
    }
  };

  exports.AudioTimer = AudioTimer;

  return exports;

}(Synthy || {}));var Synthy = (function() {

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
      this.modOsc.disconnect(0);
      this.osc.disconnect(0);
    }
  };

  Synthy.Emitter.register(Synthy.Osc);

  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

  Synthy.Envelope = function(patch, context) {
    this.context = context;
    this.envelope = context.createGainNode();
    this.envelope.gain.value = 0;
    this.patch = patch;
    this.input = this.output = this.envelope;
  };

  Synthy.Envelope.prototype = {
    trigger : function(time) {
      var now = time || this.context.currentTime;
      var gain = this.envelope.gain;
      var attackEnd = now + this.patch.attack / 10;

      gain.setValueAtTime(0, now);
      gain.linearRampToValueAtTime(1, attackEnd);
      gain.setTargetValueAtTime((this.patch.sustain / 100), attackEnd, (this.patch.decay / 100) + 0.001);
    },
    release : function(time) {
      var now = time || this.context.currentTime;
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

}(Synthy || {}));var Synthy = (function(Synthy) {

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

}(Synthy || {}));var Synthy = (function(Synthy) {

  Synthy.Master = function(patch, context) {
    this.output = context.createGainNode();
    this.input = this.output;

    this.output.gain.value = patch.output;
  };

  Synthy.Master.prototype = {
  	setGain : function(v) {
  		this.output.gain.value = v;
  	},
  	getValues : function() {
  		return {
  			output : this.output.gain.value
  		}
  	}
  };

  return Synthy;

}(Synthy || {}));var Synthy = (function() {

  Synthy.Voice = function(params, patch, context) {
    var noteNumber = params.noteNumber;
    var velocity = params.velocity || 127;
    var _this = this;

    this.timer = params.timer;
    this.osc = [];
    this.driveFx = [];

    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);

    patch.osc.forEach(function(osc) {
      var sOsc = new Synthy.Osc(osc, noteNumber, velocity, context)
      var driveFx = new Synthy.Drive({
        "drive" : osc.driveAmount,
        "mix" : osc.driveMix,
        "type" : osc.driveType
      }, context);

      _this.osc.push(sOsc);
      _this.driveFx.push(driveFx);

      _this.on('kill', sOsc.kill, sOsc);

      sOsc.output.connect(driveFx.input);
      driveFx.output.connect(_this.filter.input);
      
    });

    this.filter.output.connect(this.envelope.input);
    this.output = this.envelope.input;
  };

  Synthy.Voice.prototype = {
    trigger : function(time) {
      if (time == null) time = 0;

      for (var i = 0, _len = this.osc.length; i < _len; i++) {
          this.osc[i].trigger(time);
      }
      this.filter.trigger(time);
      this.envelope.trigger(time);
    },
    release : function(time) {
      var end = this.envelope.getReleaseTime();
      var _time = time || 0;

      this.envelope.release(time);
      this.filter.release(time);
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].release(_time + end);
      }
      this.killTime = _time + end;
      this.timer.callbackAtTime(this.killTime, this.destroy, this);
      // this.timeout = setTimeout(this.destroy.bind(this), (_time + end) * 1000);
    },
    destroy : function() {
      this.emit('destroy');
      this.output.disconnect(0);
    },
    kill : function() {
      this.timer.removeCallbackAtTime(this.destroy, this.killTime);
      this.emit('kill');
      this.output.disconnect(0);
      // for (var i = 0, _len = this.osc.length; i < _len; i++) {
      //   this.osc[i].kill();
      // }
    }
  };

  Synthy.Emitter.register(Synthy.Voice);

  return Synthy;

}(Synthy || {}));var Synthy = (function() {

  Synthy.Patch = function(patch) {
    for (var key in patch) {
      if (patch.hasOwnProperty(key)) {
        this[key] = patch[key];
      }
    }
  };

  Synthy.Patch.prototype = {
    save : function(space) {
      var _export = {};

      for (var key in this) {
        if (this.hasOwnProperty(key)) {
          _export[key] = this[key];
        }
      }

      return JSON.stringify(_export, null, space);
    },
    setOscillatorProperty : function(osc, prop, value) {
      if (!this.osc[osc]) return;
      if (prop in this.osc[osc]) {
        this.osc[osc][prop] = value;
      }
    },
    addOscillator : function(settings) {
      var config = settings || {};
      var obj = {
        "modRate"     : 0,
        "modMix"      : 0,
        "modType"     : 1,
        "range"       : 0,
        "detune"      : 0,
        "mix"         : 1,
        "type"        : 0,
        "harmony"     : 0,
        "driveAmount" : 0,
        "driveMix"    : 0,
        "driveType"   : 0
      };

      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key in config) {
            obj[key] = config[key];
          }
        }
      }

      this.osc.push(obj);
    }
  };

  ["Filter", "Envelope"].forEach(function(prop) {
    Synthy.Patch.prototype["set" + prop + "Property"] = function(p, v) {
      if (p in this[prop.toLowerCase()]) {
        this[prop.toLowerCase()][p] = v;
      }
    }
  });



  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {
  
  var tanh = function(n) {
    return(Math.exp(n) - Math.exp(-n)) / (Math.exp(n) + Math.exp(-n));
  };

  var sign = function(x) {
    if(x === 0) { return 1; } 
    else { return Math.abs(x) / x; }
  };

  // On loan from tuna.js
  var algorithms = [
    function (amount, n_samples, ws_table) {
        amount = Math.min(amount, 0.9999);
        var k = 2 * amount / (1 - amount),
            i, x;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            ws_table[i] = (1 + k) * x / (1 + k * Math.abs(x));
        }
    }, function (amount, n_samples, ws_table) {
        var i, x, y;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            y = ((0.5 * Math.pow((x + 1.4), 2)) - 1) * y >= 0 ? 5.8 : 1.2;
            ws_table[i] = tanh(y);
        }
    }, function (amount, n_samples, ws_table) {
        var i, x, y, a = 1 - amount;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            y = x < 0 ? -Math.pow(Math.abs(x), a + 0.04) : Math.pow(x, a);
            ws_table[i] = tanh(y * 2);
        }
    }, function (amount, n_samples, ws_table) {
        var i, x, y, abx, a = 1 - amount > 0.99 ? 0.99 : 1 - amount;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            abx = Math.abs(x);
            if(abx < a) y = abx;
            else if(abx > a) y = a + (abx - a) / (1 + Math.pow((abx - a) / (1 - a), 2));
            else if(abx > 1) y = abx;
            ws_table[i] = sign(x) * y * (1 / ((a + 1) / 2));
        }
    }, function (amount, n_samples, ws_table) {
        var i, x;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            if(x < -0.08905) {
                ws_table[i] = (-3 / 4) * (1 - (Math.pow((1 - (Math.abs(x) - 0.032857)), 12)) + (1 / 3) * (Math.abs(x) - 0.032847)) + 0.01;
            } else if(x >= -0.08905 && x < 0.320018) {
                ws_table[i] = (-6.153 * (x * x)) + 3.9375 * x;
            } else {
                ws_table[i] = 0.630035;
            }
        }
    }, function (amount, n_samples, ws_table) {
        var a = 2 + Math.round(amount * 14),
            bits = Math.round(Math.pow(2, a - 1)),
            i, x;
        for(i = 0; i < n_samples; i++) {
            x = i * 2 / n_samples - 1;
            ws_table[i] = Math.round(x * bits) / bits;
        }
    }
  ];

  Synthy.Drive = function(patch, context) {

    this.context     = context;
    this.drive       = context.createWaveShaper();
    this.input       = context.createGainNode();
    this.output      = context.createGainNode();
    this.driveOutput = context.createGainNode();
    this.dryOutput   = context.createGainNode();
    this.waveTable   = new Float32Array(context.sampleRate);

    this.input.connect(this.drive);
    this.input.connect(this.dryOutput);
    this.dryOutput.connect(this.output);
    this.drive.connect(this.driveOutput);
    this.driveOutput.connect(this.output);

    this.setMix(patch.mix);
    this.setType(patch.type);
    this.setAmount(patch.drive);
  };

  Synthy.Drive.prototype = {
    setAmount : function(a) {
      this.amount = a;
      algorithms[this.type](a, this.context.sampleRate, this.waveTable);
      this.drive.curve = this.waveTable;
    },
    setType : function(type) {
      if (type > algorithms.length - 1 || type < 0) return;
      this.type = type;
      algorithms[this.type](this.amount, this.context.sampleRate, this.waveTable);
    },
    setMix : function(a) {
      if (a > 1) a = 1;

      this.dryOutput.gain.value = 1 - a; 
      this.driveOutput.gain.value = a;
    },
    getValues : function() {
      return {
        drive : this.amount,
        mix : this.driveOutput.gain.value
      }
    }
  };



  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

	Synthy.Delay = function(patch, context) {
		this.context   = context;
		this.delay     = context.createDelay();
		this.gain      = context.createGainNode();
		this.output    = context.createGainNode();
		this.delayGain = context.createGainNode();
		this.input     = context.createGainNode();

		this.delay.connect(this.gain);
		this.gain.connect(this.delay);
		this.input.connect(this.delay);
		this.delay.connect(this.delayGain);
		this.delayGain.connect(this.output);
		this.input.connect(this.output);

		this.setFeedback(patch.feedback);
		this.setTime(patch.time);
		this.setMix(patch.wet);
	};

	Synthy.Delay.prototype = {
		setFeedback : function(v) {
			this.gain.gain.value = v;
		},
		setTime : function(t) {
			this.delay.delayTime.value = t;
		},
		setMix : function(w) {
			this.delayGain.gain.value = w;
		},
		getValues : function() {
			return {
				feedback : this.gain.gain.value,
				time : this.delay.delayTime.value,
				wet : this.delayGain.gain.value
			}
		}
	};

	return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

	var keys = {
    65 : 45,
    87 : 46,
    83 : 47,
    69 : 48,
    68 : 49,
    70 : 50,
    84 : 51,
    71 : 52,
    89 : 53,
    72 : 54,
    85 : 55,
    74 : 56,
    75 : 57,
    79 : 58,
    76 : 59
  };

  var octave = 0;

	Synthy.keyToMidi = function(key) {
		if (key in keys) {
			return keys[key] + (octave * 12);
		}
	};

	Synthy.shiftOctave = function(num) {
		octave += num;
	};

	return Synthy;

}(Synthy || {}));