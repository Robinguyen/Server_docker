const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// load datata function 1 : view member in team
router.post("/function1/pilot", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { team_id } = req.body;
    try {
        // 2. load database
        if(team_id.length > 0)
        {
            // check team_id exist
            try {
                const check_id = await pool.query("SELECT team_id FROM team WHERE team_id = $1", [team_id]);
                if(check_id.rowCount == 0)
                {
                    return res.json("input team id error");
                }
            } catch (error) {
                return res.status(500).json("input team id error");
            }

            const table =  await pool.query
            ("SELECT pilot.pilot_id, pilot.username, pilot.email FROM team NATURAL JOIN pilot WHERE team_id = $1", [team_id]);
            return res.send(table.rows);
        }
        else
        {
            return res.json("Please insert full infor");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
    });

router.post("/function1/admin", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { team_id } = req.body;
    try {
        // 2. load database
        if(team_id.length > 0)
        {
            // check team_id exist
            try {

                const check_team_id = await pool.query("select relate_id from relate_admin_team where team_id = $1 ", [team_id]);
                if(check_team_id.rows.length === 0)
                {
                    return res.status(401).json("error f1_admin");
                }
                // 3. get data from database
                const admin = await pool.query
                ("select admin_account.acc_id, admin_account.username, admin_account.email, admin_account.role "+
                "from relate_admin_team natural join admin_account natural join team where team.team_id = $1",
                [team_id]);
                return res.json(admin.rows);
            } catch (error) {
                return res.status(401).json("error f1_admin");
            }
        }
        else
        {
            return res.json("Please insert full infor");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
    });    
/*
//function total realtime
router.post("/get-data", async (req, res) =>{
    try {
        const data  = ["team.name","aircaft.aircaft_name","flight_mode.flightmode_name","location","method_type.method_name", "pilot.username", "area"];
        var get_nameTable; //variable get all table name
        var val_query=""; // variable using select
        var val_object ="";       //variable using add field object
        var data_check = []; // variable push data from req.body
        var dataType = []; // variable using push all data !null 
        var check_date=""; // check query start date and end date
        var result_dateValue=[];
        var result_areaValue=[];
        var result_value=[];
        var union_area="SELECT SUM(area) FROM ("; 
        const {start_date, end_date, 
                team_name, aircaft_name, 
                mode, location, spraying,
                spreading, account, area}= req.body;
        //1. get all name table
        get_nameTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name like 'rt_%';");
        var method_name="null"; // variable check spraying and spreading
        //check value from request
        if(start_date=='null' && end_date=='null' && team_name=='null' && aircaft_name =='null' && mode =='null' && 
        location =='null' && spraying=='false' && spreading=='false' && account=='null' && area=='null'){
            var union_data="";// query string
            try{
                //24.1. get page number
                for(const value in get_nameTable.rows){
                    if(value == get_nameTable.rows.length-1){
                        union_data += `select DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from ${get_nameTable.rows[value].table_name} where landing_time is not null order by time DESC;`
                        break;
                    }
                    union_data  += `select DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from ${get_nameTable.rows[value].table_name} where landing_time is not null union `;
                } 
                const get_date =  await pool.query(`${union_data}`);
                //sum area 
                for(const values of get_date.rows){
                    result_dateValue.push(values.time);
                    for(const value in get_nameTable.rows){
                       
                        if(value == get_nameTable.rows.length-1){
                            union_area += `select area from ${get_nameTable.rows[value].table_name} where take_of_time::date = '${values.time}' AND landing_time is not null) as t;`
                            break;
                        }  
                           
                            union_area += `select area from ${get_nameTable.rows[value].table_name} where  take_of_time::date = '${values.time}' AND landing_time is not null union all `;
                    }
                    const get_area = await pool.query(`${union_area}`);
                    union_area="SELECT SUM(area) FROM (";
                    result_areaValue.push(get_area.rows[0].sum);
                }
                //object time-value area
                for(const value in get_date.rows){
                    var result = result_dateValue[value] +" : " + result_areaValue[value];
                    result_value.push(result);
                }
                return res.send(result_value); 
            } catch (error) {
                console.error(error);
                return res.status(401).send("Error Data")
            }


        }
        // value check request 
        else
        {
             //1.2. check sparing and spreading value;
             if(spreading=='true' && spraying=='true' || spreading=='false' && spraying=='false'){
                method_name="null";
            }
            else{
                switch (spraying) {
                    case 'true':
                        method_name="spraying"
                        break;
                    }
                
                   switch (spreading) {
                    case 'true':
                        method_name="spreading"
                        break;
                }
            }
            //1.3. check start date
            if(start_date!='null' && end_date!='null'){
                check_date= "take_of_time between " + `'${start_date}'` + " AND " + `'${end_date}'`;
                dataType.push(check_date);
            }
            else{
                check_date="";
            }
             //1.4.check data from request
            data_check.push(team_name, aircaft_name, mode, location, method_name, account, area);
            for(let value in data_check){
                if(data_check[value]!='null'){
                    val_object =  data[value] + "=" + `'${data_check[value]}'`;
                    dataType.push(val_object);
                }   
            }
            //1.5. check value select
            if(dataType.length==1){
                val_query += dataType[0];
            }
            else{
                for(let val in dataType){
                    if(val == dataType.length-1){
                        val_query += dataType[val] +" "
                        break;
                    }  
                    val_query += dataType[val] +" AND ";
                }
            }
            console.log(val_query)
            //1.6. get data search
            try {
                var union_value=""; // variable using select
                 //1.6.1. get date data search
                for(const value in get_nameTable.rows){
                    if(value == get_nameTable.rows.length-1){
                        union_value += `select DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from(((${get_nameTable.rows[value].table_name} natural join method_type) natural join  flight_mode) natural join aircaft) join 
                        (pilot natural join team) using (pilot_id) WHERE ${val_query} AND landing_time is not null ORDER BY time DESC;`
                        break;
                    }
                    union_value  += `select DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from(((${get_nameTable.rows[value].table_name} natural join method_type) natural join  flight_mode) natural join aircaft) join 
                    (pilot natural join team) using (pilot_id) WHERE ${val_query} AND landing_time is not null union `;
                } 
                const get_timeSearch  = await pool.query(`${union_value}`);
                for(const values of get_timeSearch.rows){
                    result_dateValue.push(values.time);
                    for(const value in get_nameTable.rows){
                        if(value == get_nameTable.rows.length-1){
                            union_area += `select area from(((${get_nameTable.rows[value].table_name} natural join method_type) natural join  flight_mode) natural join aircaft) join 
                            (pilot natural join team) using (pilot_id) WHERE ${val_query} AND take_of_time::date = '${values.time}' AND landing_time is not null) as t;`
                            break;
                        }
                        union_area  += `select area from(((${get_nameTable.rows[value].table_name} natural join method_type) natural join  flight_mode) natural join aircaft) join 
                        (pilot natural join team) using (pilot_id) WHERE ${val_query} AND take_of_time::date = '${values.time}' AND landing_time is not null union all `;
                    }
                
                    const get_area = await pool.query(`${union_area}`);
                    union_area="SELECT SUM(area) FROM (";
                    result_areaValue.push(get_area.rows[0].sum);
                    
                }
                 //object time-value area
                 for(const value in get_timeSearch.rows){
                    var result = result_dateValue[value] +" : " + result_areaValue[value];
                    result_value.push(result);
                }
                return res.send(result_value); 
                 
            } catch (error) {
                console.error(error);
                return res.status(401).send("Error search")
            }   
        }
    } catch (error) {
        console.error(error);
        return res.status(401).send("Server Error");
    }

})
*/
//total area pilot of team
router.post("/total-pilot", async(req, res)=>{
    try {
        var realtime_name=[];
        var rq_value=[{}];
        const {team_name} = req.body;
        //1. get aircaft id from team
        const get_aircaftID =await pool.query(`SELECT aircaft_id FROM (team natural join aircaft) WHERE team.name = '${team_name}';`)
        //2. get realtime table with aircaft ID
        for(const value of get_aircaftID.rows){
            const rt_name = "rt_" + (value.aircaft_id).replaceAll('-', '_');
            realtime_name.push(rt_name);
        }
        //get data
        for(const values of realtime_name){
            const check_realtime = await pool.query(`SELECT * FROM ${values}`);
            console.log(check_realtime.rows.length)
            if(check_realtime.rows.length!=0){
                const get_totalArea = await pool.query(`SELECT SUM(area), pilot.username FROM (${values} natural join pilot)   
                natural join team group by pilot.username, team.name;`);
                const total_area = Math.round((get_totalArea.rows[0].sum)*100)/100;
                rq_value.push({pilot: get_totalArea.rows[0].username , suma: total_area}); 
            }  
        }
        rq_value.shift();//remove first element
        return res.status(200).send(rq_value) 
    } catch (error) {
        console.error(error);
        return req.status(401).send("Server error");
    }
})

/*
//total area pilot of team
router.post("/member-rankings", async(req, res)=>{
    try {
        var realtime_name=[];
        var rq_value=[{}];
        const {team_name, start_date, end_date, date} = req.body;
        
        //1. get aircaft id from team
        const get_aircaftID =await pool.query(`SELECT aircaft_id FROM (team natural join aircaft) WHERE team.name = '${team_name}';`)
        //2. get realtime table with aircaft ID
        for(const value of get_aircaftID.rows){
            const rt_name = "rt_" + (value.aircaft_id).replaceAll('-', '_');
            realtime_name.push(rt_name);
        }
        //do not time select
        if(start_date=='null' && end_date =='null' && date=='null'){
            //get data
            for(const values of realtime_name){
                const check_realtime = await pool.query(`SELECT * FROM ${values}`);
                if(check_realtime.rows.length!=0){
                    const get_totalArea = await pool.query(`SELECT SUM(area), pilot.username FROM (${values} natural join pilot)   
                    natural join team group by pilot.username, team.name;`);
                    const total_area = Math.round((get_totalArea.rows[0].sum)*100)/100;
                    rq_value.push({pilo: get_totalArea.rows[0].username , suma: total_area}); 
                }
            }
            rq_value.shift();//remove first element
            return res.status(200).send(rq_value) 
        }
        else{
            if(date!='null' && start_date=='null'& end_date=='null'){
                
                for(const values of realtime_name){
                    const check_realtime = await pool.query(`SELECT * FROM ${values}`);
                    if(check_realtime.rows.length!=0){
                       const get_data = await pool.query(`SELECT SUM(t.total),t.username from (SELECT SUM(area) as total, pilot.username, 
                       take_of_time FROM (${values} natural join pilot) natural join team where take_of_time<= CURRENT_TIMESTAMP AND take_of_time >= NOW() - INTERVAL '${date} DAY'
                       GROUP BY area, pilot.username, team.name, take_of_time) as t GROUP BY t.username;`);
                       if(get_data.rows.length!=0){
                            const total_area = Math.round((get_data.rows[0].sum)*100)/100;
                            rq_value.push({pilo: get_data.rows[0].username , suma: total_area}); 
                       }
                       else{
                        rq_value.push({})
                       }
                        
                    }
                }
                rq_value.shift();//remove first element
                return res.status(200).send(rq_value) 
                
              
            }
            if(start_date!='null' && end_date!='null' && date=='null'){
                for(const values of realtime_name){
                    const check_realtime = await pool.query(`SELECT * FROM ${values}`);
                    if(check_realtime.rows.length!=0){
                        const get_data = await pool.query(`SELECT SUM(t.total),t.username from (SELECT SUM(area) as total, pilot.username, take_of_time FROM (${values} natural join pilot) 
                        natural join team where take_of_time<='${end_date}' AND take_of_time>='${start_date}' GROUP BY area, pilot.username, team.name, take_of_time 
                        ORDER BY take_of_time DESC) as t GROUP BY t.username;`);
                        if(get_data.rows.length!=0){
                            const total_area = Math.round((get_data.rows[0].sum)*100)/100;
                            rq_value.push({pilo: get_data.rows[0].username , suma: total_area}); 
                        }
                        else{
                            rq_value.push({})
                        }
                       
                    }
                }
                rq_value.shift();//remove first element
                return res.status(200).send(rq_value) 
                
            }
        }
    } catch (error) {
        console.error(error);
        return req.status(401).send("Server error");
    }
})
*/
// team task data report
router.post("/get-data-combobox", async(req, res) =>{
    // 1. destructure the req.body (name)
    const { team_id } = req.body;
    try {
        // 2. load database
        if(team_id.length > 0)
        {
            // check team_id exist
            try 
            {
                const check_team_id = await pool.query("select relate_id from relate_admin_team where team_id = $1 ", [team_id]);
                if(check_team_id.rows.length === 0)
                {
                    return res.status(401).json("Server error 0x20-1");
                }
                const pilot = await pool.query(`SELECT pilot.username as p_pi
                                                          FROM team
                                                          natural join pilot
                                                          where team_id = '${team_id}' 
                                                          ORDER BY pilot.username ASC`);
                const aircaft = await pool.query(`SELECT aircaft.aircaft_name as a_nm
                                                          FROM team
                                                          natural join aircaft
                                                          where team_id = '${team_id}' 
                                                          ORDER BY aircaft.aircaft_name ASC`);
                const mode = await pool.query(`SELECT flightmode_name as m_mo 
                                                          FROM flight_mode 
                                                          ORDER BY flightmode_name ASC`);                                          
                return res.status(200).json({pilo : pilot.rows,
                                             name : aircaft.rows,
                                             mode : mode.rows});
            } catch (error) 
            {
                console.log(error.message);
                return res.status(401).json("Server error 0x20");
            }
        }
        else
        {
            return res.json("Server error 0x21");
        }
    } catch (error) {
        console.log(error.message);
        return res.status(401).send("Server error 0x23");
    }
})

//member ranking
//function total realtime
router.post("/get-data", async (req, res) =>{
    try {
       
        const data  = ["team.name","aircaft.aircaft_name","flight_mode.flightmode_name","location","method_type.method_name", "pilot.username", "area"];
        var get_nameTable=[]; //variable get all table name
        var val_query=""; // variable using select
        var data_check = []; // variable push data from req.body
        var dataType = []; // variable using push all data !null 
        var method_name="null"; // variable check spraying and spreading
        var union_sumArea="SELECT SUM(area)::float as area, TO_CHAR(t.take_of_time :: DATE, 'yyyy/mm/dd') as time FROM ( "; 
        var union_area="";
        var union_data="";// query string
        var union_search = `SELECT SUM(area) as area, TO_CHAR(t.time :: DATE, 'yyyy/mm/dd') as time FROM ( `
        const {start_date, end_date, 
                team_name, aircaft_name, 
                mode, location, spraying,
                spreading, account, area}= req.body;
        
        //1. get all name table
        if(team_name!='null'){
           
            const get_aircaft = await pool.query(`SELECT aircaft_id FROM (aircaft NATURAL JOIN team) WHERE team.name = '${team_name}';`)
            console.log(get_aircaft.rows)
            for(const value of get_aircaft.rows){
                get_nameTable.push("rt_" + (value.aircaft_id).replaceAll('-', '_'));
            }
            
            // value check request 
            if(start_date=='null' && end_date=='null' && aircaft_name =='null' && mode =='null' && 
            location =='null' && spraying=='false' && spreading=='false' && account=='null' && area=='null'){
                try {
                    for(const value in get_nameTable){
                        if(value == get_nameTable.length-1){
                            union_data += `SELECT DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from ${get_nameTable[value]} WHERE ((SELECT to_char(CURRENT_TIMESTAMP, 'YYYY-MM'))  = (SELECT to_char(take_of_time, 'YYYY-MM'))) AND landing_time is not null ORDER BY time DESC;`
                            break;
                        }
                        union_data  += `SELECT DISTINCT TO_CHAR(take_of_time :: DATE, 'yyyy/mm/dd') as time from ${get_nameTable[value]} WHERE ((SELECT to_char(CURRENT_TIMESTAMP, 'YYYY-MM'))  = (SELECT to_char(take_of_time, 'YYYY-MM'))) AND landing_time is not null UNION `;
                    } 
                    const get_timeSearch  = await pool.query(union_data);
                    for(const values in get_timeSearch.rows){
                        for(const value in get_nameTable){
                            if(value == get_nameTable.length-1 && values == get_timeSearch.rows.length-1){
                                union_area += `SELECT take_of_time::date, coalesce((area::numeric)) as area FROM ((${get_nameTable[value]} NATURAL JOIN aircaft) JOIN team USING (team_id)) WHERE team.name = '${team_name}' AND take_of_time::date = '${get_timeSearch.rows[values].time}' AND landing_time is not null) as t GROUP BY t.take_of_time;`
                                break;
                            }
                            union_area  += `SELECT take_of_time::date, coalesce((area::numeric)) as area  FROM((${get_nameTable[value]} NATURAL JOIN aircaft) JOIN team USING (team_id)) WHERE team.name = '${team_name}' AND take_of_time::date = '${get_timeSearch.rows[values].time}' AND landing_time is not null UNION ALL `; 
                        }
                    }
                    const get_data = await pool.query(union_sumArea + union_area);
                
                    return res.send(get_data.rows);   
                } catch (error) {
                    console.error(error);
                    return res.status(401).send("Error server");
                }
            }
            else
            {  
                 //1.2. check sparing and spreading value;
                 if(spreading=='true' && spraying=='true' || spreading=='false' && spraying=='false'){
                    method_name="null";
                }
                else{
                    switch (spraying) {
                        case 'true':
                            method_name="spraying"
                            break;
                        }
                       switch (spreading) {
                        case 'true':
                            method_name="spreading"
                            break;
                    }
                }
                //1.3. check start date
                if(start_date!='null' && end_date!='null'){
                    dataType.push("take_of_time::date >= " + `'${start_date}'` + " AND take_of_time::date <= " + `'${end_date}'`);
                }
                else{
                    dataType.push("((SELECT to_char(CURRENT_TIMESTAMP, 'YYYY-MM'))  = (SELECT to_char(take_of_time, 'YYYY-MM')))")
                }
                 //1.4.check data from request
                data_check.push(team_name, aircaft_name, mode, location, method_name, account, area);
                for(let value in data_check){
                    if(data_check[value]!='null'){
                        dataType.push(data[value] + "=" + `'${data_check[value]}'`);
                    }   
                }
                //1.5. check value select
                if(dataType.length==1){
                    val_query += dataType[0];
                }
                else{
                    for(let val in dataType){
                        if(val == dataType.length-1){
                            val_query += dataType[val] +" "
                            break;
                        }  
                        val_query += dataType[val] +" AND ";
                    }
                }
                //1.6. get data search
                try {
                     //1.6.1. get date data search
                    for(const value in get_nameTable){
                        if(value == get_nameTable.length-1){
                            union_search  += `SELECT SUM(coalesce((area::numeric))) as area, take_of_time::date as time FROM(((${get_nameTable[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) JOIN 
                            (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query} AND landing_time is not null GROUP BY time ) as t GROUP BY t.time ORDER BY t.time DESC;`;
                            break;
                        }
                        union_search  += `SELECT SUM(coalesce((area::numeric))) as area, take_of_time::date as time FROM(((${get_nameTable[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) JOIN 
                        (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query} AND landing_time is not null GROUP BY time  UNION ALL `;
                    } 
                    const get_realtime = await pool.query(union_search);
                    return res.send(get_realtime.rows); 
                } catch (error) {
                    console.error(error);
                    return res.status(401).send("Error search")
                }   
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(401).send("Server Error");
    }
})
//total area pilot of team
router.post("/member-rankings", async(req, res)=>{
    try {
        var realtime_name=[];
        var rq_value=[{}]
        var union_value = "SELECT SUM(area) as area, t.username FROM("

        const {team_name, start_date, end_date, date} = req.body;
        //1. get aircaft id from team
        const get_aircaftID =await pool.query(`SELECT aircaft_id FROM (team NATURAL JOIN aircaft) WHERE team.name = '${team_name}';`)
        //2. get realtime table with aircaft ID
        for(const value of get_aircaftID.rows){
            const rt_name = "rt_" + (value.aircaft_id).replaceAll('-', '_');
            const check_realtime = await pool.query(`SELECT realtime_id FROM ${rt_name} WHERE landing_time is not null LIMIT 1;`);
            if(check_realtime.rows.length!=0){
                realtime_name.push(rt_name);
            }
        }
        //do not time select
        if(start_date=='null' && end_date =='null' && date=='null'){
            //get data
            try{
                for(const values in realtime_name){
                    if(values == realtime_name.length-1){
                        union_value += `SELECT SUM(area) as area, pilot.username FROM (${realtime_name[values]} NATURAL JOIN pilot)   
                        NATURAL JOIN team GROUP BY pilot.username, team.name) as t GROUP BY t.username ORDER BY area DESC;`
                         break;
                    }
                    union_value += `SELECT SUM(area) as area, pilot.username FROM (${realtime_name[values]} NATURAL JOIN pilot)   
                    NATURAL JOIN team GROUP BY pilot.username, team.name UNION `
                } 
                const get_totalArea = await pool.query(union_value)
                for(var val of get_totalArea.rows){
                    rq_value.push({pilo: val.username , suma: Math.round((val.area)*100)/100}); 
                }
                rq_value.shift();//remove first element*/
                
                return res.status(200).send(rq_value) 
            }catch(error){
                console.error(error);
                return res.status(401).send("Error");
            }
        }   
        else{
            if(date!='null' && start_date=='null'& end_date=='null'){
                try{
                    for(const values in realtime_name){
                         if(values == realtime_name.length-1){
                            union_value += `SELECT SUM(t.total) as area,t.username FROM (SELECT SUM(area) as total, pilot.username, take_of_time FROM 
                                (${realtime_name[values]} NATURAL JOIN pilot) NATURAL JOIN team WHERE take_of_time<= CURRENT_TIMESTAMP AND 
                                take_of_time >= NOW() - INTERVAL '${date} DAY' GROUP BY area, pilot.username, team.name, take_of_time) as t GROUP BY t.username ) as t GROUP BY t.username ORDER BY area DESC;`
                                break;
                        }
                        union_value += `SELECT SUM(t.total) as area,t.username FROM (SELECT SUM(area) as total, pilot.username, take_of_time FROM 
                        (${realtime_name[values]} NATURAL JOIN pilot) NATURAL JOIN team WHERE take_of_time<= CURRENT_TIMESTAMP AND 
                        take_of_time >= NOW() - INTERVAL '${date} DAY' GROUP BY area, pilot.username, team.name, take_of_time) as t GROUP BY t.username UNION `
                    }
                    const get_totalArea =  await pool.query(union_value);
                    for(var val of get_totalArea.rows){
                        rq_value.push({pilo: val.username , suma:  Math.round((val.area)*100)/100}); 
                    }
                    rq_value.shift();//remove first element
                    return res.status(200).send(rq_value) 
                }catch(error){
                    console.error(error);
                    return res.status(401).send("Error");
                }
            }
            if(start_date!='null' && end_date!='null' && date=='null'){
                try
                {
                    for(const values in realtime_name){
                        if(values == realtime_name.length-1){
                            union_value +=`SELECT SUM(t.total) as area, t.username from (SELECT SUM(area) as total, pilot.username, take_of_time FROM (${realtime_name[values]} NATURAL JOIN pilot) 
                            NATURAL JOIN team WHERE take_of_time::date<='${end_date}' AND take_of_time::date>='${start_date}' GROUP BY area, pilot.username, team.name, take_of_time 
                            ORDER BY take_of_time DESC) as t GROUP BY t.username) as t GROUP BY t.username ORDER BY area DESC;` ;
                            break;
                        }
                        union_value +=`SELECT SUM(t.total) as area, t.username FROM (SELECT SUM(area) as total, pilot.username, take_of_time FROM (${realtime_name[values]} NATURAL JOIN pilot) 
                        NATURAL JOIN team WHERE take_of_time::date<='${end_date}' AND take_of_time::date>='${start_date}' GROUP BY area, pilot.username, team.name, take_of_time 
                        ORDER BY take_of_time DESC) as t GROUP BY t.username UNION `; 
                    }
                    console.log(union_value)
                    const get_totalArea =  await pool.query(union_value);
                    for(var val of get_totalArea.rows){
                        rq_value.push({pilo: val.username , suma:  Math.round((val.area)*100)/100}); 
                    }
                    rq_value.shift();//remove first element
                    return res.status(200).send(rq_value) 
                }catch(error){
                    console.error(error);
                    return res.status(401).send("Error");
                }
            }
        } 
    } catch (error) {
        console.error(error);
        return req.status(401).send("Server error");
    }
})

module.exports = router;