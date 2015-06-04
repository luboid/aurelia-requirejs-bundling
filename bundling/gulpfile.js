'use strict';

var gulp = require('gulp'),
	extend = require('extend'),
	config = {
	  baseUrl: './unzip/',
	  out: './aurelia-bundle',
	  paths: {
		'aurelia-bootstrapper': 'bootstrapper/dist/amd/index',
		'aurelia-loader-default': 'loader-default/dist/amd/index',
		'aurelia-path': 'path/dist/amd/index',
		'aurelia-task-queue': 'task-queue/dist/amd/index',
		'aurelia-logging': 'logging/dist/amd/index',
		'aurelia-logging-console': 'logging-console/dist/amd/index',
		'aurelia-history': 'history/dist/amd/index',
		'aurelia-history-browser': 'history-browser/dist/amd/index',
		'aurelia-event-aggregator': 'event-aggregator/dist/amd/index',
		'aurelia-html-template-element': 'html-template-element/dist/HTMLTemplateElement',
		'core-js': 'empty:'
	  },

	  include: [
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
		  'aurelia-validation'
	  ],
	  
	  packages : [
		{
		  name: 'aurelia-loader',
		  location: 'loader/dist/amd',
		  main : 'index'
		},
	   {
		 name: 'aurelia-framework',
		 location: 'framework/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-metadata',
		 location: 'metadata/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-binding',
		 location: 'binding/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-templating',
		 location: 'templating/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-dependency-injection',
		 location: 'dependency-injection/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-router',
		 location: 'router/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-templating-binding',
		 location: 'templating-binding/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-templating-resources',
		 location: 'templating-resources/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-templating-router',
		 location: 'templating-router/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-route-recognizer',
		 location: 'route-recognizer/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-http-client',
		 location: 'http-client/dist/amd',
		 main : 'index'
	   },
	   {
		 name: 'aurelia-validation',
		 location: 'validation/dist/amd',
		 main : 'index'
	   }
	   ],
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
	
gulp.task('build', function () { build(); } );
gulp.task('build-min', function() {	build_min('.min.js'); });
gulp.task('build-latest', function () { build('-latest.js', './unzip-master/'); } );
gulp.task('build-latest-min', function() {	build_min('-latest.min.js', './unzip-master/'); });

gulp.task('default', ['build', 'build-min', 'build-latest', 'build-latest-min']);
