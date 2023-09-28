import fetch from 'node-fetch'
import fs from 'fs-extra'
import Logger from './utils/logger.js'
import { findElements } from './utils/cheerio.js'
import { base62 } from './utils/uid.js'
import MIME_TYPES from './lib/mime-types.json' assert { type: 'json' }

const logger = new Logger('[scraper]')
const dlLogger = new Logger('[media download]')
let sharp

async function tryFetch(url) {
  try {
    return fetch(url, { signal: AbortSignal.timeout(5000) })
  } catch (e) {
    logger.error(e)
    throw e
  }
}

function ensureDir(path) {
  try {
    fs.ensureDirSync(path)
    return path
  } catch (e) {
    logger.error('Unable to create directory', path)
    throw new Error(e)
  }
}

export async function scrapeAll(req, res, next) {
  const {
    urls,
    targets,
    outDir,
    jsonLogs,
    mimeTypes,
    mediaAttributes,
    resize,
    fit,
  } = req.body

  let width, height

  if(resize) {
    const dimensions = resize.match(/^(\d+)x(\d+)$/)?.slice(1)

    if(dimensions?.length) {
      [ width, height ] = dimensions
    }

    if(!width || !height || isNaN(width) || isNaN(height)) {
      dlLogger.warn('Invalid dimensions for resize provided, skipping resize operation. Got: ', { width, height })
    } else {
      sharp = (await import('sharp')).default
    }
  }

  let totalMediaItems = 0

  for(const urlItem of urls) {
    const href = urlItem.href || urlItem
    const urlTargets = urlItem.targets
    const rangePattern = /{{(\d+-\d+)}}/
    const [matched] = href.match(rangePattern)?.slice(1) || []

    if(matched) {
      const [start, end] = matched?.split('-')

      for(const iter of [...Array(+end - +start + 1).keys()].map(i => i + +start)) {
        await scrapeURL(href.replace(rangePattern, iter), targets)
      }
    } else {
      await scrapeURL(href, urlTargets)
    }
  }

  async function scrapeURL(href, urlTargets) {
    const url = new URL(href)
    const { hostname } = url

    let html
    let mediaItems = 0

    const selectorData = []
    const urlDir = ensureDir(`${outDir}/${hostname}`)
    const JSONDir = jsonLogs ? ensureDir(`${urlDir}/JSON`) : null
    const mediaDir = ensureDir(`${urlDir}/media`)

    logger.info('Scraping', { href })

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

    for(const targetItem of (urlTargets || targets)) {
      let selector = targetItem.selector || targetItem

      if(targetItem.followSrc) {
        async function traverse(html, item) {
          const elements = findElements(html, item.selector)

          if(!item.followSrc) {
            selectorData.push({
              selector: item.selector,
              elements,
            })
            return
          }

          for(const element of elements) {
            const { attributes } = element || {}

            if(!attributes) continue

            const src = attributes[item.attribute]

            if(!src) continue

            const srcResponse = await tryFetch(src)
            const { status, headers } = srcResponse
            const srcHTML = await srcResponse.text()

            if(status !== 200) continue

            if(item.followSrc) {
              return traverse(srcHTML, item.followSrc)
            }
          }
        }

        await traverse(html, targetItem)

      } else {
        selectorData.push({
          selector,
          elements: findElements(html, selector)
        })
      }
    }

    const targetMimeTypes = new Set()

    for(const [mimeType, fmts] of Object.entries(MIME_TYPES)) {
      if(fmts.some(format => mimeTypes.includes(format))) {
        targetMimeTypes.add(mimeType)
      }
    }

    if(!targetMimeTypes.size) {
      dlLogger.warn('No valid media mimeTypes selected. Valid mimeTypes:', Object.values(MIME_TYPES).flat())
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
          dlLogger.warn('Unsuccessful response.', { status, mediaURL })
          continue
        }

        if(!targetMimeTypes.has(contentType)) {
          dlLogger.warn('MIME type from response does not match requested format, skipping.', { contentType, mediaURL })
          continue
        }

        const [mimeType, mimeTypes] = Object.entries(MIME_TYPES).find(([type, fmts]) => {
          return contentType === type
        })

        let buffer = await mediaResponse.buffer()
        const strippedName = mediaURL.pathname
          .replace(/image(.*);base64.*/g, Date.now())
          .replace(/^\//, '')
          .replace(/[/\\~?%*:|"<>]/g, '.')

        let filename = `${mediaDir}/${base62.encode(Date.now())}_${strippedName}`

        if(!mimeTypes.includes(strippedName.split('.').pop())) {
          filename += `.${mimeTypes[0]}`
        }

        if(sharp) {
          buffer = await sharp(buffer)
            .resize({ width: +width, height: +height, fit })
            .toBuffer()
        }

        try {
          fs.writeFileSync(filename, buffer, 'binary')
        } catch (e) {
          dlLogger.error('Unable to write file', { filename })
          throw new Error(e)
        }

        mediaItems += 1

        dlLogger.log([
          [
            mediaItems.toString().padStart(sources.length.toString().length, 0),
            '/',
            sources.length,
          ].join(''),
          'Downloaded',
          filename,
        ].join(' '))
      } catch (e) {
        dlLogger.warn('GET request failed.', { e, mediaURL })
        continue
      }
    }

    logger.log('Done.')

    const formattedData = JSON.stringify(selectorData, null, 2)

    if(JSONDir) {
      const JSONFile = `${JSONDir}/${Date.now()}_${hostname.trim()}.json`
      fs.writeFileSync(JSONFile, formattedData)
    }

    totalMediaItems += mediaItems
  }

  res.json({
    status: 200,
    totalMediaItems,
    outDir,
  })
}

process.on('SIGINT', () => process.exit())
process.on('SIGQUIT', () => process.exit())
process.on('SIGTERM', () => process.exit())