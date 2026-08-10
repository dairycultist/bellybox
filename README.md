# bellybox

A lightweight, open-source booru software written in Node.js. Client need not Javascript!

Designed for use as a 'drawings of fat women' booru, but this is easily changed through configuration.

## Features

No forum/commenting planned, since it makes moderating harder and encourages toxicity.

### Not features but things I should give attention to before launch

- Prevent crashes from input fudging
- Prevent crashes from not handling `err` outputs
- Refactor to improve readability, abstraction, and code-reuse

### Basic Functionality

- [x] Image uploading
  - Every image gets a unique ID
  - Non-images don't break the server
  - The image is sanitized (stripped of metadata and forced to png format)
  - Images may be `public`, `unlisted`, or `hidden` (default on upload is configurable from `config.json`; `hidden` if no value is provided)
- [x] Image viewing (search page and dedicated page)
- [x] Tagging images (with preset tags loaded from `config.json`)
- [x] Giving descriptions to images (that get sanitized! whitespace + max length enforced)
- [x] Filtering by tag
- [ ] Filtering by description substring (for searching by author or specific content not covered by tags)
- [ ] Advanced filtering (`include`, `exclude`, `and`, `or`, etc)
- [x] Pagination

### Moderation/Quality Control

- [x] Account system
  - Username + password registration (no email required)
  - Only logged-in users may upload images
  - Passwords are stored salted and hashed
  - TODO Automatic logout after certain amount of time inactive (configurable from `config.json`) 
  - TODO Only the server owner can create accounts
  - TODO User may change their password using their current password
  - TODO Accounts can be `untrusted`, `trusted` (much more lenient rate limiting), or `moderator` (can view extra info about images like their visibility and logs, filter images by visibility, modify image info, and delete images)
- [x] "Console mode" (by passing `--console` command line argument)
  - `logs` - prints all edit/deletion requests 
  - `delete <id>` - deletes an image from the db/filesystem
  - `(v)isibility <hidden/unlisted/public> <id>` - Changes the visibility of an image
  - `info <id>` - Prints all info on the image (description, visibility, etc)
  - TODO `createuser <username>` - Creates a new user (with trust `untrusted`) with the provided username, outputting a temporary password for the user to then log in with and change their password using.
  - TODO `userinfo <username>`
  - TODO `trustuser <username> <trustlevel>`
  - TODO `resetpassword <username>`
- [x] Hide uploaded images (if default on upload is set to non-`public`) until they are manually vetted by a mod
- [x] Request edit/deletion
- [ ] PhotoDNA integration

### Security/Damage Control

- [ ] HTTPS
- [x] IP rate limiting (configurable with `config.json`)
- [ ] Regular, automatic, off-server backups (as a zip)

### Miscellaneous

- [ ] Thumbnail saving (ID_thumb.png, much smaller)
- [ ] Automatic launcher script that also initiates a program that puts the server back up if it goes down...
- [ ] RSS feed (perhaps an RSS feed tied to particular artist tags, i.e. "Follow Username483 via RSS for more auto-feed updates")
- [ ] Find good server provider and domain provider that aren't averse to goon content and have good storage and security (DDoS attacks and stuff)

## Dependencies

```
npm install sqlite3
npm install multiparty
npm install jimp
```

https://www.npmjs.com/package/multiparty

https://www.npmjs.com/package/sqlite3

https://www.npmjs.com/package/jimp