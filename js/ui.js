/* =====================================================
   START OF FILE: ui.js
===================================================== */

const summaryCard = document.getElementById("summaryCard");

function buildResultSummary(previousPB){
    let pbHTML = "";
    if(currentSession.showPB){
        if(previousPB){
            const difference = calculateDifference(finalTime, previousPB.finalTime);
            pbHTML = "<div class='pbBox'><div class='pbTitle'>PB</div><div>" + previousPB.finalTime + "</div><div class='pbDifference'>Difference: " + difference + "</div></div>";
        }else{
            pbHTML = "<div class='pbBox'><div class='pbTitle'>PB</div><div>First recorded swim</div></div>";
        }
    }
    let splitHTML = "";
    splitData.forEach(function(split){
        splitHTML += "<div class='summarySplitRow'><div>L" + split.lap + "</div><div>" + split.lapTime + "</div><div>" + split.totalTime + "</div></div>";
    });
    summaryCard.innerHTML = "<div class='summaryTitle'>" + currentSession.swimmer + "</div><div class='summaryEvent'>" + currentSession.distance + " " + currentSession.stroke + "</div><div class='finalHeading'>Final Time</div><div class='finalTime'>" + finalTime + "</div><div class='summarySplits'><div class='summarySplitsTitle'>Splits</div>" + splitHTML + "</div>" + pbHTML + "<div class='summarySmall'>" + sessionDate + "&nbsp;&nbsp;&nbsp;" + sessionTime + "</div>";
}

let resultDiscarded = false;
function clearResultSummary(){ summaryCard.innerHTML = ""; }
function getCurrentSwim(){
    return {swimmer:currentSession.swimmer,stroke:currentSession.stroke,distance:currentSession.distance,course:currentSession.course,date:sessionDate,time:sessionTime,finalTime:finalTime,lengths:splitNumber,splits:getSplitData()};
}
function saveCurrentSwim(){
    let swim = getPendingSwim();
    if(!swim){ return; }
    saveSwim({swimmer:swim.swimmer,stroke:swim.stroke,distance:swim.distance,course:swim.course,date:swim.date,time:swim.time,finalTime:swim.finalTime,splits:swim.splits,lengths:swim.lengths,source:"parent"});
    clearPendingSwim();
}
function discardResult(){ clearPendingSwim(); showSetupScreen(); }
function finishSwim(previousPB){ buildResultSummary(previousPB); resultDiscarded = false; }
function leaveResultScreen(){ if(getPendingSwim()){ saveCurrentSwim(); } }

/* History Stroke Filter */
let selectedHistoryStrokes = [];
function getFilteredHistorySwims(){
    let swims = getSwims().slice();
    if(selectedHistoryStrokes.length){
        swims = swims.filter(function(swim){ return selectedHistoryStrokes.indexOf(swim.stroke) !== -1; });
    }
    function parseSwimDateTime(swim){
        const direct = swim.dateTime || swim.datetime || swim.timestamp || swim.createdAt;
        if(direct){ const directTime = Date.parse(direct); if(!Number.isNaN(directTime)){ return directTime; } }
        const dateText = String(swim.date || "").trim();
        const timeText = String(swim.time || "00:00:00").trim();
        if(!dateText){ return 0; }
        let year, month, day;
        let match = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if(match){ day=Number(match[1]); month=Number(match[2])-1; year=Number(match[3]); }
        else{
            match=dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if(match){ year=Number(match[1]); month=Number(match[2])-1; day=Number(match[3]); }
            else{ const fallback=Date.parse(dateText); return Number.isNaN(fallback)?0:fallback; }
        }
        let hours=0, minutes=0, seconds=0;
        const timeMatch=timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if(timeMatch){ hours=Number(timeMatch[1]); minutes=Number(timeMatch[2]); seconds=Number(timeMatch[3]||0); }
        return new Date(year,month,day,hours,minutes,seconds).getTime();
    }
    swims.sort(function(a,b){ return parseSwimDateTime(b)-parseSwimDateTime(a); });
    return swims;
}
function updateHistoryFilterButton(){
    const button=document.getElementById("filterHistoryButton");
    const status=document.getElementById("historyFilterStatus");
    if(!button){return;}
    const isActive=selectedHistoryStrokes.length>0;
    button.textContent=isActive?"FILTER ✓":"FILTER";
    button.classList.toggle("activeFilter",isActive);
    if(status){ if(isActive){status.textContent="Showing: "+selectedHistoryStrokes[0];status.classList.remove("hidden");}else{status.textContent="";status.classList.add("hidden");} }
}
function closeHistoryFilter(applyFilter){
    const panel=document.getElementById("historyFilterPanel");
    const button=document.getElementById("filterHistoryButton");
    if(panel){panel.classList.add("hidden");}
    if(button){button.setAttribute("aria-expanded","false");}
    if(applyFilter){buildHistory();}
}
function resetHistoryFilter(){
    selectedHistoryStrokes=[];
    document.querySelectorAll(".historyStrokeOption").forEach(function(option){option.classList.remove("selected");});
    const allOption=document.querySelector('.historyStrokeOption[data-stroke="All"]');
    if(allOption){allOption.classList.add("selected");}
    closeHistoryFilter(false); updateHistoryFilterButton();
}
function initialiseHistoryFilter(){
    const button=document.getElementById("filterHistoryButton");
    const panel=document.getElementById("historyFilterPanel");
    if(!button||!panel||button.dataset.filterInitialised==="true"){return;}
    button.dataset.filterInitialised="true";
    button.addEventListener("click",function(event){event.preventDefault();event.stopPropagation();const isHidden=panel.classList.contains("hidden");panel.classList.toggle("hidden",!isHidden);button.setAttribute("aria-expanded",isHidden?"true":"false");});
    panel.querySelectorAll(".historyStrokeOption").forEach(function(option){
        option.addEventListener("click",function(event){
            event.preventDefault();event.stopPropagation();
            const stroke=option.dataset.stroke||option.textContent.trim();
            selectedHistoryStrokes=(stroke==="All")?[]:[stroke];
            panel.querySelectorAll(".historyStrokeOption").forEach(function(item){const itemStroke=item.dataset.stroke||item.textContent.trim();item.classList.toggle("selected",(selectedHistoryStrokes.length===0&&itemStroke==="All")||(selectedHistoryStrokes.length===1&&itemStroke===selectedHistoryStrokes[0]));});
            closeHistoryFilter(true);updateHistoryFilterButton();
        });
    });
    const allOption=panel.querySelector('.historyStrokeOption[data-stroke="All"]');
    if(allOption&&selectedHistoryStrokes.length===0){allOption.classList.add("selected");}
    updateHistoryFilterButton();
}
function buildHistory(){
    initialiseHistoryFilter();
    const container=document.getElementById("historyContainer");
    const swims=getFilteredHistorySwims();
    if(swims.length===0){container.innerHTML=selectedHistoryStrokes.length?"<p>No swims recorded for the selected stroke(s).</p>":"<p>No swims recorded yet.</p>";return;}
    let html="";
    swims.forEach(function(swim){html+="<div class='historyItem' data-swim-id='"+(swim.id||"")+"'><div class='historyEvent'>"+swim.swimmer+" — "+swim.distance+" "+swim.stroke+"</div><div class='historyTime'>"+swim.finalTime+"</div><div class='historyMeta'>"+swim.date+"&nbsp;&nbsp;"+swim.time+"&nbsp;&nbsp;Pool: "+swim.course+"</div></div>";});
    container.innerHTML=html;
}
function showMergeMessage(message){
    const messageBox=document.getElementById("mergeMessage");
    messageBox.innerHTML=message;
    setTimeout(function(){messageBox.innerHTML="";},5000);
}
/* END OF FILE: ui.js */
