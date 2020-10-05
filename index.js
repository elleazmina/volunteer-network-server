const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4troo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = 5000

const app = express()

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/volunteer-network-e2da7-firebase-adminsdk-gjfca-c140fed4f5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-network-e2da7.firebaseio.com"
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const registrations = client.db("volunteerNetwork").collection("registrations");
  
  app.post('/addRegistration', (req, res) => {
      const newRegistration = req.body;
      registrations.insertOne(newRegistration)
      .then(result => {
          res.send(result.insertedCount > 0);
      })
      console.log(newRegistration);
  })

  app.get('/registrations', (req, res) => {
    registrations.find({})
    .toArray((err, documents) => {
        res.send(documents);
    })
})

  app.get('/registrations', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      const tokenEmail = decodedToken.email;
      const queryEmail = req.query.email;
      if(tokenEmail == queryEmail) {
        registrations.find({email: req.query.email})
        .toArray((err, documents) => {
            res.send(documents);
        })
      }
    }).catch(function(error) {
      // Handle error
    });
    }
    
     
  })
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port);