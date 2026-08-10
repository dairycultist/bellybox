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

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Users';", (err, row) => {

        // create Users table if it doesn't exist
        if (!row) {
            db.run(`
                CREATE TABLE Users
                (Username TEXT, HashedPassword TEXT, SessionCookie TEXT,
                SessionCookieExpiryUnixTimestamp INTEGER, UserType INTEGER);
            `, () => {

                // add a test user
                db.run(`INSERT INTO Users VALUES ("John", "password", "", 0, 0);`);
            });
        }
    });
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

function respondImagePage(res, user, id) {

    db.get(`SELECT Description, Tags, CreationUnixTimestamp, Visibility FROM Images WHERE ROWID = "${ id }";`, (err, row) => {

        if (row) {

            if (row.Visibility == 0) {

                respondError(res, 404, "Not Found");
                return;
            }

            respondSPA(res, user,
                (row.Visibility == 1 ? "<p>This image is unlisted and awaiting moderator approval</p>" : "") +
                fs.readFileSync("./html/imagepage_widget.html", "utf8")
                    .replaceAll("<!-- filename -->", id + ".png")
                    .replaceAll("<!-- id -->", id)
                    .replace("<!-- upload time -->", new Date(row.CreationUnixTimestamp * 1000))
                    .replace("<!-- tags -->", row.Tags.length == 0 ? "∅" : (() => {

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
                    .replace("<!-- description -->", row.Description.length == 0 ? "∅" : row.Description)
                    .replace("<!-- upload user -->", "idk")
            );
        } else {

            respondError(res, 404, "Not Found");
        }
    });
}

function respondSPA(res, user, insert) {

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
            .replace("<!-- upload -->", user ? fs.readFileSync("./html/upload_widget.html", "utf8").replace("<!-- upload description -->", require("./config.json").uploadDescription) : "")
            .replace("<!-- user -->", user ? fs.readFileSync("./html/logged_in_widget.html", "utf8").replace("<!-- username -->", user.Username) : fs.readFileSync("./html/log_in_widget.html", "utf8"))
            .replace("<!-- insert -->", insert)
            .replace("<!-- tags -->", getTagInputHTML("upload"))
            .replace("<!-- tags -->", getTagInputHTML("filter"))
            .replaceAll("<!-- title -->", require("./config.json").title)
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

                const sessionCookie = (() => {

                    if (!req.headers.cookie)
                        return undefined;

                    const sessionKeyValue = req.headers.cookie.split("; ").find(item => /^session=/.test(item));

                    if (!sessionKeyValue)
                        return undefined;

                    const sessionValue = sessionKeyValue.substring(8);

                    if (sessionValue.length == 0)
                        return undefined;

                    return sessionValue;
                })();

                if (sessionCookie) {

                    // attempt to find user with that session cookie
                    // TODO also refresh the session cookie's expiry locally
                    db.get(`SELECT * FROM Users WHERE SessionCookie = "${ sessionCookie }";`, (err, user) => {

                        // TODO check SessionCookieExpiryUnixTimestamp

                        // pass user db row to endpoint if the session cookie matches to one
                        endpoint.respond(respondImagePage, respondSPA, respondError, user ? user : null, require("./config.json"), db, new URLSearchParams(req.url.split("?", 2)[1]), req, res);
                    });

                } else {

                    // null user
                    endpoint.respond(respondImagePage, respondSPA, respondError, null, require("./config.json"), db, new URLSearchParams(req.url.split("?", 2)[1]), req, res);
                }

                return;
            }
        }
    }

    // return 400 if no endpoint matched
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Endpoint\n" + requestedEndpoint);

}).listen(port, hostname, () => console.log(`Starting @ http://${ hostname }:${ port }/`));