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
 
//A Query to check the total documents present in the database.
app.post('/api/All',  (req, res) => {

    db.collection('Data').find({}).toArray((err, docs) =>{
        if (err) {
            res.status(404).send("Data not found")
        } 
            res.send(docs);    
    });
});

//Aggregation Method applied to the age and then summed the number of people 
//living in a certain city for say "Karachi" OR "Lahore" etc. 
app.post('/api/Search', (req, res) => {

    db.collection('Data').aggregate(
        [{
            $match : {"age" : {$gt : '20'}}}, 
        {
            $group : {_id : {city : "$address"}, totalLiving : {$sum : 1 }}}] ,  
            
            (err, result) => { 
                 if (err) {
                    throw err;
                 }
            console.log(result);
    });
});

//Takes the ID passed into the URL parameter and updates the data depending 
//upon the previous data, if the data is already updated then nothing happens.
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

//To Create the new data in the database.
app.post('/api/Create', (req, res) => {

    var newData = req.body;
    db.collection('Data').insertOne({...newData}, (err, result) => {
        if (err) {
            throw err;    
        } 
        if (result.result.n ==1 && result.result.ok == 1) {
            res.status(200).send("New Entry Added to Database");
        }
        else{
            res.status(404).send("Your Data Cannot be Inserted");
        }
    });
});

//Deletes the data using the ID provided by the user if Invalid
//nothing happens. 
app.delete('/api/Delete/:id', (req, res) => { 

    var id = req.params.id;
    db.collection('Data').deleteOne({_id : id}, (err, result) => {
        if (err) {
            throw err;
        }
        if (result.deletedCount == 1) {
            res.status(200).send("Requested Data has been deleted");
        }
        else {
            res.status(404).send("Requested Data cannot be found");
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
