var Synthy = (function(Synthy) {

	Synthy.Delay = function(patch, context) {
		this.context   = context;
		this.delay     = context.createDelay();
		this.gain      = context.createGainNode();
		this.output    = context.createGainNode();
		this.delayGain = context.createGainNode();
		this.input     = context.createGainNode();

		this.delay.connect(this.gain);
		this.gain.connect(this.delay);
		this.input.connect(this.delay);
		this.delay.connect(this.delayGain);
		this.delayGain.connect(this.output);
		this.input.connect(this.output);

		this.setFeedback(patch.feedback);
		this.setDelayTime(patch.time);
		this.setWet(patch.wet);
	};

	Synthy.Delay.prototype = {
		setFeedback : function(v) {
			this.gain.gain.value = v;
		},
		setDelayTime : function(t) {
			this.delay.delayTime.value = t;
		},
		setWet : function(w) {
			this.delayGain.gain.value = w;
		}
	};

	return Synthy;

}(Synthy || {}));