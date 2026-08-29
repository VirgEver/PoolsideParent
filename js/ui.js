Exit code: 0
Wall time: 7.6 seconds
Output:
/* =====================================================
   START OF FILE: ui.js
===================================================== */


/* =====================================================
   Summary Reference
===================================================== */

const summaryCard =
    document.getElementById(

        "summaryCard"

    );


/* =====================================================
   Build Result Summary
===================================================== */

function buildResultSummary(

    previousPB

){

    let pbHTML =
        "";


    if(

        currentSession.showPB

    ){

        if(

            previousPB

        ){

            const difference =

                calculateDifference(

                    finalTime,

                    previousPB.finalTime

                );


            pbHTML =

                "<div class='pbBox'>"

                +

                "<div class='pbTitle'>"

                +

                "PB"

                +

                "</div>"

                +

                "<div>"

                +

                previousPB.finalTime

                +

                "</div>"

                +

                "<div class='pbDifference'>"

                +

                "Difference: "

                +

                difference

                +

                "</div>"

                +

                "</div>";

        }

        else{

            pbHTML =

                "<div class='pbBox'>"

                +

                "<div class='pbTitle'>"

                +

                "PB"

                +

                "</div>"

                +

                "<div>"

                +

                "First recorded swim"

                +

                "</div>"

                +

                "</div>";

        }

    }


    let splitHTML =
        "";


    splitData.forEach(

        function(split){

            splitHTML +=

                "<div class='summarySplitRow'>"

                +

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

                "</div>"

                +

                "</div>";

        }

    );


    summaryCard.innerHTML =

        "<div class='summaryTitle'>"

        +

        currentSession.swimmer

        +

        "</div>"

        +

        "<div class='summaryEvent'>"

        +

        currentSession.distance

        +

        " "

        +

        currentSession.stroke

        +

        "</div>"

        +

        "<div class='finalHeading'>"

        +

        "Final Time"

        +

        "</div>"

        +

        "<div class='finalTime'>"

        +

        finalTime

        +

        "</div>"

        +

        "<div class='summarySplits'>"

        +

        "<div class='summarySplitsTitle'>"

        +

        "Splits"

        +

        "</div>"

        +

        splitHTML

        +

        "</div>"

        +

        pbHTML

        +

        "<div class='summarySmall'>"

        +

        sessionDate

        +

        "&nbsp;&nbsp;&nbsp;"

        +

        sessionTime

        +

        "</div>";

}

/* =====================================================
   Alpha 1.3.2
   Pending Result State
===================================================== */

let resultDiscarded = false;


/* =====================================================
   Clear Result Summary
===================================================== */

function clearResultSummary(){

    summaryCard.innerHTML =
        "";

}


/* =====================================================
   Get Current Swim
===================================================== */

function getCurrentSwim(){

    return {

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
            getSplitData()

    };

}


/* =====================================================
   Alpha 1.3.2
   Save Pending Swim
===================================================== */

function saveCurrentSwim(){

    let swim =
        getPendingSwim();


    if(!swim){

        return;

    }


    saveSwim({

        swimmer:
            swim.swimmer,


        stroke:
            swim.stroke,


        distance:
            swim.distance,


        course:
            swim.course,


        date:
            swim.date,


        time:
            swim.time,


        finalTime:
            swim.finalTime,


        splits:
            swim.splits,


        lengths:
            swim.lengths,


        source:
            "parent"

    });


    clearPendingSwim();

}

/* =====================================================
   Discard Pending Result
   Alpha 1.3.2
===================================================== */

function discardResult(){

    clearPendingSwim();

    showSetupScreen();

}


/* =====================================================
   Finish Swim
===================================================== */

function finishSwim(previousPB){

    buildResultSummary(previousPB);

    resultDiscarded = false;

}

/* =====================================================
   Auto Save Result
   Alpha 1.3.2
===================================================== */

function leaveResultScreen(){

    if(
        getPendingSwim()
    ){

        saveCurrentSwim();

    }

}

/* =====================================================
   Build History
===================================================== */

function buildHistory(){

    const container =
        document.getElementById(

            "historyContainer"

        );


    const swims =
        getSwims();


    if(

        swims.length === 0

    ){

        container.innerHTML =

            "<p>No swims recorded yet.</p>";


        return;

    }


    const sorted =
        swims

            .slice()

            .reverse();


    let html =
        "";


    sorted.forEach(

        function(swim){

            html +=

                "<div class='historyItem'>"

                +

                "<div class='historyEvent'>"

                +

                swim.swimmer

                +

                " â€” "

                +

                swim.distance

                +

                " "

                +

                swim.stroke

                +

                "</div>"

                +

                "<div class='historyTime'>"

                +

                swim.finalTime

                +

                "</div>"

                +

                "<div class='historyMeta'>"

                +

                swim.date

                +

                "&nbsp;&nbsp;"

                +

                swim.time

                +

                "&nbsp;&nbsp;"

                +

                "Pool: "

                +

                swim.course

                +

                "</div>"

                +

                "</div>";

        }

    );


    container.innerHTML =
        html;

}


/* =====================================================
   Show Merge Message
===================================================== */

function showMergeMessage(

    message

){

    const messageBox =
        document.getElementById(

            "mergeMessage"

        );


    messageBox.innerHTML =
        message;


    setTimeout(

        function(){

            messageBox.innerHTML =
                "";

        },

        5000

    );

}


/* =====================================================
   END OF FILE: ui.js
===================================================== */
