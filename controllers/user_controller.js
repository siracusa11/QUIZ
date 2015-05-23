//Controlador de usuarios
var models = require('../models/models.js');

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