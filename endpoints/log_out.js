module.exports = [
    {
        regex: new RegExp("^POST /log_out$"),
        respond: (respondImagePage, respondSPA, respondError, user, config, db, query, req, res) => {

            db.run(`UPDATE Users SET SessionCookie = "" WHERE SessionCookie = "${ user.SessionCookie }";`);

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                "Set-Cookie": "session=; Max-Age=0"
            });
            res.end(`
                Successfully logged out!
                <br>
                <a href="/">Back to home</a>
            `);
        }
    }
];