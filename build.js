/* eslint-env node */

const { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } = require('fs')
const path = require('path')
const { minify } = require('terser')
const cheerio = require('cheerio')

// Create dist/ folder with uifactory.min.js and components
async function build() {
  let srcRoot = path.join(__dirname, 'src')
  let tgtRoot = path.join(__dirname, 'dist')
  // Create dist/ if required
  if (!existsSync(tgtRoot))
    mkdirSync(tgtRoot)
  // Build files
  for (let filename of readdirSync(srcRoot)) {
    let source = path.join(srcRoot, filename)
    let target = path.join(tgtRoot, filename)
    let contents = readFileSync(source, { encoding: 'utf-8' })
    // Compress all JS files into .min.js
    if (filename.match(/\.js$/i)) {
      let result = await minify(contents, {
        sourceMap: {
          filename: filename,
          url: filename + '.map'
        }
      })
      writeFileSync(target.replace(/\.js$/i, '.min.js'), result.code, { encoding: 'utf8' })
      writeFileSync(target + '.map', result.map, { encoding: 'utf8' })
    }
    // Build all HTML files as components. TODO: Minify them
    else if (filename.match(/\.html$/i)) {
      let $ = cheerio.load(contents)
      contents = $('template').map((i, v) => $.html(v)).get().join('\n')
      writeFileSync(target, contents, { encoding: 'utf8' })
    }
  }
}

build()
