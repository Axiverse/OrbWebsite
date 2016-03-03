//import path from "path";
var path = require("path");
var gulp = require("gulp");
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var gutil = require("gulp-util");
var webpack = require("webpack");

var WebpackDevServer = require('webpack-dev-server');

var webpackConfig = 
{
    entry: {
      preload: path.join(__dirname, "target", "main.js"), // './target/main.js'
    },
    devtool: "source-map",
    output: {
        path: path.join(__dirname, "build"),
        publicPath: '../build/',
        filename: '[name].orb.js',
        chunkFilename: '[id].orb.js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: "babel-loader",
            include: [
                path.join(__dirname, "source"),
            ],
            exclude: /(node_modules|bower_components)/,
            query: {
                presets: ['es2015']
            }
        }],
    },
};

function buildJs (options, callback) {
    var plugins = options.minify ? [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },

            output: {
                comments: false,
                semicolons: true,
            },
        }),
    ] : [];

    var myConfig = Object.create(webpackConfig);
    myConfig.plugins = plugins;
    myConfig.bail = !options.watch;
    myConfig.watch = options.watch;

    webpack(myConfig,
        function (error, stats) {
            if ( error ) {
                var pluginError = new gutil.PluginError("webpack", error);

                if ( callback ) {
                    callback(pluginError);
                } else {
                    gutil.log("[webpack]", pluginError);
                }

                return;
            }

            gutil.log("[webpack]", stats.toString());
            if (callback) { callback(); }
        });
}

gulp.task("js:es6", function (callback) {
    buildJs({ watch: false, minify: false }, callback);
});

gulp.task("js:es6:minify", function (callback) {
    buildJs({ watch: false, minify: true }, callback);
});

/*
gulp.task("watch", function () {
    buildJs({ watch: true, minify: false });
});
*/

gulp.task('test', ['js:es6'], function () {
  return gulp.src('test/*.js')
    .pipe(mocha())
    .on('error', function () {
      gulp.emit('end');
    });
});

gulp.task('watch', function () {
  return gulp.watch(['source/**', 'test/**'], ['js:es6']);
});

gulp.task('server', ['js:es6'], function(callback) {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    myConfig.devtool = 'eval';
    myConfig.debug = true;

    // Start a webpack-dev-server
    new WebpackDevServer(webpack(myConfig), {
        publicPath: '/' + myConfig.output.publicPath,
        stats: {
            colors: true
        },
        hot: true
    }).listen(8080, 'localhost', function(err) {
        if(err) throw new gutil.PluginError('webpack-dev-server', err);
        gutil.log('[webpack-dev-server]', 'http://localhost:8080/public/index.html');
    });
});
