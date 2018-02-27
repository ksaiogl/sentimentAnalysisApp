'use strict';
const express = require('express');
const router = express.Router();
const sa = require('./sa')

/* GET users listing. */
router.get('/getAcessToken', function (req, res) {
  sa.getAcessToken(req, (err, regres) => {
    res.statusCode = regres.http_code;
    res.json(regres);
  })
});


/* GET users listing. */
router.post('/getSentimentAnalysis', sa.isAuthenticated, function (req, res) {
  sa.getSentimentAnalysis(req, (err, regres) => {
    res.statusCode = regres.http_code;
    res.json(regres);
  })
});



module.exports = router;
