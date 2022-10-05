# simple-scraper

### Description
Simple HTML scraper using [Cheerio](https://cheerio.js.org).

### Features
- CLI
- Multiple URL targets
- Multiple selector targets
- Supply list of URLs to scrape from file
- Save the resulting DOM tree as JSON per hostname
- Find image URLs in element attributes, including `style` CSS content
- Provide element attributes to check for media URLs
- Provide media formats to target specific MIME types for media downloads
- Organizes directories per hostname and sanitizes downloaded media filenames

### To be implemented:
- Download of other media types (video streams, blobs, etc.)

## Setup
#### Install dependencies:
```bash
npm install
```

#### Make the CLI globally linked
```bash
npm link
```

#### Start the server
```bash
npm run server
```

## Usage
#### Scrape two URLs, collect the JSON for <img> and <article> elements found and attempt to download their media content:
```bash
sscraper -d -u "https://www.bbc.com" -u "https://www.cnn.com" -t "img" -t "article"
```
 
#### Scrape the root <html> element by default:
```bash
sscraper -u "https://www.bbc.com"
```

#### Scrape URLs from a file:
```bash
sscraper -u "https://www.reddit.com" -t "img" -l "./tmp/urls.txt"
```
  
#### Specify custom attributes for media downloads:
```bash
sscraper -u "https://www.reddit.com" -t "img" -l "./tmp/urls.txt"
```

## CLI arguments
```
  -u, --url       URL(s) to scrape.
  -l, --list      Path to a file containing newline-separated list of URLs.
  -f, --format    Download images from the target selector's child elements matching input format(s). Omit this parameter to check for all standard formats.
  -a --attribute  Look for the specified attribute(s) on media elements and collect the URL value(s) for download.
  -t, --target    Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']". Omit this parameter to target the root html element.
```
