import mongoose from 'mongoose';
import Event from '../models/Event.js';
import env from '../config/env.js';

const updateDates = async () => {
  try {
    console.log('\x1b[33m[Updater] Connecting to database...\x1b[0m');
    await mongoose.connect(env.mongoUri);
    console.log('\x1b[32m[Updater] Connected successfully. Updating all event dates to the future...\x1b[0m');

    const events = await Event.find({});
    
    let count = 0;
    for (const event of events) {
      // Set the date to 30 days from now
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      event.date = futureDate;
      await event.save();
      count++;
    }

    console.log(`\x1b[32m[Updater] Successfully updated ${count} events to a future date!\x1b[0m`);
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[Updater] Failed to update dates:\x1b[0m', error.message);
    process.exit(1);
  }
};

updateDates();
