import mongoose from 'mongoose';
import User from './backend/models/user.model.js';

// MongoDB connection (use your connection string)
const mongoURI = 'mongodb+srv://awaisc004:gjUKKeVEB2pD44Zo@cluster0.ji0zl.mongodb.net/twyster-db?retryWrites=true&w=majority&appName=Cluster0';

const addBookmarksField = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Update all users that don't have the bookmarks field
        const result = await User.updateMany(
            { themes: { $exists: false } },
            { $set: { themes: [] } }
        );
        console.log('themes field added to all users:', result);

        // Close the connection after the update
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error updating users:', error);
    }
};

// Run the function
addBookmarksField();
