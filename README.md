# bellybox

A lightweight, open-source booru software specifically for **drawings of fat women**. Client need not Javascript! 

## Features

- [x] Image uploading (that gets sanitized! non-images don't break the server!) without id collisions
- [x] Image viewing (search page and dedicated page)
- [x] Tagging images (with preset tags loaded from `config.json`)
- [x] Giving descriptions to images (that get sanitized! whitespace + max length enforced)
- [x] Searching by tag
- [ ] Searching by description substring (good for searching by author or specific content not covered by tags)
- [x] Pagination
- [x] Request edit/deletion
- [ ] Thumbnail saving (ID_thumb.png, much smaller)
- [ ] Regular, automatic backups
- [ ] IP rate limiting
- [ ] Prevent crashes from input fudging
- [ ] Prevent crashes from not handling `err` outputs
- [x] "Console mode" (by passing `--console` command line argument) that lets you do moderator stuff
- [ ] Automatic launcher script that also initiates a program that puts the server back up if it goes down...

No forum/commenting planned, since moderating images is enough work for me already.

## Dependencies

```
npm install sqlite3
npm install multiparty
npm install jimp
```

https://www.npmjs.com/package/multiparty

https://www.npmjs.com/package/sqlite3
