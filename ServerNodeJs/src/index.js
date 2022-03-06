const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const corsOptions = { origin: true, optionsSuccessStatus: 200 };
//Importar rutas
const rutasApp = require('./routes/rutas')

//settings
app.set('port',process.env.PORT || 3000);

//middlewares
app.use(morgan('dev'));
app.use(cors(corsOptions));
//app.use(express.json());
app.use(bodyParser.json({ limit: '100mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '100mb', parameterLimit: 100000, extended: true }))


//rutas
/*app.get('/',(req,res)=>{
    res.json('Hola Mundo')
})*/
app.use('/',rutasApp);
//run
app.listen(app.get('port'),()=>{
    console.log('Server on Port 3000')
})