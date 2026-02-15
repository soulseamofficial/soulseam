import mongoose from "mongoose";

/**
 * MONGODB CONNECTION STRING FORMAT
 * 
 * Your connection string should be in this format:
 * mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
 * 
 * The connection string should explicitly specify the database name (e.g., 'soulseam').
 * Mongoose will connect to this database automatically.
 * 
 * MONGODB ATLAS CHECKLIST:
 * 1. ✅ Network Access: Add 0.0.0.0/0 (all IPs) or your specific IPs
 * 2. ✅ Database User: Create user with username and password
 * 3. ✅ User Permissions: Grant "readWrite" or "admin" role on the 'soulseam' database
 * 4. ✅ Connection String: Use the format above with the 'soulseam' database specified
 * 5. ✅ Environment Variable: Set MONGODB_URI in .env.local and Vercel
 * 
 * NOTE: If your MongoDB Atlas user is in a different authentication database (e.g., 'admin'),
 * you must add &authSource=<auth-db> to your connection string manually.
 * The connection string provided should already include this if needed.
 */

// Global connection cache for Next.js serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Validates and cleans the MongoDB connection string
 * Removes quotes and trims whitespace - Mongoose handles encoding internally
 * 
 * @param {string} uri - Raw MongoDB connection string
 * @returns {string} - Cleaned connection string
 */
function cleanConnectionString(uri) {
  if (!uri || typeof uri !== "string") {
    throw new Error("MongoDB URI must be a non-empty string");
  }

  // Trim whitespace and remove surrounding quotes if present
  uri = uri.trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Basic format validation
  if (!uri.startsWith("mongodb+srv://") && !uri.startsWith("mongodb://")) {
    throw new Error("Invalid MongoDB connection string format. Must start with mongodb:// or mongodb+srv://");
  }

  // Validate that database name is specified in the connection string
  const dbMatch = uri.match(/mongodb\+?srv?:\/\/[^/]+\/([^?]+)/);
  if (!dbMatch || !dbMatch[1]) {
    throw new Error("Database name must be specified in the connection string (e.g., /soulseam)");
  }

  return uri;
}

/**
 * Connect to MongoDB Atlas with proper configuration
 * Uses connection caching to prevent multiple connections in serverless environments
 * 
 * Mongoose automatically handles URL encoding of credentials, so we don't need
 * complex parsing logic that can cause double-encoding or parsing errors.
 */
export async function connectDB() {
  // Validate environment variable
  const rawMONGODB_URI = process.env.MONGODB_URI;
  
  if (!rawMONGODB_URI) {
    throw new Error(
      "❌ MONGODB_URI environment variable is not defined.\n" +
      "Please add it to your .env.local file (local) or Vercel environment variables (production).\n" +
      "Format: mongodb+srv://username:password@cluster.mongodb.net/soulseam?retryWrites=true&w=majority\n" +
      "The connection string must specify the 'soulseam' database name."
    );
  }

  // Clean the connection string (remove quotes, trim)
  let MONGODB_URI;
  try {
    MONGODB_URI = cleanConnectionString(rawMONGODB_URI);
  } catch (error) {
    throw new Error(
      `❌ Invalid MongoDB connection string: ${error.message}\n` +
      `Please check your .env.local file and ensure MONGODB_URI starts with mongodb:// or mongodb+srv://\n` +
      `Make sure there are no extra quotes or whitespace around the connection string.`
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
      bufferCommands: false, // Disable mongoose buffering (required for serverless)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 connections
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for better reliability
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      
      // Write concern and retry options (recommended for Atlas)
      retryWrites: true,
      w: "majority",
      
      // Disable automatic index creation in production
      // This prevents Mongoose from recreating indexes that were manually dropped
      // Indexes should be managed explicitly via migration scripts
      autoIndex: false,
      
      // TLS/SSL is automatically enabled for mongodb+srv:// connections
      // No need to specify tls/ssl options explicitly
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        const dbName = mongoose.connection.db?.databaseName || "unknown";
        console.log(
          "✅ MongoDB connected successfully to database:",
          dbName
        );
        console.log(`   Host: ${mongoose.connection.host}`);
        if (dbName !== "soulseam") {
          console.warn(`   ⚠️  Warning: Connected to '${dbName}' instead of 'soulseam'. Verify your connection string.`);
        }
        return mongoose;
      })
      .catch((error) => {
        // Enhanced error logging with actionable guidance
        console.error("❌ MongoDB connection failed:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        // Mask the connection string in logs (security)
        const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ":****@");
        console.error("Connection string (masked):", maskedUri);
        
        // Provide specific error guidance
        if (error.name === "MongoServerSelectionError") {
          console.error(
            "\n⚠️  SERVER SELECTION ERROR - This usually means:\n" +
            "   1. Your IP address is not whitelisted in MongoDB Atlas\n" +
            "      → Go to MongoDB Atlas → Network Access → Add IP Address\n" +
            "      → For development: Add 0.0.0.0/0 (allows all IPs)\n" +
            "      → For production: Add specific IPs or Vercel IP ranges\n" +
            "   2. Network connectivity issues\n" +
            "   3. DNS resolution problems\n" +
            "   4. Firewall blocking MongoDB ports (27017, 27015-27019)"
          );
        } else if (error.name === "MongoAuthenticationError" || 
                   (error.name === "MongoServerError" && error.message?.includes("bad auth"))) {
          console.error(
            "\n⚠️  AUTHENTICATION ERROR - Check:\n" +
            "   1. Username and password are correct in MongoDB Atlas\n" +
            "   2. User has proper permissions (readWrite or admin role) on the 'soulseam' database\n" +
            "   3. User exists in MongoDB Atlas Database Access\n" +
            "   4. Connection string specifies the correct database name: /soulseam\n" +
            "   5. If your user is in a different authentication database, add &authSource=<auth-db> to the connection string\n" +
            "      → Verify in MongoDB Atlas → Database Access → Check 'Authentication Database' column"
          );
        } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("getaddrinfo")) {
          console.error(
            "\n⚠️  DNS RESOLUTION ERROR:\n" +
            "   1. Check your internet connection\n" +
            "   2. Verify the cluster hostname is correct\n" +
            "   3. Try pinging the cluster hostname\n" +
            "   4. Check if you're behind a corporate firewall/proxy"
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
