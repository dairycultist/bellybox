module.exports = {
    command: "info",
    helptext: "info <id>   : prints information about the image",
    run: (db, args) => {

        const rowid = args[1];

        db.get(`SELECT * FROM Images WHERE ROWID = "${ rowid }";`, (err, row) => {

            if (err) {

                console.log("An error occurred.");
                console.log(err);
                return;
            }

            if (!row) {

                console.log("No image with rowid=" + rowid + " exists.");
                return;
            }

            console.log("Description:           " + row.Description);
            console.log("Tags:                  " + row.Tags);
            console.log("CreationUnixTimestamp: " + row.CreationUnixTimestamp);
            console.log("InfoLog:\n"              + row.InfoLog);
            console.log("Visibility:            " + (row.Visibility == 0 ? "hidden" : row.Visibility == 1 ? "unlisted" : row.Visibility == 2 ? "public" : "INVALID"));
            console.log("UploaderUsername:      " + row.UploaderUsername);
        });
    }
};