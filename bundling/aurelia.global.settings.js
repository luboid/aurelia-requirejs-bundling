var require = {
    baseUrl: './',
    waitSeconds: 60, //enforceDefine: true, urlArgs: "bust=" + (new Date()).getTime(),
    deps: ['aurelia-bootstrapper'],
    paths: {
        aurelia: '/scripts/aurelia',
        webcomponentsjs: '/scripts/webcomponentsjs',
        corejs: '/scripts/core-js'
    },
    bundles: {
        'aurelia/aurelia-bundle': ['aurelia-bootstrapper', 'aurelia-loader-default']
    },
    shim: {
        'aurelia-bootstrapper': {
            deps: ['core-js', 'aurelia-loader-default']
        }
    },
    map: {
        '*': {
            'core-js': 'corejs/core',
			'text': '/scripts/requirejs/text'
        }
    },
    config: {
        '/scripts/requirejs/text': {
            onXhr: function (xhr, url) {
                //Called after the XHR has been created and after the
                //xhr.open() call, but before the xhr.send() call.
                //Useful time to set headers.
                //xhr: the xhr object
                //url: the url that is being used with the xhr object.
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            }
        }
    }
};