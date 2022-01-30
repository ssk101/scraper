import fetch from 'node-fetch'
import cheerio from 'cheerio'

async function scrapeURL(req, res, next) {
  function findElements(selector) {
    const nodes = $.root().find(selector).toArray()

    return nodes.map(node => {
      const {
        name,
        attribs,
      } = node

      return {
        name,
        attributes: attribs,
        html: $(node).html(),
      }
    })
  }

  const {
    url,
    targetSelectors = [],
    includeRaw,
  } = req.body

  let raw
  const result = []

  try {
    raw = await fetch(url).then(res => res.text())
  } catch (e) {
    console.error(e)

    return res.json({
      status: 500,
      error: e,
      result,
    })
  }

  const $ = cheerio.load(raw)

  for(const selector of targetSelectors) {
    result.push({
      selector,
      elements: findElements(selector)
    })
  }

  if(!targetSelectors.length || includeRaw) {
    result.push({
      selector: 'html',
      elements: findElements('html'),
    })
  }

  res.json({
    status: 200,
    result,
  })
}

export const routes = {
  '/scrape': {
    method: 'post',
    handlers: [scrapeURL],
  },
}