const mongoose = require("mongoose")
const adminSchema = new mongoose.Schema({

         name : {
             type : String
         },
         email : {
             type: String
         },
         password : {
             type : String
         },
         profileImage : {
             type : String
         },
         status : {
            type : Number,
            enum : [ 0 , 1],
            default : 1
         },

}, { timestamps : true })


const adminModel = mongoose.model('admin', adminSchema)
module.exports = adminModel