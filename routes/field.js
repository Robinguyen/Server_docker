const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// create-field
router.post("/create-field",authorize, async (req, res) => {
    // 1. destructure the req.body (pilot_id, field_name, type, area, data)
    var { pilot_id, field_name, type, area, data, location } = req.body;
    try {
        // 2. check if field exist

        if((pilot_id.length > 0) && (field_name.length > 0) && (type.length > 0) &&(area.length > 0)
            && (data.length > 0) && (location.length > 0))
        {
            if(location.includes(","))
            {
                location = location.replaceAll(",", "*");
            }
            if(field_name.includes(","))
            {
                return res.status(401).send("field name doesn't have comma ");
            }
            const check_field = await pool.query("SELECT * FROM field WHERE field_name = $1", [field_name]);

            if (check_field.rows.length > 0) {
                return res.status(401).send("field name already exist!");
            } 

            const check_pilotID = await pool.query("SELECT * FROM pilot WHERE pilot_id = $1", [pilot_id]); //9.199911305040732, 105.40964734493296

            if (check_pilotID.rows.length === 0) {
                return res.status(401).send("pilot doestn't exist!");
            } 
        }
        else
        {
            return res.send("Please insert full infor");
        }

        // 3. create field in database
        
        const create_field = await pool.query("INSERT INTO field (pilot_id, field_name, type, area, time, data, location)"+
                                              " VALUES ($1, $2, $3, $4, current_timestamp, $5, $6) RETURNING *",
                                                [pilot_id, field_name, type, area, data, location]);

        // 4. response client
        return res.send("upload field '" + field_name + "' success !");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
})

// delete field
router.post("/delete-field", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { field_id } = req.body;
    try {
        // 2. check if user exist (if user exist then throw error)
        const checkfield = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
      
        if (checkfield.rows.length === 0) {
        return res.status(401).send("field doesn't exist!");
        }

        // 3. delete field
        await pool.query("DELETE FROM field WHERE field_id = $1",[field_id]);

        // 4. response client
        return res.send("delete field '" + checkfield.rows[0].field_name + "' success !");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// update field
router.post("/update-field", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { field_id, pilot_id, field_name, type, area, data, location} = req.body;
    try {
        // 2. check field id doesn't exist
        try {
            const check_fieldID = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
            if(check_fieldID.rows.length === 0)
            {
                return res.status(401).send("field doesn't exist");
            }
        } catch (error) {
            return res.status(401).send("error field id");
        }

        // 2. check field name doesn't exist
        try {
            const check_fieldName = await pool.query("SELECT * FROM field WHERE field_name = $1", [field_name]);
            if(check_fieldName.rows.length > 0)
            {
                return res.status(401).send("field name already update");
            }
        } catch (error) {
            return res.status(401).send("field name error");
        }

        // 3. update field database
        
        await pool.query("UPDATE field SET pilot_id = $2, field_name = $3, type = $4, area = $5, "+
                        "time = current_timestamp, data = $6, location = $7 WHERE field_id = $1", 
                        [field_id, pilot_id, field_name, type, area, data, location]);

        return res.send("field update success!" );
        
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