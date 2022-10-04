import fetch from 'node-fetch'
import fs from 'fs-extra'
import Logger from './utils/logger.js'
import { findElements } from './utils/cheerio.js'

const slog = new Logger('[server]')
const mlog = new Logger('[media download]')

const mediaMimeTypes = {
  'image/apng': ['apng'],
  'image/avif': ['avif'],
  'image/bmp': ['bmp'],
  'image/gif': ['gif'],
  'image/jpeg': ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp'],
  'image/png': ['png'],
  'image/svg+xml': ['svg'],
  'image/tiff': ['tif', 'tiff'],
  'image/webp': ['webp'],
}

function ensureDir(path) {
  try {
    fs.ensureDirSync(path)
  } catch (e) {
    slog.error('Unable to create directory', path)
    throw new Error(e)
  }
}

async function scrapeURL(req, res, next) {
  const {
    url,
    targetSelectors = [],
    downloadMedia,
    JSONFilename,
  } = req.body

  const { hostname } = new URL(url)
  
  let html
  let mediaItems = 0
  const selectorData = []
  
  const rootDir = `${process.cwd()}/tmp/${hostname}`
  const JSONDir = `${rootDir}/JSON`
  const mediaDir = `${rootDir}/media`

  ensureDir(rootDir)

  slog.info('Scraping', { hostname })

  try {
    html = await fetch(url)
      .then(res => res.text())
  } catch (e) {
    slog.error(e)

    return res.json({
      status: 500,
      error: e,
      result,
    })
  }

  for(const selector of targetSelectors) {
    selectorData.push({
      selector,
      elements: findElements(html, selector)
    })
  }

  if(!targetSelectors.length) {
    const elements = findElements(html, 'html')

    selectorData.push({
      selector: 'html',
      elements,
    })
  }

  if(downloadMedia) {
    ensureDir(mediaDir)

    const selectedMimeTypes = new Set()
    
    for(const [mimeType, formats] of Object.entries(mediaMimeTypes)) {
      if(downloadMedia.some(format => formats.includes(format))) {
        selectedMimeTypes.add(mimeType)
      }
    }

    if(!selectedMimeTypes.size) {
      mlog.warn('No valid media formats selected. Valid formats:', Object.values(mediaMimeTypes).flat())
    }
    const sources = selectorData.reduce((acc, selector) => {
      for(const { attributes = {} } of selector.elements) {
        if(attributes.src) acc.push(attributes.src)
      }

      return acc
    }, [])

    for(const src of sources) {
      let mediaURL
      let mediaResponse

      if(src.match(/data:image\/(.*);base64/) || src.match(/http(|s):\/\//)) {
        mediaURL = src
      } else {
        mediaURL = `http://${hostname}/${src.replace(/^\//, '')}`
      }

      try {
        mediaResponse = await fetch(mediaURL)
        const { status, headers } = mediaResponse
        const contentLength = +headers.get('content-length')
        const contentType = headers.get('content-type')
        
        if(+status !== 200) {
          mlog.warn('Unsuccessful response.', { status, mediaURL })
          continue
        }
        
        if(!selectedMimeTypes.has(contentType)) {
          mlog.warn('MIME type from response does not match requested format, skipping.', { contentType, mediaURL })
          continue
        }

        const [mimeType, formats] = Object.entries(mediaMimeTypes).find(([mimeType, formats]) => {
          return contentType === mimeType
        })

        const buffer = await mediaResponse.buffer()

        try {
          let filename = `${mediaDir}/${src.replace(/\W/g, '.')}`
          
          if(!formats.includes(filename.split('.').pop())) {
            filename += `.${formats[0]}`
          }

          fs.writeFileSync(filename, buffer, 'binary')
        } catch (e) {
          mlog.error('Unable to write file', { mediaURL, mediaDir })
          throw new Error(e)
        }

        mediaItems += 1
        mlog.log(`(${mediaItems.toString().padStart(sources.length.toString().length, 0)}/${sources.length})`, 'Downloaded', mediaURL)
      } catch (e) {
        mlog.warn('GET request failed.', { e, mediaURL })
        continue
      }
    }
  }

  slog.log('Done.')

  ensureDir(JSONDir)
  
  const formattedData = JSON.stringify(selectorData, null, 2)
  const JSONFile = `${JSONDir}/${Date.now()}_${JSONFilename || hostname.trim()}.json`
  
  fs.writeFileSync(JSONFile, formattedData)

  res.json({
    status: 200,
    formattedData,
    hostname,
    mediaItems,
    JSONFile,
    mediaDir,
  })
}

export const routes = {
  '/scrape': {
    method: 'post',
    handlers: [scrapeURL],
  },
}