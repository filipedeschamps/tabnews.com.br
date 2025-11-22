import { saveScrollPosition } from '../infra/scroll-preservation';

describe('infra/scroll-preservation', () => {
  let sessionStorageMock;

  beforeEach(() => {
    sessionStorageMock = {
      data: {},
      setItem: function(key, value) { this.data[key] = value; },
      getItem: function(key) { return this.data[key]; },
      removeItem: function(key) { delete this.data[key]; }
    };

    global.window = {
      pageYOffset: 0,
      location: { href: 'https://tabnews.com.br/test-page' },
      sessionStorage: sessionStorageMock
    };

    global.sessionStorage = sessionStorageMock;
  });

  afterEach(() => {
    delete global.window;
    delete global.sessionStorage;
  });

  describe('saveScrollPosition', () => {
    it('should save scroll position to sessionStorage', () => {
      global.window.pageYOffset = 500;
      
      saveScrollPosition();
      
      expect(sessionStorageMock.getItem('scrollPosition')).toBe('500');
    });

    it('should save current URL to sessionStorage', () => {
      global.window.pageYOffset = 300;
      
      saveScrollPosition();
      
      expect(sessionStorageMock.getItem('scrollUrl')).toBe('https://tabnews.com.br/test-page');
    });
  });
});