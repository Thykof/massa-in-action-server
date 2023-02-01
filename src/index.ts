import cors from 'cors';
import express, { Request, Response } from 'express';
import * as child from 'child_process';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

interface IMetaData {
  dependencies: string[];
}

interface IRunRequest {
  source: string;
  metadata: IMetaData;
}

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use(cors());

app.use('/pages', express.static('pages'));

app.get('/', (_, res) => res.send('🏠'));

app.all('/run', run);

app.listen(port, () => console.log('Running...'));

function run(req: Request<object, object, IRunRequest>, res: Response) {
  const source = req.body.source;
  const dependencies = req.body.metadata.dependencies;
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
  child.execSync(`cd ${projectName}`);
  dependencies.forEach((packageToInstall) => {
    child.execSync(`cd ${projectName} && npm install ${packageToInstall}`);
  });
  const minified =  source.replace(/^\s+|\s+$/g, '');
  fs.writeFileSync(`${projectName}/assembly/contracts/main.ts`, minified);
  fs.writeFileSync(`${projectName}/.env`, `
WALLET_PRIVATE_KEY='${process.env.WALLET_PRIVATE_KEY}'
JSON_RPC_URL_PUBLIC=http://127.0.0.1:33035
`);
  const output = child.execSync(`cd ${projectName} && npm run deploy`);
  res.send(output);
}
