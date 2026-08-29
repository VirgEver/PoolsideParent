Exit code: 0
Wall time: 5 seconds
Output:
/* =====================================================
   START OF FILE: timer.js
===================================================== */


/* =====================================================
   Timer Variables
===================================================== */

let running = false;

let startTime = 0;

let interval = null;

let lastSplitElapsed = 0;

let splitNumber = 0;

let splitData = [];

let sessionDate = "";

let sessionTime = "";

let finalTime = "";

let pendingSwim = null;


/* =====================================================
   DOM References
===================================================== */

const timerDisplay =
    document.getElementById(
        "timerDisplay"
    );

const splitContainer =
    document.getElementById(
        "splitContainer"
    );


/* =====================================================
   Format Time
===================================================== */

function formatTime(ms){

    let minutes =
        Math.floor(
            ms / 60000
        );

    let seconds =
        Math.floor(
            (ms % 60000) / 1000
        );

    let hundredths =
        Math.floor(
            (ms % 1000) / 10
        );

    return String(minutes)
            .padStart(2,"0")

        + ":"

        +

        String(seconds)
            .padStart(2,"0")

        + "."

        +

        String(hundredths)
            .padStart(2,"0");

}


/* =====================================================
   Update Timer
===================================================== */

function updateTimer(){

    if(!running){

        return;

    }

    let elapsed =
        Date.now()
        -
        startTime;

    timerDisplay.innerHTML =
        formatTime(elapsed);

}


/* =====================================================
   Start Timer
===================================================== */

function startTimer(){

    running = true;

    startTime =
        Date.now();

    lastSplitElapsed = 0;

    splitNumber = 0;

    splitData = [];

    finalTime = "";

    timerDisplay.innerHTML =
        "00:00.00";

    splitContainer.innerHTML =
        "";

    const now =
        new Date();

    sessionDate =
        now.toLocaleDateString(
            "en-GB"
        );

    sessionTime =
        now.toLocaleTimeString(

            "en-GB",

            {

                hour:"2-digit",

                minute:"2-digit",

                hour12:false

            }

        );

    interval =
        setInterval(

            updateTimer,

            10

        );

}


/* =====================================================
   Record Split
===================================================== */

function recordSplit(){

    if(!running){

        return;

    }

    let elapsed =
        Date.now()
        -
        startTime;

    addSplit(elapsed);

}


/* =====================================================
   Add Split
===================================================== */

function addSplit(totalElapsed){

    splitNumber++;

    let lapTime =
        totalElapsed
        -
        lastSplitElapsed;

    lastSplitElapsed =
        totalElapsed;

    let lapString =
        formatTime(lapTime);

    let totalString =
        formatTime(totalElapsed);

    splitData.push({

        lap:splitNumber,

        lapTime:lapString,

        totalTime:totalString

    });

    renderSplits();

    return totalString;

}


/* =====================================================
   Render Splits
===================================================== */

function renderSplits(){

    splitContainer.innerHTML =
        "";

    let header =
        document.createElement(
            "div"
        );

    header.className =
        "splitHeader";

    header.innerHTML =

        "<div></div>"

        +

        "<div>Split</div>"

        +

        "<div>Total</div>";

    splitContainer.appendChild(
        header
    );


    splitData.forEach(

        function(split){

            let row =
                document.createElement(
                    "div"
                );

            row.className =
                "splitRow";

            row.innerHTML =

                "<div>L"

                +

                split.lap

                +

                "</div>"

                +

                "<div>"

                +

                split.lapTime

                +

                "</div>"

                +

                "<div>"

                +

                split.totalTime

                +

                "</div>";

            splitContainer.appendChild(
                row
            );

        }

    );

}


/* =====================================================
   Stop Timer
===================================================== */

function stopTimer(){

    if(!running){

        return;

    }

    running = false;

    clearInterval(interval);

    let elapsed =
        Date.now()
        -
        startTime;

    finalTime =
        addSplit(elapsed);


    /*
       Important:

       Retrieve the PB before saving
       the current swim.
    */

    let previousPB =
        getPersonalBest(

            currentSession.swimmer,

            currentSession.stroke,

            currentSession.distance,

            currentSession.course

        );


    createPendingSwim(previousPB);

}

/* =====================================================
   Create Pending Swim
   Alpha 1.3.2
===================================================== */

function createPendingSwim(previousPB){

    pendingSwim = {

        swimmer:
            currentSession.swimmer,

        stroke:
            currentSession.stroke,

        distance:
            currentSession.distance,

        course:
            currentSession.course,

        date:
            sessionDate,

        time:
            sessionTime,

        finalTime:
            finalTime,

        lengths:
            splitNumber,

        splits:
            getSplitData(),

        previousPB:
            previousPB

    };


    finishSwim(previousPB);

}


/* =====================================================
   Reset Timer
===================================================== */

function resetTimer(){

    running = false;

    clearInterval(interval);

    timerDisplay.innerHTML =
        "00:00.00";

    splitContainer.innerHTML =
        "";

    splitData = [];

    splitNumber = 0;

    lastSplitElapsed = 0;

    finalTime = "";
	
	pendingSwim = null;

}


/* =====================================================
   Get Split Data
===================================================== */

function getSplitData(){

    return splitData;

}


/* =====================================================
   Pending Swim Access
   Alpha 1.3.2
===================================================== */

function getPendingSwim(){

    return pendingSwim;

}


function clearPendingSwim(){

    pendingSwim = null;

}

/* =====================================================
   END OF FILE: timer.js
===================================================== */
