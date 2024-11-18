import express, { Request, Response } from 'express';
import { CommentCreatePayload, IComment } from "./types";
import { readFile, writeFile } from "fs/promises";
import { checkCommentUniq, validateComment } from "./helpers";
import { v4 as uuidv4 } from 'uuid';

const app = express();

const jsonMiddleware = express.json();
app.use(jsonMiddleware);

const loadComments = async (): Promise<IComment[]> => {
  const rawData = await readFile("mock-comments.json", "binary");
  return JSON.parse(rawData.toString());
}


const saveComments = async (data: IComment[]): Promise<boolean> => {
  try {
    await writeFile("mock-comments.json", JSON.stringify(data));
    return false; //TODO: имитация возникновения ошибки
  } catch (e) {
    return false;
  }
}

const PATH = '/api/comments';

app.get(PATH, async (req: Request, res: Response) => {
  const comments = await loadComments();

  res.setHeader('Content-Type', 'application/json');
  res.send(comments);
});


app.get(`${PATH}/:id`, async (req: Request<{ id: string }>, res: Response) => {
  const comments = await loadComments();
  const id = req.params.id;

  const targetComment = comments.find(comment => id === comment.id.toString());

  if (!targetComment) {
    res.status(404);
    res.send(`Comment with id ${id} is not found`);
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(targetComment);
});

app.post(PATH, async (req: Request<{}, {}, CommentCreatePayload>, res: Response) => {
  const validationResult = validateComment(req.body);

  if (validationResult) {
    res.status(400);
    res.send(validationResult);
    return;
  }

  const comments = await loadComments();
  const isUniq = checkCommentUniq(req.body, comments);

  if (!isUniq) {
    res.status(422);
    res.send("Comment with the same fields already exists");
    return;
  }

  const id = uuidv4();
  comments.push({ ...req.body, id });

  const saved = await saveComments(comments);

  if (!saved) {
    res.status(500);
    res.send("Server error. Comment has not been created");
    return;
  }

  res.status(201);
  res.send(`Comment id:${id} has been added!`);
});

app.patch(PATH, async (req: Request<{}, {}, Partial<IComment>>, res: Response) => {
  const comments = await loadComments();

  const targetCommentIndex = comments.findIndex(({ id }) => req.body.id === id);

  if (targetCommentIndex > -1) {
    comments[targetCommentIndex] = { ...comments[targetCommentIndex], ...req.body }
    await saveComments(comments);

    res.status(200);
    res.send(comments[targetCommentIndex]);
    return;
  }

  const newComment = req.body as CommentCreatePayload;
  const validationResult = validateComment(newComment);

  if (validationResult) {
    res.status(400);
    res.send(validationResult);
    return;
  }

  const id = uuidv4();
  const commentToCreate = { ...newComment, id };
  comments.push(commentToCreate);
  await saveComments(comments);

  res.status(201);
  res.send(commentToCreate);
});

app.delete(`${PATH}/:id`, async (req: Request<{ id: string }>, res: Response) => {
  const comments = await loadComments();
  const id = req.params.id;

  let removedComment: IComment | null = null;

  const filteredComments = comments.filter((comment) => {
    if (id === comment.id.toString()) {
      removedComment = comment;
      return false;
    }

    return true;
  });

  if (removedComment) {
    await saveComments(filteredComments);
    res.status(200);
    res.send(removedComment);
    return;
  }

  res.status(404);
  res.send(`Comment with id ${id} is not found`);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});