import { exec } from 'child_process';
import path from 'path';

const formatFiles = () => {
  const prettierPath = path.resolve('./node_modules/.bin/prettier');
  
  exec(`${prettierPath} --write "src/**/*.{ts,tsx}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error formatting files:', error);
      process.exit(1);
    }
    if (stderr) {
      console.error('Stderr:', stderr);
      process.exit(1);
    }
    console.log('✨ Files formatted successfully');
    console.log(stdout);
  });
};

formatFiles(); 