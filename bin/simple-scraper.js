#!/bin/sh
":" //# hello there ; exec /usr/bin/env node --experimental-json-modules --no-warnings "$0" "$@"

import fs from 'fs-extra'
import fetch from 'node-fetch'
import yargs from 'yargs'
import config from '../config.json' assert { type: 'json' }
import mimeTypes from '../lib/mime-types.json' assert { type: 'json' }
import Logger from '../utils/logger.js'

const clog = new Logger('[simple-scraper]')
const port = process.env.PORT || config.port
const host = process.env.HOST || config.host
const root = `${host}:${port}`

const options = {
  u: {
    alias: 'url',
    describe: 'URL(s) to scrape.',
    type: 'array',
  },
  l: {
    alias: 'list',
    describe: `Path to a file containing newline-separated list of URLs.`,
    type: 'string',
  },
  f: {
    alias: 'format',
    describe: `Download images from the target selector's child elements matching input format(s). Omit this parameter to check for all standard formats.`,
    type: 'array',
    default: Object.values(mimeTypes).flat(),
  },
  t: {
    alias: 'target',
    describe: `Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']". Omit this parameter to target the root html element.`,
    type: 'array',
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
  url: argURLs = [],
  list: listFilePath,
  target: targets,
  format: formats,
} = argv

if(!argURLs.length && !listFilePath) {
  throw new Error('At least one of the arguments for supplying URL(s) must be provided.')
}

let listContent = []

try {
  listContent = fs.readFileSync(listFilePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
  
} catch (e) {
  throw new Error(e)
}

const urls = new Set([...argURLs, ...listContent])

try {
  const {
    totalMediaItems,
    tmpDir,
  } = await fetch(`${root}/scrape`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      urls: Array.from(urls),
      targets,
      formats,
    })
  })
    .then(res => res.json())

    clog.log('JSON Results saved to:', tmpDir)

  if(totalMediaItems) {
    clog.log('Downloaded', totalMediaItems, 'media items')
  }
} catch (e) {
  throw new Error(e)
}

process.exit(0)