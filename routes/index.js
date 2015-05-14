var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ' });
});

// GET /quizes?search = "Texto" --> ? indica parámetro opcional
router.get('/quizes:search?', quizController.index);
router.get('/quizes/:quizId(\\d+)', quizController.show);
router.get('/quizes/:quizId(\\d+)/answer', quizController.answer);

router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES' });
});


module.exports = router;
