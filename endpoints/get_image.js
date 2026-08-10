const fs = require("fs");

module.exports = [
    {
        regex: new RegExp("^GET /img/"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

            db.get(`SELECT Visibility FROM Images WHERE ROWID = "${ req.url.substring(5).split(".")[0] }";`, (err, row) => {

                // don't serve images that aren't in the db or that are hidden
                if (!row || row.Visibility == 0) {

                    respondError(res, 404, "Image Not Found");
                    return;
                }

                try {

                    const image = fs.readFileSync("." + req.url);

                    res.writeHead(200, { "Content-Type": "image/" + req.url.split(".").at(-1) });
                    res.end(image);

                    console.log("Response: " + req.url);

                } catch (error) {

                    respondError(res, 404, "Image Not Found");
                }
            });
        }
    },
    {
        regex: new RegExp("^GET /res/"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

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