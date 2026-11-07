const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function raceHarness(vibration){
    let clock=1000;
    const documentEvents={},windowEvents={};
    const nodes=new Map();
    const node=id=>{
        if(!nodes.has(id)){
            const classes=new Set();
            nodes.set(id,{textContent:'',innerHTML:'',value:'',checked:true,
                handlers:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:()=>{}},
                addEventListener(type,handler){this.handlers[type]=handler;},
                setAttribute(){},appendChild(){}});
        }
        return nodes.get(id);
    };
    const context={console,navigator:vibration,summaryCard:node('summaryCard'),Date:class extends Date {static now(){return clock;}},
        document:{visibilityState:'visible',getElementById:node,createElement:()=>({}),
            addEventListener:(type,handler)=>{documentEvents[type]=handler;}},
        window:{addEventListener:(type,handler)=>{windowEvents[type]=handler;}},
        setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},
        leaveResultScreen(){},getPersonalBest:()=>null,finishSwim(){},
        formatElapsedMilliseconds:ms=>(ms/1000).toFixed(2),elapsedSince:(start,now)=>now-start};
    vm.createContext(context);
    ['js/timer.js','js/app.js'].forEach(file=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context));
    return {context,node,documentEvents,windowEvents,setClock:value=>clock=value,
        contact:id=>node(id).handlers.pointerdown({isPrimary:true,button:0,preventDefault(){}})};
}

test('split and finish capture contact timestamps once with requested feedback',()=>{
    const buzzes=[];
    const h=raceHarness({vibrate:p=>buzzes.push(p)});
    h.node('startButton').handlers.click();
    h.setClock(2500);h.context.updateTimer();
    assert.equal(h.node('splitTimerDisplay').textContent,'1.50');
    assert.equal(h.node('timerDisplay').innerHTML,'1.50');
    h.setClock(3500);h.contact('splitButton');
    assert.equal(h.node('splitTimerDisplay').hidden,true);
    assert.equal(h.node('splitContainer').hidden,false);
    h.setClock(3700);h.context.updateTimer();
    assert.equal(h.node('timerDisplay').innerHTML,'2.70');
    h.setClock(4000);h.node('splitButton').handlers.click({detail:1});
    assert.equal(h.context.getSplitData().length,1);
    assert.equal(h.context.getSplitData()[0].lapTime,'2.50');
    assert.equal(h.node('latestSplit').textContent,'Split 1 · 2.50 · Total 2.50');
    h.setClock(6000);h.contact('stopButton');
    h.node('stopButton').handlers.click({detail:1});
    assert.equal(h.context.getPendingSwim().finalTime,'5.00');
    assert.equal(h.context.getPendingSwim().splits.length,2);
    assert.deepEqual(JSON.parse(JSON.stringify(buzzes)),[60,[220,120,220]]);
});

test('missing or failing vibration does not block keyboard split and stop',()=>{
    [{},{vibrate(){throw Error('Unavailable');}}].forEach(navigator=>{
        const h=raceHarness(navigator);
        h.node('startButton').handlers.click();
        h.setClock(2000);h.node('splitButton').handlers.click({detail:0});
        h.setClock(3000);h.node('stopButton').handlers.click({detail:0});
        assert.equal(h.context.getPendingSwim().finalTime,'2.00');
        assert.equal(h.context.getPendingSwim().splits.length,2);
        h.node('startButton').handlers.click();
        assert.equal(h.context.getSplitData().length,0);
        assert.equal(h.node('latestSplit').textContent,'Ready for first split');
        assert.equal(h.node('splitTimerDisplay').hidden,false);
        assert.equal(h.node('splitContainer').hidden,true);
    });
});

test('secondary touches and right clicks do not record a split',()=>{
    const h=raceHarness({});
    h.node('startButton').handlers.click();
    h.node('splitButton').handlers.pointerdown({isPrimary:false,button:0});
    h.node('splitButton').handlers.pointerdown({isPrimary:true,button:2});
    assert.equal(h.context.getSplitData().length,0);
});

test('screen stays awake during timing, reacquires on return and releases on stop',async()=>{
    const locks=[];
    const h=raceHarness({wakeLock:{async request(type){
        assert.equal(type,'screen');
        const lock={released:false,addEventListener(){},async release(){this.released=true;}};
        locks.push(lock);return lock;
    }}});
    const flush=()=>new Promise(setImmediate);
    h.node('startButton').handlers.click();await flush();
    assert.equal(locks.length,1);
    h.contact('splitButton');assert.equal(locks[0].released,false);
    h.context.document.visibilityState='hidden';h.documentEvents.visibilitychange();await flush();
    assert.equal(locks[0].released,true);
    h.context.document.visibilityState='visible';h.documentEvents.visibilitychange();await flush();
    assert.equal(locks.length,2);
    h.contact('stopButton');await flush();assert.equal(locks[1].released,true);
    h.documentEvents.visibilitychange();await flush();assert.equal(locks.length,2);
});
