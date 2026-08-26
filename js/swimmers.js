/* =====================================================
   START OF FILE: swimmers.js
   Poolside Parent
   Swimmer management using localStorage
===================================================== */

const SWIMMERS_STORAGE_KEY = "poolsideParentSwimmers";

function getSwimmers(){
    try{
        const stored = localStorage.getItem(SWIMMERS_STORAGE_KEY);
        if(stored){
            const parsed = JSON.parse(stored);
            if(Array.isArray(parsed)){
                return parsed.filter(function(swimmer){
                    return swimmer && swimmer.id && swimmer.name;
                });
            }
        }
    }
    catch(error){
        console.error("Could not read swimmers:", error);
    }

    const names = [];

    if(typeof getSwims === "function"){
        getSwims().forEach(function(swim){
            const name = String(swim.swimmer || "").trim();
            if(name && !names.some(function(existing){
                return existing.toLowerCase() === name.toLowerCase();
            })){
                names.push(name);
            }
        });
    }

    const migrated = names.map(function(name){
        return { id:createUniqueId(), name:name };
    });

    saveSwimmers(migrated);
    return migrated;
}

function saveSwimmers(swimmers){
    localStorage.setItem(
        SWIMMERS_STORAGE_KEY,
        JSON.stringify(swimmers)
    );
}

function addSwimmer(name){
    const cleanName = String(name || "").trim();
    if(!cleanName){
        return null;
    }

    const swimmers = getSwimmers();
    const duplicate = swimmers.find(function(swimmer){
        return swimmer.name.toLowerCase() === cleanName.toLowerCase();
    });

    if(duplicate){
        return duplicate;
    }

    const swimmer = {
        id:createUniqueId(),
        name:cleanName
    };

    swimmers.push(swimmer);
    saveSwimmers(swimmers);
    return swimmer;
}

function syncSwimmersFromHistory(){
    const swimmers = getSwimmers();

    if(typeof getSwims !== "function"){
        return swimmers;
    }

    let changed = false;

    getSwims().forEach(function(swim){
        const name = String(swim.swimmer || "").trim();
        if(!name){
            return;
        }

        const exists = swimmers.some(function(swimmer){
            return swimmer.name.toLowerCase() === name.toLowerCase();
        });

        if(!exists){
            swimmers.push({
                id:createUniqueId(),
                name:name
            });
            changed = true;
        }
    });

    if(changed){
        saveSwimmers(swimmers);
    }

    return swimmers;
}

function renderSwimmerSelectors(selectedName){
    const selectors = [
        document.getElementById("swimmer"),
        document.getElementById("manualSwimmer")
    ];

    const swimmers = syncSwimmersFromHistory()
        .slice()
        .sort(function(a,b){
            return a.name.localeCompare(
                b.name,
                undefined,
                { sensitivity:"base" }
            );
        });

    selectors.forEach(function(select){
        if(!select){
            return;
        }

        select.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select swimmer";
        select.appendChild(placeholder);

        swimmers.forEach(function(swimmer){
            const option = document.createElement("option");
            option.value = swimmer.name;
            option.textContent = swimmer.name;
            option.dataset.swimmerId = swimmer.id;
            select.appendChild(option);
        });

        if(selectedName){
            select.value = selectedName;
        }
    });
}

function initialiseSwimmers(){
    renderSwimmerSelectors();

    const addButton = document.getElementById("addSwimmerButton");

    if(addButton){
        addButton.addEventListener("click", function(){
            const name = prompt("Enter swimmer name:");

            if(name === null){
                return;
            }

            const cleanName = String(name).trim();
            if(!cleanName){
                return;
            }

            const swimmers = getSwimmers();
            const duplicate = swimmers.find(function(swimmer){
                return swimmer.name.toLowerCase() === cleanName.toLowerCase();
            });

            if(duplicate){
                renderSwimmerSelectors(duplicate.name);
                alert(duplicate.name + " is already in your swimmers.");
                return;
            }

            const swimmer = addSwimmer(cleanName);
            if(swimmer){
                renderSwimmerSelectors(swimmer.name);
            }
        });
    }

    const startButton = document.getElementById("startButton");
    const swimmerSelect = document.getElementById("swimmer");

    if(startButton && swimmerSelect){
        startButton.addEventListener("click", function(event){
            if(!swimmerSelect.value){
                event.preventDefault();
                event.stopImmediatePropagation();
                alert("Please select a swimmer.");
            }
        }, true);
    }

    const saveManualButton = document.getElementById("saveManualButton");
    const manualSwimmer = document.getElementById("manualSwimmer");

    if(saveManualButton && manualSwimmer){
        saveManualButton.addEventListener("click", function(event){
            if(!manualSwimmer.value){
                event.preventDefault();
                event.stopImmediatePropagation();
                alert("Please select a swimmer.");
            }
        }, true);
    }
}

/* =====================================================
   END OF FILE: swimmers.js
===================================================== */
