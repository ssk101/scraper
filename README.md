# simple-scraper

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

#### CLI options
```
      --version  Show version number                                           [boolean]
  -u, --url      URL to scrape                                                 [string] [required]
  -t, --targets  Optional target element selector(s) (e.g. #main, .something)  [array]
  -r, --raw      Include raw html dump                                         [boolean]
  -h, --help     Show help                                                     [boolean]
```
