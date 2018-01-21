const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const mergeStream = require('merge-stream')
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

gulp.task('build', () => {
  const prettyJs = gulp.src(['package.json', ...srcJsFiles])
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
  const uglyJs = prettyJs
    .pipe($.uglify({
      output: {
        preamble: banner
      }
    }))
    .pipe($.rename('sweetalert2.min.js'))
    .pipe(gulp.dest('dist'))

  const prettyCss = gulp.src('src/sweetalert2.scss')
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist'))
  const uglyCss = prettyCss
    .pipe($.cleanCss())
    .pipe($.rename('sweetalert2.min.css'))
    .pipe(gulp.dest('dist'))

  const prettyCssAsJs = prettyCss
    .pipe($.css2js())
    // .pipe($.rename('sweetalert2.css.js'))
    // .pipe(gulp.dest('dist'))
  const prettyStandalone = mergeStream(prettyJs, prettyCssAsJs)
    .pipe($.concat('sweetalert2.all.js'))
    .pipe(gulp.dest('dist'))
  const uglyCssAsJs = uglyCss
    .pipe($.css2js())
    // .pipe($.rename('sweetalert2.min.css.js'))
    // .pipe(gulp.dest('dist'))
  const uglyStandalone = mergeStream(uglyJs, uglyCssAsJs)
    .pipe($.concat('sweetalert2.all.min.js'))
    .pipe(gulp.dest('dist'))

  return mergeStream(prettyStandalone, uglyStandalone)
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
