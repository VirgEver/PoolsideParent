const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

function createLocalStorage(){
    const values=new Map();
    return {
        getItem:key => values.has(key) ? values.get(key) : null,
        setItem:(key,value) => values.set(key,String(value)),
        removeItem:key => values.delete(key)
    };
}

function loadCore(includeUI=false){
    const context={
        console,
        Date,
        Math,
        Number,
        Set,
        String,
        localStorage:createLocalStorage(),
        document:{getElementById:() => null}
    };
    vm.createContext(context);
    const root=path.resolve(__dirname,"..");
    ["js/config.js","js/utils.js","js/storage.js","js/performance.js"].concat(includeUI ? ["js/ui.js"] : []).forEach(file => {
        vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file});
    });
    return context;
}

test("elapsed-time helpers preserve hundredths",() => {
    const core=loadCore();
    assert.equal(core.parseElapsedMilliseconds("01:23.45"),83450);
    assert.equal(core.formatElapsedMilliseconds(83459),"01:23.45");
    assert.ok(Number.isNaN(core.parseElapsedMilliseconds("1:72.00")));
});

test("swimming event choices have one configuration source",() => {
    const core=loadCore();
    assert.deepEqual(Array.from(core.POOLSIDE_CONFIG.strokes),["Freestyle","Backstroke","Breaststroke","Butterfly","IM"]);
    assert.deepEqual(Array.from(core.POOLSIDE_CONFIG.courses),["25m","50m"]);
    assert.equal(core.getResultSourceLabel("official"),"Official Gala");
    assert.deepEqual({...core.POOLSIDE_CONFIG.season},{type:"calendar-year",startMonth:1,startDay:1});
});

test("calendar-year seasons reset on 1 January",() => {
    const core=loadCore();
    assert.equal(core.getSeasonDescriptor(new Date(2025,11,31).getTime()).label,"2025");
    assert.equal(core.getSeasonDescriptor(new Date(2026,0,1).getTime()).label,"2026");
});

test("a later custom season profile can cross calendar years",() => {
    const core=loadCore();
    const rule={startMonth:9,startDay:1};
    assert.equal(core.getSeasonDescriptor(new Date(2026,7,31).getTime(),rule).label,"2025/26");
    assert.equal(core.getSeasonDescriptor(new Date(2026,8,1).getTime(),rule).label,"2026/27");
});

test("PB continues across years while SB resets for each calendar year",() => {
    const core=loadCore();
    const series=core.buildPerformanceSeries([
        {date:"10/12/2025",time:"10:00",finalTime:"01:10.00"},
        {date:"20/12/2025",time:"10:00",finalTime:"01:09.00"},
        {date:"05/01/2026",time:"10:00",finalTime:"01:11.00"},
        {date:"01/02/2026",time:"10:00",finalTime:"01:08.00"}
    ]);
    assert.deepEqual(series.map(point=>point.isPB),[true,true,false,true]);
    assert.deepEqual(series.map(point=>point.isSB),[true,true,true,true]);
    assert.deepEqual(series.map(point=>point.seasonLabel),["2025","2025","2026","2026"]);
    assert.equal(series[2].pbMilliseconds,69000);
    assert.equal(series[2].sbMilliseconds,71000);
});

test("index contains no embedded style or script patches",() => {
    const html=fs.readFileSync(path.resolve(__dirname,"../index.html"),"utf8");
    assert.equal(/<style(?:\s|>)/i.test(html),false);
    assert.equal(/<script(?![^>]*\bsrc=)/i.test(html),false);
});

test("every secondary screen heading contains the real app icon",() => {
    const html=fs.readFileSync(path.resolve(__dirname,"../index.html"),"utf8");
    const headings=Array.from(html.matchAll(/<h2[^>]*class="[^"]*screenTitle[^"]*"[^>]*>(.*?)<\/h2>/g),match => match[1]);
    assert.equal(headings.length,5);
    headings.forEach(heading => assert.match(heading,/<img class="screenTitleLogo"[^>]*width="58"[^>]*height="58"/));
});

test("chart overlay controls sit below the chart for one-handed use",() => {
    const html=fs.readFileSync(path.resolve(__dirname,"../index.html"),"utf8");
    assert.ok(html.indexOf('id="progressChart"')<html.indexOf('class="progressOverlayControls"'));
});

test("timestamp timing remains accurate after a long browser pause",() => {
    const core=loadCore();
    assert.equal(core.elapsedSince(1000,126000),125000);
});

test("version 3 history migrates without losing readable fields",() => {
    const core=loadCore();
    const migrated=core.migrateStorageData({version:3,swims:[{
        swimmer:"Alfie",stroke:"Freestyle",distance:"100m",course:"25m",
        date:"19/09/2026",time:"09:15",finalTime:"01:08.34"
    }]});
    assert.equal(migrated.version,4);
    assert.equal(migrated.swims[0].finalTime,"01:08.34");
    assert.equal(migrated.swims[0].elapsedMilliseconds,68340);
    assert.equal(migrated.swims[0].distanceMetres,100);
    assert.equal(migrated.swims[0].courseMetres,25);
    assert.ok(migrated.swims[0].occurredAt);
});

test("personal best selects the lowest valid event time",() => {
    const core=loadCore();
    ["01:10.20","01:08.90","01:09.10"].forEach(finalTime => core.saveSwim({
        swimmer:"Alfie",stroke:"Freestyle",distance:"100m",course:"25m",finalTime
    }));
    assert.equal(core.getPersonalBest("Alfie","Freestyle","100m","25m").finalTime,"01:08.90");
});

test("history merge skips duplicates and accepts new swims",() => {
    const core=loadCore();
    const base={swimmer:"Alfie",stroke:"Backstroke",distance:"50m",course:"25m",date:"19/09/2026",time:"09:30",finalTime:"00:35.00"};
    core.saveSwim(base);
    const result=core.mergeSwimHistory([base,{...base,finalTime:"00:34.50"}]);
    assert.deepEqual({...result},{added:1,duplicates:1,total:2});
});

test("both history exports and full reliability backups can be restored",() => {
    const core=loadCore();
    const swims=[{swimmer:"Alfie",finalTime:"00:30.00"}];
    assert.equal(core.extractImportedSwims({swims}).length,1);
    assert.equal(core.extractImportedSwims({database:{version:4,swims}}).length,1);
});

test("history filters combine categories with AND logic",() => {
    const core=loadCore(true);
    const filters={swimmers:["Alfie"],strokes:["Freestyle"],distances:[],courses:["25m"],pbOnly:false};
    assert.equal(core.swimMatchesFilters({swimmer:"Alfie",stroke:"Freestyle",distance:"100m",course:"25m"},filters,null,0),true);
    assert.equal(core.swimMatchesFilters({swimmer:"Alfie",stroke:"Freestyle",distance:"100m",course:"50m"},filters,null,0),false);
});
