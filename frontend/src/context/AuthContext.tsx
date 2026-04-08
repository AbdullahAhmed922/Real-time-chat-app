import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { socket } from "../lib/socket";

type AuthContextType = {
  token: string | null;
  username: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [token]);

  const login = (newToken: string, newUsername: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{ token, username, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
// import { socket } from "../lib/socket";

// type AuthContextType = {
//   token: string | null;
//   username: string | null;
//   login: (token: string, username: string) => void;
//   logout: () => void;
//   isAuthenticated: boolean;
// };

// const AuthContext = createAuthContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [token, setToken ] = useState<string | null>(()=>
//   localStorage.getItem("token")
//   );
//   const [username, setUsername] = useState<string | null>(()=>
//   localStorage.getItem("username")
//   );

//   const isAuthenticated = !!token;

//   useEffect(() => {
//     if(token) {
//       socket.connect();
//     } else {
//       socket.disconnect();
//     }
//   },[token]);

//   const Login = (newToken: string, newUsername: string) => {
//     localStorage.setItem("token",newToken)
//     localStorage.setItem("username",newUsername)
//     setToken(newToken)
//     setUsername(newUsername)
//   }

//   const Logout =() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("username");
//     setToken(null);
//     setUsername(null);
//     socket.disconnect();
//   }

//   return (
//     <AuthContext.Provider 
//       value={{token, username, Login, Logout, isAuthenticated }}
//     >
//       {children}
//     </AuthContext.Provider>
//   )
// }

//   export function useAuth() {
//     const context = useContext(AuthContext);
//     if (!context) {
//       throw new Error("useAuth must be used within an AuthProvider");
//     }
//     return context;
// }
