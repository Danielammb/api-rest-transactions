import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { error } from "node:console";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

//Cookies - formas de manter contexto entre requisições

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const sessionId = request.cookies.sessionId;

      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select("*");
      return { transactions };
    }
  );

  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const sessionId = request.cookies.sessionId;
    const { id } = getTransactionParamsSchema.parse(request.params);

    const transaction = await knex("transactions")
      .where({ id, session_id: sessionId })
      .first();

    return {
      transaction,
    };
  });

  app.get(
    "/summary",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const sessionId = request.cookies.sessionId;
      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first();

      return { summary };
    }
  );

  app.post("/", async (request, reply) => {
    const createTransationBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransationBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
    }

    reply.cookie("sessionId", sessionId, { path: "/", maxAge: 60 * 60 }); //uma hora

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "debit" ? -amount : amount,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
