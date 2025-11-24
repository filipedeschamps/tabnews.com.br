# @tabnews/ui

## Configure Next.js

In your `next.config.js`, add `@primer/react` and `@tabnews/ui` to `transpilePackages`:

```js
// next.config.js
module.exports = {
  transpilePackages: ['@primer/react', '@tabnews/ui'],
};
```

## Theme Setup

To configure theming, first import the global CSS file in your main application file:

```js
// app/layout.js (App Router) or pages/_app.js (Pages Router)
import '@tabnews/ui/css';
```

The library provides two properties for theme control:

- `colorMode`: Sets a fixed theme, such as "dark" or "light", preventing automatic switching.
- `defaultColorMode`: Enables automatic switching based on the user’s preference (light/dark mode).

The usage of these properties depends on which **Next.js router** you are using:

### App Router

In the **App Router**, wrap your app with `PrimerRoot`. This component creates the base structure for the `<html>`, so it also accepts the `lang` attribute. You can use either `defaultColorMode` (for automatic switching) or `colorMode` (for a fixed theme):

```js
// app/layout.js
import { PrimerRoot } from '@tabnews/ui';
import '@tabnews/ui/css';

export default function Layout({ children }) {
  return (
    <PrimerRoot
      lang="en"
      defaultColorMode="dark" // Enables theme switching
      // colorMode="dark" // Uses a fixed theme
    >
      {children}
    </PrimerRoot>
  );
}
```

### Pages Router

In **Pages Router**, you must add `_document.js` to ensure proper theme setup:

```js
// pages/_document.js
export { Document as default } from '@tabnews/ui/document';
```

In `_app.js`, you can use either `AutoThemeProvider` or `ThemeProvider`:

1. If you want to use **theme switching**, wrap your app with `AutoThemeProvider` and pass the `defaultColorMode` property:

```js
// pages/_app.js
import { AutoThemeProvider } from '@tabnews/ui';
import '@tabnews/ui/css';

export default function NextApp({ Component, pageProps }) {
  return (
    <AutoThemeProvider defaultColorMode="dark">
      <Component {...pageProps} />
    </AutoThemeProvider>
  );
}
```

2. If you want to use a **fixed theme**, wrap your app with `ThemeProvider` and pass the `colorMode` property:

```js
// pages/_app.js
import { ThemeProvider } from '@tabnews/ui';
import '@tabnews/ui/css';

export default function NextApp({ Component, pageProps }) {
  return (
    <ThemeProvider colorMode="dark">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

> **Note**: Although `AutoThemeProvider` supports setting a fixed theme using `colorMode`, it is recommended to use `ThemeProvider` instead when a fixed theme is required. This ensures that the theme is applied immediately.

## Configure Vitest

In `vitest.config.js`, set `test.server.deps.inline` to `true`:

```js
// vitest.config.js
test.server.deps.inline: true
```
