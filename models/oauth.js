import axios from 'axios';

function getGoogleUserDataFromAPI(token) {
  return new Promise(async (resolve, reject) => {
    try {
      const googleUserData = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (googleUserData.status != 200) {
        throw new UnauthorizedError({
          message: `Dados não conferem.`,
          action: `Verifique se os dados enviados estão corretos.`,
          errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
        });
      }
      resolve(googleUserData.data);
    } catch (error) {
      reject(
        new UnauthorizedError({
          message: `Dados não conferem.`,
          action: `Verifique se os dados enviados estão corretos.`,
          errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
        })
      );
    }
  });
}

export default Object.freeze({
  getGoogleUserDataFromAPI,
});
