const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// load aircaft
router.post("/load-aircaft", async (req, res) => {
    // 1. destructure the req.body (name)
    const { load_aircaft } = req.body;
    try {
        // 2. load database
        if(load_aircaft === "load-table-aircaft")
        {
            const table_aircaft =  await pool.query(`SELECT aircaft.aircaft_id, aircaft.aircaft_name, aircaft_type.type_name, aircaft.status, aircaft.aircaft_lock
                                                    FROM aircaft NATURAL JOIN aircaft_type ORDER BY aircaft_name DESC `);
            return res.send(table_aircaft.rows);
        }
        else
        {
            return res.json("don't allow get");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// load aircafttype
router.post("/load-aircafttype", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { load_aircafttype } = req.body;
    try {
        // 2. load database
        if(load_aircafttype === "load-table-aircafttype")
        {
            const table_aircaft =  await pool.query(`SELECT type_name from aircaft_type `);
            return res.send(table_aircaft.rows);
        }
        else
        {
            return res.json("don't allow get");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// load aircaftcontent
router.post("/load-aircaft-content", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { aircaft_id } = req.body;
    try {
        // 2. load database
        if(aircaft_id.length > 0)
        {
            const table_aircaft =  await pool.query(`SELECT to_char(activation_time, 'dd-mm-yyyy HH24:MI:SS') as time, 
                                                     serial_number as seri, 
                                                     flight_controllerid as fcid, 
                                                     package as pack, 
                                                     aircaft_lock as lock, 
                                                     team.name as team
                                                     FROM aircaft natural join team
                                                     WHERE aircaft_id = $1`, [aircaft_id]);
            return res.send(table_aircaft.rows);
        }
        else
        {
            return res.json("don't allow get");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// load aircaftcontent-datatable
router.post("/load-aircaft-content/data-table", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { aircaft_id } = req.body;
    try {
        // 2. load database
        if(aircaft_id.length > 0)
        {
            let aircaftID = "rt_" + aircaft_id.replaceAll('-', '_');

            // takeoff and landing time, task location, task area, pilot name, team name, flight mode
            const table_aircaft =  await pool.query(` select to_char(take_of_time, 'dd-mm-yyyy HH24:MI:SS') as take, 
                                                        to_char(landing_time, 'dd-mm-yyyy HH24:MI:SS') as land, 
                                                        location as loca, 
                                                        area, 
                                                        pilot.username as pilot, 
                                                        flight_mode.flightmode_name  as mode
                                                        from  ${aircaftID} natural join pilot natural join flight_mode`);
            return res.send(table_aircaft.rows);
        }
        else
        {
            return res.json("don't allow get");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;