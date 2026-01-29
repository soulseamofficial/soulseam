import mongoose from "mongoose";

/**
 * MONGODB CONNECTION STRING FORMAT
 * 
 * Your connection string should be in this format:
 * mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
 * 
 * EXAMPLE (your current string):
 * mongodb+srv://soulseamofficial_db_user:Soulseamssm@cluster0.ypitncs.mongodb.net/soulseam
 * 
 * URL ENCODING FOR SPECIAL CHARACTERS:
 * If your username or password contains special characters, you MUST URL-encode them:
 *   @ → %40
 *   : → %3A
 *   / → %2F
 *   ? → %3F
 *   # → %23
 *   [ → %5B
 *   ] → %5D
 *   % → %25
 *   & → %26
 *   = → %3D
 *   + → %2B
 *   space → %20
 * 
 * Example: If password is "P@ssw:rd#123", use "P%40ssw%3Ard%23123"
 * 
 * You can use JavaScript's encodeURIComponent() function to encode:
 *   const encodedPassword = encodeURIComponent("P@ssw:rd#123");
 *   const uri = `mongodb+srv://user:${encodedPassword}@cluster.mongodb.net/db`;
 * 
 * MONGODB ATLAS CHECKLIST:
 * 1. ✅ Network Access: Add your IP (0.0.0.0/0 for all IPs, or specific IPs)
 * 2. ✅ Database User: Create user with username and password
 * 3. ✅ User Permissions: Grant "readWrite" or "admin" role to the database
 * 4. ✅ Connection String: Copy from Atlas → Connect → Connect your application
 * 5. ✅ Environment Variable: Set MONGODB_URI in .env.local (local) and Vercel (production)
 */

// Global connection cache for Next.js serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB Atlas with proper configuration
 * Uses connection caching to prevent multiple connections in serverless environments
 */
export async function connectDB() {
  // Validate environment variable
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error(
      "❌ MONGODB_URI environment variable is not defined. " +
      "Please add it to your .env.local file or Vercel environment variables."
    );
  }

  // Return existing connection if already connected
  if (cached.conn) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      // Connection options for MongoDB Atlas
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      
      // Write concern and retry options (recommended for Atlas)
      retryWrites: true,
      w: "majority",
      
      // TLS/SSL is automatically enabled for mongodb+srv:// connections
      // No need to specify tls/ssl options explicitly
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log(
          "✅ MongoDB connected successfully to:",
          mongoose.connection.db?.databaseName || "database"
        );
        return mongoose;
      })
      .catch((error) => {
        // Enhanced error logging
        console.error("❌ MongoDB connection failed:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        // Provide specific error guidance
        if (error.name === "MongoServerSelectionError") {
          console.error(
            "⚠️  This usually means:\n" +
            "   1. Your IP address is not whitelisted in MongoDB Atlas\n" +
            "   2. Network connectivity issues\n" +
            "   3. DNS resolution problems\n" +
            "   → Check MongoDB Atlas Network Access settings"
          );
        } else if (error.name === "MongoAuthenticationError") {
          console.error(
            "⚠️  Authentication failed. Check:\n" +
            "   1. Username and password are correct\n" +
            "   2. Special characters in password are URL-encoded\n" +
            "   3. User has proper permissions (readWrite or admin)\n" +
            "   → Verify credentials in MongoDB Atlas Database Access"
          );
        } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("getaddrinfo")) {
          console.error(
            "⚠️  DNS resolution failed:\n" +
            "   1. Check your internet connection\n" +
            "   2. Verify the cluster hostname is correct\n" +
            "   3. Try using the standard connection string instead of SRV"
          );
        }
        
        // Clear the promise so we can retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
