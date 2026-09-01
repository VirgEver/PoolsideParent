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

    const style = document.createElement("style");
    style.textContent = `
        #historyScreen{padding-bottom:120px;}
        .historyItem{position:relative;padding-right:46px;}
        .historyDeleteButton{position:absolute;top:10px;right:0;display:flex;align-items:center;justify-content:center;width:34px;height:34px;min-height:0;margin:0;padding:0;font-size:18px;line-height:1;border:0;border-radius:7px;background:transparent;}
        .historyDeleteButton:active{transform:scale(.92);}
        .historyFilterButton.activeFilter{background:#d97706 !important;border-color:#b45309 !important;color:#ffffff !important;}
    `;

    document.head.appendChild(style);

})();

/* END OF FILE: history-edit.js */
