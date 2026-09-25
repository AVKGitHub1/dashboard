import http from 'node:http';
import { runFirstBoot } from './bootstrap/firstBoot.js';
import { config } from './config.js';
import { createApp } from './app.js';

const { sessionSecret } = runFirstBoot();
const app = createApp({ sessionSecret });

http.createServer(app).listen(config.port, () => {
  console.log(`Dashboard listening on http://localhost:${config.port}`);
});
