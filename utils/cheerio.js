import cheerio from 'cheerio'

export function findElements(html, selector) {
  const $ = cheerio.load(html)
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