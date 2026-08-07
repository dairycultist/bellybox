const fs = require("fs");

module.exports = [
    // dedicated page for an image
    {
        regex: new RegExp("^GET /image/"),
        respond: (getSPA, db, req, res) => {

            db.get(`SELECT ID, Filename, Description, Tags, CreationUnixTimestamp FROM Images WHERE ID = "${ req.url.split("/").at(-1) }";`, (err, row) => {

                if (row) {

                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(getSPA(
                        fs.readFileSync("imagepage_widget.html", "utf8")
                            .replace("FILENAME", row.Filename)
                            .replaceAll("ID", row.ID)
                            .replace("UPLOADTIME", new Date(row.CreationUnixTimestamp * 1000))
                            .replace("TAGS", row.Tags.length == 0 ? "∅" : row.Tags)
                            .replace("DESCRIPTION", row.Description.length == 0 ? "∅" : row.Description)
                    ));
                } else {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Not Found");
                }
            });
        }
    }
];