Exit code: 0
Wall time: 5.5 seconds
Output:
/* =====================================================
   START OF FILE: export.js
===================================================== */


/* =====================================================
   Safe Filename
===================================================== */

function safeFilename(

    text

){

    return String(

        text

    )

        .replace(

            /\s+/g,

            "_"

        )

        .replace(

            /[^\w\-]/g,

            ""

        );

}


/* =====================================================
   Create CSV
===================================================== */

function createCSV(){

    const swim =
        getCurrentSwim();


    let csv =

        "Swimmer,"
        +

        "Stroke,"
        +

        "Distance,"
        +

        "Course,"
        +

        "Date,"
        +

        "Time,"
        +

        "Final Time,"
        +

        "Length,"
        +

        "Split Time,"
        +

        "Running Total\n";


    swim.splits.forEach(

        function(split){

            csv +=

                '"'

                +

                swim.swimmer

                +

                '",'

                +

                '"'

                +

                swim.stroke

                +

                '",'

                +

                '"'

                +

                swim.distance

                +

                '",'

                +

                '"'

                +

                swim.course

                +

                '",'

                +

                '"'

                +

                swim.date

                +

                '",'

                +

                '"'

                +

                swim.time

                +

                '",'

                +

                '"'

                +

                swim.finalTime

                +

                '",'

                +

                '"'

                +

                split.lap

                +

                '",'

                +

                '"'

                +

                split.lapTime

                +

                '",'

                +

                '"'

                +

                split.totalTime

                +

                '"'

                +

                "\n";

        }

    );


    return csv;

}


/* =====================================================
   Export Current Swim
===================================================== */

function exportCurrentSwim(){

    const csv =
        createCSV();


    const swim =
        getCurrentSwim();


    const filename =

        safeFilename(

            swim.swimmer

        )

        +

        "_"

        +

        safeFilename(

            swim.stroke

        )

        +

        "_"

        +

        safeFilename(

            swim.distance

        )

        +

        "_"

        +

        swim.date.replace(

            /\//g,

            "-"

        )

        +

        "_"

        +

        swim.time.replace(

            /:/g,

            "-"

        )

        +

        ".csv";


    const blob =

        new Blob(

            [

                csv

            ],

            {

                type:
                    "text/csv"

            }

        );


    const url =

        URL.createObjectURL(

            blob

        );


    const link =
        document.createElement(

            "a"

        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(

        link

    );


    link.click();


    document.body.removeChild(

        link

    );


    URL.revokeObjectURL(

        url

    );

}


/* =====================================================
   Export Complete History
===================================================== */

function exportHistory(){

    const history =
        getSwims();


    const exportPackage = {

        app:
            "Poolside Parent",

        version:
            "Alpha 1.2.1",

        exportedAt:
            new Date().toISOString(),

        swims:
            history

    };


    const json =

        JSON.stringify(

            exportPackage,

            null,

            2

        );


    const blob =

        new Blob(

            [

                json

            ],

            {

                type:
                    "application/json"

            }

        );


    const url =

        URL.createObjectURL(

            blob

        );


    const now =
        new Date();


    const date =

        now

            .toISOString()

            .slice(

                0,

                10

            );


    const filename =

        "PoolsideParent_History_"

        +

        date

        +

        ".json";


    const link =
        document.createElement(

            "a"

        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(

        link

    );


    link.click();


    document.body.removeChild(

        link

    );


    URL.revokeObjectURL(

        url

    );

}


/* =====================================================
   END OF FILE: export.js
===================================================== */
