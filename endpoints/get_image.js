const fs = require("fs");

module.exports = [
    // fetching an image file
    {
        regex: new RegExp("^GET /img/|^GET /res/"),
        respond: (respondImagePage, respondSPA, respondError, config, db, query, req, res) => {

            try {
                const image = fs.readFileSync("." + req.url);

                res.writeHead(200, { "Content-Type": "image/" + req.url.split(".").at(-1) });
                res.end(image);

                console.log("Response: " + req.url);

            } catch (error) {

                respondError(res, 404, "Image Not Found");
            }
        }
    }
];