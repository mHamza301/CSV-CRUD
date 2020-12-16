const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const fs = require('fs');


//Database Connection
let MongoClient = require('mongodb').MongoClient;
var db;

// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/CSV-TEST4",  (err, database) => {
  if(err) throw err;

  db = database;
  
// Start the application after the database connection is ready
app.listen(8080);
    console.log("Listening on port 8080");
});


//Express App Initialization 
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
global.__basedir = __dirname;
 

// Storage Location for Multer
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
         cb(null, __basedir + '/uploads/')
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
});
 

const upload = multer({storage: storage});
 
//Express Rest API
app.post('/api/uploadfile', upload.single("uploadfile"), (req, res) => {
    
    csvToMongo(__basedir + '/uploads/' + req.file.filename);
        res.json({
            'msg': 'File uploaded/import successfully!'
    });
});
 

app.post('/api/All',  (req, res) => {

    db.collection('Data').find({}).toArray((err, docs) =>{
        if (err) {
            res.status(404).send("Data not found")
        } 
            res.send(docs);    
    });
});
        
app.put('/api/Update/:id', (req, res) => {

    var updateData = req.body;
    db.collection('Data').updateOne({_id: req.params.id}, {$set: {...updateData}}, (err, result) => {
        if (err) {
            throw err;
        }
        
        if (result.result.nModified == 1) {
            res.status(200).send("Data has been updated");
        }
        else {
            res.status(404).send("The Data cannot be updated");
        }
    });
});

app.post('/api/Create', (req, res) => {

    var newData = req.body;
    db.collection('Data').insertMany([{...newData}], (err, result) => {
        if (err) {
            throw err;
        } 

    });
});


//Import CSV File to MongoDB 
function csvToMongo(filePath){
   
    csv()
        .fromFile(filePath)
        .then((jsonObject)=>{
    
                db.collection("Data").insertMany(jsonObject, (err, res) => {
                   if (err) {
                       throw err;
                   }
                   res.send("Data Successfully updated in db");
                
                });
                fs.unlinkSync(filePath);
        });
			
};
