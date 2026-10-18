export async function postRoutine(title_name) {
    const CreateRoutineResponse = await fetch("http://localhost:8000/createroutine",{
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({title_name})
    })

    const CreateRoutineData = await CreateRoutineResponse.json()

    if(!CreateRoutineResponse.ok){
        throw new Error(CreateRoutineData.detail ?? "Could not create routine");     
    }

    return{CreateRoutineData};
}



export async function getAllRoutines(id, name) {
    const RoutineFetchResponse = await fetch("http://localhost:8000/fetchallroutines");
    const RoutineFetchData = await RoutineFetchResponse.json()
    if (!RoutineFetchResponse.ok){
        throw new Error(RoutineFetchData.detail ?? "Could not fetch all the routines from api")
    }

    return{RoutineFetchData}
    
}