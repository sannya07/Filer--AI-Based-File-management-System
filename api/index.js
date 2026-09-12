let app;
let initError = null;

try {
  app = require('../server/app');
} catch (err) {
  initError = err;
  console.error('Fatal initialization error in Vercel serverless:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        status: 'error',
        message: 'Backend server failed to initialize on Vercel',
        detail: initError.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : initError.stack
      })
    );
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('Unhandled request error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        status: 'error',
        message: 'Unhandled error while processing request',
        detail: err.message
      })
    );
  }
};
