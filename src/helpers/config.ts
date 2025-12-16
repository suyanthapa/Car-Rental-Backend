import { config } from "dotenv";

config();

interface iEnv {
  [ke: string]: String;
}

const env = process.env as iEnv;
export default env;
