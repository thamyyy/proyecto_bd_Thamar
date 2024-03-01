import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import dotenv from "dotenv";
import "es6-shim";
import express, { Express, Request, Response } from "express";
import { Pool } from "pg";
import "reflect-metadata";
import { Board } from "./dto/board.dto";
import { User } from "./dto/user.dto";
import { List } from "./dto/list.dto";
import { Card } from "./dto/card.dto";
import { Card_User } from "./dto/card_users.dto";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: +process.env.DB_PORT!,
});

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/users", async (req: Request, res: Response) => {
  try {
    const text = "SELECT id, name, email FROM users";
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/users", async (req: Request, res: Response) => {
  let userDto: User = plainToClass(User, req.body);
  try {
    await validateOrReject(userDto);

    const text = "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *";
    const values = [userDto.name, userDto.email];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (errors) {
    return res.status(422).json(errors);
  }
});

app.get("/boards", async (req: Request, res: Response) => {
  try {
    const text =
      'SELECT b.id, b.name, bu.userId "adminUserId" FROM boards b JOIN board_users bu ON bu.boardId = b.id WHERE bu.isAdmin IS true';
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/boards", async (req: Request, res: Response) => {
  let boardDto: Board = plainToClass(Board, req.body);
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    await validateOrReject(boardDto, {});

    const boardText = "INSERT INTO boards(name) VALUES($1) RETURNING *";
    const boardValues = [boardDto.name];
    const boardResult = await client.query(boardText, boardValues);

    const boardUserText =
      "INSERT INTO board_users(boardId, userId, isAdmin) VALUES($1, $2, $3)";
    const boardUserValues = [
      boardResult.rows[0].id,
      boardDto.adminUserId,
      true,
    ];
    await client.query(boardUserText, boardUserValues);

    client.query("COMMIT");
    res.status(201).json(boardResult.rows[0]);
  } catch (errors) {
    client.query("ROLLBACK");
    return res.status(422).json(errors);
  } finally {
    client.release();
  }
});

app.get("/boards/lists", async (req: Request, res: Response) => {
  try {
    const value = [req.body.boardId];
    const text = "SELECT id, name FROM lists WHERE boardId = $1";
    const result = await pool.query(text, value);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/boards/lists", async (req: Request, res: Response) => {
  let listDto: List = plainToClass(List, req.body);
  try {
    await validateOrReject(listDto);

    const text = "INSERT INTO lists(name, boardId) VALUES($1, $2) RETURNING *";
    const values = [listDto.name, listDto.boardId];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (errors) {
    console.log(errors)
    res.status(422).json(errors);
  }
});

app.post("/boards/lists/cards", async (req: Request, res: Response) => {
  let cardDto: Card = plainToClass(Card, req.body);
  let client = await pool.connect();
  try {
    client.query("BEGIN");
    await validateOrReject(cardDto, {});

    const cardText =
      "INSERT INTO cards(title, description, date_exp, list_id) VALUES($1, $2, $3, $4) RETURNING *";
    const date = new Date(cardDto.date_exp);
    const cardValues = [
      cardDto.title,
      cardDto.description,
      date,
      cardDto.list_id,
    ];
    const cardResult = await client.query(cardText, cardValues);

    const cardUserText =
      "INSERT INTO cards_users(isOwner, cardId, userId) VALUES($1, $2, $3)";
    const cardUserValues = [false, cardResult.rows[0].id, cardDto.user_Id];
    await client.query(cardUserText, cardUserValues);

    client.query("COMMIT");
    res.status(201).json(cardResult.rows[0]);
  } catch (errors) {
    client.query("ROLLBACK");
    console.log(errors);
    return res.status(422).json(errors);
  } finally {
    client.release();
  }
});

app.post("/boards/lists/cards_users", async (req: Request, res: Response) => {
  let cards_usersDto: Card_User = plainToClass(Card_User, req.body);
  try {
    await validateOrReject(cards_usersDto);

    const text = "INSERT INTO card_users(isOwner, cardId, userId) VALUES($1, $2, $3)";
    const values = [false, cards_usersDto.cardId, cards_usersDto.userId];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (errors) {
    console.log(errors)
    res.status(422).json(errors);
  }
});

app.get("/boards/lists/cards", async (req: Request, res: Response) => {
  try {
    const value = [req.body.listId];
    const text =
      'SELECT c.id, c.title, c.description, c.date_exp, u.name "Owner" FROM cards c JOIN cards_users cu ON c.id = cu.cardid JOIN users u ON cu.userid = u.id WHERE c.listId = $1';
    const result = await pool.query(text, value);
    res.status(200).json(result.rows);
  } catch (errors) {
    res.status(422).json(errors);
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
