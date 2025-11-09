import fs from "fs";

const CONFIG_PATH = "./config.json";

export const getConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
   
    const defaultConfig = { max_retries: 3, backoff_base: 2 };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH));
};

export const setConfig = (key, value) => {
  const config = getConfig();
  config[key] = value;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};
