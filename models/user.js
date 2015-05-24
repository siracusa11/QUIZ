// Modelo de user con validación y encriptación de passwords

var crypto = require('crypto');
var key = process.env.PASSWORD_ENCRYPTION_KEY;

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define(
		'User',
		{
			username: {
				type: DataTypes.STRING,
				unique: true, // Comprueba que no hay otro usuario con el mismo id
				validate: {
					notEmpty: {msg: "-> Falta Username"}, //ESTO LO PONGO YO PORQUE ES DE SENTIDO COMÚN
					// Hay que devolver un mensaje de error si el username ya existe
                    isUnique: function (value, next) {
                        var self = this;
                        // Busca el nombre en la base de datos
                        User.find({where: {username: value}})
                        .then(function(user) {
                        		//Si existe un usuario con ese mismo nombre
                                if(user && self.id !== user.id){
                                	//Mensaje de error
                                    return next('Username ya utilizado');
                                }
                                //Si no existe, todo bien
                                return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                    }
               }
			},
			password:{ 		//Se va a cifrar con un algoritmo normalizado usando la función set(password)
				type: DataTypes.STRING,
				validate: {notEmpty: {msg: "-> Falta Password"}},
				set: function (password){
					console.log("\nContraseña: "+ password);
					// Encripta la password pasada como parámetro
					var encripted = crypto
									.createHmac('sha1', key)
									.update(password)
									.digest('hex');
                    // Evita passwords vacíos
                    if (password === '') {
                        encripted = '';
                    }
                    console.log("\nCifrada: " + encripted);
                    this.setDataValue('password', encripted);
				}
			},
			isAdmin:{ //Indica si el usuario es administrador. Solo se rellena al crear la DB
				type: DataTypes.BOOLEAN,
				defaultValue: false
			}
		},
		{
			instanceMethods: {
				verifyPassword: function (password) {
					// Encripta la password
					var encripted = crypto.createHmac('sha1', key).update(password).digest('hex');
					//sfasf
					return encripted === this.password;
				}
			}
		}
	);
	return User;
}