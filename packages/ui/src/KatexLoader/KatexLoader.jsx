export function KatexLoader() {
  return (
    <>
      <link
        rel="preload"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
        as="style"
        integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP"
        crossOrigin="anonymous"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            var katexLink = document.currentScript.previousElementSibling;
            katexLink.onload = function () {
              this.onload = null;
              this.rel = 'stylesheet';
            };
          `,
        }}
      />
    </>
  );
}
