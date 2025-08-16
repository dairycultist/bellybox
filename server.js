const fs = require("fs");
const multiparty = require("multiparty");
const { imageSizeFromFile } = require("image-size/fromFile");
const { createServer } = require("node:http");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("db");

db.serialize(() => {

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Images';", (err, row) => {

        // create Images table if it doesn't exist
        if (!row) {
            db.run(`
                    CREATE TABLE Images
                    (ID TEXT, Filename TEXT, MasonryFlex UNSIGNED FLOAT, Description TEXT, Tags TEXT,
                    CreationTimestamp INTEGER, DeleteRequest TEXT, RetagRequest TEXT);
            `);
        }
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

                // adding this at the end prevents the last row from filling the whole row
                images += "<div style='flex: 200000;'></div>";
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

                const image = files.image[0];

                if (fields.postcode != postcode) {

                    res.writeHead(401, { "Content-Type": "text/plain" });
                    res.end("401 Unauthorized (Invalid Postcode)");

                } else if (image.size == 0) {

                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Bad Request (Must Attach File)");

                } else {

                    console.log(`Recieved image ${ image.originalFilename } of size ${ image.size }b`);

                    // generate unique Base62 ID for this image
                    let ID = '';
                    let index = Math.floor(Math.random() * 999999999999); // TODO switch to sequential ID system to prevent collisions

                    do {
                        ID ='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(index % 62) + ID;
                        index = Math.floor(index / 62);
                    } while (index > 0);

                    const filename = ID + "." + image.originalFilename.split(".").at(-1);
                    const filepath = "img/" + filename;

                    // get image size (for masonry)
                    imageSizeFromFile(image.path).then((image_size) => {

                        // rename downloaded image to filename based on unique ID
                        fs.rename(image.path, filepath, (err) => {});

                        // add database entry (300 is the min row height)
                        db.run(`INSERT INTO Images VALUES ("${ ID }", "${ filename }", ${ 300 * image_size.width / image_size.height }, "", "", 0, "", "");`);

                        // load index
                        endpoints[0].respond(req, res);
                    });
                }
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
                    res.end(fs.readFileSync("SPA.html", "utf8").replace("<!-- insert -->", `
                        <img src="/img/${ row.Filename }" style="max-width: 100%; max-height: 90vh;">
                        <br>
                        <form action="/request_deletion">
                            <strong>Request deletion</strong>
                            <br><br>
                            <table>
                                <tr>
                                    <td><label for="reason">Reason: </label></td>
                                    <td><input type="text" id="reason" name="reason" placeholder="Duplicate, inappropriate, copyright..." style="width: 400px;"></td>
                                </tr>
                            </table>
                            <input type="submit" value="Submit"/>
                        </form>
                        <!--<form action="/request_retag">
                            <strong>Request retag</strong>
                            <br><br>
                            <table>
                                <tr>
                                    <td><label for="reason">Reason: </label></td>
                                    <td><input type="text" id="reason" name="reason" style="width: 400px;"></td>
                                </tr>
                            </table>
                            <input type="submit" value="Submit"/>
                        </form>-->
                    `));
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
