import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || '';

  if (!uri || uri === 'mongodb://localhost:27017/vedaai') {
    // Local dev only — mongodb-memory-server is installed locally but not in prod
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — not available in prod, only local dev
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      console.log('Using in-memory MongoDB (local dev)');
      await mongoose.connect(mongod.getUri());
      console.log('MongoDB connected');
      return;
    } catch {
      throw new Error(
        'No MONGODB_URI set. Add your MongoDB Atlas URI to the .env file.'
      );
    }
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
