# simple-scraper
![dali_hacker_banner](https://user-images.githubusercontent.com/8112394/194165822-75d9cace-9561-45a7-8f0f-c29d86a79734.png)

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
sscraper -u "https://www.bbc.com" -u "https://www.cnn.com" -t "img" -t "article"
```

#### Scrape the root <html> element by default:
```bash
sscraper -u "https://www.cnn.com"
```

#### Scrape URLs via attribute and file:
```bash
sscraper -u "https://www.bbc.com" -t "img" -l "./tmp/urls.txt"
```

#### Specify custom attributes for media downloads:
```bash
sscraper -u "https://www.bbc.com" -t "img" -a "data-image-source"
```

## CLI arguments
```
  -u, --url       URL(s) to scrape.
  -l, --list      Path to a file containing newline-separated list of URLs.
  -f, --format    Download images from the target selector's child elements matching input format(s). Omit this parameter to check for all standard formats.
  -a --attribute  Look for the specified attribute(s) on media elements and collect the URL value(s) for download.
  -t, --target    Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']". Omit this parameter to target the root html element.
```
