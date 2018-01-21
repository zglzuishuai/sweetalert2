const gulp = require('gulp')
const cleanCSS = require('gulp-clean-css')
const sass = require('gulp-sass')
const rename = require('gulp-rename')
const autoprefix = require('gulp-autoprefixer')
const standard = require('gulp-standard')
const sassLint = require('gulp-sass-lint')
const ts = require('gulp-typescript')
const tslint = require('gulp-tslint')

const pack = require('./package.json')
const packageRollup = require('./utils/package-rollup')

const allJsFiles = ['**/*.js', '!dist/**', '!node_modules/**']
const srcJsFiles = ['src/**/*.js']
const sassFiles = ['src/**/*.scss']
const tsFiles = ['sweetalert2.d.ts']

gulp.task('compress', ['dev', 'production', 'all', 'all.min'])

gulp.task('dev', () => {
  return packageRollup({
    dest: 'dist/' + pack.name + '.js',
    format: 'umd'
  })
})

gulp.task('production', () => {
  return packageRollup({
    dest: 'dist/' + pack.name + '.min.js',
    format: 'umd',
    minify: true
  })
})

gulp.task('all', ['sass'], () => {
  return packageRollup({
    entry: 'src/sweetalert2.all.js',
    dest: 'dist/' + pack.name + '.all.js',
    format: 'umd'
  })
})

gulp.task('all.min', ['sass'], () => {
  return packageRollup({
    entry: 'src/sweetalert2.all.js',
    dest: 'dist/' + pack.name + '.all.min.js',
    format: 'umd',
    minify: true
  })
})

gulp.task('sass', () => {
  return gulp.src('src/sweetalert2.scss')
    .pipe(sass())
    .pipe(autoprefix())
    .pipe(gulp.dest('dist'))
    .pipe(cleanCSS())
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest('dist'))
})

gulp.task('ts', () => {
  return gulp.src(tsFiles)
    .pipe(ts())
})

gulp.task('lint', ['lint:js', 'lint:sass', 'lint:ts'])

gulp.task('lint:js', () => {
  return gulp.src(allJsFiles)
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('lint:sass', () => {
  return gulp.src(sassFiles)
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
})

gulp.task('lint:ts', () => {
  return gulp.src(tsFiles)
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report())
})

gulp.task('default', ['sass', 'ts', 'compress'])

gulp.task('watch', () => {
  gulp.watch(srcJsFiles, ['compress'])
  gulp.watch(sassFiles, ['sass'])
  gulp.watch(allJsFiles, ['lint:js'])
  gulp.watch(sassFiles, ['lint:sass'])
  gulp.watch(tsFiles, ['lint:ts'])
})
