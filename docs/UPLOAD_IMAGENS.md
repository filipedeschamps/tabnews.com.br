# Upload de Imagens - ImgBB Integration

Esta funcionalidade permite que usuários façam upload de imagens diretamente do editor Markdown para o serviço ImgBB.

## 🔧 Configuração

### 1. Obter API Key do ImgBB

1. Acesse [ImgBB API](https://api.imgbb.com/)
2. Crie uma conta ou faça login
3. Acesse a seção "Get API key"
4. Copie sua chave de API

### 2. Configurar a variável de ambiente

Edite o arquivo `.env` na raiz do projeto e adicione sua chave de API:

```env
IMGBB_API_KEY=sua_chave_api_aqui
```

## 📝 Como usar

### No Editor de Publicações

1. Acesse a página de publicar: http://localhost:3000/publicar
2. No editor Markdown, você verá um botão de **upload de imagem** na barra de ferramentas (ícone de imagem)
3. Clique no botão e selecione uma imagem do seu computador
4. Aguarde o upload (máximo 32MB)
5. A imagem será automaticamente inserida no formato Markdown: `![nome-arquivo.jpg](https://i.ibb.co/...)`

### Funcionalidades

- ✅ Upload automático para ImgBB
- ✅ Suporta imagens até 32MB
- ✅ Inserção automática no formato Markdown
- ✅ Feedback visual durante o upload ("Enviando...")
- ✅ Tratamento de erros com mensagens amigáveis
- ✅ Requer autenticação (apenas usuários logados podem fazer upload)

## 🔒 Segurança

- Apenas usuários autenticados podem fazer upload de imagens
- A API valida o tamanho do arquivo (máximo 32MB)
- As imagens são armazenadas no ImgBB, não no servidor do TabNews
- A chave da API do ImgBB é mantida no servidor (nunca exposta ao cliente)

## 📡 API Endpoint

### POST `/api/v1/images/upload`

Faz upload de uma imagem para o ImgBB.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "image": "base64_string_ou_binary_data",
  "expiration": 600 // opcional, em segundos (60-15552000)
}
```

**Resposta de sucesso (201):**

```json
{
  "url": "https://i.ibb.co/xxxxx/image.jpg",
  "display_url": "https://ibb.co/xxxxx",
  "delete_url": "https://ibb.co/xxxxx/delete",
  "thumb_url": "https://i.ibb.co/xxxxx/thumb.jpg",
  "medium_url": "https://i.ibb.co/xxxxx/medium.jpg",
  "image": {
    "filename": "image.jpg",
    "size": 12345,
    "width": 800,
    "height": 600
  }
}
```

**Erros possíveis:**

- `401 Unauthorized` - Usuário não autenticado
- `400 Bad Request` - Imagem inválida ou muito grande
- `500 Internal Server Error` - Chave da API não configurada ou erro no servidor

## 🛠️ Arquivos Modificados/Criados

### Criados:

- `pages/api/v1/images/upload.public.js` - API endpoint para upload
- `packages/ui/src/Markdown/plugins/image-upload.js` - Plugin do editor
- `docs/UPLOAD_IMAGENS.md` - Documentação (este arquivo)

### Modificados:

- `.env` - Adicionada variável `IMGBB_API_KEY`
- `packages/ui/src/Markdown/Markdown.jsx` - Integração do plugin
- `packages/ui/src/Markdown/plugins/index.js` - Export do novo plugin

## 🧪 Testando

Para testar sem criar uma conta real:

1. Use os usuários pré-cadastrados:

   - **Admin**: `admin@admin.com` / `password`
   - **Usuário**: `user@user.com` / `password`

2. Acesse: http://localhost:3000/publicar

3. Teste fazer upload de uma imagem

## ⚠️ Limitações

- Tamanho máximo: 32MB por imagem
- Requer conexão com internet (ImgBB é um serviço externo)
- Apenas formatos de imagem comuns são suportados
- As imagens ficam hospedadas no ImgBB (não no servidor local)

## 📚 Referências

- [ImgBB API Documentation](https://api.imgbb.com/)
- [ByteMD Documentation](https://github.com/bytedance/bytemd)
