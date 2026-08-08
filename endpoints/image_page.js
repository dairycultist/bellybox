const fs = require("fs");

module.exports = [
    // dedicated page for an image
    {
        regex: new RegExp("^GET /image/"),
        respond: (respondImagePage, respondSPA, db, query, req, res) => {

            respondImagePage(res, req.url.split("/").at(-1));
        }
    }
];