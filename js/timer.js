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
    return formatElapsedMilliseconds(ms);
}


/* =====================================================
   Update Timer
===================================================== */

function updateTimer(){

    if(!running){

        return;

    }

    let elapsed = elapsedSince(startTime,Date.now());

    timerDisplay.innerHTML =
        formatTime(elapsed);
    if(splitNumber === 0){
        document.getElementById("splitTimerDisplay").textContent = formatTime(elapsed);
    }

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
    splitContainer.hidden = true;
    document.getElementById("splitTimerDisplay").hidden = false;
    document.getElementById("splitTimerDisplay").textContent = "00:00.00";

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

    let elapsed = elapsedSince(startTime,Date.now());

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

    const latestSplit = document.getElementById("latestSplit");
    if(latestSplit){
        latestSplit.textContent = "Split " + splitNumber + " · " + lapString + " · Total " + totalString;
    }

    renderSplits();

    return totalString;

}


/* =====================================================
   Render Splits
===================================================== */

function renderSplits(){

    splitContainer.innerHTML = "";
    splitContainer.hidden = false;
    document.getElementById("splitTimerDisplay").hidden = true;

    let header =
        document.createElement(
            "span"
        );

    header.className =
        "splitHeader";

    header.innerHTML =

        "<span></span>"

        +

        "<span>Split</span>"

        +

        "<span>Total</span>";

    splitContainer.appendChild(
        header
    );


    splitData.slice(-5).reverse().forEach(

        function(split){

            let row =
                document.createElement(
                    "span"
                );

            row.className =
                "splitRow";

            row.innerHTML =

                "<span>L"

                +

                split.lap

                +

                "</span>"

                +

                "<span>"

                +

                split.lapTime

                +

                "</span>"

                +

                "<span>"

                +

                split.totalTime

                +

                "</span>";

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

    let elapsed = elapsedSince(startTime,Date.now());

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
    splitContainer.hidden = true;
    document.getElementById("splitTimerDisplay").hidden = false;
    document.getElementById("splitTimerDisplay").textContent = "00:00.00";

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
