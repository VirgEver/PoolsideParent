/* =====================================================
   START OF FILE: result-edit.js
   Poolside Parent
   Edit swim details after STOP - dynamic swimmers
===================================================== */

(function(){

    const resultScreen = document.getElementById("resultScreen");
    if(!resultScreen){ return; }

    const fields = [
        { id:"resultSwimmer", label:"Swimmer", key:"swimmer", dynamicSwimmers:true },
        { id:"resultStroke", label:"Stroke", key:"stroke", values:["Freestyle","Backstroke","Breaststroke","Butterfly","IM"] },
        { id:"resultDistance", label:"Distance", key:"distance", values:["25m","50m","100m","200m","400m"] },
        { id:"resultCourse", label:"Pool", key:"course", values:["25m","50m"] }
    ];

    function getSwimmerNames(){
        if(typeof syncSwimmersFromHistory === "function"){
            syncSwimmersFromHistory();
        }

        if(typeof getSwimmers !== "function"){
            return [];
        }

        return getSwimmers()
            .map(function(swimmer){ return swimmer && swimmer.name ? swimmer.name : ""; })
            .filter(Boolean)
            .sort(function(a,b){
                return a.localeCompare(b, undefined, {sensitivity:"base"});
            });
    }

    function populateSelect(select, field){
        const currentValue = select.value;
        const values = field.dynamicSwimmers ? getSwimmerNames() : (field.values || []);

        select.innerHTML = "";

        values.forEach(function(value){
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        if(currentValue && values.indexOf(currentValue) !== -1){
            select.value = currentValue;
        }
    }

    function createControls(){
        if(document.getElementById("resultEditPanel")){ return; }

        const panel = document.createElement("div");
        panel.id = "resultEditPanel";
        panel.className = "resultEditPanel";

        fields.forEach(function(field){
            const row = document.createElement("div");
            row.className = "resultEditRow";

            const label = document.createElement("label");
            label.htmlFor = field.id;
            label.textContent = field.label;

            const select = document.createElement("select");
            select.id = field.id;
            populateSelect(select, field);

            select.addEventListener("change", updateDetails);

            row.appendChild(label);
            row.appendChild(select);
            panel.appendChild(row);
        });

        const summaryCard = document.getElementById("summaryCard");
        summaryCard.parentNode.insertBefore(panel, summaryCard.nextSibling);
    }

    function setControlValues(swim){
        fields.forEach(function(field){
            const select = document.getElementById(field.id);
            if(!select){ return; }

            if(field.dynamicSwimmers){
                populateSelect(select, field);
            }

            if(swim[field.key]){
                select.value = swim[field.key];
            }
        });
    }

    function updateDetails(){
        const pending = getPendingSwim();
        if(!pending){ return; }

        fields.forEach(function(field){
            const select = document.getElementById(field.id);
            if(select){
                pending[field.key] = select.value;
                currentSession[field.key] = select.value;
            }
        });

        const previousPB = getPersonalBest(
            currentSession.swimmer,
            currentSession.stroke,
            currentSession.distance,
            currentSession.course
        );

        pending.previousPB = previousPB;
        buildResultSummary(previousPB);
    }

    function refreshControls(){
        const pending = getPendingSwim();
        if(!pending){ return; }

        createControls();
        setControlValues(pending);
    }

    const observer = new MutationObserver(function(){
        if(!resultScreen.classList.contains("hidden")){
            refreshControls();
        }
    });

    observer.observe(resultScreen, {
        attributes:true,
        attributeFilter:["class"]
    });

    if(!resultScreen.classList.contains("hidden")){
        refreshControls();
    }

    const style = document.createElement("style");
    style.textContent = `
        .resultEditPanel{margin:12px 0 18px;}
        .resultEditRow{display:flex;align-items:center;gap:10px;margin:8px 0;}
        .resultEditRow label{flex:0 0 90px;}
        .resultEditRow select{flex:1;min-height:42px;font-size:16px;}
    `;
    document.head.appendChild(style);

})();

/* END OF FILE: result-edit.js */
