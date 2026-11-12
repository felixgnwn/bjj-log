// Thrown by the service when something doesn't exist.
// The service doesn't know about HTTP, so it doesn't say "404".
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
