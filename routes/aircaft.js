const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// real-time
router.post("/create-aircaft",async (req, res) => {

    const { aircaft_name,
        aircaft_typeid,
        team_id,
        activation_time,
        serial_number,
        flight_controllerid,
        package,
        aircaft_lock}= req.body;
    try {
    
        //1. check aircaft name and serial number
        const check_Aircaft = await pool.query("SELECT * FROM aircaft WHERE aircaft_name=$1", [aircaft_name]);
        const check_serialNumer = await pool.query("SELECT * FROM aircaft WHERE serial_number=$1", [serial_number]);

        /// check package + fightcontrolerID

        if(check_Aircaft.rows.length){
            return res.send("Aircaft already axits");
        }
        if(check_serialNumer.rows.length){
            return res.send("Serial number already exits");
        }

        
        //2. create aircaft -- note : status set default = false; 
            // note build : unlock and set activation_time ;
        const aircaft_id = await pool.query(
                        "INSERT INTO aircaft(aircaft_name,aircaft_typeid,team_id,activation_time,serial_number,flight_controllerid,package,aircaft_lock)" + 
                        " VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING aircaft_id", 
                        [aircaft_name,
                        aircaft_typeid,
                        team_id,
                        activation_time,
                        serial_number,
                        flight_controllerid,
                        package,
                        aircaft_lock]);
        
        // 3.create aircaft real time table                 

        let aircaftID = String(Object.values(aircaft_id.rows[0])).replaceAll('-', '_');
        const realtime_Name = "rt_" + aircaftID;
        
        await pool.query(`CREATE TABLE IF NOT EXISTS ${realtime_Name} 
                        (realtime_id uuid not null default uuid_generate_v4() primary key, 
                        aircaft_id uuid not null,
                        flightmode_id uuid not null, 
                        pilot_id uuid not null,
                        spraying_rate real[][] not null, 
                        route_spacing real not null, 
                        flight_speed real[][] not null, 
                        height real[][] not null, 
                        hopper_outletsize real[][] not null, 
                        spinner_diskspeed real[][] not null, 
                        location varchar(255) not null, 
                        data real[][] not null, 
                        task area real,
                        take_of_time timestamp not null, 
                        landing_time timestamp, 
                        flight_duaration time,  
                        FOREIGN KEY (aircaft_id) REFERENCES aircaft(aircaft_id),
                        FOREIGN KEY (flightmode_id) REFERENCES flight_mode(flightmode_id),
                        FOREIGN KEY (pilot_id) REFERENCES pilot(pilot_id));`);
        return res.status(200).send(req.body);

    } catch (err) {
        console.error(err.message)
        res.status(401).send("can not create aircaft");
    }
})
//get information aircaft
router.post("/get-aircaft", async (req, res)=>{
     try{  
        const {aircaft_id} = req.body;
        //check id aircaf table
        const check_aircaftID = await pool.query("SELECT * FROM aircaft WHERE aircaft_id = $1", [aircaft_id]);
        console.log(check_aircaftID.rows.length)
       if(check_aircaftID.rows.length==0){

            return res.send("Aircaft ID does not exist");
        }
        const getAircaft = await pool.query("SELECT * FROM aircaft WHERE aircaft_id = $1", [aircaft_id]);
       
        
        return res.status(200).send(getAircaft.rows[0].aircaft_name);
    }
    catch(err){
        console.error(err.message);
        res.status(401).send("Server Fail");
    }


});

//update aircaft
router.post("/update-aircaft", async (req, res)=>{
    try{
        //get value from body
        const{aircaft_id, aircaft_name,aircaft_typeid,team_id,status,activation_time,serial_number,flight_controllerid,package,aircaft_lock}= req.body;
        //check aircaft id
        try{
            const check_aircaftID = await pool.query("SELECT * FROM aircaft WHERE aircaft_id = $1", [aircaft_id]);
            if(check_aircaftID.rows.length==0){
                return res.status(401).send("aircaft id does not exits");
            }
        }
        catch(err){
            res.status(401).send("error aircaft id");
        }
        //check aircaft name
        try{
            const check_aircaftName  =await pool.query("SELECT * FROM aircaft WHERE aircaft_name = $1", [aircaft_name]);
            if(check_aircaftName.rows.length==1){
                return res.status(401).send("aircaft name already exits");
            }
        }
        catch(err){
            return res.status(401).send("error aircaft name");
        }
        //check aircaft type in aircaft type table
       
        try{
            const check_aircaftType = await pool.query("SELECT * FROM aircaft_type WHERE aircaft_typeid=$1", [aircaft_typeid]);
            if(check_aircaftType.rows.length==0){
                return res.status(401).send("aircaft type id does not exits");
            }
        }
        catch(err){
            return res.status(401).send("aircaft type error");
        }
        // check team id in team table
        try {
            const check_teamID = await pool.query("SELECT * FROM team WHERE team_id=$1", [team_id]);
            if(check_teamID.rows.length==0){
                return res.status(401).send("team does not exist");
            }
        } catch (err) {
            return res.status(401).send("team id error");
        }
        
        await pool.query("UPDATE aircaft SET aircaft_name = $1, aircaft_typeid=$2,team_id=$3,status=$4,activation_time=$5,serial_number=$6,flight_controllerid=$7,package=$8,aircaft_lock=$9 WHERE aircaft_id = $10",
         [aircaft_name,aircaft_typeid,team_id,status,activation_time,serial_number,flight_controllerid,package,aircaft_lock, aircaft_id]);
        return res.status(200).send("update aircaft succes");

    }
    catch(err){
        console.error(err.message);
        res.status(401).send("Server Fail");
    }
});
//update aircaft name
router.post("/update-aircaftname", async(req, res) => {
    try {
        const {aircaft_name, aircaft_editname}  =req.body;
        if( aircaft_name=='null' || aircaft_editname=='null' || aircaft_name == aircaft_editname){
            return res.status(401).send("Edit error");
        }
        const check_aircaftname = await pool.query(`SELECT aircaft_name FROM aircaft WHERE aircaft_name = '${aircaft_name}';`);
        if(check_aircaftname.rows.length>0){
            await pool.query(`UPDATE aircaft SET aircaft_name = '${aircaft_editname}' WHERE aircaft_name='${aircaft_name}';`);
            return res.status(200).send("Edit success");
        }
        return res.status(401).send("Error");
    } catch (error) {
        return res.status(401).send("Server Error");
    }
});
//delete aircaft
router.post("/delete-aircaft", async (req, res)=>{

    const {aircaft_id}  = req.body;

    try {
        
        const check_aircaftID = await pool.query("SELECT * FROM aircaft WHERE aircaft_id=$1", [aircaft_id]);
        try {
            if(check_aircaftID.rows.length==0){
                return res.send("Aircaft id does not exits");
            }
        } catch (err) {
            return res.status(401).send("aircaft id error");
        }

        await pool.query("DELETE FROM aircaft WHERE aircaft_id=$1", [aircaft_id]);
        //delete table realtime

        let aircaftID = aircaft_id.replaceAll('-', '_');
        
        await pool.query(`DROP TABLE ${"rt_" + aircaftID} `);

        return res.status(200).send("Delete success");
        
    } catch (err) {
        console.log(err.message);
        return res.status(401).send("Server fail");
    }
   
});

router.post("/lock-aircaft", async(req, res) =>{
    
    try {
        const {aircaft, lock_status} = req.body;
        const check_aircaftName = await pool.query(`SELECT aircaft_name FROM aircaft WHERE aircaft_name ='${aircaft}';`);
        if(check_aircaftName.rows.length ==0){
            return res.status(401).send("error");
        }
        
        const dt = await pool.query(`UPDATE aircaft SET aircaft_lock = '${lock_status}', status='false' WHERE aircaft_name ='${aircaft}';`);
        return res.status(200).send("OK");
            
    } catch ({error}) {
       return res.status(401).send(error);    
    }
    
});


// write : up data ( status : 1)
// read : software server doc ve ( ham quet ) 
// delete
// update

module.exports = router;