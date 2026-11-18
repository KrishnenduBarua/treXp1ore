export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
    return res.status(409).json({ message: 'A record with these details already exists' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Images must be 5 MB or smaller' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong on the server',
  });
};
