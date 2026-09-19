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
    ["js/config.js","js/utils.js","js/storage.js"].concat(includeUI ? ["js/ui.js"] : []).forEach(file => {
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
