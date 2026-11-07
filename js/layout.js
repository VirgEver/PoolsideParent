/* Small DOM-only layout adjustments kept separate from application behaviour. */
(function(){
    function tidyPBDifference(){
        document.querySelectorAll("#resultScreen .pbDifference").forEach(function(element){
            if(element.querySelector(".differenceTime")){ return; }
            const text=element.textContent.trim();
            const prefix="Difference:";
            if(!text.startsWith(prefix)){ return; }
            element.innerHTML="<span class='differenceTitle'>Difference:</span><span class='differenceTime'>"+escapeHTML(text.slice(prefix.length).trim())+"</span>";
        });
    }

    function alignScreenLogos(){
        const app=document.querySelector(".app");
        const mainLogo=document.querySelector("#setupScreen .brandLogo");
        if(!app || !mainLogo){ return; }
        const offset=Math.max(0,Math.round(mainLogo.getBoundingClientRect().left-app.getBoundingClientRect().left));
        document.documentElement.style.setProperty("--screen-logo-offset",offset+"px");
    }

    function syncHistoryButtonWidths(){
        const filterButton=document.getElementById("filterHistoryButton");
        const backButton=document.getElementById("closeHistoryButton");
        if(!filterButton || !backButton){ return; }
        const backWidth=window.getComputedStyle(backButton).width;
        if(parseFloat(backWidth)>0){ filterButton.style.width=backWidth; }
    }

    const summaryCard=document.getElementById("summaryCard");
    if(summaryCard){
        new MutationObserver(tidyPBDifference).observe(summaryCard,{childList:true,subtree:true});
        tidyPBDifference();
    }
    alignScreenLogos();
    syncHistoryButtonWidths();
    window.addEventListener("resize",alignScreenLogos);
    window.addEventListener("resize",syncHistoryButtonWidths);
})();
