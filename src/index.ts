import express, { Express, Request, Response } from "express";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "udo_postgres",
  password: "1234",
  port: 5433,
});

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", async (req: Request, res: Response) => {
  const result = await pool.query("SELECT NOW() as now");
  res.send(result.rows);
  // res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
