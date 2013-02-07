/**
 * Synthy.js v0.1
 *
 * A polyphonic customizable synthesizer
 * @author Steven Sojka - Thursday, February 07, 2013
 *
 * MIT Licensed
 */
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

}(Synthy || {}));var Synthy = (function(Synthy) {

	Synthy.Util = {
		noteToFreq : function(note) {
			return 440 * Math.pow(2, (note - 69) / 12);
		}
	};

	return Synthy;

}(Synthy || {}));var Synthy = (function() {

  Synthy.Osc = function(patch, note, context) {
    this.context = context;
    this.modOsc  = context.createOscillator();
    this.tremelo = context.createGainNode();
    this.osc     = context.createOscillator();
    this.mix     = context.createGainNode();
    this.gate    = context.createOscillator();
    this.gateGain = context.createGainNode();
    this.output  = this.mix;

    this.osc.connect(this.mix);

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
    // this.gate.type              = patch.gateType;
    // this.gate.frequency.value   = patch.gateRate;
    // this.gateGain.gain.value    = patch.gateMix;
  };

  Synthy.Osc.prototype = {
    trigger : function() {
      this.modOsc.start(0);
      this.osc.start(0);
    },
    release : function(time) {
      var now = this.context.currentTime;
      
      this.modOsc.stop(now + time);
      this.osc.stop(now + time);
    },
    kill : function() {
      this.modOsc.stop(0);
      this.osc.stop(0);
    }
  };

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
    trigger : function() {
      var patch = this.patch;
      var now = this.context.currentTime;
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
    release : function() {
      var now = this.context.currentTime;
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

  Synthy.Voice = function(noteNumber, patch, context) {
    this.osc = [];
    this.driveFx = [];

    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);

    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], noteNumber, context));
      
      this.driveFx.push(new Synthy.Drive({
        "drive" : patch.osc[i].driveAmount,
        "mix" : patch.osc[i].driveMix,
        "type" : patch.osc[i].driveType
      }, context));

      this.osc[i].output.connect(this.driveFx[i].input);
      this.driveFx[i].output.connect(this.filter.input);
    }

    this.filter.output.connect(this.envelope.input);
    this.output = this.envelope.input;
  };

  Synthy.Voice.prototype = {
    trigger : function() {
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].trigger();
      }
      this.filter.trigger();
      this.envelope.trigger();
    },
    release : function() {
      var end = this.envelope.getReleaseTime();
      this.envelope.release();
      this.filter.release();
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].release(end);
      }
      setTimeout(this.destroy.bind(this), end * 1000);
    },
    destroy : function() {
      this.output.disconnect(0);
    },
    kill : function() {
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].kill();
      }
    }
  };

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