import React, { useState } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-twilight";

import "./bodyTab.css";

export default function BodyTab({
  bodyType,
  setBodyType,
  body,
  setBody,
  onBodyChange
}) {
  const [showRawOptions, setShowRawOptions] = useState(false);

  const handleSelectChange = (e) => {
    const value = e.target.value;
    setBodyType(value);

    if (value === "none") {
      onBodyChange(null);
    }

    if (value === "raw") {
      onBodyChange(body);
      setShowRawOptions(false);
    }
  };

  const handleChange = (newValue) => {
    setBody(newValue);
    if (bodyType === "raw") {
      onBodyChange(newValue);
    }
  };

  return (
    <div className="body-tab">
      {bodyType === "raw" && !showRawOptions ? (
        <div className="raw-header-minimal">
          <span className="raw-badge">Raw Mode Active</span>
          <button
            type="button"
            className="change-type-btn"
            onClick={() => setShowRawOptions(true)}
          >
            ⚙️ Change Type / Options
          </button>
        </div>
      ) : (
        <div className="body-options">
          {[
            "none",
            "form-data",
            "x-www-form-urlencoded",
            "raw",
            "binary",
            "GraphQL",
          ].map((option) => (
            <label key={option} className="body-option">
              <input
                type="radio"
                name="body-option"
                value={option}
                checked={bodyType === option}
                onChange={handleSelectChange}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}

      {bodyType === "none" && (
        <div className="no-body-hint">
          This request will be sent without a body. Use this for GET requests or any request
          that does not need to send data.
        </div>
      )}

      {bodyType === "form-data" && (
        <div className="body-hint">
          Use form-data to send key-value pairs where the values can be text or files.
          Commonly used for file uploads (images, documents) along with other fields.
        </div>
      )}

      {bodyType === "x-www-form-urlencoded" && (
        <div className="body-hint">
          Data will be sent in URL-encoded format (key=value&key2=value2).
          Best for simple form submissions. Everything is encoded into a single string.
        </div>
      )}

      {bodyType === "raw" && (
        <div className="json-editor">
          {showRawOptions && (
            <div className="body-hint">
              Use raw mode to send JSON, XML, HTML, or plain text.
              For structured API data, choose JSON and edit the content below.
            </div>
          )}
          <AceEditor
            mode="json"
            theme="twilight"
            value={body}
            onChange={handleChange}
            name="json-editor"
            editorProps={{ $blockScrolling: true }}
            fontSize={14}
            width="100%"
            height="100%"   // 🔥 REQUIRED
            onLoad={(editor) => editor.resize()}
            setOptions={{
              useWorker: false,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </div>
      )}

      {bodyType === "binary" && (
        <div className="body-hint">
          Send a single binary file directly in the request body.
          Ideal for uploading files without additional form fields.
        </div>
      )}

      {bodyType === "GraphQL" && (
        <div className="body-hint">
          Send GraphQL queries or mutations using the standard
          {"{ query, variables }"} format. Use this for GraphQL API calls.
        </div>
      )}
    </div>
  );
}
