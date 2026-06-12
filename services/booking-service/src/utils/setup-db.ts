import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setup() {
  try {
    console.log('Enabling btree_gist extension...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS btree_gist;');

    console.log('Adding GiST exclusion constraint to bookings table...');
    // Note: This needs to be done on the actual table name which might include schema
    // In our schema.prisma, bookings is in the "booking" schema and mapped to "bookings" table.
    // So the full name is booking.bookings
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE booking.bookings
      DROP CONSTRAINT IF EXISTS booking_no_overlap;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE booking.bookings
      ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist (
        vehicle_id WITH =,
        tstzrange(start_time, end_time) WITH &&
      )
      WHERE (status NOT IN ('cancelled', 'completed', 'no_show'));
    `);

    console.log('Database setup complete.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
