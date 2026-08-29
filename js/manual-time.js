/* =====================================================
   START OF FILE : manual-time.js
   Poolside Parent Alpha 1.3.1
===================================================== */


/* =====================================================
   Manual Screen References
===================================================== */

/* ======================
const manualScreen =
    document.getElementById(
        "manualScreen"
    );
========================== */

const manualSwimmer =
    document.getElementById(
        "manualSwimmer"
    );

const manualStroke =
    document.getElementById(
        "manualStroke"
    );

const manualDistance =
    document.getElementById(
        "manualDistance"
    );

const manualCourse =
    document.getElementById(
        "manualCourse"
    );

const manualSource =
    document.getElementById(
        "manualSource"
    );

const manualDate =
    document.getElementById(
        "manualDate"
    );

const manualMinutes =
    document.getElementById(
        "manualMinutes"
    );


const manualSeconds =
    document.getElementById(
        "manualSeconds"
    );


const manualHundredths =
    document.getElementById(
        "manualHundredths"
    );


/* =====================================================
   Initialise Manual Screen
===================================================== */

function initialiseManualScreen(){

    const today = new Date();

    manualDate.value =
        today.toISOString().substring(0,10);

    manualMinutes.value = "";
    manualSeconds.value = "";
    manualHundredths.value = "";

}


/* =====================================================
   Validate Time Format
   Expected mm:ss.hh
===================================================== */

function getManualTime(){

    let minutes =
        manualMinutes.value || "0";


    let seconds =
        manualSeconds.value || "0";


    let hundredths =
        manualHundredths.value || "0";


    minutes =
        minutes.padStart(
            2,
            "0"
        );


    seconds =
        seconds.padStart(
            2,
            "0"
        );


    hundredths =
        hundredths.padStart(
            2,
            "0"
        );


    return (

        minutes

        +

        ":"

        +

        seconds

        +

        "."

        +

        hundredths

    );

}


function validateManualTime(){

    const seconds =
        Number(
            manualSeconds.value
        );


    const hundredths =
        Number(
            manualHundredths.value
        );


    return (

        seconds >= 0

        &&

        seconds < 60

        &&

        hundredths >= 0

        &&

        hundredths < 100

    );

}


/* =====================================================
   Save Manual Swim
===================================================== */

function saveManualSwim(){

    if(!validateManualTime()){

        alert(
            "Time must be entered as\n\n00:32.45"
        );

        manualSeconds.focus();

        return;

    }


    const dateObject =
        new Date(manualDate.value);

    const dateString =
        dateObject.toLocaleDateString();

    const timeString =
        "Manual Entry";


    const swim = {

        swimmer:
            manualSwimmer.value,

        stroke:
            manualStroke.value,

        distance:
            manualDistance.value,

        course:
            manualCourse.value,

finalTime:
    getManualTime(),

        splits:[],

        lengths:0,

        date:
            dateString,

        time:
            timeString,

        source:
            manualSource.value

    };


    saveSwim(swim);


    alert(
        "Manual result saved."
    );


    showSetupScreen();

}


/* =====================================================
   END OF FILE
===================================================== */

