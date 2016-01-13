'use strict';
var dist = './dist',
    gulp = require('gulp'),
    extend = require('extend'),
    concat = require('gulp-concat'),
    path = require('path'),
    fs = require('fs');

var repos = [
    { name: "binding" },
    //{ name: "validation", package: "index" },
    { name: "bootstrapper" },
    { name: "dependency-injection" },
    { name: "event-aggregator" },
    { name: "framework" },
    { name: "history" },
    { name: "history-browser" },
    { name: "html-template-element" },
    { name: "http-client" },
    { name: "loader" },
    { name: "loader-default" },
    { name: "logging" },
    { name: "logging-console" },
    { name: "metadata" },
    { name: "path" },
    { name: "route-recognizer" },
    { name: "router" },
    { name: "task-queue" },
    { name: "templating" },
    { name: "templating-binding" },
    { name: "templating-resources", package: true },
    { name: "templating-router", package: true },
    { name: "pal" },
    { name: "pal-browser" },
    { name: "i18n", package: true }
   	//{name:// "templating-validation"},
];

var buildTasks = [];
(function (buildTasks) {
    var versions;
    try {
        versions = require(dist + '/versions.json');
    }
    catch (e) {
        return;
    }
    
    var config = (function buildConfig() {
        var modules = repos.map(function (repo) {
            return "aurelia-" + repo.name;
        });

        var packages = repos.filter(function (repo) {
            return !!repo.package;
        }).map(function (repo) {
            return {
                name: "aurelia-" + repo.name,
                location: "aurelia-" + repo.name + "/dist/amd",
                main: typeof (repo.package) == 'boolean' ? "aurelia-" + repo.name : repo.package
            };
        });

        var paths = {
            'aurelia-html-template-element': 'aurelia-html-template-element/dist/HTMLTemplateElement',
            'core-js': 'empty:',
            'i18next': 'empty:'
        };

        repos.forEach(function (repo) {
            var name = 'aurelia-' + repo.name;
            if (!paths[name] && !repo.package) {
                paths[name] = name + '/dist/amd/' + name;
            }
        });

        return {
            baseUrl: './unzip/',
            out: 'aurelia-bundle',
            paths: paths,
            include: modules,
            packages: packages,

            wrap: {
                startFile: ["versions.txt"],
                endFile: []
            }
        };
    })();    

    var createConfig = function createConfig(version, ext) {
        var cfg = extend(true, {}, config);

        cfg.baseUrl = dist + '/' + version + '/';
        cfg.out = cfg.out + (version === 'current' ? '' : '.' + version) + ext;
        cfg.wrap.startFile = cfg.baseUrl + config.wrap.startFile;

        return cfg;
    };

    var build = function build(version) {
        var rjs = require('gulp-requirejs'),
            cfg = createConfig(version, '.js');

        rjs(cfg)
            .pipe(gulp.dest(dist)); // pipe it to the output DIR
    };

    var build_min = function build_min(version) {
        var rjs = require('gulp-requirejs'),
            uglify = require('gulp-uglify'),
            sourcemaps = require('gulp-sourcemaps'),
            cfg = createConfig(version, '.min.js');;

        rjs(cfg)
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write('./', { includeContent: false }))
            .pipe(gulp.dest(dist)); // pipe it to the output DIR
    };

    var build_dts = function build_dts(version) {
        gulp.src([dist + '/' + version + '/versions.txt', dist + '/' + version + '/**/dist/amd/*.d.ts'])
            .pipe(concat('aurelia' + (version === 'current' ? '' : '.' + version) + '.d.ts'))
            .pipe(gulp.dest(dist));
    };

    for (var i in versions) {
        if (i == 'repos') {
            continue;
        }
        if (versions[i]) {
            buildTasks.push('build-' + i);
            gulp.task('build-' + i, build.bind(null, i));
            buildTasks.push('build-' + i + '-min');
            gulp.task('build-' + i + '-min', build_min.bind(null, i));
            buildTasks.push('build-' + i + '-dts');
            gulp.task('build-' + i + '-dts', build_dts.bind(null, i));
        }
    }
})(buildTasks);

gulp.task('default', buildTasks, function () {
    if (buildTasks.length === 0) {
        throw new Error('there is no framework versions to build');
    }
});

gulp.task('download', [], function () {
    var download = require('./download');
    var downloadCfg = {
        directory: dist,
        repos: repos.map(function (repo) { return repo.name; }),
        authToken: '<<github.com user auth token>>' 
    };
    return download(downloadCfg);
});