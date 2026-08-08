const fs = require("fs");

module.exports = [
    // fetching an image file
    {
        regex: new RegExp("^GET /img/|^GET /res/"),
        respond: (respondImagePage, getSPA, db, req, res) => {

            try {
                const image = fs.readFileSync("." + req.url);

                res.writeHead(200, { "Content-Type": "image/" + req.url.split(".").at(-1) });
                res.end(image);

            } catch (error) {

                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");
            }
        }
    }
];