//models.js construye la DB y el modelo importando (quiz.js)
//sequelize.sync() construye la DB según define el modelo.

var path = require('path');

// Postgres DATABASE_URL = postgres://user:passwd@host:port/database
// SQLite   DATABASE_URL = sqlite://:@:/
console.log("\nENV: "+process.env);
console.log("\nDATABASE_URL: "+process.env.DATABASE_URL);
console.log("\nDATABASE_STORAGE: "+process.env.DATABASE_STORAGE+'\n');

var url = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);
var DB_name = (url[6]||null);
var user = (url[2]||null);
var pwd = (url[3]||null);
var protocol = (url[1]||null);
var dialect = (url[1]||null);
var port = (url[5]||null);
var host = (url[4]||null);
var storage = process.env.DATABASE_STORAGE;

// Cargar Modelo ORM
var Sequelize = require('sequelize');

// Usar BBDD SQLite o Postgres
var sequelize = new Sequelize(DB_name, user, pwd,
	{ dialect: protocol,
	protocol: protocol,
	port: port,
	host: host,
	storage: storage, // solo SQLite (.env)
	omitNull: true // solo Postgres
	}
);

// Importar la definicion de la tabla Quiz en quiz.js
var quiz_path = path.join(__dirname,'quiz');
var Quiz = sequelize.import(quiz_path);

// Importar la definicion de la tabla Comment en comment.js
var comment_path = path.join(__dirname,'comment');
var Comment = sequelize.import(comment_path);

// Importar la definicion de la tabla User en user.js
var user_path = path.join(__dirname,'user');
var User = sequelize.import(user_path);

Comment.belongsTo(Quiz) // Los comentarios pertenecen a los quizes
Quiz.hasMany(Comment); // Un quiz puede tener muchos comentarios

// Los quizes pertenecen a un usuario registrado
Quiz.belongsTo(User); //Relación 1-N entre tablas User y Quiz
User.hasMany(Quiz);

//Tabla N:N->Favourites: Tabla join para relacionar las tablas de usuarios y de quizes
var Favourites = sequelize.define('Favourites');
Quiz.belongsToMany(User, {through: 'Favourites'}); //Un Quiz tiene muchos fans
User.belongsToMany(Quiz, {through: 'Favourites'}); //Un Usuario tiene muchos favs
//Crea la columna Favourites en ambas tablas: en principio ya no es necesario crear un favourites.js

// Exportamos tablas
exports.Quiz = Quiz; // Exportar definición de tabla Quiz
exports.Comment = Comment; // Exportar definición de tabla Comment
exports.User = User; // Exportar definición de tabla User
exports.Favourites = Favourites; //Exporta la definición de la tabla Favourites


// sequelize.sync() crea e inicializa tabla de preguntas en DB
sequelize.sync().then(function() {
  // then(..) ejecuta el manejador una vez creada la tabla
  User.count().then(function (count){
    if(count === 0) { //La tabla se inicializa solo si está vacía
      //Se inicializa con 2 usuarios
      User.bulkCreate(
        [ {username: 'admin', password: '1234', isAdmin: true, isModerator: true}, //única manera de crear admin
          {username: 'pepe', password: '5678'}
        ]
      ).then(function(){
        console.log('Base de datos (tabla user) inicializada.');
        Quiz.count().then(function (count){
          if(count === 0) {   // la tabla se inicializa solo si está vacía
            Quiz.bulkCreate( //Los quizes pertenecen a pepe
             [ {pregunta: 'Capital de Italia',   respuesta: 'Roma', UserId: 2},
               {pregunta: 'Capital de Portugal', respuesta: 'Lisboa', UserId: 2}
              ]
            ).then(function(){console.log('Base de datos (tabla Quiz) inicializada')});
          };
        });
      });
    };
  });
});

//Cambio success por then por problema de versiones