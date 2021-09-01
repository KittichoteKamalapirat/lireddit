import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "../types";
import { COOKIE_NAME, __prod__ } from "../constants";

// For argument
@InputType({ description: "Argument for register user" })
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field({ nullable: true })
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}
// For User
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users(): Promise<User[] | undefined> {
    return User.find();
  } // return a single user
  @Query(() => User)
  async user(@Arg("id") id: number): Promise<User | undefined> {
    return User.findOne(id);
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    //Destructure the parameter array to req
    if (!req.session.userId) {
      return null;
    }
    console.log(req.session);
    const user = await User.findOne(req.session.userId);
    console.log(user);
    return user;
  }
  @Mutation(() => UserResponse)
  async register(
    @Arg("data") data: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (data.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    if (data.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "Length must be greater than 2",
          },
        ],
      };
    }
    const hash = await argon2.hash(data.password);
    const newUser = User.create({
      username: data.username,
      password: hash,
    });
    try {
      await newUser.save();
    } catch (error) {
      if (error.code === "23505") {
        //|| error.detail.includes("already exists"))
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    // automatically logged in after register
    // set a cookie on the user
    req.session.userId = newUser.id;
    return { user: newUser };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("data") data: UsernamePasswordInput,
    @Ctx() { req, res }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ username: data.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "The username does not exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, data.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }
    req.session.userId = user.id;
    console.log(req.session);
    return { user: user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      //remove the session in redis`
      req.session.destroy((err) => {
        res.clearCookie("qid", {
          // maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
          httpOnly: true,
          sameSite: "lax",
          secure: __prod__,
          // domain: 'http://localhost:3000'
        });
        if (err) {
          // console.log(err);
          resolve(false);
          return;
          //return so it doesn't go on
        }
        // console.log(res.cookie);
        console.log("logged out");
        resolve(true);
      });
    });
  }
}
