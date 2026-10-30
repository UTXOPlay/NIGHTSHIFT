import {randomBytes} from 'node:crypto';
import {startNightshift14} from '../host/nightshift14.mjs';
startNightshift14({env:{...process.env,WEB_PORT:'18940',RUNTIME_PORT:'18941',GAME_ORIGIN:'http://127.0.0.1:18940',RUNTIME_TOKEN:process.env.RUNTIME_TOKEN||randomBytes(32).toString('hex'),DATA_DIR:process.env.DRIFT_DATA_DIR||'artifacts/rivals-v14/browser-data'}});
