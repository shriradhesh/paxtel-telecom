const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
     
        product_name : {
             type : String
        },
        category_id : {
               type : mongoose.Schema.Types.ObjectId,
               ref : 'category'
        },
        category_Name : {
            type : String
        },
      
        time : {
             type: String, 
             },

        price : {
              type: Number, 
               },
        speed : {
              type: String, 
               },
        number_of_sms : {
              type: String, 
               },
        data : {
              type : Number
        },
        limit : {
              type: Number, 
               },
        duration : { 
            type: String,
             enum: ['No Expiry', 'Daily', 'Monthly', 'Weekly', 'Yearly']
             },

}, { timestamps : true })

const productModel = mongoose.model('product', productSchema)
module.exports = productModel