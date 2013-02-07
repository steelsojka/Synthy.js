var Synthy = (function(Synthy) {
  
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

}(Synthy || {}));