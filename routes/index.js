var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ' });
});

router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES' });
});

module.exports = router;
