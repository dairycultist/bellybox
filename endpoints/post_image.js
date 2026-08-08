const fs = require("fs");
const multiparty = require("multiparty");
const { Jimp } = require("jimp");

// we could convert all the rowids to base62 for the url, but it's not really that important
// do {
//     id ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + id;
//     index = Math.floor(index / 62);
// } while (index > 0);

module.exports = [
    // posting an image to the booru
    {
        regex: new RegExp("^POST /post_image"),
        respond: (respondImagePage, respondSPA, respondError, db, query, req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                const image = files.image[0];

                if (image.size == 0) {

                    respondError(res, 400, "Bad Request (Must Attach File)");

                } else {

                    console.log(`Received image ${ image.originalFilename } of size ${ image.size }b`);

                    if (image.size > 1000000000) { // 1GB

                        respondError(res, 400, "Image too large! Maximum upload size 1GB.");
                        return;
                    }

                    const fileType = image.originalFilename.split(".").at(-1);

                    // add database entry
                    db.run(`INSERT INTO Images VALUES ("${ fileType }", "${ fields.description[0].trim().replaceAll(/  +/g, " ").replaceAll(/\n\s*/g, "<br>") }", "${ fields.tag.join() }", ${ Math.floor(Date.now() / 1000) }, "");`,
                        async function(err) {

                            if (err) {
                                console.log(err);
                                respondError(res, 300, "Server messed up");
                            }

                            const rowid = "" + this.lastID;

                            try {

                                // sanitize uploaded image (check if it's even an image, and copy over
                                // JUST graphics, ignoring metadata or other stuff)
                                const uploadedImage = await Jimp.read(image.path);
                                const sanitizedImage = await new Jimp({ width: uploadedImage.bitmap.width, height: uploadedImage.bitmap.height });

                                sanitizedImage.blit(uploadedImage, 0, 0);

                                // save as png based on unique rowid
                                await sanitizedImage.write("img/" + rowid + "." + fileType);

                                // delete temp image
                                fs.unlink(image.path, () => {});

                                // respond with new image's page
                                respondImagePage(res, rowid);

                            } catch (e) {

                                respondError(res, 400, "Invalid input!");
                            }
                        }
                    );
                }
            });
        }
    }
];