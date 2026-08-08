const fs = require("fs");
const multiparty = require("multiparty");
const { imageSizeFromFile } = require("image-size/fromFile");

module.exports = [
    // posting an image to the booru
    {
        regex: new RegExp("^POST /post_image"),
        respond: (respondImagePage, getSPA, db, req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                const image = files.image[0];

                if (image.size == 0) {

                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Bad Request (Must Attach File)");

                } else {

                    console.log(`Recieved image ${ image.originalFilename } of size ${ image.size }b`);

                    // generate unique Base62 id for this image
                    let id = "";
                    let index = Math.floor(Math.random() * 999999999999); // TODO switch to sequential id system to prevent collisions

                    do {
                        id ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + id;
                        index = Math.floor(index / 62);
                    } while (index > 0);

                    const filename = id + "." + image.originalFilename.split(".").at(-1);
                    const filepath = "img/" + filename;

                    // get image size (for masonry)
                    imageSizeFromFile(image.path).then((image_size) => {

                        // rename downloaded image to filename based on unique id
                        fs.rename(image.path, filepath, (err) => {});

                        // add database entry
                        db.run(`
                            INSERT INTO Images VALUES ("${ id }", "${ filename }", "${ "".trim() }", "${ fields.tag.join() }", ${ Math.floor(Date.now() / 1000) }, "", "");
                        `);

                        // respond with new image's page
                        respondImagePage(res, id);
                    });
                }
            });
        }
    }
];