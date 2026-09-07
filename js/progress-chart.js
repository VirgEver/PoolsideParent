/* Poolside Parent Alpha 2.2 - simple event progress chart */
(function(){
    const progressScreen=document.getElementById("progressScreen");
    const progressEvent=document.getElementById("progressEvent");
    const progressChart=document.getElementById("progressChart");
    const closeButton=document.getElementById("closeProgressButton");

    function parseTime(value){
        const parts=String(value||"").trim().split(":");
        if(parts.length!==2){ return NaN; }
        const minutes=Number(parts[0]);
        const seconds=Number(parts[1]);
        return Number.isFinite(minutes)&&Number.isFinite(seconds) ? (minutes*60)+seconds : NaN;
    }

    function formatTime(seconds){
        const hundredths=Math.round(seconds*100);
        const minutes=Math.floor(hundredths/6000);
        const remainder=hundredths-(minutes*6000);
        return String(minutes).padStart(2,"0")+":"+String(Math.floor(remainder/100)).padStart(2,"0")+"."+String(remainder%100).padStart(2,"0");
    }

    function escapeHTML(value){
        return String(value==null?"":value).replace(/[&<>"']/g,function(character){
            return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];
        });
    }

    function swimDate(swim){
        const dateText=String(swim.date||"").trim();
        const uk=dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        let eventDate=uk ? Date.UTC(Number(uk[3]),Number(uk[2])-1,Number(uk[1])) : Date.parse(dateText);
        if(!Number.isFinite(eventDate)){
            eventDate=Date.parse(swim.createdAt||"");
        }
        return Number.isFinite(eventDate) ? eventDate : 0;
    }

    function sameEvent(swim,selected){
        return swim.swimmer===selected.swimmer && swim.stroke===selected.stroke && swim.distance===selected.distance && swim.course===selected.course;
    }

    function renderChart(swims){
        const points=swims.map(function(swim){return {swim:swim,seconds:parseTime(swim.finalTime)};}).filter(function(point){return Number.isFinite(point.seconds);});
        if(!points.length){
            progressChart.innerHTML="<p class='progressEmpty'>No valid times are available for this event.</p>";
            return;
        }

        const width=640, height=360, left=75, right=50, top=35, bottom=64;
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
            svg+="<text class='progressAxisLabel' x='"+(left-9)+"' y='"+(tickY+4)+"' text-anchor='end'>"+formatTime(value)+"</text>";
        }
        svg+="<polyline class='progressLine' points='"+line+"'></polyline>";
        points.forEach(function(point,index){
            const date=escapeHTML(point.swim.date||"");
            const finalTime=escapeHTML(point.swim.finalTime||"");
            svg+="<circle class='progressPoint' cx='"+x(index)+"' cy='"+y(point.seconds)+"' r='6'><title>"+date+": "+finalTime+"</title></circle>";
            svg+="<text class='progressValue' x='"+x(index)+"' y='"+(y(point.seconds)-11)+"' text-anchor='middle'>"+finalTime+"</text>";
            if(points.length<=6 || index===0 || index===points.length-1){
                svg+="<text class='progressDate' x='"+x(index)+"' y='"+(height-28)+"' text-anchor='middle'>"+date+"</text>";
            }
        });
        svg+="</svg><div class='progressDirection'>Oldest → newest · Faster times move down</div>";
        progressChart.innerHTML=svg;
    }

    window.showProgressChart=function(selected){
        const matches=getSwims().filter(function(swim){return sameEvent(swim,selected);}).sort(function(a,b){return swimDate(a)-swimDate(b);});
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

    const style=document.createElement("style");
    style.textContent="#progressScreen{padding-bottom:120px}#progressScreen h2{text-align:center;margin-bottom:8px}.progressEvent{text-align:center;font-weight:700;margin-bottom:16px}.progressChart{background:#fff;border:1px solid #d6dbe1;border-radius:12px;padding:8px;margin-bottom:16px;overflow:hidden}.progressChart svg{display:block;width:100%;height:auto}.progressGrid{stroke:#dfe4ea;stroke-width:1}.progressLine{fill:none;stroke:#1976d2;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.progressPoint{fill:#fff;stroke:#1976d2;stroke-width:4}.progressAxisLabel,.progressDate{fill:#555;font-size:12px}.progressValue{fill:#1f2937;font-size:12px;font-weight:700}.progressDirection,.progressEmpty{text-align:center;color:#555;font-size:13px}.progressEmpty{padding:36px 8px}@media(max-width:430px){.progressChart{padding:2px}.progressValue{font-size:11px}.progressAxisLabel,.progressDate{font-size:10px}}";
    document.head.appendChild(style);
})();
