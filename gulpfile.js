const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const babel = require('rollup-plugin-babel')
const json = require('rollup-plugin-json')
const packageJson = require('./package.json')

const banner = `/*!
* ${packageJson.name} v${packageJson.version}
* Released under the ${packageJson.license} License.
*/`

const allJsFiles = ['**/*.js', '!dist/**', '!node_modules/**']
const srcJsFiles = ['src/**/*.js']
const srcSassFiles = ['src/**/*.scss']
const tsFiles = ['sweetalert2.d.ts']

gulp.task('default', ['build'])

// ---

gulp.task('build', ['build:js', 'build:css', 'build:standalone'])

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
    .pipe($.uglify({
      output: {
        preamble: banner
      }
    }))
    .pipe($.rename('sweetalert2.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('build:css', () => {
  return gulp.src('src/sweetalert2.scss')
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist'))
    .pipe($.cleanCss())
    .pipe($.rename('sweetalert2.min.css'))
    .pipe(gulp.dest('dist'))
})

gulp.task('build:standalone', ['build:js', 'build:css'], () => {
  const prettyJs = gulp.src('dist/sweetalert2.js')
  const prettyCssAsJs = gulp.src('dist/sweetalert2.css')
    .pipe($.css2js())
  const prettyStandalone = $.merge(prettyJs, prettyCssAsJs)
    .pipe($.concat('sweetalert2.all.js'))
    .pipe(gulp.dest('dist'))
  const uglyJs = gulp.src('dist/sweetalert2.min.js')
  const uglyCssAsJs = gulp.src('dist/sweetalert2.min.css')
    .pipe($.css2js())
  const uglyStandalone = $.merge(uglyJs, uglyCssAsJs)
    .pipe($.concat('sweetalert2.all.min.js'))
    .pipe(gulp.dest('dist'))
  return $.merge(prettyStandalone, uglyStandalone)
})

// ---

gulp.task('lint', ['lint:js', 'lint:sass', 'lint:ts'])

gulp.task('lint:js', () => {
  return gulp.src(allJsFiles)
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('lint:sass', () => {
  return gulp.src(srcSassFiles)
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError())
})

gulp.task('lint:ts', () => {
  return gulp.src(tsFiles)
    .pipe($.tslint({ formatter: 'verbose' }))
    .pipe($.tslint.report())
})

// ---

gulp.task('watch', () => {
  gulp.watch([...srcJsFiles, ...srcSassFiles], 'build')
  gulp.watch(allJsFiles, ['lint:js'])
  gulp.watch(srcSassFiles, ['lint:sass'])
  gulp.watch(tsFiles, ['lint:ts'])
})
