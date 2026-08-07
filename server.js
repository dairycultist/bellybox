const fs = require("fs");
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
                    CreationUnixTimestamp INTEGER, EditRequest TEXT, DeleteRequest TEXT);
            `);
        }
    });
});

const tags = [
    { internal: "humanoid", display: "Humanoid" },
    { internal: "furry", display: "Furry" },
    { internal: "loli", display: "Deburori" }
];

function getSPA(insert) {

    const getTagInputHTML = (idUniquifier) => {

        let construct = "";

        for (const tag of tags) {

            construct += `
                <input type="checkbox" name="tag" id="${ tag.internal }_${ idUniquifier }" value="${ tag.internal }">
                <label for="${ tag.internal }_${ idUniquifier }"> ${ tag.display }</label>
                <br>
            `;
        }

        return construct;
    };

    return fs.readFileSync("SPA.html", "utf8")
        .replace("<!-- insert -->", insert)
        .replace("<!-- tags -->", getTagInputHTML("upload"))
        .replace("<!-- tags -->", getTagInputHTML("filter"));
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

    const requested_endpoint = req.method + " " + req.url;
    console.log(requested_endpoint);

    if (!requested_endpoint.includes("..")) {

        // match endpoints
        for (const endpoint of endpoints) {

            if (endpoint.regex.test(requested_endpoint)) {

                endpoint.respond(getSPA, db, req, res);
                return;
            }
        }
    }

    // return 400 if no endpoint matched
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Endpoint\n" + requested_endpoint);

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

//             db.get(`SELECT Filename FROM Images WHERE ID = "${ fields.id }";`, (err, row) => {

//                 // ensure DB entry exists for this ID
//                 if (!row) {

//                     res.writeHead(404, { "Content-Type": "text/plain" });
//                     res.end("404 Not Found");
//                     return;
//                 }

//                 // delete entry
//                 db.run(`DELETE FROM Images WHERE ID = "${ fields.id }"`);

//                 // delete file
//                 if (fs.existsSync("img/" + row.Filename)) {
//                     fs.unlinkSync("img/" + row.Filename);
//                 }

//                 // load index
//                 endpoints[0].respond(req, res);
//             });
//         });
//     }
// },