module.exports = {
    command: "delete",
    helptext: "delete <id> : deletes the image with the given id from the database",
    run: (db, args) => {

        const rowid = args[1];

        db.get(`SELECT FileType FROM Images WHERE ROWID = "${ rowid }";`, (err, row) => {

            // ensure row exists with this rowid
            if (!row) {

                console.log("No row with rowid=" + rowid + " exists.");
                return;
            }

            // delete row
            db.run(`DELETE FROM Images WHERE ROWID = "${ rowid }"`);

            // delete file
            if (fs.existsSync("img/" + rowid + "." + row.FileType))
                fs.unlinkSync("img/" + rowid + "." + row.FileType);

            console.log("Successfully deleted " + rowid + ".");
        });
    }
};