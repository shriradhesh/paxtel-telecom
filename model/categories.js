const mongoose = require('mongoose')
const categorieSchema = new mongoose.Schema({
       category_Name : {
                type : String
       },
       status : {
            type : Number ,
            enum : [ 0 , 1 ],
            default : 1
       }
} , { timestamps : true })


const categorieModel = mongoose.model('categorie', categorieSchema)
module.exports = categorieModel