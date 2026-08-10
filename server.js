const fs = require("fs");
const { createServer } = require("node:http");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("db");

if (!fs.existsSync("./img"))
    fs.mkdir("./img", "0777", (err) => {});

db.serialize(() => {

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Images';", (err, row) => {

        // create Images table if it doesn't exist
        if (!row) {
            db.run(`
                    CREATE TABLE Images
                    (Description TEXT, Tags TEXT, CreationUnixTimestamp INTEGER, InfoLog TEXT, Visibility INTEGER);
            `);
        }
    });

    // TODO create Users table if it doesn't exist
});

if (process.argv.includes("--console")) {

    console.log("ENTERING CONSOLE MODE! SERVER IS NOT LAUNCHING.");
    console.log();
    for (const file of fs.readdirSync("./commands/"))
        console.log(require("./commands/" + file).helptext);
    console.log();

    const choice = require("readline-sync").question(">");
    console.log();

    for (const file of fs.readdirSync("./commands/")) {

        if (choice.startsWith(require("./commands/" + file).command)) {

            require("./commands/" + file).run(db, choice.split(" "));
        }
    }
    
    return;
}

function respondImagePage(res, id) {

    db.get(`SELECT Description, Tags, CreationUnixTimestamp, Visibility FROM Images WHERE ROWID = "${ id }";`, (err, row) => {

        if (row) {

            if (row.Visibility == 0) {

                respondError(res, 404, "Not Found");
                return;
            }

            respondSPA(res,
                (row.Visibility == 1 ? "<p>This image is unlisted and awaiting moderator approval</p>" : "") +
                fs.readFileSync("./html/imagepage_widget.html", "utf8")
                    .replace("FILENAME", id + ".png")
                    .replaceAll("ID", id)
                    .replace("UPLOADTIME", new Date(row.CreationUnixTimestamp * 1000))
                    .replace("TAGS", row.Tags.length == 0 ? "∅" : (() => {

                        const internalTags = row.Tags.split(",");
                        let displayTags = "";

                        for (const internalTag of internalTags) {
                            for (const tag of require("./config.json").tags) {

                                if (tag.internal == internalTag) {

                                    displayTags += tag.display + ", ";
                                    break;
                                }
                            }
                        }

                        if (displayTags.length >= 0) {
                            displayTags = displayTags.substring(0, displayTags.length - 2);
                        }

                        return displayTags;
                    })())
                    .replace("DESCRIPTION", row.Description.length == 0 ? "∅" : row.Description)
            );
        } else {

            respondError(res, 404, "Not Found");
        }
    });
}

function respondSPA(res, insert) {

    const getTagInputHTML = (idUniquifier) => {

        let construct = "";

        for (const tag of require("./config.json").tags) {

            // TODO "checked" attribute on filter tags that are selected
            construct += `
                <input type="checkbox" name="tag" id="${ tag.internal }_${ idUniquifier }" value="${ tag.internal }">
                <label for="${ tag.internal }_${ idUniquifier }">${ tag.icon ? `<img src="${ tag.icon }" style="vertical-align: middle; height: 30px;">` : "" } ${ tag.display }</label>
                <br>
            `;
        }

        return construct;
    };

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
        fs.readFileSync("./html/SPA.html", "utf8")
            .replace("<!-- user -->", true ? fs.readFileSync("./html/log_in_widget.html", "utf8") : fs.readFileSync("./html/logged_in_widget.html", "utf8"))
            .replace("<!-- insert -->", insert)
            .replace("<!-- tags -->", getTagInputHTML("upload"))
            .replace("<!-- tags -->", getTagInputHTML("filter"))
            .replaceAll("<!-- title -->", require("./config.json").title)
            .replaceAll("<!-- upload description -->", require("./config.json").uploadDescription)
    );

    console.log("Response: SPA");
}

function respondError(res, code, message) {

    res.writeHead(code, { "Content-Type": "text/plain" });
    res.end(code + " " + message);

    console.log("Response: " + code + " " + message);
}

const port = 3000;
const hostname = "127.0.0.1";

const endpoints = (() => {

    try {

        const endpointHandlers = [];

        for (const file of fs.readdirSync("./endpoints/")) {

            console.log("Endpoint: " + file);

            endpointHandlers.push(...require("./endpoints/" + file));
        }

        return endpointHandlers;

    } catch (err) {

        console.error("Error reading ./endpoints/ directory:\n", err);
        process.exit();
    }
})();

createServer((req, res) => {

    const requestedEndpoint = req.method + " " + req.url;
    console.log(requestedEndpoint);

    if (!requestedEndpoint.includes("..")) {

        // match endpoints
        for (const endpoint of endpoints) {

            if (endpoint.regex.test(requestedEndpoint)) {

                endpoint.respond(respondImagePage, respondSPA, respondError, require("./config.json"), db, new URLSearchParams(req.url.split("?", 2)[1]), req, res);
                return;
            }
        }
    }

    // return 400 if no endpoint matched
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Endpoint\n" + requestedEndpoint);

}).listen(port, hostname, () => console.log(`Starting @ http://${ hostname }:${ port }/`));