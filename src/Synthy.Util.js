var Synthy = (function(Synthy) {

	Synthy.Util = {
		noteToFreq : function(note) {
			return 440 * Math.pow(2, (note - 69) / 12);
		}
	};

	return Synthy;

}(Synthy || {}));