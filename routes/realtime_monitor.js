const router = require("express").Router();
//const authorize = require("../middleware/authorization");
const pool = require("../db");

//read data from server -- edited
router.post("/get-data/infor", async (req, res) =>{
    try {
        //1. get data in req
        const {aircaft_id} = req.body;
        //2.create realtime name table
        const realtime_name = "rt_" + aircaft_id.replaceAll("-", "_");
       try 
       {
            //3. check landing time 
            // landing time edit test : 2022-08-22 10:05:23

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
            });
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

router.post("/get-data/loc", async (req, res)=>{
    try {
        // const {string_id} = req.body;
        // const _string_id = JSON.parse(string_id);

        // let data_loc_send = "[";

        // for(let value in _string_id){
        //     var realtime_name = "rt_" + _string_id[value].aiid.replaceAll("-", "_");

        //     let _realtimeID = await pool.query(`SELECT aircaft.aircaft_id as aiid,
        //                                             data
        //                                             FROM ${realtime_name}
        //                                             natural join aircaft
        //                                             ORDER BY take_of_time DESC LIMIT 1
        //                                             `);
        //     let dataValue = _realtimeID.rows[0].data[_realtimeID.rows[0].data.length - 1];

        //     data_loc_send += `{"aiid" : "${_realtimeID.rows[0].aiid.toString()}"`;
        //     data_loc_send += `,"data" : "${dataValue}"}`;
        //     if(value != (_string_id.length - 1) )
        //     {
        //         data_loc_send += ','
        //     }
        // }   
        // data_loc_send += ']';
        // //console.log(data_loc_send);
        // return res.send(data_loc_send);
        const {aircaft_id} = req.body;
        var realtime_name = "rt_" + aircaft_id.replaceAll("-", "_");
        /*let _realtimeID = await pool.query(`SELECT aircaft.aircaft_id as aiid,
                                            data
                                            FROM ${realtime_name}
                                            natural join aircaft
                                            ORDER BY take_of_time DESC LIMIT 1
                                            `);*/
        let _realtimeID = await pool.query(`SELECT aircaft.aircaft_id as aiid,
                                            data
                                            FROM ${realtime_name}
                                            natural join aircaft
                                            WHERE landing_time is null;
                                            `);
       
        if(_realtimeID.rows.length == 0)
        {
            return res.send(`no data with ${aircaft_id}`);
        }
        let dataValue = _realtimeID.rows[0].data[_realtimeID.rows[0].data.length - 1];
        return res.json({"aiid" : `${_realtimeID.rows[0].aiid.toString()}`, "data" : `${dataValue}` });
        
    } catch (error) {
        console.log(error.message);
        return res.status(401).send("Server error");
    }
});

module.exports = router;