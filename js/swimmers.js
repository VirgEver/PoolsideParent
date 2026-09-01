/* =====================================================
   START OF FILE: swimmers.js
   Poolside Parent
   Dynamic swimmer management + legacy migration
===================================================== */

const SWIMMERS_STORAGE_KEY = "poolsideParentSwimmers";

function normaliseSwimmerList(raw){
    if(!Array.isArray(raw)){return [];}

    const names=[];

    raw.forEach(function(item){
        const name = typeof item === "string"
            ? item.trim()
            : String(item && item.name || "").trim();

        if(!name){return;}

        const exists = names.some(function(existing){
            return existing.toLowerCase() === name.toLowerCase();
        });

        if(!exists){names.push(name);}
    });

    return names.map(function(name){
        const oldObject = raw.find(function(item){
            return item && typeof item === "object" &&
                String(item.name || "").trim().toLowerCase() === name.toLowerCase();
        });

        return {
            id: oldObject && oldObject.id ? oldObject.id : createUniqueId(),
            name:name
        };
    });
}

function saveSwimmers(swimmers){
    localStorage.setItem(SWIMMERS_STORAGE_KEY, JSON.stringify(swimmers));
}

function getSwimmers(){
    let swimmers=[];

    try{
        const stored = localStorage.getItem(SWIMMERS_STORAGE_KEY);
        if(stored){
            swimmers = normaliseSwimmerList(JSON.parse(stored));
        }
    }catch(error){
        console.error("Could not read swimmers:",error);
    }

    // Always supplement the swimmer list from saved history.
    if(typeof getSwims === "function"){
        getSwims().forEach(function(swim){
            const name = String(swim && swim.swimmer || "").trim();
            if(!name){return;}

            const exists = swimmers.some(function(swimmer){
                return swimmer.name.toLowerCase() === name.toLowerCase();
            });

            if(!exists){
                swimmers.push({id:createUniqueId(),name:name});
            }
        });
    }

    swimmers.sort(function(a,b){
        return a.name.localeCompare(b.name,undefined,{sensitivity:"base"});
    });

    saveSwimmers(swimmers);
    return swimmers;
}

function addSwimmer(name){
    const cleanName = String(name || "").trim();
    if(!cleanName){return null;}

    const swimmers = getSwimmers();
    const existing = swimmers.find(function(swimmer){
        return swimmer.name.toLowerCase() === cleanName.toLowerCase();
    });

    if(existing){return existing;}

    const swimmer={id:createUniqueId(),name:cleanName};
    swimmers.push(swimmer);
    swimmers.sort(function(a,b){
        return a.name.localeCompare(b.name,undefined,{sensitivity:"base"});
    });
    saveSwimmers(swimmers);
    return swimmer;
}

function syncSwimmersFromHistory(){
    return getSwimmers();
}

function renderSwimmerSelectors(selectedName){
    const swimmers = getSwimmers();
    const selectors=[
        document.getElementById("swimmer"),
        document.getElementById("manualSwimmer")
    ];

    selectors.forEach(function(select){
        if(!select){return;}

        const previous = selectedName || select.value || "";
        select.innerHTML="";

        const placeholder=document.createElement("option");
        placeholder.value="";
        placeholder.textContent="Select swimmer";
        select.appendChild(placeholder);

        swimmers.forEach(function(swimmer){
            const option=document.createElement("option");
            option.value=swimmer.name;
            option.textContent=swimmer.name;
            option.dataset.swimmerId=swimmer.id;
            select.appendChild(option);
        });

        if(previous && swimmers.some(function(swimmer){return swimmer.name === previous;})){
            select.value=previous;
        }
    });
}

function initialiseSwimmers(){
    renderSwimmerSelectors();

    const addButton=document.getElementById("addSwimmerButton");
    if(addButton && addButton.dataset.initialised !== "true"){
        addButton.dataset.initialised="true";
        addButton.addEventListener("click",function(){
            const name=prompt("Enter swimmer name:");
            if(name === null){return;}

            const cleanName=String(name).trim();
            if(!cleanName){return;}

            const swimmer=addSwimmer(cleanName);
            if(swimmer){renderSwimmerSelectors(swimmer.name);}
        });
    }

    const startButton=document.getElementById("startButton");
    const swimmerSelect=document.getElementById("swimmer");
    if(startButton && swimmerSelect && startButton.dataset.swimmerValidation !== "true"){
        startButton.dataset.swimmerValidation="true";
        startButton.addEventListener("click",function(event){
            if(!swimmerSelect.value){
                event.preventDefault();
                event.stopImmediatePropagation();
                alert("Please select a swimmer.");
            }
        },true);
    }

    const saveManualButton=document.getElementById("saveManualButton");
    const manualSwimmer=document.getElementById("manualSwimmer");
    if(saveManualButton && manualSwimmer && saveManualButton.dataset.swimmerValidation !== "true"){
        saveManualButton.dataset.swimmerValidation="true";
        saveManualButton.addEventListener("click",function(event){
            if(!manualSwimmer.value){
                event.preventDefault();
                event.stopImmediatePropagation();
                alert("Please select a swimmer.");
            }
        },true);
    }
}

/* =====================================================
   END OF FILE: swimmers.js
===================================================== */
