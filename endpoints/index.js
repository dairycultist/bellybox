const fs = require("fs");

module.exports = [
    // index (potentially including tag search and page)
    {
        regex: new RegExp("^GET /(\\\?.*)?$"),
        respond: (respondImagePage, respondSPA, respondError, config, db, query, req, res) => {

            const tags = query.getAll("tag");

            const tagWhere = tags.length == 0 ? "" : " AND " + tags.map(tag => `Tags LIKE "%${ tag }%"`).join(" AND ");

            const tagQuery = (() => {

                let construct = "";

                for (const tag of tags)
                    construct += "&tag=" + tag;

                return construct;
            })();

            db.get(`SELECT COUNT(*) AS count FROM Images WHERE Visibility = 2${ tagWhere };`, (err, count) => {

                count = count.count;

                const pageTotal = Math.ceil(count / config.itemsPerPage);
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

                db.each(`SELECT rowid FROM Images WHERE Visibility = 2${ tagWhere } LIMIT ${ config.itemsPerPage } OFFSET ${ (pageIndex - 1) * config.itemsPerPage };`, (err, row) => {

                    images += `<a href="image/${ row.rowid }" class="galleryitem"><img src="/img/${ row.rowid }.png"></a>`;

                }, () => {
                    
                    // respond on complete
                    respondSPA(res,
                        fs.readFileSync("./html/pagenav_widget.html", "utf8")
                            .replaceAll("<!-- total result items -->", count)
                            .replaceAll("<!-- page index -->", pageIndex)
                            .replaceAll("<!-- page total -->", pageTotal)
                            .replaceAll("PREV_PAGE_HREF", pageIndex == 1         ? "" : `href="?page=${ pageIndex - 1 }${ tagQuery }"`)
                            .replaceAll("NEXT_PAGE_HREF", pageIndex == pageTotal ? "" : `href="?page=${ pageIndex + 1 }${ tagQuery }"`)
                        + images
                    );
                });
            });
        }
    }
];