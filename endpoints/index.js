const fs = require("fs");

const itemsPerPage = 2;

module.exports = [
    // index (potentially including tag search and page)
    {
        regex: new RegExp("^GET /(\\\?.*)?$"),
        respond: (respondImagePage, respondSPA, db, query, req, res) => {

            const tags = query.getAll("tag");

            const tagWhere = tags.length == 0 ? "" : " WHERE " + tags.map(tag => `Tags LIKE "%${ tag }%"`).join(" AND ");

            const tagQuery = (() => {

                let construct = "";

                for (const tag of tags)
                    construct += "&tag=" + tag;

                return construct;
            })();

            db.get(`SELECT COUNT(*) AS count FROM Images${ tagWhere }`, (err, count) => {

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

                db.each(`SELECT ID, Filename FROM Images${ tagWhere } LIMIT ${ itemsPerPage } OFFSET ${ (pageIndex - 1) * itemsPerPage };`, (err, row) => {

                    images += `<a href="image/${ row.ID }" class="galleryitem"><img src="/img/${ row.Filename }"></a>`;

                }, () => {
                    
                    // respond on complete
                    respondSPA(res,
                        fs.readFileSync("pagenav_widget.html", "utf8")
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