const {Router} = require('express')
const crypto = require('crypto')
const AWS = require('aws-sdk')
const {connect} = require('../database/configdb');
const {global} = require('../../globales')
const router = Router();

console.log(global.USER_ACCESS_KEY_ID)
console.log(global.SECRET_ACCESS_KEY)
//Inicio
router.get('/',async(req,res)=>{
    res.json({ mensaje: "Servidor 1" })
})
//EditarUsuario
router.post('/editarUsuario',async(req,res)=>{
   try{
        const sql = "UPDATE usuario SET nombre=?,usuario=?,nombreFoto=? WHERE idUsuario=?";
        const {idUsuario,nombre,usuario,nombreFoto,archivoBase64} = req.body;
        const cadenaBase64 = this.toString(archivoBase64);
        const nombreFotoAlmacenar = 'Fotos_Perfil/'+nombreFoto;
        const result = await (await connect()).query(sql,[nombre,usuario,nombreFotoAlmacenar,idUsuario]);
        
       if(archivoBase64?.length>0){
            let buff = new Buffer.from(archivoBase64.replace(/^data:image\/\w+;base64,/, ""),'base64');
            AWS.config.update(
                {
                    region: 'us-east-2',
                    accessKeyId:global.USER_ACCESS_KEY_ID,
                    secretAccessKey:global.SECRET_ACCESS_KEY
                }
            );;
            const s3 = new AWS.S3();
            
            const params = {
                Bucket: "practica1-g14-imagenes", //Nombre del bucket
                Key: nombreFotoAlmacenar,
                Body: buff,
                ContentEncoding: 'base64',
                ContentType: "image/*"
            }
        
            const putResult = s3.putObject(params).promise();
            res.json({ mensaje: putResult })
        }else{
            if(result.affectedRows>0){
            res.status(200).json({mensaje:'Usuario editado correctamente'});
        }else{
            res.status(201).json({mensaje:'No existe el usuario'});
        }
        }
        
        
   }catch(error){
        res.status(400).json({Error:'No se pudo editar el usuario',Error:error});
    }
    


})
//Obtener Usuario
router.get('/obtenerUsuario/:idUsuario',async(req,res)=>{
    try{
        const sql = "SELECT * FROM usuario WHERE idUsuario=?";
    const {idUsuario} = req.params;
    const result = await (await connect()).query(sql,[idUsuario]);
    if(result.length>0){
        res.status(200).json(result[0]);
    }else{
        res.status(200).json({mensaje:'No existe el usuario'});
    }
    }catch(error){
        res.status(400).json({Error:'No se pudo obtener el usuario',Error:error});
    }
    
})
//Registrar Album
router.post('/guardarAlbum',async(req,res)=>{
    try{
        const sql = "INSERT INTO album(nombre,idUsuario) VALUES(?,?)";
    const nombre = req.body.nombre;
    const idUsuario = req.body.idUsuario;
   
    await (await connect()).query(sql,[nombre,idUsuario]);
    res.status(200).json({mensaje:'Album registrado correctamente'})
    }catch(error){
        res.status(400).json({Error:'No se pudo registrar el album',Error:error});
    }
    
})
//Retornar Albumes
router.get('/obtenerAlbumes/:idUsuario',async(req,res)=>{
    try{
        const sql = "SELECT * FROM album WHERE idUsuario=?";
        const {idUsuario} = req.params;
        const result = await (await connect()).query(sql,[idUsuario]);
        if(result.length>0){
            console.log(result)
            res.status(200).json(result);
        }else{
            res.status(200).json({mensaje:'No Existe el album'});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudo obtener los albumes',Error:error});
    }
    
})
//Editar Album
router.post('/editarAlbum',async(req,res)=>{
    try{
        const sql = "UPDATE album SET nombre=? WHERE idAlbum=?";
        const {nombre,idAlbum} = req.body;
        const result = await (await connect()).query(sql,[nombre,idAlbum]);
        if(result.affectedRows>0){
            res.status(200).json({mensaje:'Album editado correctamente'});
        }else{
            res.status(201).json({mensaje:'No existe el album'});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudo editar el album',Error:error});
    }
})
//Eliminar Album
router.delete('/eliminarAlbum/:idAlbum',async(req,res)=>{
    try{
        const sql = "DELETE FROM album WHERE idAlbum=?";
        const {idAlbum} = req.params;
        const result = await (await connect()).query(sql,[idAlbum]);
        console.log(result)
        if(result.affectedRows>0){
            res.status(200).json({mensaje:'Album eliminado correctamente'});
        }else{
            res.status(201).json({mensaje:'No existe el album'});
        }
        
    }catch(error){
        res.status(400).json({Error:'No se pudo eliminar el album',Error:error});
    }
   


})
//Fotos
router.post('/subirFoto',async(req,res)=>{
    try{
        const sql = "INSERT INTO foto(nombre,idAlbum) VALUES(?,?)";
        const {nombre,idAlbum,archivoBase64} = req.body;
        console.log(nombre,idAlbum);
        const nombreFotoAlmacenar = 'Fotos_Publicadas/'+idAlbum+nombre;
        let buff = new Buffer.from(archivoBase64.replace(/^data:image\/\w+;base64,/, ""),'base64');
        await (await connect()).query(sql,[nombreFotoAlmacenar,idAlbum]);
        AWS.config.update(
            {
                region: 'us-east-2',
                accessKeyId:global.USER_ACCESS_KEY_ID,
                secretAccessKey:global.SECRET_ACCESS_KEY
            }
        );;
        const s3 = new AWS.S3();
        
        const params = {
            Bucket: "practica1-g14-imagenes", //Nombre del bucket
            Key: nombreFotoAlmacenar,
            Body: buff,
            ContentEncoding: 'base64',
            ContentType: "image/*"
        }
        const putResult = s3.putObject(params).promise();
        res.json({ mensaje: putResult })


    }catch(error){
       res.status(400).json({Error:'No se pudo guardar la foto',Error:error});
   }
})

//Ruta para subir la foto a s3

router.post('/registrarUsuario',async(req,res)=>{
    try{
        const sql = "INSERT INTO usuario(nombre,usuario,password,nombreFoto) VALUES(?,?,md5(?),?)";
        const nombre = req.body.nombre;
        const usuario = req.body.usuario;
        const password = req.body.password;
        const nombreFoto = req.body.nombreFoto;
        const nombreFotoAlmacenar = 'Fotos_Perfil/'+nombreFoto;
        
        const archivoBase64 = req.body.archivoBase64; //Solo va a recibir el archivo base64 pero no lo va a insertar en mysql
        
        //Convertir a base 64 a bytes
        let buff = new Buffer.from(archivoBase64.replace(/^data:image\/\w+;base64,/, ""),'base64');
        await (await connect()).query(sql,[nombre,usuario,password,nombreFotoAlmacenar]);
        
    
        AWS.config.update(
            {
                region: 'us-east-2',
                accessKeyId:global.USER_ACCESS_KEY_ID,
                secretAccessKey:global.SECRET_ACCESS_KEY
            }
        );;
        const s3 = new AWS.S3();
        
        const params = {
            Bucket: "practica1-g14-imagenes", //Nombre del bucket
            Key: nombreFotoAlmacenar,
            Body: buff,
            ContentEncoding: 'base64',
            ContentType: "image/*"
        }
    
      
        const putResult = s3.putObject(params).promise();
        res.json({ mensaje: putResult })
    
    }catch(error){
        res.status(400).json({Error:'No se pudo guardar el usuario',Error:error});
    }
    
})

//Login
router.post('/login',async(req,res)=>{
    try{
        const sql = 'SELECT * FROM usuario WHERE usuario=? AND password=?';
        const {usuario,password} = req.body;
        //console.log(usuario,password);
        const passwordMd5 = crypto.createHash('md5').update(password).digest('hex');
        const result = await (await connect()).query(sql,[usuario,passwordMd5]);
        if(result.length>0){
            res.status(200).json({msg:true,result});
        }else{
            res.status(201).json({msg:false});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudo obtener el usuario',Error:error});
    }
    
})

//Almacenar Foto de Perfil del Usuario
router.post('/guardarFotoPerfil',async(req,res)=>{
   try{ 
        const sql = "INSERT INTO fotoPerfil(nombreFoto,idUsuario) VALUES(?,?)";
        const {nombreFoto,idUsuario} = req.body;
        const nombreFotoAlmacenar = 'Fotos_Perfil/'+nombreFoto;
        await (await connect()).query(sql,[nombreFotoAlmacenar,idUsuario]);
    }catch(error){
        res.status(400).json({Error:'No se pudo guardar la foto',Error:error}); 
    }
})

//Retornar Fotos de Perfil por Usuario
router.get('/retornarFotosPerfil/:idUsuario',async(req,res)=>{
    try{
        const sql = "SELECT nombreFoto FROM fotoPerfil WHERE idUsuario=?";
        const{idUsuario} = req.params;
        const result = await (await connect()).query(sql,[idUsuario]);
        if(result.length>0){
            console.log(result)
            res.status(200).json(result);
        }else{
            res.status(200).json({mensaje:'No Existen fotos para este usuario'});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudieron obtener las fotos',Error:error});
    }
    
})

router.get('/mostrarFotosAlbum/:idAlbum',async(req,res)=>{
    
    try{
        const sql = "SELECT * FROM foto WHERE idAlbum=?";
        const{idAlbum} = req.params;
        const result = await (await connect()).query(sql,[idAlbum]);
        console.log(result)
        if(result.length>0){
            res.status(200).json(result);
        }else{
            res.status(200).json({mensaje:'No Existe el album'});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudieron obtener las fotos del album',Error:error});
    }

})
router.get('/ultimoId',async(req,res)=>{
    try{
        const sql = "select max(idUsuario) as id from usuario";
        const result = await (await connect()).query(sql); 
        console.log(result)
        if(result.length>0){
            res.status(200).json(result[0]);
        }else{
            res.status(200).json({mensaje:'No Existe el id'});
        }
    }catch(error){
        res.status(400).json({Error:'No se pudo obtener el id',Error:error});
    }
})

module.exports = router;
