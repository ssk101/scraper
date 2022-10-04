# simple-scraper

#### Description
Simple HTML scraper using [Cheerio](https://cheerio.js.org).

#### Features
- CLI
- Target one or more elements via selectors
- POSTable REST endpoint for returning scraped content
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
[npm or yarn] run scrape -u "https://www.bbc.com" -t "img" -t "a.block-link__overlay-link" -m
```

The included binary can also be linked/installed globally. Note that it will save results to `tmp/` in the directory you're running from.
```bash
npm link
sscraper
```

#### CLI options
```
  -u, --url              URL to scrape. [required]
  -m, --downloadMedia    Download images from the target selector's child elements matching input formats. Leave empty to check for all standard formats.
  -t, --targetSelectors  Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']". Leave blank to target the root html element.
  -f, --JSONFilename     File name to save JSON output to. Defaults to the URL's hostname.
  -v, --verbose          Output scraped HTML JSON to the terminal.
```
