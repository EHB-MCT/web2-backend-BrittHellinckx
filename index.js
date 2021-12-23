const express = require('express');
const fs = require('fs/promises');
const bodyParser = require('body-parser');
const cors = require("cors");
const {
    MongoClient,
    ObjectId
} = require("mongodb")
require('dotenv').config();

//Create Mongo client
const client = new MongoClient(process.env.URL);

//Set app and port
const app = express()
const port = process.env.PORT;

//App.use
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());

//////////////////////////////////////////////////////////////////////////////////////////
//Root route
app.get('/', (req, res) => {
    res.send('Everything is OK!')
})

/////////////////////////////////////ARTPIECES////////////////////////////////////////////
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
    //Get
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
            //Send back file
            res.status(200).send(art);
            return;
        } else {
            //Send 'could not be found'
            res.status(400).send('Artpiece could not be found with id:' + req.query.id);
        }
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    }
    //End
    finally {
        await client.close();
    }
})

//Save artpiece
app.post('/artpieces', async (req, res) => {
    //Check for type
    if (!req.body.type) {
        res.status(400).send('Bad result, missing type');
        return;
    }
    //Save
    try {
        //Connect to database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('artpieces');

        //Validation for double artpieces
        //Colour 
        if (req.body.type == "colour") {
            const myDoc = await collection.findOne({
                c1: req.body.c1,
                c2: req.body.c2,
                c3: req.body.c3,
                c4: req.body.c4,
            });
            if (myDoc) {
                res.status(400).send('Bad request: these colours already exists');
                return;
            }
        }
        //Photo
        else {
            const myDoc = await collection.findOne({
                url: req.body.url,
            });
            if (myDoc) {
                res.status(400).send('Bad request: this photo already exists');
                return;
            }
        }

        //Save new artpiece
        //Colour
        if (req.body.type == "colour") {
            let colours = {
                type: "colour",
                c1: req.body.c1,
                c2: req.body.c2,
                c3: req.body.c3,
                c4: req.body.c4,
                status: "saved"
            }
            //Insert into database
            let insertResult = await collection.insertOne(colours);
            //Send back succesmessage
            res.status(201).json(colours);
            console.log(colours)
            return;
        }
        //Photo
        else {
            let photo = {
                type: "photo",
                author: req.body.author,
                url: req.body.url,
                status: "saved"
            }
            //Insert into database
            let insertResult = await collection.insertOne(photo);
            //Send back succesmessage
            res.status(201).json(photo);
            console.log(photo)
            return;
        }

    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    }
    //End
    finally {
        await client.close();
    }
});

//Delete artpiece 
app.delete('/artpieces/:id', async (req, res) => {
    //Check for id
    if (!req.query.id || req.query.id.length != 24) {
        res.status(400).send('Bad result, missing id or id is not 24 chars long');
        return;
    }
    //Delete
    try {
        //Connect to database
        await client.connect();

        //Collect data from artpiece with this ID
        const collection = client.db('course-project').collection('artpieces');

        //Create a query to delete
        const query = {
            _id: ObjectId(req.query.id)
        };
        const message = {
            deleted: "Challenge deleted"
        }

        //Deleting the artpiece
        const result = await collection.deleteOne(query);
        if (result.deletedCount === 1) {
            res
                .status(200)
                .send(message);
        } else {
            res
                .status(404)
                .send("No documents matched the query. Deleted 0 documents.");
        }
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    }
    //End
    finally {
        await client.close();
    }
})

//Change artpiece
app.patch("/artpieces/:id", async (req, res) => {
    //Check for status and id
    if (!req.body.status || !req.query.id || req.query.id.length != 24) {
        const error = {
            error: "Bad request",
            value: "Missing status/ id or id is not 24 chars long"
        }
        res.status(400).send(error);
        return;
    }
    //Patch
    try {
        //Connect to the database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('artpieces');

        //Create a query to update
        const query = {
            _id: ObjectId(req.query.id)
        };

        //Update status
        let updateStatus = {
            status: req.body.status
        }
        const result = await collection.updateMany(query, {
            $set: updateStatus
        });

        //Send back successmessage
        res.status(201).send(result);
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: "An error has occured",
            value: error,
        });
    }
    //End
    finally {
        await client.close();
    }
});

////////////////////////////////////POSTS/////////////////////////////////////////////////

//Return all posts
app.get('/posts', async (req, res) => {
    //Get
    try {
        //Connect to database
        await client.connect();

        //Collect all data from posts
        const collection = client.db('course-project').collection('posts');
        const post = await collection.find({}).toArray();

        //Send back the data from the posts
        res.status(200).send(post);
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    }
    //End
    finally {
        await client.close();
    }
})

//Return one post
app.get('/posts/:id', async (req, res) => {
    //Get
    try {
        //Connect to database
        await client.connect();

        //Collect data from post with this ID
        const collection = client.db('course-project').collection('posts');
        const query = {
            _id: ObjectId(req.query.id)
        };
        const post = await collection.findOne(query);

        //Check whether post with this ID exists
        if (post) {
            //Send back file
            res.status(200).send(post);
            return;
        } else {
            res.status(400).send('Post could not be found with id:' + req.params.id);
        }
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'An error has occured',
            value: error
        });
    }
    //End
    finally {
        await client.close();
    }
})
//Change post
app.patch("/posts/:id", async (req, res) => {
    //Check for liked and id
    if (!req.query.id || req.query.id.length != 24) {
        const error = {
            error: "Bad request",
            value: "Missing liked/ id or id is not 24 chars long"
        }
        res.status(400).send(error);
        return;
    }
    //Patch
    try {
        //Connect to the database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('posts');

        //Create a query to update
        const query = {
            _id: ObjectId(req.query.id)
        };

        //Update status
        let updateLiked = {
            liked: req.body.liked
        }
        const result = await collection.updateMany(query, {
            $set: updateLiked
        });

        //Send back successmessage
        res.status(201).send(result);
    }
    //Error
    catch (error) {
        console.log(error);
        res.status(500).send({
            error: "An error has occured",
            value: error,
        });
    }
    //End
    finally {
        await client.close();
    }
});

//////////////////////////////////////////////////////////////////////////////////////////
//Port
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})