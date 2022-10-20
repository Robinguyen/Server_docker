const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");
const bcrypt = require("bcrypt");

// create pilot
router.post("/create-pilot", authorize, async (req, res) => {
    // 1. destructure the req.body 
    const { name, email, password, team_id } = req.body;
    function validEmail(userEmail) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail);
    }
    try {
        // 2. check infor input
        if (req.path === "/create-pilot") {
            //console.log(!email.length);
            if (![ name, email, password, team_id ].every(Boolean)) {
                return res.send("Please insert full infor 2");
            } else if (!validEmail(email)) {
                return res.send("Invalid Email");
            }
        }

        // 2. check if pilot exist (if pilot exist then throw error)

        if((name.length > 0) && (team_id.length > 0) && (email.length > 0) &&(password.length > 0))
        {
            const check_email = await pool.query("select pilot_id, username, email, team.name from pilot natural join team where email = $1", [email]);
            const check_name = await pool.query("select pilot_id, username, email, team.name from pilot natural join team where username = $1", [name]);
            if (check_email.rows.length > 0)
            {
                return res.status(401).send("pilot email '" + email + "' already exist in team '" + check_email.rows[0].name +"'"); // pilot ton tai o trong team nao notification
            }
            if(check_name.rows.length > 0)
            {
                return res.status(401).send("pilot name '" + name + "' already exist in team '" + check_name.rows[0].name +"'");
            }
        }
        else
        {
            return res.send("Please insert full infor");
        }
        // 3. check id team from database

        try {
            const check_teamID = await pool.query("SELECT * FROM team WHERE team_id = $1", [team_id]);
            if(check_teamID.rows.length === 0)
            {
                return res.status(401).send("team doesn't exist");
            }
        } catch (error) {
            return res.status(401).send("error team id");
        }

        // 4. Bcrypt the  pilot password
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 5. create pilot in database
        await pool.query(
            "INSERT INTO pilot (username , email, password, team_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, bcryptPassword, team_id]);

        // 5. response client
        return res.send("creat pilot '" + name + "' success !");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// load pilot follow team
// router.post("/load-pilot", authorize, async (req, res) => {
//     // 1. destructure the req.body (name)
//     const { load_team } = req.body;
//     try {
//         // 2. load database
//         if(load_team === "load-table-team")
//         {
//             const table_team =  await pool.query("SELECT * FROM team ORDER BY name DESC ");
//             return res.send(table_team.rows);
//         }
//         else
//         {
//             return res.json("don't allow get");
//         }
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server error");
//     }
//     });

module.exports = router;