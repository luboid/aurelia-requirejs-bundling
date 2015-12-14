'use strict';
var gulp = require('gulp'),
	extend = require('extend'),
	flatten = require('gulp-flatten'),
	dtsRef = require('./create-dts-ref'),
	path = require('path'),
	fs = require('fs');

var include = [
		  "aurelia-pal",
		  "aurelia-pal-browser",
		  'aurelia-path',
		  'aurelia-loader',
		  'aurelia-loader-default',
		  'aurelia-task-queue',
		  'aurelia-logging',
		  'aurelia-logging-console',
		  'aurelia-history',
		  'aurelia-history-browser',
		  'aurelia-event-aggregator',
		  'aurelia-framework',
		  'aurelia-metadata',
		  'aurelia-binding',
		  'aurelia-templating',
		  'aurelia-dependency-injection',
		  'aurelia-router',
		  'aurelia-templating-binding',
		  'aurelia-templating-resources',
		  'aurelia-templating-router',
		  'aurelia-route-recognizer',
		  'aurelia-http-client',
		  'aurelia-bootstrapper',
		  'aurelia-html-template-element',
		  'aurelia-validation',
		  'aurelia-i18n'
		  //,'aurelia-templating-validation'
	  ];
var packages = [{
		name: 'aurelia-i18n',
		location: 'i18n/dist/amd',
		main : 'aurelia-i18n.js'
	},{
		name: 'aurelia-templating-resources',
		location: 'templating-resources/dist/amd',
		main : 'aurelia-templating-resources'
	},
	{
		name: 'aurelia-templating-router',
		location: 'templating-router/dist/amd',
		main : 'aurelia-templating-router'
	},
	{
		name: 'aurelia-validation',
		location: 'validation/dist/amd',
		main : 'index'
	}];

function isPackage(name) {
	for(var i in packages) {
		if (packages[i].name === name) {
			return true;
		}
	}
	return false;
}

var paths = {
	'aurelia-html-template-element': 'html-template-element/dist/HTMLTemplateElement',
	'core-js': 'empty:',
	'i18next': 'empty:'
};

for(var i in include) {
	var moduleName = include[i];
	if (!paths[moduleName] && !isPackage(moduleName)) {
		paths[moduleName] = moduleName.substr(moduleName.indexOf('-')+1) + '/dist/amd/' + moduleName;
	}
}

var config = {
	  baseUrl: './unzip/',
	  out: './aurelia-bundle',
	  paths: paths,
	  include: include,
	  packages: packages,

		wrap: {
			startFile: ["versions.txt"],
			endFile: []
		}
	};

function fixConfig(ext, baseUrl) {
	if (ext===undefined) ext = '.js';
	if (baseUrl===undefined) baseUrl = './unzip/';

	var cfg = extend(true, {}, config);

	cfg.baseUrl = baseUrl;
	cfg.out = cfg.out + ext;
	cfg.wrap.startFile = baseUrl + config.wrap.startFile;

	return cfg;
}

function build(ext, baseUrl) {
	var rjs = require('gulp-requirejs'),
		cfg = fixConfig(ext, baseUrl);

	rjs(cfg)
		.pipe(gulp.dest('./')); // pipe it to the output DIR
}

function build_min(ext, baseUrl) {
	var rjs = require('gulp-requirejs'),
		uglify = require('gulp-uglify'),
		sourcemaps = require('gulp-sourcemaps'),
		cfg = fixConfig(ext, baseUrl);

	rjs(cfg)
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(sourcemaps.write('./', {includeContent:false}))
		.pipe(gulp.dest('./')); // pipe it to the output DIR
}
function copydts(folder, dest) {
	dest = dest || './typings';

	return gulp.src(['./' + folder + '/**/dist/amd/*.d.ts'])
		.pipe(flatten())
		.pipe(gulp.dest(dest));
}
function createReferencesFile(folder) {
	folder = path.join(folder + '/');
	var refFileName = '_references.d.ts';
	gulp.src([folder + '/*.d.ts', '!' + path.join(folder, refFileName)])
		.pipe(dtsRef(refFileName))
		.pipe(gulp.dest(folder));
}

gulp.task('build', function () { build(); } );
gulp.task('build-min', function() {	build_min('.min.js'); });
gulp.task('build-latest', function () { build('-latest.js', './unzip-master/'); } );
gulp.task('build-latest-min', function() {	build_min('-latest.min.js', './unzip-master/'); });
gulp.task('copy-dts', function () { return copydts('./unzip/'); })
gulp.task('copy-dts-latest', function () { return copydts('./unzip-master/', './typings-latest'); })

gulp.task('create-ref-dts', ['copy-dts'], function () {
	createReferencesFile('./typings');
});
gulp.task('create-ref-dts-latest', ['copy-dts-latest'], function () {
	createReferencesFile('./typings-latest');
});
gulp.task('download', function() {
	return require('./download')({
		zips: './zips',
		zipsMaster: './zips-master',
		unZip: './unzip',
		unZipMaster: './unzip-master',
		repos: [
			"binding",
			"validation",
			// "templating-validation",
			"bootstrapper",
			"dependency-injection",
			"event-aggregator",
			"framework",
			"history",
			"history-browser",
			"html-template-element",
			"http-client",
			"loader",
			"loader-default",
			"logging",
			"logging-console",
			"metadata",
			"path",
			"route-recognizer",
			"router",
			"task-queue",
			"templating",
			"templating-binding",
			"templating-resources",
			"templating-router",
			"pal",
			"pal-browser",
			'i18n'
		]
	});
});
gulp.task('dts', ['create-ref-dts', 'create-ref-dts-latest']);
gulp.task('default', ['build', 'build-min', 'build-latest', 'build-latest-min']);
