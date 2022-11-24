#!/bin/sh
":" //# hello there ; exec /usr/bin/env node --experimental-json-modules --no-warnings "$0" "$@"

import fs from 'fs-extra'
import path from 'path'
import fetch from 'node-fetch'
import yargs from 'yargs'
import config from '../config.json' assert { type: 'json' }
import mimeTypes from '../lib/mime-types.json' assert { type: 'json' }
import Logger from '../utils/logger.js'
import { attempt } from '../services/handlers.js'

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
    describe: `
    Path to a file containing list of URLs. Can be newline-seperated plaintext or JSON. If JSON, the file extension must be .json and the list of URLs must be formatted with an array of objects like the below example. Target selectors and/or attributes can also be defined in the JSON structure.

    Example JSON format:

    [
      {
        "targets": [
          ".media__image .responsive-image > img",
          ".rectangle-image picture img"
        ],
        "urls": [
          "https://bbc.com",
          "https://www.bbc.com/travel",
          "https://www.bbc.com/news"
        ]
      },
      {
        "targets": [
          ".media > a > img"
        ],
        "urls": [
          "https://cnn.com"
        ],
        "attrs": [
          "data-src"
        ]
      }
    ]
    `,
    type: 'string',
  },
  f: {
    alias: 'format',
    describe: `Download images from the target selector's child elements matching input format(s). Omit this parameter to check for all standard formats.`,
    type: 'array',
    default: Object.values(mimeTypes).flat(),
  },
  a: {
    alias: 'attribute',
    describe: `Look for the specified attribute(s) on media elements and collect the URL value(s) for download.`,
    type: 'array',
    default: ['data-src', 'src', 'style']
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
  target: argTargets,
  list: listFilePath,
  format: formats,
  attribute: argAttributes,
} = argv

if(!argURLs.length && !listFilePath) {
  throw new Error('At least one of the arguments for supplying URL(s) must be provided.')
}

let combinedContent = []
let listFileContent
let parsedFileContent
let totalItems = 0

if(listFilePath) {
  const extension = path.extname(listFilePath)

  listFileContent = await attempt(() => {
    return fs.readFileSync(listFilePath, 'utf8')
  }, `Couldn't read list file at ${listFilePath}`)

  if(extension === '.json') {
    parsedFileContent = await attempt(() => {
      return JSON.parse(listFileContent)
    }, `Couldn't parse JSON contents from ${listFilePath}`)
  } else {
    parsedFileContent = await attempt(() => {
      const urls = listFileContent.split('\n')
        .map(url => url.trim())
        .filter(url => url)
      return [{ urls }]
    })
  }

  combinedContent.push(...parsedFileContent)
}

for(const { urls = [], targets = argTargets, attrs = argAttributes } of combinedContent) {
  const urlSet = new Set([...argURLs, ...urls])
  const { totalMediaItems, tmpDir } = await attempt(async () => {
    return fetch(`${root}/scrape`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        urls: Array.from(urlSet),
        targets,
        formats,
        attrs,
      })
    })
      .then(res => res.json())
  })

  totalItems += +totalMediaItems
  clog.log('JSON Results saved to:', tmpDir)

  console.log('hello')
}

clog.log('Downloaded', totalItems, 'media items')

process.exit(0)