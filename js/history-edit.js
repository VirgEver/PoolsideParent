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

    const style = document.createElement("style");
    style.textContent = `
        #historyScreen{padding-bottom:120px;}
        #historyScreen .historyActions{margin-bottom:0;}
        #historyScreen .mergeMessage:empty{display:none;}
        #historyScreen .mergeMessage:not(:empty){margin:10px 0 0;}
        #historyScreen #historyContainer{margin-top:10px;}
        .historyItem{position:relative;padding:6px 46px 7px 0;}
        .historyEvent{line-height:1.2;}
        .historyDetails{display:flex;align-items:center;gap:12px;margin-top:3px;}
        .historyDetails .historyTime{flex:0 0 auto;margin-top:0;line-height:1;}
        .historyDetails .historyMeta{margin-top:0;line-height:1.25;}
        .historyProgressButton{position:absolute;top:5px;right:0;display:flex;align-items:center;justify-content:center;width:34px;height:34px;min-height:0;margin:0;padding:0;font-size:18px;line-height:1;border:0;border-radius:7px;background:transparent;}
        .historyDeleteButton{position:absolute;top:39px;right:0;display:flex;align-items:center;justify-content:center;width:34px;height:34px;min-height:0;margin:0;padding:0;font-size:18px;line-height:1;border:0;border-radius:7px;background:transparent;}
        .historyProgressButton:active,
        .historyDeleteButton:active{transform:scale(.92);}
        .historyFilterButton.activeFilter{background:#d97706 !important;border-color:#b45309 !important;color:#ffffff !important;}
    `;

    document.head.appendChild(style);

})();

/* END OF FILE: history-edit.js */
