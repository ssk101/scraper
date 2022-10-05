# simple-scraper

#### Description
Simple HTML scraper using [Cheerio](https://cheerio.js.org).

#### Features
- CLI
- Multiple URL support
- Target one or more elements via selectors and retrieve their JSON formatted contents
- Download images by looking for specified input format(s) (or all standard web formats)

#### To be implemented:
- Download of other media types (video streams, blobs, etc.)

#### Requirements
`node >= 17.5.0`

#### Usage

1. Install dependencies:
```bash
[npm or yarn] install
```

2. Start the server:
```bash
[npm or yarn] run server
```

3. Example CLI usage:
```bash
# Scrape two URLs, collect the JSON for <img> and <article> elements found and attempt to download any images from said elements with "src" attributes
[npm or yarn] run scrape -d -u "https://www.bbc.com" -u "https://www.cnn.com" -t "img" -t "article"

# Scrapes the root <html> element by default
[npm or yarn] run scrape -u "https://www.bbc.com"
```

The included binary can also be linked/installed globally. Note that it will save results to `tmp/` in the directory you're running from.
```bash
npm link
sscraper
```

#### CLI options
```
  -u, --url       URL(s) to scrape.
  -f, --format    Download images from the target selector's child elements matching input format(s). Omit this parameter to check for all standard formats.
  -t, --target    Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']". Omit this parameter to target the root html element.
```
