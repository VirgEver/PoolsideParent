/* Shared, side-effect-free helpers used across PoolsideParent. */

function parseElapsedMilliseconds(value){
    const match=String(value || "").trim().match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/);
    if(!match){ return NaN; }
    const minutes=Number(match[1]);
    const seconds=Number(match[2]);
    if(!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds>=60){ return NaN; }
    const fraction=(match[3] || "0").padEnd(3,"0").slice(0,3);
    return (minutes*60000)+(seconds*1000)+Number(fraction);
}

function formatElapsedMilliseconds(milliseconds){
    const safe=Math.max(0,Math.floor(Number(milliseconds) || 0));
    const minutes=Math.floor(safe/60000);
    const seconds=Math.floor((safe%60000)/1000);
    const hundredths=Math.floor((safe%1000)/10);
    return String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0")+"."+String(hundredths).padStart(2,"0");
}

function elapsedSince(startTimestamp,nowTimestamp){
    return Math.max(0,Number(nowTimestamp)-Number(startTimestamp));
}

function parseSwimDateTime(swim){
    const direct=swim.occurredAt || swim.dateTime || swim.datetime || swim.timestamp;
    if(direct){
        const directTime=Date.parse(direct);
        if(!Number.isNaN(directTime)){ return directTime; }
    }
    const dateText=String(swim.date || "").trim();
    const timeText=String(swim.time || "00:00:00").trim();
    if(!dateText){
        const created=Date.parse(swim.createdAt || "");
        return Number.isNaN(created) ? 0 : created;
    }
    let year,month,day;
    let match=dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(match){
        day=Number(match[1]); month=Number(match[2])-1; year=Number(match[3]);
    }else{
        match=dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if(!match){
            const fallback=Date.parse(dateText);
            return Number.isNaN(fallback) ? 0 : fallback;
        }
        year=Number(match[1]); month=Number(match[2])-1; day=Number(match[3]);
    }
    let hours=0,minutes=0,seconds=0;
    const timeMatch=timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if(timeMatch){
        hours=Number(timeMatch[1]); minutes=Number(timeMatch[2]); seconds=Number(timeMatch[3] || 0);
    }
    return new Date(year,month,day,hours,minutes,seconds).getTime();
}

function parseMetres(value){
    const match=String(value || "").match(/\d+/);
    return match ? Number(match[0]) : null;
}

function escapeHTML(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(character){
        return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];
    });
}
