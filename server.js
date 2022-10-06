import fetch from 'node-fetch'
import fs from 'fs-extra'
import Logger from './utils/logger.js'
import { findElements } from './utils/cheerio.js'
import MIME_TYPES from './lib/mime-types.json' assert { type: 'json' }

const slog = new Logger('[server]')
const mlog = new Logger('[media download]')

async function tryFetch(url) {
  try {
    return fetch(url, { signal: AbortSignal.timeout(5000) })
  } catch (e) {
    slog.error(e)
    throw e
  }
}

function ensureDir(path) {
  try {
    fs.ensureDirSync(path)
  } catch (e) {
    slog.error('Unable to create directory', path)
    throw new Error(e)
  }
}

async function scrapeAll(req, res, next) {
  const {
    urls,
    targets,
    formats,
    mediaAttributes,
  } = req.body

  const tmpDir = `${process.cwd()}/tmp`
  let totalMediaItems = 0

  for(const href of urls) {
    await scrapeURL(href)
  }

  async function scrapeURL(href) {
    const url = new URL(href)
    const { hostname } = url

    let html
    let mediaItems = 0

    const selectorData = []
    const urlDir = `${tmpDir}/${hostname}`
    const JSONDir = `${urlDir}/JSON`
    const mediaDir = `${urlDir}/media`

    ensureDir(urlDir)
    ensureDir(mediaDir)

    slog.info('Scraping', { hostname })

    try {
      html = await tryFetch(url)
        .then(res => res.text())
    } catch (e) {
      return res.json({
        status: 500,
        error: e,
        result,
      })
    }

    for(const selector of targets) {
      selectorData.push({
        selector,
        elements: findElements(html, selector)
      })
    }

    if(!targets.length) {
      const elements = findElements(html, 'html')

      selectorData.push({
        selector: 'html',
        elements,
      })
    }

    const targetMimeTypes = new Set()

    for(const [mimeType, fmts] of Object.entries(MIME_TYPES)) {
      if(fmts.some(format => formats.includes(format))) {
        targetMimeTypes.add(mimeType)
      }
    }

    if(!targetMimeTypes.size) {
      mlog.warn('No valid media formats selected. Valid formats:', Object.values(MIME_TYPES).flat())
    }
    const sources = selectorData.reduce((acc, selector) => {
      for(const element of selector.elements) {
        const { attributes } = element

        for(const mediaAttribute of mediaAttributes) {
          const value = attributes[mediaAttribute]
          
          if(!value) continue

          if(mediaAttribute === 'style') {
            let extractedValues = value.match(/(?<=(background|background-image|list-style-image|border-image|border-image-source|mask-image|content|src):(\w+\(|)((.*)url\()("|'|))([^)]*)(?=\))/g)
            
            if(!extractedValues) continue
            
            extractedValues = extractedValues
              .filter(value => value)
              .map(value => value.trim())
              .map(value => value.replace(/['"]/g, ''))
              
            acc.push(...extractedValues || [])
          } else {
            acc.push(value)
          }
        }
      }

      return acc
    }, [])

    for(const src of sources) {
      let mediaURL
      let mediaResponse

      if(src.match(/data:image\/(.*);base64/) || src.match(/http(|s):\/\//)) {
        mediaURL = new URL(src)
      } else if(src.match(/^\/\//)) {
        mediaURL = new URL(`https://${src}`)
      } else {
        mediaURL = new URL(`http://${hostname}/${src.replace(/^(\/)*/, '')}`)
      }

      try {
        mediaResponse = await tryFetch(mediaURL)
        const { status, headers } = mediaResponse
        const contentType = headers.get('content-type')

        if(+status !== 200) {
          mlog.warn('Unsuccessful response.', { status, mediaURL })
          continue
        }

        if(!targetMimeTypes.has(contentType)) {
          mlog.warn('MIME type from response does not match requested format, skipping.', { contentType, mediaURL })
          continue
        }

        const [mimeType, formats] = Object.entries(MIME_TYPES).find(([type, fmts]) => {
          return contentType === type
        })

        const buffer = await mediaResponse.buffer()
        const strippedName = mediaURL.pathname
          .replace(/image(.*);base64.*/g, Date.now())
          .replace(/^\//, '')
          .replace(/[/\\~?%*:|"<>]/g, '.')

        let filename = `${mediaDir}/${strippedName}`

        if(!formats.includes(strippedName.split('.').pop())) {
          filename += `.${formats[0]}`
        }

        try {
          fs.writeFileSync(filename, buffer, 'binary')
        } catch (e) {
          mlog.error('Unable to write file', { filename })
          throw new Error(e)
        }

        mediaItems += 1
        
        mlog.log([
          [
            mediaItems.toString().padStart(sources.length.toString().length, 0),
            '/',
            sources.length,
          ].join(''),
          'Downloaded',
          filename,
        ].join(' '))
      } catch (e) {
        mlog.warn('GET request failed.', { e, mediaURL })
        continue
      }
    }

    slog.log('Done.')

    ensureDir(JSONDir)

    const formattedData = JSON.stringify(selectorData, null, 2)
    const JSONFile = `${JSONDir}/${Date.now()}_${hostname.trim()}.json`

    fs.writeFileSync(JSONFile, formattedData)
    totalMediaItems += mediaItems
  }

  res.json({
    status: 200,
    totalMediaItems,
    tmpDir,
  })
}

export const routes = {
  '/scrape': {
    method: 'post',
    handlers: [scrapeAll],
  },
}