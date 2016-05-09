'use strict';
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    minify = require('gulp-minify-css'),
    sourcemaps = require('gulp-sourcemaps'),
    watch = require('gulp-watch');

var jsFileList = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/transition.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/button.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/carousel.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/collapse.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/modal.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/popover.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/scrollspy.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/tab.js',
    './node_modules/bootstrap-sass/assets/javascripts/bootstrap/affix.js',
    './node_modules/angular/angular.min.js',
    './node_modules/angular-resource/angular-resource.min.js',
    './node_modules/angular-ui-router/release/angular-ui-router.min.js',
    './node_modules/angular-local-storage/dist/angular-local-storage.min.js',
    './node_modules/angular-utils-pagination/dirPagination.js',
    './assets/js/config.js',
    './assets/js/angular-front-end-app.js',
    './assets/js/factories/*.js',
    './assets/js/controllers/*.js'
];

gulp.task('sass', function() {
    gulp.src('./assets/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(minify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('js', function(){
    return gulp.src(jsFileList)
        .pipe(concat({ path:'scripts.js' }))
        //.pipe(uglify())
        .pipe(gulp.dest('./build/js'));
});

gulp.task('default', ['sass', 'js'], function(){
    gulp.watch( './assets/scss/*.scss', ['sass'] );
    gulp.watch( './assets/js/**/*.js', ['js'] );
});
