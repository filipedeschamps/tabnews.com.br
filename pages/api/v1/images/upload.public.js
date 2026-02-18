import { createRouter } from 'next-connect';

import { InternalServerError, UnauthorizedError, ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '32mb',
    },
  },
};

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .post(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    authorization.canRequest('create:content'),
    postValidationHandler,
    postHandler,
  )
  .handler(controller.handlerOptions);

function postValidationHandler(request, response, next) {
  const { image } = request.body;

  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    throw new ValidationError({
      message: '"image" é um campo obrigatório e deve ser uma string base64 ou URL.',
      action: 'Envie uma imagem válida no campo "image".',
      errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:IMAGE_REQUIRED',
    });
  }

  if (request.body.expiration !== undefined) {
    const expiration = Number(request.body.expiration);
    if (Number.isNaN(expiration) || expiration < 60 || expiration > 15552000) {
      throw new ValidationError({
        message: '"expiration" deve ser um número entre 60 e 15552000 (segundos).',
        action: 'Envie um valor válido para "expiration" ou omita o campo.',
        errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:INVALID_EXPIRATION',
      });
    }
  }

  return next();
}

async function postHandler(request, response) {
  if (!request.context.user) {
    throw new UnauthorizedError({
      message: 'Usuário não autenticado.',
      action: 'Verifique se você está logado.',
      errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:USER_NOT_AUTHENTICATED',
    });
  }

  const { image, expiration } = request.body;
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    throw new InternalServerError({
      message: 'Chave da API do ImgBB não configurada.',
      action: 'Configure a variável de ambiente IMGBB_API_KEY.',
      errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:API_KEY_NOT_CONFIGURED',
    });
  }

  try {
    // Prepare form data
    const formData = new FormData();

    // Se a imagem for base64, extrair apenas os dados
    let imageData = image;
    if (image.startsWith('data:')) {
      imageData = image.split(',')[1];
    }

    formData.append('image', imageData);

    // Build URL with API key and optional expiration
    let url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
    if (expiration) {
      url += `&expiration=${expiration}`;
    }

    // Make request to ImgBB
    const imgbbResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const responseData = await imgbbResponse.json();

    if (!imgbbResponse.ok || !responseData.success) {
      throw new ValidationError({
        message: responseData.error?.message || 'Erro ao fazer upload da imagem.',
        action: 'Verifique se a imagem é válida e tente novamente.',
        errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:IMGBB_ERROR',
      });
    }

    // Return the image URL and other useful data
    return response.status(201).json({
      url: responseData.data.url,
      display_url: responseData.data.display_url,
      delete_url: responseData.data.delete_url,
      thumb_url: responseData.data.thumb?.url,
      medium_url: responseData.data.medium?.url,
      image: responseData.data.image,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'InternalServerError') {
      throw error;
    }

    throw new InternalServerError({
      message: 'Erro ao processar upload da imagem.',
      action: 'Tente novamente mais tarde.',
      errorLocationCode: 'CONTROLLER:IMAGES:UPLOAD:UNEXPECTED_ERROR',
      stack: new Error('Image upload failed').stack,
      errorObject: error,
    });
  }
}
