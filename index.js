//event.target.closest('.?').id .? = id 
//event.target.classname.indexOf('?') !== -1
//npx webpack watch : auto push script to main


const express = require('express');
const fs = require('fs/promises'); //NOT USED?
const bodyParser = require('body-parser');
const {
    MongoClient,
    ObjectId
} = require("mongodb")
require('dotenv').config();

//const cors = require("cors");
//app.use(cors());

//Create Mongo client
const client = new MongoClient(process.env.URL);

const app = express()
const port = process.env.PORT;

app.use(express.static('public'));
app.use(bodyParser.json());


//Root route
app.get('/', (req, res) => {
    res.status(300).redirect('/info.html');
})

//Return all artpieces
app.get('/artpieces', async (req, res) => {
    try {
        //Connect to database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('artpieces');
        const art = await collection.find({}).toArray();

        //Send back the data from the artpieces
        res.status(200).send(art);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    } finally {
        await client.close();
    }
})

//Return one artpiece
app.get('/artpieces/:id', async (req, res) => {
    try {
        //Connect to database
        await client.connect();

        //Collect data from artpiece with this ID
        const collection = client.db('course-project').collection('artpieces');
        const query = {
            _id: ObjectId(req.query.id)
        };
        const art = await collection.findOne(query);

        //Check whether artpiece with this ID exists
        if (art) {
            //send back file
            res.status(200).send(art);
            return;
        } else {
            res.status(400).send('Artpiece could not be found with id:' + req.params.id);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    } finally {
        await client.close();
    }
})

//save artpiece
app.post('/artpieces', async (req, res) => {
    if (!req.body.type) {
        res.status(400).send('bad result, missing type');
        return;
    }

    try {
        //Connect to database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('artpieces');

        //validation for double challenges 
        const myDoc = await col.findOne({
            name: req.body.name
        }); // Find document 
        if (myDoc) {
            res.status(400).send('Bad request: boardgame already exists with name' + req.body.name);
            return; //cause we don't want the code to continue
        }

        //save new challenge
        let newChallenge = {
            name: req.body.name,
            points: req.body.points,
            course: req.body.course,
            session: req.body.session
        }

        //insert into database
        let insertResult = await col.insertOne(newChallenge);

        //send back succes message

        res.status(201).json(newChallenge);
        console.log(newChallenge)
        return;

    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'an error has occured',
            value: error
        });
    } finally {
        await client.close();
    }
});

//Delete artpiece
//CHECK WHETHER CORRECT
app.delete('/artpieces/:id', async (req, res) => {
    if (!req.params.id || req.params.id.length != 24) {
        res.status(400).send('bad result, missing id or id is not 24 chars long');
        return;
    }
    try {
        //Connect to database
        await client.connect();

        //Collect data from artpiece with this ID
        const collection = client.db('course-project').collection('colours'); ///CHANGE TO ALL ART

        // Create a query for a challenge to delete
        const query = {
            _id: ObjectId(req.params.id)
        };
        const message = {
            deleted: "Challenge deleted"
        }

        // Deleting the challenge
        const result = await col.deleteOne(query);
        if (result.deletedCount === 1) {
            res
                .status(200)
                .send(message);
        } else {
            res
                .status(404)
                .send("No documents matched the query. Deleted 0 documents.");
        }
    } catch (err) {
        console.log(error);
        res.status(500).send({
            error: 'an error has occured',
            value: error
        });
    } finally {
        await client.close();
    }
})

//Change artpiece
//CHECK WHETHER CORRECT
app.put("/challenges/:id", async (req, res) => {
    // check for body data
    const error = {
        error: "Bad request",
        value: "Missing name, points, session or course"
    }

    if (!req.body.name || !req.body.points || !req.body.course) {
        res.status(400).send(error);
        return;
    }
    try {
        //connect to the database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('colours'); ///CHANGE TO ALL ART

        // Create a query for a challenge to update
        const query = {
            _id: ObjectId(req.params.id)
        };
        const message = {
            deleted: "Challenge updated"
        }

        // update a challenge
        const updateChal = {
            name: req.body.name,
            points: req.body.points,
            session: req.body.session,
            course: req.body.course,
        };
        console.log(query, updateChal);
        // Updating the challenge
        const result = await col.updateOne(query, {
            $set: updateChal
        });

        // Send back success message
        res.status(201).send(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: "something went wrong",
            value: error,
        });
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})