export const debounce =
  (fn, wait = 1000, time) =>
  (...args) => {
    clearTimeout(time);
    time = setTimeout(() => fn(...args), wait);
  };
