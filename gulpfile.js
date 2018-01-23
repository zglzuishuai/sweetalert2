const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const babel = require('rollup-plugin-babel')
const json = require('rollup-plugin-json')
const merge = require('merge2')
const execa = require('execa')
const packageJson = require('./package.json')

const banner = `/*!
* ${packageJson.name} v${packageJson.version}
* Released under the ${packageJson.license} License.
*/`

const allJsFiles = ['**/*.js', '!dist/**', '!node_modules/**']
const srcJsFiles = ['src/**/*.js']
const srcSassFiles = ['src/**/*.scss']
const tsFiles = ['sweetalert2.d.ts']

const skipMinification = process.argv.includes('--skip-minification')
const continueOnLintError = process.argv.includes('--continue-on-lint-error')

// ---

gulp.task('build:js', () => {
  return gulp.src(['package.json', ...srcJsFiles])
    .pipe($.rollup({
      plugins: [
        json(),
        babel({
          exclude: 'node_modules/**'
        })
      ],
      input: 'src/sweetalert2.js',
      output: {
        format: 'umd',
        name: 'Sweetalert2',
        banner: banner,
        footer: 'if (typeof window !== \'undefined\' && window.Sweetalert2) window.sweetAlert = window.swal = window.Sweetalert2;'
      }
    }))
    .pipe(gulp.dest('dist'))
    .pipe($.if(!skipMinification, $.uglify({
      output: {
        preamble: banner
      }
    })))
    .pipe($.if(!skipMinification, $.rename('sweetalert2.min.js')))
    .pipe($.if(!skipMinification, gulp.dest('dist')))
})

gulp.task('build:css', () => {
  return gulp.src('src/sweetalert2.scss')
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist'))
    .pipe($.if(!skipMinification, $.cleanCss()))
    .pipe($.if(!skipMinification, $.rename('sweetalert2.min.css')))
    .pipe($.if(!skipMinification, gulp.dest('dist')))
})

/**
 * Warning: This task depends on dist/sweetalert2.js & dist/sweetalert2.css
 */
gulp.task('build:standalone', () => {
  const prettyJs = gulp.src('dist/sweetalert2.js')
  const prettyCssAsJs = gulp.src('dist/sweetalert2.css')
    .pipe($.css2js())
  const prettyStandalone = merge(prettyJs, prettyCssAsJs)
    .pipe($.concat('sweetalert2.all.js'))
    .pipe(gulp.dest('dist'))
  if (skipMinification) {
    return prettyStandalone
  } else {
    const uglyJs = gulp.src('dist/sweetalert2.min.js')
    const uglyCssAsJs = gulp.src('dist/sweetalert2.min.css')
      .pipe($.css2js())
    const uglyStandalone = merge(uglyJs, uglyCssAsJs)
      .pipe($.concat('sweetalert2.all.min.js'))
      .pipe(gulp.dest('dist'))
    return merge([prettyStandalone, uglyStandalone])
  }
})

gulp.task('build', gulp.series(
  gulp.parallel('build:js', 'build:css'),
  'build:standalone'
))

gulp.task('default', gulp.parallel('build'))

// ---

gulp.task('lint:js', () => {
  return gulp.src(allJsFiles)
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: !continueOnLintError
    }))
})

gulp.task('lint:sass', () => {
  return gulp.src(srcSassFiles)
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.if(!continueOnLintError, $.sassLint.failOnError()))
})

gulp.task('lint:ts', () => {
  return gulp.src(tsFiles)
    .pipe($.tslint({ formatter: 'verbose' }))
    .pipe($.tslint.report({
      emitError: !continueOnLintError
    }))
})

gulp.task('lint', gulp.parallel('lint:js', 'lint:sass', 'lint:ts'))

// ---

/**
 * Does *not* rebuild standalone builds
 */
gulp.task('dev', gulp.series(
  gulp.parallel('build:js', 'build:css', 'lint'),
  async function watch () {
    gulp.watch(srcJsFiles, gulp.parallel('build:js'))
    gulp.watch(srcSassFiles, gulp.parallel('build:css'))
    gulp.watch(allJsFiles, gulp.parallel('lint:js'))
    gulp.watch(srcSassFiles, gulp.parallel('lint:sass'))
    gulp.watch(tsFiles, gulp.parallel('lint:ts'))
  },
  async function serve () {
    console.log('Open testem: http://localhost:7357/')
    await execa('testem')
  }
))
