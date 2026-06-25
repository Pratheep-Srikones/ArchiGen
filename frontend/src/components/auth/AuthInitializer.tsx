import { useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer() {
  const { state, getBasicUserInfo, getDecodedIDToken, getAccessToken } = useAuthContext();

  const {  setLoading, clearAuth, setAuthSession } = useAuthStore();

  useEffect(() => {
    async function initializeAuth() {
      try {
        setLoading(true);

        if (!state.isAuthenticated) {
          clearAuth();
          return;
        }

        const [userInfo, decodedToken, accessToken] = await Promise.all([
          getBasicUserInfo(),
          getDecodedIDToken(),
          getAccessToken(),
        ]);

        setAuthSession({
          id: decodedToken.sub,
          username: userInfo.username!,
          fullName: decodedToken.name,
          picture: decodedToken.picture,
        }, accessToken);
       
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, [state]);

  return null;
}
