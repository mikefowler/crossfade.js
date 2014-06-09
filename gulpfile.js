var gulp = require('gulp');
var eslint = require('gulp-eslint');
var size = require('gulp-size');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------	

var paths = {
	src: 'src/*.js',
	dist: 'dist'
};

// -----------------------------------------------------------------------------
// Assets
// -----------------------------------------------------------------------------
gulp.task('connect', function () {
	connect.server({
		port: 7300
	});
});

gulp.task('uglify', function () {
	return gulp.src(paths.src)
		.pipe(uglify({
			compress: {
				drop_console: true
			}
		}))
		.pipe(size())
		.pipe(gulp.dest(paths.dist));
});

// -----------------------------------------------------------------------------
// Testing
// -----------------------------------------------------------------------------
gulp.task('lint', function () {
	return gulp.src(paths.src)
		.pipe(eslint({
			rules: {
				'quotes': 'single',
				'no-global-strict': 0,
				'no-console': 0
			},
			env: {
				browser: true
			}
		}))
		.pipe(eslint.format());
});

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------
gulp.task('watch', function () {
	gulp.watch(paths.src, ['build']);
});

gulp.task('test', ['lint']);
gulp.task('build', ['test', 'uglify']);
gulp.task('default', ['build', 'connect', 'watch']);