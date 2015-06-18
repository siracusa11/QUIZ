// El controlador importa el modelo para poder acceder a la base de datos

var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto pertenece al usuario logeado o si es cuenta admin
exports.ownershipRequired = function(req, res, next){
    var objQuizOwner = req.quiz.UserId;
    var logUser = req.session.user.id;
    var isModerator = req.session.user.isModerator;

	//Puede modificar quizes si es el administrador o el propietario
    if (isModerator || objQuizOwner === logUser) {
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
	//Gestión de favoritos
	//Si hay sesión iniciada
	if (req.session.user){
		//Comprueba si la pregunta es favorita del usuario y lo pone para que se pinte
		req.quiz.hasUser(req.session.user.id).then(function(fav){
			if(fav){
				req.quiz.favourite = true; //Atributo boolean para saber si se debe pintar de rojo o de gris
			}
			res.render('quizes/show', {quiz: req.quiz, errors: []});
		}).catch(function(error){
			next(error);
		});
	}else{ //Repito código porque no se guardan los cambios que hago dentro de la otra función
		res.render('quizes/show', {quiz: req.quiz, errors: []}); 
	}
};

//GET /quizes/:id/answer -> Solo si existe el id llega aquí
exports.answer = function(req, res) {
	var resultado = 'Incorrecto.';
	if (req.query.respuesta === req.quiz.respuesta){
		resultado = 'Correcto.';
	}
	res.render('quizes/answer', { quiz:req.quiz, respuesta: resultado, errors: [] });
};

//GET /quizes -> Parámetro search opcional /quizes:?search
exports.index = function(req, res, next) {
	
	var options = {};
	//req.user es creado por autoload de usuario si la ruta lleva el parámetro :userId -> Solo lo lleva si vamos a Mis Preguntas
	if(req.user){
		req.session.redir = req.path;// Cuando lleva /user el middleware no actualiza redir -> compatibilidad Mis Preguntas y Favoritos 
		options.where = {UserId: req.user.id};
	} else if (req.query.search || req.query.tema){ //Lo pongo así para conservar la funcionalidad de la caja de búsquedas
		var search = req.query.search || '';
		//Lo apaña para quitar espacios
		var search_like = "%" + search.replace(/ +/g, "%") + "%";
		var tema = req.query.tema || '%'; // Buscar por tema
		options.where = ['pregunta like ? and tema like ?', search_like, tema];
	}
	options.order = [['updatedAt', 'DESC']];

	models.Quiz.findAll(options).then(function(quizes) {
		//Marcamos los quizes favoritos para que cambie la vista
		if(req.session.user){	
			// Carga al usuario
			models.User.find({where: {id: Number(req.session.user.id)}
			}).then(function(user) {
				// Carga quizes favoritos del usuario
				user.getQuizzes().then(function(favourites){ 	//Me devuelve un array con todos mis favoritos
					//Marcarlos como que se deben pintar como favoritos
					quizes.forEach(function(quiz){
						favourites.forEach(function(favourite){
							if(quiz.id === favourite.id){
								quiz.favourite = true; //Atributo boolean para saber si se debe pintar de rojo o de gris
							}
						});
					});
					//Redirige a la misma página -> Lo tengo que poner repetido porque el atributo favourite no perdura al salir
					res.render('quizes/index.ejs', {
						quizes: quizes, //Reutiliza la lista de preguntas de quizes/index
						errors: []
					});
				});
			});
		// Redirige a la misma página
		}else{
			res.render('quizes/index.ejs', { quizes: quizes, errors: [] });
		}	 
	//Si error, pasa al middleware de error
	}).catch(function(error) {
		next(error);
	}); 

};

// GET /quizes/new
exports.new = function (req, res) {
	var quiz = models.Quiz.build( //crea objeto quiz
		{pregunta: "", respuesta: "", tema: ""}
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
       			.save({fields: ["pregunta", "respuesta", "UserId", "image", "tema"]})
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
	//Si el quiz enviado incluye una imagen, su referencia se añade a la DB
	if(req.files.image){
    	req.quiz.image = req.files.image.name;
  	}
	req.quiz.pregunta  = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta;
	req.quiz.tema = req.body.quiz.tema;

  	req.quiz
  	.validate()
  	.then(
    	function(err){
	      	if (err) {
	        	res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
	      	} else {
	        	req.quiz     // save: guarda campos pregunta y respuesta en DB
	        	.save( {fields: ["pregunta", "respuesta", "image", "tema"]})
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
	console.log("\nEstadísticas");
	models.Quiz.count().then(function (npregs) { 	//Preguntas
			models.Comment.count().then(function (ncomms) { 	//Comentarios
					models.Comment.count({ include: models.Quiz, distinct: 'quizId' }).then(function (concomms) { // Preguntas con comentarios
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