// Controlador de favoritos
var models = require('../models/models.js');

// GET /user/:userId/favourites -> Lista las preguntas favoritas del usuario
exports.index = function (req, res, next){
	req.session.redir = req.path; //En app.js no se actualiza porque empieza por /user : como tampoco queremos que los post guarden redir lo hacemos aquí
	//Busca los quizzes favoritos de este usuario
	req.user.getQuizzes().then(function(favourites){ 	//Me devuelve un array con todos mis favoritos
		
		//Marcarlos todos como que se deben pintar como favoritos
		favourites.forEach(function(favourite){
			favourite.favourite = true; //Atributo boolean para saber si se debe pintar de rojo o de gris
		});
		//Redirige a la misma página
		res.render('favourites/index.ejs', {
			quizes: favourites, //Reutiliza la lista de preguntas de quizes/index
			errors: []
		});
	})
	.catch(function(error) {
		next(error);
	})
};

// PUT /user/:userId/favourites/:quizId -> Marcar quiz como favorito
exports.add = function (req, res, next){
	//No tiene vista: Redirect a la misma página en la que estaba o a la lista de favoritos
	var redir = req.body.redir || '/user/' +req.user.id+ '/favourites';
	console.log('\nRedir: '+redir); //Pasamos el redir anterior en un parámetro oculto
	
	req.user.hasQuiz(req.quiz.id).then(function(set) {
		//Añade el atributo favorito al quiz del usuario
		if(!set){
			//Podría tocarse la columna de fans de Quizzes en vez de esta
			req.user.addQuiz(req.quiz).then(function() {
				console.log('\n Marca quiz '+req.quiz.id+ ' como favorito');
				res.redirect(redir);
			}).catch(function(error) {
				return next(error);
			});
		} else {
			console.log('\n Ya estaba marcado. ¿Por qué ha entrado en add?');
			res.redirect(redir);
		}
	})
};

// DELETE /user/:userId/favourites/:quizId -> Desmarcar quiz como favorito
exports.remove = function (req, res, next){
	//No tiene vista: Redirect a la misma página en la que estaba o a la lista de favoritos
	var redir = req.body.redir || '/user/' +req.user.id + '/favourites';
	console.log('\nRedir: '+redir); //El redir va en un parámetro anterior
	

	req.user.hasQuiz(req.quiz.id).then(function(set) {
		//Elimina el atributo favorito al quiz del usuario
		if(set){
			//Podría tocarse la columna de fans de Quiz en vez de esta
			req.user.removeQuiz(req.quiz).then(function() {
				console.log('\n Desmarca quiz '+req.quiz.id+ ' como favorito');
				res.redirect(redir);
			}).catch(function(error) {
				return next(error);
			});
		} else {
			console.log('\n No estaba marcado. ¿Por qué ha entrado en remove?');
			res.redirect(redir);
		}
	});
};