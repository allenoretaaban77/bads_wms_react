import { API_BASE_URL } from '../config/constants';

let currentToken = '';

export const setAccessToken = (token) => {
  currentToken = token;
};

export const getAccessToken = () => {
  return currentToken;
};

export default {
  setAccessToken,
  getAccessToken,
};
