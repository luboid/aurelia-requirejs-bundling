var through = require('through');
var File = require('vinyl');
var path = require('path')
module.exports = function(out, options) {
	out = out || '_references.d.ts';
  	options = options || {};

  	var files = [];
  	var filePaths = [];

  	var onFile = function(file) {
    	files.push(file);
    	var path
		if (options.absolute) {
	  		path = file.path;
		} else {
			path = file.path.replace(process.cwd(), '');
			path = path.replace(new RegExp('^[/\\\\]'), '');
		}
    	filePaths.push(path.replace(/\\/g, '/'));
  	};

  var onEnd = function() {
		var result = [];
		files.forEach(function (file) {
			result.push('/// <reference path="./' + path.basename(file.path) + '" />');
		});

    	var file = new File({
			path: out,
			contents: new Buffer(result.join('\n'))
    	});

    	this.emit('data', file);
    	this.emit('end');

  	};

  	return through(onFile, onEnd);
};