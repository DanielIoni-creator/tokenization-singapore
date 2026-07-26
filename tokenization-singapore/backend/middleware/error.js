// middleware/error.js
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  
  const t = req.t || ((key) => key);
  
  const statusCode = err.statusCode || 500;
  const message = err.translationKey ? 
    t(err.translationKey, err.params) : 
    t('errors.internal_server');
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
