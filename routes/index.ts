// var express = require('express');
import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(JSON.stringify(req.user, null,  '  '));
  res.render('index', { uid: (req?.user as any )?.nameID });
});

// importでもrequire()でも読み込めるように2種類expor
module.exports = router;
export default router;
