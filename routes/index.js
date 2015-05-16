var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ' });
});

// Autoload de comandos con :quizId  
router.param('quizId', quizController.load); //autoload solo se invoca si lleva :quizId

// GET /quizes?search = "Texto" --> ? indica parámetro opcional
router.get('/quizes:search?', quizController.index);
router.get('/quizes/:quizId(\\d+)', quizController.show); //No solo valores numéricos
router.get('/quizes/:quizId(\\d+)/answer', quizController.answer);

router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES' });
});


module.exports = router;
