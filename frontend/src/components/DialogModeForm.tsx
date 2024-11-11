import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDialogMode } from "../state/dialogModeSlice"; // 引入 setDialogMode
import { RootState } from "../store";
import { toast } from 'react-hot-toast';

import { GetWorkspacesRequest, CreateWorkspaceRequest, DeleteWorkspaceRequest } from "#/services/workspaceRequests"; // 引入请求类

export const DialogModeForm = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const { isEnabled, workspaceName, mode, api } = useSelector(
    (state: RootState) => state.dialogMode // 获取 dialogMode 的状态
  );

  const [localWorkspaceName, setLocalWorkspaceName] = useState(workspaceName);
  const [localMode, setLocalMode] = useState(mode);
  const [localApi, setLocalApi] = useState(api);
  const [workspaces, setWorkspaces] = useState<string[]>([]); // 用于存储工作区名称
  const [isLoading, setIsLoading] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState(""); // 新建工作区名称
  const [workspaceToDelete, setWorkspaceToDelete] = useState(""); // 删除工作区的名称
  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false); // 是否正在创建新工作区

  useEffect(() => {
    if (isEnabled) {
      setLocalWorkspaceName(workspaceName);
      setLocalMode(mode);
      setLocalApi(api);
    }
  }, [isEnabled, workspaceName, mode, api]);

  useEffect(() => {
    // 使用封装的 GetWorkspacesRequest 类获取工作区名称列表
    const fetchWorkspaces = async () => {
      setIsLoading(true);
      try {
        const workspacesRequest = new GetWorkspacesRequest(api); // 实例化请求类
        const data = await workspacesRequest.fetchWorkspaces();
        const workspaceNames = data.workspaces.map((workspace: { name: string }) => workspace.name);
        setWorkspaces(workspaceNames);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        toast.error("Failed to load workspaces.");
      } finally {
        setIsLoading(false);
      }
    };

    if (api) {
      fetchWorkspaces();
    }
  }, [api]);

  // 切换开关的状态
  const handleToggleChange = () => {
    dispatch(setDialogMode({
      isEnabled: !isEnabled,
      workspaceName: localWorkspaceName,
      mode: localMode,
      api: localApi,
    }));
  };

  // 处理选择模式变化
  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalMode(event.target.value);
  };

  // 处理工作区名称选择变化
  const handleWorkspaceNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalWorkspaceName(event.target.value);
    if (event.target.value === "delete") {
      setWorkspaceToDelete(""); // 清空删除框
    }
  };

  // 处理API的变化
  const handleApiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalApi(event.target.value);
  };

  // 提交并保存设置
  const handleSubmit = () => {
    if (isEnabled) {
      dispatch(setDialogMode({
        isEnabled,
        workspaceName: localWorkspaceName,
        mode: localMode,
        api: localApi,
      }));
    }
    toast.success(`Configuration updated:\nWorkspace Name: ${localWorkspaceName}\nMode: ${localMode}\nAPI: ${localApi}`);
  };

  // 创建新工作区
  const handleCreateNewWorkspace = async () => {
    if (newWorkspaceName.trim() === "") {
      toast.error("Workspace name cannot be empty.");
      return;
    }
  
    try {
      const workspaceRequest = new CreateWorkspaceRequest(api); // 实例化请求类
      const data = await workspaceRequest.createWorkspace(newWorkspaceName);
  
      // 检查响应中的 workspace 对象
      if (data.workspace && data.workspace.name) {
        // 新工作区创建成功，更新工作区列表并选择新创建的工作区
        setWorkspaces([...workspaces, data.workspace.name]);
        setLocalWorkspaceName(data.workspace.name); // 设置为新创建的工作区
        setNewWorkspaceName(""); // 清空新建工作区的输入框
        toast.success(`New workspace "${data.workspace.name}" created!`);
      } else {
        toast.error("Failed to create workspace.");
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create new workspace.");
    }
  };
  
  // 删除工作区
  const handleDeleteWorkspace = async () => {
    if (workspaceToDelete.trim() === "") {
      toast.error("Workspace name cannot be empty.");
      return;
    }
  
    try {
      const deleteRequest = new DeleteWorkspaceRequest(api); // 实例化请求类
      const data = await deleteRequest.deleteWorkspace(workspaceToDelete);
  
      // 如果返回的响应是 "OK"，表示删除成功
      if (data === "OK") {
        // 删除成功后，更新工作区列表
        setWorkspaces(workspaces.filter(workspace => workspace !== workspaceToDelete));
        setWorkspaceToDelete(""); // 清空删除框
        setLocalWorkspaceName(""); // 重置工作区名称选择框
        toast.success(`Workspace "${workspaceToDelete}" deleted!`);
      } else {
        toast.error("Failed to delete workspace.");
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace.");
    }
  };  

  // 关闭窗口并保存设置
  const handleClose = () => {
    handleSubmit(); // 保存设置
    onClose(); // 关闭窗口
  };

  return (
    <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
      <span className="text-xl leading-6 font-semibold">Dialog Mode Settings</span>
      <p className="text-xs text-[#A3A3A3]">
        {isEnabled
          ? "Fill in the settings below to configure the dialog mode."
          : "Toggle to enable the dialog mode and configure the settings."
        }
      </p>

      <div className="flex items-center gap-2 mt-4">
        <label className="text-sm">Enable Dialog Mode</label>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggleChange}
          className="w-6 h-6"
        />
      </div>

      {isEnabled && (
        <div className="mt-4">
          <div>
            <label className="block text-sm">Workspace Name</label>
            <select
              value={localWorkspaceName}
              onChange={handleWorkspaceNameChange}
              className="p-2 border rounded-md w-full mt-2"
            >
              {isLoading ? (
                <option value="">Loading...</option>
              ) : (
                <>
                  <option value="">Select Workspace</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace} value={workspace}>
                      {workspace}
                    </option>
                  ))}
                  <option value="new">Create New Workspace</option>
                  <option value="delete">Delete Workspace</option>
                </>
              )}
            </select>

            {localWorkspaceName === "new" && (
              <div className="mt-4">
                <label className="block text-sm">Enter New Workspace Name</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="p-2 border rounded-md w-full mt-2"
                />
                <button
                  onClick={handleCreateNewWorkspace}
                  className="mt-2 bg-green-500 text-white p-2 rounded"
                >
                  Create Workspace
                </button>
              </div>
            )}

            {localWorkspaceName === "delete" && (
              <div className="mt-4">
                <label className="block text-sm">Enter Workspace Name to Delete</label>
                <input
                  type="text"
                  value={workspaceToDelete}
                  onChange={(e) => setWorkspaceToDelete(e.target.value)}
                  placeholder="Enter workspace name"
                  className="p-2 border rounded-md w-full mt-2"
                />
                <button
                  onClick={handleDeleteWorkspace}
                  className="mt-2 bg-red-500 text-white p-2 rounded"
                >
                  Delete Workspace
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm">Select Mode</label>
            <select
              value={localMode}
              onChange={handleModeChange}
              className="p-2 border rounded-md w-full"
            >
              <option value="chat">Chat</option>
              <option value="query">Query</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm">AnythingLLM API</label>
            <input
              type="text"
              value={localApi}
              onChange={handleApiChange}
              placeholder="Enter API URL"
              className="p-2 border rounded-md w-full mt-2"
              required
            />
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 mt-4">
        <button
          className="bg-gray-500 text-white p-2 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={handleSubmit}
        >
          Confirm
        </button>
        <button
          className="bg-red-500 text-white p-2 rounded"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};
