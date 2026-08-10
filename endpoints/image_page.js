module.exports = [
    // dedicated page for an image
    {
        regex: new RegExp("^GET /image/"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

            respondImagePage(res, user, req.url.split("/").at(-1));
        }
    }
];