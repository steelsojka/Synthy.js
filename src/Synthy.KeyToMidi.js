var Synthy = (function(Synthy) {

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