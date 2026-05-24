import mongoose from 'mongoose';
import '../../src/config/env.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ticketwave';

async function seedDB() {
  console.log('[Seeder] Connecting to database...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] Connected to MongoDB.');

    // Clear existing collections
    console.log('[Seeder] Clearing existing collection data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seeder] Collections cleared.');

    // Seed Users
    console.log('[Seeder] Creating default users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@ticketwave.com',
      password: 'Password123',
      role: 'admin'
    });

    const organizer = await User.create({
      name: 'Wave Organizers Ltd',
      email: 'organizer@ticketwave.com',
      password: 'Password123',
      role: 'organizer'
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'user@ticketwave.com',
      password: 'Password123',
      role: 'user'
    });

    console.log(`[Seeder] Users created successfully:
      - Admin: admin@ticketwave.com (Password123)
      - Organizer: organizer@ticketwave.com (Password123)
      - User: user@ticketwave.com (Password123)`);

    // Seed Events
    console.log('[Seeder] Creating mock events...');
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);

    const mockEvents = [
      {
        title: 'Grand Music Festival 2026',
        description: 'Experience an unforgettable night featuring international EDM headliners, live band acts, immersive light shows, and premium food trucks.',
        category: 'Concerts',
        date: oneMonthFromNow,
        venue: 'DY Patil Stadium',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1000',
        organizer: organizer._id,
        totalSeats: 250,
        bookedSeats: 0,
        status: 'upcoming',
        seatSections: [
          { name: 'VIP Lounge', price: 5000, totalSeats: 50, availableSeats: 50 },
          { name: 'General Arena', price: 1500, totalSeats: 200, availableSeats: 200 }
        ]
      },
      {
        title: 'Stand-up Comedy Special: Roast & Toast',
        description: 'Prepare to laugh until your sides hurt with the country\'s top stand-up comedians performing live in an intimate club setting.',
        category: 'Comedy',
        date: twoWeeksFromNow,
        venue: 'Canvas Laugh Club',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=1000',
        organizer: organizer._id,
        totalSeats: 110,
        bookedSeats: 0,
        status: 'upcoming',
        seatSections: [
          { name: 'Front Row Premium', price: 1000, totalSeats: 30, availableSeats: 30 },
          { name: 'Standard Seating', price: 500, totalSeats: 80, availableSeats: 80 }
        ]
      },
      {
        title: 'Broadway Musical: Aladdin',
        description: 'A spectacular theatrical production filled with magic, breathtaking choreography, and classic songs, direct from the broadway script.',
        category: 'Theatre',
        date: fiveDaysFromNow,
        venue: 'Kamani Auditorium',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1000',
        organizer: organizer._id,
        totalSeats: 140,
        bookedSeats: 0,
        status: 'upcoming',
        seatSections: [
          { name: 'Dress Circle', price: 3000, totalSeats: 40, availableSeats: 40 },
          { name: 'Balcony Seats', price: 1200, totalSeats: 100, availableSeats: 100 }
        ]
      },
      {
        title: 'Tech Innovators Summit 2026',
        description: 'Join developers, startup founders, venture capitalists, and technology leaders to discuss artificial intelligence, web3 development, and scaling tech architectures.',
        category: 'Conferences',
        date: twoMonthsFromNow,
        venue: 'Bangalore International Exhibition Centre',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000',
        organizer: organizer._id,
        totalSeats: 150,
        bookedSeats: 0,
        status: 'upcoming',
        seatSections: [
          { name: 'Corporate Delegate', price: 8000, totalSeats: 100, availableSeats: 100 },
          { name: 'Academic Student Pass', price: 2000, totalSeats: 50, availableSeats: 50 }
        ]
      },
      {
        title: 'Championship Football Final 2026',
        description: 'Witness the ultimate battle for glory as the top two clubs in the country clash in the championship football final match.',
        category: 'Sports',
        date: threeWeeksFromNow,
        venue: 'Salt Lake Stadium',
        city: 'kolkata',
        bannerImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000',
        organizer: organizer._id,
        totalSeats: 330,
        bookedSeats: 0,
        status: 'upcoming',
        seatSections: [
          { name: 'VIP Box Lounge', price: 4000, totalSeats: 30, availableSeats: 30 },
          { name: 'East Stand Arena', price: 800, totalSeats: 300, availableSeats: 300 }
        ]
      }
    ];

    const insertedEvents = await Event.insertMany(mockEvents);
    console.log(`[Seeder] Seeded ${insertedEvents.length} events successfully.`);

    console.log('[Seeder] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error] Failed to seed database:', error.message);
    process.exit(1);
  }
}

seedDB();
