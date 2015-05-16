var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ', errors: []});
});

// Autoload de comandos con :quizId  
router.param('quizId', quizController.load); //autoload solo se invoca si lleva :quizId

// Definición de rutas de /quizes
router.get('/quizes:search?', quizController.index); // GET /quizes?search = "Texto" --> ? indica parámetro opcional
router.get('/quizes/:quizId(\\d+)', quizController.show);
router.get('/quizes/:quizId(\\d+)/answer', quizController.answer);
router.get('/quizes/new', quizController.new);
router.post('/quizes/create', quizController.create); //POST /quizes/create
router.get('/quizes/:quizId(\\d+)/edit', quizController.edit);
router.put('/quizes/:quizId(\\d+)', quizController.update);
router.delete('/quizes/:quizId(\\d+)', quizController.destroy);

router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES', errors: []});
});


module.exports = router;
