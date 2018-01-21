const rollup = require('rollup').rollup
const babel = require('rollup-plugin-babel')
const fs = require('fs')
const uglify = require('uglify-js')
const css = require('rollup-plugin-css-only')
const pify = require('pify')
const mkdirp = require('mkdirp')
const classify = require('./classify')
const pack = require('../package.json')
const banner = require('./banner.js')

const mkdirpAsync = pify(mkdirp)
const writeFileAsync = pify(fs.writeFile)

function packageRollup (options) {
  const moduleId = classify(pack.name)
  return mkdirpAsync('./dist')
    .then(() => {
      return rollup({
        input: options.entry || 'src/sweetalert2.js',
        plugins: [
          css({ output: false }),
          babel({
            exclude: 'node_modules/**'
          })
        ]
      })
    })
    .then((bundle) => {
      return bundle.generate({
        format: options.format,
        banner: banner,
        name: classify(pack.name),
        footer: `if (typeof window !== 'undefined' && window.${moduleId}) window.sweetAlert = window.swal = window.${moduleId};`
      })
    })
    .then((result) => {
      let code = result.code.replace(
        /(sweetAlert.*?).version = ''/,
        `$1.version = '${pack.version}'`
      )
      if (options.minify) {
        code = uglify.minify(code).code
      }
      return writeFileAsync(options.dest, code)
    })
}

module.exports = packageRollup
