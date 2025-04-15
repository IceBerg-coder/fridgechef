import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { isUsingNeonDatabase } from '@/lib/db-config';
import { getUserByEmail, queryNeon } from '@/lib/neon-db';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        // Check if using Neon Database
        const useNeonDb = isUsingNeonDatabase();
        
        if (useNeonDb) {
          try {
            // Find user by email in Neon Database
            const user = await getUserByEmail(credentials.email);
            
            if (!user) {
              console.log('User not found in Neon Database');
              throw new Error('Invalid email or password');
            }
            
            // Compare passwords
            const passwordMatch = await compare(credentials.password, user.password);
            if (!passwordMatch) {
              console.log('Password does not match');
              throw new Error('Invalid email or password');
            }
            
            // Return user without password
            return {
              id: user.id,
              name: user.name || undefined,
              email: user.email,
              image: user.image || undefined,
            };
            
          } catch (error) {
            console.error('Error authenticating with Neon Database:', error);
            throw new Error('Authentication failed');
          }
        } else {
          // Original Prisma authentication path
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          // If no user found or password doesn't match
          if (!user || !(await compare(credentials.password, user.password))) {
            throw new Error('Invalid email or password');
          }

          // Return user without password
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout', // Uncomment if you create custom signout page
    // error: '/auth/error', // Uncomment if you create custom error page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };