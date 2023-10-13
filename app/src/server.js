import axios from "axios";

const port = process.env.PORT || 5000;
const server = axios.create({
  baseURL: `http://localhost:${port}`,
});

export default server;
