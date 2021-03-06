
delete require.cache[require.resolve("../util/Util.js")];
let Util = require("../util/Util.js");
let util = new Util();
let mysql = require("mysql");
let pool = mysql.createPool({
    connectionLimit: 10,
    host: '120.24.235.91',
    user: 'root',
    password: 'Nuoyadb_1',
    database: 'test'
})

class HealthService {
    async test() {
       
    }

    getConnection() {
        return new Promise(function(resolve,reject) {
            pool.getConnection(function(err,connection){
                if(err) {
                    reject(err);
                }else{
                    resolve(connection);
                }
            });
        });
    }

    dao(connection, sql) {
        return new Promise(function(resolve,reject){
            connection.query(sql, function(error,results,fields) {
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            })
        });
    }

    getTables(cb) {
        pool.getConnection(function (err, connection) {

            connection.query("show tables", function (error, results, fields) {
                connection.release();
                cb(results);
                if (error) throw error;
            });

        });
    }

    listUser(query , cb) {
        pool.getConnection(function (err, connection) {
            let sql = "select * from user where 1=1";
            if(query.keywords) {
                sql += ` and name like '%${query.keywords}%' or phone like '%${query.keywords}%' `
            }

            if(query.gender) {
                sql += ` and gender = '${query.gender}'  `;
            }
            let countSql = sql;
            if(query.start!=undefined) {
                let limit = query.limit ? query.limit : 10;
                let start = (query.start - 1) * limit;
                sql += ` limit ${start} , ${limit}` ;
            }

            let resultObject = {};
            
            connection.query(countSql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    cb({code: 500 , errmsg : JSON.stringify(error)});
                }else{
                    resultObject.total = results.length;
                    connection.query(sql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            cb({code: 500 , errmsg : JSON.stringify(error)});
                        }else{
                            resultObject.list = results;
                            cb(resultObject);
                        }
                    });
                }
            });
        });
    }

    insertUser(user , cb) {
        if(!user.name || !user.age || !user.phone) {
            cb("数据库操作失败");
            return;
        }


        let sql = `
            insert into user(name,gender,age,phone) values ('${user.name}','${user.gender}','${user.age}','${user.phone}')
        `;

        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, results, fields) {
                connection.release();
                cb(results);
                if (error) throw error;
            });
        });
    }

    updateUser(user , cb) {
        if(!user.name || !user.age || !user.phone) {
            cb("数据库操作失败");
            return;
        }
        let sql = `
            update test set name='${user.name}',age='${user.age}',phone='${user.phone}' where id = '${user.id}'
        `;
        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, results, fields) {
                connection.release();
                cb(results);
                if (error) throw error;
            });
        });
    }

    deleteUser(user , cb) {
        let sql = `
            delete from  test where id = '${user.id}'
        `;
        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, results, fields) {
                connection.release();
                cb(results);
                if (error) throw error;
            });
        });
    }


    userInfo(obj,cb) {
        let user = {id : 1};
        let userSql = `select id,name,age,gender,phone from user where id = '${user.id}' `;
        let userProductSql = `
            select 
                uh.id , h.id product_id, h.name, h.price, h.description, h.expiryDate ,uh.buyDate
            from
                health_product h,
                user_health_product uh
            where 
                h.id = uh.product_id and
                uh.user_id = '${user.id}'

        `;
        let usreProductItemSql = `
                select 
                    uh.id , h.id hid, f.name ,  hf.times 
                from
                    health_product h,
                    user_health_product uh,
                    product_fee_item hf,
                    fee_item f
                where 
                    h.id = uh.product_id and
                    uh.user_id = '${user.id}' and 
                    h.id = hf.product_id and
                    f.id = hf.fee_item_id 

        `

        pool.getConnection(function (err, connection) {
            connection.query(userSql, function (error, results, fields) {
                let user = results[0];
                connection.query(userProductSql, function (error, results, fields) {
                    user.productList = results;
                    connection.query(usreProductItemSql, function (error, results, fields) {
                        connection.release();
                        for(let item of results) {
                            for(let product of user.productList) {
                                if(!product.itemList) {
                                    product.itemList = [];
                                }
                                if(item.id == product.id ){
                                    product.itemList.push(item);
                                }
                            }
                        }
                        cb(user);
                    });
                });
            });
        });

    }

    listHealthProduct(query , cb) {
        pool.getConnection(function (err, connection) {
            let sql = "select id, name , price , description , expiryDate from health_product where 1=1";
            if(query.keywords) {
                sql += ` and name like '%${query.keywords}%' or description like '%${query.keywords}%' `
            }
            let countSql = sql;
            if(query.start!=undefined) {
                let limit = query.limit ? query.limit : 10;
                let start = (query.start - 1) * limit;
                sql += ` limit ${start} , ${limit}` ;
            }

            let resultObject = {};
            
            connection.query(countSql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    cb({code: 500 , errmsg : JSON.stringify(error)});
                }else{
                    resultObject.total = results.length;
                    connection.query(sql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            cb({code: 500 , errmsg : JSON.stringify(error)});
                        }else{
                            resultObject.list = results;
                            cb(resultObject);
                        }
                    });
                }
            });
        });
    }

    async addHealthProduct(product,cb) {
        let addProductSql = `insert into health_product(name,price,description,expiryDate)
         values ('${product.name}','${product.price}','${product.description}','${product.expiryDate}')
        `;

        let con = await this.getConnection();
        let result = await this.dao(con , addProductSql).catch((err)=>{
            con.release();
            cb({code: 500 , errmsg : JSON.stringify(err)});
        });

        if(result){
            let id = result.insertId;
            let feeItems = product.feeItemList;
            let flag = true;
            for(let feeItem of feeItems) {
                let addFeeSql = `insert into product_fee_item values (${id},${feeItem.id},${feeItem.times})`;
                let res = await this.dao(con , addFeeSql).catch((err)=>{
                    con.release();
                    cb({code: 500 , errmsg : JSON.stringify(err)});
                    flag = false;
                });
            }
            if(flag) {
                con.release();
                cb({code: 0});
            }
        }
    }

    async editHealthProduct(product,cb) {
        let editProductSql = `update health_product
            set 
            name = '${product.name}' , price = '${product.price}', description = '${product.description}',expiryDate = '${product.expiryDate}'
            where id = ${product.id}
        `;
        let con = await this.getConnection();
        let result = await this.dao(con , editProductSql).catch((err)=>{
            con.release();
            cb({code: 500 , errmsg : JSON.stringify(err)});
        });
        if(result) {
            let deleteSql = `delete from product_fee_item where product_id = ${product.id}`;
            result = await this.dao(con , deleteSql).catch((err)=>{
                con.release();
                cb({code: 500 , errmsg : JSON.stringify(err)});
            });
        }
        if(result){
            let feeItems = product.feeItemList;
            let flag = true;
            for(let feeItem of feeItems) {
                let addFeeSql = `insert into product_fee_item values (${product.id},${feeItem.id},${feeItem.times})`;
                let res = await this.dao(con , addFeeSql).catch((err)=>{
                    con.release();
                    cb({code: 500 , errmsg : JSON.stringify(err)});
                    flag = false;
                });
            }
            if(flag) {
                con.release();
                cb({code: 0});
            }
        }
    }

    getHealthProduct(product,cb) {
        if(product.id == undefined) {
            cb("参数为空");
            return;
        }
        let productSql = `
                select h.id ,  h.name , h.price , h.description , h.expiryDate 
            from 
                health_product h
            where
                h.id = ${product.id}
        `;
        let itemSql = `
                select  f.name ,  hf.times 
            from 
                health_product h,
                product_fee_item hf,
                fee_item f
            where
                h.id = hf.product_id and
                f.id = hf.fee_item_id and
                h.id = ${product.id}
        `;
        pool.getConnection(function (err, connection) {
            connection.query(productSql, function (error, productInfo, fields) {
                connection.query(itemSql,function(error,results,fields) {
                    connection.release();
                    let product = productInfo[0];
                    product.itemList =  results;
                    cb(product);
                    if (error) throw error;
                });
            });
        });
    }

    buyHealthProduct(param,cb) {
        let now = util.getNow();
        console.log(param.product_id)
        let sql = `
            insert into user_health_product(user_id,product_id,buyDate) values (1,${param.product_id},'${now}');
        `;
        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, productInfo, fields) {
                connection.release();
                if (error) {
                    cb({code: 500 , errmsg : JSON.stringify(error)});
                }else{
                    cb({code: 0 });
                }
            });
        });
    }

    
    listFeeItem(query , cb) {
        pool.getConnection(function (err, connection) {
            let sql = "select * from fee_item where 1=1";
            let countSql = sql;
            if(query.start!=undefined) {
                let limit = query.limit ? query.limit : 10;
                let start = (query.start - 1) * limit;
                sql += ` limit ${start} , ${limit}` ;
            }

            let resultObject = {};
            
            connection.query(countSql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    cb({code: 500 , errmsg : JSON.stringify(error)});
                }else{
                    resultObject.total = results.length;
                    connection.query(sql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            cb({code: 500 , errmsg : JSON.stringify(error)});
                        }else{
                            resultObject.list = results;
                            cb(resultObject);
                        }
                    });
                }
            });
        });
    }

    addFeeItem(param,cb) {
        let sql = `
            insert into fee_item(name) values ('${param.name}');
        `;
        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, result, fields) {
                connection.release();
                if (error) {
                    cb({code: 500 , errmsg : JSON.stringify(error)});
                }else{
                    cb({code: 0 });
                }
            });
        });
    }

    async removeFeeItem(param,cb) {
        let con = await this.getConnection();
        let sql = `delete from fee_item where id=${param.id}`;
        let results = await this.dao(con,sql).catch((error)=>{
            con.release();
            cb({code: 500 , errmsg : JSON.stringify(error)});
        });
        con.release();
        cb({code: 0 });
    }



//  id bigint unsigned primary key auto_increment,
// name varchar(10),
    createTable(cb) {
        let sql = `
        create table user_health_product(
            id bigint primary key auto_increment,
            user_id bigint,
            product_id bigint,
            buyDate varchar(20)
        )
       `;

        pool.getConnection(function (err, connection) {
            connection.query(sql, function (error, results, fields) {
                connection.release();
                cb(results);
                if (error) throw error;
            });
        });

       
    }
}

module.exports = HealthService;