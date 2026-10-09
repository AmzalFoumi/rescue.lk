// Ids are 24-character hex strings (MongoDB ObjectIds). Checking the shape
// here keeps an id that cannot exist out of the database and makes it a plain
// "not found" instead of a server error.
const OBJECT_ID_FORMAT = /^[0-9a-f]{24}$/i;

export function isObjectId(id: string): boolean {
  return OBJECT_ID_FORMAT.test(id);
}
