import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { app } from "../src/app";
import { execSync } from "node:child_process";
import request from "supertest";

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  execSync("npm run knex migrate:rollback --all");
  execSync("npm run knex migrate:latest");
});

describe("transactions routes", () => {
  test("user can create a new transaction", async () => {
    const response = await request(app.server).post("/transactions").send({
      title: "Exemplo",
      amount: 100,
      type: "credit",
    });

    expect(response.status).toBe(201);
  });

  test("user can list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Exemplo",
        amount: 100,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionResponse.body).toEqual({
      transactions: [
        expect.objectContaining({ title: "Exemplo", amount: 100 }),
      ],
    });
  });

  test("user shoulb be able to get a specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Exemplo",
        amount: 100,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = listTransactionResponse.body.transactions[0].id;

    const specificTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(specificTransactionResponse.body).toEqual({
      transaction: expect.objectContaining({ title: "Exemplo", amount: 100 }),
    });
  });

  test("user shoulb be able to get summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Exemplo",
        amount: 100,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .send({
        title: "Exemplo 2",
        amount: 100,
        type: "debit",
      })
      .set("Cookie", cookies);

    const summaryTransactionResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryTransactionResponse.body).toEqual({
      summary: {
        amount: 0,
      },
    });
  });
});
