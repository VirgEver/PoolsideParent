/* =====================================================
   START OF FILE: history-edit.js
   Poolside Parent
   Individual history delete - housekeeping
===================================================== */

(function(){

    function addDeleteButtons(){
        const container = document.getElementById("historyContainer");
        if(!container){ return; }

        const items = container.querySelectorAll(".historyItem");

        items.forEach(function(item){
            if(item.querySelector(".historyDeleteButton")){ return; }

            const swimId = item.getAttribute("data-swim-id");
            const swim = getSwims().find(function(savedSwim){
                return savedSwim.id === swimId;
            });

            if(!swim || !swim.id){ return; }

            const progressButton = document.createElement("button");
            progressButton.type = "button";
            progressButton.className = "historyProgressButton";
            progressButton.setAttribute("aria-label", "View progress for this event");
            progressButton.title = "View progress";
            progressButton.textContent = "📈";
            progressButton.addEventListener("click", function(event){
                event.stopPropagation();
                if(typeof showProgressChart === "function"){
                    showProgressChart(swim);
                }
            });

            const button = document.createElement("button");
            button.type = "button";
            button.className = "historyDeleteButton";
            button.setAttribute("aria-label", "Delete this swim");
            button.title = "Delete this swim";
            button.textContent = "🗑️";

            button.addEventListener("click", function(event){
                event.stopPropagation();

                if(!confirm("Delete this swim from history?")){
                    return;
                }

                deleteSwim(swim.id);
            });

            item.appendChild(progressButton);
            item.appendChild(button);
        });
    }

    function deleteSwim(id){
        const database = getDatabase();
        const originalLength = database.swims.length;

        database.swims = database.swims.filter(function(swim){
            return swim.id !== id;
        });

        if(database.swims.length === originalLength){ return; }

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

})();

/* END OF FILE: history-edit.js */
