export function getInitColorSchemeScript() {
  const codeToRunOnClient = `
    (() => {
      const theme = localStorage.getItem('theme');

      if (theme) {
        document
          .querySelector('html')
          .setAttribute('data-theme', theme);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: codeToRunOnClient }} />;
}
