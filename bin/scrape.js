#!/bin/sh
":" //# hello there ; exec /usr/bin/env node --experimental-json-modules --no-warnings "$0" "$@"

import path from 'path'
import { spawnSync } from 'child_process'
import fs from 'fs-extra'
import fetch from 'node-fetch'
import yargs from 'yargs'
import config from '../config.json' assert { type: 'json' }
import allMimeTypes from '../lib/mime-types.json' assert { type: 'json' }
import Logger from '../utils/logger.js'

const logger = new Logger('[scraper]')
const port = process.env.PORT || config.port
const host = process.env.HOST || config.host
const root = `${host}:${port}`

const options = {
  u: {
    alias: 'url',
    describe: 'URL to scrape',
    type: 'array',
  },
  l: {
    alias: ['list', 'url-list'],
    describe: `Path to a plaintext or JSON file containing newline-separated list of URLs to scrape`,
    normalize: true,
    type: 'string',
  },
  j: {
    alias: ['json-logs'],
    describe: `Save scrape logs as JSON for each URL`,
    type: 'boolean',
    default: false,
  },
  o: {
    alias: ['out', 'out-dir'],
    describe: `Path to the directory where scraped media and metadata should be saved`,
    type: 'string',
    normalize: true,
    default: `${process.cwd()}/tmp`,
  },
  m: {
    alias: 'mime-types',
    describe: `Only scrape media matching the specified MIME type extensions`,
    type: 'array',
    default: Object.values(allMimeTypes).flat(),
  },
  a: {
    alias: ['attribute', 'target-attribute'],
    describe: `Target element attribute to scrape media URL from`,
    type: 'array',
    default: ['data-src', 'src', 'style']
  },
  t: {
    alias: ['target', 'target-selector'],
    describe: `Target CSS selector to scrape media URL from`,
    type: 'array',
    default: ['img'],
  },
  r: {
    alias: ['resize', 'resize-to'],
    describe: 'Resize downloaded images to specified "[width]x[height]", e.g. "-r 300x300".',
    type: 'string',
    default: null,
  },
  f: {
    alias: ['fit', 'resize-fit-method'],
    describe: 'Method used for fitting when resized. "contain" will preserve aspect ratio and letterboxing',
    type: 'string',
    choices: ['cover', 'contain', 'fill', 'inside', 'outside'],
    default: 'contain',
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
  outDir,
  jsonLogs,
  target: targets,
  mimeTypes,
  attribute: mediaAttributes,
  resize,
  fit,
} = argv

if(!argURLs.length && !listFilePath) {
  throw new Error('At least one of the arguments for supplying URL(s) must be provided.')
}

let listContent
let listFileType

if(fs.existsSync(listFilePath)) {
  const listFile = fs.readFileSync(listFilePath, 'utf-8')

  try {
    listContent = JSON.parse(listFile)
    listFileType = 'json'
  } catch (e) {
    listFileType = 'txt'

    try {
      listContent = listFile
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)

    } catch (e) {
      logger.error(`Couldn't read list file at ${listFilePath}.`)
      throw new Error(e)
    }
  }

}

const hrefItems = Array.from(new Set([...argURLs, ...listContent]))

try {
  try {
    await fetch(`${root}/ping`)
  } catch (e) {
    logger.log('Server not running, starting process...')
    await import('../server.js')
  }

  const { status: serverStatus } = await fetch(`${root}/ping`)
  logger.log({ serverStatus })

  if(serverStatus !== 200) {
    throw { serverStatus }
  }

  const {
    totalMediaItems,
  } = await fetch(`${root}/scrape`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      hrefItems,
      outDir,
      jsonLogs,
      targets,
      mimeTypes,
      mediaAttributes,
      resize,
      fit,
    })
  })
    .then(res => res.json())

  logger.log('JSON Results saved to:', outDir)

  if(totalMediaItems) {
    logger.log('Downloaded', totalMediaItems, 'media items')
  }
} catch (e) {
  throw new Error(e)
}

process.exit(0)