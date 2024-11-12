import React, { useEffect, useState } from "react";
import { UserManager, User } from "oidc-client-ts";
import { oidcConfig } from "./authConfig";
import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrowNightBright } from "react-syntax-highlighter/dist/esm/styles/hljs";
import './App.css';

const userManager = new UserManager(oidcConfig);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    userManager.signinRedirect();
  };

  const logout = () => {
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
  
    const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  
    sessionStorage.clear();
  
    window.location.href = logoutUrl;
  };

  useEffect(() => {
    if (window.location.search.includes("code=")) {
      userManager.signinRedirectCallback()
        .then((user) => {
          setUser(user);
          sessionStorage.setItem("id_token", user.id_token || "");
          sessionStorage.setItem("access_token", user.access_token);
          sessionStorage.setItem("refresh_token", user.refresh_token ?? "");
        })
        .catch((error) => {
          console.error("Error during authentication:", error);
        });
    } else {
      userManager.getUser().then((user) => {
        if (user) setUser(user);
      });
    }
  }, []);

  const displayTokenData = () => {
    const idToken = sessionStorage.getItem("id_token");
    const accessToken = sessionStorage.getItem("access_token");

    return (
      <>
        <SyntaxHighlighter language="json" style={tomorrowNightBright} showLineNumbers="1" wrapLongLines="1" customStyle={{ textAlign: "left" }}>
          {JSON.stringify(parseJwt(idToken), null, 2)}
        </SyntaxHighlighter>
        <SyntaxHighlighter language="json" style={tomorrowNightBright} showLineNumbers="1" wrapLongLines="1" customStyle={{ textAlign: "left" }}>
          {JSON.stringify(parseJwt(accessToken), null, 2)}
        </SyntaxHighlighter>
      </>
    );
  };

  const parseJwt = (token: string | null) => {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user ? (
        <>
          <h1>Hello, {user.profile.given_name || user.profile.email}!</h1>
          {displayTokenData()}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <h1>Hello, Guest!</h1>
          <button onClick={login}>Login</button>
        </>
      )}
    </div>
  );
};

export default App;
