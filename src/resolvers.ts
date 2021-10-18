import { create, getAll, getById } from "./utils";

export const  resolvers = {
  Query: {
    getUsers:(parent,args) => getAll(args),
    getUser:(parent,args) => getById(args),
    
  }
}
