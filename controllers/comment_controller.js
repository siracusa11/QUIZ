// Controlador de comentarios
var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto
// pertenece al usuario logueado o si el cuenta admin
exports.ownershipRequired = function(req, res, next){
	models.Quiz.find({
		where: {
			id: Number(req.comment.QuizId)
		}
	}).then (function(quiz) {
		if (quiz) {
			var objQuizOwner = quiz.UserId;
			var logUser = req.session.user.id;
			var isModerator = req.session.user.isModerator;

			//Puede modificar quizes si es el administrador o el propietario del quiz
			if ( isModerator || objQuizOwner === logUser){
				next();
			} else {
				res.redirect('/');
			}
		} else {
			next(new Error ('No existe quizId = '+quizId));
		}
	}).catch(function(error){
		next(error);
	});
};
// Autoload :id de comentarios
exports.load = function(req, res, next, commentId){
	models.Comment.find({
			where: {
				id: Number(commentId)
			}
		}).then(function(comment) {
			if (comment) {
				req.comment = comment;
				next();
			} else {
				next(new Error('No existe commentId=' +commentId))
			}
		}
	).catch(function(error){
		next(error);
	});
}

// GET /quizes/:quizId/comments/new
exports.new = function(req, res){
	res.render('comments/new.ejs', {quizid: req.params.quizId, errors: []});
};

// POST /quizes/:quizId/comments
exports.create = function(req, res){
	var comment = models.Comment.build(
		{ texto: req.body.comment.texto,
			QuizId: req.params.quizId
		});

	comment
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('comments/new.ejs', {comment: comment, errors: err.errors});
			} else {
				comment //save: guarda en DB el campo de texto de comment
				.save()
				.then( 
					function(){
						res.redirect('/quizes/'+req.params.quizId);
					}
				)
			}
		}
	).catch(
		function(){
			next(error);
		}
	);
};

// GET /quizes/:quizId/comments/:commentId/publish
exports.publish = function(req, res){ //Necesita autoload
	req.comment.publicado = true;

	req.comment.save( {fields: ["publicado"]})
		.then(function() {
			res.redirect('/quizes/' +req.params.quizId);
		})
		.catch(function(error) {
			next(error);
		});
};

// DELETE /quizes/:quizId/comments/:commentId
exports.destroy = function(req, res) {
	req.comment.destroy().then( function() {
		delete req.comment;
		console.log('\nComentario eliminado.');
		res.redirect('/quizes/'+req.quiz.id);
	}).catch(function(error) {
		next(error);
	});
};