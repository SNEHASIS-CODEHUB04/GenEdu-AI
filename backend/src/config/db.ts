import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  console.log('MONGODB_URI present:', !!uri);

  if (!uri) {
    // Local dev fallback
    try {
      // @ts-ignore — only installed locally
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      console.log('Using in-memory MongoDB (local dev)');
      await mongoose.connect(mongod.getUri());
      console.log('MongoDB connected (in-memory)');
      return;
    } catch {
      throw new Error('MONGODB_URI env var is not set and mongodb-memory-server is unavailable.');
    }
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
