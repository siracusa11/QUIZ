//Controlador de usuarios
var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto
// pertenece al usuario logueado o si el cuenta admin
exports.ownershipRequired = function(req, res, next){
	var objUser = req.user.id;
	var logUser = req.session.user.id;
	var isModerator = req.session.user.isModerator;

	//Puede modificar quizes si es el administrador o el propietario de la cuenta
	if ( isModerator || objUser === logUser){
		next();
	} else {
		res.redirect('/');
	}
};

//Función de autoload
exports.load = function(req, res, next, userId){
	models.User.find({
		where: {
			id: Number(userId)
		}
	}).then(function(user) { 	//Guarda la variable user en req
		if(user) {
			req.user = user;
			next();
		} else {
			next(new Error('No existe userId = ' +userId));
		}
	}).catch(function(error){
		next(error);
	});
};

//Comprueba si el usuario eśtá registrado en users
//Si autenticación falla o hay errores se ejecuta callback(error)
exports.autenticar = function(login, password, callback) {
	// Busca al usuario en la base de datos
	models.User.find({
		where: {
			username: login
		}
	}).then(function(user) {
		// Si está en la base de datos
		if(user){
			// Verifica la password
			if(user.verifyPassword(password)){
				callback(null, user);
				console.log("\nUsuario autenticado: ¡Hola, "+user.username+'!');
			} else {
				callback(new Error ('Password erróneo.'));
			}
		} else { 
			callback(new Error('No existe el usuario: ' + login));
		}
	}).catch(function(error){
		callback(error);
	});
};

// MW que solo deja continuar si el usuario es el administrador
exports.adminRequired = function(req, res, next){
	if (req.session.user.isAdmin){
		next();
	} else {
		res.redirect("/");
	}
}

// MW que solo deja continuar si el usuario es el administrador o moderador
exports.privilegesRequired = function(req, res, next){
	if (req.session.user.isAdmin || req.session.user.isModerator){
		next();
	} else {
		res.redirect("/");
	}
}

// GET /user(:id)/edit
exports.edit = function(req, res) { //Carga el formulario de edición
	res.render('user/edit',  { user: req.user, errors:[]});
}; 								//req.user: instancia de user cargada con autoload

// GET /user
exports.new = function(req, res) { 		//Carga el formulario de creación
	var user = models.User.build( // crea objeto user
		{username: "", password: ""}
	);
	res.render('user/new', {user: user, errors:[]});
};

// POST /user
exports.create = function(req, res) { 		// crea la cuenta de usuario
	var user = models.User.build( req.body.user );

	user
	.validate()
	.then(
		function(err){
			if (err) {
				res.render('user/new', {user: user, errors: err.errors});
			} else {
				
				console.log("\nUsername: "+user.username+"\nPassword: "+user.password);

				user //save: guarda en DB campos username y password de user
				.save({fields: ["username", "password"]})
				.then( function(){
					//crea la sesión con el usuario ya autenticado y redirige a /
					req.session.user = {id:user.id, username:user.username};
					res.redirect('/');
				});
			}
		}
	).catch(function(error){
		next(error);
	});
};

// PUT /user/:id
exports.update = function(req, res, next) { //Actualiza la DB
  req.user.username  = req.body.user.username;
  req.user.password  = req.body.user.password;

  req.user
  .validate()
  .then(
    function(err){
	    if (err) { //Maneja errores de validación
	      res.render('/user/' + req.user.id, {user: req.user, errors: err.errors});
	    } else {
	      req.user     // save: guarda campo username y password en DB
	      .save( {fields: ["username", "password"]})
	      .then( function(){
	      	req.session.user = req.user; //ESTO LO PONGO YO PARA ACTUALIZAR EL USUARIO EN LA SESIÓN
	      	res.redirect('/');
	      });
    	}     // Redirección HTTP a /
    }).catch(function(error){
  		//req.session.errors = [{"message": 'Se ha producido un error: ' + error}];
  		//res.redirect('/user/' + req.user.id);
  		return next(error); // Lo cambio para avisar al usuario de su error
  	});
};


// DELETE /user/:id
exports.destroy = function(req, res, next) { 		//Destruye la cuenta de usuario
	console.log('\nUser deleted: '+req.user.username);
	
	var borrar = req.session.user.id === req.user.id;
	console.log("\nborrar: "+borrar);

	req.user.destroy().then( function() {
		//borra la sesión
		if(borrar){ 	//Si lo ha borrado el administrador no tiene que cerrar sesión
			delete req.session.user;
		}
		// Redirige
		var redir = req.session.redir || '/';
		res.redirect(redir);
	}).catch(function(error){
		next(error);
	});
};


// PUT /user/:id/up
exports.up = function(req, res, next) { //Actualiza la DB y hace al usuario moderador
  req.user.isModerator = true;

  req.user.save( {fields: ["isModerator"]} ) // save: guarda campo isModerator en DB
	    .then( function() {
	      	console.log('\nAhora '+req.user.username+' es moderador.')
	      	res.redirect('/user/all');
	    }).catch(function(error){
  			return next(error); // Lo cambio para avisar al usuario de su error
  		});
};

// PUT /user/:id/down
exports.down = function(req, res, next) { //Actualiza la DB y hace que el usuario ya no sea moderador
  req.user.isModerator = false;

  req.user.save( {fields: ["isModerator"]} ) // save: guarda campo isModerator en DB
	    .then( function() {
	      	console.log('\nAhora '+req.user.username+' ya no es moderador.');
	      	res.redirect('/user/all');
	    }).catch(function(error){
  			return next(error); // Lo cambio para avisar al usuario de su error
  		});
};

// GET /user/all
exports.all = function(req, res, next){	//Gestión de cuentas de usuario para el admin y moderadores
	models.User.findAll({where: {isAdmin: false}
		}).then(function(users) {
		req.session.redir = req.path;
		res.render("user/all.ejs", {users: users, errors: []} );
	}).catch(function(error){
		next(error);
	})
}

