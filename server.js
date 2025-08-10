const fs = require("fs");
var multiparty = require("multiparty");
const { createServer } = require("node:http");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("db");

db.serialize(() => {

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Images';", (err, row) => {

        // create Images table if it doesn't exist
        if (!row)
            db.run("CREATE TABLE Images (ID TEXT, Filename TEXT, MasonryFlex UNSIGNED FLOAT);"); // Tags TEXT "furry;biggest", Description TEXT, CreationTimestamp INTEGER
    });
});

const port = 3000;
const hostname = "127.0.0.1";
const postcode = "ABC";

const endpoints = [
    // index
    {
        regex: new RegExp("^GET /$"),
        respond: (req, res) => {

            let images = "<div style='display: flex; flex-wrap: wrap;'>";

            db.each("SELECT ID, Filename, MasonryFlex FROM Images;", (err, row) => {

                images += `<a href="image/${ row.ID }" style="flex: ${ row.MasonryFlex } 1 ${ row.MasonryFlex }px; width: ${ row.MasonryFlex }px;"><img src="/img/${ row.Filename }" style="width: 100%;"></a>`;

            }, () => {

                images += "</div>";
                
                // respond on complete
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(fs.readFileSync("SPA.html", "utf8").replace("<!-- insert -->", images));
            });
        }
    },
    // fetching an image file
    {
        regex: new RegExp("^GET /img/"),
        respond: (req, res) => {

            const image = fs.readFileSync("." + req.url);

            res.writeHead(200, { "Content-Type": "image/" + req.url.split(".").at(-1) });
            res.end(image);
        }
    },
    // posting an image to the booru
    {
        regex: new RegExp("^POST /post_image"),
        respond: (req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                if (fields.postcode == postcode) {

                    const image = files.image[0];

                    console.log(`Recieved image ${ image.originalFilename } of size ${ image.size }b`);

                    // generate unique Base62 ID for this image
                    let ID = '';
                    let index = Math.floor(Math.random() * 999999999999); // TODO switch to sequential ID system to prevent collisions

                    do {
                        ID ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + ID;
                        index = Math.floor(index / 62);
                    } while (index > 0);

                    // rename downloaded image to filename based on unique ID
                    const filename = ID + "." + image.originalFilename.split(".").at(-1);

                    fs.rename(image.path, "img/" + filename, (err) => {});

                    // add database entry
                    db.run(`INSERT INTO Images VALUES ("${ ID }", "${ filename }", ${ 1.0 });`);
                }

                endpoints[0].respond(req, res);
            });
        }
    },
    // dedicated page for an image
    {
        regex: new RegExp("^GET /image/"),
        respond: (req, res) => {

            db.get(`SELECT Filename FROM Images WHERE ID = "${ req.url.split("/").at(-1) }";`, (err, row) => {

                if (row) {
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(fs.readFileSync("SPA.html", "utf8").replace("<!-- insert -->", `<img src="/img/${ row.Filename }" style="max-width: 100%; max-height: 90vh;">`));
                } else {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Not Found");
                }
            });
        }
    }
];

createServer((req, res) => {

    const requested_endpoint = req.method + " " + req.url;
    console.log(requested_endpoint);

    // match endpoints
    for (const endpoint of endpoints) {

        if (endpoint.regex.test(requested_endpoint)) {

            endpoint.respond(req, res);
            return;
        }
    }

    // return 400 if no endpoint matched
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Endpoint\n" + requested_endpoint);

}).listen(port, hostname, () => console.log(`Starting @ http://${ hostname }:${ port }/`));
