import { scrape } from './scraper.js'

const routes = {
  '/ping': {
    method: 'get',
    handlers: [function(req, res, next) {
      res.json({ status: 200, message: 'PONG' })
    }],
  },
  '/scrape': {
    method: 'post',
    handlers: [scrape],
  },
}

export default routes
