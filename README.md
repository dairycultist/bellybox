# bellybox

A lightweight, open-source booru software specifically for **drawings of fat women**. Client need not Javascript! 

## Features

- [x] Image uploading without id collisions
- [x] Image viewing (search page and dedicated page)
- [x] Tagging images (with preset tags loaded from `config.json`)
- [ ] Giving descriptions to images
- [x] Searching by tag
- [x] Searching by description substring (good for searching by author or specific content not covered by tags)
- [x] Pagination
- [ ] Request deletion
- [ ] Request edit
- [ ] Thumbnail saving (ID_thumb.png, much smaller)
- [ ] Regular, automatic backups
- [ ] Security (rate limiting, prevent non-image uploads, prevent crashes from input fudging)
- [ ] Automatic launcher script that also initiates a program that puts the server back up if it goes down...

No forum/commenting planned, since moderating images is enough work for me already.

## Dependencies

```
npm install sqlite3
npm install multiparty
npm install image-size
```

https://www.npmjs.com/package/multiparty

https://www.npmjs.com/package/sqlite3
