import fetch from 'node-fetch'
import cheerio from 'cheerio'

async function scrapeURL(req, res, next) {
  const { url, targets = [], includeRaw } = req.body

  let raw
  const result = {}

  try {
    raw = await fetch(url).then(res => res.text())
  } catch (e) {
    console.error(e)

    return res.json({
      status: 500,
      error: e,
    })
  }

  const $ = cheerio.load(raw)

  for(const target of targets) {
    result[target] = $(target).html()
  }

  res.json({
    status: 200,
    result: Object.assign(result, includeRaw ? { html: $.html() } : {})
  })
}

export const routes = {
  '/scrape': {
    method: 'post',
    handlers: [scrapeURL],
  },
}