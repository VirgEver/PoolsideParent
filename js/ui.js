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

/* =====================================================
   Alpha 2.1 - History multi-filter engine
   OR within a category, AND across categories.
   UI is intentionally easy to iterate independently.
===================================================== */

function emptyHistoryFilters(){
    return { swimmers:[], strokes:[], distances:[], courses:[], pbOnly:false };
}

let appliedHistoryFilters = emptyHistoryFilters();
let draftHistoryFilters = emptyHistoryFilters();

function cloneHistoryFilters(filters){
    return {
        swimmers:filters.swimmers.slice(),
        strokes:filters.strokes.slice(),
        distances:filters.distances.slice(),
        courses:filters.courses.slice(),
        pbOnly:filters.pbOnly === true
    };
}

function parseSwimDateTime(swim){
    const direct = swim.dateTime || swim.datetime || swim.timestamp;
    if(direct){
        const directTime = Date.parse(direct);
        if(!Number.isNaN(directTime)){ return directTime; }
    }

    const dateText = String(swim.date || "").trim();
    const timeText = String(swim.time || "00:00:00").trim();
    if(!dateText){
        const created = Date.parse(swim.createdAt || "");
        return Number.isNaN(created) ? 0 : created;
    }

    let year, month, day;
    let match = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(match){
        day=Number(match[1]); month=Number(match[2])-1; year=Number(match[3]);
    }else{
        match=dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if(match){
            year=Number(match[1]); month=Number(match[2])-1; day=Number(match[3]);
        }else{
            const fallback=Date.parse(dateText);
            return Number.isNaN(fallback) ? 0 : fallback;
        }
    }

    let hours=0, minutes=0, seconds=0;
    const timeMatch=timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if(timeMatch){
        hours=Number(timeMatch[1]); minutes=Number(timeMatch[2]); seconds=Number(timeMatch[3]||0);
    }
    return new Date(year,month,day,hours,minutes,seconds).getTime();
}

function swimFilterIdentity(swim,index){
    if(swim.id){ return "id:"+swim.id; }
    return "fallback:"+[swim.swimmer,swim.stroke,swim.distance,swim.course,swim.date,swim.time,swim.finalTime,index].join("|");
}

/* Historical PB = first recorded swim for an event, then every strictly faster swim. */
function getHistoricalPBKeys(swims){
    const indexed=swims.map(function(swim,index){ return {swim:swim,index:index,key:swimFilterIdentity(swim,index)}; });
    indexed.sort(function(a,b){
        const difference=parseSwimDateTime(a.swim)-parseSwimDateTime(b.swim);
        return difference || a.index-b.index;
    });

    const bestByEvent={};
    const pbKeys=new Set();
    indexed.forEach(function(item){
        const swim=item.swim;
        const eventKey=[swim.swimmer,swim.stroke,swim.distance,swim.course].join("|");
        const milliseconds=timeToMilliseconds(swim.finalTime);
        if(!Number.isFinite(milliseconds)){ return; }
        if(bestByEvent[eventKey] === undefined || milliseconds < bestByEvent[eventKey]){
            bestByEvent[eventKey]=milliseconds;
            pbKeys.add(item.key);
        }
    });
    return pbKeys;
}

function hasActiveHistoryFilters(filters){
    return filters.swimmers.length>0 || filters.strokes.length>0 || filters.distances.length>0 || filters.courses.length>0 || filters.pbOnly;
}

function getFilteredHistorySwims(){
    const allSwims=getSwims().slice();
    const pbKeys=appliedHistoryFilters.pbOnly ? getHistoricalPBKeys(allSwims) : null;

    let swims=allSwims.filter(function(swim,index){
        if(appliedHistoryFilters.swimmers.length && !appliedHistoryFilters.swimmers.includes(swim.swimmer)){ return false; }
        if(appliedHistoryFilters.strokes.length && !appliedHistoryFilters.strokes.includes(swim.stroke)){ return false; }
        if(appliedHistoryFilters.distances.length && !appliedHistoryFilters.distances.includes(swim.distance)){ return false; }
        if(appliedHistoryFilters.courses.length && !appliedHistoryFilters.courses.includes(swim.course)){ return false; }
        if(pbKeys && !pbKeys.has(swimFilterIdentity(swim,index))){ return false; }
        return true;
    });

    swims.sort(function(a,b){ return parseSwimDateTime(b)-parseSwimDateTime(a); });
    return swims;
}

function setDraftCategory(category,value,isAll){
    if(isAll){
        draftHistoryFilters[category]=[];
        return;
    }
    const values=draftHistoryFilters[category];
    const index=values.indexOf(value);
    if(index===-1){ values.push(value); }
    else{ values.splice(index,1); }
}

function renderHistoryFilterOptions(){
    const swimmers=Array.from(new Set(getSwims().map(function(swim){return swim.swimmer;}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b);});
    const swimmerBox=document.getElementById("historySwimmerOptions");
    if(swimmerBox){
        let html='<button type="button" class="historyFilterOption" data-category="swimmers" data-value="All">All</button>';
        swimmers.forEach(function(name){ html+='<button type="button" class="historyFilterOption" data-category="swimmers" data-value="'+escapeHistoryAttribute(name)+'">'+escapeHistoryHTML(name)+'</button>'; });
        swimmerBox.innerHTML=html;
    }
    syncHistoryFilterSelections();
}

function escapeHistoryHTML(value){
    return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function escapeHistoryAttribute(value){ return escapeHistoryHTML(value); }

function syncHistoryFilterSelections(){
    const panel=document.getElementById("historyFilterPanel");
    if(!panel){ return; }
    panel.querySelectorAll(".historyFilterOption[data-category]").forEach(function(option){
        const category=option.dataset.category;
        const value=option.dataset.value;
        const selectedValues=draftHistoryFilters[category] || [];
        const selected=(value==="All") ? selectedValues.length===0 : selectedValues.includes(value);
        option.classList.toggle("selected",selected);
        option.setAttribute("aria-pressed",selected?"true":"false");
    });
    const pbButton=document.getElementById("historyPBOption");
    if(pbButton){
        pbButton.classList.toggle("selected",draftHistoryFilters.pbOnly);
        pbButton.setAttribute("aria-pressed",draftHistoryFilters.pbOnly?"true":"false");
    }
}

function historyFilterSummary(filters){
    const parts=[];
    function addValues(label,values){
        if(!values.length){ return; }
        if(values.length<=2){ parts.push(values.join(", ")); }
        else{ parts.push(values.length+" "+label); }
    }
    addValues("swimmers",filters.swimmers);
    addValues("strokes",filters.strokes);
    addValues("distances",filters.distances);
    addValues("pools",filters.courses);
    if(filters.pbOnly){ parts.push("PBs"); }
    return parts.join(" • ");
}

function updateHistoryFilterButton(resultCount){
    const button=document.getElementById("filterHistoryButton");
    const status=document.getElementById("historyFilterStatus");
    if(!button){ return; }
    const isActive=hasActiveHistoryFilters(appliedHistoryFilters);
    button.textContent=isActive ? "FILTER ✓" : "FILTER";
    button.classList.toggle("activeFilter",isActive);
    if(status){
        if(isActive){
            const count=(typeof resultCount==="number") ? resultCount : getFilteredHistorySwims().length;
            status.textContent=historyFilterSummary(appliedHistoryFilters)+" — "+count+" swim"+(count===1?"":"s");
            status.classList.remove("hidden");
        }else{
            status.textContent="";
            status.classList.add("hidden");
        }
    }
}

function closeHistoryFilter(){
    const panel=document.getElementById("historyFilterPanel");
    const button=document.getElementById("filterHistoryButton");
    if(panel){ panel.classList.add("hidden"); }
    if(button){ button.setAttribute("aria-expanded","false"); }
}

function resetHistoryFilter(){
    appliedHistoryFilters=emptyHistoryFilters();
    draftHistoryFilters=emptyHistoryFilters();
    closeHistoryFilter();
    syncHistoryFilterSelections();
    updateHistoryFilterButton();
}

function initialiseHistoryFilter(){
    const button=document.getElementById("filterHistoryButton");
    const panel=document.getElementById("historyFilterPanel");
    if(!button || !panel){ return; }

    renderHistoryFilterOptions();
    if(button.dataset.filterInitialised==="true"){ return; }
    button.dataset.filterInitialised="true";

    button.addEventListener("click",function(event){
        event.preventDefault();
        event.stopPropagation();
        const opening=panel.classList.contains("hidden");
        if(opening){
            draftHistoryFilters=cloneHistoryFilters(appliedHistoryFilters);
            renderHistoryFilterOptions();
        }
        panel.classList.toggle("hidden",!opening);
        button.setAttribute("aria-expanded",opening?"true":"false");
    });

    panel.addEventListener("click",function(event){
        const option=event.target.closest(".historyFilterOption[data-category]");
        if(option){
            event.preventDefault();
            const category=option.dataset.category;
            const value=option.dataset.value;
            setDraftCategory(category,value,value==="All");
            syncHistoryFilterSelections();
            return;
        }
        if(event.target.closest("#historyPBOption")){
            event.preventDefault();
            draftHistoryFilters.pbOnly=!draftHistoryFilters.pbOnly;
            syncHistoryFilterSelections();
        }
    });

    const clearButton=document.getElementById("clearHistoryFiltersButton");
    if(clearButton){
        clearButton.addEventListener("click",function(){
            draftHistoryFilters=emptyHistoryFilters();
            syncHistoryFilterSelections();
        });
    }

    const applyButton=document.getElementById("applyHistoryFiltersButton");
    if(applyButton){
        applyButton.addEventListener("click",function(){
            appliedHistoryFilters=cloneHistoryFilters(draftHistoryFilters);
            closeHistoryFilter();
            buildHistory();
        });
    }

    syncHistoryFilterSelections();
    updateHistoryFilterButton();
}

function buildHistory(){
    initialiseHistoryFilter();
    const container=document.getElementById("historyContainer");
    if(!container){ return; }
    const swims=getFilteredHistorySwims();
    const active=hasActiveHistoryFilters(appliedHistoryFilters);
    updateHistoryFilterButton(swims.length);

    if(swims.length===0){
        container.innerHTML=active ? "<p>No swims match the selected filters.</p>" : "<p>No swims recorded yet.</p>";
        return;
    }

    let html="";
    swims.forEach(function(swim){
        html+="<div class='historyItem' data-swim-id='"+escapeHistoryAttribute(swim.id||"")+"'><div class='historyEvent'>"+escapeHistoryHTML(swim.swimmer)+" — "+escapeHistoryHTML(swim.distance)+" "+escapeHistoryHTML(swim.stroke)+"</div><div class='historyTime'>"+escapeHistoryHTML(swim.finalTime)+"</div><div class='historyMeta'>"+escapeHistoryHTML(swim.date)+"&nbsp;&nbsp;"+escapeHistoryHTML(swim.time)+"&nbsp;&nbsp;Pool: "+escapeHistoryHTML(swim.course)+"</div></div>";
    });
    container.innerHTML=html;
}

function showMergeMessage(message){
    const messageBox=document.getElementById("mergeMessage");
    messageBox.innerHTML=message;
    setTimeout(function(){messageBox.innerHTML="";},5000);
}

/* END OF FILE: ui.js */
