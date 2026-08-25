/* =====================================================
   START OF FILE: history-edit.js
   Poolside Parent
   Individual history delete - housekeeping
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
            button.setAttribute("aria-label", "Delete this swim");
            button.title = "Delete this swim";
            button.textContent = "🗑️";

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
        /* =================================================
           Swim History housekeeping
        ================================================= */

        #historyScreen{
            padding-bottom:120px;
        }

        .historyItem{
            position:relative;
            padding-right:46px;
        }

        .historyDeleteButton{
            position:absolute;
            top:10px;
            right:0;
            display:flex;
            align-items:center;
            justify-content:center;
            width:34px;
            height:34px;
            min-height:0;
            margin:0;
            padding:0;
            font-size:18px;
            line-height:1;
            border:0;
            border-radius:7px;
            background:transparent;
        }

        .historyDeleteButton:active{
            transform:scale(.92);
        }
    `;

    document.head.appendChild(style);

})();

/* =====================================================
   END OF FILE: history-edit.js
===================================================== */
