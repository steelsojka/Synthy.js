/**
 * Synthy.js v0.1
 *
 * A polyphonic customizable synthesizer
 * @author Steven Sojka - Tuesday, February 05, 2013
 *
 * MIT Licensed
 */
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

  return Synthy;

}(Synthy || {}));var Synthy = (function() {

  Synthy.Osc = function(patch, freq) {
    this.modOsc  = Synthy.context.createOscillator();
    this.tremelo = Synthy.context.createGainNode();
    this.osc     = Synthy.context.createOscillator();
    this.mix     = Synthy.context.createGainNode();
    this.output  = this.mix;

    this.osc.connect(this.mix);
    // this.modOsc.connect(this.tremelo);
    // this.tremelo.connect(this.osc.frequency);

    this.tremelo.gain.value     = patch.mod.mix;
    this.modOsc.frequency.value = patch.mod.rate;
    this.osc.frequency.value    = freq;
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
      var now = Synthy.context.currentTime;

      this.modOsc.stop(now + time);
      this.osc.stop(now + time);
    }
  };

  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

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

}(Synthy || {}));var Synthy = (function(Synthy) {

  Synthy.Filter = function(patch, freq) {

    this.filter = Synthy.context.createBiquadFilter();

    this.filter.frequency.value = patch.cutoff;
    this.filter.Q.value         = patch.q;
    this.filter.type            = patch.type;
    this.freq                   = freq;
    this.env                    = patch.env;
    this.patch                  = patch;

    this.input = this.output = this.filter;
  };

  Synthy.Filter.prototype = {
    trigger : function() {
      var patch = this.patch;
      var now = Synthy.context.currentTime;
  
      this.startLevel = this.frequencyFromCutoff(patch.cutoff / 100);
      this.attackLevel = this.frequencyFromCutoff((patch.cutoff / 100) + (this.env  / 120));
      this.sustainLevel = this.frequencyFromCutoff((patch.cutoff / 100) + 
                                             ((this.env  / 120) * (patch.S / 100)));
      this.attackEnd = now + (patch.A / 20);

      this.filter.frequency.value = this.startLevel;
      this.filter.frequency.setValueAtTime(this.startLevel, now);
      this.filter.frequency.linearRampToValueAtTime(this.attackLevel, this.attackEnd);
      this.filter.frequency.setTargetValueAtTime(this.sustainLevel, this.attackEnd, patch.D / 100);
    },
    frequencyFromCutoff : function(cutoff) {
      var ny = 0.5 * Synthy.context.sampleRate;
      var freq = Math.pow(2, (9 * cutoff) - 1) * this.freq;
      if (freq > ny) {
        freq = ny;
      }
      return freq;
    },
    release : function() {
      var now = Synthy.context.currentTime;
      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
      this.filter.frequency.linearRampToValueAtTime(this.startLevel, now + (this.patch.R / 100));
    }
  };

  return Synthy;

}(Synthy || {}));var Synthy = (function(Synthy) {

  Synthy.Master = function(patch) {
    this.output = Synthy.context.createGainNode();
    this.input = this.output;

    this.output.gain.value = patch.output;
  };

  Synthy.Master.prototype = {};

  return Synthy;

}(Synthy || {}));var Synthy = (function() {

  Synthy.Voice = function(baseFreq) {
    var patch = Synthy.patch;
    this.osc = [];

    this.envelope = new Synthy.Envelope(patch.volumeEnv);
    this.filter = new Synthy.Filter(patch.filter[0], baseFreq);
    for (var i = 0, _len = patch.osc.length; i < _len; i++) {
      this.osc.push(new Synthy.Osc(patch.osc[i], baseFreq));
      this.osc[i].output.connect(this.filter.input);
    }

    this.filter.output.connect(this.envelope.input);
    this.output = this.envelope.output;
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
      this.envelope.release();
      this.filter.release();
      for (var i = 0, _len = this.osc.length; i < _len; i++) {
        this.osc[i].release(this.envelope.getReleaseTime());
      }
    }
  };

  return Synthy;

}(Synthy || {}));var Synthy = (function() {
  
  Synthy.Patch = function(options) {
    var s = Synthy;

    this.osc = [];

    for (var i = 0; i < s.oscCount; i++) {
      this.osc.push({
        "mod" : {
          "rate" : 10,
          "mix" : 0
        },
        "freq" : 440,
        "detune" : 0,
        "mix" : 1,
        "type" : 1
      });
    }

    this.filter = [{
      "cutoff" : 100,
      "q" : 5,
      "mod" : 10,
      "type" : 0,
      "env" : 67,
      "A" : 0,
      "D" : 0,
      "S" : 5,
      "R" : 5
    }];

    this.volumeEnv = {
      "A" : 0,
      "D" : 0,
      "S" : 100,
      "R" : 0
    };

    this.master = {
      "drive" : 0,
      "output" : 1
    };
  };

  Synthy.Patch.prototype = {
    save : function() {

    },
    setOscProperty : function(osc, prop, value) {
      this.osc[osc][prop] = value;
    },
    setFilterProperty : function(prop, value) {
      this.filter[prop] = value;
    },
    setVolumeEnvelope : function(A, D, S, R) {
      this.volumeEnv.A = A;
      this.volumeEnv.D = D;
      this.volumeEnv.S = S;
      this.volumeEnv.R = R;
    },
    setMaster : function(prop, value) {
      this.master[prop] = value;
    }
  };

  return Synthy;

}(Synthy || {}));