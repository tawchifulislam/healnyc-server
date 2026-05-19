const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8080;

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    const db = client.db('healnycdb');
    const doctorsCollection = db.collection('doctors');
    const bookingCollection = db.collection('booking');

    app.get('/doctors', async (req, res) => {
      const cursor = doctorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/toprated', async (req, res) => {
      const query = { id: { $in: ['d1', 'd2', 'd8'] } };
      const cursor = doctorsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/doctors/:doctorsId', async (req, res) => {
      const doctorsId = req.params.doctorsId;
      const query = { _id: new ObjectId(doctorsId) };
      const result = await doctorsCollection.findOne(query);
      res.send(result);
    });

    app.post('/booking', async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);

      res.json(result);
    });

    app.get('/booking/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch('/booking/:id', async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.send(result);
    });

    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
