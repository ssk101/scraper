#!/bin/sh
":" //# hello there ; exec /usr/bin/env node --experimental-json-modules --no-warnings "$0" "$@"

import fs from 'fs-extra'
import fetch from 'node-fetch'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import config from '../config.json' assert { type: 'json' }

const { port } = config
const root = `http://localhost:${port}`

const options = {
  u: {
    alias: 'url',
    describe: 'URL to scrape',
    type: 'string',
    demandOption: true,
  },
  t: {
    alias: 'targetSelectors',
    describe: 'Optional target element selector(s) (e.g. #main, .something)',
    type: 'array',
  },
  r: {
    alias: 'includeRaw',
    describe: 'Include raw html dump',
    type: 'boolean',
  },
  f: {
    alias: 'filename',
    describe: 'File name to save output to, if provided',
    type: 'string',
  },
  s: {
    alias: 'silent',
    describe: 'Do not output result to terminal',
    type: 'boolean',
    default: false,
  },
}

const argv = yargs(process.argv.slice(2))
  .options(options)
  .help('h')
  .alias('h', 'help')
  .wrap(120)
  .argv

const {
  _,
  url,
  targetSelectors,
  includeRaw,
  filename,
  silent,
} = argv

try {
  const { result } = await fetch(`${root}/scrape`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      url,
      targetSelectors,
      includeRaw,
    })
  })
    .then(res => res.json())

  if(!silent) {
    console.log(result)
  }

  if(filename) {
    const workingDir = `${process.cwd()}/tmp`
    fs.ensureDirSync(workingDir)
    const sanitizedFileName = `${workingDir}/${Date.now()}_${filename.trim()}.json`
    fs.writeFileSync(sanitizedFileName, JSON.stringify(result, null, 2))
    console.log(`Result saved to ${sanitizedFileName}`)
  }
} catch (e) {
  throw new Error(e)
}

process.exit(0)

