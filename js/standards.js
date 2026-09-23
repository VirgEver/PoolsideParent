/* Qualifying standards are deliberately stored outside swim history. */
const STANDARDS_STORAGE_KEY="poolsideParentStandards";
const STANDARD_TURN_FACTORS=Object.freeze({
    "freestyle|50":42.245,"freestyle|100":42.245,"freestyle|200":43.786,"freestyle|400":44.233,"freestyle|800":45.525,"freestyle|1500":46.221,
    "breaststroke|50":63.616,"breaststroke|100":63.616,"breaststroke|200":66.598,
    "butterfly|50":38.269,"butterfly|100":38.269,"butterfly|200":39.76,
    "backstroke|50":40.5,"backstroke|100":40.5,"backstroke|200":41.98,
    "individual_medley|200":49.7,"individual_medley|400":55.366
});

function getImportedStandardsPacks(){
    try{
        const value=JSON.parse(localStorage.getItem(STANDARDS_STORAGE_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    }catch(error){
        console.error("Could not read standards:",error);
        return [];
    }
}

function getStandardsPacks(){
    const builtIns=typeof POOLSIDE_BUILT_IN_STANDARDS === "undefined" ? [] : POOLSIDE_BUILT_IN_STANDARDS.map(function(pack){
        return {...pack,builtIn:true};
    });
    const packsById=new Map(builtIns.map(function(pack){return [pack.id,pack];}));
    getImportedStandardsPacks().forEach(function(pack){
        const included=packsById.get(pack.id);
        const importedRevision=Number(pack.revision || 1);
        const includedRevision=Number(included && included.revision || 1);
        if(!included || importedRevision>includedRevision){packsById.set(pack.id,{...pack,builtIn:false});}
    });
    return Array.from(packsById.values()).sort(function(a,b){
        return (a.year-b.year) || String(a.standardType).localeCompare(String(b.standardType));
    });
}

function validateStandardsPack(pack){
    if(!pack || typeof pack !== "object" || Array.isArray(pack)){throw new Error("This is not a standards pack");}
    if(pack.schemaVersion !== 1){throw new Error("Unsupported standards file version");}
    if(!String(pack.id || "").trim()){throw new Error("Standards pack ID is missing");}
    const standardType=String(pack.standardType || "").trim().toUpperCase();
    if(!["RQT","RCT","NQT","NCT"].includes(standardType)){throw new Error("Standard type must be RQT, RCT, NQT or NCT");}
    if(!Number.isInteger(pack.year)){throw new Error("Competition year is invalid");}
    if(pack.poolLengthMetres !== 25 && pack.poolLengthMetres !== 50){throw new Error("Pool length must be 25m or 50m");}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(pack.ageAsOf || ""))){throw new Error("Age reference date is invalid");}
    if(!Array.isArray(pack.ageGroups) || !pack.ageGroups.length){throw new Error("Age groups are missing");}
    if(!Array.isArray(pack.events) || !pack.events.length){throw new Error("No qualifying events were found");}

    const eventKeys=new Set();
    pack.events.forEach(function(event){
        const key=String(event.stroke || "")+"|"+Number(event.distanceMetres);
        if(!event.stroke || !Number.isFinite(Number(event.distanceMetres))){throw new Error("An event is incomplete");}
        if(eventKeys.has(key)){throw new Error("A duplicate event was found: "+key);}
        eventKeys.add(key);
        ["male","female"].forEach(function(category){
            if(!Array.isArray(event[category]) || event[category].length!==pack.ageGroups.length){
                throw new Error("Incorrect "+category+" age values for "+key);
            }
            event[category].forEach(function(time){
                if(time===null || String(time).trim()===""){return;}
                if(!Number.isFinite(parseElapsedMilliseconds(time))){throw new Error("Invalid qualifying time: "+time);}
            });
        });
    });
    return pack;
}

function saveStandardsPack(rawPack,installationSource){
    const pack=validateStandardsPack(rawPack);
    const packs=getImportedStandardsPacks();
    const index=packs.findIndex(function(item){return item.id===pack.id;});
    const stored={...pack,builtIn:false,installationSource:installationSource || "manual",importedAt:new Date().toISOString()};
    if(index>=0){packs[index]=stored;}else{packs.push(stored);}
    packs.sort(function(a,b){return (a.year-b.year) || String(a.standardType).localeCompare(String(b.standardType));});
    localStorage.setItem(STANDARDS_STORAGE_KEY,JSON.stringify(packs));
    return {pack:stored,replaced:index>=0};
}

function removeStandardsPack(id){
    const packs=getImportedStandardsPacks().filter(function(pack){return pack.id!==id;});
    localStorage.setItem(STANDARDS_STORAGE_KEY,JSON.stringify(packs));
}

function standardStrokeKey(value){
    const key=String(value || "").trim().toLowerCase().replace(/[^a-z]+/g,"_").replace(/^_|_$/g,"");
    return key==="im" ? "individual_medley" : key;
}

/* Swim England / SPORTSYSTEMS equivalent-time algorithm, rounded to a tenth. */
function convertEquivalentCourseTime(milliseconds,stroke,distanceMetres,fromCourseMetres,toCourseMetres){
    const fromCourse=Number(fromCourseMetres),toCourse=Number(toCourseMetres),distance=Number(distanceMetres);
    const seconds=Number(milliseconds)/1000;
    if(!Number.isFinite(seconds) || seconds<=0){return null;}
    if(fromCourse===toCourse){return Math.round(seconds*1000);}
    if(!((fromCourse===25 && toCourse===50) || (fromCourse===50 && toCourse===25))){return null;}
    const turnFactor=STANDARD_TURN_FACTORS[standardStrokeKey(stroke)+"|"+distance];
    if(!Number.isFinite(turnFactor)){return null;}
    const distanceFactor=Math.pow(distance/100,2)*2;
    const convertedSeconds=fromCourse===25
        ? (seconds+Math.sqrt(Math.pow(seconds,2)+(4*turnFactor*distanceFactor)))/2
        : seconds-((turnFactor/seconds)*distanceFactor);
    return Math.round(convertedSeconds*10)*100;
}

function ageOnDate(dateOfBirth,referenceDate){
    const birthParts=String(dateOfBirth || "").split("-").map(Number);
    const referenceParts=String(referenceDate || "").split("-").map(Number);
    if(birthParts.length!==3 || referenceParts.length!==3 || birthParts.some(Number.isNaN) || referenceParts.some(Number.isNaN)){return null;}
    let age=referenceParts[0]-birthParts[0];
    if(referenceParts[1]<birthParts[1] || (referenceParts[1]===birthParts[1] && referenceParts[2]<birthParts[2])){age--;}
    return age;
}

function standardTimeForSelection(pack,profile,selected,ageReferenceDate){
    if(!pack || !profile || !selected){return null;}
    const selectedCourse=parseMetres(selected.course);
    const event=pack.events.find(function(item){
        return standardStrokeKey(item.stroke)===standardStrokeKey(selected.stroke) && Number(item.distanceMetres)===parseMetres(selected.distance);
    });
    if(!event){return null;}
    const age=ageOnDate(profile.dateOfBirth,ageReferenceDate || pack.ageAsOf);
    if(!Number.isFinite(age)){return null;}
    const ageIndex=pack.ageGroups.findIndex(function(group){
        if(String(group).endsWith("+")){return age>=Number(String(group).replace("+",""));}
        return age===Number(group);
    });
    if(ageIndex<0 || !Array.isArray(event[profile.category])){return null;}
    const time=event[profile.category][ageIndex];
    if(time===null || String(time).trim()===""){return null;}
    const publishedMilliseconds=parseElapsedMilliseconds(time);
    if(!Number.isFinite(publishedMilliseconds)){return null;}
    const converted=pack.poolLengthMetres!==selectedCourse;
    const milliseconds=converted
        ? convertEquivalentCourseTime(publishedMilliseconds,event.stroke,event.distanceMetres,pack.poolLengthMetres,selectedCourse)
        : publishedMilliseconds;
    return Number.isFinite(milliseconds) ? {
        milliseconds:milliseconds,
        time:converted ? formatElapsedMilliseconds(milliseconds) : time,
        ageGroup:pack.ageGroups[ageIndex],
        pack:pack,
        converted:converted,
        sourceCourseMetres:pack.poolLengthMetres,
        displayCourseMetres:selectedCourse,
        publishedMilliseconds:publishedMilliseconds,
        publishedTime:time
    } : null;
}

function buildStandardsOverlay(points,selected,standardType){
    const profile=typeof getSwimmerByName === "function" ? getSwimmerByName(selected.swimmer) : null;
    if(!profile || !profile.dateOfBirth || !profile.category){
        return {values:points.map(function(){return null;}),details:points.map(function(){return null;}),message:"Add this swimmer's date of birth and competition category in Settings."};
    }
    const packs=getStandardsPacks().filter(function(pack){
        return String(pack.standardType).toUpperCase()===String(standardType).toUpperCase();
    });
    if(!packs.length){return {values:points.map(function(){return null;}),details:points.map(function(){return null;}),message:"Import an "+standardType+" standards pack in Settings first."};}
    packs.sort(function(a,b){return a.year-b.year;});
    let usedLatestPack=false;
    let usedCurrentStandard=false;
    const latestYear=Math.max.apply(null,packs.map(function(pack){return pack.year;}));
    const latestPacks=packs.filter(function(item){return item.year===latestYear;});
    const details=points.map(function(point){
        const year=Number(point.seasonId);
        let candidatePacks=packs.filter(function(item){return item.year===year;});
        if(!candidatePacks.length && Number.isFinite(year)){
            candidatePacks=latestPacks;
            usedLatestPack=true;
        }
        const selectedCourse=parseMetres(selected.course);
        const pack=candidatePacks.find(function(item){return item.poolLengthMetres===selectedCourse;}) || candidatePacks[0];
        if(!pack){return null;}
        const ageReferenceDate=String(year)+String(pack.ageAsOf).slice(4);
        let standard=standardTimeForSelection(pack,profile,selected,ageReferenceDate);
        if(!standard && Number.isFinite(year) && year<latestYear){
            const currentPack=latestPacks.find(function(item){return item.poolLengthMetres===selectedCourse;}) || latestPacks[0];
            standard=currentPack ? standardTimeForSelection(currentPack,profile,selected,currentPack.ageAsOf) : null;
            if(standard){
                standard={...standard,currentStandardFallback:true};
                usedCurrentStandard=true;
            }
        }
        return standard;
    });
    const values=details.map(function(standard){return standard ? standard.milliseconds : null;});
    const hasValue=values.some(Number.isFinite);
    const usedConversion=details.some(function(standard){return standard && standard.converted;});
    const messages=[];
    if(usedLatestPack){messages.push("Seasons without their own "+standardType+" pack use the latest installed table adjusted for the swimmer's age.");}
    if(usedCurrentStandard){messages.push("Where an earlier age has no "+standardType+" value, the current standard is shown for context.");}
    if(usedConversion){
        const example=details.find(function(standard){return standard && standard.converted;});
        messages.push(standardType+" uses official "+example.sourceCourseMetres+"→"+example.displayCourseMetres+"m equivalent times on this chart.");
    }
    return {
        values:values,
        details:details,
        message:hasValue ? messages.join(" ") : "No matching "+standardType+" standard is installed for this event and season."
    };
}

(function initialiseStandardsSettings(){
    const swimmerSelect=document.getElementById("settingsSwimmer");
    const dobInput=document.getElementById("settingsDateOfBirth");
    const categorySelect=document.getElementById("settingsCategory");
    const saveProfileButton=document.getElementById("saveSwimmerSettingsButton");
    const swimmerMessage=document.getElementById("swimmerSettingsMessage");
    const importButton=document.getElementById("importStandardsButton");
    const fileInput=document.getElementById("standardsFileInput");
    const standardsMessage=document.getElementById("standardsMessage");
    const standardsList=document.getElementById("standardsList");
    const checkUpdatesButton=document.getElementById("checkStandardsUpdatesButton");
    const standardsUpdateList=document.getElementById("standardsUpdateList");
    let currentCatalogueIds=new Set();
    let pendingCatalogueEntries=[];

    function sourceURL(value){
        try{
            const parsed=new URL(String(value || ""));
            return parsed.protocol==="https:" ? parsed.href : "";
        }catch(error){return "";}
    }

    function displayDate(value){
        const parts=String(value || "").split("-");
        return parts.length===3 ? parts[2]+"/"+parts[1]+"/"+parts[0] : String(value || "Not supplied");
    }

    function showSelectedProfile(){
        const swimmer=getSwimmers().find(function(item){return item.id===swimmerSelect.value;});
        dobInput.value=swimmer ? swimmer.dateOfBirth || "" : "";
        categorySelect.value=swimmer ? swimmer.category || "" : "";
        swimmerMessage.textContent="";
    }

    function renderStandardsList(){
        const packs=getStandardsPacks();
        if(!packs.length){standardsList.innerHTML="<p class='settingsEmpty'>No standards imported yet.</p>";return;}
        standardsList.innerHTML=packs.map(function(pack){
            const badges=[];
            if(pack.builtIn){badges.push("<span class='standardsBadge standardsBadgeIncluded'>INCLUDED</span>");}
            else if(pack.installationSource==="catalogue"){badges.push("<span class='standardsBadge standardsBadgeAdded'>ADDED</span>");}
            else{badges.push("<span class='standardsBadge standardsBadgeImported'>IMPORTED</span>");}
            if(currentCatalogueIds.has(pack.id)){badges.push("<span class='standardsBadge standardsBadgeCurrent'>CURRENT</span>");}
            const safeURL=sourceURL(pack.sourceUrl);
            const sourceText="SOURCE · "+String(pack.sourceTitle || pack.sourceDocument || "Published document")+(pack.sourceReference ? " · "+pack.sourceReference : "");
            const source=safeURL
                ? "<a class='standardsSourceLink' href='"+escapeHTML(safeURL)+"' target='_blank' rel='noopener noreferrer'>"+escapeHTML(sourceText)+"</a>"
                : (pack.sourceTitle || pack.sourceDocument ? "<span class='standardsSourceReference'>"+escapeHTML(sourceText)+"</span>" : "<span class='standardsSourceMissing'>Source details not supplied</span>");
            const action=pack.builtIn ? "" : "<button type='button' class='removeStandardsButton' data-standard-id='"+escapeHTML(pack.id)+"' aria-label='Remove "+escapeHTML(pack.id)+"'>REMOVE</button>";
            return "<div class='standardsItem'>"
                +"<div class='standardsItemHeader'><strong>"+escapeHTML(String(pack.standardType).toUpperCase()+" · "+pack.year+" · "+pack.poolLengthMetres+"m")+"</strong><div class='standardsBadges'>"+badges.join("")+"</div></div>"
                +"<div class='standardsCompetition'>"+escapeHTML(pack.competition || pack.region || "Standards pack")+"</div>"
                +"<div class='standardsProvenance'><span><b>Publisher:</b> "+escapeHTML(pack.publisher || "Not supplied")+"</span><span><b>Published:</b> "+escapeHTML(displayDate(pack.publishedDate))+"</span><span><b>Age at:</b> "+escapeHTML(displayDate(pack.ageAsOf))+"</span><span><b>Revision:</b> "+escapeHTML(pack.revision || 1)+"</span></div>"
                +(pack.sourceNote ? "<div class='standardsSourceNote'>"+escapeHTML(pack.sourceNote)+"</div>" : "")
                +"<div class='standardsItemFooter'>"+source+action+"</div></div>";
        }).join("");
        standardsList.querySelectorAll(".removeStandardsButton").forEach(function(button){
            button.addEventListener("click",function(){
                removeStandardsPack(button.dataset.standardId);
                standardsMessage.textContent="Standards pack removed.";
                renderStandardsList();
            });
        });
    }

    function renderCatalogueUpdates(entries){
        pendingCatalogueEntries=entries;
        if(!standardsUpdateList){return;}
        if(!entries.length){standardsUpdateList.innerHTML="";return;}
        standardsUpdateList.innerHTML="<div class='standardsUpdatesHeading'>NEW STANDARDS AVAILABLE</div>"+entries.map(function(entry,index){
            const installed=getStandardsPacks().find(function(pack){return pack.id===entry.id;});
            const action=installed ? "UPDATE" : "ADD STANDARDS";
            return "<div class='standardsUpdateItem'><div><strong>"+escapeHTML(String(entry.standardType).toUpperCase()+" · "+entry.year+" · "+entry.poolLengthMetres+"m")+"</strong><span>"+escapeHTML(entry.competition || entry.publisher || "Standards pack")+"</span></div><button type='button' class='installStandardsButton' data-catalogue-index='"+index+"'>"+action+"</button></div>";
        }).join("");
        standardsUpdateList.querySelectorAll(".installStandardsButton").forEach(function(button){
            button.addEventListener("click",async function(){
                const entry=pendingCatalogueEntries[Number(button.dataset.catalogueIndex)];
                if(!entry || !entry.dataUrl){standardsMessage.textContent="This standards file is not available yet.";return;}
                button.disabled=true;
                try{
                    const catalogueURL=new URL("standards/catalog.json",document.baseURI);
                    const response=await fetch(new URL(entry.dataUrl,catalogueURL),{cache:"no-store"});
                    if(!response.ok){throw new Error("Download failed ("+response.status+")");}
                    const result=saveStandardsPack(await response.json(),"catalogue");
                    standardsMessage.textContent=(result.replaced ? "Updated " : "Added ")+String(result.pack.standardType).toUpperCase()+" standards for "+result.pack.year+".";
                    await checkCatalogue(false);
                }catch(error){
                    console.error("Standards update failed:",error);
                    standardsMessage.textContent="Unable to add standards: "+error.message;
                    button.disabled=false;
                }
            });
        });
    }

    async function checkCatalogue(showSuccess){
        if(checkUpdatesButton){checkUpdatesButton.disabled=true;checkUpdatesButton.textContent="CHECKING…";}
        try{
            const response=await fetch(new URL("standards/catalog.json",document.baseURI),{cache:"no-store"});
            if(!response.ok){throw new Error("Catalogue unavailable ("+response.status+")");}
            const catalogue=await response.json();
            if(catalogue.schemaVersion!==1 || !Array.isArray(catalogue.packs)){throw new Error("Catalogue format is not supported");}
            const installed=getStandardsPacks();
            const installedById=new Map(installed.map(function(pack){return [pack.id,pack];}));
            currentCatalogueIds=new Set(catalogue.packs.filter(function(entry){
                const pack=installedById.get(entry.id);
                return pack && Number(pack.revision || 1)>=Number(entry.revision || 1);
            }).map(function(entry){return entry.id;}));
            const available=catalogue.packs.filter(function(entry){
                const pack=installedById.get(entry.id);
                return !pack || Number(entry.revision || 1)>Number(pack.revision || 1);
            });
            renderStandardsList();
            renderCatalogueUpdates(available);
            if(showSuccess){standardsMessage.textContent=available.length ? available.length+" new standards pack"+(available.length===1 ? " is" : "s are")+" available." : "Included standards are up to date.";}
        }catch(error){
            console.error("Standards catalogue check failed:",error);
            standardsMessage.textContent="Unable to check right now. Your installed standards still work offline.";
        }finally{
            if(checkUpdatesButton){checkUpdatesButton.disabled=false;checkUpdatesButton.textContent="CHECK FOR NEW STANDARDS";}
        }
    }

    const prepareScreen=function(){
        renderSwimmerSelectors();
        if(!swimmerSelect.value && swimmerSelect.options.length>1){swimmerSelect.selectedIndex=1;}
        showSelectedProfile();
        renderStandardsList();
    };
    if(typeof window !== "undefined"){window.prepareSettingsScreen=prepareScreen;}

    if(swimmerSelect){swimmerSelect.addEventListener("change",showSelectedProfile);}
    if(saveProfileButton){
        saveProfileButton.addEventListener("click",function(){
            try{
                if(!swimmerSelect.value){throw new Error("Select a swimmer");}
                updateSwimmerProfile(swimmerSelect.value,dobInput.value,categorySelect.value);
                swimmerMessage.textContent="Swimmer details saved.";
            }catch(error){swimmerMessage.textContent=error.message;}
        });
    }
    if(importButton && fileInput){importButton.addEventListener("click",function(){fileInput.click();});}
    if(checkUpdatesButton){checkUpdatesButton.addEventListener("click",function(){checkCatalogue(true);});}
    if(fileInput){
        fileInput.addEventListener("change",function(event){
            const file=event.target.files[0];
            if(!file){return;}
            const reader=new FileReader();
            reader.onload=function(){
                try{
                    const result=saveStandardsPack(JSON.parse(reader.result),"manual");
                    standardsMessage.textContent=(result.replaced ? "Updated " : "Imported ")+String(result.pack.standardType).toUpperCase()+" standards for "+result.pack.year+".";
                    renderStandardsList();
                }catch(error){
                    console.error("Standards import failed:",error);
                    standardsMessage.textContent="Unable to import: "+error.message;
                }
            };
            reader.readAsText(file);
            event.target.value="";
        });
    }
})();
