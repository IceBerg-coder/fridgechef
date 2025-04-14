// Script to run Prisma migrations on Vercel deployment
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  try {
    console.log('Running database migrations...');
    
    // Run Prisma migrations
    const { stdout: migrateStdout, stderr: migrateStderr } = await execAsync('npx prisma migrate deploy');
    
    if (migrateStderr) {
      console.error('Migration stderr:', migrateStderr);
    }
    
    console.log('Migration stdout:', migrateStdout);
    console.log('Database migrations completed successfully');
    
    // Optional: Seed the database if needed
    // const { stdout: seedStdout, stderr: seedStderr } = await execAsync('npx prisma db seed');
    // console.log('Database seeding completed');
    
  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  }
}

main();