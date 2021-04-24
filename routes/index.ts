// var express = require('express');
import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// importでもrequire()でも読み込めるように2種類export
module.exports = router;
export default router;
