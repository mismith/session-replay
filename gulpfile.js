// localized config
var srcPath   = 'src/',
	destPath  = 'build/',
	overrides = {
/*
		browsersync: {
			proxy: 'example.dev',
		},
*/
	};


// includes
var gulp        = require('gulp'),
	_           = require('lodash'),
	argv        = require('yargs').argv,
	gutil       = require('gulp-util'),
	rename      = require('gulp-rename'),
	browserSync = require('browser-sync');


// config
var config = _.merge({
	// paths
	srcs: {
		files: [
			srcPath + '**/*.*',
			'!' + srcPath + '**/*.{DS_Store,gitkeep}',
			'!' + srcPath + 'assets/{scripts,styles,images,icons}/**/*', // ignore special folders
		],
		scripts: [
			srcPath + 'assets/scripts/*/**/*.js', // subfolders first
			srcPath + 'assets/scripts/**/*.js',
		],
		styles: [
			srcPath + 'assets/styles/**/*.{css,scss}',
		],
		images: [
			srcPath + 'assets/images/**/*.{png,jpeg,jpg,gif,svg}',
		],
		icons: [
			srcPath + 'assets/icons/**/*.svg',
		],
	},
	dests: {
		files:   destPath,
		scripts: destPath + 'assets/js',
		styles:  destPath + 'assets/css',
		images:  destPath + 'assets/img',
		icons:   destPath + 'assets',
	},

	// plugins
	babel: {
		presets: ['es2015'],
	},
	imagemin: {
		progressive: true,
		interlaced: true,
		multipass: true,
	},
	svgSprite: {
		mode: {
			symbol: {
				dest: '.',
				sprite: 'icons.svg',
			},
		},
	},
	autoprefixer: {
		browsers: ['last 2 versions'],
	},
	browsersync: {
		ui: false,
		notify: false,
		reloadDebounce: 400,
		watchOptions: {debounce: 400},
		server: {
			baseDir: './' + destPath,
		},
	},
}, overrides);


// tasks
gulp
	// build
	.task('files', function () {
		return gulp.src(config.srcs.files)
			// .pipe(require('gulp-rev-append')()) // @TODO: not working
			.pipe(gulp.dest(config.dests.files))

			.pipe(browserSync.reload({stream: true}));
	})
	.task('scripts', function () {
		return gulp.src(config.srcs.scripts)
			.pipe(require('gulp-babel')(config.babel)).on('error', handleError)
			.pipe(require('gulp-ng-annotate')(config.ngAnnotate)).on('error', handleError)
			.pipe(require('gulp-concat')('main.js'))
			.pipe(gulp.dest(config.dests.scripts))

			.pipe(rename({suffix: '.min'}))
			.pipe(require('gulp-uglify')(config.uglify)).on('error', handleError)
			.pipe(gulp.dest(config.dests.scripts))

			.pipe(browserSync.reload({stream: true}));
	})
	.task('styles', function () {
		var postcss = require('gulp-postcss');
		return gulp.src(config.srcs.styles)
			.pipe(require('gulp-sass')(config.sass)).on('error', handleError)
			.pipe(postcss([
				require('autoprefixer')(config.autoprefixer)
			])).on('error', handleError)
			.pipe(gulp.dest(config.dests.styles))

			.pipe(rename({suffix: '.min'}))
			.pipe(postcss([
				require('cssnano')(config.cssnano)
			])).on('error', handleError)
			.pipe(gulp.dest(config.dests.styles))

			.pipe(browserSync.reload({stream: true}));
	})
	.task('images', function () {
		return gulp.src(config.srcs.images)
			.pipe(require('gulp-imagemin')(config.imagemin)).on('error', handleError)

			.pipe(gulp.dest(config.dests.images))

			.pipe(browserSync.reload({stream: true}));
	})
	.task('icons', function () {
		return gulp.src(config.srcs.icons)
			.pipe(require('gulp-svg-sprite')(config.svgSprite)).on('error', handleError)

			.pipe(gulp.dest(config.dests.icons))

			.pipe(browserSync.reload({stream: true}));
	})
	.task('build', ['files', 'scripts', 'styles', 'images', 'icons'])

	// watch
	.task('files.watch', ['files'], function () {
		return gulp.watch(config.srcs.files, ['files']);
	})
	.task('scripts.watch', ['scripts'], function () {
		return gulp.watch(config.srcs.scripts, ['scripts']);
	})
	.task('styles.watch', ['styles'], function () {
		return gulp.watch(config.srcs.styles, ['styles']);
	})
	.task('images.watch', ['images'], function () {
		return gulp.watch(config.srcs.images, ['images']);
	})
	.task('icons.watch', ['icons'], function () {
		return gulp.watch(config.srcs.icons, ['icons']);
	})
	.task('watch', ['files.watch', 'scripts.watch', 'styles.watch', 'images.watch', 'icons.watch'], function () {
		var options = _.merge(config.browsersync || {}, {
			// call `gulp -g` or `gulp --ghost` to start in ghostMode
			ghostMode: !! (argv.g || gutil.env.ghost),

			// call `gulp -s` or `gulp --silent` to start gulp without opening a new browser window
			open: ! (argv.s || gutil.env.silent),
		});
		if (options.proxy) {
			// prefer proxy to server
			options.server = undefined;
		} else if (options.server) {
			// direct all requests to index.html
			// (since we're launching a node server, .htaccess files won't work)
			options.server.middleware = options.server.middleware || [];
			options.server.middleware.push(require('connect-history-api-fallback')());
		}
		browserSync.init(options);
	})


	// default
	.task('default', ['watch']);


// error handling
function handleError(error, type){
	//console.log(error);

	// remove any leading error marker
	error.message = error.message.replace(/^error:\s*/i, '');

	// shorten fileName
	var fileName = error.fileName ? error.fileName.replace(__dirname, '') : '';

	// show an OS-level notification to make sure we catch our attention
	// (do this before we format things since it can't handle the formatting)
	require('node-notifier').notify({
		title: 'ERROR(' + error.plugin + ')',
		subtitle: fileName,
		message: error.message,
		sound: 'Basso',
		activate: 'com.apple.Terminal',
	});

	// colour the problematic line for higher visibility
	if(error.extract){
		var middleIndex = Math.floor(error.extract.length / 2);
		error.extract[middleIndex] = gutil.colors.red(error.extract[middleIndex]);
	}
	// append highlighted fileName to message, if not already there
	if(fileName){
		if(error.message.indexOf(error.fileName) >= 0){
			error.message = error.message.replace(error.fileName, gutil.colors.magenta(fileName));
		}else{
			error.message += ' in ' + gutil.colors.magenta(fileName);
		}
	}
	// process line numbers
	var line = error.lineNumber || error.line;

	// output the formatted error
	gutil.log(
		// error and plugin
		gutil.colors.red('ERROR(' + error.plugin + '): ') +

		// message
		error.message +

		// offending line number and column
		(line ? ' [' + gutil.colors.cyan(line) + ':' + gutil.colors.cyan(error.column) + ']' : '') +

		// preview the offending code
		(error.extract ? '\n\n\t' + error.extract.join('\n\t') : '') +

		// finish with a new line
		'\n'
	);

	// prevent this error from breaking/stopping watchers
	this.emit('end');
};
