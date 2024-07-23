const mongoose = require('mongoose')
const sim_Schema = new mongoose.Schema({

   
        ICCID: { 
            type: Number,
         },
         cellular_network_operator : {
            type : String,
            enum : ['MTN Uganda' , 'Airtel Uganda' , 'Lycamobile Uganda' , 'Uganda Telecom Limited' , 'Africell Uganda' , 'Smile Communications Uganda']
         },        
        user: {            
            user_name: { 
                type: String,
                },
            contactNumber: { 
                type: Number,
                 },
            user_email : {
                   type : String
            }
},
        planId : {
               type : mongoose.Schema.Types.ObjectId,
               ref : 'plan'
        },
        activationDate: {
            type: Date,
             },
       expiryDate: {
            type: Date,
             },

        status: { 
            type: String, 
            enum: ['active', 'inactive' , 'plan Expire'] ,
            default : 'active'
        }
  
} , {timestamps : true })

const sim_model = mongoose.model('sim', sim_Schema)

module.exports = sim_model

