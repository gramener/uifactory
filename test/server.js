const express = require('express')
const glob = require('glob')
const path = require('path')
const process = require('process')
const serveIndex = require('serve-index')

async function run_tests(files) {
  const puppeteer = require('puppeteer')
  const browser = await puppeteer.launch({
    // On Gitlab CI, running as root without --no-sandbox is not supported
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  // Print whatever the page prints on the console.
  page.on('console', msg => {
    console.log(msg.type() == 'log' ? msg.text() : `# ${msg.type()}: ${msg.text()}`)
  })
  for (let i = 0; i < files.length; i++) {
    console.log(`# Loading: ${files[i]}`)
    await page.goto(`http://localhost:${port}/${files[i]}`)
    await page.waitForFunction('window.renderComplete')
  }
  await browser.close()
}

const port = 3333
const root = path.resolve(__dirname, '..')
const app = express()
  .use(express.static(root))
  .use(serveIndex(root))
const server = app.listen(port, async () => {
  process.chdir(root)
  // npm test debug will just start the server. Browse any file under test/
  if (process.argv.length > 2 && process.argv[2] == 'debug')
    console.log(`Test server: http://localhost:${port}/test/`)
  // npm test will run all tests
  else {
    await run_tests(glob.sync('test/test-*.html'))
    server.close()
  }
})
