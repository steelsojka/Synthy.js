var Synthy = (function(Synthy) {

  Synthy.Master = function(patch) {
    this.output = Synthy.context.createGainNode();
    this.input = this.output;

    this.output.gain.value = patch.output;
  };

  Synthy.Master.prototype = {};

  return Synthy;

}(Synthy || {}));