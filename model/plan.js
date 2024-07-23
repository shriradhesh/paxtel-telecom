const mongoose = require('mongoose')
const planSchema = mongoose.Schema({
     
          plan_Name : {
             type : String
          },

          plan_Description : {
             type : String
          },
          plan_price : {
              type : Number
          },
          plan_type : {
                type : String,
                enum : ['Daily' , 'Monthly' , 'Yearly' , 'No Expiry' , 'Per Transaction']
          },
          status : {
             type : Number,
             enum : [ 0 , 1],
             default : 1
          },
          start_date : {
               type : Date
          },
          end_date : {
               type : Date
          }

} , { timestamps : true  })

const planModel = mongoose.model('plan' , planSchema)

module.exports = planModel