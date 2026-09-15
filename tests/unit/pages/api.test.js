import apiRoutes from 'tests/api-routes';

// Forgetting the cache policy in a new route fails silently: the response stays cacheable by the
// CDN without anything on the server complaining. This test turns that into a CI error, and is also
// what guarantees the `models/cache-control.js` guard is reached by every route.
describe('pages/api', () => {
  describe('Cache policy', () => {
    it('should be declared by every method of every route', () => {
      const methodsWithoutPolicy = apiRoutes()
        .filter(({ policy }) => !policy)
        .map(({ endpoint }) => endpoint);

      expect(methodsWithoutPolicy).toStrictEqual([]);
    });
  });
});
