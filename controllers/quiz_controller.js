// El controlador importa el modelo para poder acceder a la base de datos

var models = require('../models/models.js');

// Autoload - factoriza el código si la ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.find(quizId).then(
		function(quiz) {
			if (quiz) {
				req.quiz = quiz;
				next();
			} else {
				next(new Error('No existe quizId=' + quizId));
			}
		}
	).catch(function(error) {next(error);});
}


//GET /quizes/:id -> Solo si existe el id llega aquí
exports.show = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
		res.render('quizes/show', {quiz: req.quiz}); 
	})
};

//GET /quizes/:id/answer -> Solo si existe el id llega aquí
exports.answer = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
		if (req.query.respuesta === req.quiz.respuesta){
			res.render('quizes/answer', 
				{ quiz:req.quiz, respuesta: 'Correcto.'});
		} else {
			res.render('quizes/answer', 
				{ quiz:req.quiz, respuesta: 'Incorrecto.'});
		}
	})
};

//GET /quizes -> Parámetro search opcional /quizes:?search
exports.index = function(req, res) {
	var search = req.query.search || '';
	//Lo apaña para quitar espacios
	var search_like = "%" + search.replace(/ +/g, "%") + "%";

	models.Quiz.findAll({where: ["pregunta like ?", search_like],
			 			 order: [['updatedAt', 'DESC']]
						})
	.then(
		function(quizes) {
			res.render('quizes/index.ejs', { quizes: quizes });
		}
	//Si error, pasa al middleware de error
	).catch(function(error) {next(error);}) 
};

// GET /quizes/new
exports.new = function (req, res) {
	var quiz = models.Quiz.build( //crea objeto quiz
		{pregunta: "", respuesta: ""}
	);
	res.render('quizes/new', {quiz: quiz})
};

// POST /quizes/create
exports.create = function(req, res) {
	//Inicializa con los parámetros enviados desde el formulario
	var quiz = models.Quiz.build( req.body.quiz );

	//Guarda en DB los campos pregunta y respuesta de quiz
	quiz.save({fields: ["pregunta", "respuesta"]}).then(
		function(){
			//No tiene vista asociada así qeu realiza una redirección a /quizes
			res.redirect('/quizes'); 
		})
};


//Cambio success por then por problemas de versiones