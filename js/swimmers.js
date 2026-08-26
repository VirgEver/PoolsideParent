/* =====================================================
   START OF FILE: swimmers.js
   Poolside Parent Alpha 1.3.4
   Swimmer management using localStorage
===================================================== */

const SWIMMERS_STORAGE_KEY =
    "poolsideParentSwimmers";


/* =====================================================
   Load Swimmers
===================================================== */

function getSwimmers(){

    try{

        const stored =
            localStorage.getItem(
                SWIMMERS_STORAGE_KEY
            );

        if(stored){

            const parsed =
                JSON.parse(stored);

            if(Array.isArray(parsed)){

                return parsed.filter(
                    function(swimmer){
                        return swimmer
                            && swimmer.id
                            && swimmer.name;
                    }
                );

            }

        }

    }
    catch(error){

        console.error(
            "Could not read swimmers:",
            error
        );

    }


    /*
       First use of the new swimmer system.
       Existing swim history is used to
       migrate the names already in use.

       A genuinely new installation has
       no history, so it starts blank.
    */

    const names = [];

    if(typeof getSwims === "function"){

        getSwims().forEach(
            function(swim){

                const name =
                    String(
                        swim.swimmer || ""
                    ).trim();

                if(
                    name
                    &&
                    !names.some(
                        function(existing){
                            return existing.toLowerCase()
                                === name.toLowerCase();
                        }
                    )
                ){

                    names.push(name);

                }

            }
        );

    }


    const migrated =
        names.map(
            function(name){

                return {
                    id:createUniqueId(),
                    name:name
                };

            }
        );


    saveSwimmers(migrated);


    return migrated;

}


/* =====================================================
   Save Swimmers
===================================================== */

function saveSwimmers(
    swimmers
){

    localStorage.setItem(
        SWIMMERS_STORAGE_KEY,
        JSON.stringify(swimmers)
    );

}


/* =====================================================
   Add Swimmer
===================================================== */

function addSwimmer(
    name
){

    const cleanName =
        String(name || "").trim();

    if(!cleanName){
        return null;
    }


    const swimmers =
        getSwimmers();


    const duplicate =
        swimmers.find(
            function(swimmer){

                return swimmer.name.toLowerCase()
                    === cleanName.toLowerCase();

            }
        );


    if(duplicate){
        return duplicate;
    }


    const swimmer = {

        id:createUniqueId(),

        name:cleanName

    };


    swimmers.push(swimmer);

    saveSwimmers(swimmers);


    return swimmer;

}


/* =====================================================
   Render Swimmer Selectors
===================================================== */

function renderSwimmerSelectors(
    selectedName
){

    const selectors = [

        document.getElementById("swimmer"),

        document.getElementById("manualSwimmer")

    ];


    const swimmers =
        getSwimmers();


    selectors.forEach(
        function(select){

            if(!select){
                return;
            }

            select.innerHTML = "";


            const placeholder =
                document.createElement("option");

            placeholder.value = "";

            placeholder.textContent =
                "Select swimmer";

            select.appendChild(
                placeholder
            );


            swimmers.forEach(
                function(swimmer){

                    const option =
                        document.createElement("option");

                    option.value = swimmer.name;

                    option.textContent = swimmer.name;

                    option.dataset.swimmerId =
                        swimmer.id;

                    if(
                        selectedName
                        &&
                        swimmer.name === selectedName
                    ){

                        option.selected = true;

                    }

                    select.appendChild(option);

                }
            );


            if(
                selectedName
                &&
                swimmers.some(
                    function(swimmer){
                        return swimmer.name === selectedName;
                    }
                )
            ){

                select.value = selectedName;

            }

        }
    );

}


/* =====================================================
   Add Button
===================================================== */

function initialiseSwimmers(){

    renderSwimmerSelectors();


    const addButton =
        document.getElementById(
            "addSwimmerButton"
        );


    if(!addButton){
        return;
    }


    addButton.addEventListener(
        "click",
        function(){

            const name =
                prompt(
                    "Enter swimmer name:"
                );

            if(name === null){
                return;
            }


            const cleanName =
                String(name).trim();

            if(!cleanName){
                return;
            }


            const swimmers =
                getSwimmers();

            const duplicate =
                swimmers.find(
                    function(swimmer){
                        return swimmer.name.toLowerCase()
                            === cleanName.toLowerCase();
                    }
                );


            if(duplicate){

                renderSwimmerSelectors(
                    duplicate.name
                );

                document.getElementById(
                    "swimmer"
                ).value = duplicate.name;

                document.getElementById(
                    "manualSwimmer"
                ).value = duplicate.name;

                alert(
                    duplicate.name
                    +
                    " is already in your swimmers."
                );

                return;

            }


            const swimmer =
                addSwimmer(cleanName);


            if(swimmer){

                renderSwimmerSelectors(
                    swimmer.name
                );

            }

        }
    );

}


/* =====================================================
   END OF FILE: swimmers.js
===================================================== */
