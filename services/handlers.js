import Logger from '../utils/logger.js'

const clog = new Logger('[simple-scraper]')

export async function attempt(callback, error) {
  try {
    return callback()
  } catch (e) {
    clog.error(error || e)
    throw new Error(e)
  }
}