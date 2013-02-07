Synthy.js
==============================

A customizable polyphonic sysnthesizer

Setup
-----------------------------------

Synthy is split up into modules in case you want to load them asyncronously, but most files are dependant on each other so for best results load the Synthy.min.js.

```html
<script src="Synthy.min.js"></script>
```

Usage
----------------------------------------

### Creation
An instance of the Synthy core can be created like so:

```javascript
var mySynth = Synthy.create();

// An optional options object can be passed in. In this case
// you can pass in an already created AudioContext.
// Synthy creates an AudioContext per instance if not passed in.
var mySynth = Synthy.create({
  context : myContext
});

// Multiple synths can share the same context by passing in 
// one synths context to the next

var mySynth1 = Synthy.create();
var mySynth2 = SYnthy.create({
  context : mySynth1.context
});
```

### Triggering Notes

Synthy works off MIDI notes for note triggering.

```javascript
var mySynth = Synthy.create();

mySynth.trigger(62); // MIDI note 62.  Range from 0 - 127

mySynth.trigger(62, 78); // Pass in note velocity as a second parameter. Defaults to 127.
```

Notes don't stop until the release method is called for the same MIDI note.

```javascript
mySynth.release(62); // Release note 62
```

### Setting Properties

You can modifiy every aspect of synthy except the audio routing.

```javascript
mySynth.setFilterAttack(50); // Set the filters envelope attack

mySynth.setEnvelopeSustain(100); // Set the volume envelopes sustain to 100

// Since oscialltor count is dynamic, you can set oscillator properties
// by passing in the oscillator index as your first parameter and the 
// value as the second. The array is 0 indexed.

mySynth.setOscRange(0, 1); // Set the oscillator range of the first oscillator

mySynth.setOscDetune(1, -55); // Set the oscillator detune of the second oscillator
```

You can add oscillators by calling the 'addOscillator' method.

```javascript
mySynth.addOscillator(); 

mySynth.addOscillator({ // Optional options
  range : 1,
  detune : -55
});
```

### Patches

Patches are JSON files. You can load a patch by calling the 'load' method.

```javascript
mySynth.load(myPatch);

mySynth.save(); // Returns a JSON string of the current patch.

mySynth.save(2); // Optional JSON space formating
```

### Schematic

This is the schematic for a Synthy core with 3 oscillators.


License
---------------------------
MIT Licensed
