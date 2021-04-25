// var express = require('express');
import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { uid: (req.user as any ).username });
});

// importでもrequire()でも読み込めるように2種類expor
// module.exports = router;
export default router;
