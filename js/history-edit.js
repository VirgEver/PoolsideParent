/* =====================================================
   START OF FILE: history-edit.js
   Poolside Parent
   Individual history delete - housekeeping
===================================================== */
(function(){
    function addDeleteButtons(){
        const container=document.getElementById("historyContainer");
        if(!container){return;}
        const items=container.querySelectorAll(".historyItem");
        items.forEach(function(item){
            if(item.querySelector(".historyDeleteButton")){return;}
            const swimId=item.getAttribute("data-swim-id");
            const swim=getSwims().find(function(savedSwim){return savedSwim.id===swimId;});
            if(!swim||!swim.id){return;}
            const button=document.createElement("button");
            button.type="button";
            button.className="historyDeleteButton";
            button.setAttribute("aria-label","Delete this swim");
            button.title="Delete this swim";
            button.textContent="🗑️";
            button.addEventListener("click",function(event){
                event.stopPropagation();
                if(!confirm("Delete this swim from history?")){return;}
                deleteSwim(swim.id);
            });
            item.appendChild(button);
        });
    }
    function deleteSwim(id){
        const database=getDatabase();
        const originalLength=database.swims.length;
        database.swims=database.swims.filter(function(swim){return swim.id!==id;});
        if(database.swims.length===originalLength){return;}
        saveDatabase(database);
        buildHistory();
    }
    const existingBuildHistory=window.buildHistory;
    if(typeof existingBuildHistory==="function"){
        window.buildHistory=function(){existingBuildHistory();addDeleteButtons();};
    }
    const style=document.createElement("style");
    style.textContent=`
        #historyScreen{padding-bottom:120px;}
        .historyItem{position:relative;padding-right:46px;}
        .historyDeleteButton{position:absolute;top:10px;right:0;display:flex;align-items:center;justify-content:center;width:34px;height:34px;min-height:0;margin:0;padding:0;font-size:18px;line-height:1;border:0;border-radius:7px;background:transparent;}
        .historyDeleteButton:active{transform:scale(.92);}
        .historyFilterButton{width:15ch !important;align-self:center;height:44px !important;font-size:16px !important;}
        .historyFilterPanel{width:100%;box-sizing:border-box;padding:4px 0 8px;text-align:center;}
        .historyFilterHeading{font-size:15px;font-weight:bold;margin:0 0 9px;}
        .historyFilterOptions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
        .historyStrokeOption{width:auto !important;min-width:0;min-height:40px !important;height:40px !important;padding:7px 13px;font-size:15px !important;border:1px solid #999;border-radius:9px;background:#f7f7f7;box-sizing:border-box;}
        .historyStrokeOption.selected{font-weight:bold;border:2px solid #333;background:#e6e6e6;}
        .historyStrokeOption:active,.historyFilterButton:active{transform:scale(.98);}
        .historyFilterStatus{margin:4px 0 8px;text-align:center;font-size:14px;font-weight:700;}
        .historyFilterButton.activeFilter{background:#d97706 !important;border-color:#b45309 !important;color:#fff !important;}
    `;
    document.head.appendChild(style);
})();
/* END OF FILE: history-edit.js */
