import { Database } from "./db";
import { mySQLConnector } from "./db/connector";

export const getAll = async (args) =>{
  const db = new Database(args.datatable);  
  const res = await db.findAll({limit:100})
  return res;
}

export const getById = async (args) =>{
  const db = new Database(args.datatable);  
  const res:any = await db.find({id:args.id});
  return res[0];
}

export const create = async (args) => {
    const db = new Database(args.datatable);
    const res: any = await db.insert(mySQLConnector,args.data);
    return res[0];
}