const imageIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M16 13.25A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75ZM1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM3.5 6.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm6.905 2.805a.75.75 0 0 1 1.06-.03l2.035 1.907V13H2.5v-1.586l2.56-2.56a.75.75 0 0 1 1.06 0L8.253 11l2.152-1.695Z"/></svg>';

const PLACEHOLDER = '![⏳ Enviando imagem...]()';

/**
 * Plugin para upload de imagens no editor ByteMD (CodeMirror 5)
 * @returns {import('bytemd').BytemdPlugin}
 */
export function imageUploadPlugin() {
  return {
    actions: [
      {
        title: 'Upload de Imagem (ImgBB)',
        icon: imageIcon,
        handler: {
          type: 'action',
          click(ctx) {
            const { editor } = ctx;

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp';
            input.style.display = 'none';

            input.onchange = async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (file.size > 32 * 1024 * 1024) {
                alert('Imagem muito grande! O tamanho máximo é 32MB.');
                return;
              }

              // Inserir placeholder no editor usando a API do CodeMirror 5
              const cursor = editor.getCursor();
              editor.replaceRange(`\n${PLACEHOLDER}\n`, cursor);
              editor.focus();

              try {
                const base64 = await fileToBase64(file);

                const response = await fetch('/api/v1/images/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: base64 }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Erro ao fazer upload da imagem.');
                }

                const data = await response.json();
                const imageMarkdown = `![${file.name}](${data.url})`;

                // Buscar e substituir o placeholder no conteúdo inteiro
                const fullText = editor.getValue();
                const placeholderIndex = fullText.indexOf(PLACEHOLDER);

                if (placeholderIndex !== -1) {
                  const fromPos = editor.posFromIndex(placeholderIndex);
                  const toPos = editor.posFromIndex(placeholderIndex + PLACEHOLDER.length);
                  editor.replaceRange(imageMarkdown, fromPos, toPos);
                }

                editor.focus();
              } catch (error) {
                // Remover placeholder em caso de erro
                const fullText = editor.getValue();
                const placeholderIndex = fullText.indexOf(PLACEHOLDER);

                if (placeholderIndex !== -1) {
                  const fromPos = editor.posFromIndex(placeholderIndex);
                  const toPos = editor.posFromIndex(placeholderIndex + PLACEHOLDER.length);
                  editor.replaceRange('', fromPos, toPos);
                }

                editor.focus();
                alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
              } finally {
                if (input.parentNode) {
                  input.parentNode.removeChild(input);
                }
              }
            };

            document.body.appendChild(input);
            input.click();
          },
        },
      },
    ],
  };
}

/**
 * Converte um File para string base64 (data URL)
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
