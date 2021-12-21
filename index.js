//npm start

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

const app = express()
const port = process.env.PORT;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());

//Root route
app.get('/', (req, res) => {
    //res.status(300).redirect('/info.html');
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

        //validation for double artpieces 
        if (req.body.type == "colour") {
            const myDoc = await collection.findOne({
                code1: req.body.code1,
                code2: req.body.code2,
                code3: req.body.code3,
                code4: req.body.code4,
            });
            // Find document 
            if (myDoc) {
                res.status(400).send('Bad request: these colours already exists');
                return; //cause we don't want the code to continue
            }
        } else {
            const myDoc = await collection.findOne({
                url: req.body.url,
            });
            // Find document 
            if (myDoc) {
                res.status(400).send('Bad request: this photo already exists');
                return; //cause we don't want the code to continue
            }
        }

        //save new artpiece
        if (req.body.type == "colour") {
            let colours = {
                type: "colours",
                code1: req.body.code1,
                code2: req.body.code2,
                code3: req.body.code3,
                code4: req.body.code4,
                status: "saved"
            }

            //insert into database
            let insertResult = await collection.insertOne(colours);

            //send back succes message
            res.status(201).json(colours);
            console.log(colours)
            return;
        } else {
            let photo = {
                type: "photo",
                author: req.body.author,
                url: req.body.url,
                status: "saved"
            }

            //insert into database
            let insertResult = await collection.insertOne(photo);

            //send back succes message
            res.status(201).json(photo);
            console.log(photo)
            return;
        }

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
//DOESN4T WORK - to delete:61bcdb7fdfc54479eb76e459
app.delete('/artpieces/:id', async (req, res) => {
    if (!req.params.id || req.params.id.length != 24) {
        res.status(400).send('bad result, missing id or id is not 24 chars long');
        return;
    }
    try {
        //Connect to database
        await client.connect();

        //Collect data from artpiece with this ID
        const collection = client.db('course-project').collection('artpieces');

        // Create a query for a challenge to delete
        const query = {
            _id: ObjectId(req.params.id)
        };
        const message = {
            deleted: "Challenge deleted"
        }

        // Deleting the challenge
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
app.put("/artpieces/:id", async (req, res) => {
    // check for body data
    const error = {
        error: "Bad request",
        value: "Missing status"
    }

    if (!req.body.status) {
        res.status(400).send(error);
        return;
    }
    try {
        //connect to the database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('artpieces');

        // Create a query for a challenge to update
        const query = {
            _id: ObjectId(req.params.id)
        };
        const message = {
            deleted: "Challenge updated"
        }
        //update colours
        if (req.body.type == "colour") {
            let updateColours = {
                type: "colours",
                code1: req.body.code1,
                code2: req.body.code2,
                code3: req.body.code3,
                code4: req.body.code4,
                status: !req.body.status
            }
            console.log(query, updateColours);
            // Updating the artpiece
            const result = await collection.updateOne(query, {
                $set: updateColours
            });
            // Send back success message
            res.status(201).send(result);

        }
        //update photo
        else {
            let updatePhoto = {
                type: "photo",
                author: req.body.author,
                url: req.body.url,
                status: !req.body.status
            }
            console.log(query, updatePhoto);
            // Updating the artpiece
            const result = await collection.updateOne(query, {
                $set: updatePhoto
            });
            // Send back success message
            res.status(201).send(result);
        }

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

////////////////////////////////////POSTS/////////////////////////////////////////////////

//Return all posts
app.get('/posts', async (req, res) => {
    try {
        //Connect to database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('posts');
        const post = await collection.find({}).toArray();

        //Send back the data from the artpieces
        res.status(200).send(post);
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

//Return one post
app.get('/posts/:id', async (req, res) => {
    try {
        //Connect to database
        await client.connect();

        //Collect data from artpiece with this ID
        const collection = client.db('course-project').collection('posts');
        const query = {
            _id: ObjectId(req.query.id)
        };
        const post = await collection.findOne(query);

        //Check whether artpiece with this ID exists
        if (post) {
            //send back file
            res.status(200).send(post);
            return;
        } else {
            res.status(400).send('Post could not be found with id:' + req.params.id);
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
app.post('/posts', async (req, res) => {
    if (!req.body.type) {
        res.status(400).send('bad result, missing type');
        return;
    }

    try {
        //Connect to database
        await client.connect();

        //Collect all data from artpieces
        const collection = client.db('course-project').collection('posts');

        //validation for double artpieces 
        if (req.body.type == "colour") {
            const myDoc = await collection.findOne({
                code1: req.body.code1,
                code2: req.body.code2,
                code3: req.body.code3,
                code4: req.body.code4,
            });
            // Find document 
            if (myDoc) {
                res.status(400).send('Bad request: these colours already exists');
                return; //cause we don't want the code to continue
            }
        } else {
            const myDoc = await collection.findOne({
                url: req.body.url,
            });
            // Find document 
            if (myDoc) {
                res.status(400).send('Bad request: this photo already exists');
                return; //cause we don't want the code to continue
            }
        }

        //save new artpiece
        if (req.body.type == "colour") {
            let colours = {
                type: "colours",
                code1: req.body.code1,
                code2: req.body.code2,
                code3: req.body.code3,
                code4: req.body.code4,
                status: "saved"
            }

            //insert into database
            let insertResult = await collection.insertOne(colours);

            //send back succes message
            res.status(201).json(colours);
            console.log(colours)
            return;
        } else {
            let photo = {
                type: "photo",
                author: req.body.author,
                url: req.body.url,
                status: "saved"
            }

            //insert into database
            let insertResult = await collection.insertOne(photo);

            //send back succes message
            res.status(201).json(photo);
            console.log(photo)
            return;
        }

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


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})