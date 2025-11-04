import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { RetryHandler } from '../utils/retry';

interface ServiceConfig {
  baseURL: string;
  timeout: number;
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
  retry?: {
    maxAttempts: number;
    delayMs: number;
  };
}

export class ProxyService {
  private services: Map<string, AxiosInstance> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryHandlers: Map<string, RetryHandler> = new Map();

  constructor(private configs: Record<string, ServiceConfig>) {
    this.initializeServices();
  }

  private initializeServices(): void {
    Object.entries(this.configs).forEach(([name, config]) => {
      const instance = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      instance.interceptors.request.use(
        (config) => {
          logger.debug(`Proxying request to ${name}:`, {
            method: config.method,
            url: config.url
          });
          return config;
        },
        (error) => {
          logger.error(`Request interceptor error for ${name}:`, error);
          return Promise.reject(error);
        }
      );

      instance.interceptors.response.use(
        (response) => response,
        (error) => {
          logger.error(`Response error from ${name}:`, {
            message: error.message,
            status: error.response?.status
          });
          return Promise.reject(error);
        }
      );

      this.services.set(name, instance);

      if (config.circuitBreaker) {
        this.circuitBreakers.set(
          name,
          new CircuitBreaker(
            config.circuitBreaker.failureThreshold,
            config.circuitBreaker.resetTimeout
          )
        );
      }

      if (config.retry) {
        this.retryHandlers.set(
          name,
          new RetryHandler(config.retry)
        );
      }
    });
  }

  async request<T>(
    serviceName: string,
    config: AxiosRequestConfig
  ): Promise<T> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName);
    const retryHandler = this.retryHandlers.get(serviceName);

    const makeRequest = async () => {
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        throw new Error(`Circuit breaker open for ${serviceName}`);
      }

      try {
        const response = await service.request<T>(config);
        circuitBreaker?.recordSuccess();
        return response.data;
      } catch (error) {
        circuitBreaker?.recordFailure();
        throw error;
      }
    };

    if (retryHandler) {
      return retryHandler.execute(makeRequest);
    }

    return makeRequest();
  }

  async get<T>(serviceName: string, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(serviceName, { ...config, method: 'GET', url });
  }

  async post<T>(serviceName: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(serviceName, { ...config, method: 'POST', url, data });
  }

  async put<T>(serviceName: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(serviceName, { ...config, method: 'PUT', url, data });
  }

  async patch<T>(serviceName: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(serviceName, { ...config, method: 'PATCH', url, data });
  }

  async delete<T>(serviceName: string, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(serviceName, { ...config, method: 'DELETE', url });
  }

  getCircuitBreakerStatus(serviceName: string): string | null {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  getAllCircuitBreakerStatuses(): Record<string, string> {
    const statuses: Record<string, string> = {};
    this.circuitBreakers.forEach((cb, name) => {
      statuses[name] = cb.getState();
    });
    return statuses;
  }
}
