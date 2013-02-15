var fs = require('fs');
var exec = require('child_process').exec;
var wrench = require('wrench');

var version = "0.1.1";
var CLOSURE_PATH = "build/compiler.jar";
var jsFiles = ["Synthy.Core.js",
               "Synthy.Util.js",
               "Synthy.Osc.js",
               "Synthy.Envelope.js",
               "Synthy.Filter.js",
               "Synthy.Master.js",
               "Synthy.Voice.js",
               "Synthy.Patch.js",
               "Synthy.Drive.js",
               "Synthy.Delay.js",
               "Synthy.KeyToMidi.js"
              ];

var header = ["/**", 
              " * @FILE_NAME@ v" + version,
              " *",
              " * A polyphonic customizable synthesizer",
              " * @author Steven Sojka - " + new Date().toLocaleDateString(),
              " *",
              " * MIT Licensed",
              " */",
              ""].join("\n");

var minify = function(file, output, callback) {
  console.log("Minifying " + file);
  var execString = ["java -jar ", CLOSURE_PATH, " --js ", file, " --js_output_file ", 
                    output].join("");

  exec(execString, callback);
};

var clean = function(callback) {
  exec("rm -rf dist", function() {
    fs.mkdir("dist",function() {
      callback();
    });
  });
};

var concat = function(files, output, callback) {
  var _files = files.map(function(a) { return "src/" + a; });
  console.log("Concatenating " + files.join(", "));

  exec("cat " + _files.join(" ") + " > " + output, callback);
};

var prependHeader = function(file, callback) {
  var _file = file.replace(/.*\//, "");
  var _header = header.replace("@FILE_NAME@", _file);
  fs.readFile(file, 'utf8', function(err, data) {

    fs.writeFile(file, _header + stripLogs(data), callback);
  });
};

var stripLogs = function(data) {
  return data.replace(/console\.(.*)\((.*)\);|console\.(.*)\((.*)\)/ig, "");
};

var singleFileCallback = function(i) {
  if (i < 0) return;
  var minFile = jsFiles[i].replace(".js", ".min.js");

  minify("src/" + jsFiles[i], "dist/" + minFile, function() {
    prependHeader("dist/" + minFile, function() {
      singleFileCallback(--i);
    });
  });  
};

clean(function() {

  concat(jsFiles, "dist/Synthy.js", function() {
    minify("dist/Synthy.js", "dist/Synthy.min.js", function() {
      prependHeader("dist/Synthy.min.js", function() {
        var i = jsFiles.length - 1;
        singleFileCallback(i);
      });
      prependHeader("dist/Synthy.js", function() {

      });
      wrench.copyDirSyncRecursive('src/patches', 'dist/patches');
    });
  });


});



