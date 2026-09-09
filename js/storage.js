/* =====================================================
   Poolside Parent - storage.js
   Versioned local storage with safe automatic migration
===================================================== */

const STORAGE_KEY = "poolsideParentSwims";
const PRE_MIGRATION_BACKUP_KEY = "poolsideParentPreMigrationBackup";
const CURRENT_STORAGE_VERSION = 3;

function createUniqueId(){
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function createEmptyDatabase(){
    return { version: CURRENT_STORAGE_VERSION, swims: [] };
}

function prepareSwim(swim){
    return {
        ...swim,
        id: swim.id || createUniqueId(),
        source: swim.source || "poolside",
        createdAt: swim.createdAt || new Date().toISOString()
    };
}

function needsMigration(storedData){
    if(Array.isArray(storedData)){ return true; }
    return !!storedData && storedData.version !== CURRENT_STORAGE_VERSION;
}

function createPreMigrationBackup(storedData){
    try{
        localStorage.setItem(PRE_MIGRATION_BACKUP_KEY, JSON.stringify({
            backedUpAt: new Date().toISOString(),
            originalData: storedData
        }));
    } catch(error){
        console.warn("Could not create pre-migration backup:", error);
    }
}

function migrateStorageData(storedData){
    if(!storedData){ return createEmptyDatabase(); }

    if(Array.isArray(storedData)){
        return { version: CURRENT_STORAGE_VERSION, swims: storedData.map(prepareSwim) };
    }

    if(storedData.version === 2 && Array.isArray(storedData.swims)){
        return { ...storedData, version: CURRENT_STORAGE_VERSION, swims: storedData.swims.map(prepareSwim) };
    }

    if(storedData.version === CURRENT_STORAGE_VERSION && Array.isArray(storedData.swims)){
        return storedData;
    }

    throw new Error("Unsupported Poolside Parent storage format");
}

function getDatabase(){
    try{
        const storedText = localStorage.getItem(STORAGE_KEY);
        if(!storedText){ return createEmptyDatabase(); }

        const parsedData = JSON.parse(storedText);
        if(needsMigration(parsedData)){ createPreMigrationBackup(parsedData); }

        const migratedData = migrateStorageData(parsedData);

        if(needsMigration(parsedData)){
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
            localStorage.setItem("poolsideParentLastMigration", JSON.stringify({
                migratedAt: new Date().toISOString(),
                toVersion: CURRENT_STORAGE_VERSION
            }));
        }

        return migratedData;
    } catch(error){
        console.error("Could not read swim history:", error);
        return createEmptyDatabase();
    }
}

function saveDatabase(database){
    database.version = CURRENT_STORAGE_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function getSwims(){ return getDatabase().swims; }

function saveSwim(swim){
    const database = getDatabase();
    database.swims.push(prepareSwim(swim));
    saveDatabase(database);
}

function clearDatabase(){ localStorage.removeItem(STORAGE_KEY); }

function getSwimmerHistory(swimmer){
    return getSwims().filter(function(swim){ return swim.swimmer === swimmer; });
}

function getEventHistory(swimmer, stroke, distance, course){
    return getSwims().filter(function(swim){
        return swim.swimmer === swimmer && swim.stroke === stroke && swim.distance === distance && swim.course === course;
    });
}

function timeToMilliseconds(time){
    if(!time){ return Number.MAX_SAFE_INTEGER; }
    const parts = time.split(":");
    const minutes = parseInt(parts[0], 10);
    const secondsParts = parts[1].split(".");
    const seconds = parseInt(secondsParts[0], 10);
    const hundredths = parseInt(secondsParts[1], 10);
    return minutes * 60000 + seconds * 1000 + hundredths * 10;
}

function getPersonalBest(swimmer, stroke, distance, course){
    const history = getEventHistory(swimmer, stroke, distance, course);
    if(history.length === 0){ return null; }
    return history.reduce(function(best, current){
        return timeToMilliseconds(current.finalTime) < timeToMilliseconds(best.finalTime) ? current : best;
    });
}

function calculateDifference(current, pb){
    let difference = timeToMilliseconds(current) - timeToMilliseconds(pb);
    const sign = difference < 0 ? "-" : "+";
    difference = Math.abs(difference);
    return sign + (difference / 1000).toFixed(2) + " sec";
}

function createSwimSignature(swim){
    return [swim.swimmer || "", swim.stroke || "", swim.distance || "", swim.course || "", swim.date || "", swim.time || "", swim.finalTime || ""].join("|");
}

function mergeSwimHistory(importedSwims){
    const database = getDatabase();
    const existingSwims = database.swims;
    const existingSignatures = new Set();
    existingSwims.forEach(function(swim){ existingSignatures.add(createSwimSignature(swim)); });

    const newSwims = [];
    let duplicatesSkipped = 0;

    importedSwims.forEach(function(swim){
        const signature = createSwimSignature(swim);
        if(existingSignatures.has(signature)){
            duplicatesSkipped++;
            return;
        }
        existingSignatures.add(signature);
        newSwims.push(prepareSwim(swim));
    });

    database.swims = existingSwims.concat(newSwims);
    saveDatabase(database);

    return { added: newSwims.length, duplicates: duplicatesSkipped, total: database.swims.length };
}
