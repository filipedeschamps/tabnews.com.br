import orchestrator from './orchestrator';

export default class RequestBuilder {
  url = '';
  sessionObject;
  headers;

  constructor(endpointPath) {
    this.url = endpointPath.startsWith('http') ? endpointPath : `${orchestrator.webserverUrl}${endpointPath}`;
  }

  async buildUser(features = { with: [], without: [] }) {
    let userObject = await orchestrator.createUser();
    userObject = await orchestrator.activateUser(userObject);

    if (features.with?.length) {
      userObject = await orchestrator.addFeaturesToUser(userObject, features.with);
    }
    if (features.without?.length) {
      userObject = await orchestrator.removeFeaturesFromUser(userObject, features.without);
    }

    await this.setUser(userObject);

    return userObject;
  }

  async setUser(userObject) {
    this.sessionObject = await orchestrator.createSession(userObject);

    if (this.headers) {
      this.headers.cookie = `session_id=${this.sessionObject.token}`;
    }
  }

  buildHeaders(customHeaders) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.sessionObject) {
      headers.cookie = `session_id=${this.sessionObject.token}`;
    }

    this.headers = { ...headers, ...customHeaders };
    return this.headers;
  }

  async get(urlParams) {
    if (!this.headers) {
      this.buildHeaders();
    }

    const url = urlParams ? `${this.url}${urlParams}` : this.url;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    let responseBody = response.headers.get('Content-Type').includes('text/')
      ? await response.text()
      : await response.json();

    return { response, responseBody };
  }

  async post(requestBody) {
    if (!this.headers) {
      this.buildHeaders();
    }

    const fetchData = {
      method: 'POST',
      headers: this.headers,
    };

    if (requestBody) {
      fetchData.body = typeof requestBody === 'object' ? JSON.stringify(requestBody) : requestBody;
    }

    const response = await fetch(this.url, fetchData);

    const responseBody = await response.json();

    return { response, responseBody };
  }

  async patch(urlParams, requestBody) {
    if (!this.headers) {
      this.buildHeaders();
    }

    const fetchData = {
      method: 'PATCH',
      headers: this.headers,
    };

    if (requestBody) {
      fetchData.body = typeof requestBody === 'object' ? JSON.stringify(requestBody) : requestBody;
    }

    const url = urlParams ? `${this.url}${urlParams}` : this.url;

    const response = await fetch(url, fetchData);

    const responseBody = await response.json();

    return { response, responseBody };
  }
}
