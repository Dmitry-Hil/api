import express, { Request, Response } from 'express';

const app = express();

app.get('/api/example', (req: Request, res: Response) => {
  const html = `
    <html>
      <head>
        <title>Example page</title>
      </head>
      <body>
        <h1>Example heading</h1>
        <p>This is an example page for the Express.js server</p>
      </body>
    </html>
  `;
  res.send(html);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});