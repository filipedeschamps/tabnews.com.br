import orchestrator from './orchestrator';

export default class RequestBuilder {
  baseUrl = '';
  sessionObject;
  headers;

  constructor(urlSegments = '') {
    this.baseUrl = urlSegments.startsWith('http') ? urlSegments : `${orchestrator.webserverUrl}${urlSegments}`;
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

  async get(route = '') {
    if (!this.headers) {
      this.buildHeaders();
    }

    const response = await fetch(`${this.baseUrl}${route}`, {
      method: 'GET',
      headers: this.headers,
    });

    const responseBody = await response.json();

    return { response, responseBody };
  }

  async post(routeOrRequestBody, inputRequestBody) {
    const { route, requestBody } = this.getRouteAndRequestBody(routeOrRequestBody, inputRequestBody);

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

    const response = await fetch(`${this.baseUrl}${route}`, fetchData);

    const responseBody = await response.json();

    return { response, responseBody };
  }

  async patch(routeOrRequestBody, inputRequestBody) {
    const { route, requestBody } = this.getRouteAndRequestBody(routeOrRequestBody, inputRequestBody);

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

    const response = await fetch(`${this.baseUrl}${route}`, fetchData);

    const responseBody = await response.json();

    return { response, responseBody };
  }

  getRouteAndRequestBody(routeOrRequestBody = '', inputRequestBody) {
    let route = routeOrRequestBody;
    let requestBody = inputRequestBody;

    if (typeof routeOrRequestBody === 'object') {
      route = '';
      requestBody = routeOrRequestBody;
    }

    return {
      route: route,
      requestBody: requestBody,
    };
  }
}
