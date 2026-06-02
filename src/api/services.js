import client from "./client";

const safeData = (response, fallback) => response?.data ?? fallback;

export async function loginUser(payload) {
  const { data } = await client.post("/auth/login", payload);
  return data;
}

export async function signupUser(payload) {
  const { data } = await client.post("/auth/signup", payload);
  return data;
}

export async function getMe() {
  const { data } = await client.get("/auth/me");
  return data;
}

export async function fetchDashboard() {
  const response = await client.get("/dashboard");
  return safeData(response, {});
}

export async function fetchGroups() {
  const response = await client.get("/groups");
  return safeData(response, []);
}

export async function createGroup(payload) {
  const { data } = await client.post("/groups", payload);
  return data;
}

export async function fetchGroup(groupId) {
  const response = await client.get(`/groups/${groupId}`);
  return safeData(response, null);
}

export async function fetchGroupMembers(groupId) {
  const response = await client.get(`/groups/${groupId}/members`);
  return safeData(response, []);
}

export async function addGroupMember(groupId, payload) {
  const { data } = await client.post(`/groups/${groupId}/members`, payload);
  return data;
}

export async function inviteGroupMember(groupId, payload) {
  const { data } = await client.post(`/groups/${groupId}/invite`, payload);
  return data;
}

export async function deleteGroup(groupId) {
  const { data } = await client.delete(`/groups/${groupId}`);
  return data;
}

export async function leaveGroup(groupId) {
  const { data } = await client.post(`/groups/${groupId}/leave`);
  return data;
}

export async function addExpense(groupId, payload) {
  const { data } = await client.post(`/groups/${groupId}/expenses`, payload);
  return data;
}

export async function fetchExpenses(groupId) {
  const response = await client.get(`/groups/${groupId}/expenses`);
  return safeData(response, []);
}
