/* =====================================================
   Poolside Parent
   History Edit / Delete
   Test version
===================================================== */

/*
   This module adds individual history deletion without
   changing the existing timing or storage structure.

   Personal Bests do not need a separate recalculation here:
   getPersonalBest() reads the current stored history each time,
   so removing a false swim automatically changes the PB basis.
*/

(function(){

    function addDeleteControls(){

        const container =
            document.getElementById("historyContainer");

        if(!container){
            return;
        }

        const swims =
            getSwims().slice().reverse();

        const items =
            container.querySelectorAll(".historyItem");

        items.forEach(

            function(item, index){

                const swim = swims[index];

                if(!swim || !swim.id){
                    return;
                }

                item.dataset.swimId = swim.id;

                if(
                    item.querySelector(".historyDeleteButton")
                ){
                    return;
                }

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "historyDeleteButton";

                button.textContent =
                    "DELETE";

                button.addEventListener(

                    "click",

                    function(event){

                        event.stopPropagation();

                        const confirmed =
                            confirm(
                                "Delete this swim from history?"
                            );

                        if(!confirmed){
                            return;
                        }

                        deleteSwimById(
                            swim.id
                        );

                    }

                );

                item.appendChild(button);

            }

        );

    }


    function deleteSwimById(id){

        const database =
            getDatabase();

        const originalCount =
            database.swims.length;

        database.swims =
            database.swims.filter(

                function(swim){

                    return swim.id !== id;

                }

            );

        if(
            database.swims.length ===
            originalCount
        ){
            return;
        }

        saveDatabase(
            database
        );

        buildHistory();

    }


    /*
       Wrap the existing history builder so the delete
       controls are recreated whenever the history is refreshed.
    */

    const originalBuildHistory =
        window.buildHistory;

    if(
        typeof originalBuildHistory ===
        "function"
    ){

        window.buildHistory =
            function(){

                originalBuildHistory();

                addDeleteControls();

            };

    }


    /*
       Simple test styling. This keeps the test self-contained
       and avoids changing the existing main.css yet.
    */

    const style =
        document.createElement("style");

    style.textContent = `
        .historyDeleteButton {
            display: block;
            width: 100%;
            height: 42px;
            margin-top: 8px;
            background: #777;
            color: white;
            font-size: 15px;
            border-radius: 10px;
        }

        .historyDeleteButton:active {
            opacity: 0.75;
        }
    `;

    document.head.appendChild(
        style
    );

})();

/* =====================================================
   END OF FILE: history-edit.js
===================================================== */
