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
		console.log('Pregunta: '+req.quiz.pergunta);
		res.render('quizes/show', {quiz: req.quiz, errors: []}); 
	})
};

//GET /quizes/:id/answer -> Solo si existe el id llega aquí
exports.answer = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
		var resultado = 'Incorrecto.';
		if (req.query.respuesta === req.quiz.respuesta){
			resultado = 'Correcto.';
		}
		res.render('quizes/answer', { quiz:req.quiz, respuesta: resultado, errors: [] });
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
			res.render('quizes/index.ejs', { quizes: quizes, errors: [] });
		}
	//Si error, pasa al middleware de error
	).catch(function(error) {next(error);}) 
};

// GET /quizes/new
exports.new = function (req, res) {
	var quiz = models.Quiz.build( //crea objeto quiz
		{pregunta: "", respuesta: ""}
	);
	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
	//Inicializa con los parámetros enviados desde el formulario
	var quiz = models.Quiz.build( req.body.quiz );

	quiz
	.validate()
	.then(
		function(err){
			if(err){
				res.render('quizes/new', {quiz: quiz, errors: err.errors});
			} else { //save: Guarda en DB los campos pregunta y respuesta de quiz
				quiz
				.save({fields: ["pregunta", "respuesta"]})
				.then(
					function(){
						res.redirect('/quizes'); //No tiene vista asociada así que realiza una redirección a /quizes
				})
			}
		}
	);
};

//GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz; //autoload de instancia de quiz

	res.render('quizes/edit', {quiz:quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas porque no hay HTML asociado
    }
  );
};


//Cambio success por then por problemas de versiones