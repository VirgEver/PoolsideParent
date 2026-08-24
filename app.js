/* =====================================================
   START OF FILE: app.js
===================================================== */


/* =====================================================
   Screen References
===================================================== */

const setupScreen =
    document.getElementById(

        "setupScreen"

    );


const timingScreen =
    document.getElementById(

        "timingScreen"

    );


const resultScreen =
    document.getElementById(

        "resultScreen"

    );


const historyScreen =
    document.getElementById(

        "historyScreen"

    );


var manualScreen =
    document.getElementById(

        "manualScreen"
    ); 


/* =====================================================
   Button References
===================================================== */

const startButton =
    document.getElementById(

        "startButton"

    );


const splitButton =
    document.getElementById(

        "splitButton"

    );


const stopButton =
    document.getElementById(

        "stopButton"

    );


const exportButton =
    document.getElementById(

        "exportButton"

    );


const historyButton =
    document.getElementById(

        "historyButton"

    );


const historyResultButton =
    document.getElementById(

        "historyResultButton"

    );


const closeHistoryButton =
    document.getElementById(

        "closeHistoryButton"

    );


const newSwimButton =
    document.getElementById(

        "newSwimButton"

    );


const shareHistoryButton =
    document.getElementById(

        "shareHistoryButton"

    );


const mergeHistoryButton =
    document.getElementById(
        "mergeHistoryButton"

    );

const clearHistoryButton =
    document.getElementById(
        "clearHistoryButton"
    );

const manualButton =
    document.getElementById(
        "manualButton"
    );

const saveManualButton =
    document.getElementById(
        "saveManualButton"
    );

const cancelManualButton =
    document.getElementById(
        "cancelManualButton"
    );


const discardResultButton =
    document.getElementById(
        "discardResultButton"
    );


const historyFileInput =
    document.getElementById(

        "historyFileInput"

    );


/* =====================================================
   Session Header
===================================================== */

const sessionSwimmer =
    document.getElementById(

        "sessionSwimmer"

    );


const sessionEvent =
    document.getElementById(

        "sessionEvent"

    );


/* =====================================================
   Current Session
===================================================== */

let currentSession = {

    swimmer:"",
    stroke:"",
    distance:"",
    course:"",
    showPB:true

};


/* =====================================================
   Screen Navigation
===================================================== */

function hideAllScreens(){

    setupScreen.classList.add(

        "hidden"

    );


    timingScreen.classList.add(

        "hidden"

    );


    resultScreen.classList.add(

        "hidden"

    );


    historyScreen.classList.add(

        "hidden"

    );

	if(manualScreen){

    	manualScreen.classList.add(
        "hidden"
    );

	}

}


function showSetupScreen(){

    leaveResultScreen();

    hideAllScreens();

    setupScreen.classList.remove(
        "hidden"
    );

}


function showTimingScreen(){

    hideAllScreens();


    timingScreen.classList.remove(

        "hidden"

    );

}


function showResultScreen(){

    hideAllScreens();


    resultScreen.classList.remove(

        "hidden"

    );

}


function showHistoryScreen(){

    leaveResultScreen();

    hideAllScreens();

    historyScreen.classList.remove(
        "hidden"
    );

    buildHistory();

}

function showManualScreen(){

    hideAllScreens();

    manualScreen.classList.remove(
        "hidden"
    );

    initialiseManualScreen();

}


/* =====================================================
   Load Session Settings
===================================================== */

function loadSessionSettings(){

    currentSession.swimmer =

        document.getElementById(

            "swimmer"

        ).value;


    currentSession.stroke =

        document.getElementById(

            "stroke"

        ).value;


    currentSession.distance =

        document.getElementById(

            "distance"

        ).value;


    currentSession.course =

        document.getElementById(

            "course"

        ).value;


    currentSession.showPB =

        document.getElementById(

            "showPB"

        ).checked;

}


/* =====================================================
   Update Timing Header
===================================================== */

function updateTimingHeader(){

    sessionSwimmer.innerHTML =

        currentSession.swimmer;


    sessionEvent.innerHTML =

        currentSession.distance

        +

        " "

        +

        currentSession.stroke

        +

        " ("

        +

        currentSession.course

        +

        ")";

}


/* =====================================================
   Start Session
===================================================== */

startButton.addEventListener(

    "click",

    function(){

        loadSessionSettings();


        updateTimingHeader();


        showTimingScreen();


        startTimer();

    }

);


/* =====================================================
   Split
===================================================== */

splitButton.addEventListener(

    "click",

    function(){

        recordSplit();

    }

);


/* =====================================================
   Stop
===================================================== */

stopButton.addEventListener(

    "click",

    function(){

        stopTimer();


        showResultScreen();

    }

);


/* =====================================================
   Export Current Swim
===================================================== */

if (exportButton) {
exportButton.addEventListener(

    "click",

    function(){

        leaveResultScreen();

        exportCSV();

    }

);
}


/* =====================================================
   Open History
===================================================== */

if (historyButton) {
historyButton.addEventListener(

    "click",

    function(){

	leaveResultScreen();

        showHistoryScreen();

    }

);
}

if (historyResultButton) {
historyResultButton.addEventListener(

    "click",

    function(){

        showHistoryScreen();

    }

);
}

/* =====================================================
   Close History
===================================================== */

if (closeHistoryButton) {
closeHistoryButton.addEventListener(

    "click",

    function(){

        showSetupScreen();

    }

);
}

/*================================================
	discard result
================================================== */

if(discardResultButton){

    discardResultButton.addEventListener(

        "click",

        function(){

            discardResult();

        }

    );

}


/* =====================================================
   New Swim
===================================================== */

newSwimButton.addEventListener(

    "click",

    function(){

        leaveResultScreen();

        resetTimer();

        showSetupScreen();

    }

);


/* =====================================================
   Share Complete History
===================================================== */

if (shareHistoryButton) {
shareHistoryButton.addEventListener(

    "click",

    function(){

        exportHistory();

    }

);
}

/* ===============================================
   Clear History
================================================= */

if(clearHistoryButton){
    clearHistoryButton.addEventListener(

        "click",
        function(){

            if(
                confirm(
                    "Clear all swim history?"
                )
            ){

                clearDatabase();

                buildHistory();

            }

        }

    );

}

/* =====================================================
   Open Merge File Picker
===================================================== */

if (mergeHistoryButton) {
mergeHistoryButton.addEventListener(

    "click",

    function(){

        historyFileInput.click();

    }

);
}

/* =====================================================
   Read Selected History File
===================================================== */

historyFileInput.addEventListener(

    "change",

    function(event){

        const file =
            event.target.files[0];


        if(!file){

            return;

        }


        const reader =
            new FileReader();


        reader.onload =

            function(){

                try{

                    const importedData =

                        JSON.parse(

                            reader.result

                        );


                    let importedSwims;


                    if(

                        Array.isArray(

                            importedData

                        )

                    ){

                        importedSwims =
                            importedData;

                    }

                    else if(

                        Array.isArray(

                            importedData.swims

                        )

                    ){

                        importedSwims =

                            importedData.swims;

                    }

                    else{

                        throw new Error(

                            "No swim history found"

                        );

                    }


                    const result =

                        mergeSwimHistory(

                            importedSwims

                        );


                    showMergeMessage(

                        result.added

                        +

                        " new swims added. "

                        +

                        result.duplicates

                        +

                        " duplicates skipped. "

                        +

                        "Total history: "

                        +

                        result.total

                    );


                    buildHistory();


                }

                catch(error){

                    console.error(

                        "History import failed:",

                        error

                    );


                    showMergeMessage(

                        "Unable to import history file."

                    );

                }

            };


        reader.readAsText(

            file

        );


        event.target.value =
            "";

    }

);

/* =====================================================
   New buttons wired up Alpha 1.3.1
===================================================== */

manualButton.addEventListener(

    "click",

    function(){

        showManualScreen();

    }

);

saveManualButton.addEventListener(

    "click",

    function(){

        saveManualSwim();

    }

);

cancelManualButton.addEventListener(

    "click",

    function(){

        showSetupScreen();

    }

);


/* =====================================================
   Initialise
===================================================== */

showSetupScreen();


/* =====================================================
   END OF FILE: app.js
===================================================== */