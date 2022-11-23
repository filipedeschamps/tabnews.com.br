(function () {
  var storageKey = 'themeStore';
  var defaultTheme = 'light';

  function setClassOnDocumentBody(theme) {
    document.getElementsByTagName('html')[0].setAttribute('theme', theme);
    localStorage.setItem(storageKey, theme);
  }

  var localStorageTheme = null;

  try {
    localStorageTheme = localStorage.getItem(storageKey);
  } catch (err) {}

  var localStorageExists = localStorageTheme !== null;

  setClassOnDocumentBody(localStorageExists ? localStorageTheme : defaultTheme);
})();
