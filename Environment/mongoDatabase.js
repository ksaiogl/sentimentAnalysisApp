'use strict';
var TAG = 'mongoDatabase.js';
var mongoClient = require('mongodb').MongoClient;
var async = require('async');

var env = require('./env.js').env;
console.log(TAG + " " + "Deployment Environment is: " + env);

var dbConfig = {
    "prd":
        {
            "type": "replicaSet",
            "user": "",
            "pwd": "",
            "mongod": [],
            "database": "QriusDB"
        },
    "stg":
        {
            "type": "singleInstance",
            "user": "",
            "pwd": "",
            "mongod": [],
            "database": "QriusDB"
        },
    "dev":
        {
            "type": "singleInstance",
            "user": "",
            "pwd": "",
            "mongod": [],
            "database": "QriusDB"
        },
    "loc":
        {
            "type": "singleInstance",
            "user": "",
            "pwd": "",
            "mongod": ["127.0.0.1:27017"],
            "database": "QriusDB"
        }
};

var connParams = null;
if (env === 'prd') {
    connParams = dbConfig.prd;
} else if (env === 'stg') {
    connParams = dbConfig.stg;
} else if (env === 'dev') {
    connParams = dbConfig.dev;
} else {
    connParams = dbConfig.loc;
}
var mongod = connParams.mongod;

var databaseURL = null;
var mongoDbConn = null;

var hosts = null;
for (var i = 0; i < mongod.length; i++) {
    if (i === 0) {
        hosts = mongod[0];
    } else {
        hosts = hosts + ',' + mongod[i];
    }
}

var dbConnUrl = null;
var dbConnUrlSecondary = null;
if (!(connParams.user === "" && connParams.pwd === "")) {
    dbConnUrl = 'mongodb://' + connParams.user + ':' + connParams.pwd + '@' + hosts + '/' + connParams.database;
    dbConnUrlSecondary = 'mongodb://' + connParams.user + ':' + connParams.pwd + '@' + hosts + '/' + connParams.database + '?readPreference=secondaryPreferred';
    console.log(dbConnUrl);
} else {
    dbConnUrl = 'mongodb://' + hosts + '/' + connParams.database;
    dbConnUrlSecondary = 'mongodb://' + hosts + '/' + connParams.database + '?readPreference=secondaryPreferred';
}


exports.createMongoConn = function (callback) {
    async.parallel([
        function (asyncCallback) {
            mongoClient.connect(dbConnUrl, { poolSize: 10, connectTimeoutMS: 60000, socketTimeoutMS: 500000 }, function (err, database) {
                if (err) {
                    asyncCallback(err);
                } else {
                    console.log('Connection established to: ', dbConnUrl);
                    exports.mongoDbConn = database;
                    asyncCallback(false);
                }
            });
        },
        function (asyncCallback) {
            mongoClient.connect(dbConnUrlSecondary, { poolSize: 10, connectTimeoutMS: 60000, socketTimeoutMS: 500000 }, function (err, database) {
                if (err) {
                    asyncCallback(err);
                } else {
                    console.log('Connection established to: ', dbConnUrlSecondary);
                    exports.mongoDbConnSecondary = database;
                    asyncCallback(false);
                }
            });
        }
    ],
        function (err, results) {
            if (err) {
                console.log('Error connecting to DB. Err : \n' + err);
                callback(err);
            } else {
                console.log('DB connection successfull.');
                callback(false);
            }
        });
}