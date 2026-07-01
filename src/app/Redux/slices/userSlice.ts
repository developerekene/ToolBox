import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MembershipTier = "Silver" | "Gold" | "Platinum";

export interface UserState {
  firstName: string;
  lastName: string;
  email: string;
  membershipTier: MembershipTier;
}

const initialState: UserState = {
  firstName: "",
  lastName: "",
  email: "",
  membershipTier: "Silver",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<UserState>
    ) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.email = action.payload.email;
      state.membershipTier = action.payload.membershipTier;
    },

    updateFirstName: (
      state,
      action: PayloadAction<string>
    ) => {
      state.firstName = action.payload;
    },

    updateLastName: (
      state,
      action: PayloadAction<string>
    ) => {
      state.lastName = action.payload;
    },

    updateEmail: (
      state,
      action: PayloadAction<string>
    ) => {
      state.email = action.payload;
    },

    updateMembershipTier: (
      state,
      action: PayloadAction<MembershipTier>
    ) => {
      state.membershipTier = action.payload;
    },

    clearUser: () => initialState,
  },
});

export const {
  setUser,
  updateFirstName,
  updateLastName,
  updateEmail,
  updateMembershipTier,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;