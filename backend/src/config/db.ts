import mongoose from 'mongoose';

export async function connectDB() {
  let uri = process.env.MONGODB_URI || '';

  // If no real URI provided, spin up an in-memory MongoDB
  if (!uri || uri === 'mongodb://localhost:27017/vedaai') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using in-memory MongoDB (local dev)');
    } catch (err) {
      console.error('Failed to start in-memory MongoDB:', err);
      throw err;
    }
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
