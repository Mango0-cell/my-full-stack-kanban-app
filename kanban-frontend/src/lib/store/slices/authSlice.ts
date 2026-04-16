import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/lib/types/api';

interface AuthState {
  user: Pick<User, 'user_id' | 'email' | 'display_name'> | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthState['user']; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
