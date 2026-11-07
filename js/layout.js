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

/* Experimental phone timing portrait display.
   Counter-rotate only this screen; touch targets remain native DOM buttons. */
(function(){
    const timing = document.getElementById("timingScreen");
    if(!timing){ return; }
    let frame = 0;
    let settleTimers = [];
    let wasVisible = !timing.classList.contains("hidden");

    function clearPortraitDisplay(){
        timing.classList.remove("timingPortraitRotated", "timingPortraitCompact", "timingPortraitShort");
        ["--timing-width", "--timing-height", "--timing-center-x", "--timing-center-y",
         "--timing-rotation", "--timing-safe-top", "--timing-safe-right",
         "--timing-safe-bottom", "--timing-safe-left"].forEach(function(name){
            timing.style.removeProperty(name);
        });
    }

    function updatePortraitDisplay(){
        frame = 0;
        const visible = !timing.classList.contains("hidden");
        const phone = navigator.maxTouchPoints > 0 &&
            Math.min(window.screen.width, window.screen.height) <= 600;
        if(!visible || !phone){ clearPortraitDisplay(); return; }

        // iPhone's legacy angle is relative to upright portrait in both launch modes.
        const reportedAngle = typeof window.orientation === "number" ?
            window.orientation : window.screen.orientation && window.screen.orientation.angle;
        const angle = ((Number(reportedAngle) || 0) % 360 + 360) % 360;
        const viewport = window.visualViewport;
        const width = viewport ? viewport.width : window.innerWidth;
        const height = viewport ? viewport.height : window.innerHeight;
        // Wait for the dimensions to agree with the reported orientation.
        if(width <= height || (angle !== 90 && angle !== 270)){
            clearPortraitDisplay();
            return;
        }

        timing.style.setProperty("--timing-width", height + "px");
        timing.style.setProperty("--timing-height", width + "px");
        timing.style.setProperty("--timing-center-x", ((viewport ? viewport.offsetLeft : 0) + width / 2) + "px");
        timing.style.setProperty("--timing-center-y", ((viewport ? viewport.offsetTop : 0) + height / 2) + "px");
        timing.style.setProperty("--timing-rotation", -angle + "deg");
        const edges = angle === 90 ? ["left", "top", "right", "bottom"] :
            ["right", "bottom", "left", "top"];
        ["top", "right", "bottom", "left"].forEach(function(edge, index){
            timing.style.setProperty("--timing-safe-" + edge, "env(safe-area-inset-" + edges[index] + ", 0px)");
        });
        timing.classList.toggle("timingPortraitCompact", height <= 430);
        timing.classList.toggle("timingPortraitShort", width <= 500);
        timing.classList.add("timingPortraitRotated");
    }

    function schedulePortraitDisplay(){
        if(!frame){ frame = window.requestAnimationFrame(updatePortraitDisplay); }
    }
    function orientationChanged(){
        schedulePortraitDisplay();
        settleTimers.forEach(window.clearTimeout);
        // Safari can report its angle before resizing the visual viewport.
        settleTimers = [150, 350].map(function(delay){
            return window.setTimeout(schedulePortraitDisplay, delay);
        });
    }
    new MutationObserver(function(){
        const visible = !timing.classList.contains("hidden");
        if(visible === wasVisible){ return; }
        wasVisible = visible;
        // Clear synchronously on Stop; apply synchronously when starting sideways.
        updatePortraitDisplay();
    }).observe(timing, {attributes:true, attributeFilter:["class"]});
    window.addEventListener("resize", schedulePortraitDisplay);
    window.addEventListener("orientationchange", orientationChanged);
    window.addEventListener("pageshow", orientationChanged);
    if(window.screen.orientation && window.screen.orientation.addEventListener){
        window.screen.orientation.addEventListener("change", orientationChanged);
    }
    if(window.visualViewport){
        window.visualViewport.addEventListener("resize", schedulePortraitDisplay);
        window.visualViewport.addEventListener("scroll", schedulePortraitDisplay);
    }
    document.addEventListener("visibilitychange", function(){
        if(document.visibilityState === "visible"){ orientationChanged(); }
    });
    updatePortraitDisplay();
})();
