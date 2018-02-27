'use strict';
const TAG = "SentimentAnalysis.js -  ";
const log = require('../Environment/log4js.js');
const dbConfig = require('../Environment/mongoDatabase.js');

// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// console.log("env.GOOGLE_APPLICATION_CREDENTIALS: ", env.GOOGLE_APPLICATION_CREDENTIALS);
// Instantiates a client
const client = new language.LanguageServiceClient({
    keyFilename: '/home/sairohith/Desktop/ra/Semantic_Analysis_Project-3abcad56a7ba.json'
    // keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS
});
const _ = require('underscore');
var V = require('jsonschema').Validator;
var validator = new V();
var inputSchemas = require('./util/validation');
var jwt = require('jsonwebtoken');


exports.getSentimentAnalysis = (req, callback) => {

    console.log("inside ---------");

    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(ip + " " + TAG + "Inside getSentimentAnalysis");
    logger.info(ip + " " + TAG + "Input body: " + JSON.stringify(req.body));

    if (req && req.body && Array.isArray(req.body.statements) && req.body.statements.length > 0) {
        getData(req)
            .then(getNonExistentData)
            .then(getSentimentAnalysisForData)
            .then((d) => { return insertNewData(req, d) })
            .then((req) => {
                console.log("req.body 1 :", JSON.stringify(req.body));
                return formResponse(req)
            })
            .then(data => {
                callback(false, outputResult(data))
            })
            .catch(err => {
                if ("http_code" in err && "message" in err) {
                    return callback(true, err);
                } else {
                    logger.error(TAG + "error getting Sentiment Analysis,err1: " + err)
                    logger.error(TAG + "error getting Sentiment Analysis,err2: " + err.stack)
                    return callback(true, internalServerError());
                }
            });
    } else {
        logger.error(TAG + "Bad or ill-formed request");
        return callback(true, badFormat("Statements is mandatory and must be a non-empty array"));
    }
}

exports.getAcessToken = (req, callback) => {

    console.log("inside ---------");

    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(ip + " " + TAG + "Inside getAcessToken");
    logger.info(ip + " " + TAG + "Input body: " + JSON.stringify(req.query));

    if (req && req.query && req.query.username && typeof req.query.username == 'string' && req.query.username.length > 0) {

        var token = jwt.sign(req.query, "samplesecret");
        db.collection('sa').findOne({ 'username': req.query.username }).then(res => {
            if (!res) {
                db.collection('sa').insert({
                    'username': req.query.username, "apiAccessKey": token,
                    "statements": []
                }).then(res => {
                    callback(false, outputResult(token))
                }).catch(err => {
                    console.log(err.stack);
                    callback(true, internalServerError())
                })
            } else {
                callback(true, badFormat('user already exists'))
            }
        }).catch(err => {
            callback(true, internalServerError())
        })
    } else {
        logger.error(TAG + "Bad or ill-formed request");
        return callback(true, badFormat("UserNmae is mandatory and must be a string"));
    }
}

exports.isAuthenticated = (req, res, next) => {
    console.log("inside isAuthenticated");

    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(ip + " " + TAG + "Inside getAcessToken");
    logger.info(ip + " " + TAG + "Input body: " + JSON.stringify(req.query));
    // console.log(req.headers);
    if (req && req.headers && req.headers['authorization'] && req.headers['authorization'].split(' ')[1]) {
        req.body.key = req.headers['authorization'].split(' ')[1];
        console.log(req.body.key);
        jwt.verify(req.body.key, "samplesecret", (err, decod) => {
            if (!err) {
                console.log("decoded: ", decod);
                db.collection('sa').findOne({ 'username': decod }).then(res => {
                    if (!res) {
                        console.log("autheniacted");
                        return next();
                    } else {
                        console.log("not autheniacted");
                        var regres = {
                            "http_code": 401,
                            "message": "Invalid Access Token"
                        };
                        res.statusCode = regres.http_code;
                        res.json(regres);
                    }
                }).catch(err => {
                    console.log("err1: ", err.stack);
                    var regres = {
                        "http_code": 500,
                        "message": "Internal server error"
                    };
                    res.statusCode = regres.http_code;
                    res.json(regres);
                })
            } else {
                console.log("err2: ", err.stack);
                var regres = {
                    "http_code": 403,
                    "message": "Invalid acess token"
                };
                res.statusCode = regres.http_code;
                res.json(regres);
            }
        })
    }
}

const validateInputBody = (req) => {
    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(ip + " " + TAG + "Inside getData");
    console.log({ 'apiAccessKey': req.body.key });
    db.collection('sa').findOne({ 'apiAccessKey': req.body.key }).then(res => console.log("res", JSON.stringify(res)));
    return new Promise((resolve, reject) => {
        if (req && !req.body.statements) {
            reject(badFormat("Bad or ill-formed request,statements is mandatory"))
        } else if (req && !req.body.statements && !Array.isArray(req.body.statements)) {
            reject(badFormat("Bad or ill-formed request,statements must be a array"))
        } else if (req && !req.body.statements && Array.isArray(req.body.statements) && req.body.statements.length == 0) {
            reject(badFormat("Bad or ill-formed request,statements must be a array and should not be empty"))
        } else {
            resolve(req)
        }
    })
}

const getData = (req) => {

    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(ip + " " + TAG + "Inside getData");
    console.log({ 'apiAccessKey': req.body.key });
    db.collection('sa').findOne({ 'apiAccessKey': req.body.key }).then(res => console.log("res", JSON.stringify(res)));
    return new Promise((resolve, reject) => {
        db.collection('sa').findOne({ 'apiAccessKey': req.body.key }).then(res => {
            if (res) {
                logger.info(TAG, "Successfully fetched data from Mongo")
                console.log("res: ", JSON.stringify(res));
                req.body.data = res
                resolve(req)
            } else {
                logger.error(TAG, "No data found")
                reject(inputDontMatch())
            }
        }).catch(err => {
            logger.error(TAG, "Error getting data from mongo,err: ", err.stack)
            reject(internalServerError())
        })
    })
};
const getNonExistentData = (req) => {

    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(TAG + "Inside getNonExistentData");
    let existingData = [];
    let existingStatements = [];
    let newStatements = [];

    return new Promise((resolve, reject) => {

        _.map(req.body.data.statements, obj => {
            if (req.body.statements.indexOf(obj.statement) !== -1) {
                console.log("111111111");
                console.log(new Date() - new Date(obj.timeStamp));
                console.log(3600 * 1000);
                console.log((new Date() - new Date(obj.timeStamp)) < (3600 * 1000));
                if ((new Date() - new Date(obj.timeStamp)) < (3600 * 1000)) {
                    console.log("2222222222");
                    obj.status = 'Old Message'
                }
                existingData.push(obj)
                existingStatements.push(obj.statement)
            }
        })
        newStatements = _.difference(req.body.statements, existingStatements);
        req.body.existingData = existingData
        req.body.existingStatements = existingStatements
        req.body.newStatements = newStatements
        console.log("req.body: ", JSON.stringify(req.body));
        resolve(req)
    })
};
const getSentimentAnalysisForData = (req) => {
    return Promise.all(req.body.newStatements.map((text) => {
        return new Promise((resolve, reject) => {
            const document = {
                content: text,
                type: 'PLAIN_TEXT',
            };
            // Detects the sentiment of the text
            client
                .analyzeSentiment({ document: document })
                .then(results => {
                    const sentiment = results[0].documentSentiment;

                    console.log(`Text: ${text}`);
                    console.log(`Sentiment score: ${sentiment.score}`);
                    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);

                    resolve({
                        "statement": text,
                        "sentimentScore": sentiment.score,
                        "sentimentMagnitude": sentiment.magnitude,
                        "timeStamp": new Date()
                    })
                })
                .catch(err => {
                    console.error('ERROR:', err);
                    reject(internalServerError())
                });
        });
    }));
};

const insertNewData = (req, NewData) => {

    const db = dbConfig.mongoDbConn;
    const logger = log.logger_cus;
    logger.info(TAG + "Inside insertNewData");
    console.log("new data: ", NewData);
    return new Promise((resolve, reject) => {

        db.collection('sa').update({ 'apiAccessKey': req.body.key }, {
            $push: {
                "statements": {
                    $each: NewData,
                    $sort: {
                        "timeStamp": -1
                    }
                }
            }
        }).then(res => {
            logger.info(TAG, "Successfully inserted data into Mongo")
            req.body.NewData = NewData;
            resolve(req)
        }).catch(err => {
            logger.error(TAG, "Error getting data from mongo,err: ", err.stack)
            reject(internalServerError())
        })
    })
}

const formResponse = (req) => {
    return new Promise((resolve, reject) => {
        const logger = log.logger_cus;
        logger.info(TAG + "Inside formData");

        // oldData = _.map(oldData, obj => {
        //     obj.status = 'Old Message'
        // })
        // newData = _.map(newData, obj => {
        //     obj.status = 'New Message'
        // })
        console.log("req.body 3: ", JSON.stringify(req.body));
        let finalData = req.body.existingData.concat(req.body.NewData);
        resolve(finalData)
    })
};

const badFormat = (errors) => {
    const result = {
        "http_code": "400",
        "message": "Bad or ill-formed request..",
        "errors": errors
    };
    return result;
};

const inputDontMatch = () => {
    const result = {
        "http_code": "404",
        "message": "The inputs does not match with our records..Please retry.."
    };
    return result;
};

const internalServerError = () => {
    const result = {
        "http_code": "500",
        "message": "Internal Server Error..Please retry.."
    };
    return result;
};

const outputResult = (result) => {
    const resJson = {
        "http_code": "200",
        "message": result
    };
    return resJson;
};

const makeResult = (statusCode, message) => {
    const result = {
        "http_code": statusCode,
        "message": message
    };
    return result;
};



