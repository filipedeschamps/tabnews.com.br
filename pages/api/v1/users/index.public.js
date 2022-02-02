import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';
import activation from 'models/activation.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(getHandler)
  .post(postHandler);

async function getHandler(request, response) {
  const userList = await user.findAll();
  const responseBody = userList.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    features: user.features,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));

  return response.status(200).json(responseBody);
}

async function postHandler(request, response) {
  const clientPostedData = request.body;

  const authorizedValuesFromClient = await extractAuthorizedValuesFromClient(clientPostedData);
  const newUser = await user.create(authorizedValuesFromClient);
  await activation.sendActivationEmailToUser(newUser);
  const authorizedValuesToReturn = await extractAuthorizedValuesToReturn(newUser);
  return response.status(201).json(authorizedValuesToReturn);

  async function extractAuthorizedValuesFromClient(clientPostedData) {
    const unprivilegedValues = {
      username: clientPostedData.username,
      email: clientPostedData.email,
      password: clientPostedData.password,
    };

    return unprivilegedValues;
  }

  async function extractAuthorizedValuesToReturn(user) {
    const publicValues = {
      id: user.id,
      username: user.username,
      email: user.email,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return publicValues;
  }
}
