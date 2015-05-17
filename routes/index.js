var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');
var commentController = require('../controllers/comment_controller');
var sessionController = require('../controllers/session_controller');

/* GET paǵina de entrada (home page) . */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ', errors: []});
});

// Autoload de comandos con :quizId  
router.param('quizId', quizController.load); //autoload solo se invoca si lleva :quizId

// Definición de rutas de sesión
router.get('/login', sessionController.new); 		// formulario login
router.post('/login', sessionController.create); 	//crear sesión
router.get('/logout', sessionController.destroy);	//destruir sesión

// Definición de rutas de /quizes
router.get('/quizes:search?', quizController.index); // GET /quizes?search = "Texto" --> ? indica parámetro opcional
router.get('/quizes/:quizId(\\d+)', quizController.show);
router.get('/quizes/:quizId(\\d+)/answer', quizController.answer);
router.get('/quizes/new', quizController.new);
router.post('/quizes/create', quizController.create); //POST /quizes/create
router.get('/quizes/:quizId(\\d+)/edit', quizController.edit);
router.put('/quizes/:quizId(\\d+)', quizController.update);
router.delete('/quizes/:quizId(\\d+)', quizController.destroy);

// Definición de rutas de comentarios
router.get('/quizes/:quizId(\\d+)/comments/new', commentController.new); //Accede al formulario de crear comentario
router.post('/quizes/:quizId(\\d+)/comments', commentController.create); //Crea una entrada en la tabla de comentarios

router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES', errors: []});
});


module.exports = router;
