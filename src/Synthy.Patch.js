var Synthy = (function() {
  
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

}(Synthy || {}));