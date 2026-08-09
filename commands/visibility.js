module.exports = {
    command: "v",
    helptext: "(v)isibility <hidden/unlisted/public> <id> : sets the visibility of the image",
    run: (db, args) => {

        args[1] = args[1].toLowerCase();

        if (args[1] != "hidden" && args[1] != "unlisted" && args[1] != "public") {

            console.log("Invalid visibility value; must be one of hidden/unlisted/public.");
            return;
        }

        const visibilityNumber = args[1] == "hidden" ? 0 : args[1] == "unlisted" ? 1 : 2;
        const rowid = args[2];

        db.run(`UPDATE Images SET Visibility =${ visibilityNumber } WHERE ROWID = "${ rowid }";`, (err) => {

            if (err) {

                console.log("An error occurred; the visibility was not changed.");
                return;
            }

            console.log("Successfully set " + rowid + " to " + args[1] + " (if it doesn't exist, this did nothing).");
        });
    }
};