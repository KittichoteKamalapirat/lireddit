import { ChakraProvider, ColorModeProvider } from "@chakra-ui/react";

import theme from "../theme";

import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import { cacheExchange, Cache, QueryInput } from "@urql/exchange-graphcache";
import React from "react";
import {
  LoginMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";

// helper function to cast a type that urql is not good at
function betterUpdateQuery<Result, Query>(
  cache: Cache,
  // Query input =  { query, variables } which is the query we'd like to write to the cache. A
  queryInput: QueryInput,
  result: any,
  // update function
  fn: (result: Result, q: Query) => Query
) {
  // Here is the key function
  // update Query!
  return cache.updateQuery(
    // queryInput is the query we'd like to cache, 2nd argument
    queryInput,
    // Next is the updater function, 4th argument
    (data) => fn(result, data as any) as any
  );
}

// urql
const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include",
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          //login match the resolver function name
          login: (_result, args, cache, info) => {
            // cache.updateQuery({ query: MeDocument}, ( MeQuery) => {})
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,

              // MeDocument is just query asking for usergql`
              // query Me {
              //   me {
              //     ...RegularUser
              //   }
              // }
              { query: MeDocument },
              _result,
              (result, query) => {
                // updater function
                // query = MeQuery

                // if the result is error
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },

          register: (_result, args, cache, info) => {
            // cache.updateQuery({ query: MeDocument}, ( MeQuery) => {})
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    fetchExchange,
  ],
});
function MyApp({ Component, pageProps }: any) {
  return (
    <Provider value={client}>
      <ChakraProvider resetCSS theme={theme}>
        <ColorModeProvider
          options={{
            useSystemColorMode: true,
          }}
        >
          <Component {...pageProps} />
        </ColorModeProvider>
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
