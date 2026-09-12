const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start Express Listener
  const server = app.listen(config.port, () => {
    console.log(`FILER AI Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Handle Unhandled Promise Rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
