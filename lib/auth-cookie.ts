/**
 * The session cookie name, in a dependency-free module so it can be imported
 * from both the Edge middleware and the Node server code without dragging in
 * Prisma / bcrypt / server-only.
 */
export const SESSION_COOKIE = "koveline_session";
