var gulp = require('gulp');
gulp.concat = require('gulp-concat');
gulp.rename = require('gulp-rename');
gulp.insert = require('gulp-insert');
gulp.umd = require('gulp-umd');
gulp.uglify = require('gulp-uglify');
var fs = require('fs');
var rimraf = require('rimraf');

/**
 * This task wraps blocks into a UMD module.
 * @example import 'blockly-solidity/blocks';
 */
gulp.task('package-blocks', function() {
  return gulp.src('blocks/*.js')
    .pipe(gulp.concat('blocks.js'))
    .pipe(gulp.insert.prepend(`var goog = goog || {
  require:function(){},provide:function(){},
  isFunction:function(f){return f && {}.toString.call(f)==='[object Function]'}};`))
    .pipe(gulp.umd({
      dependencies: function(file) {
        return [{
          name: 'Blockly',
          amd: 'blockly',
          cjs: 'blockly',
          global: 'Blockly',
          param: 'Blockly'
        }]
      },
      namespace: function(file) {
        return 'Blockly.Blocks.Solidity'
      },
      exports: function(file) {
        return null;
      }
    }))
    .pipe(gulp.uglify())
    .pipe(gulp.dest('dist'));
});

/**
 * This task wraps generator into a UMD module.
 * @example import 'blockly-solidity/solidity';
 */
gulp.task('package-solidity', function() {
  return gulp.src([
      'generators/solidity.js',
      'generators/solidity/*.js'
    ])
    .pipe(gulp.concat('solidity.js'))
    .pipe(gulp.insert.prepend(`var goog = goog || {
  require:function(){},provide:function(){},
  isFunction:function(f){return f && {}.toString.call(f)==='[object Function]'}};`))
    .pipe(gulp.umd({
      dependencies: function(file) {
        return [{
          name: 'Blockly.Solidity',
          amd: 'blockly',
          cjs: 'blockly',
          global: 'Blockly',
          param: 'Blockly'
        }]
      },
      namespace: function(file) {
        return 'Blockly.Solidity'
      },
      exports: function(file) {
        return 'Blockly.Solidity'
      }
    }))
    .pipe(gulp.uglify())
    .pipe(gulp.dest('dist'));
});

/**
 * This task wraps blocks and generator into a UMD module.
 * @example import 'blockly-solidity';
 */
gulp.task('package-index', function() {
  return gulp.src([
    'generators/solidity.js',
    'generators/solidity/*.js',
    'blocks/*.js'
  ])
  .pipe(gulp.concat('index.js'))
  .pipe(gulp.insert.prepend(`var goog = goog || {
require:function(){},provide:function(){},
isFunction:function(f){return f && {}.toString.call(f)==='[object Function]'}};`))
  .pipe(gulp.umd({
    dependencies: function(file) {
      return [{
        name: 'Blockly.Solidity',
        amd: 'blockly',
        cjs: 'blockly',
        global: 'Blockly',
        param: 'Blockly'
      }]
    },
    namespace: function(file) {
      return 'Blockly.Solidity'
    },
    exports: function(file) {
      return 'Blockly.Solidity'
    }
  }))
  .pipe(gulp.uglify())
  .pipe(gulp.dest('dist'));
});

/**
 * This task copies the package.json file into the distribution directory.
 */
gulp.task('package-json', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist'))
});

/**
 * This task copies the README.md file into the distribution directory.
 * This file is what developers will see at https://www.npmjs.com/package/blockly.
 */
gulp.task('package-readme', function() {
  return gulp.src('./README.md')
    .pipe(gulp.dest('dist'))
});

/**
 * This task copies the LICENSE file into the distribution directory.
 */
gulp.task('package-license', function() {
  return gulp.src('./LICENSE')
    .pipe(gulp.dest('dist'))
});

/**
 * This task prepares the NPM distribution files under the /dist directory.
 */
gulp.task('package', gulp.parallel(
  'package-blocks',
  'package-solidity',
  'package-index',
  'package-json',
  'package-readme',
  'package-license'
));

// The release task prepares Blockly Solidity for an npm release.
// It packages all the npm release files into the /dist directory
gulp.task('release', gulp.series([function() {
  // Clean directory if exists
  if (fs.existsSync('dist')) {
    rimraf.sync('dist');
  }
  fs.mkdirSync('dist');
}, 'package']));