"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSettings = loadSettings;
exports.getSettings = getSettings;
exports.clearSettingsCache = clearSettingsCache;
exports.findConfig = findConfig;
exports.findSecrets = findSecrets;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = require("yaml");
const CONFIG_FILENAMES = ['mcp-agent.config.yaml', 'mcp_agent.config.yaml'];
const SECRETS_FILENAMES = ['mcp-agent.secrets.yaml', 'mcp_agent.secrets.yaml'];
function findUp(filenames) {
    let dir = process.cwd();
    // Walk up until root
    while (true) {
        for (const name of filenames) {
            const filePath = path_1.default.join(dir, name);
            if (fs_1.default.existsSync(filePath)) {
                return filePath;
            }
        }
        const parent = path_1.default.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return null;
}
function deepMerge(base, update) {
    if (update == null || typeof update !== 'object') {
        return base;
    }
    const result = Array.isArray(base) ? [...base] : { ...base };
    for (const [key, value] of Object.entries(update)) {
        if (value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            typeof result[key] === 'object' &&
            !Array.isArray(result[key])) {
            result[key] = deepMerge(result[key], value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
let cachedSettings = null;
function loadSettings(configPath) {
    let merged = {};
    const configFile = configPath ?? findUp(CONFIG_FILENAMES);
    if (configFile && fs_1.default.existsSync(configFile)) {
        const configData = (0, yaml_1.parse)(fs_1.default.readFileSync(configFile, 'utf8')) || {};
        merged = deepMerge(merged, configData);
        const configDir = path_1.default.dirname(configFile);
        let secretsFile = null;
        for (const name of SECRETS_FILENAMES) {
            const candidate = path_1.default.join(configDir, name);
            if (fs_1.default.existsSync(candidate)) {
                secretsFile = candidate;
                break;
            }
        }
        if (!secretsFile) {
            secretsFile = findUp(SECRETS_FILENAMES);
        }
        if (secretsFile && fs_1.default.existsSync(secretsFile)) {
            const secretsData = (0, yaml_1.parse)(fs_1.default.readFileSync(secretsFile, 'utf8')) || {};
            merged = deepMerge(merged, secretsData);
        }
    }
    return merged;
}
function getSettings(configPath) {
    if (!cachedSettings) {
        cachedSettings = loadSettings(configPath);
    }
    return cachedSettings;
}
function clearSettingsCache() {
    cachedSettings = null;
}
function findConfig() {
    return findUp(CONFIG_FILENAMES);
}
function findSecrets() {
    return findUp(SECRETS_FILENAMES);
}
