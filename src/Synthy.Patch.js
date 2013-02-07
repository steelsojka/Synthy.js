var Synthy = (function() {

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

}(Synthy || {}));