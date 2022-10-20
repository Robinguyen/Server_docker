const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");
const { portalSuspended } = require("pg-protocol/dist/messages");


// real-time
router.post("/upload-data",async (req, res) => {
    //1.get value form body
    const { aircaft_id,
        realtime_id,
        method_id,
        flightmode_id, 
        pilot_id,
        spraying_rate,
        route_spacing, 
        flight_speed, 
        height, 
        hopper_outletsize,
        spinner_diskspeed, 
        location, 
        data, 
        area,
        take_of_time, 
        landing_time, 
        }  = req.body;
    //console.log(req.body);
    //return res.send(req.body);
    //2.convert id to rt_id table
    const realtime_aircaftName = "rt_" + aircaft_id.replaceAll("-", "_");
    
    try{
        // upload first time 
        if(realtime_id == 'null'){
            //3. check name table exists?
            try {

                const check_exist_rt_table = await pool.query(`select exists(select from pg_tables 
                                                                where schemaname = 'public' 
                                                                AND tablename = '${realtime_aircaftName}');`);
                if(check_exist_rt_table.rows[0].exists === false)
                {
                    console.log("error rt_aircaft table : aircaft_id");
                    return res.send("Server error 1");
                }
            } 
            catch (error) 
            {
                console.log(error.message);
                return res.status(401).send("Server error");
            }

            // 4. check landing_time exists data fail
            try 
            {
                const check_landing_time = await pool.query(`select realtime_id
                                                            from ${realtime_aircaftName}
                                                            where landing_time is null`);
                // delete data fail if length > 0
                if(check_landing_time.rows.length > 0)
                {
                    console.log(`server has data fail at table ${realtime_aircaftName}`);
                    const delete_landing_time_null = await pool.query(`delete from ${realtime_aircaftName}
                                                                       where landing_time is null`);
                }
                //console.log(check_landing_time.rows.length)
                //return res.send(check_landing_time.rows.length);
            } 
            catch (error) 
            {
                console.log(error.message);
                return res.status(401).send("Server error");   
            }

            //4. insert Data
            try {
                // insert data to rt_id table 
                //console.log(req.body);
                //return res.send(req.body);
                
                const insert_data = await pool.query(`INSERT INTO ${realtime_aircaftName}(
                                                    aircaft_id,
                                                    flightmode_id, 
                                                    pilot_id, 
                                                    method_id,
                                                    spraying_rate, 
                                                    route_spacing, 
                                                    flight_speed, 
                                                    height, 
                                                    hopper_outletsize, 
                                                    spinner_diskspeed, 
                                                    location, 
                                                    data, 
                                                    area, 
                                                    take_of_time, 
                                                    landing_time, 
                                                    flight_duaration) VALUES 
                                                    ('${aircaft_id}',
                                                    '${flightmode_id}',
                                                    '${pilot_id}',
                                                    '${method_id}',
                                                    '{${spraying_rate}}',
                                                    '${route_spacing}',
                                                    '{${flight_speed}}',
                                                    '{${height}}',
                                                    '{${hopper_outletsize}}',
                                                    '{${spinner_diskspeed}}',
                                                    '${location}',
                                                    '{${data}}',
                                                    null,
                                                    ${take_of_time},
                                                    null,null) RETURNING realtime_id;`); 
                                   
                // update status aircaft online
                const update_status_aircaft = await pool.query(`UPDATE aircaft SET status = 't'
                                                                WHERE aircaft_id = '${aircaft_id}';`);

                console.log(insert_data.rows);
                return res.json({"rtid" : insert_data.rows[0].realtime_id});
            }
            catch(error)
            {
                console.log(error);
                return res.status(401).send("Error insert");
            }
        }
        //realtime id !=null
        else
        {   
            // 2. check rtid 
            const get_rtid = await pool.query(`select realtime_id
                                                from ${realtime_aircaftName}
                                                where landing_time is null order by take_of_time 
                                                desc limit 1 `);
            if(get_rtid.rows.length > 0)
            {
                if(realtime_id == get_rtid.rows[0].realtime_id)
                {
                    // 3. update data
                    await pool.query(`UPDATE ${realtime_aircaftName} 
                                        SET spraying_rate   = spraying_rate     || '{${spraying_rate}}', 
                                        flight_speed        = flight_speed      || '{${flight_speed}}', 
                                        height              = height            || '{${height}}', 
                                        hopper_outletsize   = hopper_outletsize || '{${hopper_outletsize}}', 
                                        spinner_diskspeed   = spinner_diskspeed || '{${spinner_diskspeed}}', 
                                        data                = data              || '{${data}}' 
                                        WHERE realtime_id   = '${realtime_id}';`);  
                    
                    // 4. check end data
                    if(landing_time!='null' && area != 'null')
                    {
                        // update landing time - area
                        const get_takeTime = await pool.query(`SELECT to_char(take_of_time, 'yyyy-mm-dd HH24:MI:SS') as time 
                                                                FROM ${realtime_aircaftName} 
                                                                WHERE realtime_id = '${realtime_id}';`);
                        await pool.query(`UPDATE ${realtime_aircaftName} 
                                            SET landing_time    = ${landing_time},
                                                area            = '${area}',        
                                                flight_duaration = age(${landing_time}, '${get_takeTime.rows[0].time}') 
                                            WHERE realtime_id = '${realtime_id}';`);
                        
                        // update status = false
                        const update_status_aircaft = await pool.query(`UPDATE aircaft SET status = 'f'
                                                                    WHERE aircaft_id = '${aircaft_id}';`);
    
                        return res.send("end upload data");                                            
                    }
                    return res.send(realtime_id);
                }
                console.log("error rt_aircaft table : realtime_id add when landing_time have data");
                return res.send("Server error code 0xA0");
            }
            else
            {
                console.log("error rt_aircaft table : realtime_id add when landing_time have data");
                return res.send("Server error code 0xA1");
            }
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server error");
    }
});
//read data from server -- edited
router.post("/get-data", async (req, res) =>{
    try {
        //1. get data in req
        const {aircaft_id} = req.body;
        //2.create realtime name table
        const realtime_name = "rt_" + aircaft_id.replaceAll("-", "_");
       try 
       {
            //3. check landing time 
            // landing time edit test : 2022-08-22 10:05:23
        /*
            let _realtimeID = await pool.query(`SELECT realtime_id as rtID, 
                                                    flight_mode.flightmode_name as mode,
                                                    pilot.username as pilo ,
                                                    spraying_rate as spra,
                                                    route_spacing as spac,
                                                    flight_speed as spee,
                                                    height as heig,
                                                    hopper_outletsize as hopp,
                                                    spinner_diskspeed as spin,
                                                    location as loca,
                                                    data,
                                                    aircaft.aircaft_name as name,
                                                    aircaft_type.type_name as type,
                                                    team.name as team
                                                    FROM ${realtime_name} natural join flight_mode 
                                                    natural join pilot
                                                    natural join team
                                                    natural join aircaft
                                                    natural join aircaft_type
                                                    ORDER BY take_of_time DESC LIMIT 1
                                                    `); // where landing_time = null
            if(_realtimeID.rows.length === 0)
            {
                return res.status(200).json(null);
            }
            let spraying_rateValue = _realtimeID.rows[0].spra[_realtimeID.rows[0].spra.length - 1];
            let flight_speedValue  = _realtimeID.rows[0].spee[_realtimeID.rows[0].spee.length - 1];
            let heightValue        = _realtimeID.rows[0].heig[_realtimeID.rows[0].heig.length - 1];
            let hopperValue        = _realtimeID.rows[0].hopp[_realtimeID.rows[0].hopp.length - 1];
            let spinnerValue       = _realtimeID.rows[0].spin[_realtimeID.rows[0].spin.length - 1]; 
            //let dataValue          = _realtimeID.rows[0].data[_realtimeID.rows[0].data.length - 1];
            //return res.send(_realtimeID.rows[0].type);
            return res.status(200).json({
                "name": _realtimeID.rows[0].name,
                "type": _realtimeID.rows[0].type,
                "pilo": _realtimeID.rows[0].pilo,
                "team": _realtimeID.rows[0].team, 
                "spra": spraying_rateValue,
                "spac": _realtimeID.rows[0].spac,
                "spee": flight_speedValue,
                "heig": heightValue,
                "hopp": hopperValue,
                "spin": spinnerValue,
                //"lati": dataValue[0],
                //"long": dataValue[1]
            });*/
            
            const data =  await pool.query(`SELECT aircaft_name, aircaft_type.type_name as type, username as pilot_name, team.name as name, spraying_rate[array_length(spraying_rate, 1)],
            route_spacing, flight_speed[array_length(flight_speed, 1)], height[array_length(height, 1)], 
            hopper_outletsize[array_length(hopper_outletsize, 1)], spinner_diskspeed[array_length(spinner_diskspeed, 1)] 
            FROM (((aircaft NATURAL JOIN aircaft_type) NATURAL JOIN (pilot NATURAL JOIN team) NATURAL JOIN ${realtime_name})) WHERE landing_time is null;`);
            if(data.rows.length==0){
                return res.status(401).send("No data");
            }
            else{
                return res.status(200).json({
                    "name": data.rows[0].aircaft_name,
                    "type": data.rows[0].type,
                    "pilo": data.rows[0].pilot_name,
                    "team": data.rows[0].name, 
                    "spra": data.rows[0].spraying_rate,
                    "spac": data.rows[0].route_spacing,
                    "spee": data.rows[0].flight_speed,
                    "heig": data.rows[0].height,
                    "hopp": data.rows[0].hopper_outletsize,
                    "spin": data.rows[0].spinner_diskspeed
                    //"lati": dataValue[0],
                    //"long": dataValue[1]
                })
            }
       } 
       catch (error) {
        console.error(error.message);
        return res.status(400).send("Server Error");
       }
  
    } catch (error) {
        console.error(error.message);
       return res.status(401).send("Server fail");
    }
  
    
});

// get all aircaft online --edited
router.post("/get-actionaircaft", async (req, res)=>{
    try {
        const {status} = req.body;
        
        if(status==1){
            try {
                const numAircaft = await pool.query(`select count(status) from aircaft where status = 't'`);
                const numLock = await pool.query(`select count(aircaft_lock) from aircaft where aircaft_lock = 't'`);
                //get name action aircaft name
                const get_actionAircaft = await pool.query("SELECT aircaft_name as name, aircaft_id as aiid FROM aircaft WHERE status='true';");
                const json = JSON.stringify(get_actionAircaft.rows)

                //let aircaftID = String(Object.values(get_actionAircaft.length));
                // console.log(Object.keys(get_actionAircaft.rows).length)
                //console.log(`numb : ${Object.values(numAircaft.rows[0])}`, '\n',`aircaft : ${json} ` );
                return res.status(200).json({
                    "numb": `${Object.values(numAircaft.rows[0])}`,
                    "lock" : `${Object.values(numLock.rows[0])}`,
                    "name": `${json}`                    
                })
               
            } catch (error) {
                console.log(error);
                return res.status(401).send("Aircaft Error");
            }
        }
        
    } catch (error) {
        return res.status(401).send("Server Error");
    }
   
    
});

router.post("/get-alldata", async (req, res)=>{
    var data=[];
    try 
    {
        const {aircaft_id} = req.body;
        //1.check aircaft id
        const check_Aicaftid = await pool.query(`SELECT * FROM aircaft WHERE aircaft_id = '${aircaft_id}';`);
        if(check_Aicaftid.rows.length==0){
            return res.status(401).send("Aircaft ID does not exists");
        }

        //2.convert aircaft id -> realtime name;
        const realtime_Name = "rt_" + aircaft_id.replaceAll("-", "_");
        //3. get all realtime ID
        const get_realtimeID = await pool.query(`SELECT realtime_id FROM ${realtime_Name};`);
        //4. check landing time of realtime id
        for(const value of get_realtimeID.rows){
            try {
                const check_landingTime =  await pool.query(`SELECT landing_time FROM ${realtime_Name} WHERE realtime_id = '${value.realtime_id}';`);
                if(check_landingTime.rows[0].landing_time!=null){
                    const get_Alldata = await pool.query(`SELECT * FROM ${realtime_Name} WHERE realtime_id = '${value.realtime_id}';`);
                    data.push(get_Alldata.rows);   
                     
                }

            } catch (error) {
                return res.status(401).send("Error");
            }
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).send("Server Error");
    }
})

router.post("/delete-data", async (req, res)=>{
    try {
        const {aircaft_id, realtime_id} = req.body;
        const realtime_name = "rt_"  + aircaft_id.replaceAll("-", "_");
        //1. check realtime table name exists??
        const get_allTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        for(const i in get_allTable.rows){
            const name_table = get_allTable.rows[i].table_name;
            //check table name in database
            if(name_table == realtime_name){
                try {
                    await pool.query(`DELETE FROM ${realtime_name} WHERE realtime_id = '${realtime_id}';`);
                    return res.status(200).send("Delete success");
                    
                } catch (error) {
                    console.error(error);
                    return res.status(401).send("Delete Error");
                }
                break;
            }
        } 

        
    } catch (error) {
        console.error(error);
        return res.status(401).send("Server Error")
    }

});
// write : up data ( status : 1)
// read : software server doc ve ( ham quet ) 
// delete
// update

module.exports = router;