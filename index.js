const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const app = express();
app.use(cors());

const schema = gql`
  input QueryInput {
    datatable: String!
    id:ID
    columns: [String]
    data:String
  }

  type GenericResponse {
    data:String
  }

  input SignupInfo {
    name:String!
    email:String!
    mobile:String!
    password:String!    
  }

  input LoginInput {
    email:String!
    password:String!    
  }

  type UserInfo {
    token:String!
    id:String!
    name:String!
    email:String!
    mobile:String!
    message:String
  }

  type Query {
    getData(queryInput:QueryInput):GenericResponse
    getDataById(queryInput:QueryInput):GenericResponse
  }
  type Mutation {
    createData(queryInput:QueryInput):GenericResponse
    updateData(queryInput:QueryInput):GenericResponse
    deleteData(queryInput:QueryInput):GenericResponse
    register(queryInput:SignupInfo):GenericResponse
    login(queryInput:LoginInput):UserInfo
  }
`;

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
  console.log("sql: ",sql);
  console.log("args: ",args);

    req.mysqlDb.query(sql, args, (err, rows) => {
        if (err){
          return reject(err);
        }
        req.mysqlDb.end();
        rows.changedRows || rows.affectedRows || rows.insertId ? resolve(rows) : resolve(rows);
    });
});

const resolvers = {
  Query: {
    getData,
    getDataById,
  },
  Mutation:{
    createData,
    updateData,
    deleteData,
    register,
    login
  }
};


async function login(args,req){
  const {email, password} = req.queryInput;
  const newReq = {
    ...req,
    datatable:'users',
    columns: ['id'],
    email
  }
  const userRes = await getUserByEmail(args,newReq);
  const user = JSON.parse(userRes.data);
  if(user?.length === 0){
    return {message:"Auth Failed !!"};
  }
  const isPasswordCorrect = await bcrypt.compareSync(password, user[0].password);;
  if(isPasswordCorrect){
    const UserInfo = new UserInformation(user[0]);
    return UserInfo;
  }else {
    return {message:"Auth Failed !!"};
  }
}


async function register(args,req){

  const {name, email, mobile, password} = req.queryInput;
  const newReq = {
    ...req,
    datatable:'users',
    columns: ['id'],
    email
  }
  const userRes = await getUserByEmail(args,newReq);
  const user = JSON.parse(userRes.data);
  if(user?.length){
    return {data:"user already exsist"};
  }
  const hash = bcrypt.hashSync(password, 12);
  const obj = {name, email, mobile, password:hash};
  const query = `insert into users SET ?`
  dbConnection(req);
  const res = await queryDB(req, query, obj).then(data => data);
  return {data:"User Created"};
}

async function getUserByEmail(args,req){
  const {columns , datatable ,email} = req;
  dbConnection(req);
  const query = `SELECT * FROM ${datatable} where email = ?;`
  const res = await queryDB(req, query,[email]).then(data => data);
  const response = [];
    for(row of res){
        const obj = new Response(row);
        response.push(obj);
    }
    return {data:JSON.stringify(response)}
}

async function getData(args,req){
  const {columns , datatable } = req.queryInput;
  const query = `SELECT ${columns.toString()} FROM ${datatable};`
  dbConnection(req);
  const res = await queryDB(req, query).then(data => data);
  const response = [];
    for(row of res){
        const obj = new Response(row);
        response.push(obj);
    }
    return {data:JSON.stringify(response)}
}
async function getDataById(args,req){
  const {columns , datatable ,id, data} = req.queryInput;
  dbConnection(req);
  const query = `SELECT ${columns.toString()} FROM ${datatable} where id = ?;`
  const res = await queryDB(req, query,[id]).then(data => data);
  const response = [];
    for(row of res){
        const obj = new Response(row);
        response.push(obj);
    }
    return {data:JSON.stringify(response)}
}
async function updateData(args,req){
  const {columns , datatable ,id, data} = req.queryInput;
  const obj = JSON.parse(data);
  dbConnection(req);
  const query = `update ${datatable} SET ? where id = ?`
  const res = await queryDB(req, query, [obj, id]).then(data => data);
  return {data:JSON.stringify(obj)};
}
async function createData(args,req){
  const {columns , datatable ,id, data} = req.queryInput;
  const obj = JSON.parse(data);
  dbConnection(req);
  const query = `insert into ${datatable} SET ?`
  const res = await queryDB(req, query, obj).then(data => data);
  return {data:JSON.stringify(res)};
}
async function deleteData (args,req){
  const {datatable ,id,} = req.queryInput;
  dbConnection(req);
  const query = `delete from ${datatable} where id = ?;`
  const res = await queryDB(req, query,[id]).then(data => data);
  return {data:"Record deleted"}
}

function dbConnection(req){
  req.mysqlDb = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'graphqlcrud'
  });
  req.mysqlDb.connect();
}

const server = new ApolloServer({ 
     typeDefs:schema, resolvers
 });
server.applyMiddleware({ app, path:"/" });
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>{
    console.log(`server liistining on ${PORT}/graphql`)
});


class Response {
  constructor(obj){
    for(let key in obj){
      this[key] = obj[key];
    }
  }
}

class UserInformation {
  constructor(obj){
    this.token = jwt.sign({
      email: obj.email,
      userId: obj.id
    }, "secret", { expiresIn: "12h" });

    this.id = obj.id;
    this.name = obj.name;
    this.email = obj.email;
    this.mobile = obj.mobile;
  }
}