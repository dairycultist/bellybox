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
                    (FileType TEXT, Description TEXT, Tags TEXT,
                    CreationUnixTimestamp INTEGER, InfoLog TEXT);
            `);
        }
    });
});

if (process.argv.includes("--console")) {

    console.log("ENTERING CONSOLE MODE! SERVER IS NOT LAUNCHING.");

    console.log("Printing all images with non-empty InfoLogs...");

    db.each(`SELECT rowid, InfoLog FROM Images WHERE InfoLog != "";`, (err, row) => {

        console.log("\nid>>>" + row.rowid);
        console.log(row.InfoLog);

    }, () => {});

    return;
}

function respondImagePage(res, id) {

    db.get(`SELECT FileType, Description, Tags, CreationUnixTimestamp FROM Images WHERE ROWID = "${ id }";`, (err, row) => {

        if (row) {

            respondSPA(res,
                fs.readFileSync("imagepage_widget.html", "utf8")
                    .replace("FILENAME", id + "." + row.FileType)
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
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
        }
    });

    console.log("Response: Image page " + id);
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
        fs.readFileSync("SPA.html", "utf8")
            .replace("<!-- insert -->", insert)
            .replace("<!-- tags -->", getTagInputHTML("upload"))
            .replace("<!-- tags -->", getTagInputHTML("filter"))
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
        const endpointFiles = fs.readdirSync("./endpoints/");

        for (const file of endpointFiles) {

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

                endpoint.respond(respondImagePage, respondSPA, respondError, db, new URLSearchParams(req.url.split("?", 2)[1]), req, res);
                return;
            }
        }
    }

    // return 400 if no endpoint matched
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Endpoint\n" + requestedEndpoint);

}).listen(port, hostname, () => console.log(`Starting @ http://${ hostname }:${ port }/`));




// // delete an image (this is just gonna be a server-side command instead of working through the UI)
// {
//     regex: new RegExp("^POST /force_delete"),
//     respond: (req, res) => {

//         new multiparty.Form().parse(req, function(err, fields, files) {

//             if (err) {

//                 res.writeHead(400, { "Content-Type": "text/plain" });
//                 res.end("400 Could not parse request");
//                 return;
//             }

//             if (fields.admincode != admincode) {

//                 res.writeHead(401, { "Content-Type": "text/plain" });
//                 res.end("401 Unauthorized (Invalid Admincode)");
//                 return;
//             }

//             db.get(`SELECT FileType FROM Images WHERE ID = "${ fields.id }";`, (err, row) => {

//                 // ensure DB entry exists for this ID
//                 if (!row) {

//                     res.writeHead(404, { "Content-Type": "text/plain" });
//                     res.end("404 Not Found");
//                     return;
//                 }

//                 // delete entry
//                 db.run(`DELETE FROM Images WHERE ID = "${ fields.id }"`);

//                 // delete file
//                 if (fs.existsSync("img/" + row.FileType)) {
//                     fs.unlinkSync("img/" + row.FileType);
//                 }

//                 // load index
//                 endpoints[0].respond(req, res);
//             });
//         });
//     }
// },