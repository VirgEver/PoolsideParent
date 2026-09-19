/* Poolside Parent Alpha 2.2 - simple event progress chart */
(function(){
    const progressScreen=document.getElementById("progressScreen");
    const progressEvent=document.getElementById("progressEvent");
    const progressChart=document.getElementById("progressChart");
    const closeButton=document.getElementById("closeProgressButton");

    function shortDate(value){
        const text=String(value||"").trim();
        const uk=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if(uk){
            return uk[1].padStart(2,"0")+"/"+uk[2].padStart(2,"0")+"/"+uk[3].slice(-2);
        }
        const parsed=new Date(text);
        if(Number.isNaN(parsed.getTime())){ return text; }
        return String(parsed.getDate()).padStart(2,"0")+"/"+String(parsed.getMonth()+1).padStart(2,"0")+"/"+String(parsed.getFullYear()).slice(-2);
    }

    function sameEvent(swim,selected){
        return swim.swimmer===selected.swimmer && swim.stroke===selected.stroke && swim.distance===selected.distance && swim.course===selected.course;
    }

    function renderChart(swims){
        const points=swims.map(function(swim){return {swim:swim,seconds:parseElapsedMilliseconds(swim.finalTime)/1000};}).filter(function(point){return Number.isFinite(point.seconds);});
        if(!points.length){
            progressChart.innerHTML="<p class='progressEmpty'>No valid times are available for this event.</p>";
            return;
        }

        const width=640, height=360, left=100, right=50, top=35, bottom=64;
        const plotWidth=width-left-right, plotHeight=height-top-bottom;
        let min=Math.min.apply(null,points.map(function(point){return point.seconds;}));
        let max=Math.max.apply(null,points.map(function(point){return point.seconds;}));
        const padding=Math.max((max-min)*0.12,0.5);
        min-=padding; max+=padding;
        const x=function(index){return points.length===1 ? left+(plotWidth/2) : left+(index*plotWidth/(points.length-1));};
        /* Standard time axis: smaller/faster values are lower on the screen. */
        const y=function(seconds){return top+((max-seconds)/(max-min))*plotHeight;};
        const line=points.map(function(point,index){return x(index)+","+y(point.seconds);}).join(" ");
        let svg="<svg viewBox='0 0 "+width+" "+height+"' role='img' aria-label='Progress line chart, oldest to newest'>";
        for(let tick=0;tick<5;tick++){
            const value=min+((max-min)*tick/4), tickY=y(value);
            svg+="<line class='progressGrid' x1='"+left+"' y1='"+tickY+"' x2='"+(width-right)+"' y2='"+tickY+"'></line>";
            svg+="<text class='progressAxisLabel' x='"+(left-9)+"' y='"+(tickY+4)+"' text-anchor='end'>"+formatElapsedMilliseconds(value*1000)+"</text>";
        }
        svg+="<polyline class='progressLine' points='"+line+"'></polyline>";
        points.forEach(function(point,index){
            const fullDate=escapeHTML(point.swim.date||"");
            const date=escapeHTML(shortDate(point.swim.date));
            const finalTime=escapeHTML(point.swim.finalTime||"");
            svg+="<circle class='progressPoint' cx='"+x(index)+"' cy='"+y(point.seconds)+"' r='6'><title>"+fullDate+": "+finalTime+"</title></circle>";
            if(points.length<=6 || index===0 || index===points.length-1){
                svg+="<text class='progressDate' x='"+x(index)+"' y='"+(height-28)+"' text-anchor='middle'>"+date+"</text>";
            }
        });
        svg+="</svg><div class='progressDirection'>Oldest → newest · Faster times move down</div>";
        progressChart.innerHTML=svg;
    }

    window.showProgressChart=function(selected){
        const matches=getSwims().filter(function(swim){return sameEvent(swim,selected);}).sort(function(a,b){return parseSwimDateTime(a)-parseSwimDateTime(b);});
        document.querySelectorAll("#setupScreen,#timingScreen,#resultScreen,#manualScreen,#historyScreen").forEach(function(screen){screen.classList.add("hidden");});
        progressEvent.textContent=selected.swimmer+" — "+selected.distance+" "+selected.stroke+" — "+selected.course+" pool";
        renderChart(matches);
        progressScreen.classList.remove("hidden");
    };

    if(closeButton){
        closeButton.addEventListener("click",function(){
            progressScreen.classList.add("hidden");
            document.getElementById("historyScreen").classList.remove("hidden");
        });
    }

})();
