var sql = require("mssql");
//Initiallising connection string
var dbConfig = {
    user:  process.env.msSqlUser,
    password: process.env.msSqlPassword,
    server: process.env.msSqlServer,
	database: process.env.msSqlDatabase,
    port: process.env.msSqlPort,
    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};

module.exports = {
    executeQueryData: function(query){
        console.log('db server', process.env.msSqlServer); 
        return new Promise (function(resolve,reject){
            var conn = new sql.ConnectionPool(dbConfig)
            conn.connect().then(function(pool){
                    var req = new sql.Request(pool)
                    req.query(query).then(function(result){
                        resolve(result.recordset)
                        conn.close()
                    })
                    .catch(function(err){
                        reject(err)
                        console.log(err)
                        conn.close()
                    })
            })
            .catch(function(err){
                console.log('Error connection ' + err)
            })		
        })
    },
    executeQuery: function(res, query){	
        var conn = new sql.ConnectionPool(dbConfig)
        conn.connect().then(function(pool){
            var req = new sql.Request(pool)
            req.query(query).then(function(result){
                res.send(result.recordset)
                conn.close()
            })
            .catch(function(err){
                console.log("Error while querying database :- " + err);
                res.send(err)
                conn.close()
            })
        })
        .catch(function(err){
            console.log('Error connection ' + err)
        })	
    },
    executeQueryUpdate: function(res, query){
        return new Promise (function(resolve,reject){
            var conn = new sql.ConnectionPool(dbConfig)
            conn.connect().then(function(pool){
                    var req = new sql.Request(pool)
                    req.query(query).then(function(result){
                        //console.log(result.recordset)
                        resolve(result)
                        conn.close()
                    })
                    .catch(function(err){
                        reject(err)
                        console.log(err)
                        conn.close()
                    })
            })
            .catch(function(err){
                console.log('Error connection ' + err)
            })		
        })
    }
}