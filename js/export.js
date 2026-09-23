/* Export the complete local history in the merge-compatible JSON format. */

function exportHistory(){
    const exportPackage={
        app:"Poolside Parent",
        version:"Alpha 2.3.0",
        storageVersion:CURRENT_STORAGE_VERSION,
        exportedAt:new Date().toISOString(),
        swims:getSwims()
    };

    const blob=new Blob([JSON.stringify(exportPackage,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const date=new Date().toISOString().slice(0,10);
    const link=document.createElement("a");

    link.href=url;
    link.download="PoolsideParent_History_"+date+".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
