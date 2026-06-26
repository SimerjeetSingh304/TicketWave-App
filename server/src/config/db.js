import mongoose from 'mongoose';
import env from './env.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`\x1b[32m[Database] MongoDB Connected: ${conn.connection.host}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m[Database] Connection Error: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

export default connectDB;
