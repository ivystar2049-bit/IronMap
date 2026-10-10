/* Thin localStorage wrapper matching the { get, set, delete } shape the
   prototype used, so call sites read the same. Async in signature only —
   localStorage itself is synchronous — but this keeps the API stable if a
   real backend ever replaces it. */

export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? undefined : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async delete(key) {
    localStorage.removeItem(key);
  },
};
