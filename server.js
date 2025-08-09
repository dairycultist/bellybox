const fs = require("fs");
const { createServer } = require("node:http");

const port = 3000;
const hostname = "127.0.0.1";

function jsTimeFormat(unix) {
    return `<script>var date = new Date(${unix}); document.write(date.toLocaleDateString() + " " + date.toLocaleTimeString());</script>`;
}

function respondIndex(res, error = "") {

    var indexText = fs.readFileSync("html/index.html", "utf8");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexText);
}

function respondImage(res, path) {

    var image = fs.readFileSync("." + path);

    res.writeHead(200, { "Content-Type": "image/" + path.split(".").at(-1) });
    res.end(image);
}

function respond400(req, res) {

    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Error 400: Bad request endpoint\n" + req.method + " " + req.url);
}

function post(req, maxBytes, onExcessivelyHeavy, onSuccessfulRead) {

    var body = "";
    var didRespond = false;

    req.on("data", function (data) {

        body += data;

        // Too much POST data, kill the connection!
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

function postToIndex(req, res) {

    post(
        req,
        1e6, // 1mb
        function () {
            respondIndex(res, "Post data too heavy! Try again with fewer bytes!");
        },
        function (post) {

            // validate
            if (post.title == undefined || post.title.trim().length == 0) {
                respondIndex(res, "Please enter a title!");
                return;
            }

            if (post.title.trim().length > 80) {
                respondIndex(res, "Title must be >=80 characters!");
                return;
            }

            if (post.message == undefined || post.message.trim().length == 0) {
                respondIndex(res, "Please enter a message!");
                return;
            }

            // create thread with unique id
            post.title = post.title.trim();
            post.message = post.message.trim();
            
            var threadID = 0;

            while (db.threads[threadID] != undefined) {
                threadID = Math.floor(Math.random() * 1000);
            }

            db.threads[threadID] = {
                "title": post.title,
                "posts": [
                    {
                        "message": post.message,
                        "unixtime": Date.now()
                    }
                ]
            };

            respondIndex(res);
        }
    );
}

const server = createServer((req, res) => {

    const endpoint = req.method + " " + req.url;
    console.log(endpoint);

    try {

        // match endpoints

    } catch (err) {

        // something went wrong, and it's not the client's fault this time!
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error\n" + err);
    }
});

server.listen(port, hostname, () => console.log(`Starting @ http://${ hostname }:${ port }/`));
