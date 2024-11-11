// src/services/ApiRequest.ts
export class ApiRequest {
    api: string;
  
    constructor(api: string) {
      this.api = api;
    }
  
    // 执行 API 请求的模板方法
    async request(endpoint: string, method: string, body: any = null) {
      const url = `http://localhost:3001/api/v1${endpoint}`;
      const headers = {
        "Accept": "application/json",
        "Authorization": `Bearer ${this.api}`,
        "Content-Type": "application/json",
      };
  
      const options: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      };
  
      try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Request failed');
        }
        return data;
      } catch (error : any) {
        throw new Error(error.message || 'Failed to fetch data');
      }
    }
  }
  