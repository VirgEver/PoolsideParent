/* =====================================================
   START OF FILE: result-edit.js
   Poolside Parent
   Edit swim details after STOP
===================================================== */

(function(){

    const resultScreen =
        document.getElementById("resultScreen");

    if(!resultScreen){
        return;
    }

    const fields = [
        {
            id: "resultSwimmer",
            label: "Swimmer",
            values: [],
            key: "swimmer"
        },
        {
            id: "resultStroke",
            label: "Stroke",
            values: [
                "Freestyle",
                "Backstroke",
                "Breaststroke",
                "Butterfly",
                "Individual Medley"
            ],
            key: "stroke"
        },
        {
            id: "resultDistance",
            label: "Distance",
            values: ["25m", "50m", "100m", "200m", "400m"],
            key: "distance"
        },
        {
            id: "resultCourse",
            label: "Pool",
            values: ["25m", "50m"],
            key: "course"
        }
    ];


    function getResultSwimmerNames(){

        if(typeof getSwimmers !== "function"){
            return [];
        }

        return getSwimmers()
            .slice()
            .sort(function(a,b){
                return a.name.localeCompare(
                    b.name,
                    undefined,
                    {sensitivity:"base"}
                );
            })
            .map(function(swimmer){
                return swimmer.name;
            });

    }


    function createControls(){

        if(document.getElementById("resultEditPanel")){
            return;
        }

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

            const values =
                field.key === "swimmer"
                    ? getResultSwimmerNames()
                    : field.values;

            values.forEach(function(value){
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });

            select.addEventListener("change", function(){
                updateDetails();
            });

            row.appendChild(label);
            row.appendChild(select);
            panel.appendChild(row);
        });

        const summaryCard =
            document.getElementById("summaryCard");

        summaryCard.parentNode.insertBefore(
            panel,
            summaryCard.nextSibling
        );

    }


    function refreshSwimmerOptions(){

        const select =
            document.getElementById("resultSwimmer");

        if(!select){
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML = "";

        getResultSwimmerNames().forEach(function(name){

            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);

        });

        if(currentValue){
            select.value = currentValue;
        }

    }


    function setControlValues(swim){

        fields.forEach(function(field){

            const select = document.getElementById(field.id);

            if(select && swim[field.key]){
                select.value = swim[field.key];
            }
        });

    }


    function updateDetails(){

        const pending = getPendingSwim();

        if(!pending){
            return;
        }

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

        if(!pending){
            return;
        }

        createControls();
        refreshSwimmerOptions();
        setControlValues(pending);
    }


    function resultScreenChanged(){

        if(!resultScreen.classList.contains("hidden")){
            refreshControls();
        }
    }


    const observer = new MutationObserver(function(){
        resultScreenChanged();
    });

    observer.observe(resultScreen, {
        attributes: true,
        attributeFilter: ["class"]
    });

    resultScreenChanged();


    const style = document.createElement("style");

    style.textContent = `
        .resultEditPanel {
            margin: 12px 0 18px;
        }

        .resultEditRow {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 8px 0;
        }

        .resultEditRow label {
            flex: 0 0 90px;
        }

        .resultEditRow select {
            flex: 1;
            min-height: 42px;
            font-size: 16px;
        }
    `;

    document.head.appendChild(style);

})();

/* =====================================================
   END OF FILE: result-edit.js
===================================================== */
