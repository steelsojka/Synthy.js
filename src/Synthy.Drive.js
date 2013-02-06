var Synthy = (function(Synthy) {

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

}(Synthy || {}));