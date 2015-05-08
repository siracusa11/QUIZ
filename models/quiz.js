
//Definicion del modelo de quiz
//Tabla con preguntas y respuestas

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Quiz',
							{ pregunta: DataTypes.STRING,
								respuesta: DataTypes.STRING,
							});
}