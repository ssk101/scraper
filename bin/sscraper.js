#!/bin/sh
":" //# hello there ; exec /usr/bin/env node --experimental-json-modules --no-warnings "$0" "$@"

import fs from 'fs-extra'
import fetch from 'node-fetch'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import config from '../config.json' assert { type: 'json' }
import Logger from '../utils/logger.js'

const logger = new Logger('[sscraper]')

const { port } = config
const root = `http://localhost:${port}`

const options = {
  u: {
    alias: 'url',
    describe: 'URL to scrape',
    type: 'string',
    demandOption: true,
  },
  m: {
    alias: 'downloadMedia',
    describe: `Download images from the target selector's child elements matching input formats. Leave empty to check for all standard formats`,
    type: 'array',
    default: [
      'apng',
      'avif',
      'bmp',
      'gif',
      'jfif',
      'jpg',
      'jpeg',
      'pjpeg',
      'pjp',
      'png',
      'svg',
      'tif',
      'tiff',
      'webp'
    ],
  },
  t: {
    alias: 'targetSelectors',
    describe: `Target selector(s) to scrape and/or search for media sources in. e.g. #main, .some-class, input[name='radios']. Leave blank to target the root html element.`,
    type: 'array',
  },
  f: {
    alias: 'JSONFilename',
    describe: 'File name to save JSON output to. Defaults to the URL hostname',
    type: 'string',
  },
  v: {
    alias: 'verbose',
    describe: 'Output scraped HTML JSON to the terminal',
    type: 'boolean',
    default: false,
  },
}

const argv = yargs(process.argv.slice(2))
  .options(options)
  .help('h')
  .alias('h', 'help')
  .wrap(80)
  .argv

const {
  _,
  url,
  targetSelectors,
  downloadMedia,
  JSONFilename,
  verbose,
} = argv

try {
  const {
    formattedData,
    hostname,
    mediaItems,
    JSONFile,
    mediaDir,
  } = await fetch(`${root}/scrape`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      url,
      targetSelectors,
      downloadMedia,
      JSONFilename,
    })
  })
    .then(res => res.json())

  if(verbose) {
    logger.log(formattedData)
  }
  
  logger.log('JSON Result saved to:', JSONFile)
  
  if(mediaItems) {
    logger.log('Downloaded', mediaItems, 'media items to', mediaDir)
  }
} catch (e) {
  throw new Error(e)
}

process.exit(0)