import { createContext, useState, useEffect } from "react";

export const PostmanContext = createContext();

export const PostmanProvider = ({ children }) => {
  // Load initial state from sessionStorage safely
  const getInitialState = () => {
    try {
      return JSON.parse(sessionStorage.getItem("postmanCloneState")) || {};
    } catch {
      return {};
    }
  };
  const saved = getInitialState();

  // Core API request state
  const [method, setMethod] = useState(saved.method || "GET");
  const [url, setUrl] = useState(saved.url || "");
  const [headersObj, setHeadersObj] = useState(saved.headersObj || [{ key: "", value: "" }]);
  const [paramsObj, setParamsObj] = useState(saved.paramsObj || [{ key: "", value: "", description: "" }]);
  const [rawBody, setRawBody] = useState(saved.rawBody || '{\n  "example": "value"\n}');
  const [activeTab, setActiveTab] = useState(saved.activeTab || "Params");

  // Authorization state
  const [auth, setAuth] = useState(saved.auth || {
    type: "none",
    token: "",
    username: "",
    password: "",
  });

  // Response + Bot state
  const [response, setResponse] = useState(saved.response || "");
  const [status, setStatus] = useState(saved.status || null);
  const [messages, setMessages] = useState(saved.messages || [
    { from: "bot", text: "Hi 👋 I’m your API assistant. Send a request and I’ll explain errors." }
  ]);

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    const stateToSave = {
      method, url, headersObj, paramsObj, rawBody, activeTab,
      auth,
      response, status, messages
    };
    sessionStorage.setItem("postmanCloneState", JSON.stringify(stateToSave));
  }, [method, url, headersObj, paramsObj, rawBody, activeTab, auth, response, status, messages]);

  return (
    <PostmanContext.Provider
      value={{
        method, setMethod,
        url, setUrl,
        headersObj, setHeadersObj,
        paramsObj, setParamsObj,
        rawBody, setRawBody,
        activeTab, setActiveTab,
        auth, setAuth,       // ✅ add auth here
        response, setResponse,
        status, setStatus,
        messages, setMessages
      }}
    >
      {children}
    </PostmanContext.Provider>
  );
};
