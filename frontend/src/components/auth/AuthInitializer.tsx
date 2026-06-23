import { useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer() {
  const { state, getBasicUserInfo, getDecodedIDToken } = useAuthContext();

  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        if (!state.isAuthenticated) {
          setAuth(null);
          return;
        }

        const userInfo = await getBasicUserInfo();
        const token = await getDecodedIDToken();

        setAuth({
          id: token.sub,
          username: userInfo.username!,
          fullName: token.name,
          picture: token.picture,
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuth(null);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [state]);

  return null;
}
