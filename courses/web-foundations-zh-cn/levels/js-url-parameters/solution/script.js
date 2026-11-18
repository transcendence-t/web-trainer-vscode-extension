function readFilters(query) {
  const params = new URLSearchParams(query);
  return { q: params.get('q') ?? '', tags: params.getAll('tag') };
}
