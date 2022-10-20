const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// real-time
router.post("/upload-data",async (req, res) => {
    try{
        var aircaft_nameStatus=false;
        //get value form body
        const {aircaft_name,
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
                take_of_time, 
                landing_time, 
                flight_duaration, 
                status}  = req.body;
        //get aircaft name
        const realtime_aircaftName  = "realtime_" + aircaft_name.toLowerCase();
        console.log(realtime_aircaftName);
        try {
                const get_allTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                for(const i in get_allTable.rows){
                    const name_table = get_allTable.rows[i].table_name;
                    //check table name in database
                    console.log(name_table)
                    if(name_table == realtime_aircaftName){
                        aircaft_nameStatus=true;
                        break;
                    }
                } 
        } catch (error) {
            return res.status(401).send("Aircaft name error");
        }
        try {
            if(aircaft_nameStatus==true){
                //insert first
                const select_table  = await pool.query(`SELECT * FROM ${realtime_aircaftName}`);
                if(select_table.rows.length==0){
                    await pool.query(`INSERT INTO ${realtime_aircaftName}
                                    (flightmode_id, 
                                    pilot_id, 
                                    spraying_rate, 
                                    route_spacing, 
                                    flight_speed, 
                                    height, 
                                    hopper_outletsize, 
                                    spinner_diskspeed, 
                                    location, 
                                    data, 
                                    take_of_time, 
                                    landing_time, 
                                    flight_duaration) 
                                    VALUES ('${flightmode_id}',
                                            '${pilot_id}',
                                            '{${spraying_rate}}',
                                            '{${route_spacing}}',
                                            '{${flight_speed}}',
                                            '{${height}}',
                                            '{${hopper_outletsize}}',
                                            '{${spinner_diskspeed}}',
                                            '${location}',
                                            '{${data}}',
                                            '${take_of_time}',
                                            null,
                                            null);`);   
                    await pool.query(`UPDATE aircaft SET status = 'true' WHERE aircaft_name = '${aircaft_name}';`);
                    return res.status(200).send("Insert first is OK");
                }
                //check take of time
                const select_time = await pool.query(`SELECT * FROM ${realtime_aircaftName} WHERE take_of_time ='${take_of_time}';`);
                if(select_table.rows.length!=0 && select_time.rows.length==0){
                    await pool.query(`INSERT INTO ${realtime_aircaftName}(flightmode_id, pilot_id, spraying_rate, route_spacing, flight_speed, height, hopper_outletsize, spinner_diskspeed, location, data, take_of_time, landing_time, flight_duaration) VALUES ('${flightmode_id}','${pilot_id}','{${spraying_rate}}','{${route_spacing}}','{${flight_speed}}','{${height}}','{${hopper_outletsize}}','{${spinner_diskspeed}}','${location}','{${data}}','${take_of_time}',null,null);`);   
                    return res.status(200).send("Insert is OK");
                }
                if(select_table.rows.length!=0 && select_time.rows.length==1){
                   try {
                            //get id
                            const get_realtimeKey = await pool.query(`SELECT realtime_id FROM ${realtime_aircaftName} WHERE take_of_time = '${take_of_time}'`);
                            //check landing time
                            const check_landTime = await pool.query(`SELECT landing_time FROM ${realtime_aircaftName} WHERE realtime_id = '${get_realtimeKey.rows[0].realtime_id}';`);
                            //check pilot id
                            const check_pilotID = await pool.query(`SELECT * FROM ${realtime_aircaftName} WHERE realtime_id = '${get_realtimeKey.rows[0].realtime_id}';`);
                            if(check_landTime.rows[0].landing_time==null && check_pilotID.rows[0].pilot_id == pilot_id){
                                const upload_data  = await pool.query(`UPDATE ${realtime_aircaftName} SET spraying_rate = spraying_rate || '{${spraying_rate}}', route_spacing = route_spacing || '{${route_spacing}}', flight_speed = flight_speed || '{${flight_speed}}', height = height || '{${height}}', hopper_outletsize = hopper_outletsize || '{${hopper_outletsize}}', spinner_diskspeed = spinner_diskspeed || '{${spinner_diskspeed}}', data = data || '{${data}}' WHERE realtime_id = '${get_realtimeKey.rows[0].realtime_id}';`);
                                //check landing tim
                                if(landing_time!='null'){
                                    await pool.query(`UPDATE ${realtime_aircaftName} SET landing_time = '${landing_time}',flight_duaration = '${flight_duaration}' WHERE realtime_id = '${get_realtimeKey.rows[0].realtime_id}';`);
                                    //insert aicaft status
                                    await pool.query(`UPDATE aircaft SET status = 'false' WHERE aircaft_name = '${aircaft_name}';`);
                                    aircaft_nameStatus=false;
                                    return res.status(200).send("complete data");     
                                }
                                return res.status(200).send("Insert data");    
                            }
                            else
                            {
                                return res.status(401).send("Error insert data");
                            }  
                    } catch (error) {
                        return res.status(401).send("Error insert");
                    } 
                }
            }         
        } catch (error) {
            return res.status(401).send("Error")
        } 
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

//read data from server
router.post("/get-data", async (req, res) =>{
    //xac dinh name drone dang hoat dong -> xac dinh bang real time(checjk landing time)
    try {
        const {action_aircaftName} = req.body;
        


        
        
    } catch (error) {
        console.error(error.message);
       return res.status(401).send("Server fail");
    }
  
    
});

//import data realtime
router.get("/import", async (req, res) =>{
    try {

        await pool.query(`insert into rt_9941a919_3c78_41d8_b135_bcaed3127a46 (realtime_id , aircaft_id, flightmode_id , pilot_id ,method_id, spraying_rate , route_spacing , flight_speed , height , hopper_outletsize , spinner_diskspeed , location , data , take_of_time, landing_time , flight_duaration,area) values ('ad427834-d738-46aa-8886-c046e2c4ddd3',
        '03b17374-8974-49d8-8a76-85d910f038d6',
        'f2f6c6ca-19e9-45fd-ad7a-412b9f1aa2d7',
        'f122aae4-0220-4a7c-a34b-7ef73402614f',
        '943c3bf6-71ca-4f25-9c02-83ad73c27b07',
        '{6.86,6.60,6.71,6.32,4.43,4.60,6.15,6.15,6.15,4.03,6.12,6.39,4.98,5.09,5.91,4.89,5.99,4.13,6.54,4.14,5.31,4.88,5.06,4.08,6.13,4.15,6.37,4.89,5.19,4.06,5.13,6.67,6.72,6.53,6.67,4.15,6.84,4.83,6.03,4.12,4.98,4.46,5.23,6.83,4.32,4.92,5.80,4.22,4.96,5.17,5.45,6.80,6.55,4.92,5.35,4.80,5.27,4.42,6.79,4.29,5.10,4.54,6.38,6.69,6.49,6.18,6.92,6.90,5.89,4.56,6.17,5.89,6.36,6.50,5.86,4.46,6.21,6.96,4.93,5.20,5.15,6.81,5.37,4.51,5.82,4.34,4.53,5.16,6.06,4.59,6.28,5.77,4.96,6.55,4.82,6.17,6.79,4.23,6.53,4.17,6.09,6.20,5.25,6.64,4.23,4.80,4.23,4.41,5.35,5.05,4.79,6.06,6.91,4.73,4.77}',
        '5.96',
        '{6.86,6.60,6.71,6.32,4.43,4.60,6.15,6.15,6.15,4.03,6.12,6.39,4.98,5.09,5.91,4.89,5.99,4.13,6.54,4.14,5.31,4.88,5.06,4.08,6.13,4.15,6.37,4.89,5.19,4.06,5.13,6.67,6.72,6.53,6.67,4.15,6.84,4.83,6.03,4.12,4.98,4.46,5.23,6.83,4.32,4.92,5.80,4.22,4.96,5.17,5.45,6.80,6.55,4.92,5.35,4.80,5.27,4.42,6.79,4.29,5.10,4.54,6.38,6.69,6.49,6.18,6.92,6.90,5.89,4.56,6.17,5.89,6.36,6.50,5.86,4.46,6.21,6.96,4.93,5.20,5.15,6.81,5.37,4.51,5.82,4.34,4.53,5.16,6.06,4.59,6.28,5.77,4.96,6.55,4.82,6.17,6.79,4.23,6.53,4.17,6.09,6.20,5.25,6.64,4.23,4.80,4.23,4.41,5.35,5.05,4.79,6.06,6.91,4.73,4.77}',
        '{6.86,6.60,6.71,6.32,4.43,4.60,6.15,6.15,6.15,4.03,6.12,6.39,4.98,5.09,5.91,4.89,5.99,4.13,6.54,4.14,5.31,4.88,5.06,4.08,6.13,4.15,6.37,4.89,5.19,4.06,5.13,6.67,6.72,6.53,6.67,4.15,6.84,4.83,6.03,4.12,4.98,4.46,5.23,6.83,4.32,4.92,5.80,4.22,4.96,5.17,5.45,6.80,6.55,4.92,5.35,4.80,5.27,4.42,6.79,4.29,5.10,4.54,6.38,6.69,6.49,6.18,6.92,6.90,5.89,4.56,6.17,5.89,6.36,6.50,5.86,4.46,6.21,6.96,4.93,5.20,5.15,6.81,5.37,4.51,5.82,4.34,4.53,5.16,6.06,4.59,6.28,5.77,4.96,6.55,4.82,6.17,6.79,4.23,6.53,4.17,6.09,6.20,5.25,6.64,4.23,4.80,4.23,4.41,5.35,5.05,4.79,6.06,6.91,4.73,4.77}',
        '{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',
        '{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',
        'Mỹ Quý, Tháp Mười, Đồng Tháp',
        '{{10.5186718,105.7259948},{10.5185323,105.7264862},{10.5184332,105.7264592},{10.5182372,105.7264531},{10.5185307,105.7265331},{10.5185291,105.72658},{10.5180412,105.726447},{10.5178452,105.726441},{10.5185275,105.7266269},{10.518526,105.7266738},{10.5176492,105.7264349},{10.5174532,105.7264288},{10.5185244,105.7267208},{10.5185228,105.7267677},{10.5172572,105.7264228},{10.5170612,105.7264167},{10.5185212,105.7268146},{10.5185196,105.7268615},{10.5168653,105.7264106},{10.5166693,105.7264046},{10.5185181,105.7269084},{10.5185165,105.7269554},{10.5164733,105.7263985},{10.5162773,105.7263924},{10.5185149,105.7270023},{10.5185133,105.7270492},{10.5160813,105.7263864},{10.5158853,105.7263803},{10.5185118,105.7270961},{10.5185102,105.727143},{10.5156893,105.7263742},{10.5154933,105.7263682},{10.5185086,105.7271899},{10.518507,105.7272369},{10.5152973,105.7263621},{10.5151013,105.726356},{10.5185055,105.7272838},{10.5185039,105.7273307},{10.5149053,105.72635},{10.5147093,105.7263439},{10.5185023,105.7273776},{10.5185007,105.7274245},{10.5146609,105.7263781},{10.5146562,105.7264241},{10.5184991,105.7274715},{10.5184976,105.7275184},{10.5146515,105.7264702},{10.5146469,105.7265163},{10.518496,105.7275653},{10.5184944,105.7276122},{10.5146422,105.7265624},{10.5146375,105.7266084},{10.5184928,105.7276591},{10.5184913,105.727706},{10.5146328,105.7266545},{10.5146282,105.7267006},{10.5184897,105.727753},{10.5184881,105.7277999},{10.5146235,105.7267467},{10.5146188,105.7267927},{10.5184865,105.7278468},{10.518485,105.7278937},{10.5146141,105.7268388},{10.5146095,105.7268849},{10.5184834,105.7279406},{10.5184818,105.7279876},{10.5146048,105.7269309},{10.5146001,105.726977},{10.5184802,105.7280345},{10.5184786,105.7280814},{10.5145954,105.7270231},{10.5145908,105.7270692},{10.5184771,105.7281283},{10.5184755,105.7281752},{10.5145861,105.7271152},{10.5145814,105.7271613},{10.5182807,105.7281695},{10.5180856,105.7281637},{10.5145767,105.7272074},{10.5145721,105.7272535},{10.5178904,105.7281578},{10.5176953,105.728152},{10.5145674,105.7272995},{10.5145627,105.7273456},{10.5175001,105.7281461},{10.517305,105.7281403},{10.514558,105.7273917},{10.5145534,105.7274378},{10.5171098,105.7281345},{10.5169147,105.7281286},{10.5145487,105.7274838},{10.514544,105.7275299},{10.5167195,105.7281228},{10.5165243,105.7281169},{10.5145393,105.727576},{10.5145347,105.727622},{10.5163292,105.7281111},{10.516134,105.7281053},{10.51453,105.7276681},{10.5145253,105.7277142},{10.5159389,105.7280994},{10.5157437,105.7280936},{10.5145206,105.7277603},{10.514516,105.7278063},{10.5155486,105.7280878},{10.5153534,105.7280819},{10.5145113,105.7278524},{10.5145066,105.7278985},{10.5151583,105.7280761},{10.5149631,105.7280702},{10.5145019,105.7279446},{10.5144973,105.7279906},{10.5147679,105.7280644},{10.5145728,105.7280586},{10.5144926,105.7280367}}',
        ' 2022-08-20 11:02:23',
        ' 2022-08-20 11:05:23',
        '00:03:00',
        '5.96');`);
        
        
        return res.send('Hello World!');
        
    } catch (error) {
        console.error(error.message);
       return res.status(401).send("Server fail");
    }
  
    
});

router.post("/get-actionaircaft", async (req, res)=>{
    try {
        const {status} = req.body;
        
        if(status==1){
            try {
                const action_aircaft = await pool.query("SELECT status FROM aircaft");
                let action_value=0;
                for(const value in action_aircaft.rows){
                    if(action_aircaft.rows[value].status==1){
                       action_value+=1;
                    }
                }
                //get name action aircaft name
                const get_actionAircaft = await pool.query("SELECT aircaft_name FROM aircaft WHERE status='true';");
                const json = JSON.stringify(get_actionAircaft.rows)
                return res.status(200).json({
                    "action_aircaft": `${action_value}`,
                    "action_aircaftName": `${json}`
                })
               
            } catch (error) {
                return res.status(401).send("Aircaft Error");
            }
        }
        
    } catch (error) {
        return res.status(401).send("Server Error");
    }
   
    
});

router.post("delete-data", async (req, res)=>{

});
// write : up data ( status : 1)
// read : software server doc ve ( ham quet ) 
// delete
// update

module.exports = router;