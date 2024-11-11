// src/services/workspaceRequests.ts
import { ApiRequest } from './ApiRequest';

// 获取工作区列表
export class GetWorkspacesRequest extends ApiRequest {
  async fetchWorkspaces() {
    return this.request('/workspaces', 'GET');
  }
}

// 创建工作区
export class CreateWorkspaceRequest extends ApiRequest {
  async createWorkspace(name: string) {
    const body = { name };
    return this.request('/workspace/new', 'POST', body);
  }
}

// 删除工作区
export class DeleteWorkspaceRequest extends ApiRequest {
    async deleteWorkspace(name: string) {
      const endpoint = `/workspace/${name}`;
      return this.request(endpoint, 'DELETE');
    }
  }