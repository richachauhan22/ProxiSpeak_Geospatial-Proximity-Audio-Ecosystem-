/**
 * Lightweight, Axios-compatible HTTP client wrapping native fetch.
 * Provides baseUrl, interceptors, error normalization, and standard HTTP verbs.
 */

class AxiosInstance {
  constructor(defaults = {}) {
    this.defaults = {
      baseURL: import.meta.env?.VITE_API_BASE_URL || '',
      headers: {
        'Content-Type': 'application/json',
      },
      ...defaults,
    };
    this.interceptors = {
      request: {
        handlers: [],
        use(fulfilled, rejected) {
          this.handlers.push({ fulfilled, rejected });
        },
      },
      response: {
        handlers: [],
        use(fulfilled, rejected) {
          this.handlers.push({ fulfilled, rejected });
        },
      },
    };
  }

  async request(config) {
    let mergedConfig = {
      ...this.defaults,
      ...config,
      headers: {
        ...this.defaults.headers,
        ...config.headers,
      },
    };

    // Run request interceptors
    for (const interceptor of this.interceptors.request.handlers) {
      if (interceptor.fulfilled) {
        mergedConfig = await interceptor.fulfilled(mergedConfig);
      }
    }

    const { baseURL, url, method = 'GET', data, headers, params, ...rest } = mergedConfig;
    let fullUrl = url.startsWith('http') ? url : `${baseURL || ''}${url}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }

    const fetchOptions = {
      method: method.toUpperCase(),
      headers: { ...headers },
      ...rest,
    };

    if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method)) {
      fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);
      let responseData = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => '');
      }

      let res = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: mergedConfig,
      };

      if (!response.ok) {
        const error = new Error(`Request failed with status code ${response.status}`);
        error.response = res;
        error.config = mergedConfig;
        for (const interceptor of this.interceptors.response.handlers) {
          if (interceptor.rejected) {
            return await interceptor.rejected(error);
          }
        }
        throw error;
      }

      for (const interceptor of this.interceptors.response.handlers) {
        if (interceptor.fulfilled) {
          res = await interceptor.fulfilled(res);
        }
      }

      return res;
    } catch (err) {
      for (const interceptor of this.interceptors.response.handlers) {
        if (interceptor.rejected) {
          return await interceptor.rejected(err);
        }
      }
      throw err;
    }
  }

  get(url, config = {}) {
    return this.request({ ...config, url, method: 'GET' });
  }

  post(url, data, config = {}) {
    return this.request({ ...config, url, data, method: 'POST' });
  }

  put(url, data, config = {}) {
    return this.request({ ...config, url, data, method: 'PUT' });
  }

  delete(url, config = {}) {
    return this.request({ ...config, url, method: 'DELETE' });
  }

  patch(url, data, config = {}) {
    return this.request({ ...config, url, data, method: 'PATCH' });
  }

  create(defaults = {}) {
    return new AxiosInstance(defaults);
  }
}

const axios = new AxiosInstance();
export default axios;
