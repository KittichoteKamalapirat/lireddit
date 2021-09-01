import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useMeQuery } from "../generated/graphql";

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  // data is loading
  if (fetching) {
  } else if (!data?.me) {
    // this can return undefined, then ! turn it to true
    // user not logged in
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={2}>
            Login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white">Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button variant={"link"}>logout</Button>
      </Flex>

      // no need ? because it is implied that it exsists, put the ifs befire
    );
  }
  return (
    <Flex bg="tan" p={2} ml={"auto"}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
