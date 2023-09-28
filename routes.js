import { scrapeAll } from './scraper.js'

const routes = {
  '/ping': {
    method: 'get',
    handlers: [function(req, res, next) {
      res.json({ status: 200, message: 'PONG' })
    }],
  },
  '/scrape': {
    method: 'post',
    handlers: [scrapeAll],
  },
}

export default routes