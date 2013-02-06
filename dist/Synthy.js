/**
 * Synthy.js v0.1
 *
 * A polyphonic customizable synthesizer
 * @author Steven Sojka - Wednesday, February 06, 2013
 *
 * MIT Licensed
 */
var Synthy = (function(Synthy) {

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
    save : function() {
      this.patch.fx.delay = this.delay.getValues();
      this.patch.fx.drive = this.drive.getValues();
      this.patch.master   = this.master.getValues();
      return this.patch.save();
    }
  };

  ["setFeedback", "setTime", "setMix"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setDelay")] = function() {
      this.delay[prop].apply(this.delay, arguments);
    };
  });

  ["setAmount", "setMix"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setDrive")] = function() {
      this.drive[prop].apply(this.drive, arguments);
    };
  });

  ["setGain"].forEach(function(prop) {
    Synthy.Core.prototype[prop.replace("set", "setMaster")] = function() {
      this.master[prop].apply(this.master, arguments);
    };
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
    this.output  = this.mix;

    this.osc.connect(this.mix);
    this.modOsc.connect(this.tremelo);
    this.tremelo.connect(this.osc.frequency);

    this.tremelo.gain.value     = patch.mod.mix;
    this.modOsc.frequency.value = patch.mod.rate;
    this.modOsc.type            = patch.mod.type;
    this.range                  = patch.range;
    this.harmony                = patch.harmony
    this.osc.frequency.value    = Synthy.Util.noteToFreq(note + (this.range * 12) + (this.harmony));
    this.osc.detune.value       = patch.detune;
    this.osc.type               = patch.type;
    this.mix.gain.value         = patch.mix;
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
    this.env                    = patch.env;
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

    this.envelope = new Synthy.Envelope(patch.envelope, context);
    this.filter   = new Synthy.Filter(patch.filter, noteNumber, context);

    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], noteNumber, context));
      this.osc[i].output.connect(this.filter.input);
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
      // setTimeout(this.destroy.bind(this), end * 1000);
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
  
  var _toTitleCase = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  Synthy.Patch = function(patch) {
    for (var key in patch) {
      if (patch.hasOwnProperty(key)) {
        this[key] = patch[key];
      }
    }
  };

  Synthy.Patch.prototype = {
    save : function() {
      var _export = {};

      for (var key in this) {
        if (this.hasOwnProperty(key)) {
          _export[key] = this[key];
        }
      }

      return JSON.stringify(_export);
    },
    setOscProperty : function(osc, prop, value) {
      this.osc[osc][prop] = value;
    },
    setFilterProperty : function(prop, value) {
      this.filter[prop] = value;
    },
    setMaster : function(prop, value) {
      this.master[prop] = value;
    }
  };

  var envProps = ["attack", "decay", "sustain", "release"];

  envProps.forEach(function(p) {
    Synthy.Patch.prototype["setEnvelope" + _toTitleCase(p)] = function(v) {
      this.envelope[p] = v;
    }
  });

  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

  var getCurve = function(amount) {
    var samples = 22050;
    var wsCurve = new Float32Array(samples);

    var k = 2 * amount / (1 - amount);

    for (var i = 0; i < samples; i+=1) {
      var x = (i - 0) * (1 - (-1)) / (samples - 0) + (-1);
      wsCurve[i] = (1 + k) * x / (1+ k * Math.abs(x));
    }

    return wsCurve;
  };

  Synthy.Drive = function(patch, context) {

    this.context = context;
    this.drive = context.createWaveShaper();
    this.input = context.createGainNode();
    this.output = context.createGainNode();
    this.driveOutput = context.createGainNode();

    this.input.connect(this.drive);
    this.input.connect(this.output);
    this.drive.connect(this.driveOutput);
    this.driveOutput.connect(this.output);

    this.setAmount(patch.drive);
    this.setMix(patch.mix);
  };

  Synthy.Drive.prototype = {
    setAmount : function(a) {
      this.amount = a;
      this.drive.curve = getCurve.call(this, a);
    },
    setMix : function(a) {
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

}(Synthy || {}));