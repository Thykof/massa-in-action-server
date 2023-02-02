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
  name: string;
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
  const dependencies = getDependencies(req.body.name);
  const timestamp = Date.now();
  const projectName = `projects/project-${timestamp}`;
  if (!fs.existsSync('projects')) {
    fs.mkdirSync('projects');
  }
  if (!fs.existsSync(projectName)) {
    child.execSync(
      `npx @massalabs/sc-project-initializer@dev init ${projectName}`,
    );
  }
  dependencies.forEach((packageToInstall) => {
    child.execSync(`cd ${projectName} && npm install ${packageToInstall}`);
  });
  const minified = source.replace(/^\s+|\s+$/g, '');
  fs.writeFileSync(`${projectName}/assembly/contracts/main.ts`, minified);
  fs.copyFileSync('.env', `${projectName}/.env`);
  child.exec(`cd ${projectName} && npm run deploy`, (_, stdout, __) => {
    res.send(stdout);
  });
}

function getDependencies(name: string): Array<string> {
  const content = fs.readFileSync(`pages/${name}/metadata.json`).toString();
  const metadata = JSON.parse(content) as IMetaData;
  return metadata.dependencies;
}
