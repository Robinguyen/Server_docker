const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

//authorizeentication

// --- register -- //
router.post("/register",validInfo,async (req, res) => {
    // 1. destructure the req.body (name , email, password , role)
    const { name, email, password, role } = req.body;

    try 
    {
        // 2. check if user exist (if user exist then throw error)
        const user = await pool.query("SELECT * FROM admin_account WHERE email = $1", [email]);
      
        if (user.rows.length > 0) {
        return res.status(401).json("User already exist!");
        }
        // 3. Bcrypt the user password
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        console.log(bcryptPassword);
        // 4. enter the new user inside qnx database

        let newUser = await pool.query(
            "INSERT INTO admin_account (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, bcryptPassword, role]
          );
        //res.json(newUser.rows[0])
        // 5. generating jwt token
        const jwtToken = jwtGenerator(newUser.rows[0].user_id);
        
        return res.json({ jwtToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// --- login-- //
router.post("/login",validInfo, async (req, res) => {
    // 1. destructure the req.body (email, password)
    const { email, password } = req.body;
  
    try {
        // 2. check if user doesn't exist (if not then we throw error)
        const admin_account = await pool.query("SELECT * FROM admin_account WHERE email = $1", [
            email
        ]);
        if (admin_account.rows.length === 0) {
            return res.status(401).json({jwtToken : null, role : null, message : "Invalid Credential"});
        }
        
        // 3. check if incomming password is the same the database password
        const validPassword = await bcrypt.compare(
           password,
            admin_account.rows[0].password
        ); 
        console.log(admin_account.rows)
        if(!validPassword){
            return res.status(401).json({jwtToken : null, role : null, message : "Invalid Credential"});
        }
        /*if (password == admin_account.rows[0].password) {
            const jwtToken = jwtGenerator(admin_account.rows[0].acc_id);
            return res.json({ jwtToken : jwtToken , role : admin_account.rows[0].role, message : "login successful" });
            //return res.status(401).json({jwtToken : null, role : null, message : "Invalid Credential"});
        }*/

        // 4. give them the jwt token
        const jwtToken = jwtGenerator(admin_account.rows[0].acc_id);
        return res.json({ jwtToken : jwtToken , role : admin_account.rows[0].role, message : "login successful", user: admin_account.rows[0].username});

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
  });

// -- verify -- //

router.post("/verify", authorization, (req, res) => {
    try {
      res.json(true);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });  
// --- delete user-- //
router.post("/delete", async (req, res) => {
    // 1. destructure req.body
    const {email} = req.body;
    
    try {
        // 2. check if user doens't exits (then return)
        const admin_account = await pool.query("SELECT * FROM admin_account WHERE email = $1", [
            email
        ]);
    
        if (admin_account.rows.length === 0) {
            return res.status(401).json("User doesn't exist");
        }
        
        // 3. delete user in database
        const deleteUser = await pool.query("DELETE FROM admin_account WHERE email = $1", [
            email
        ]);
    
        return res.json({deleteUser, status : 'true'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});
// --- update user-- //
router.post("/update", async (req, res) => {
    // 1. destructure req.body
    const {name, email_old, email_new, password, role} = req.body;

    try {
        // 2. check if user doens't exits (then return)
        if((name.length > 0) && (email_old.length > 0) && (email_new.length > 0) &&(password.length > 0) && (role.length > 0))
        {
            const admin_account = await pool.query("SELECT * FROM admin_account WHERE email = $1", [
                email_old
            ]);
            
            if (admin_account.rows.length === 0) {
                return res.status(401).json("User doesn't exist");
            }
        }
        else
        {
            return res.status(401).json("Please insert full infor");
        }
        
        // 3. Bcrypt the user password
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 4. update infor of user
        
        await pool.query("UPDATE admin_account SET username = $1, email = $2, password = $3, role = $4  WHERE email = $5", 
        [name, email_new, bcryptPassword, role, email_old]);

        return res.json({status : 'update successfull'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }


});

module.exports = router;


// ghi log phan dang nhap