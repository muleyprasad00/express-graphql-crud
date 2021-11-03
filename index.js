const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql');
const cors = require('cors')

const app = express();
app.use(cors())

const schema = buildSchema(`
  input QueryInput {
    datatable: String!
    id:ID
    columns: [String]
    data:String
  }

  type GenericResponse {
    data:String
  }
  type Query {
    getData(queryInput:QueryInput):GenericResponse
    getDataById(queryInput:QueryInput):GenericResponse
  }
  type Mutation {
    createData(queryInput:QueryInput):GenericResponse
    updateData(queryInput:QueryInput):GenericResponse
    deleteData(queryInput:QueryInput):GenericResponse
  }
`);

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

const root = { 
  getData:(args,req) => getData(args,req),
  getDataById:(args,req) => getDataById(args,req),
  createData:(args,req) => createData(args,req),
  updateData:(args,req) => updateData(args,req),
  deleteData:(args,req) => deleteData(args,req)
};

async function getData(args,req){
  const {columns , datatable } = args.queryInput;
  const query = `SELECT ${columns.toString()} FROM ${datatable};`
  const res = await queryDB(req, query).then(data => data);
  const response = {};
    columns.forEach(col => {
      response[col] = []
    });
    res.forEach(element => {
      for(let item in element){
        response[item].push(element[item])
      }
    });
    return {data:JSON.stringify(response)}
}
async function getDataById(args,req){
  const {columns , datatable ,id, data} = args.queryInput;
  const query = `SELECT ${columns.toString()} FROM ${datatable} where id = ?;`
  const res = await queryDB(req, query,[id]).then(data => data);
  const response = {};
  columns.forEach(col => {
    response[col] = []
  });
  res.forEach(element => {
    for(let item in element){
      response[item].push(element[item])
    }
  });
  return {data:JSON.stringify(response)}
}
async function updateData(args,req){
  const {columns , datatable ,id, data} = args.queryInput;
  const obj = JSON.parse(data);
  const query = `update ${datatable} SET ? where id = ?`
  const res = await queryDB(req, query, [obj, id]).then(data => data);
  return {data:JSON.stringify(obj)};
}
async function createData(args,req){
  const {columns , datatable ,id, data} = args.queryInput;
  const obj = JSON.parse(data);
  const query = `insert into ${datatable} SET ?`
  const res = await queryDB(req, query, obj).then(data => data);
  return {data:JSON.stringify(res)};
}
async function deleteData (args,req){
  const {datatable ,id,} = args.queryInput;
  const query = `delete from ${datatable} where id = ?;`
  const res = await queryDB(req, query,[id]).then(data => data);
  return {data:"Record deleted"}
}


//db config
app.use((req, res, next) => {
  req.mysqlDb = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'graphqlcrud'
  });
  req.mysqlDb.connect();
  console.log("DB connected !!!")
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>{
    console.log(`server liistining on ${PORT}/graphql`)
})