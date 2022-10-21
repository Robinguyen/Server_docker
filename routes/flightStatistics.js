const router = require("express").Router();
const authorize = require("../middleware/authorization");
const pool = require("../db");
var replaceAll = require("replaceall");
/*router server flight_statistics */
var set_page = 0;
var search_total= [];
var check_std="null", check_end="null", check_ten="null", check_ana="null", check_mod="null", check_loc = "null", check_spr="false", check_spe="false", check_acc="null", check_are="null";
var realtime_name = [];
var total_result = [];
var text_search  = "";
router.post('/search-statistics/home', async(req, res)=>{
	try{
	search_total=[];
	realtime_name=[];
	var union = 'SELECT COUNT(fdua) as rtid, SUM(area) as area , extract(HOUR FROM (sum(fdua::time))) + ROUND(coalesce(extract(minutes FROM (sum(fdua::time)))/60)::numeric, 2) as time FROM ( ';
	const get_nameTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name like 'rt_%';");
	for (const value in get_nameTable.rows) {
		const check_realtime = await pool.query(`SELECT realtime_id FROM ${get_nameTable.rows[value].table_name} WHERE landing_time is not null LIMIT 1;`);
		if (check_realtime.rows.length != 0) {
			realtime_name.push(get_nameTable.rows[value].table_name);
		}
	}
	for (const value in realtime_name) {
		if (value == realtime_name.length - 1) {
			union += `SELECT coalesce((area::numeric)) as area, flight_duaration::time as fdua FROM ${realtime_name[value]} WHERE 
			landing_time is not null) as t;`;
			break;
		}
		union += `SELECT coalesce((area::numeric)) as area, flight_duaration::time as fdua FROM ${realtime_name[value]} WHERE 
		landing_time is not null UNION ALL `;
	}
	const get_data = await pool.query(union);
	search_total.push(
		{ topa: parseInt(get_data.rows[0].rtid) },
		{ page: Math.ceil(get_data.rows[0].rtid / 10) },
		{
			tare: Math.round(parseFloat(get_data.rows[0].area) * 100) / 100,
		},
		{ tfdu: parseFloat(get_data.rows[0].time) },
		{ tfli: parseInt(get_data.rows[0].rtid) },
	);

	return res.status(200).send(search_total);
}catch(error){
	return res.status(401).send("Server Error");
}
});
router.post('/search-statistics', async (req, res) => {
	try {
		var union = 'SELECT COUNT(fdua) as rtid, SUM(area) as area , extract(HOUR FROM (sum(fdua::time))) + ROUND(coalesce(extract(minutes FROM (sum(fdua::time)))/60)::numeric, 2) as time FROM ( ';
		//var union="";
		var union_data = ''; // query string
		const { start_date, end_date, team_name, aircaft_name, mode, location, spraying, spreading, account, area, page, sepage } = req.body;
		//1.cget all table name with 'rt_'
		//2. check value request json
		if (start_date == 'null' && end_date == 'null' && team_name == 'null' && aircaft_name == 'null' && mode == 'null' && location == 'null' && spraying == 'false' &&
			spreading == 'false' && account == 'null' && area == 'null') 
		{
			try {
				//2.1. query string scan column
				if (page == 'null') {
					//2.4. get data rows data
					//2.4.1. get page number
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name,  
							coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
							method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN 
							flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE landing_time is not null ORDER BY time DESC LIMIT ${sepage};`;
							break;
						}
						union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name,  
						coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
						method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN 
						flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE  landing_time is not null UNION ALL `;
					}
					//2.4.2. query get rows data
					const get_rowsData = await pool.query(union_data);
					if( set_page!=sepage || check_std!= start_date || check_end!=end_date || check_acc!=account || check_mod != mode || check_spr!=spraying || 
						check_spe!= spreading || check_are!= area || check_ten!= team_name || check_ana!= aircaft_name || check_loc!=location){
						set_page=sepage;
						total_result=[];
						check_acc = account; check_std = start_date; check_end = end_date; check_mod = mode; check_spr = spraying; check_spe  = spreading; check_are = area;
						check_ten = team_name; check_ana = aircaft_name; check_loc = location;
						total_result.push(
							{ topa: parseInt(search_total[0].topa) },
							{ page: Math.ceil(search_total[0].topa / sepage) },
							{
								tare: Math.round(parseFloat(search_total[2].tare) * 100) / 100,
							},
							{ tfdu: parseFloat(search_total[3].tfdu) },
							{ tfli: parseInt(search_total[4].tfli) },
						);
					}
					for (const value in total_result) {
						get_rowsData.rows.push(total_result[value]);
					}
					return res.send(get_rowsData.rows);
				}else {
					//2.4.1.scan data
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
							coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
							method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN
							flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) using (pilot_id) WHERE landing_time is not null ORDER BY time DESC 
							LIMIT ${sepage} OFFSET ${page * sepage - sepage};`;
							break;
						}
						union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
						coalesce((area::numeric)) as area, flight_duaration::time as fdua,  pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
						method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN 
						flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) where landing_time is not null UNION ALL `;
					}
					//2.4.2. query get rows data
					const get_rowsData = await pool.query(union_data);
					for (const value in total_result) {
						get_rowsData.rows.push(total_result[value]);
					}
					return res.send(get_rowsData.rows);
				}
			} catch (error) {
				console.error(error);
				return res.status(401).send('Error Data');
			}
		}
		//value check data
		else 
		{
			//2.1. variable
			var val_query = ''; // variable using SELECT
			var data_check = []; // variable push data from req.body
			var dataType = []; // variable using push all data !null
			var check_date = ''; // check query start date and end date
			var method_name = 'null';
			const datacheck = ['team.name', 'aircaft.aircaft_name', 'pilot.username'];
			var data_checktable = [];
			var check_table = [];
			var table_name = [];
			//const data = ['team.name', 'aircaft.aircaft_name', 'flight_mode.flightmode_name', 'location', 'method_type.method_name', 'pilot.username', 'area'];
			const data = ['flight_mode.flightmode_name', 'location', 'method_type.method_name', 'pilot.username', 'area'];
			var value_query = '';
			//2.2. check sparing value;
			//get aircaft name from search
			data_checktable.push(team_name, aircaft_name, account);
			for(let i in data_checktable){
				if(data_checktable[i] != 'null'){
					check_table.push(datacheck [i] + " = " + `'${data_checktable[i]}'`) 
				}
			}
			if(check_table.length>0){
				value_query = 'WHERE '
				if(check_table.length==1){
					value_query += check_table[0];
				}
				else{
					for(let i in check_table){
						if (i == check_table.length - 1) {
							value_query += check_table[i] + ' ';
							break;
						}
						value_query += check_table[i] + ' AND ';
					}
				}

			}
			
			if ((spreading == 'true' && spraying == 'true') || (spreading == 'false' && spraying == 'false')) {
				method_name = 'null';
			} else {
				switch (spraying) {
					case 'true':
						method_name = 'spraying';
						break;
				}
				//check spreading
				switch (spreading) {
					case 'true':
						method_name = 'spreading';
						break;
				}
			}
			//2.3. check start date
			if (start_date != 'null' && end_date != 'null') {
				check_date = 'take_of_time::date >=' + `'${start_date}'` + ' AND take_of_time::date <=' + `'${end_date}'`;
				dataType.push(check_date);
			}
			//2.4.check data request
			data_check.push( mode, location, method_name, account, area);
			for (let value in data_check) {
				if (data_check[value] != 'null') {
					dataType.push(data[value] + '=' + `'${data_check[value]}'`);
				}
			}
			//2.5. check value SELECT
			if (dataType.length == 1) {
				val_query += dataType[0] + " AND ";
			} else {
				for (let val in dataType) {
					if (val == dataType.length - 1) {
						val_query += dataType[val] + " AND ";
						break;
					}
					val_query += dataType[val] + ' AND ';
				}
			}
			//get table realtime 
			const get_aircaft_id = await pool.query(`SELECT DISTINCT aircaft_id FROM (aircaft NATURAL JOIN (team NATURAL JOIN pilot)) ${value_query};`);
            for(var value of get_aircaft_id.rows){
				table_name.push("rt_" + (value.aircaft_id).replaceAll('-', '_'));
			}
			//2.6. get data search
			try {
				//2.1. query string scan column
				if(set_page!=sepage || check_std!= start_date || check_end!=end_date || check_acc!=account || check_mod != mode || check_spr!=spraying || 
					check_spe!= spreading || check_are!= area || check_ten!= team_name || check_ana!= aircaft_name || check_loc!=location){
					total_result=[];
					
					for (const value in table_name) {
						if (value == table_name.length - 1) {
							union += `SELECT area, flight_duaration::time as fdua FROM(((${table_name[value]} NATURAL JOIN method_type) 
							NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query}  landing_time is not null) as t;`;
							break;
						}
						union += `SELECT area, flight_duaration::time as fdua FROM(((${table_name[value]} NATURAL JOIN method_type) NATURAL JOIN
						flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query} landing_time is not null UNION ALL `;
					}
					const get_data = await pool.query(union);
					set_page=sepage;
					check_acc = account; check_std = start_date; check_end = end_date; check_mod = mode; check_spr = spraying; check_spe  = spreading; check_are = area;
					check_ten = team_name; check_ana = aircaft_name; check_loc = location;
					total_result.push(
						{ topa: parseInt(get_data.rows[0].rtid) },
						{ page: Math.ceil(get_data.rows[0].rtid / sepage) },
						{
							tare: Math.round(parseFloat(get_data.rows[0].area) * 100) / 100,
						},
						{ tfdu: parseFloat(get_data.rows[0].time) },
						{ tfli: parseInt(get_data.rows[0].rtid) },
					);
				}

				//2.6.4.load data from table
				if (page == 'null') {
					for (const value in table_name) {
						if (value == table_name.length - 1) {
							union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
							coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
							method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${table_name[value]} NATURAL JOIN method_type) NATURAL JOIN
							flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query} landing_time is not null ORDER BY time
							DESC LIMIT ${sepage};`;
							break;
						}
						union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
						coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
						method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${table_name[value]} NATURAL JOIN method_type) NATURAL JOIN 
						flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query}  landing_time is not null UNION ALL `;
					}
					const get_rowDatasearch = await pool.query(`${union_data}`);
					for (const value in total_result) {
						get_rowDatasearch.rows.push(total_result[value]);
					}
					return res.status(200).send(get_rowDatasearch.rows);
				} else {
					for (const value in table_name) {
						if (value == table_name.length - 1) {
							union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name,
							coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
							method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${table_name[value]} NATURAL JOIN method_type) NATURAL JOIN
							flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query} landing_time is not null ORDER BY time
							DESC LIMIT ${sepage} OFFSET ${page * sepage - sepage};`;
							break;
						}
						union_data += `SELECT CONCAT(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
						coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,
						method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid FROM(((${table_name[value]} NATURAL JOIN method_type) NATURAL JOIN
						flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE ${val_query}  landing_time is not null UNION ALL `;
					}
					const get_rowDatasearch = await pool.query(union_data);
					for (const value in total_result) {
						get_rowDatasearch.rows.push(total_result[value]);
					}
					return res.status(200).send(get_rowDatasearch.rows);
				}
			} catch (error) {
				console.error(error);
				return res.status(401).send('Error search');
			}
		}
	} catch (error) {
		console.error(error);
		return res.status(401).send('Server Error');
	}
});
//get statistics search

router.post('/get-statistics', async (req, res) => {
	var union = 'SELECT COUNT(fdua) as rtid, COALESCE(SUM(area),0) as area, extract(HOUR FROM (sum(fdua::time))) + ROUND(coalesce(extract(minutes FROM (sum(fdua::time)))/60)::numeric, 2) as time from (',
		union_data = ''; // query string
	const { text, page, sepage } = req.body;
	try {
		if (text == 'null') {
			try {
				//2.4. get data rows data
				if (page == '1') {
					//2.4.1. get page number
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, coalesce((area::numeric)) as area, 
							flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod, method_type.method_name as mtna, realtime_id as rtid, 
							aircaft_id as arid from(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) 
                            join (pilot NATURAL JOIN team) using (pilot_id) where landing_time is not null order by time DESC LIMIT ${sepage};`;
							break;
						}
						union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, coalesce((area::numeric)) as area, 
						flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod, method_type.method_name as mtna, realtime_id as rtid, 
						aircaft_id as arid from(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) 
                        NATURAL JOIN aircaft) join (pilot NATURAL JOIN team) using (pilot_id) where landing_time is not null union all `;
					}
					//2.4.1. query get rows data
				}else{
					//2.4.1.scan data
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, coalesce((area::numeric)) as area, 
							flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod, method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid from(((${
								realtime_name[value]
							} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) 
                            join (pilot NATURAL JOIN team) using (pilot_id) where landing_time is not null order by time DESC LIMIT ${sepage} OFFSET ${page * sepage - sepage};`;
							break;
						}
						union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name,  coalesce((area::numeric)) as area, flight_duaration::time as fdua, 
                        pilot.username as unam, team.name as tnam, flight_mode.flightmode_name as fmod,  method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid 
						from(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) 
                        NATURAL JOIN aircaft) join (pilot NATURAL JOIN team) using (pilot_id) where landing_time is not null union all `;
					}
				}
				const get_rowsData = await pool.query(union_data);
				
				if(set_page!=sepage){
						total_result=[];
						set_page =sepage;
						total_result.push(
							{ topa: parseInt(search_total[0].topa) },
							{ page: Math.ceil(search_total[0].topa / sepage) },
							{
								tare: Math.round(parseFloat(search_total[2].tare) * 100) / 100,
							},
							{ tfdu: parseFloat(search_total[3].tfdu) },
							{ tfli: parseInt(search_total[4].tfli) },
						);
				}
				//2.4.2. add object element in data
				for (const value in total_result) {
					get_rowsData.rows.push(total_result[value]);
				}
				return res.status(200).send(get_rowsData.rows);
			} catch (error) {
				console.error(error);
				return res.status(401).send('Error Data');
			}
		} else {
			try {
				if (page ==1) {
                    
					//2.1. query string scan column
					if (set_page != sepage|| text_search != text) {
						total_result = [];
						for (const value in realtime_name) {
							if (value == realtime_name.length - 1) {
								union += `SELECT realtime_id, coalesce((area::numeric)) as area, flight_duaration::time as fdua FROM((((${realtime_name[value]} 
                                        NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id)) 
                                        WHERE (location like '%${text}%' OR pilot.username like '%${text}%' OR team.name like '%${text}%' OR aircaft.aircaft_name 
                                        like '%${text}%' OR area::text like '%${text}%') AND landing_time is not null) as t;`;
								break;
							}
							union += `SELECT realtime_id, coalesce((area::numeric)) as area, flight_duaration::time as fdua from((((${realtime_name[value]} 
                                NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) join (pilot NATURAL JOIN team) using (pilot_id)) 
                                WHERE (location like '%${text}%' OR pilot.username like '%${text}%' OR team.name like '%${text}%' OR aircaft.aircaft_name like '%${text}%' 
                                OR area::text like '%${text}%') AND landing_time is not null UNION ALL `;
						}
                     
						const get_data = await pool.query(union);
                     
						set_page= sepage;
						text_search=text;
						total_result.push(
							{ topa: parseInt(get_data.rows[0].rtid) },
							{ page: Math.ceil(get_data.rows[0].rtid / sepage) },
							{ tare: Math.round(get_data.rows[0].area * 100) / 100 },
							{ tfdu: parseFloat(get_data.rows[0].time) },
							{ tfli: parseInt(get_data.rows[0].rtid) },
						);
                        
					}
					//2.4. get data rows data
					//2.4.1. get page number
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
                                            coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, 
                                            flight_mode.flightmode_name as fmod, method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid 
                                            FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) 
                                            JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE (location like '%${text}%' OR pilot.username like '%${text}%' OR 
                                            team.name like '%${text}%' OR aircaft.aircaft_name like '%${text}%' OR area::text like '%${text}%') AND 
                                            landing_time is not null ORDER BY time DESC LIMIT ${sepage} OFFSET 0;`;
							break;
						}
						union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
                                        coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, 
                                        flight_mode.flightmode_name as fmod,  method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid 
                                        FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) 
                                        NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE (location like '%${text}%' OR 
                                        pilot.username like '%${text}%' OR team.name like '%${text}%' OR aircaft.aircaft_name like '%${text}%' OR 
                                        area::text like '%${text}%') AND landing_time is not null UNION ALL `;
					}
				} else {
					//2.4.1.scan data
					for (const value in realtime_name) {
						if (value == realtime_name.length - 1) {
							union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
                                            coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam,team.name as tnam, 
                                            flight_mode.flightmode_name as fmod,  method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid 
                                            FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) NATURAL JOIN aircaft) 
                                            JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE  (location like '%${text}%' OR pilot.username like '%${text}%' OR 
                                            team.name like '%${text}%' OR aircaft.aircaft_name like '%${text}%' OR area::text like '%${text}%') AND 
                                            landing_time is not null ORDER BY time DESC LIMIT ${sepage} OFFSET ${page * sepage - sepage} ;`;
							break;
						}
						union_data += `SELECT concat(take_of_time, '-',landing_time::time) as time, location as loca, null as fiel, aircaft.aircaft_name as name, 
                                        coalesce((area::numeric)) as area, flight_duaration::time as fdua, pilot.username as unam, team.name as tnam, 
                                        flight_mode.flightmode_name as fmod, method_type.method_name as mtna, realtime_id as rtid, aircaft_id as arid 
                                        FROM(((${realtime_name[value]} NATURAL JOIN method_type) NATURAL JOIN  flight_mode) 
                                        NATURAL JOIN aircaft) JOIN (pilot NATURAL JOIN team) USING (pilot_id) WHERE (location like '%${text}%' OR 
                                        pilot.username like '%${text}%' OR team.name like '%${text}%' OR aircaft.aircaft_name like '%${text}%' OR area::text 
                                        like '%${text}%') AND landing_time is not null UNION ALL `;
					}
				}
				const get_rowsData = await pool.query(union_data);
				for (const value in total_result) {
					get_rowsData.rows.push(total_result[value]);
				}
				return res.status(200).send(get_rowsData.rows);
			} catch (error) {
				console.error(error);
				return res.status(401).send('Error Data');
			}
		}
	} catch (error) {
		console.error(error);
		return res.status(401).send('Server Error');
	}
});

//******return team, pilot, aicaft */

router.post("/info-team", async (req, res)=>{
    try {
		var airn = [];
		var tnam = [];
		var unam = [""];
		var status = 0;
		var return_data = [];
		check_teamName = "null";
		check_aircaftName  = "null";
		check_userName = "null";
        const {t_name, p_name, a_name} = req.body;
        var data_query = " ";
        if(t_name != 'null'){
            data_query += `team.name = '${t_name}' `;
        }
        else if(p_name != 'null'){
            data_query += `pilot.username = '${p_name}' `;
        }
        else{
            data_query += `aircaft_name = '${a_name}' `;
        }
        
        const data = await pool.query(`SELECT aircaft_name as airc, team.name as name, pilot.username as user FROM (aircaft NATURAL JOIN (team NATURAL JOIN pilot)) WHERE ${data_query};`);
		for(let i in data.rows){
			
			if(data.rows[i].airc != check_aircaftName){
				
				airn.push(data.rows[i].airc);
				check_aircaftName = data.rows[i].airc;
			}
		}
		for(let i in data.rows){
			if(data.rows[i].name != check_teamName){
				tnam.push(data.rows[i].name);
				check_teamName = data.rows[i].name;
			}
		}
		
		for(let i in data.rows){
			
			for(let val in unam){
				if(data.rows[i].user == unam[val]){
					continue;
				}
				else{
					status++;
				}
			}
			if(status==unam.length){
				unam.push(data.rows[i].user)
				status=0;
			}
		}
		unam.shift();
		return_data.push(airn, tnam, unam)
		//console.log(return_data)
		console.log(return_data)
        return res.status(200).send(return_data)
            
    } catch (error) {
        return res.status(401).send(error);
    }

})
module.exports = router;

////// -------------------------- truyen dev ------------------------\

router.post("/get-data-combobox", async(req, res) =>{
    try {
        const {message} = req.body;
        if(message == "data-combobox")
        {
            const all = await pool.query(`SELECT team.name as r_te , pilot.username as r_pi, aircaft_name as r_nm 
                                         FROM team natural join aircaft natural join pilot ORDER BY team.name ASC;`);
            const mode = await pool.query(`SELECT flightmode_name as m_mo FROM flight_mode ORDER BY flightmode_name ASC`);
            const allaircaft = await pool.query(`SELECT aircaft_name as a_nm FROM aircaft ORDER BY aircaft_name ASC;`);
            const allteam = await pool.query(`SELECT name as t_te FROM team ORDER BY name ASC;`);
            const allpilot = await pool.query(`SELECT username as p_pi FROM pilot ORDER BY username ASC;`);

            return res.status(200).json({rela : all.rows,                                          
                                        team : allteam.rows, 
                                        pilo : allpilot.rows,
                                        name: allaircaft.rows,
                                        mode : mode.rows});
        }
        else
        {
            return res.send("Server error 0x11");
        }
    } catch (error) {
        console.log(error.message);
        return res.status(401).send("Server error 0x10");
    }
})

module.exports = router;