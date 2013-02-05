var Synthy = (function() {
  
  Synthy.Patch = function(options) {
    var s = Synthy;

    this.osc = [];

    for (var i = 0; i < s.oscCount; i++) {
      this.osc.push({
        "mod" : {
          "rate" : 10,
          "mix" : 0.5
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