const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8080;

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'unauthorized' });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db('healnycdb');
    const doctorsCollection = db.collection('doctors');
    const bookingCollection = db.collection('booking');

    app.get('/doctors', async (req, res) => {
      const { searchTerm } = req.query;
      let cursor;

      if (searchTerm) {
        cursor = doctorsCollection.find({
          $or: [
            {
              name: {
                $regex: searchTerm,
                $options: 'i',
              },
            },
            {
              specialty: {
                $regex: searchTerm,
                $options: 'i',
              },
            },
          ],
        });
      } else {
        cursor = doctorsCollection.find();
      }

      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/toprated', async (req, res) => {
      const query = { id: { $in: ['d1', 'd2', 'd8'] } };
      const cursor = doctorsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/doctors/:doctorsId', verifyToken, async (req, res) => {
      const doctorsId = req.params.doctorsId;
      const query = { _id: new ObjectId(doctorsId) };
      const result = await doctorsCollection.findOne(query);
      res.send(result);
    });

    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    });

    app.get('/booking/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch('/booking/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.send(result);
    });

    app.delete('/booking/:id', verifyToken, async (req, res) => {
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
