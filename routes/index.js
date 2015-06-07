var express = require('express');
var multer = require('multer');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');
var commentController = require('../controllers/comment_controller');
var sessionController = require('../controllers/session_controller');
var userController = require('../controllers/user_controller');
var favouritesController = require('../controllers/favourites_controller');

/* GET paǵina de entrada (home page) . */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'QUIZ', errors: []});
});

// Autoload de comandos con :quizId  
router.param('quizId', quizController.load); //autoload solo se invoca si lleva :quizId
router.param('commentId', commentController.load); 	// autoload :commentId
router.param('userId', userController.load);  // autoload :userId

// Definición de rutas de sesión
router.get('/login', sessionController.new); 		//formulario login
router.post('/login', sessionController.create); 	//crear sesión
router.get('/logout', sessionController.destroy);	//destruir sesión

// Definición de rutas de cuenta de usuario
router.get('/user', userController.new);		//formulario sign in
router.post('/user', userController.create);	//registrar usuario
router.get('/user/:userId(\\d+)/edit',  sessionController.loginRequired, userController.ownershipRequired, userController.edit);     // editar información de cuenta
router.put('/user/:userId(\\d+)',  sessionController.loginRequired, userController.ownershipRequired, userController.update);     // actualizar información de cuenta
router.delete('/user/:userId(\\d+)',  sessionController.loginRequired, userController.ownershipRequired, userController.destroy);     // borrar cuenta
router.get('/user/:userId(\\d+)/quizes', quizController.index); 	//ver las preguntas creadas por el usuario
// Definición de rutas para la gestión de usuarios por parte del administrador
router.get('/user/all', sessionController.loginRequired, userController.privilegesRequired, userController.all);
router.put('/user/:userId(\\d+)/up', sessionController.loginRequired, userController.adminRequired, userController.up);
router.put('/user/:userId(\\d+)/down', sessionController.loginRequired, userController.adminRequired, userController.down);
// Definición de rutas para la gestión de favoritos
router.get('/user/:userId(\\d+)/favourites', favouritesController.index ); //Listar preguntas favoritas del usuario
router.put('/user/:userId(\\d+)/favourites/:quizId(\\d+)', sessionController.loginRequired, favouritesController.add); //Marcar quiz como favorito
router.delete('/user/:userId(\\d+)/favourites/:quizId(\\d+)', sessionController.loginRequired, favouritesController.remove); //Desmarcar quiz como favorito

// Definición de rutas de /quizes
router.get('/quizes:search?', quizController.index); // GET /quizes?search = "Texto" --> ? indica parámetro opcional
router.get('/quizes/:quizId(\\d+)', quizController.show);
router.get('/quizes/:quizId(\\d+)/answer', quizController.answer);
router.get('/quizes/new', sessionController.loginRequired, quizController.new);
router.post('/quizes/create', sessionController.loginRequired, multer({ dest: './public/media/'}), quizController.create); //POST /quizes/create
router.get('/quizes/:quizId(\\d+)/edit', sessionController.loginRequired, quizController.ownershipRequired, quizController.edit);
router.put('/quizes/:quizId(\\d+)', sessionController.loginRequired, quizController.ownershipRequired, multer({ dest: './public/media/'}), quizController.update);
router.delete('/quizes/:quizId(\\d+)', sessionController.loginRequired, quizController.ownershipRequired, quizController.destroy);
router.get('/quizes/statistics', quizController.statistics);
//Añadiendo sessionController.loginRequired se impide que usuarios sin sesión accedan
//ownership required es un MW que comprueba si el usuario que accede tiene derechos para realizar la operación

// Definición de rutas de comentarios
router.get('/quizes/:quizId(\\d+)/comments/new', commentController.new); //Accede al formulario de crear comentario
router.post('/quizes/:quizId(\\d+)/comments', commentController.create); //Crea una entrada en la tabla de comentarios
router.get('/quizes/:quizId(\\d+)/comments/:commentId(\\d+)/publish', sessionController.loginRequired, commentController.ownershipRequired, commentController.publish);
router.delete('/quizes/:quizId(\\d+)/comments/:commentId(\\d+)', sessionController.loginRequired, commentController.ownershipRequired, commentController.destroy);

// Definición de rutas de la página de autores
router.get('/authors', function(req, res, next) {
  res.render('authors', { title: 'AUTORES', errors: []});
});


module.exports = router;
