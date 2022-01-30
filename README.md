# simple-scraper

#### Description
Simple HTML scraper using [Cheerio](https://cheerio.js.org).

#### Features
- CLI
- Target one or more elements via selectors (optional)
- POSTable REST endpoint for returning scraped content

#### Requirements
`node >= 17.0.0`

#### Usage

1. Install dependencies:
```bash
npm i
```

2. Start the server:
```bash
npm run server
```

3. Use the CLI:
```bash
npm run scrape -u "https://bt.no" -t ".ch-core-header" -t ".footer-wrapper .tips p:first-of-type a"
```

The included binary can also be linked/installed globally (will save results to `tmp/` in the directory you're running it from, if the `-f` filename argument is provided):

```bash
npm link
sscraper
```

#### CLI options
```
      --version  Show version number                                                  [boolean]
  -u, --url      URL to scrape                                                        [string] [required]
  -t, --targetSelectors  Optional target element selector(s) (e.g. #main, .something) [array]
  -r, --includeRaw       Include raw html dump                                        [boolean]
  -f, --filename         File name to save output to, if provided                     [string]
  -s, --silent           Do not output result to terminal                             [boolean] [default: false]
  -h, --help             Show help                                                    [boolean]
```
