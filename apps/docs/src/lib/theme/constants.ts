import { resolve } from "node:path";
import { cwd } from "node:process";

export const SERVICE_WORKER_PATH = resolve(cwd(), "src/lib/theme/components/pwa/sw.js");
