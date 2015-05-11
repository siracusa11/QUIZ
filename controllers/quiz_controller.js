// El controlador importa el modelo para poder acceder a la base de datos

var models = require('../models/models.js');

//GET /quizes
exports.index = function(req, res) {
	models.Quiz.findAll().then(function(quizes) {
		res.render('quizes/index.ejs', { quizes: quizes});
	})
}


//GET /quizes/:id
exports.show = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
		res.render('quizes/show', {quiz: quiz});
	})
};

//GET /quizes/:id/answer
exports.answer = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
		if (req.query.respuesta === quiz.respuesta){
			res.render('quizes/answer', 
				{ quiz:quiz, respuesta: 'Correcto. Eres un Mewtwo.'});
		} else {
			res.render('quizes/answer', 
				{ quiz:quiz, respuesta: 'Incorrecto. Eres un Magikarp.'});
		}
	})
};

//Cambio success por then por problemas de versiones