const fs = require("fs");
const qs = require("querystring");
const { createServer } = require("node:http");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(":memory:");

const port = 3000;
const hostname = "127.0.0.1";

function post(req, maxBytes, onExcessivelyHeavy, onSuccessfulRead) {

    var body = "";
    var didRespond = false;

    req.on("data", function (data) {

        body += data;

        // too much POST data, kill the connection!
        if (!didRespond && body.length > maxBytes) {
            onExcessivelyHeavy();
            didRespond = true;
        }
    });

    req.on("end", function () {

        if (didRespond)
            return;

        onSuccessfulRead(qs.parse(body));
    });
}

const endpoints = [
    {
        regex: new RegExp("^GET /$"),
        respond: (req, res) => {

            const indexText = fs.readFileSync("index.html", "utf8");

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(indexText);
        }
    },
    {
        regex: new RegExp("^GET /img/"),
        respond: (req, res) => {

            const image = fs.readFileSync("." + req.url);

            res.writeHead(200, { "Content-Type": "image/" + req.url.split(".").at(-1) });
            res.end(image);
        }
    },
    {
        regex: new RegExp("^POST /post_image"),
        respond: (req, res) => {

            post(req, 1e7, // 10mb
                () => {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("400 Post data too heavy! Try again with fewer bytes!");
                },
                (post) => {

                    var imageID = Math.floor(Math.random() * 1000);

                    console.log(post);

                    endpoints[0].respond(req, res);
                }
            );
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
