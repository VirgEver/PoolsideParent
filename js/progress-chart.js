/* PoolsideParent Phase 3 - progress chart with optional performance overlays. */
(function(){
    const progressScreen=document.getElementById("progressScreen");
    const progressEvent=document.getElementById("progressEvent");
    const progressChart=document.getElementById("progressChart");
    const pointDetails=document.getElementById("progressPointDetails");
    const pbButton=document.getElementById("togglePBOverlay");
    const sbButton=document.getElementById("toggleSBOverlay");
    const closeButton=document.getElementById("closeProgressButton");
    const overlays={pb:false,sb:false};
    let currentSwims=[];

    function shortDate(value){
        const text=String(value || "").trim();
        const uk=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if(uk){ return uk[1].padStart(2,"0")+"/"+uk[2].padStart(2,"0")+"/"+uk[3].slice(-2); }
        const parsed=new Date(text);
        if(Number.isNaN(parsed.getTime())){ return text; }
        return String(parsed.getDate()).padStart(2,"0")+"/"+String(parsed.getMonth()+1).padStart(2,"0")+"/"+String(parsed.getFullYear()).slice(-2);
    }

    function sameEvent(swim,selected){
        return swim.swimmer===selected.swimmer && swim.stroke===selected.stroke && swim.distance===selected.distance && swim.course===selected.course;
    }

    function syncOverlayButtons(){
        [[pbButton,overlays.pb],[sbButton,overlays.sb]].forEach(function(entry){
            if(!entry[0]){ return; }
            entry[0].classList.toggle("selected",entry[1]);
            entry[0].setAttribute("aria-pressed",entry[1] ? "true" : "false");
        });
    }

    function pointDetailText(point){
        const badges=[];
        if(point.isPB){ badges.push("PB"); }
        if(point.isSB){ badges.push("SB "+point.seasonLabel); }
        const source=getResultSourceLabel(point.swim.source || "poolside");
        return [point.swim.date || "Date unavailable",point.swim.finalTime || "",source].concat(badges).filter(Boolean).join(" • ");
    }

    function selectPoint(index,points){
        progressChart.querySelectorAll(".progressPoint").forEach(function(circle){
            circle.classList.toggle("selected",Number(circle.dataset.pointIndex)===index);
        });
        if(pointDetails && points[index]){ pointDetails.textContent=pointDetailText(points[index]); }
    }

    function attachPointInteractions(points){
        progressChart.querySelectorAll(".progressPoint").forEach(function(circle){
            const index=Number(circle.dataset.pointIndex);
            circle.addEventListener("click",function(){ selectPoint(index,points); });
            circle.addEventListener("keydown",function(event){
                if(event.key==="Enter" || event.key===" "){
                    event.preventDefault();
                    selectPoint(index,points);
                }
            });
        });
    }

    function renderChart(swims){
        const points=buildPerformanceSeries(swims,POOLSIDE_CONFIG.season);
        if(!points.length){
            progressChart.innerHTML="<p class='progressEmpty'>No valid times are available for this event.</p>";
            if(pointDetails){ pointDetails.textContent=""; }
            return;
        }

        const width=640,height=380,left=100,right=50,top=42,bottom=72;
        const plotWidth=width-left-right,plotHeight=height-top-bottom;
        let min=Math.min.apply(null,points.map(function(point){return point.milliseconds;}));
        let max=Math.max.apply(null,points.map(function(point){return point.milliseconds;}));
        const padding=Math.max((max-min)*0.12,500);
        min-=padding; max+=padding;
        const x=function(index){return points.length===1 ? left+(plotWidth/2) : left+(index*plotWidth/(points.length-1));};
        /* Smaller/faster times intentionally appear lower on screen. */
        const y=function(milliseconds){return top+((max-milliseconds)/(max-min))*plotHeight;};
        const performanceLine=points.map(function(point,index){return x(index)+","+y(point.milliseconds);}).join(" ");
        let svg="<svg viewBox='0 0 "+width+" "+height+"' role='img' aria-label='Progress line chart, oldest to newest'>";

        for(let tick=0;tick<5;tick++){
            const value=min+((max-min)*tick/4),tickY=y(value);
            svg+="<line class='progressGrid' x1='"+left+"' y1='"+tickY+"' x2='"+(width-right)+"' y2='"+tickY+"'></line>";
            svg+="<text class='progressAxisLabel' x='"+(left-9)+"' y='"+(tickY+4)+"' text-anchor='end'>"+formatElapsedMilliseconds(value)+"</text>";
        }

        if(overlays.sb){
            groupPerformanceBySeason(points).forEach(function(group,groupIndex){
                const groupX=function(localIndex){return x(group.startIndex+localIndex);};
                svg+="<path class='progressOverlayLine progressSBLine' d='"+buildStepPath(group.points,"sbMilliseconds",groupX,y)+"'></path>";
                if(groupIndex>0){
                    const boundaryX=x(group.startIndex);
                    svg+="<line class='progressSeasonBoundary' x1='"+boundaryX+"' y1='"+top+"' x2='"+boundaryX+"' y2='"+(height-bottom)+"'></line>";
                    svg+="<text class='progressSeasonLabel' x='"+(boundaryX+5)+"' y='"+(top+14)+"'>"+escapeHTML(group.seasonLabel)+"</text>";
                }
            });
        }

        if(overlays.pb){
            svg+="<path class='progressOverlayLine progressPBLine' d='"+buildStepPath(points,"pbMilliseconds",x,y)+"'></path>";
        }

        svg+="<polyline class='progressLine' points='"+performanceLine+"'></polyline>";
        const labelEvery=Math.max(1,Math.ceil(points.length/6));
        points.forEach(function(point,index){
            const title=escapeHTML((point.swim.date || "")+": "+(point.swim.finalTime || ""));
            svg+="<circle class='progressPoint' data-point-index='"+index+"' tabindex='0' role='button' aria-label='"+title+"' cx='"+x(index)+"' cy='"+y(point.milliseconds)+"' r='6'><title>"+title+"</title></circle>";
            if(index===0 || index===points.length-1 || index%labelEvery===0){
                svg+="<text class='progressDate' x='"+x(index)+"' y='"+(height-30)+"' text-anchor='middle'>"+escapeHTML(shortDate(point.swim.date))+"</text>";
            }
        });
        svg+="</svg>";

        const legends=[];
        if(overlays.pb){ legends.push("<span class='progressLegendPB'>PB progression</span>"); }
        if(overlays.sb){ legends.push("<span class='progressLegendSB'>SB progression</span>"); }
        if(legends.length){ svg+="<div class='progressLegend'>"+legends.join("")+"</div>"; }
        svg+="<div class='progressDirection'>Oldest → newest · Faster times move down</div>";
        progressChart.innerHTML=svg;
        attachPointInteractions(points);
        if(pointDetails){ pointDetails.textContent="Tap a point for swim details."; }
    }

    function toggleOverlay(name){
        overlays[name]=!overlays[name];
        syncOverlayButtons();
        renderChart(currentSwims);
    }

    window.showProgressChart=function(selected){
        currentSwims=getSwims().filter(function(swim){return sameEvent(swim,selected);});
        overlays.pb=false;
        overlays.sb=false;
        syncOverlayButtons();
        document.querySelectorAll("#setupScreen,#timingScreen,#resultScreen,#manualScreen,#historyScreen").forEach(function(screen){screen.classList.add("hidden");});
        progressEvent.textContent=selected.swimmer+" — "+selected.distance+" "+selected.stroke+" — "+selected.course+" pool";
        renderChart(currentSwims);
        progressScreen.classList.remove("hidden");
    };

    if(pbButton){ pbButton.addEventListener("click",function(){toggleOverlay("pb");}); }
    if(sbButton){ sbButton.addEventListener("click",function(){toggleOverlay("sb");}); }
    if(closeButton){
        closeButton.addEventListener("click",function(){
            progressScreen.classList.add("hidden");
            document.getElementById("historyScreen").classList.remove("hidden");
        });
    }
})();
