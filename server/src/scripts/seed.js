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
      // --- CONCERTS (3 events) ---
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
        title: 'Electric Skyline EDM Carnival',
        description: 'An electrifying night of international EDM producers, state-of-the-art lasers, visual fireworks, and world-class bass drops.',
        category: 'Concerts',
        date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        venue: 'Ezone Club Arena, Marathahalli',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Fan Pit VIP', price: 3200, totalSeats: 15, availableSeats: 15 },
          { name: 'Arena Dancefloor', price: 999, totalSeats: 100, availableSeats: 100 }
        ]
      },
      {
        title: 'Echoes of Autumn Indie Fest',
        description: 'A soulful open-air indie gathering celebrating acoustic songwriting, indie folk, and emerging breakthrough voices.',
        category: 'Concerts',
        date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
        venue: 'Jawaharlal Nehru Stadium Grounds',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Front Stage Pass', price: 1800, totalSeats: 25, availableSeats: 25 },
          { name: 'Lawn Standing', price: 650, totalSeats: 90, availableSeats: 90 }
        ]
      },

      // --- SPORTS (3 events) ---
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
        title: 'Pro Cricket League: Super Derby',
        description: 'The iconic high-intensity metropolitan cricket showdown under floodlights. High-velocity sixes, packed cheering stands, and thrilling finishes.',
        category: 'Sports',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        venue: 'Wankhede Stadium, Churchgate',
        city: 'mumbai',
        bannerImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBwxTnR1_AdfH2nHebBXTznvA_mX6g_p51oiPsyxWrM5_5NUh7yVOaP3Kx&s=10',
        organizer: organizer._id,
        seatSections: [
          { name: 'Pavilion VIP', price: 4500, totalSeats: 25, availableSeats: 25 },
          { name: 'East Stand', price: 800, totalSeats: 120, availableSeats: 120 }
        ]
      },
      {
        title: 'All-Star Basketball Invitational',
        description: 'High-flying slam dunks, fastbreaks, and court battles as top basketball teams face off in an intense invitational tournament.',
        category: 'Sports',
        date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        venue: 'Kanteerava Indoor Stadium',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Courtside Row', price: 3200, totalSeats: 16, availableSeats: 16 },
          { name: 'Tier 1 Seats', price: 650, totalSeats: 80, availableSeats: 80 }
        ]
      },

      // --- COMEDY (3 events) ---
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
        title: 'Late Night Improv & Roast Arena',
        description: 'Unfiltered, completely unscripted improvisational comedy and friendly roasts from leading stand-up comedy veterans.',
        category: 'Comedy',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        venue: 'Canvas Laugh Club, Lower Parel',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'VIP Tables', price: 999, totalSeats: 15, availableSeats: 15 },
          { name: 'Club Seating', price: 450, totalSeats: 50, availableSeats: 50 }
        ]
      },
      {
        title: 'The Punchline Showcase: Live Special',
        description: 'A 90-minute riot of razor-sharp observational humor, political satires, and relatable everyday slice-of-life comedy.',
        category: 'Comedy',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Chowdiah Memorial Hall, Malleshwaram',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Gold Class', price: 850, totalSeats: 20, availableSeats: 20 },
          { name: 'Balcony', price: 350, totalSeats: 60, availableSeats: 60 }
        ]
      },

      // --- MUSIC (3 events) ---
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
        title: 'Midnight Jazz & Soul Sessions',
        description: 'Atmospheric dim-lit jazz session featuring live saxophone solos, soulful vocal standards, and smooth upright bass rhythms.',
        category: 'Music',
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        venue: 'Blue Frog Club, Indiranagar',
        city: 'bangalore',
        bannerImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Table VIP', price: 2000, totalSeats: 18, availableSeats: 18 },
          { name: 'Standing Lounge', price: 600, totalSeats: 70, availableSeats: 70 }
        ]
      },
      {
        title: 'Acoustic Sunset Unplugged Live',
        description: 'An intimate candlelit acoustic experience featuring sublime guitars, string quartets, and pure melodic performances.',
        category: 'Music',
        date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        venue: 'Siri Fort Auditorium, August Kranti Marg',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Orchestra Front', price: 1800, totalSeats: 20, availableSeats: 20 },
          { name: 'Rear Mezzanine', price: 550, totalSeats: 80, availableSeats: 80 }
        ]
      },

      // --- EXHIBITIONS (3 events) ---
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
      },
      {
        title: 'Cosmic Wonders: Interactive Space Expo',
        description: 'An immersive 360-degree exhibition on space exploration, deep-sky nebula photography, VR planetary landings, and astrophysics.',
        category: 'Exhibitions',
        date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        venue: 'Nehru Planetarium & Science Park',
        city: 'delhi',
        bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Full Immersive Pass', price: 1100, totalSeats: 30, availableSeats: 30 },
          { name: 'Explorer Pass', price: 399, totalSeats: 90, availableSeats: 90 }
        ]
      },
      {
        title: 'Heritage & Sculptures Biennale 2026',
        description: 'A curated showcase of ancient and modern monumental stone carvings, bronze castings, and preserved architectural treasures.',
        category: 'Exhibitions',
        date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        venue: 'National Gallery of Modern Art, Colaba',
        city: 'mumbai',
        bannerImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80',
        organizer: organizer._id,
        seatSections: [
          { name: 'Curator Tour', price: 1600, totalSeats: 25, availableSeats: 25 },
          { name: 'General Entry', price: 450, totalSeats: 100, availableSeats: 100 }
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

    console.log(`\x1b[32m[Seeder] Mock Database successfully initialized with 3 users and ${mockEvents.length} events (3 per category)!\x1b[0m`);
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[Seeder] Failed to run database seed:\x1b[0m', error.message);
    process.exit(1);
  }
};

seedData();
