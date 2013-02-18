var Synthy = (function(Synthy) {

  Synthy.Emitter = function() {};

  Synthy.Emitter.prototype = {
    on : function(event, listener, context) {
      var events = event.split(" ");
      this.__events = this.__events || {};
      for (var i = 0, _len = events.length; i < _len; i++) {
        this.__events[events[i]] = this.__events[events[i]] || [];
        this.__events[events[i]].push(context ? listener.bind(context) : listener);
      }
    },
    off : function(event, listener) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      if (listener) {
        this.__events[event].splice(this.__events[event].indexOf(listener), 1);
      } else {
        delete this.__events[event];
      }
    }, 
    emit : function(event) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      for (var i = 0, _len = this.__events[event].length; i < _len; i++) {
        this.__events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  Synthy.Emitter.register = function(obj) {
    for (var key in Synthy.Emitter.prototype) {
      if (Synthy.Emitter.prototype.hasOwnProperty(key)) {
        obj.prototype[key] = Synthy.Emitter.prototype[key];
      }
    }
  };

  return Synthy;

}(Synthy || {}));