/* =====================================================
   START OF FILE: history-edit.js
   Poolside Parent
   Individual history delete - test version
===================================================== */

(function(){

    function addDeleteButtons(){

        const container =
            document.getElementById("historyContainer");

        if(!container){
            return;
        }

        const items =
            container.querySelectorAll(".historyItem");

        const swims =
            getSwims().slice().reverse();

        items.forEach(function(item, index){

            if(item.querySelector(".historyDeleteButton")){
                return;
            }

            const swim = swims[index];

            if(!swim || !swim.id){
                return;
            }

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "historyDeleteButton";
            button.textContent = "DELETE";

            button.addEventListener("click", function(event){

                event.stopPropagation();

                const confirmed = confirm(
                    "Delete this swim from history?"
                );

                if(!confirmed){
                    return;
                }

                deleteSwim(swim.id);

            });

            item.appendChild(button);

        });

    }


    function deleteSwim(id){

        const database = getDatabase();

        const originalLength = database.swims.length;

        database.swims = database.swims.filter(function(swim){
            return swim.id !== id;
        });

        if(database.swims.length === originalLength){
            return;
        }

        saveDatabase(database);

        buildHistory();

    }


    const existingBuildHistory = window.buildHistory;

    if(typeof existingBuildHistory === "function"){

        window.buildHistory = function(){
            existingBuildHistory();
            addDeleteButtons();
        };

    }


    const style = document.createElement("style");

    style.textContent = `
        .historyDeleteButton {
            display: block;
            width: 100%;
            min-height: 40px;
            margin-top: 10px;
            font-size: 14px;
            border: 0;
            border-radius: 8px;
        }
    `;

    document.head.appendChild(style);

})();

/* =====================================================
   END OF FILE: history-edit.js
===================================================== */
