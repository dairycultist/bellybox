const multiparty = require("multiparty");

module.exports = [
    // dedicated page for an image
    {
        regex: new RegExp("^POST /(request_edit|request_delete)$"),
        respond: (respondImagePage, respondSPA, respondError, config, db, query, req, res) => {

            new multiparty.Form().parse(req, function(err, fields, files) {

                let message = fields.reason[0].trim().replaceAll(/\s+/g, " ");

                if (message.length == 0) {

                    respondError(res, 400, "Reason cannot be empty");
                    return;
                }

                if (message.length > 280)
                    message = message.substring(0, 280);

                db.run(`UPDATE Images SET InfoLog = InfoLog || "${ req.url.includes("edit") ? "EDIT  " : "DELETE" } <t:${ Date.now() }> ${ message }\n" WHERE ROWID = "${ fields.id[0] }";`);

                respondImagePage(res, fields.id[0]);
            });
        }
    }
];