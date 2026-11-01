export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') error = new ApiError(400, 'El cuerpo contiene JSON inválido.');
  if (error.type === 'entity.too.large') error = new ApiError(413, 'El cuerpo supera el límite de 100 KB.');
  if (/UNIQUE constraint failed/.test(error.message)) error = new ApiError(409, 'El nombre, serial o URL ya está registrado.');
  if (/FOREIGN KEY constraint failed/.test(error.message)) error = new ApiError(409, 'El registro está relacionado con media y no se puede eliminar.');
  if (/REFERENCIA_INACTIVA/.test(error.message)) error = new ApiError(422, 'La referencia debe estar activa.');
  if (!error.status) console.error(error);
  res.status(error.status || 500).json({ error: {
    mensaje: error.status ? error.message : 'Error interno del servidor.',
    ...(error.details ? { detalles: error.details } : {})
  } });
}
