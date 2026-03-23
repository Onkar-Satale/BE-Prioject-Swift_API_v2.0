import { createContext, useState, useEffect } from "react";

export const PostmanContext = createContext();

export const PostmanProvider = ({ children }) => {
  // Core API request state
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headersObj, setHeadersObj] = useState([{ key: "", value: "" }]);
  const [paramsObj, setParamsObj] = useState([{ key: "", value: "", description: "" }]);
  const [rawBody, setRawBody] = useState('{\n  "example": "value"\n}');
  const [activeTab, setActiveTab] = useState("Params");

  // Authorization state
  const [auth, setAuth] = useState({
    type: "none",
    token: "",
    username: "",
    password: "",
  });

  // Response + Bot state
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([
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

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("postmanCloneState") || "{}");
    if (saved.method) setMethod(saved.method);
    if (saved.url) setUrl(saved.url);
    if (saved.headersObj) setHeadersObj(saved.headersObj);
    if (saved.paramsObj) setParamsObj(saved.paramsObj);
    if (saved.rawBody) setRawBody(saved.rawBody);
    if (saved.activeTab) setActiveTab(saved.activeTab);
    if (saved.auth) setAuth(saved.auth);
    if (saved.response) setResponse(saved.response);
    if (saved.status) setStatus(saved.status);
    if (saved.messages) setMessages(saved.messages);
  }, []);

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
