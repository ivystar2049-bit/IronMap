// We can't hardcode specific Athlean-X video URLs per exercise — there's no
// way to verify a real, current video ID for each one without risking dead
// or mismatched links. Instead we generate a live search scoped to his
// channel, which always resolves and always stays current. Custom exercises
// can carry a user-supplied videoUrl (e.g. a specific video they found via
// that search) which takes priority when present.
export function athleanXSearchUrl(name) {
  return `https://www.youtube.com/@athleanx/search?query=${encodeURIComponent(name)}`;
}

export function tutorialUrlFor(ex) {
  return ex.videoUrl || athleanXSearchUrl(ex.name);
}

export function tutorialLabelFor(ex) {
  return ex.videoUrl ? "Watch tutorial" : "Search Athlean-X";
}
