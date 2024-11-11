// src/state/dialogModeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DialogModeState {
  isEnabled: boolean;
  workspaceName: string;
  mode: string;
  api: string;
}

const initialState: DialogModeState = {
  isEnabled: false,
  workspaceName: "",
  mode: "chat",  // 默认模式是 chat
  api: "",
};

const dialogModeSlice = createSlice({
  name: "dialogMode",
  initialState,
  reducers: {
    setDialogMode(state, action: PayloadAction<DialogModeState>) {
      state.isEnabled = action.payload.isEnabled;
      state.workspaceName = action.payload.workspaceName;
      state.mode = action.payload.mode;
      state.api = action.payload.api;
    },
  },
});

export const { setDialogMode } = dialogModeSlice.actions;
export default dialogModeSlice.reducer;
