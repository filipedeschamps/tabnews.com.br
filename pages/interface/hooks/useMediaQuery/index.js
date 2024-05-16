import debounce from 'lodash/debounce';
import { useSyncExternalStore } from 'react';

import mediaQueries from './media-queries';

const mediaQueryCleanerRegex = /(@media screen and |\{\})/g;
const externalStore = new Map();

const updateStore = (mq, value) => {
  externalStore.set(mq, value);
};

const cleanMediaQueryString = (mediaQueryString) => {
  if (Array.isArray(mediaQueryString)) {
    return mediaQueryString.join('').replace(mediaQueryCleanerRegex, '');
  } else {
    return mediaQueryString.replace(mediaQueryCleanerRegex, '');
  }
};

const subscribeToMediaQuery = (mq, callback) => {
  const query = typeof mediaQueries[mq] === 'function' ? cleanMediaQueryString(mediaQueries[mq]``) : mq;
  if (typeof window !== 'undefined') {
    const mediaQueryList = window.matchMedia(query);

    const handleChange = debounce(() => {
      updateStore(mq, mediaQueryList.matches);
      callback();
    }, 300);

    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }
};

const useMediaQuery = (mq) => {
  if (!externalStore.has(mq)) {
    const query = typeof mediaQueries[mq] === 'function' ? cleanMediaQueryString(mediaQueries[mq]``) : mq;

    if (typeof window !== 'undefined') {
      const initialMatch = window.matchMedia(query).matches;
      updateStore(mq, initialMatch);
    }
  }

  const getSnapshot = () => externalStore.get(mq) ?? false;
  const subscribe = (callback) => subscribeToMediaQuery(mq, callback);

  return useSyncExternalStore(subscribe, getSnapshot, () => getSnapshot());
};

export default useMediaQuery;
