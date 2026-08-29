/* =====================================================
   START OF FILE: storage.js
   Poolside Parent Alpha 1.2.1
===================================================== */


/* =====================================================
   Storage Configuration
===================================================== */

const STORAGE_KEY =
    "poolsideParentSwims";


const CURRENT_STORAGE_VERSION =
    2;


/* =====================================================
   Create Unique ID
===================================================== */

function createUniqueId(){

    return (

        Date.now().toString(36)

        +

        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


/* =====================================================
   Create Empty Database
===================================================== */

function createEmptyDatabase(){

    return {

        version:
            CURRENT_STORAGE_VERSION,

        swims:
            []

    };

}


/* =====================================================
   Migrate Storage Data
===================================================== */

function migrateStorageData(

    storedData

){

    /*
       No existing data
    */

    if(

        !storedData

    ){

        return createEmptyDatabase();

    }


    /*
       VERSION 1

       Alpha 1.2 stored the
       swim history directly
       as an array.
    */

    if(

        Array.isArray(

            storedData

        )

    ){

        const migratedSwims =

            storedData.map(

                function(swim){

                    return {

                        ...swim,

                        id:

                            swim.id
                            ||

                            createUniqueId(),


                        source:

                            swim.source
                            ||

                            "poolside",


                        createdAt:

                            swim.createdAt
                            ||

                            new Date()
                                .toISOString()

                    };

                }

            );


        return {

            version:
                CURRENT_STORAGE_VERSION,

            swims:
                migratedSwims

        };

    }


    /*
       VERSION 2

       Already using the
       versioned format.
    */

    if(

        storedData.version ===
        CURRENT_STORAGE_VERSION

        &&

        Array.isArray(

            storedData.swims

        )

    ){

        return storedData;

    }


    /*
       Unknown format

       Preserve no invalid
       data as usable history.
    */

    return createEmptyDatabase();

}


/* =====================================================
   Get Database
===================================================== */

function getDatabase(){

    try{

        const storedData =

            localStorage.getItem(

                STORAGE_KEY

            );


        if(

            !storedData

        ){

            return createEmptyDatabase();

        }


        const parsedData =

            JSON.parse(

                storedData

            );


        const migratedData =

            migrateStorageData(

                parsedData

            );


        /*
           Save the migrated
           format immediately.
        */

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(

                migratedData

            )

        );


        return migratedData;

    }

    catch(error){

        console.error(

            "Could not read swim history:",

            error

        );


        return createEmptyDatabase();

    }

}


/* =====================================================
   Save Database
===================================================== */

function saveDatabase(

    database

){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(

            database

        )

    );

}


/* =====================================================
   Get All Swims
===================================================== */

function getSwims(){

    const database =

        getDatabase();


    return database.swims;

}


/* =====================================================
   Save Swim
===================================================== */

function saveSwim(

    swim

){

    const database =

        getDatabase();


    const newSwim = {

        ...swim,


        id:

            swim.id
            ||

            createUniqueId(),


        source:

            swim.source
            ||

            "poolside",


        createdAt:

            swim.createdAt
            ||

            new Date()
                .toISOString()

    };


    database.swims.push(

        newSwim

    );


    saveDatabase(

        database

    );

}


/* =====================================================
   Clear Database
===================================================== */

function clearDatabase(){

    localStorage.removeItem(

        STORAGE_KEY

    );

}


/* =====================================================
   Get Swimmer History
===================================================== */

function getSwimmerHistory(

    swimmer

){

    return getSwims().filter(

        function(swim){

            return (

                swim.swimmer ===
                swimmer

            );

        }

    );

}


/* =====================================================
   Get Event History
===================================================== */

function getEventHistory(

    swimmer,

    stroke,

    distance,

    course

){

    return getSwims().filter(

        function(swim){

            return (

                swim.swimmer === swimmer
                &&
                swim.stroke === stroke
                &&
                swim.distance === distance
                &&
                swim.course === course

            );

        }

    );

}


/* =====================================================
   Convert Time To Milliseconds
===================================================== */

function timeToMilliseconds(

    time

){

    if(

        !time

    ){

        return Number.MAX_SAFE_INTEGER;

    }


    const parts =

        time.split(

            ":"

        );


    const minutes =

        parseInt(

            parts[0],

            10

        );


    const secondsParts =

        parts[1].split(

            "."

        );


    const seconds =

        parseInt(

            secondsParts[0],

            10

        );


    const hundredths =

        parseInt(

            secondsParts[1],

            10

        );


    return (

        minutes * 60000

        +

        seconds * 1000

        +

        hundredths * 10

    );

}


/* =====================================================
   Get Personal Best
===================================================== */

function getPersonalBest(

    swimmer,

    stroke,

    distance,

    course

){

    const history =

        getEventHistory(

            swimmer,

            stroke,

            distance,

            course

        );


    if(

        history.length === 0

    ){

        return null;

    }


    return history.reduce(

        function(

            best,

            current

        ){

            if(

                timeToMilliseconds(

                    current.finalTime

                )

                <

                timeToMilliseconds(

                    best.finalTime

                )

            ){

                return current;

            }


            return best;

        }

    );

}


/* =====================================================
   Calculate Difference
===================================================== */

function calculateDifference(

    current,

    pb

){

    let difference =

        timeToMilliseconds(

            current

        )

        -

        timeToMilliseconds(

            pb

        );


    const sign =

        difference < 0

        ? "-"

        : "+";


    difference =

        Math.abs(

            difference

        );


    return (

        sign

        +

        (

            difference /
            1000

        ).toFixed(2)

        +

        " sec"

    );

}


/* =====================================================
   Create Unique Swim Signature
===================================================== */

function createSwimSignature(

    swim

){

    return [

        swim.swimmer || "",

        swim.stroke || "",

        swim.distance || "",

        swim.course || "",

        swim.date || "",

        swim.time || "",

        swim.finalTime || ""

    ].join(

        "|"

    );

}


/* =====================================================
   Merge Swim History
===================================================== */

function mergeSwimHistory(

    importedSwims

){

    const database =

        getDatabase();


    const existingSwims =

        database.swims;


    const existingSignatures =

        new Set();


    existingSwims.forEach(

        function(swim){

            existingSignatures.add(

                createSwimSignature(

                    swim

                )

            );

        }

    );


    const newSwims = [];


    let duplicatesSkipped =
        0;


    importedSwims.forEach(

        function(swim){

            const signature =

                createSwimSignature(

                    swim

                );


            if(

                existingSignatures.has(

                    signature

                )

            ){

                duplicatesSkipped++;


                return;

            }


            existingSignatures.add(

                signature

            );


            const preparedSwim = {

                ...swim,


                id:

                    swim.id
                    ||

                    createUniqueId(),


                source:

                    swim.source
                    ||

                    "poolside",


                createdAt:

                    swim.createdAt
                    ||

                    new Date()
                        .toISOString()

            };


            newSwims.push(

                preparedSwim

            );

        }

    );


    database.swims =

        existingSwims.concat(

            newSwims

        );


    saveDatabase(

        database

    );


    return {

        added:
            newSwims.length,

        duplicates:
            duplicatesSkipped,

        total:
            database.swims.length

    };

}


/* =====================================================
   END OF FILE: storage.js
===================================================== */
