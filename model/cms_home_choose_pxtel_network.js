const mongoose = require('mongoose')
const cms_home_choose_pxtel_network_Schema = new mongoose.Schema({
         Heading : {
               type : String
         },
         sub_Heading1 : {
               type : String,
         },
         sub_Description1 : {
             type : String
         },
         sub_Heading2 : {
               type : String,
         },
         sub_Description2 : {
             type : String
         },
         sub_Heading3 : {
            type : String,
      },
        sub_Description3 : {
          type : String
       },

       sub_Heading4 : {
        type : String,
         },
            sub_Description4 : {
            type : String
        },
      


} , {timestamps : true })

const cms_home_choose_pxtel_network_Model = mongoose.model('cms_home_choose_pxtel_network' , cms_home_choose_pxtel_network_Schema)

module.exports = cms_home_choose_pxtel_network_Model