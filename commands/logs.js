module.exports = {
    command: "logs",
    helptext: "logs        : print logs (edit/delete requests) associated with every image (that has logs)",
    run: (db, args) => {

        console.log("Printing all images with non-empty InfoLogs...");

        db.each(`SELECT rowid, InfoLog FROM Images WHERE InfoLog != "";`, (err, row) => {

            console.log("\nid>>>" + row.rowid);
            console.log(row.InfoLog);

        }, () => {});
    }
};