var Synthy = (function(Synthy) {

  Synthy.Master = function(patch, context) {
    this.output = context.createGainNode();
    this.input = this.output;

    this.output.gain.value = patch.output;
  };

  Synthy.Master.prototype = {};

  return Synthy;

}(Synthy || {}));