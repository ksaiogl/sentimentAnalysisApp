'use strict';
var TAG = 'log4js.js';
var log4js = require('log4js');
var env = require('./env.js').env;
var fs = require('fs');
var os = require('os');

var instanceId = process.env.NODE_APP_INSTANCE ? process.env.NODE_APP_INSTANCE : '0';

var folderSuffix = os.hostname() + '-' + instanceId;

var logger_sp;
var logger_sup;
var logger_cus;

var log4jsEnv = {
    "prd":
        {
            "logDir": "/usr/NodeJslogs",
            "logLevel": "INFO",
            "maxLogSize": 10048576, //10MB
            "backups": 10
        },

    "stg":
        {
            "logDir": "/usr/NodeJslogs",
            "logLevel": "DEBUG",
            "maxLogSize": 10048576,
            "backups": 5
        },

    "dev":
        {
            "logDir": "/usr/NodeJslogs",
            "logLevel": "DEBUG",
            "maxLogSize": 10048576,
            "backups": 5
        },
    "loc":
        {
            "logDir": "/usr/NodeJslogs",
            "logLevel": "DEBUG",
            "maxLogSize": 10048576,
            "backups": 3
        }
};


var log4jsEnvParams = null;
if (env === 'prd') {
    log4jsEnvParams = log4jsEnv.prd;
} else if (env === 'stg') {
    log4jsEnvParams = log4jsEnv.stg;
} else if (env === 'dev') {
    log4jsEnvParams = log4jsEnv.dev;
} else if (env === 'demo') {
    log4jsEnvParams = log4jsEnv.demo;
} else {
    log4jsEnvParams = log4jsEnv.loc;
}

var logDir = log4jsEnvParams.logDir + '/' + folderSuffix;

var maxLogSize = log4jsEnvParams.maxLogSize;

var backups = log4jsEnvParams.backups;

var logLevel = log4jsEnvParams.logLevel;

var log4jsConfig = {

    "appenders": [
        {
            "type": "file",
            "filename": logDir + "/" + "serviceProvider.log",
            "maxLogSize": maxLogSize,
            "backups": backups,
            "category": "serviceProvider"
        },
        {
            "type": "file",
            "filename": logDir + "/" + "customer.log",
            "maxLogSize": maxLogSize,
            "backups": backups,
            "category": "customer"
        },
        {
            "type": "file",
            "filename": logDir + "/" + "supplier.log",
            "maxLogSize": maxLogSize,
            "backups": backups,
            "category": "supplier"
        }
    ]
};

function createLogDir(callback) {
    fs.exists(logDir, function (exists) {
        if (!(exists)) {
            fs.mkdir(logDir, function (err) {
                if (err) {
                    console.log("Log Directory Cannot be Created: " + logDir + "." + err);
                    throw new Error();
                } else {
                    callback(true, "Log Directory created: " + logDir);
                }
            });
        } else {
            callback(true, "Log Directory Exists: " + logDir);
        }
    });
}


//Configure logger_sp, logger_sup, logger_cus, logger_jobs
createLogDir(function (success, result) {

    if (success) {
        //Log for Service Provider.
        log4js.configure(log4jsConfig, {});

        logger_sp = log4js.getLogger("serviceProvider");
        logger_sp.setLevel(logLevel);
        exports.logger_sp = logger_sp;

        //Log for Supplier.
        logger_sup = log4js.getLogger("supplier");
        logger_sup.setLevel(logLevel);
        exports.logger_sup = logger_sup;

        //Log for customer.
        logger_cus = log4js.getLogger("customer");
        logger_cus.setLevel(logLevel);
        exports.logger_cus = logger_cus;
    }
});
