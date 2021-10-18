import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";


const main = async () => { 

  const server = new ApolloServer({ typeDefs, resolvers });

  const app = express();
  await server.start();
  server.applyMiddleware({ app });
  app.listen({ port: 4000 }, () =>
    console.log('Now browse to http://localhost:4000' + server.graphqlPath)
  );

};

main().catch((err) => {
  console.log(err);
});


