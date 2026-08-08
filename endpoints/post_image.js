const fs = require("fs");
const multiparty = require("multiparty");
const { imageSizeFromFile } = require("image-size/fromFile");

module.exports = [
    // posting an image to the booru
    {
        regex: new RegExp("^POST /post_image"),
        respond: (respondImagePage, respondSPA, db, query, req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                const image = files.image[0];

                if (image.size == 0) {

                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Bad Request (Must Attach File)");

                } else {

                    console.log(`Received image ${ image.originalFilename } of size ${ image.size }b`);

                    // // to base62
                    // do {
                    //     id ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + id;
                    //     index = Math.floor(index / 62);
                    // } while (index > 0);

                    const fileType = image.originalFilename.split(".").at(-1);

                    // get image size (for masonry)
                    imageSizeFromFile(image.path).then((image_size) => {

                        // add database entry
                        db.run(`INSERT INTO Images VALUES ("${ fileType }", "${ "".trim() }", "${ fields.tag.join() }", ${ Math.floor(Date.now() / 1000) }, "", "");`,
                            function(err) {

                                const rowid = "" + this.lastID;

                                // rename downloaded image based on unique rowid
                                fs.rename(image.path, "img/" + rowid + "." + fileType, (err) => {});

                                // respond with new image's page
                                respondImagePage(res, rowid);
                            }
                        );
                    });
                }
            });
        }
    }
];