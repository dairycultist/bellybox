const fs = require("fs");

const itemsPerPage = 10;

module.exports = [
    // index (potentially including tag search and page)
    {
        regex: new RegExp("^GET /(\\\?.*)?$"),
        respond: (respondImagePage, getSPA, db, query, req, res) => {

            db.get(`SELECT COUNT(*) AS count FROM Images`, (err, count) => {

                count = count.count;

                const pageTotal = Math.ceil(count / itemsPerPage);
                const pageIndex = (() => {
                    const input = Number(query.get("page") || 1);
                    if (isNaN(input))
                        return 1;
                    if (input < 1)
                        return 1;
                    if (input > pageTotal)
                        return pageTotal;
                    return input;
                })();

                let images = "<div style='display: flex; flex-wrap: wrap;'>";

                db.each(`SELECT ID, Filename FROM Images LIMIT ${ itemsPerPage } OFFSET ${ (pageIndex - 1) * itemsPerPage };`, (err, row) => {

                    images += `<a href="image/${ row.ID }" class="galleryitem"><img src="/img/${ row.Filename }"></a>`;

                }, () => {
                    
                    // respond on complete
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(
                        getSPA(fs.readFileSync("pagenav_widget.html", "utf8") + images)
                        .replaceAll("<!-- total result items -->", count)
                        .replaceAll("<!-- page index -->", pageIndex)
                        .replaceAll("<!-- page total -->", pageTotal)
                        .replaceAll("PREV_PAGE_HREF", pageIndex == 1         ? "" : `href="?page=${ pageIndex - 1 }"`) // remember filter
                        .replaceAll("NEXT_PAGE_HREF", pageIndex == pageTotal ? "" : `href="?page=${ pageIndex + 1 }"`)
                    );
                });
            });
        }
    },
    // // index + tag search
    // {
    //     regex: new RegExp("^GET /\\\?tag="),
    //     respond: (respondImagePage, getSPA, db, req, res) => {

    //         const tagWhere = req.url.split("?tag=", 2)[1].split("&tag=").map(tag => `Tags LIKE "%${ tag }%"`).join(" AND ");

    //         let images = "<div style='display: flex; flex-wrap: wrap;'>";

    //         db.each(`SELECT ID, Filename, MasonryFlex FROM Images WHERE ${ tagWhere };`, (err, row) => {

    //             images += `<a href="image/${ row.ID }" style="flex: ${ row.MasonryFlex } 1 ${ row.MasonryFlex }px; width: ${ row.MasonryFlex }px;"><img src="/img/${ row.Filename }" style="width: 100%;"></a>`;

    //         }, () => {

    //             // adding this at the end prevents the last row from filling the whole row
    //             images += "<div style='flex: 200000;'></div>";
    //             images += "</div>";
                
    //             // respond on complete
    //             res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    //             res.end(getSPA(images));
    //         });
    //     }
    // }
];