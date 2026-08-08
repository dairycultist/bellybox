const fs = require("fs");

module.exports = [
    // index
    {
        regex: new RegExp("^GET /\\\??$"),
        respond: (respondImagePage, getSPA, db, req, res) => {

            let images = "<div style='display: flex; flex-wrap: wrap;'>";

            db.each("SELECT ID, Filename, MasonryFlex FROM Images;", (err, row) => {

                images += `<a href="image/${ row.ID }" style="flex: ${ row.MasonryFlex } 1 ${ row.MasonryFlex }px; width: ${ row.MasonryFlex }px;"><img src="/img/${ row.Filename }" style="width: 100%;"></a>`;

            }, () => {

                // adding this at the end prevents the last row from filling the whole row
                images += "<div style='flex: 200000;'></div>";
                images += "</div>";
                
                // respond on complete
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(getSPA(images));
            });
        }
    },
    // index + tag search
    {
        regex: new RegExp("^GET /\\\?tag="),
        respond: (respondImagePage, getSPA, db, req, res) => {

            const tagWhere = req.url.split("?tag=", 2)[1].split("&tag=").map(tag => `Tags LIKE "%${ tag }%"`).join(" AND ");

            let images = "<div style='display: flex; flex-wrap: wrap;'>";

            db.each(`SELECT ID, Filename, MasonryFlex FROM Images WHERE ${ tagWhere };`, (err, row) => {

                images += `<a href="image/${ row.ID }" style="flex: ${ row.MasonryFlex } 1 ${ row.MasonryFlex }px; width: ${ row.MasonryFlex }px;"><img src="/img/${ row.Filename }" style="width: 100%;"></a>`;

            }, () => {

                // adding this at the end prevents the last row from filling the whole row
                images += "<div style='flex: 200000;'></div>";
                images += "</div>";
                
                // respond on complete
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(getSPA(images));
            });
        }
    }
];