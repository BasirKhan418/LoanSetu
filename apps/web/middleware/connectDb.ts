import mongoose from 'mongoose';

let isConnecting = false;

const ConnectDb = async (): Promise<void> => {
    const readyState = mongoose.connection.readyState;
    
    if (readyState === 1) {
        return;
    }
    
    if (readyState === 2 || isConnecting) {
        await waitForConnection();
        return;
    }
    
    try {
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is required');
        }
        
        isConnecting = true;
        
        const connectionOptions = {
            bufferCommands: false,
            maxPoolSize: 10, 
            minPoolSize: 2,  
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxIdleTimeMS: 30000,
        };
        
        if (readyState === 0) {
            await mongoose.connect(mongoUri, connectionOptions);
        }
        
        isConnecting = false;
        console.log('MongoDB connected successfully');
    } catch (error) {
        isConnecting = false;
        console.error('Database connection error:', error);
        throw error;
    }
};

const waitForConnection = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (mongoose.connection.readyState === 1) {
                clearInterval(checkInterval);
                resolve();
            } else if (!isConnecting && mongoose.connection.readyState === 0) {
                clearInterval(checkInterval);
                reject(new Error('Connection failed'));
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Connection timeout'));
        }, 10000);
    });
};

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
    console.error('Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

process.on('SIGINT', async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    }
});

export default ConnectDb;