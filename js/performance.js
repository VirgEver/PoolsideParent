/* Pure performance calculations shared by charts and future result comparisons. */

function getSeasonDescriptor(timestamp,seasonRule){
    const date=new Date(timestamp);
    if(Number.isNaN(date.getTime())){ return null; }
    const rule=seasonRule || POOLSIDE_CONFIG.season;
    const month=date.getMonth()+1;
    const day=date.getDate();
    const startsThisYear=month>rule.startMonth || (month===rule.startMonth && day>=rule.startDay);
    const startYear=(rule.startMonth===1 && rule.startDay===1) ? date.getFullYear() : (startsThisYear ? date.getFullYear() : date.getFullYear()-1);
    const endYear=(rule.startMonth===1 && rule.startDay===1) ? startYear : startYear+1;
    return {
        id:String(startYear),
        label:startYear===endYear ? String(startYear) : startYear+"/"+String(endYear).slice(-2),
        startYear:startYear,
        endYear:endYear
    };
}

function buildPerformanceSeries(swims,seasonRule){
    const indexed=swims.map(function(swim,index){
        return {
            swim:swim,
            originalIndex:index,
            timestamp:parseSwimDateTime(swim),
            milliseconds:Number.isFinite(swim.elapsedMilliseconds) ? swim.elapsedMilliseconds : parseElapsedMilliseconds(swim.finalTime)
        };
    }).filter(function(point){ return Number.isFinite(point.milliseconds); });

    indexed.sort(function(a,b){ return (a.timestamp-b.timestamp) || (a.originalIndex-b.originalIndex); });

    let lifetimeBest=Infinity;
    const seasonBests={};
    return indexed.map(function(point){
        const season=getSeasonDescriptor(point.timestamp,seasonRule);
        const seasonId=season ? season.id : "unknown";
        const previousPB=lifetimeBest;
        const previousSB=seasonBests[seasonId] === undefined ? Infinity : seasonBests[seasonId];
        const isPB=point.milliseconds<previousPB;
        const isSB=point.milliseconds<previousSB;
        lifetimeBest=Math.min(lifetimeBest,point.milliseconds);
        seasonBests[seasonId]=Math.min(previousSB,point.milliseconds);
        return {
            swim:point.swim,
            timestamp:point.timestamp,
            milliseconds:point.milliseconds,
            seasonId:seasonId,
            seasonLabel:season ? season.label : "Unknown season",
            isPB:isPB,
            isSB:isSB,
            pbMilliseconds:lifetimeBest,
            sbMilliseconds:seasonBests[seasonId]
        };
    });
}

function buildStepPath(points,valueKey,x,y){
    if(!points.length){ return ""; }
    let path="M "+x(0)+" "+y(points[0][valueKey]);
    for(let index=1;index<points.length;index++){
        path+=" H "+x(index)+" V "+y(points[index][valueKey]);
    }
    return path;
}

function groupPerformanceBySeason(points){
    const groups=[];
    points.forEach(function(point,index){
        let group=groups[groups.length-1];
        if(!group || group.seasonId!==point.seasonId){
            group={seasonId:point.seasonId,seasonLabel:point.seasonLabel,startIndex:index,points:[]};
            groups.push(group);
        }
        group.points.push(point);
    });
    return groups;
}
