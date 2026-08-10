const multiparty = require("multiparty");
const crypto = require("crypto");

module.exports = [
    {
        regex: new RegExp("^POST /log_in$"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

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

                // TODO actually hash the password
                const hashedPassword = fields.password[0];

                // check if user exists
                db.get(`SELECT 1 FROM Users WHERE Username="${ fields.username[0] }" AND HashedPassword="${ hashedPassword }";`, (err, exists) => {

                    if (!err && exists) {

                        // create session cookie
                        const sessionCookie = fields.username[0] + "-" + crypto.randomInt(1000000000, 9999999999);

                        // store session cookie (so we can recognize when the same user is making a request)
                        // also overrides previous session cookie, meaning the same user can't be logged in on two devices 
                        db.run(`UPDATE Users SET SessionCookie = "${ sessionCookie }" WHERE Username="${ fields.username[0] }" AND HashedPassword="${ hashedPassword }";`);

                        // respond with session cookie in header
                        // no expiry provided means it'll persist only as long as the browser is loaded in memory
                        res.writeHead(200, {
                            "Content-Type": "text/html; charset=utf-8",
                            "Set-Cookie": "session=" + sessionCookie
                        });
                        res.end(`
                            Successfully logged in as ${ fields.username[0] }!
                            <br>
                            <a href="/">Back to home</a>
                        `);

                    } else {
                        respondError(res, 422, "Incorrect username or password.");
                    }
                });
            });
        }
    }
];