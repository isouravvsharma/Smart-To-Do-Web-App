// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).render('error', { 
    error: message,
    status: status
  });
};

module.exports = errorHandler;
