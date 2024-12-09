import { env } from "./env";
import { app } from "./app";

app.listen({ port: env.PORT, , host: env.HOST }).then(() => {
  console.log(`Server listening `);
});
