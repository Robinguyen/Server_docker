const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// load field
router.post("/load-field", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { load_field } = req.body;
    try {
        // 2. load database
        if(load_field === "load-table-field")
        {
            const table_field =  await pool.query("SELECT field_name, location, field_id, area, " + 
                                                "to_char(time, 'dd-mm-yyyy HH24:MI:SS') as time, type FROM field ORDER BY time ASC ");
            return res.send(table_field.rows);
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

// function 1 : load 1 field id data
router.post("/function1/load", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { field_id } = req.body;
    try {
        // 2. load database
        if(field_id.length > 0)
        {
            // check field_id exist
            try {

                const check_field_id = await pool.query("select field_id from field where field_id = $1 ", [field_id]);
                if(check_field_id.rows.length === 0)
                {
                    return res.status(401).json("error f1_load");
                }
                // 3. get data from database
                const data_location = await pool.query("select data from field where field_id = $1",[field_id]);
                return res.json(data_location.rows);
            } catch (error) 
            {
                console.error(error.message);
                return res.status(401).json("error f1_load");
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

// write
// read 
// delete
// update

module.exports = router;