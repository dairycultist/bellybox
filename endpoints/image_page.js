module.exports = [
    // dedicated page for an image
    {
        regex: new RegExp("^GET /image/"),
        respond: (respondImagePage, respondSPA, respondError, db, query, req, res) => {

            respondImagePage(res, req.url.split("/").at(-1));
        }
    }
];