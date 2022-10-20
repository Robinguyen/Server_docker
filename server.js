const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 5000

//middleware

app.use(cors());
app.use(express.json());

//routes

// update data in postgresql

app.use("/authentication", require("./routes/jwtAuth"));

app.use("/team", require("./routes/team"));

app.use("/pilot", require("./routes/pilot"));

app.use("/aircaft", require("./routes/aircaft"));

app.use("/field", require("./routes/field"));

// function of software server

app.use("/real-time", require("./routes/realTime"));

//app.use("/real-time1", require("./routes/realTime_temp"));

app.use("/team-management", require("./routes/teamManagement"));

app.use("/field-management", require("./routes/fieldManagement"));

app.use("/aircaft-management", require("./routes/aircaftManagement"));

app.use("/realtime-monitor", require("./routes/realtime_monitor"));

app.use("/flightstatistics", require("./routes/flightStatistics"));
// route test

app.use("/test",require("./routes/test_real_time"));

app.get('/test', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is starting on port ${PORT}`);
});