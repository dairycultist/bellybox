const fs = require("fs");
const multiparty = require("multiparty");
const { Jimp } = require("jimp");

// rate limit info is stored in memory as [ip:time_to_end_limit] pairs
const rateLimits = {};

// we could convert all the rowids to base62 for the url, but it's not really that important
// do {
//     id ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + id;
//     index = Math.floor(index / 62);
// } while (index > 0);

module.exports = [
    // posting an image to the booru
    {
        regex: new RegExp("^POST /post_image"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

            // only logged in users can post
            if (!user) {

                respondError(res, 401, "Unauthorized (you are not logged in)");
                return;
            }

            const address = req.socket.remoteAddress;

            if (!rateLimits[address])
                rateLimits[address] = 0;

            if (rateLimits[address] < Date.now()) {

                // rate limit has completely run out; set to rateLimitIncrementMinutes from now
                rateLimits[address] = Date.now() + (config.rateLimitIncrementMinutes * 60 * 1000);

            } else if (rateLimits[address] < Date.now() + (config.rateLimitThresholdMinutes * 60 * 1000)) {

                // increment rate limit
                rateLimits[address] += config.rateLimitIncrementMinutes * 60 * 1000;

            } else {

                // we've exceeded rateLimitThresholdMinutes beyond the current time; deny upload
                respondError(res, 429, "Rate Limit Exceeded (You may upload again in: "
                    + (Math.floor((rateLimits[address] - Date.now() - (config.rateLimitThresholdMinutes * 60 * 1000)) / 60 / 100) / 10)
                    + "m)");
                return;
            }

            new multiparty.Form().parse(req, function(err, fields, files) {

                const image = files.image[0];

                if (image.size == 0) {

                    respondError(res, 400, "Bad Request (Must Attach File)");

                } else {

                    console.log(`Received image ${ image.originalFilename } of size ${ image.size }b from ${ req.socket.remoteAddress } (forwarded for: ${ req.headers["x-forwarded-for"] })`);

                    if (image.size > 1000000000) { // 1GB

                        respondError(res, 400, "Image too large! Maximum upload size 1GB.");
                        return;
                    }

                    // add database entry
                    db.run(`INSERT INTO Images VALUES ("${ fields.description[0].trim().replaceAll(/  +/g, " ").replaceAll(/\n\s*/g, "<br>") }", "${ fields.tag ? fields.tag.join() : "" }", ${ Math.floor(Date.now() / 1000) }, "", ${ config.visibilityOnUpload == "public" ? 2 : config.visibilityOnUpload == "unlisted" ? 1 : 0 });`,
                        async function(err) {

                            if (err) {
                                console.log(err);
                                respondError(res, 500, "Server messed up");
                            }

                            const rowid = "" + this.lastID;

                            try {

                                // sanitize uploaded image (check if it's even an image, and copy over
                                // JUST graphics, ignoring metadata or other stuff)
                                const uploadedImage = await Jimp.read(image.path);
                                const sanitizedImage = await new Jimp({ width: uploadedImage.bitmap.width, height: uploadedImage.bitmap.height });

                                sanitizedImage.blit(uploadedImage, 0, 0);

                                // save as png based on unique rowid
                                await sanitizedImage.write("img/" + rowid + ".png");

                                // delete temp image
                                fs.unlink(image.path, () => {});

                                // respond with new image's page
                                respondImagePage(res, user, rowid);

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