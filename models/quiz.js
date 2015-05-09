//Definición del modelo de Quiz

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Quiz', 		//Define el formato de datos de la tabla de preguntas
            { pregunta:  DataTypes.STRING,
              respuesta: DataTypes.STRING,
            });
}