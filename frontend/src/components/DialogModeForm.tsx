import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDialogMode } from "../state/dialogModeSlice";  // 引入 setDialogMode
import { RootState } from "../store"; 
import { toast } from 'react-hot-toast';

export const DialogModeForm = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const { isEnabled, workspaceName, mode, api } = useSelector(
    (state: RootState) => state.dialogMode  // 获取 dialogMode 的状态
  );

  const [localWorkspaceName, setLocalWorkspaceName] = useState(workspaceName);
  const [localMode, setLocalMode] = useState(mode);
  const [localApi, setLocalApi] = useState(api);

  useEffect(() => {
    if (isEnabled) {
      setLocalWorkspaceName(workspaceName);
      setLocalMode(mode);
      setLocalApi(api);
    }
  }, [isEnabled, workspaceName, mode, api]);

  // 切换开关的状态
  const handleToggleChange = () => {
    dispatch(setDialogMode({
      isEnabled: !isEnabled,
      workspaceName: localWorkspaceName,
      mode: localMode,
      api: localApi,
    }));
  };

  // 处理其他输入框的变化
  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalMode(event.target.value);
  };

  const handleWorkspaceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalWorkspaceName(event.target.value);
  };

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
    onClose();
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
            <label className="block text-sm">Workspace Name (lowercase)</label>
            <input
              type="text"
              value={localWorkspaceName}
              onChange={handleWorkspaceNameChange}
              placeholder="Enter workspace name"
              className="p-2 border rounded-md w-full mt-2"
              required
            />
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
      </div>
    </div>
  );
};
