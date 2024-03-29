# Scraper
![dali_hacker_banner](https://user-images.githubusercontent.com/8112394/194165822-75d9cace-9561-45a7-8f0f-c29d86a79734.png)

### Description
HTML media scraper using [Cheerio](https://cheerio.js.org).

### Features
- CLI
- Multiple URL targets
- Multiple selector targets
- Supply list of URLs to scrape from file
- Scrape a range of pages from the same host via start and end integers
- Save the resulting DOM tree as JSON per hostname
- Find image URLs in element attributes, including `style` CSS content
- Provide element attributes to check for media URLs
- Provide media formats to target specific MIME types for media downloads
- Organizes directories per hostname and sanitizes downloaded media filenames
- Resize downloaded images via sharp with aspect ratio preservation customisation

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
#### Scrape <img> elements (default element target if `-t` is omitted):
```bash
sscraper -u "https://www.cnn.com"
```

#### Scrape two URLs, collect the JSON for <img> and <article> elements found and attempt to download their media content:
```bash
sscraper -d -u "https://www.bbc.com" -u "https://www.cnn.com" -t "img" -t "article"
```

#### Scrape a range of pages from the same host (using the syntax `{{[start]-[end]}}`):
```bash
sscraper -u "https://www.bbc.com/images/{{42-101}}/image.jpg"
```

#### Scrape URLs via attribute and file:
```bash
sscraper -u "https://www.bbc.com" -t "img" -l "./tmp/urls.txt"
```

#### Specify custom attributes for media downloads:
```bash
sscraper -u "https://www.bbc.com" -t "img" -a "data-image-source"
```

#### Advanced JSON targets structure
```json
[
  {
    "href": "https://some.website.com/textures//index.php?page={{1-9}}",
    "targets": [{
      "selector": ".main-content .product iframe[src^=\"https://follow\"]",
      "attribute": "src",
      "namespace": ["wood", "oak"],
      "followSrc": {
        "selector": "script[type=\"text/javascript\"][src=\"//follow.this.net/something.js\"] + a",
        "attribute": "innerText"
      }
    }]
  }
]
```

- `href` (string): **Required**. The URL to scrape all `targets` from. The `{{n-n}}` syntax can be used to specify a range of pages to scrape sequentially instead of needing to create individual items per page, if the href is otherwise identical for each page in the range.
- `targets` (array): **Required**. Array of targets the scraper will look for. Can be an array of CSS selector strings () or an array of objects with the properties:
- `selector` (string): **Required**. The CSS selector for targeting the media element.
- `attribute` (string): _Optional_ The attribute which holds the href of the media element or the base64 string if the element is inlined. If omitted, the scraper will look for `data-src`, `src` and `style`.
- `namespace` (array): _Optional_. The subdirectory the found media elements will be placed in
- `followSrc` (object): _Optional_. This will follow a redirect to the target media element. The `followSrc` object can nest itself to traverse deeper. Must have the `selector` and `attribute` properties.


## CLI arguments
```
  -u, --url       URL(s) to scrape.
  -l, --list      Path to a file containing newline-separated list of URLs.
  -f, --format    Download images from the target selector's child elements matching input format(s).
  -a --attribute  Look for the specified attribute(s) on media elements and collect the URL value(s) for download.
  -t, --target    Target selector(s) to scrape and/or search for media sources in. e.g. "#main", ".some-class > p", "input[name='radios']".
  -r, --resize    Resize downloaded images to specified "[width]x[height]" dimensions. Example: -r 300x300
  -f, --fit       Use a specific method to fit an image after resizing. Defaults to "contain" which will preserve the aspect ratio and letterbox the image if needed. https://sharp.pixelplumbing.com/api-resize#resize for details about each method.
```
