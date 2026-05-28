import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  console.log('MONGODB_URI present:', !!uri);

  if (!uri) {
    try {
      // @ts-ignore
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      console.log('Using in-memory MongoDB (local dev)');
      await mongoose.connect(mongod.getUri());
      console.log('MongoDB connected (in-memory)');
      return;
    } catch {
      throw new Error('MONGODB_URI env var is not set.');
    }
  }

  // Log partial URI to help debug (hides password)
  try {
    const url = new URL(uri);
    console.log(`Connecting to MongoDB: ${url.protocol}//${url.username}:***@${url.host}${url.pathname}`);
  } catch {
    console.log('Connecting to MongoDB Atlas...');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log('MongoDB connected');
}
