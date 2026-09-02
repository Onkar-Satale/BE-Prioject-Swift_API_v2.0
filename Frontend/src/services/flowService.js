import { authenticatedFetch } from "./authService";

const FLOWS_API = `${process.env.REACT_APP_BACKEND_URL}/api/flows`;
const FLOWS_CACHE_KEY = "swift_api_flows_cache";

// Fetch all user flows with instant local cache fallback
export const getFlows = async () => {
  let cached = [];
  try {
    const raw = localStorage.getItem(FLOWS_CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const token = localStorage.getItem("authToken");
  if (!token) return Array.isArray(cached) ? cached : [];

  try {
    const res = await authenticatedFetch(FLOWS_API);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(FLOWS_CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn("getFlows network error, using cached flows:", err);
  }

  return Array.isArray(cached) ? cached : [];
};

// Fetch single flow by ID
export const getFlowById = async (flowId) => {
  try {
    const res = await authenticatedFetch(`${FLOWS_API}/${flowId}`);
    if (!res.ok) throw new Error("Failed to fetch flow");
    return await res.json();
  } catch (err) {
    console.error("getFlowById error:", err);
    return null;
  }
};

// Create a new flow
export const createFlow = async (flowData) => {
  try {
    const res = await authenticatedFetch(FLOWS_API, {
      method: "POST",
      body: JSON.stringify(flowData),
    });
    if (!res.ok) throw new Error("Failed to create flow");
    const data = await res.json();
    
    // Update local cache
    try {
      const current = await getFlows();
      localStorage.setItem(FLOWS_CACHE_KEY, JSON.stringify([data, ...current]));
    } catch {}

    return data;
  } catch (err) {
    console.error("createFlow error:", err);
    return null;
  }
};

// Update an existing flow
export const updateFlow = async (flowId, flowData) => {
  try {
    const res = await authenticatedFetch(`${FLOWS_API}/${flowId}`, {
      method: "PUT",
      body: JSON.stringify(flowData),
    });
    if (!res.ok) throw new Error("Failed to update flow");
    const data = await res.json();

    // Update local cache
    try {
      const current = await getFlows();
      const updated = current.map(f => f._id === flowId ? data : f);
      localStorage.setItem(FLOWS_CACHE_KEY, JSON.stringify(updated));
    } catch {}

    return data;
  } catch (err) {
    console.error("updateFlow error:", err);
    return null;
  }
};

// Delete a flow
export const deleteFlow = async (flowId) => {
  try {
    const res = await authenticatedFetch(`${FLOWS_API}/${flowId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete flow");
    
    // Update local cache
    try {
      const current = await getFlows();
      const filtered = current.filter(f => f._id !== flowId);
      localStorage.setItem(FLOWS_CACHE_KEY, JSON.stringify(filtered));
    } catch {}

    return true;
  } catch (err) {
    console.error("deleteFlow error:", err);
    return false;
  }
};

// Save flow run results & self-healing logs
export const saveFlowRunResults = async (flowId, lastRunData, mutatedSteps) => {
  try {
    const res = await authenticatedFetch(`${FLOWS_API}/${flowId}/run-results`, {
      method: "POST",
      body: JSON.stringify({
        lastRun: lastRunData,
        steps: mutatedSteps
      }),
    });
    if (!res.ok) throw new Error("Failed to save flow run results");
    return await res.json();
  } catch (err) {
    console.error("saveFlowRunResults error:", err);
    return null;
  }
};
