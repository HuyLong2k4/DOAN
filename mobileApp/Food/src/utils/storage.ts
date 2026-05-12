import * as SecureStore from "expo-secure-store";

export const storage = {
  getToken: () => SecureStore.getItemAsync("accessToken"),
  setToken: (token: string) => SecureStore.setItemAsync("accessToken", token),
  removeToken: () => SecureStore.deleteItemAsync("accessToken"),
};