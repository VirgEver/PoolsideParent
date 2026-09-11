/* =====================================================
   Poolside Parent - reliability.js
   PWA update handling + simple backup reminders
===================================================== */
(function(){
    const BACKUP_META_KEY = "poolsideParentBackupMeta";
    const BACKUP_AFTER_SWIMS = 10;
    const BACKUP_AFTER_DAYS = 7;
    const REMIND_AGAIN_AFTER_SWIMS = 3;
    const REMIND_AGAIN_AFTER_DAYS = 2;

    function nowIso(){ return new Date().toISOString(); }
    function daysBetween(a,b){ return Math.floor((b.getTime()-a.getTime())/86400000); }
    function getBackupMeta(){ try{return JSON.parse(localStorage.getItem(BACKUP_META_KEY))||null;}catch(error){return null;} }
    function saveBackupMeta(meta){ localStorage.setItem(BACKUP_META_KEY,JSON.stringify(meta)); }

    function initialiseBackupMeta(){
        const existing=getBackupMeta();
        if(existing){return existing;}
        const meta={lastBackupDate:nowIso(),swimsAtLastBackup:getSwims().length,lastReminderDate:null,swimsAtLastReminder:getSwims().length};
        saveBackupMeta(meta);return meta;
    }

    function installExactBrandLogo(){
        const oldLogo=document.querySelector(".brandHeader .brandLogo");
        if(!oldLogo||oldLogo.tagName.toLowerCase()==="img"){return;}
        const logo=document.createElement("img");
        logo.className="brandLogo";
        logo.src="./PoolsideParent-app-icon-final-512.png";
        logo.alt="PoolsideParent logo";
        logo.width=58;
        logo.height=58;
        oldLogo.replaceWith(logo);
    }

    function downloadBackup(){
        const packageData={app:"Poolside Parent",backupVersion:1,storageVersion:typeof CURRENT_STORAGE_VERSION!=="undefined"?CURRENT_STORAGE_VERSION:null,exportedAt:nowIso(),database:getDatabase(),swimmers:typeof getSwimmers==="function"?getSwimmers():[]};
        const blob=new Blob([JSON.stringify(packageData,null,2)],{type:"application/json"});
        const url=URL.createObjectURL(blob);const link=document.createElement("a");const date=new Date().toISOString().slice(0,10);
        link.href=url;link.download="PoolsideParent_Backup_"+date+".json";document.body.appendChild(link);link.click();document.body.removeChild(link);URL.revokeObjectURL(url);
        saveBackupMeta({lastBackupDate:nowIso(),swimsAtLastBackup:getSwims().length,lastReminderDate:null,swimsAtLastReminder:getSwims().length});
    }

    function shouldRemind(meta){
        const swimsNow=getSwims().length;const swimsSinceBackup=swimsNow-(meta.swimsAtLastBackup||0);const daysSinceBackup=daysBetween(new Date(meta.lastBackupDate),new Date());
        if(swimsSinceBackup<BACKUP_AFTER_SWIMS&&daysSinceBackup<BACKUP_AFTER_DAYS){return false;}
        if(!meta.lastReminderDate){return true;}
        const daysSinceReminder=daysBetween(new Date(meta.lastReminderDate),new Date());const swimsSinceReminder=swimsNow-(meta.swimsAtLastReminder||0);
        return swimsSinceReminder>=REMIND_AGAIN_AFTER_SWIMS||daysSinceReminder>=REMIND_AGAIN_AFTER_DAYS;
    }

    function showBackupReminder(){
        const meta=initialiseBackupMeta();if(!shouldRemind(meta)){return;}
        const swimsNow=getSwims().length;const swimsSinceBackup=swimsNow-(meta.swimsAtLastBackup||0);const daysSinceBackup=daysBetween(new Date(meta.lastBackupDate),new Date());
        const message="Backup recommended.\n\n"+swimsSinceBackup+" new swim"+(swimsSinceBackup===1?"":"s")+" since your last backup, "+daysSinceBackup+" day"+(daysSinceBackup===1?"":"s")+" ago.\n\nBack up now?";
        if(confirm(message)){downloadBackup();return;}
        meta.lastReminderDate=nowIso();meta.swimsAtLastReminder=swimsNow;saveBackupMeta(meta);
    }

    function timingIsActive(){const timingScreen=document.getElementById("timingScreen");return timingScreen&&!timingScreen.classList.contains("hidden");}
    function showUpdatePrompt(registration){
        if(!registration||!registration.waiting){return;}
        if(timingIsActive()){window.poolsidePendingUpdate=registration;return;}
        if(confirm("A Poolside Parent update is ready.\n\nUpdate now?")){registration.waiting.postMessage({type:"SKIP_WAITING"});}
    }
    function checkPendingUpdate(){if(window.poolsidePendingUpdate&&!timingIsActive()){const registration=window.poolsidePendingUpdate;window.poolsidePendingUpdate=null;showUpdatePrompt(registration);}}

    function registerServiceWorker(){
        if(!("serviceWorker" in navigator)){return;}
        navigator.serviceWorker.register("./service-worker.js").then(function(registration){
            registration.update();if(registration.waiting){showUpdatePrompt(registration);}
            registration.addEventListener("updatefound",function(){const installing=registration.installing;if(!installing){return;}installing.addEventListener("statechange",function(){if(installing.state==="installed"&&navigator.serviceWorker.controller){showUpdatePrompt(registration);}});});
        }).catch(function(error){console.warn("Service worker registration failed:",error);});
        let refreshing=false;navigator.serviceWorker.addEventListener("controllerchange",function(){if(refreshing){return;}refreshing=true;window.location.reload();});
    }

    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"){checkPendingUpdate();}});
    [document.getElementById("resultScreen"),document.getElementById("setupScreen")].forEach(function(screen){if(!screen){return;}new MutationObserver(checkPendingUpdate).observe(screen,{attributes:true,attributeFilter:["class"]});});
    window.poolsideBackupNow=downloadBackup;window.poolsideCheckBackupReminder=showBackupReminder;
    window.addEventListener("load",function(){installExactBrandLogo();initialiseBackupMeta();registerServiceWorker();setTimeout(showBackupReminder,500);});
})();
