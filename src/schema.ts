import { gql } from "apollo-server-express";

export const typeDefs = gql`
type User {
  id: ID
  firstName: String
  lastName: String
  userName: String
  mobileNo:String
}

type Query {
  getUsers(datatable:String): [User]
  getUser(datatable:String, id:String):User
}
`

