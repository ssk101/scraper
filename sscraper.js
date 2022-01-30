#!/usr/bin/env node

import fetch from 'node-fetch'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import config from './config.json' assert { type: 'json' }

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
    alias: 'targets',
    describe: 'Optional target element selector(s) (e.g. #main, .something)',
    type: 'array',
  },
  r: {
    alias: 'raw',
    describe: 'Include raw html dump',
    type: 'boolean',
  },
}

const argv = yargs(process.argv.slice(2))
  .options(options)
  .help('h')
  .alias('h', 'help')
  .wrap(120)
  .argv

const {
  url,
  targets,
  includeRaw,
} = argv

async function scrape(url, targets) {
  if(url) {
    try {
      const result = await fetch(`${root}/scrape`, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          url,
          targets,
          includeRaw,
        })
      })
        .then(res => res.json())

      console.log(result)
    } catch (e) {
      throw new Error(e)
    }
  }
}

await scrape(url, targets)

process.exit(0)

