# bellybox

A lightweight, open-source booru software specifically for **drawings of fat women**. Client need not Javascript! 

## Features

- [x] Image uploading
  - Every image gets a unique ID
  - Non-images don't break the server
  - The image is sanitized (stripped of metadata and forced to png format)
  - Images may be `public`, `unlisted`, or `hidden` (default on upload is configurable from `config.json`; `hidden` if no value is provided)
- [x] Image viewing (search page and dedicated page)
- [x] Tagging images (with preset tags loaded from `config.json`)
- [x] Giving descriptions to images (that get sanitized! whitespace + max length enforced)
- [x] Filtering by tag
- [ ] Filtering by description substring (good for searching by author or specific content not covered by tags)
- [ ] Advanced filtering (include, exclude, and, or, whatever)
- [x] Pagination
- [x] Request edit/deletion
- [ ] Thumbnail saving (ID_thumb.png, much smaller)
- [ ] Regular, automatic, off-server backups (as a zip)
- [x] IP rate limiting (configurable with `config.json`)
- [ ] Prevent crashes from input fudging
- [ ] Prevent crashes from not handling `err` outputs
- [x] "Console mode" (by passing `--console` command line argument)
  - `logs` - prints all edit/deletion requests 
  - `delete <id>` - deletes an image from the db/filesystem
  - `(v)isibility <hidden/unlisted/public> <id>` - Changes the visibility of an image
  - `info <id>` - Prints info on the image (description, visibility, etc)
- [ ] Automatic launcher script that also initiates a program that puts the server back up if it goes down...
- [ ] Hide uploaded images until they are manually vetted by a mod (prevents trolling!!)
- [ ] PhotoDNA integration
- [ ] HTTPS
- [ ] RSS feed (perhaps an RSS feed tied to particular artist tags, i.e. "Follow Username483 via RSS for more auto-feed updates")
- [ ] Find good server provider and domain provider that aren't averse to goon content and have good storage and security (DDoS attacks and stuff)

No forum/commenting planned, since moderating images is enough work for me already.

## Dependencies

```
npm install sqlite3
npm install multiparty
npm install jimp
```

https://www.npmjs.com/package/multiparty

https://www.npmjs.com/package/sqlite3
