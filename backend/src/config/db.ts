import mongoose from 'mongoose';

export async function connectDB() {
  const raw = process.env.MONGODB_URI || '';

  if (!raw) {
    try {
      // @ts-ignore
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      console.log('Using in-memory MongoDB (local dev)');
      await mongoose.connect(mongod.getUri());
      console.log('MongoDB connected (in-memory)');
      return;
    } catch {
      throw new Error('MONGODB_URI not set.');
    }
  }

  // Ensure database name is in the URI
  let uri = raw;
  try {
    const url = new URL(raw);
    // If pathname is just '/' or empty, add the db name
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/vedaai';
      uri = url.toString();
    }
    console.log(`Connecting: ${url.protocol}//${url.username}:***@${url.host}${url.pathname}`);
  } catch {
    console.log('Connecting to MongoDB...');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    dbName: 'vedaai',
  });
  console.log('MongoDB connected ✅');
}
