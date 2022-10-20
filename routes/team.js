const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");

// | team_id | team_name | ownerRole2 |

// create team
router.post("/create-team", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { name } = req.body;
    try {
        // 2. check if user exist (if user exist then throw error)
        const checkteam = await pool.query("SELECT * FROM team WHERE name = $1", [name]);
      
        if (checkteam.rows.length > 0) {
        return res.status(401).send("team already exist!");
        }
        // 3. create team in database
        const create_team = await pool.query(
            "INSERT INTO team (name) VALUES ($1) RETURNING *",
            [name]
        )
        // 4. get acc_id role = 1
        const acc_idR1 = await pool.query("select acc_id from admin_account where role = '1'");

        // 5. create relate : acc role 1 to manager new team
        await pool.query(
            "INSERT INTO relate_admin_team (team_id, acc_id) VALUES ($1, $2) RETURNING *",
            [create_team.rows[0].team_id, acc_idR1.rows[0].acc_id]
        );
        // 4. response client
        return res.json({message : `create team '${name}' success !`, team_id : create_team.rows[0].team_id});
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// delete team
router.post("/delete-team", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { team_id } = req.body;
    try {
        // 2. check if user exist (if user exist then throw error)
        const checkteam = await pool.query("SELECT * FROM team WHERE team_id = $1", [team_id]);
      
        if (checkteam.rows.length === 0) {
        return res.status(401).send("team doesn't exist!");
        }
        // 3. delete relative database
        const delete_relate = await pool.query(
            "DELETE FROM relate_admin_team WHERE team_id = $1",
            [checkteam.rows[0].team_id]
        )
        // 4. delete team
        await pool.query("DELETE FROM team WHERE team_id = $1",[team_id]);

        // 5. response client
        return res.send("delete team '" + checkteam.rows[0].name + "' success !");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// load team
router.post("/load-team", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { load_team } = req.body;
    try {
        // 2. load database
        if(load_team === "load-table-team")
        {
            const table_team =  await pool.query("SELECT * FROM team ORDER BY right(name, 2) ASC NULLS FIRST ");
            return res.send(table_team.rows);
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

// get last record in team database
router.post("/get-last-record", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { last_record } = req.body;
    try {
        // 2. load database
        if(last_record === "last_record")
        {
            const last =  await pool.query("select * from team offset ((select count(*) from team)-1)");
            return res.send(last.rows[0].team_id);
        }
        else
        {
            return res.json("cmd fail");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});


// update team
router.post("/update-team", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { team_id, name_new} = req.body;
    try {
        // 2. check team id doesn't exist
        try {
            const check_teamID = await pool.query("SELECT * FROM team WHERE team_id = $1", [team_id]);
            if(check_teamID.rows.length === 0)
            {
                return res.status(401).send("team doesn't exist");
            }
        } catch (error) {
            return res.status(401).send("error team id");
        }

        // 2. check team name doesn't exist
        try {
            const check_teamName = await pool.query("SELECT * FROM team WHERE name = $1", [name_new]);
            if(check_teamName.rows.length > 0)
            {
                return res.status(401).send("team name exist");
            }
        } catch (error) {
            return res.status(401).send("team name exist");
        }

        // 3. update team database

        await pool.query("UPDATE team SET name = $2 WHERE team_id = $1", [team_id, name_new]);
        return res.send("team update success!" );
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// add relate admin team
router.post("/add-relate-admin-team", authorize, async (req, res) => {
    // 1. destructure the req.body (name)
    const { admin_id, team_id} = req.body;
    try {
        // 2. check admin_id and team_id name doesn't exist
        if((admin_id.length > 0) && (team_id.length > 0))
        {
            try {
                const check_admin = await pool.query("SELECT * FROM admin_account WHERE acc_id = $1", [admin_id]);
                if(check_admin.rows.length === 0)
                {
                    return res.status(401).json("error acc id");
                }
            } catch (error) {
                return res.status(401).json("error acc id");
            }
            
            try {
                const check_team = await pool.query("SELECT * FROM team WHERE team_id = $1", [team_id]);
                if(check_team.rows.length === 0)
                {
                    return res.status(401).json("error team id");
                }
            } catch (error) {
                return res.status(401).json("error team id");
            }
            
            // 3. check admin_id and team_id exist in rows
            try {
                const check_relate = await pool.query("SELECT * FROM relate_admin_team WHERE team_id = $1 AND acc_id = $2", [team_id,admin_id]);
                if(check_relate.rows.length > 0)
                {
                    return res.status(401).json("relate exist");
                }
            } catch (error) {
                return res.status(401).json("relate exist");
            }
            // 4. add relate to database
            await pool.query(
                "INSERT INTO relate_admin_team (team_id, acc_id) VALUES ($1, $2) RETURNING *",
                [team_id, admin_id]
            )
            return res.json("create relate admin team success");
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

module.exports = router;
