import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import env from '../config/env.js';

const seedData = async () => {
  try {
    console.log('\x1b[33m[Seeder] Connecting to database...\x1b[0m');
    await mongoose.connect(env.mongoUri);
    console.log('\x1b[32m[Seeder] Connected successfully. Cleaning collections...\x1b[0m');

    // Wipe old mock data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seeder] Database clean. Creating base user profiles (password is "password123")...');

    // Password hashing occurs inside the User model pre-save hook
    const admin = new User({
      name: 'System Admin',
      email: 'admin@ticketwave.com',
      password: 'password123',
      role: 'admin'
    });

    const organizer = new User({
      name: 'Elite Entertainment Inc',
      email: 'organizer@ticketwave.com',
      password: 'password123',
      role: 'organizer'
    });

    const regularUser = new User({
      name: 'John Doe',
      email: 'user@ticketwave.com',
      password: 'password123',
      role: 'user'
    });

    await admin.save();
    await organizer.save();
    await regularUser.save();

    console.log('[Seeder] User profiles seeded. Adding mock events...');

    const mockEvents = [
      {
        title: 'Rock On The Wave Festival',
        description: 'A spectacular open-air rock concert featuring top-tier indie and mainstream rock bands. Live food stalls, merchandise hubs, and an electric crowd.',
        category: 'Concerts',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        venue: 'Wave Arena, Bandra',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'VIP Lounge', price: 2500, totalSeats: 20, availableSeats: 20 },
          { name: 'General Admission', price: 799, totalSeats: 80, availableSeats: 80 }
        ]
      },
      {
        title: 'TechWave Developer Summit 2026',
        description: 'The largest regional assembly of software developers and architects. Tracks on cloud infrastructures, modern fullstack engineering, and performance cache frameworks.',
        category: 'Conferences',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        venue: 'Convention Center, Whitefield',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Premium Pass', price: 1500, totalSeats: 15, availableSeats: 15 },
          { name: 'Standard Ticket', price: 499, totalSeats: 60, availableSeats: 60 }
        ]
      },
      {
        title: 'Stand-Up Stand-Out Comedy Night',
        description: 'Laugh your heart out with the country\'s top comics returning to stage with new trials, crowd interactions, and hilarious anecdotes.',
        category: 'Comedy',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        venue: 'The Laugh Factory, Connaught Place',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Front Rows VIP', price: 1200, totalSeats: 12, availableSeats: 12 },
          { name: 'Balcony Seats', price: 399, totalSeats: 48, availableSeats: 48 }
        ]
      },
      {
        title: 'Symphony Concert by the Bay',
        description: 'Enjoy calming classical symphonies composed by the greats (Bach, Chopin, Mozart) performed under direct moonlight overlooking the beautiful seaside view.',
        category: 'Music',
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        venue: 'Seaside Pavilion auditorium',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Platinum Row', price: 3000, totalSeats: 10, availableSeats: 10 },
          { name: 'Gold Row', price: 1200, totalSeats: 40, availableSeats: 40 }
        ]
      },
      {
        title: 'Championship Finals 2026',
        description: 'Experience the thrill of the ultimate football championship clash live from the stadium. High stakes, incredible energy, and unforgettable moments.',
        category: 'Sports',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        venue: 'National Arena',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Court-side VIP', price: 5000, totalSeats: 20, availableSeats: 20 },
          { name: 'General Stands', price: 900, totalSeats: 150, availableSeats: 150 }
        ]
      },
      {
        title: 'Modern Art Expo & Gallery',
        description: 'A walkthrough of contemporary, thought-provoking art pieces from emerging and established artists across the globe.',
        category: 'Exhibitions',
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        venue: 'City Art Museum',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Guided Tour', price: 1500, totalSeats: 30, availableSeats: 30 },
          { name: 'General Entry', price: 400, totalSeats: 100, availableSeats: 100 }
        ]
      }
    ];

    for (const item of mockEvents) {
      const totalSeats = item.seatSections.reduce((sum, sec) => sum + sec.totalSeats, 0);
      const event = new Event({
        ...item,
        totalSeats
      });
      await event.save();
    }

    console.log('\x1b[32m[Seeder] Mock Database successfully initialized with 3 users and 5 events!\x1b[0m');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[Seeder] Failed to run database seed:\x1b[0m', error.message);
    process.exit(1);
  }
};

seedData();
