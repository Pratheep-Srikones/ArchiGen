import { useAuthContext } from "@asgardeo/auth-react";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const { signIn, signOut, state , getAccessToken} = useAuthContext();
  const auth = useAuthStore();

  const login = async () => {
    await signIn();
    const accessToken = await getAccessToken();
    auth.setToken(accessToken);
  };

  const logout = async () => {
    await signOut();
    auth.clearAuth();
  };


  return {
    ...auth,
    login,
    logout,
    state: state,
  };
}
