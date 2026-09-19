/* Swimming-specific choices kept outside the reusable timing/data core. */
var POOLSIDE_CONFIG=Object.freeze({
    strokes:["Freestyle","Backstroke","Breaststroke","Butterfly","IM"],
    distances:["25m","50m","100m","200m","400m","800m"],
    courses:["25m","50m"],
    resultSources:[
        {value:"parent",label:"Parent"},
        {value:"coach",label:"Coach"},
        {value:"official",label:"Official Gala"},
        {value:"historical",label:"Historical"}
    ]
});

function getResultSourceLabel(value){
    const source=POOLSIDE_CONFIG.resultSources.find(function(item){ return item.value === value; });
    return source ? source.label : "Manual Entry";
}

(function populateSwimmingSelectors(){
    function populate(id,values){
        const select=document.getElementById(id);
        if(!select){ return; }
        select.innerHTML="";
        values.forEach(function(item){
            const option=document.createElement("option");
            option.value=typeof item === "string" ? item : item.value;
            option.textContent=typeof item === "string" ? item : item.label;
            select.appendChild(option);
        });
    }
    populate("stroke",POOLSIDE_CONFIG.strokes);
    populate("manualStroke",POOLSIDE_CONFIG.strokes);
    populate("distance",POOLSIDE_CONFIG.distances);
    populate("manualDistance",POOLSIDE_CONFIG.distances);
    populate("course",POOLSIDE_CONFIG.courses);
    populate("manualCourse",POOLSIDE_CONFIG.courses);
    populate("manualSource",POOLSIDE_CONFIG.resultSources);
})();
