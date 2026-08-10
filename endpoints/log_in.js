const multiparty = require("multiparty");

// TODO all responses first check if a valid session cookie was sent by the client -- if it was, we treat them as logged in

module.exports = [
    {
        regex: new RegExp("^POST /log_in$"),
        respond: (respondImagePage, respondSPA, respondError, config, db, query, req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                if (/[^A-Za-z0-9_]/.test(fields.username[0])) {

                    respondError(res, 422, "Username has invalid characters; only use A-Z, a-z, 0-9, and _.");
                    return;
                }

                if (fields.username[0].length < 3) {

                    respondError(res, 422, "Username must be at least 3 characters.");
                    return;
                }

                if (fields.username[0].length > 32) {

                    respondError(res, 422, "Username must be at most 32 characters.");
                    return;
                }

                if (fields.password[0].length < 7) {

                    respondError(res, 422, "Password must be at least 7 characters.");
                    return;
                }

                if (fields.password[0].length > 600) {

                    respondError(res, 422, "Password must be at most 600 characters.");
                    return;
                }

                respondError(res, 200, "You would have logged in successfully, but we're just testing!");

                // create and store session cookie and respond with it in header
                // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie

                // db.run(`UPDATE Images SET InfoLog = InfoLog || "${ req.url.includes("edit") ? "EDIT  " : "DELETE" } <t:${ Date.now() }> ${ message }\n" WHERE ROWID = "${ fields.id[0] }";`);
            });
        }
    }
];