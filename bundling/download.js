'use strict';

var host = 'github.com',
    apiHost = 'api.github.com',
    apiVersion = 'application/vnd.github.v3+json',
    apiUserAgent = 'Gulp automatition task',
    owner = 'aurelia',
    protocol = 'https';

module.exports = function download(options) {
    var async = require("async"),
        unzip = require("unzip"),
        fs = require("fs"),
        path = require('path'),
        Promise = require('promise'),
        endOfLine = require('os').EOL,
        ps = require("event-stream").pause(),
        request = require("request"),
        headers = {
            'Accept': apiVersion
            , 'User-Agent': apiUserAgent
            , 'Authorization': options.authToken ? 'token ' + options.authToken : undefined
        };

    function ensureDirectories(dirs) {
        console.info('clear/create directories structure ...');
        // https://github.com/smhanov/node-promise-sequence	
		/**
		 * NOTE: 
		 * 
		 * If there are no error, callback will only be called once.
		 * 
		 * If there are multiple errors, callback will be called 
		 * exactly as many time as errors occur. 
		 * 
		 * Sometimes, this behavior maybe useful, but users 
		 * should be aware of this and handle errors in callback. 
		 * 
		 */
        function rmfile(dir, file, callback) {
            var p = path.join(dir, file)
            fs.lstat(p, function (err, stat) {
                if (err) callback.call(null, err)
                else if (stat.isDirectory()) rmdir(p, callback)
                else fs.unlink(p, callback)
            })
        }

        function rmdir(dir, callback) {
            fs.readdir(dir, function (err, files) {
                if (err) callback.call(null, err)
                else if (files.length) {
                    var i, j;
                    for (i = j = files.length; i--;) {
                        rmfile(dir, files[i], function (err) {
                            if (err) callback.call(null, err)
                            else if (--j === 0) fs.rmdir(dir, callback)
                        })
                    }
                }
                else fs.rmdir(dir, callback)
            })
        }

        function __dir(dir) {
            return new Promise(function (resolve, reject) {
                console.log(dir);
                rmdir(dir, function (e, result) {
                    if (e && e.code != 'ENOENT') {
                        reject(e);
                    }
                    else {
                        fs.mkdir(dir, function (e, result) {
                            if (e) {
                                reject(e);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                });
            });
        }

        for (var i in dirs) {
            dirs[i] = __dir(dirs[i]);
        }

        return Promise.all(dirs);
    }

    function extract_version(repo, body) {
        var tag, version, betaVersion, alphaVersion;
        for (var i = 0, l = body.length; i < l; i++) {
            tag = body[i];
            if (tag.name.indexOf('alpha') > -1) {
                if (!alphaVersion) {
                    alphaVersion = tag.name;
                }
            }
            else {
                if (tag.name.indexOf('beta') > -1) {
                    if (!betaVersion) {
                        betaVersion = tag.name;
                    }
                }
                else {
                    version = tag.name;
                    break;
                }
            }
        }

        return {
            name: repo
            , current: version
            , beta: betaVersion
            , alpha: alphaVersion
        };
    }

    function detect_repo_versions(repos, callback) {
        console.info('detect repos versions ... ');

        var repo;
        var versions = { master: true, current: false, beta: false, alpha: false };
        for (var i in repos) {
            repo = repos[i];
            if (repo.current) {
                versions.current = true;
            }
            if (repo.beta) {
                versions.beta = true;
            }
            if (repo.alpha) {
                versions.alpha = true;
            }
            if (versions.current && versions.beta && versions.alpha) {
                break;
            }
        }


        if (versions.beta) {
            console.info('exists beta version ...');
        }
        if (versions.alpha) {
            console.info('exists alpha version ...');
        }

        var directories = [];
        for (var i in versions) {
            if (versions[i]) {
                directories.push(options.directory + '/' + i);
                directories.push(options.directory + '/zips-' + i);
            }
        }

        ensureDirectories(directories).then(function () {
            console.info('ok');
            callback(null, versions);
        }, function (e) {
            callback(e);
        });
    }

    function get_repo_release(repo, callback) {
        console.info('request version for ' + repo + ' ...');

        var url = {
            method: 'GET'
            , uri: protocol + '://' + apiHost + '/repos/' + owner + '/' + repo + '/tags'
            , json: true
            , headers: headers
        };

        request.get(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var versionInfo = extract_version(repo, body);
                var info = versionInfo.current || 'master';
                if (versionInfo.alpha) {
                    info += ', ' + versionInfo.alpha;
                }
                if (versionInfo.beta) {
                    info += ', ' + versionInfo.beta;
                }
                console.info(info || 'none');
                callback(null, versionInfo);
            }
            else {
                callback(error || ('Request for [' + url + '] ended with status code: ' + response.statusCode + '.'));
            }
        });
    }

    function download_repo_release(info, callback) {
        var zipball = info.repo[info.option] || 'master';

        console.info('downloading ... ' + info.repo.name + ' (' + zipball + ')');

        var dest = options.directory + '/zips-' + info.option + '/' + info.repo.name + '.zip';
        var file = fs.createWriteStream(dest);

        file.on('finish', function () {
            file.close(function () {
                console.info('ok');
                callback(null, info);
            }); // close() is async, call callback after close completes.
        });

        file.on('error', function (e) {
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            callback(e, null);
        });

        var requestInfo = {
            method: 'GET'
            , uri: protocol + '://' + apiHost + '/repos/' + owner + '/' + info.repo.name + '/zipball/' + zipball
            , headers: headers
        };

        request(requestInfo).pipe(file);
    }

    function unzip_repo(item, callback) {
        console.info('unziping ... ' + item.path);
        fs.createReadStream(item.path)
            .pipe(unzip.Extract({ path: options.directory + '/' + item.option + '/' }))
            .on('close', function () {
                console.info('ok');
                callback(null, path);
            })
            .on('error', callback);
    }

    function renameDirectories(location) {
        var dirs = fs.readdirSync(location), dir;
        for (var i in dirs) {
            dir = dirs[i];
            dir = dir.substr(0, dir.lastIndexOf('-'));
            if (dir) {
                fs.renameSync(location + '/' + dirs[i], location + '/' + dir);
            }
        }
    }

    function queueRequestForVersions() {
        var buffer = [];
        for (var i in options.repos) {
            buffer.push(get_repo_release.bind(null, options.repos[i]));
        }

        async.series(buffer, function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                queueDetectVersions(result);
            }
        });
    }

    function queueDetectVersions(repos) {
        var buffer = [detect_repo_versions.bind(null, repos)];
        async.series(buffer, function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                queueDownloadFiles(repos, result);
            }
        });
    }

    function queueDownloadFiles(repos, versions) {
        var buffer = [];
        for (var i in repos) {
            buffer.push(download_repo_release.bind(null, { repo: repos[i], option: 'master' }));
            if (repos[i].current) {
                buffer.push(download_repo_release.bind(null, { repo: repos[i], option: 'current' }));
            }
            if (repos[i].beta) {
                buffer.push(download_repo_release.bind(null, { repo: repos[i], option: 'beta' }));
            }
            if (repos[i].alpha) {
                buffer.push(download_repo_release.bind(null, { repo: repos[i], option: 'alpha' }));
            }
        }

        async.series(buffer, function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                queueMisingParts(repos, versions[0], result);
            }
        });
    }

    function copyFile(source, target, cb) {
        var cbCalled = false;

        var rd = fs.createReadStream(source);
        rd.on("error", done);

        var wr = fs.createWriteStream(target);
        wr.on("error", done);
        wr.on("close", function (ex) {
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                cb(err);
                cbCalled = true;
            }
        }
    }

    function queueMisingParts(repos, versions, downloads) {
        var buffer = [];
        try
        {
            var repo, directory, directoryTo;
            for (var i in repos) {
                directory = null;
                directoryTo = null;
                repo = repos[i];
                if (versions.current && !repo.current) {
                    directoryTo = 'current';
                    if (repo.beta) {
                        directory = 'beta';
                        repo.current = repo.beta;
                    }
                    else {
                        if (repo.alpha) {
                            directory = 'alpha';
                            repo.current = repo.alpha;
                        }
                        else {
                            directory = 'master';
                            repo.current = 'master';
                        }
                    }
                }
                if (versions.alpha && !repo.alpha) {
                    directoryTo = 'alpha';
                    if (repo.beta) {
                        directory = 'beta';
                        repo.alpha = repo.beta;
                    }
                    else {
                        if (repo.current) {
                            directory = 'current';
                            repo.alpha = repo.current;
                        }
                        else {
                            directory = 'master';
                            repo.alpha = 'master';
                        }
                    }
                }
                if (versions.beta && !repo.beta) {
                    directoryTo = 'beta';
                    if (repo.alpha) {
                        directory = 'alpha';
                        repo.beta = repo.alpha;
                    }
                    else {
                        if (repo.current) {
                            directory = 'current';
                            repo.beta = repo.current;
                        }
                        else {
                            directory = 'master';
                            repo.beta = 'master';
                        }
                    }
                }

                if (directoryTo && directory) {
                    buffer.push(copyFile.bind(null,
                        options.directory + '/zips-' + directory + '/' + repo.name + '.zip',
                        options.directory + '/zips-' + directoryTo + '/' + repo.name + '.zip'));
                }
            }
        }
        catch(e)
        {
            ps.emit('error', e);
        }
        
        async.series(buffer, function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                queueUnZip(repos, versions);
            }
        });
    }

    function queueUnZip(repos, versions) {
        var buffer = [], path;
        try {
            for (var i in versions) {
                if (versions[i]) {
                    path = options.directory + '/zips-' + i;
                    fs.readdirSync(path)
                        .forEach(function (value, index, array) {
                            buffer.push(unzip_repo.bind(null, { option: i, path: path + '/' + value }));
                        });
                }
            }
        }
        catch (e) {
            ps.emit('error', e);
            return;
        }

        async.series(buffer, function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                queueWriteVersions(repos, versions);
            }
        });
    }

    function queueWriteVersions(repos, versions) {
        async.series([function (callback) {
            console.info('rename directories & save versions ...')

            // rename - remove unique part from directory name
            for (var i in versions) {
                if (versions[i]) {
                    renameDirectories(options.directory + '/' + i);
                }
            }

            // make version header files            
            var items = {}, item, dte = new Date();
            for (var i in versions) {
                if (versions[i]) {
                    item = items[i] = [];
                    item.push("/**");
                    item.push(" * Aurelia`s modules version at " + dte);
                }
            }

            repos.forEach(function (repo) {
                for (var i in versions) {
                    if (versions[i]) {
                        items[i].push(" * " + repo.name + '@' + (repo[i] || i));
                    }
                }
            });

            for (var i in versions) {
                if (versions[i]) {
                    items[i].push(" */"); items[i].push(""); items[i].push(""); items[i].push("");
                    fs.appendFileSync(options.directory + '/' + i + '/versions.txt', items[i].join(endOfLine));
                }
            }

            versions.repos = repos; 

            fs.appendFileSync(options.directory + '/versions.json', JSON.stringify(versions, null, 2));

            callback();
        }], function (error, result) {
            if (error) {
                ps.emit('error', error);
            }
            else {
                console.info('done.');
                ps.emit('end');
            }
        });
    }

    ensureDirectories([options.directory]).then(function () {
        queueRequestForVersions();
    }, function (e) {
        ps.emit('error', e);
    })   

    return ps;
}