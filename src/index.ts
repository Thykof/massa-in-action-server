import cors from 'cors';
import express, { Request, Response } from 'express';
import * as child from 'child_process';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use(cors());

app.get('/', (_, res) => res.send('🏠'));

app.all('/run', run);

app.listen(port, () => console.log('Running...'));

function run(req: Request, res: Response) {
  const source = req.body.source;
  const timestamp = Date.now();
  // const projectName = `projects/project-${timestamp}`;
  const projectName = 'projects/project-1675246741617';
  if (!fs.existsSync('projects')) {
    fs.mkdirSync('projects');
  }
  if (!fs.existsSync(projectName)) {
    child.execSync(
      `npx @massalabs/sc-project-initializer@dev init ${projectName}`
    );
  }
  const minified =  source.replace(/^\s+|\s+$/g, '');
  fs.writeFileSync(`${projectName}/assembly/contracts/main.ts`, minified);
  fs.writeFileSync(`${projectName}/.env`, `
WALLET_PRIVATE_KEY='${process.env.WALLET_PRIVATE_KEY}'
JSON_RPC_URL_PUBLIC=http://127.0.0.1:33035
`);
  const output = child.execSync(`cd ${projectName} && npm run deploy`);
  res.send(output);
}
