// El controlador importa el modelo para poder acceder a la base de datos

var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto pertenece al usuario logeado o si es cuenta admin
exports.ownershipRequired = function(req, res, next){
    var objQuizOwner = req.quiz.UserId;
    var logUser = req.session.user.id;
    var isAdmin = req.session.user.isAdmin;

	//Puede modificar quizes si es el administrador o el propietario
    if (isAdmin || objQuizOwner === logUser) {
        next();
    } else {
        res.redirect('/');
    }
};


// Autoload - factoriza el código si la ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.find({
			where: {
				id: Number(quizId)
			},
			include: [{
				model: models.Comment
			}]
		}).then(
			function(quiz){
				if (quiz) {
					req.quiz = quiz;
					next();
				} else {
					next(new Error('No existe quizId=' + quizId));
				}
		}
	).catch(
		function(error) {
			next(error);
		}
	);
}


//GET /quizes/:id -> Solo si existe el id llega aquí
exports.show = function(req, res) {
	models.Quiz.find(req.params.quizId).then(function(quiz) {
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
	
	var options = {};
	//req.user es creado por autoload de usuario si la ruta lleva el parámetro :quizId
	if(req.user){ 
		options.where = {UserId: req.user.id};
	} else if(req.query.search){ //Lo pongo así para conservar la funcionalidad de la caja de búsquedas
		var search = req.query.search || '';
		//Lo apaña para quitar espacios
		var search_like = "%" + search.replace(/ +/g, "%") + "%";
		//['pregunta like ?', search_like]
		options.where = ['pregunta like ?', search_like];
		options.order = [['updatedAt', 'DESC']];
	}

	models.Quiz.findAll(options//{where: ["pregunta like ?", search_like],
			 			// order: [['updatedAt', 'DESC']]
						//}
						)
	.then(
		function(quizes) {
			res.render('quizes/index.ejs', { quizes: quizes, errors: [] });
		}
	//Si error, pasa al middleware de error
	).catch(function(error) {
		next(error);
	}); 
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
	//Añadimos el campo UserId, guardado en la session al objeto req.body.quiz del formulario
	req.body.quiz.UserId = req.session.user.id;

	//Si el quiz enviado incluye una imagen, su referencia se añada a la DB
	if(req.files.image){
    	req.body.quiz.image = req.files.image.name;
  	}

	//Inicializa con los parámetros enviados desde el formulario
	var quiz = models.Quiz.build( req.body.quiz );

	quiz
  	.validate()
  	.then(
    	function(err){
     		if (err) {
        		res.render('quizes/new', {quiz: quiz, errors: err.errors});
     		} else {
        		quiz // save: guarda en DB campos pregunta y respuesta de quiz
       			.save({fields: ["pregunta", "respuesta", "UserId", "image"]})
        		.then( function(){ 
        			res.redirect('/quizes');
        		})
      		}      // Redirección HTTP a lista de preguntas porque no hay vista asociada
    	}
  	).catch(function(error){next(error)});
};


//GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz; //autoload de instancia de quiz

	res.render('quizes/edit', {quiz:quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
	//Si el quiz enviado incluye una imagen, su referencia se añada a la DB
	if(req.files.image){
    	req.quiz.image = req.files.image.name;
  	}
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
	        	.save( {fields: ["pregunta", "respuesta", "image"]})
	        	.then( function(){ 
	        		res.redirect('/quizes');
	        	});
	      	}     // Redirección HTTP a lista de preguntas (URL relativo)
	    }
  ).catch(function(error){
  	next(error);
  });
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
	req.quiz.destroy().then( function() {
		res.redirect('/quizes');
	}).catch(function(error) {
		next(error);
	});
};

// GET /quizes/statistics
exports.statistics  = function(req, res, next){
	console.log("Estadísticas");
	models.Quiz.count().then(function (npregs) { 	//Preguntas
			models.Comment.count().then(function (ncomms) { 	//Comentarios
					models.Comment.count({ include: models.Quiz, distinct: 'quizId' }).then(function (concomms) { // Preguntas con comentarios
	//models.Comment.count({ distinct: true, include: models.Quiz}).then(function (concomms) { // Preguntas con comentarios
		// quiero dar: SELECT COUNT (DISTINCT QUIZID) FROM COMMENTS
						res.render('quizes/statistics.ejs', {
							npregs: npregs,
							ncomms: ncomms,
							ncommspreg: (ncomms/npregs).toFixed(2),
							sincomms: (npregs - concomms),
							concomms: concomms,
							errors: []
						});

					}).catch(function (error){
						next(error);
					});
			}).catch(function (error){
				next(error);
			});
	}).catch(function (error){
		next(error);
	});
};


//Cambio success por then por problemas de versiones